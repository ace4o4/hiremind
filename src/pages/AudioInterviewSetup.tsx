import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Upload, CheckCircle2, ChevronRight, Mic, Building2, BrainCircuit, XCircle, Loader2 } from "lucide-react";
import { NeuCard, NeuButton } from "@/components/LiquidGlass";
import { API_URL } from "@/lib/api";

export default function AudioInterviewSetup() {
  const navigate = useNavigate();
  const [resumeText, setResumeText] = useState("");
  const [jdText, setJdText] = useState("");
  const [role, setRole] = useState("Software Engineer");
  const [difficulty, setDifficulty] = useState("Experience < 5");
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerate = async () => {
    if (!jdText && !resumeText) {
      alert("Please provide at least a Job Description or a Resume text.");
      return;
    }

    setIsGenerating(true);
    try {
      const res = await fetch(`${API_URL}api/agents/generate-questions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resumeText, jdText, role, difficulty, numQuestions: 3 }),
      });

      if (!res.ok) throw new Error("Failed to generate questions");

      const data = await res.json();

      navigate("/audio-interview", {
        state: {
          questions: data.questions,
          role,
          jdText,
          difficulty
        }
      });
    } catch (err) {
      console.error(err);
      alert("An error occurred while generating questions.");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#e0e5ec] p-6 lg:p-12 flex items-center justify-center">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-3xl"
      >
        <div className="mb-8 text-center">
          <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl neu-convex text-blue-600 mb-4">
            <Mic className="h-8 w-8" />
          </div>
          <h1 className="font-display text-4xl font-black text-slate-800 tracking-tight">Audio Coaching<span className="text-blue-600">Pro</span></h1>
          <p className="mt-2 text-slate-500 font-semibold">Configure your active voice-based interview session</p>
        </div>

        <NeuCard className="p-8 space-y-8">

          {/* Role & Difficulty */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <label className="text-sm font-bold text-slate-700 flex items-center gap-2">
                <Building2 className="w-4 h-4 text-blue-500" /> Target Role
              </label>
              <NeuCard variant="pressed" className="px-4 py-3">
                <input
                  type="text"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="w-full bg-transparent outline-none text-slate-800 font-semibold text-sm"
                  placeholder="e.g. Senior Frontend Engineer"
                />
              </NeuCard>
            </div>

            <div className="space-y-3">
              <label className="text-sm font-bold text-slate-700 flex items-center gap-2">
                <BrainCircuit className="w-4 h-4 text-blue-500" /> Experience Level
              </label>
              <div className="flex bg-[#e0e5ec] rounded-xl p-1 inner-shadow-sm h-[48px]">
                {["Fresher", "Experience < 5", "Experience > 5"].map((level) => (
                  <button
                    key={level}
                    onClick={() => setDifficulty(level)}
                    className={`flex-1 rounded-lg text-xs font-bold transition-all ${difficulty === level ? 'bg-white shadow-sm text-blue-600' : 'text-slate-500 hover:text-slate-700'}`}
                  >
                    {level}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <label className="text-sm font-bold text-slate-700 flex items-center gap-2">
              <Upload className="w-4 h-4 text-blue-500" /> Job Description / Context
            </label>
            <NeuCard variant="pressed" className="p-4">
              <textarea
                rows={4}
                value={jdText}
                onChange={(e) => setJdText(e.target.value)}
                className="w-full bg-transparent outline-none text-slate-800 font-semibold text-sm resize-none"
                placeholder="Paste the job description or specific topics you want to map the questions to..."
              />
            </NeuCard>
          </div>

          <NeuButton
            className="w-full py-4 text-lg"
            variant="primary"
            onClick={handleGenerate}
            disabled={isGenerating}
          >
            {isGenerating ? (
              <span className="flex items-center justify-center gap-2">
                <Loader2 className="w-5 h-5 animate-spin" /> Generating Questions...
              </span>
            ) : "Start Interactive Session"}
          </NeuButton>

          <div className="text-center pt-2">
            <button onClick={() => navigate(-1)} className="text-xs font-bold text-slate-400 hover:text-slate-600 transition-colors">
              Cancel & Return
            </button>
          </div>
        </NeuCard>
      </motion.div>
    </div>
  );
}
