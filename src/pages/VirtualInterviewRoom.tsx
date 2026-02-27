import { useState, useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Mic, MicOff, PhoneOff, Video, VideoOff, Settings } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { SimliClient, generateSimliSessionToken, generateIceServers } from "simli-client";

// The user provided API key for Simli
const SIMLI_API_KEY = "ovk8hzmy5mjdgdmnmtwexm";

interface Persona {
  name: string;
  desc: string;
  id: string;
  avatarUrl: string; // URL for stock video
  simliFaceId: string; // The 3D Avatar Face ID
  voiceParams: { pitch: number; rate: number; voiceURI?: string };
}

export default function VirtualInterviewRoom() {
  const location = useLocation();
  const navigate = useNavigate();
  // Expecting selectedPersonas to be passed via router state
  const selectedPersonas: Persona[] = location.state?.selectedPersonas || [];

  const [activeSpeakerId, setActiveSpeakerId] = useState<string | null>(null);
  const [micActive, setMicActive] = useState(false);
  const [camActive, setCamActive] = useState(true);

  // Chat History & Speech
  const [history, setHistory] = useState<{ role: string, content: string }[]>([]);
  const [transcript, setTranscript] = useState("");
  const [isAiThinking, setIsAiThinking] = useState(false);

  const recognitionRef = useRef<any>(null);

  // Simli Clients map: { personaId: SimliClient }
  const simliClientsRef = useRef<Record<string, SimliClient>>({});
  const videoRefs = useRef<Record<string, HTMLVideoElement | null>>({});
  const audioRefs = useRef<Record<string, HTMLAudioElement | null>>({});

  // Fallback if no personas selected
  useEffect(() => {
    if (selectedPersonas.length === 0) {
      navigate('/dashboard');
    }
  }, [selectedPersonas, navigate]);

  // Initialize Simli Clients for each persona
  useEffect(() => {
    if (selectedPersonas.length === 0) return;

    let isMounted = true;

    const initClients = async () => {
      try {
        const iceServers = await generateIceServers(SIMLI_API_KEY);

        for (const persona of selectedPersonas) {
          if (!isMounted) break;

          const sessionReq = {
            faceId: persona.simliFaceId || "tmp9c84fa1b-d1ec-4c17-9005-ed9c68097d2d",
            handleSilence: true,
            maxSessionLength: 3600,
            maxIdleTime: 3600,
          };

          const tokenResponse = await generateSimliSessionToken({
            config: sessionReq,
            apiKey: SIMLI_API_KEY
          });

          // Constructor signature: session_token, video, audio, iceServers, ...
          const client = new SimliClient(
            tokenResponse.session_token,
            videoRefs.current[persona.id]!,
            audioRefs.current[persona.id]!,
            iceServers
          );

          client.on("start", () => {
            console.log(`SimliClient started for ${persona.name}`);
          });

          client.on("stop", () => {
            console.log(`SimliClient stopped from ${persona.name}`);
          });

          await client.start();
          if (isMounted) {
            simliClientsRef.current[persona.id] = client;
          } else {
            client.stop();
          }
        }
      } catch (err) {
        console.error("Failed to init Simli clients:", err);
      }
    };

    initClients();

    return () => {
      isMounted = false;
      // Cleanup
      Object.values(simliClientsRef.current).forEach(client => {
        client.stop();
      });
    };
  }, [selectedPersonas]);

  // Initialize Speech Recognition
  useEffect(() => {
    if (!('webkitSpeechRecognition' in window)) return;
    const SpeechRecognition = (window as any).webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onresult = (event: any) => {
      let currentTranscript = '';
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        currentTranscript += event.results[i][0].transcript;
      }
      setTranscript(currentTranscript);
    };

    recognition.onend = () => {
      // If mic is still supposed to be active (e.g., user paused), auto-restart
      if (micActive && !activeSpeakerId && !isAiThinking) {
        try { recognition.start(); } catch (e) {}
      }
    };

    recognitionRef.current = recognition;

    return () => {
      recognition.stop();
    };
  }, [micActive, activeSpeakerId, isAiThinking]);

  // Toggle Mic
  useEffect(() => {
    if (!recognitionRef.current) return;
    if (micActive && !activeSpeakerId && !isAiThinking) {
      try { recognitionRef.current.start(); } catch (e) {}
    } else {
      recognitionRef.current.stop();
    }
  }, [micActive, activeSpeakerId, isAiThinking]);

  // The Core AI Conversation Loop
  const submitUserResponse = async () => {
    if (!transcript.trim()) return;

    const userMessage = transcript.trim();
    setTranscript("");
    setHistory(prev => [...prev, { role: 'user', content: userMessage }]);
    setIsAiThinking(true);
    setMicActive(false); // Pause mic while AI thinks/speaks

    try {
      const res = await fetch('http://localhost:3001/api/agents/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMessage,
          history,
          personas: selectedPersonas // Pass the panel array
        })
      });

      const data = await res.json();
      
      const aiResponse = data.content;
      const speakerName = data.speaker; // The LLM specifies who is speaking
      
      setHistory(prev => [...prev, { role: 'ai', content: aiResponse }]);
      
      // Find which avatar matches the speaker name
      const speakingAvatar = selectedPersonas.find(p => p.name === speakerName) || selectedPersonas[0];
      
      await speakAiResponse(aiResponse, speakingAvatar);

    } catch (err) {
      console.error("AI chat error:", err);
      setIsAiThinking(false);
      setMicActive(true);
    }
  };

  // Function to convert text to audio bytes (using ElevenLabs or OpenAI TTS API ideally, 
  // but for hackathon we will use a browser trick or directly use Simli's built-in textToAudio if available.
  // Since Simli SDK expects PCM16 audio data via `sendAudioData`, we will use the OpenAI TTS endpoint proxy in our server).
  const speakAiResponse = async (text: string, avatar: Persona) => {
    setActiveSpeakerId(avatar.id);
    
    try {
      // 1. Get Audio Data from our server's TTS proxy (assuming we add one, or we use browser TTS as a fallback string-to-buffer)
      // For immediate hackathon WebRTC visual sync, the easiest is to ask the server to generate OpenAI TTS bytes.
      const ttsRes = await fetch('http://localhost:3001/api/agents/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, voice: avatar.id === 'p1' ? 'onyx' : 'nova' })
      });
      
      if (!ttsRes.ok) throw new Error("TTS failed");
      
      const audioBlob = await ttsRes.blob();
      const arrayBuffer = await audioBlob.arrayBuffer();
      const audioContext = new window.AudioContext();
      const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
      
      // Convert Float32Array to Int16Array PCM
      const channelData = audioBuffer.getChannelData(0);
      const pcm16 = new Int16Array(channelData.length);
      for (let i = 0; i < channelData.length; i++) {
        const s = Math.max(-1, Math.min(1, channelData[i]));
        pcm16[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
      }
      
      const client = simliClientsRef.current[avatar.id];
      if (client) {
        // Send PCM16 data to Simli Client (it expects Uint8Array of PCM16)
        client.sendAudioData(new Uint8Array(pcm16.buffer));
      }

      // Estimate audio duration to re-enable mic
      const durationMs = audioBuffer.duration * 1000;
      setTimeout(() => {
        setActiveSpeakerId(null);
        setIsAiThinking(false);
        setMicActive(true); // Re-enable mic for user
      }, durationMs + 500);

    } catch (e) {
      console.error("Simli TTS Audio Sync failed fallback", e);
      // Fallback to basic browser TTS if no audio bytes
      setIsAiThinking(false);
      setMicActive(true);
    }
  };

  // Start interview automatically by sending an empty string or standard "Hello" to boot
  useEffect(() => {
    if (selectedPersonas.length > 0 && history.length === 0 && !isAiThinking) {
      setIsAiThinking(true);
      fetch('http://localhost:3001/api/agents/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: "The candidate has just entered the virtual room. Introduce yourselves quickly and ask the first behavioral question.",
          history: [],
          personas: selectedPersonas
        })
      })
      .then(res => res.json())
      .then(data => {
        setHistory([{ role: 'ai', content: data.content }]);
        const avatar = selectedPersonas.find(p => p.name === data.speaker) || selectedPersonas[0];
        speakAiResponse(data.content, avatar);
      })
      .catch(err => {
        console.error("Failed to start", err);
        setIsAiThinking(false);
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleEndInterview = () => {
    Object.values(simliClientsRef.current).forEach(c => c.stop());
    if (recognitionRef.current) recognitionRef.current.stop();
    // Navigate to report processing or dashboard
    navigate('/report');
  };

  return (
    <div className="min-h-screen bg-slate-900 text-white overflow-hidden relative font-sans">
      {/* Background Ambient Glow */}
      <div className="absolute inset-0 z-0">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-600/20 rounded-full blur-[120px]" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-600/20 rounded-full blur-[120px]" />
      </div>

      {/* Main Content */}
      <div className="relative z-10 h-screen flex flex-col p-6">
        {/* Header */}
        <header className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-2 bg-white/10 px-4 py-2 rounded-full backdrop-blur-md border border-white/10">
            <div className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" />
            <span className="text-sm font-semibold tracking-wider">REC</span>
            <span className="text-xs text-slate-400 ml-2">Panel Session</span>
          </div>
          <button className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors">
            <Settings className="w-5 h-5 text-slate-300" />
          </button>
        </header>

        {/* Avatars Grid */}
        <div className={`flex-1 grid gap-6 mb-8 ${selectedPersonas.length === 1 ? 'grid-cols-1 max-w-4xl mx-auto w-full' : 'grid-cols-2 max-w-6xl mx-auto w-full'}`}>
          {selectedPersonas.map((persona) => (
            <motion.div 
              key={persona.id}
              className={`relative rounded-3xl overflow-hidden bg-slate-800 border-2 transition-colors duration-500 ${activeSpeakerId === persona.id ? 'border-blue-500 shadow-[0_0_30px_rgba(59,130,246,0.3)]' : 'border-slate-700/50'}`}
              layout
            >
              {/* Simli WebRTC Video & Audio streams */}
              <div className="absolute inset-0 flex items-center justify-center bg-slate-800 text-slate-500 text-xs font-bold animate-pulse">
                Initializing 3D Stream...
              </div>
              <video 
                ref={(el) => { videoRefs.current[persona.id] = el; }}
                autoPlay 
                playsInline 
                muted // Video is visually muted, Audio element handles sound
                className="absolute inset-0 w-full h-full object-cover z-10"
              />
              <audio 
                ref={(el) => { audioRefs.current[persona.id] = el; }}
                autoPlay 
              />
              
              {/* Speaker Overlay */}
              <div className="absolute bottom-6 left-6 flex items-center gap-3 bg-black/50 backdrop-blur-md px-4 py-2 rounded-2xl border border-white/10">
                <div className="flex items-end gap-1 h-4">
                  {[1, 2, 3].map((bar) => (
                    <motion.div 
                      key={bar}
                      className={`w-1 bg-blue-400 rounded-full ${activeSpeakerId === persona.id ? '' : 'h-1'}`}
                      animate={activeSpeakerId === persona.id ? {
                        height: ["20%", "80%", "40%", "100%", "30%"]
                      } : { height: "20%" }}
                      transition={{
                        repeat: Infinity,
                        duration: 0.8,
                        delay: bar * 0.1,
                        ease: "easeInOut"
                      }}
                    />
                  ))}
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white leading-tight">{persona.name}</h3>
                  <p className="text-[10px] text-slate-300 font-semibold">{persona.desc}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* User Self-View & Controls */}
        <div className="h-24 flex items-center justify-between px-8 bg-slate-800/50 backdrop-blur-xl border border-white/10 rounded-3xl mx-auto max-w-3xl w-full">
          {/* Mock Self View */}
          <div className="h-16 w-24 bg-slate-700 rounded-xl overflow-hidden relative border border-white/10">
             {camActive ? (
               <div className="absolute inset-0 flex items-center justify-center bg-slate-800 text-slate-500 text-xs font-bold">Cam On</div>
             ) : (
               <div className="absolute inset-0 flex items-center justify-center bg-slate-900">
                 <VideoOff className="w-5 h-5 text-slate-500" />
               </div>
             )}
          </div>

          {/* Controls */}
          <div className="flex items-center gap-4">
            <div className="flex flex-col items-center gap-2">
              <button 
                onClick={() => setMicActive(!micActive)}
                className={`p-4 rounded-full transition-all ${micActive ? 'bg-white/10 text-white hover:bg-white/20' : 'bg-red-500/20 text-red-500 hover:bg-red-500/30'} disabled:opacity-50`}
                disabled={activeSpeakerId !== null || isAiThinking}
              >
                {micActive ? <Mic className="w-6 h-6" /> : <MicOff className="w-6 h-6" />}
              </button>
            </div>
            
            <button 
              onClick={() => setCamActive(!camActive)}
              className={`p-4 rounded-full transition-all ${camActive ? 'bg-white/10 text-white hover:bg-white/20' : 'bg-red-500/20 text-red-500 hover:bg-red-500/30'}`}
            >
              {camActive ? <Video className="w-6 h-6" /> : <VideoOff className="w-6 h-6" />}
            </button>
            
            {/* Answer completion trigger */}
            {transcript && micActive && (
              <button 
                onClick={submitUserResponse}
                className="px-4 py-3 rounded-full bg-blue-500 hover:bg-blue-600 text-white font-bold ml-2 shadow-[0_0_15px_rgba(59,130,246,0.5)] transition-all animate-in zoom-in"
              >
                Submit Answer
              </button>
            )}

            <button 
              onClick={handleEndInterview}
              className="px-6 py-4 rounded-full bg-red-500 hover:bg-red-600 text-white font-bold flex items-center gap-2 transition-colors ml-4 shadow-[0_0_20px_rgba(239,68,68,0.4)]"
            >
              <PhoneOff className="w-5 h-5" /> End Interview
            </button>
          </div>
        </div>

        {/* Live Subtitles Area */}
        <div className="mt-8 text-center max-w-4xl mx-auto h-20">
            <AnimatePresence mode="wait">
              {isAiThinking && !activeSpeakerId && (
                <motion.p initial={{ opacity: 0}} animate={{ opacity: 1}} exit={{ opacity: 0}} className="text-slate-400 font-semibold italic">
                  Panel is thinking...
                </motion.p>
              )}
              {activeSpeakerId && (
                 <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} >
                    <p className="text-blue-400 font-bold mb-1 text-sm">{selectedPersonas.find(p => p.id === activeSpeakerId)?.name} is speaking</p>
                    <p className="text-xl font-medium text-white max-w-2xl mx-auto">{history[history.length -1]?.content}</p>
                 </motion.div>
              )}
              {transcript && micActive && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} >
                  <p className="text-emerald-400 font-bold mb-1 text-sm">You are speaking</p>
                  <p className="text-lg font-medium text-slate-200">"{transcript}"</p>
                </motion.div>
              )}
            </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
