import { useState, useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Mic, Square, ChevronRight, CheckCircle2, TrendingUp, BookOpen, Maximize2, Loader2, ArrowRight, AlertTriangle } from "lucide-react";
import { NeuCard, NeuButton } from "@/components/LiquidGlass";

interface Question {
  question: string;
  type: string;
  focus: string;
}

interface Evaluation {
  optimizedAnswer: string;
  toneScore: number;
  vocabularyScore: number;
  feedback: string;
}

export default function LiveAudioInterview() {
  const location = useLocation();
  const navigate = useNavigate();
  const { questions, role, jdText, difficulty } = location.state || { questions: [], role: '', jdText: '', difficulty: '' };

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [evaluation, setEvaluation] = useState<Evaluation | null>(null);
  const [volume, setVolume] = useState(0);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<BlobPart[]>([]);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number>(0);
  const activeQuestion = questions[currentIndex];

  useEffect(() => {
    if (!questions || questions.length === 0) {
      navigate("/audio-setup");
    }
    return () => {
      cancelAnimationFrame(animationFrameRef.current);
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close().catch(() => {});
      }
    };
  }, [navigate, questions]);

  const toggleRecording = async () => {
    if (isRecording) {
      // STOP RECORDING
      setIsRecording(false);
      cancelAnimationFrame(animationFrameRef.current);
      setVolume(0);
      
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
        mediaRecorderRef.current.stop();
      }
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close().catch(() => {});
      }
    } else {
      // START RECORDING
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        
        // --- Audio Visualizer Setup ---
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        const audioContext = new AudioContextClass();
        const source = audioContext.createMediaStreamSource(stream);
        const analyser = audioContext.createAnalyser();
        analyser.fftSize = 256;
        source.connect(analyser);
        audioContextRef.current = audioContext;
        analyserRef.current = analyser;

        const dataArray = new Uint8Array(analyser.frequencyBinCount);
        const updateVolume = () => {
          analyser.getByteFrequencyData(dataArray);
          let sum = 0;
          for (let i = 0; i < dataArray.length; i++) {
            sum += dataArray[i];
          }
          setVolume(sum / dataArray.length);
          animationFrameRef.current = requestAnimationFrame(updateVolume);
        };
        updateVolume();
        // ------------------------------

        const mediaRecorder = new MediaRecorder(stream, {
          mimeType: MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : 'audio/mp4'
        });
        
        audioChunksRef.current = [];
        
        mediaRecorder.ondataavailable = (event) => {
          if (event.data.size > 0) {
             audioChunksRef.current.push(event.data);
          }
        };

        mediaRecorder.onstop = async () => {
          setIsEvaluating(true);
          setTranscript("");
          
          try {
            const audioBlob = new Blob(audioChunksRef.current, { type: mediaRecorder.mimeType });
            const reader = new FileReader();

            reader.readAsDataURL(audioBlob);
            reader.onloadend = async () => {
              const base64Audio = (reader.result as string).split(',')[1];

              const sttRes = await fetch("http://localhost:3001/api/agents/stt", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  audioBase64: base64Audio,
                  mimeType: mediaRecorder.mimeType
                })
              });

              if (!sttRes.ok) throw new Error("STT failed");
              const sttData = await sttRes.json();
              let finalTranscript = sttData.text;
              
              // Filter out Whisper hallucination for silence
              if (finalTranscript.trim().toLowerCase() === "you" || finalTranscript.trim().toLowerCase() === "you.") {
                 finalTranscript = "";
              }

              setTranscript(finalTranscript);
              
              if (!finalTranscript.trim()) {
                 alert("No speech detected! Your microphone recorded absolute silence. Please check Windows Sound Settings or your physical mic mute button.");
                 setIsEvaluating(false);
                 return;
              }

              submitAnswer(finalTranscript);
            };
          } catch (e: any) {
            console.error("Audio processing failed", e);
            alert("Error processing your audio. Please try again.");
            setIsEvaluating(false);
          }
          
          stream.getTracks().forEach(track => track.stop());
        };

        mediaRecorderRef.current = mediaRecorder;
        mediaRecorder.start(1000); // chunk every 1 sec
        setIsRecording(true);
        setEvaluation(null);

      } catch (err) {
        console.error("Microphone access denied or error:", err);
        alert("Please grant microphone permissions in your browser URL bar.");
      }
    }
  };

  const submitAnswer = async (finalTranscript: string) => {
    try {
      const res = await fetch("http://localhost:3001/api/agents/evaluate-answer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userAnswer: finalTranscript,
          currentQuestion: activeQuestion?.question,
          jobDescription: jdText
        })
      });

      if (!res.ok) throw new Error("Evaluation failed");
      
      const data = await res.json();
      setEvaluation(data);
    } catch (err) {
      console.error(err);
      alert("Failed to evaluate answer.");
    } finally {
      setIsEvaluating(false);
    }
  };

  const nextQuestion = () => {
    setTranscript("");
    setEvaluation(null);
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(curr => curr + 1);
    } else {
      navigate("/dashboard");
    }
  };

  if (!questions || questions.length === 0) return null;

  return (
    <div className="min-h-screen bg-[#e0e5ec] p-4 lg:p-8 flex flex-col md:flex-row gap-6">
      
      {/* Left Column: Recording & Active Question */}
      <div className="flex-1 flex flex-col gap-6">
        <NeuCard className="p-6 flex-1 flex flex-col relative">
          
          {/* Hardware Diagnostic Visualizer */}
          {isRecording && (
            <div className="absolute top-6 right-6 flex items-center gap-3 bg-white/50 backdrop-blur-md px-4 py-2 rounded-2xl shadow-sm border border-white/40">
              <span className="text-xs font-bold text-slate-500 uppercase">Mic Level</span>
              <div className="w-24 h-2 bg-slate-200 rounded-full overflow-hidden relative">
                <motion.div 
                  className={`absolute left-0 top-0 bottom-0 transition-colors duration-100 ${volume > 5 ? 'bg-green-500' : 'bg-red-500'}`} 
                  animate={{ width: \`\${Math.min(100, (volume / 128) * 100)}%\` }}
                  transition={{ type: "tween", ease: "linear", duration: 0.1 }}
                />
              </div>
              {volume < 2 && (
                <TooltipHover text="If the bar is red and not moving, your mic is muted at the OS/hardware level!" />
              )}
            </div>
          )}

          <div className="flex items-center justify-between mb-8">
             <div className="flex items-center gap-3">
               <div className="neu-flat px-3 py-1 rounded-lg text-xs font-bold text-blue-600 uppercase tracking-widest flex items-center gap-2">
                 <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" /> LIVE
               </div>
               <span className="text-sm font-bold text-slate-500">Question {currentIndex + 1} of {questions.length}</span>
             </div>
             <span className="text-xs font-bold text-slate-400 uppercase">{activeQuestion?.type} Focus</span>
          </div>

          <motion.div 
            key={currentIndex}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex-1 flex flex-col justify-center"
          >
            <h2 className="font-display text-3xl md:text-4xl font-black text-slate-800 leading-tight mb-8 text-center md:text-left">
              "{activeQuestion?.question}"
            </h2>
            
            <div className="neu-pressed rounded-2xl p-6 min-h-[150px] flex flex-col items-center justify-center text-center mb-8 relative">
              {!transcript && !isRecording && !isEvaluating && (
                <p className="text-slate-400 font-semibold italic">Tap the mic and start speaking your answer...</p>
              )}
              {!transcript && isRecording && (
                <div className="flex flex-col items-center gap-4">
                  <div className="flex gap-2">
                    <span className="w-2 h-2 rounded-full bg-blue-500 animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-2 h-2 rounded-full bg-blue-500 animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-2 h-2 rounded-full bg-blue-500 animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                  {volume < 2 && (
                    <p className="text-xs font-bold text-red-500 bg-red-50 px-3 py-1 rounded-full animate-pulse border border-red-200">
                      Warning: No audio detected! Check your mic mute button.
                    </p>
                  )}
                </div>
              )}
              {transcript && (
                <p className="text-slate-800 font-semibold text-lg max-w-2xl mx-auto">"{transcript}"</p>
              )}
            </div>
          </motion.div>

          <div className="flex flex-col items-center justify-center pt-4">
             <button
               onClick={toggleRecording}
               disabled={isEvaluating}
               className={`w-24 h-24 rounded-full flex items-center justify-center transition-all duration-300 \${
                 isRecording 
                   ? "bg-red-500 text-white shadow-[inset_4px_4px_8px_rgba(0,0,0,0.2),_inset_-4px_-4px_8px_rgba(255,255,255,0.2)] animate-pulse scale-105" 
                   : "neu-convex text-slate-600 hover:text-blue-600 active:scale-95"
               } \${isEvaluating ? "opacity-50 cursor-not-allowed" : ""}`}
             >
               {isRecording ? <Square className="w-8 h-8 fill-current" /> : <Mic className="w-10 h-10" />}
             </button>
             <p className="mt-4 text-xs font-bold text-slate-500 uppercase tracking-widest">
               {isRecording ? "Tap to Stop & Evaluate" : "Tap to Speak"}
             </p>
          </div>
        </NeuCard>
      </div>

      {/* Right Column: AI Analytics Feedback */}
      <div className="w-full md:w-[450px] lg:w-[500px] flex flex-col gap-6">
        <NeuCard className="p-6 flex-1 flex flex-col h-full">
           <h3 className="font-display text-xl font-black text-slate-800 flex items-center gap-2 mb-6">
             <Maximize2 className="w-5 h-5 text-blue-500" /> Real-Time Analytics
           </h3>

           <div className="flex-1 neu-pressed rounded-2xl p-5 overflow-y-auto">
             {!isEvaluating && !evaluation ? (
               <div className="h-full flex flex-col items-center justify-center text-center opacity-50">
                 <CheckCircle2 className="w-12 h-12 text-slate-400 mb-4" />
                 <p className="text-sm font-bold text-slate-500">Awaiting your response.</p>
                 <p className="text-xs font-semibold text-slate-400 mt-1">Submit your answer to get instant optimization feedback.</p>
               </div>
             ) : isEvaluating ? (
               <div className="h-full flex flex-col items-center justify-center text-center text-blue-600">
                 <Loader2 className="w-10 h-10 animate-spin mb-4" />
                 <p className="text-sm font-bold">Transcribing & Analyzing Tone...</p>
               </div>
             ) : (
               <AnimatePresence mode="wait">
                 <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                   
                   {/* Optimized Answer */}
                   <div className="space-y-2">
                     <span className="text-xs font-bold text-green-600 uppercase tracking-wider flex items-center gap-2">
                       <CheckCircle2 className="w-4 h-4" /> AI Optimized Answer
                     </span>
                     <p className="text-slate-700 text-sm font-semibold leading-relaxed p-3 bg-white/40 rounded-xl border border-white/50">
                       "{evaluation?.optimizedAnswer}"
                     </p>
                   </div>

                   {/* Scores */}
                   <div className="grid grid-cols-2 gap-4">
                     <div className="neu-flat p-4 rounded-xl text-center space-y-2">
                        <TrendingUp className="w-6 h-6 text-blue-500 mx-auto" />
                        <p className="text-3xl font-black text-slate-800">{evaluation?.toneScore}</p>
                        <p className="text-[10px] font-bold text-slate-500 uppercase">Tone Score</p>
                     </div>
                     <div className="neu-flat p-4 rounded-xl text-center space-y-2">
                        <BookOpen className="w-6 h-6 text-purple-500 mx-auto" />
                        <p className="text-3xl font-black text-slate-800">{evaluation?.vocabularyScore}</p>
                        <p className="text-[10px] font-bold text-slate-500 uppercase">Vocabulary</p>
                     </div>
                   </div>

                   {/* Feedback */}
                   <div className="space-y-2">
                     <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Constructive Feedback</span>
                     <p className="text-slate-600 text-sm font-semibold leading-relaxed">
                       {evaluation?.feedback}
                     </p>
                   </div>
                   
                 </motion.div>
               </AnimatePresence>
             )}
           </div>

           <NeuButton 
             className="w-full mt-6 py-4 flex items-center justify-center gap-2"
             disabled={!evaluation && !isEvaluating}
             onClick={nextQuestion}
           >
             {currentIndex < questions.length - 1 ? "Next Question" : "Complete Interview"}
             <ArrowRight className="w-4 h-4 ml-2" />
           </NeuButton>
        </NeuCard>
      </div>

    </div>
  );
}

function TooltipHover({ text }: { text: string }) {
  const [show, setShow] = useState(false);
  return (
    <div className="relative flex items-center" onMouseEnter={() => setShow(true)} onMouseLeave={() => setShow(false)}>
      <AlertTriangle className="w-4 h-4 text-red-500 cursor-help" />
      {show && (
        <div className="absolute top-full mt-2 w-48 right-0 bg-slate-800 text-white text-[10px] font-bold px-3 py-2 rounded-lg shadow-xl z-50">
          {text}
        </div>
      )}
    </div>
  );
}
