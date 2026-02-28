import { useState, useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  Mic,
  MicOff,
  PhoneOff,
  Video,
  VideoOff,
  Settings,
  X,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { API_URL } from "@/lib/api";
import StreamingAvatar, {
  AvatarQuality,
  StreamingEvents,
  TaskType,
} from "@heygen/streaming-avatar";

interface Persona {
  name: string;
  desc: string;
  id: string;
  avatarUrl: string; // URL for stock video
  heygenAvatarId?: string; // The 3D Avatar Face ID
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
  const [history, setHistory] = useState<{ role: string; content: string }[]>(
    [],
  );
  const [transcript, setTranscript] = useState("");
  const [isAiThinking, setIsAiThinking] = useState(false);
  const [failedPersonas, setFailedPersonas] = useState<Record<string, boolean>>(
    {},
  );

  // Settings State
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedMic, setSelectedMic] = useState<string>("");
  const [selectedCam, setSelectedCam] = useState<string>("");
  const [aiSpeed, setAiSpeed] = useState<number>(1.0);

  const recognitionRef = useRef<any>(null);

  // HeyGen Clients map: { personaId: StreamingAvatar }
  const heygenClientsRef = useRef<Record<string, StreamingAvatar>>({});
  const videoRefs = useRef<Record<string, HTMLVideoElement | null>>({});

  // Fallback if no personas selected
  useEffect(() => {
    if (selectedPersonas.length === 0) {
      navigate("/dashboard");
    }
  }, [selectedPersonas, navigate]);

  // Initialize HeyGen Clients for each persona
  useEffect(() => {
    if (selectedPersonas.length === 0) return;

    let isMounted = true;
    const clientsToCleanUp: StreamingAvatar[] = [];

    const initClients = async () => {
      try {
        // Fetch token securely from backend
        const tokenRes = await fetch(`${API_URL}api/heygen-token`, {
          method: "POST",
        });
        if (!tokenRes.ok) throw new Error("Failed to get HeyGen token");
        const { token } = await tokenRes.json();

        for (const persona of selectedPersonas) {
          if (!isMounted) break;

          try {
            const avatar = new StreamingAvatar({ token });
            clientsToCleanUp.push(avatar);

            // Handle Video Stream
            avatar.on(StreamingEvents.STREAM_READY, (event: any) => {
              console.log(`HeyGen Stream ready for ${persona.name}`);
              if (videoRefs.current[persona.id] && event.detail) {
                videoRefs.current[persona.id]!.srcObject = event.detail;
              }
            });

            // Handle UI States seamlessly
            avatar.on(StreamingEvents.AVATAR_START_TALKING, () => {
              if (isMounted) {
                setActiveSpeakerId(persona.id);
                setIsAiThinking(false);
                setMicActive(false);
              }
            });

            avatar.on(StreamingEvents.AVATAR_STOP_TALKING, () => {
              if (isMounted) {
                setActiveSpeakerId(null);
                setMicActive(true);
              }
            });

            // Start the Streaming WebRTC connection
            await avatar.createStartAvatar({
              quality: AvatarQuality.Low,
              avatarName:
                persona.heygenAvatarId || "99160ec3aef04ddab034f4a306665d00",
            });

            if (isMounted) {
              heygenClientsRef.current[persona.id] = avatar;
            }
          } catch (personaErr: any) {
            console.warn(
              `HeyGen init skipped for ${persona.name} (Likely limits):`,
              personaErr.message || personaErr,
            );
            if (isMounted)
              setFailedPersonas((prev) => ({ ...prev, [persona.id]: true }));
          }
        }
      } catch (err) {
        console.error("Initialization error:", err);
      }
    };

    initClients();

    return () => {
      isMounted = false;
      // Cleanup all instantiated clients to prevent leaks
      clientsToCleanUp.forEach((client) => {
        try {
          client.stopAvatar();
        } catch (e) { }
      });
      heygenClientsRef.current = {};
    };
  }, [selectedPersonas]);

  // Initialize Speech Recognition
  useEffect(() => {
    if (!("webkitSpeechRecognition" in window)) return;
    const SpeechRecognition = (window as any).webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US";

    recognition.onresult = (event: any) => {
      let currentTranscript = "";
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        currentTranscript += event.results[i][0].transcript;
      }
      setTranscript(currentTranscript);
    };

    recognition.onend = () => {
      // If mic is still supposed to be active (e.g., user paused), auto-restart
      if (micActive && !activeSpeakerId && !isAiThinking) {
        try {
          recognition.start();
        } catch (e) { }
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
      try {
        recognitionRef.current.start();
      } catch (e) { }
    } else {
      recognitionRef.current.stop();
    }
  }, [micActive, activeSpeakerId, isAiThinking]);

  // The Core AI Conversation Loop
  const submitUserResponse = async () => {
    if (!transcript.trim()) return;

    const userMessage = transcript.trim();
    setTranscript("");
    setHistory((prev) => [...prev, { role: "user", content: userMessage }]);
    setIsAiThinking(true);
    setMicActive(false); // Pause mic while AI thinks/speaks

    try {
      const res = await fetch(`${API_URL}api/agents/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: userMessage,
          history,
          personas: selectedPersonas, // Pass the panel array
        }),
      });

      const data = await res.json();

      const aiResponse = data.content;
      const speakerName = data.speaker; // The LLM specifies who is speaking

      setHistory((prev) => [...prev, { role: "ai", content: aiResponse }]);

      // Find which avatar matches the speaker name
      const speakingAvatar =
        selectedPersonas.find((p) => p.name === speakerName) ||
        selectedPersonas[0];

      await speakAiResponse(aiResponse, speakingAvatar);
    } catch (err) {
      console.error("AI chat error:", err);
      setIsAiThinking(false);
      setMicActive(true);
    }
  };

  // Trigger HeyGen natively
  const speakAiResponse = async (text: string, avatar: Persona) => {
    setIsAiThinking(true);

    try {
      const client = heygenClientsRef.current[avatar.id];
      if (client) {
        // Triggers the HeyGen Cloud TTS, which eventually fires AVATAR_START_TALKING
        await client.speak({ text, taskType: TaskType.TALK });
      } else {
        // Fallback: If limits hit, emulate the timing using native Web Speech Synthesis
        setActiveSpeakerId(avatar.id);

        if ("speechSynthesis" in window) {
          const utterance = new SpeechSynthesisUtterance(text);
          utterance.pitch = avatar.voiceParams.pitch || 1;
          utterance.rate = avatar.voiceParams.rate || 1;

          utterance.onend = () => {
            setActiveSpeakerId(null);
            setIsAiThinking(false);
            setMicActive(true);
          };

          window.speechSynthesis.speak(utterance);
        } else {
          // Absolute fallback if speech API is unavailable
          const estimatedDurationMs = (text.split(" ").length / 2.5) * 1000;
          setTimeout(() => {
            setActiveSpeakerId(null);
            setIsAiThinking(false);
            setMicActive(true);
          }, estimatedDurationMs);
        }
      }
    } catch (e) {
      console.error("HeyGen speak failed", e);
      // Fallback
      setIsAiThinking(false);
      setMicActive(true);
    }
  };

  // Start interview automatically by sending an empty string or standard "Hello" to boot
  useEffect(() => {
    if (selectedPersonas.length > 0 && history.length === 0 && !isAiThinking) {
      setIsAiThinking(true);
      fetch(`${API_URL}api/agents/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message:
            "The candidate has just entered the virtual room. Introduce yourselves quickly and ask the first behavioral question.",
          history: [],
          personas: selectedPersonas,
        }),
      })
        .then((res) => res.json())
        .then((data) => {
          setHistory([{ role: "ai", content: data.content }]);
          const avatar =
            selectedPersonas.find((p) => p.name === data.speaker) ||
            selectedPersonas[0];
          speakAiResponse(data.content, avatar);
        })
        .catch((err) => {
          console.error("Failed to start", err);
          setIsAiThinking(false);
        });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Fetch Devices for Settings
  useEffect(() => {
    if (navigator.mediaDevices && navigator.mediaDevices.enumerateDevices) {
      navigator.mediaDevices.enumerateDevices().then((deviceInfos) => {
        setDevices(deviceInfos);
        const audioInputs = deviceInfos.filter((d) => d.kind === "audioinput");
        const videoInputs = deviceInfos.filter((d) => d.kind === "videoinput");
        if (audioInputs.length > 0 && !selectedMic)
          setSelectedMic(audioInputs[0].deviceId);
        if (videoInputs.length > 0 && !selectedCam)
          setSelectedCam(videoInputs[0].deviceId);
      });
    }
  }, []);

  const handleEndInterview = () => {
    Object.values(heygenClientsRef.current).forEach((c) => {
      try {
        c.stopAvatar();
      } catch (e) { }
    });
    heygenClientsRef.current = {};
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) { }
    }

    // Save history to localStorage and go to report
    localStorage.setItem("lastInterviewSession", JSON.stringify(history));
    navigate("/report", { state: { sessionData: history } });
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
          <button
            onClick={() => setIsSettingsOpen(true)}
            className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
          >
            <Settings className="w-5 h-5 text-slate-300" />
          </button>
        </header>

        {/* Avatars Grid */}
        <div
          className={`flex-1 grid gap-6 mb-8 ${selectedPersonas.length === 1 ? "grid-cols-1 max-w-4xl mx-auto w-full" : "grid-cols-2 max-w-6xl mx-auto w-full"}`}
        >
          {selectedPersonas.map((persona) => (
            <motion.div
              key={persona.id}
              className={`relative rounded-3xl overflow-hidden bg-slate-800 border-2 transition-colors duration-500 ${activeSpeakerId === persona.id ? "border-blue-500 shadow-[0_0_30px_rgba(59,130,246,0.3)]" : "border-slate-700/50"}`}
              layout
            >
              {/* Loading Indicator */}
              {!failedPersonas[persona.id] && (
                <div className="absolute inset-0 flex items-center justify-center bg-slate-800 text-slate-500 text-sm font-bold animate-pulse z-10">
                  Connecting to Stream...
                </div>
              )}

              {/* HeyGen WebRTC Video stream */}
              <video
                ref={(el) => {
                  videoRefs.current[persona.id] = el;
                }}
                autoPlay
                playsInline
                // Video is NOT muted because audio runs directly through this WebRTC connection hook
                className={`absolute inset-0 w-full h-full object-cover z-20 ${failedPersonas[persona.id] ? "hidden" : ""}`}
              />

              {/* Static visual fallback for when WebRTC Rate Limit fails on free tier */}
              {failedPersonas[persona.id] && (
                <div className="absolute inset-0 z-30 flex items-center justify-center bg-slate-900">
                  <img
                    src={persona.avatarUrl}
                    alt={persona.name}
                    className="absolute inset-0 w-full h-full object-cover opacity-80 pointer-events-none"
                  />
                  <div className="absolute inset-0 bg-black/40 mix-blend-multiply pointer-events-none" />
                  <p className="z-40 text-red-300 font-bold bg-black/60 px-4 py-2 rounded-lg backdrop-blur-sm border border-red-500/30 text-sm">
                    HeyGen Stream Limit Reached - Fallback Mode
                  </p>
                </div>
              )}

              {/* Speaker Overlay */}
              <div className="absolute bottom-6 left-6 flex items-center gap-3 bg-black/50 backdrop-blur-md px-4 py-2 rounded-2xl border border-white/10">
                <div className="flex items-end gap-1 h-4">
                  {[1, 2, 3].map((bar) => (
                    <motion.div
                      key={bar}
                      className={`w-1 bg-blue-400 rounded-full ${activeSpeakerId === persona.id ? "" : "h-1"}`}
                      animate={
                        activeSpeakerId === persona.id
                          ? {
                            height: ["20%", "80%", "40%", "100%", "30%"],
                          }
                          : { height: "20%" }
                      }
                      transition={{
                        repeat: Infinity,
                        duration: 0.8,
                        delay: bar * 0.1,
                        ease: "easeInOut",
                      }}
                    />
                  ))}
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white leading-tight">
                    {persona.name}
                  </h3>
                  <p className="text-[10px] text-slate-300 font-semibold">
                    {persona.desc}
                  </p>
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
              <div className="absolute inset-0 flex items-center justify-center bg-slate-800 text-slate-500 text-xs font-bold">
                Cam On
              </div>
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
                className={`p-4 rounded-full transition-all ${micActive ? "bg-white/10 text-white hover:bg-white/20" : "bg-red-500/20 text-red-500 hover:bg-red-500/30"} disabled:opacity-50`}
                disabled={activeSpeakerId !== null || isAiThinking}
              >
                {micActive ? (
                  <Mic className="w-6 h-6" />
                ) : (
                  <MicOff className="w-6 h-6" />
                )}
              </button>
            </div>

            <button
              onClick={() => setCamActive(!camActive)}
              className={`p-4 rounded-full transition-all ${camActive ? "bg-white/10 text-white hover:bg-white/20" : "bg-red-500/20 text-red-500 hover:bg-red-500/30"}`}
            >
              {camActive ? (
                <Video className="w-6 h-6" />
              ) : (
                <VideoOff className="w-6 h-6" />
              )}
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

        {/* Subtitles & Status Overlay */}
        <div className="absolute top-8 left-1/2 -translate-x-1/2 flex justify-center z-50 pointer-events-none">
          <AnimatePresence mode="wait">
            {isAiThinking && !activeSpeakerId && (
              <motion.div
                key="thinking"
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="bg-amber-500/20 text-amber-500 backdrop-blur-md px-6 py-2 rounded-full border border-amber-500/30 font-bold flex items-center gap-3 shadow-lg"
              >
                <div className="flex gap-1">
                  <div
                    className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-bounce"
                    style={{ animationDelay: "0ms" }}
                  />
                  <div
                    className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-bounce"
                    style={{ animationDelay: "150ms" }}
                  />
                  <div
                    className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-bounce"
                    style={{ animationDelay: "300ms" }}
                  />
                </div>
                Processing Answer...
              </motion.div>
            )}
            {!isAiThinking && micActive && !activeSpeakerId && (
              <motion.div
                key="listening"
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="bg-emerald-500/20 text-emerald-400 backdrop-blur-md px-6 py-2 rounded-full border border-emerald-500/30 font-bold flex items-center gap-2 shadow-[0_0_15px_rgba(16,185,129,0.2)]"
              >
                <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                Listening to you...
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="absolute bottom-32 left-0 right-0 px-8 z-40 flex flex-col items-center pointer-events-none">
          <AnimatePresence mode="wait">
            {activeSpeakerId && (
              <motion.div
                key="aispeaking"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                className="bg-black/80 backdrop-blur-xl border border-blue-500/30 rounded-2xl p-6 max-w-4xl w-full text-center shadow-[0_0_30px_rgba(59,130,246,0.15)]"
              >
                <p className="text-blue-400 font-bold mb-2 uppercase tracking-widest text-xs flex items-center justify-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                  {selectedPersonas.find((p) => p.id === activeSpeakerId)?.name}{" "}
                  is speaking
                </p>
                <p className="text-2xl font-medium text-white leading-relaxed">
                  {history[history.length - 1]?.content}
                </p>
              </motion.div>
            )}
            {transcript && micActive && !activeSpeakerId && !isAiThinking && (
              <motion.div
                key="userspeaking"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                className="bg-emerald-900/80 backdrop-blur-xl border border-emerald-500/30 rounded-2xl p-6 max-w-4xl w-full text-center shadow-2xl"
              >
                <p className="text-emerald-400 font-bold mb-2 uppercase tracking-widest text-xs flex items-center justify-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  Live Transcript
                </p>
                <p className="text-xl font-medium text-slate-100 leading-relaxed">
                  "{transcript}"
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Settings Modal */}
      <AnimatePresence>
        {isSettingsOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              className="bg-slate-900 border border-slate-700/50 rounded-3xl p-6 max-w-md w-full shadow-2xl relative"
            >
              <button
                onClick={() => setIsSettingsOpen(false)}
                className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-3 mb-6">
                <Settings className="w-6 h-6 text-blue-400" />
                <h2 className="text-xl font-bold text-white">
                  Interview Settings
                </h2>
              </div>

              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-300 flex items-center gap-2">
                    <Mic className="w-4 h-4 text-emerald-400" /> Microphone
                  </label>
                  <select
                    value={selectedMic}
                    onChange={(e) => setSelectedMic(e.target.value)}
                    className="w-full bg-slate-800 border-slate-700 text-white text-sm rounded-xl focus:ring-blue-500 focus:border-blue-500 p-3"
                  >
                    {devices
                      .filter((d) => d.kind === "audioinput")
                      .map((device) => (
                        <option key={device.deviceId} value={device.deviceId}>
                          {device.label ||
                            `Microphone ${device.deviceId.slice(0, 5)}...`}
                        </option>
                      ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-300 flex items-center gap-2">
                    <Video className="w-4 h-4 text-purple-400" /> Camera
                  </label>
                  <select
                    value={selectedCam}
                    onChange={(e) => setSelectedCam(e.target.value)}
                    className="w-full bg-slate-800 border-slate-700 text-white text-sm rounded-xl focus:ring-blue-500 focus:border-blue-500 p-3"
                  >
                    {devices
                      .filter((d) => d.kind === "videoinput")
                      .map((device) => (
                        <option key={device.deviceId} value={device.deviceId}>
                          {device.label ||
                            `Camera ${device.deviceId.slice(0, 5)}...`}
                        </option>
                      ))}
                  </select>
                </div>

                <div className="space-y-3 pt-2">
                  <div className="flex justify-between items-center">
                    <label className="text-sm font-medium text-slate-300">
                      AI Speech Speed
                    </label>
                    <span className="text-xs font-bold bg-blue-500/20 text-blue-400 px-2 py-1 rounded-md">
                      {aiSpeed}x
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0.7"
                    max="1.5"
                    step="0.1"
                    value={aiSpeed}
                    onChange={(e) => setAiSpeed(parseFloat(e.target.value))}
                    className="w-full accent-blue-500 h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer"
                  />
                  <div className="flex justify-between text-xs text-slate-500">
                    <span>Slower</span>
                    <span>Faster</span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => setIsSettingsOpen(false)}
                className="w-full mt-8 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl transition-all"
              >
                Apply & Close
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
