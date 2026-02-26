import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowRight, Lightbulb, CheckCircle2, Loader2, X, ChevronLeft } from "lucide-react";
import { NeuCard, NeuButton, NeuBackground } from "@/components/LiquidGlass";
import { useAuth } from "@/contexts/AuthContext";
import { getInterview, saveSession } from "@/lib/db";
import { scoreAnswer, generateInterviewSummary } from "@/lib/groq";
import type { Interview } from "@/lib/db";
import type { AnswerScore } from "@/lib/groq";
import { toast } from "sonner";

interface AnsweredQuestion {
    question: string;
    answer: string;
    score: number;
    feedback: string;
    idealAnswer: string;
}

const InterviewRoom = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { user } = useAuth();
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    const [interview, setInterview] = useState<Interview | null>(null);
    const [loading, setLoading] = useState(true);
    const [currentIdx, setCurrentIdx] = useState(0);
    const [answer, setAnswer] = useState("");
    const [showHint, setShowHint] = useState(false);
    const [scoring, setScoring] = useState(false);
    const [result, setResult] = useState<AnswerScore | null>(null);
    const [answered, setAnswered] = useState<AnsweredQuestion[]>([]);
    const [finishing, setFinishing] = useState(false);

    useEffect(() => {
        if (!id) return;
        getInterview(id).then((data) => {
            if (!data) { toast.error("Interview not found"); navigate("/dashboard"); return; }
            setInterview(data);
            setLoading(false);
        });
    }, [id, navigate]);

    const currentQuestion = interview?.questions[currentIdx];
    const totalQuestions = interview?.questions.length ?? 0;
    const progress = ((currentIdx) / totalQuestions) * 100;
    const isLast = currentIdx === totalQuestions - 1;

    const handleSubmitAnswer = async () => {
        if (!answer.trim() || !currentQuestion || !interview) return;
        setScoring(true);
        try {
            const score = await scoreAnswer(currentQuestion.question, answer, interview.job_role, currentQuestion.type);
            setResult(score);
        } catch {
            toast.error("Failed to score answer. Please try again.");
        } finally {
            setScoring(false);
        }
    };

    const handleNext = async () => {
        if (!result || !currentQuestion) return;
        const newAnswered = [...answered, {
            question: currentQuestion.question,
            answer,
            score: result.score,
            feedback: result.feedback,
            idealAnswer: result.idealAnswer,
        }];
        setAnswered(newAnswered);

        if (isLast) {
            // Finish — generate summary and save
            setFinishing(true);
            try {
                const summary = await generateInterviewSummary(interview!.job_role, newAnswered);
                const tags = [...new Set([interview!.job_role, currentQuestion.type === "technical" ? "Technical" : "Behavioral"])];
                const sessionId = await saveSession({
                    user_id: user!.id,
                    interview_id: interview!.id,
                    job_role: interview!.job_role,
                    company: interview!.company,
                    score: summary.overallScore,
                    tags,
                    answers: newAnswered,
                    feedback: { summary: summary.summary, topStrengths: summary.topStrengths, topImprovements: summary.topImprovements },
                });
                navigate(`/report/${sessionId}`);
            } catch {
                toast.error("Failed to save session.");
                setFinishing(false);
            }
        } else {
            setCurrentIdx(prev => prev + 1);
            setAnswer("");
            setResult(null);
            setShowHint(false);
            textareaRef.current?.focus();
        }
    };

    if (loading) return (
        <div className="min-h-screen bg-[#e0e5ec] flex items-center justify-center">
            <div className="w-12 h-12 rounded-full border-4 border-slate-200 border-t-blue-500 animate-spin" />
        </div>
    );

    if (finishing) return (
        <div className="min-h-screen bg-[#e0e5ec] flex flex-col items-center justify-center gap-6">
            <NeuBackground />
            <div className="w-16 h-16 rounded-full border-4 border-slate-200 border-t-blue-500 animate-spin" />
            <p className="text-slate-700 font-bold text-lg animate-pulse">Generating your report...</p>
        </div>
    );

    return (
        <div className="min-h-screen bg-[#e0e5ec] relative">
            <NeuBackground />

            {/* Header */}
            <header className="sticky top-0 z-30 flex h-16 items-center justify-between px-6 bg-[#e0e5ec]/80 backdrop-blur-md border-b border-white/40">
                <button onClick={() => navigate("/dashboard")} className="flex items-center gap-2 text-slate-500 hover:text-slate-800 transition-colors text-sm font-bold">
                    <ChevronLeft className="h-4 w-4" /> Exit Interview
                </button>
                <div className="flex items-center gap-4">
                    <span className="text-xs font-bold text-slate-500">Question {currentIdx + 1} of {totalQuestions}</span>
                    <div className="w-32 h-2 rounded-full neu-pressed overflow-hidden p-0.5">
                        <motion.div
                            className="h-full rounded-full bg-blue-500"
                            animate={{ width: `${progress}%` }}
                            transition={{ duration: 0.5, ease: "easeOut" }}
                        />
                    </div>
                </div>
                <span className="text-sm font-black text-slate-700">{interview?.job_role}</span>
            </header>

            {/* Content */}
            <main className="max-w-3xl mx-auto px-6 py-10 relative z-10">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={currentIdx}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ duration: 0.3 }}
                        className="space-y-6"
                    >
                        {/* Question type badge */}
                        <div className="flex items-center gap-3">
                            <span className={`neu-pressed px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${currentQuestion?.type === "behavioral" ? "text-purple-600" :
                                    currentQuestion?.type === "technical" ? "text-blue-600" : "text-emerald-600"
                                }`}>
                                {currentQuestion?.type}
                            </span>
                            {currentQuestion?.hint && (
                                <button onClick={() => setShowHint(!showHint)} className="flex items-center gap-1 text-xs font-bold text-amber-600 hover:text-amber-700 transition-colors">
                                    <Lightbulb className="h-3.5 w-3.5" />
                                    {showHint ? "Hide hint" : "Show hint"}
                                </button>
                            )}
                        </div>

                        {/* Hint */}
                        <AnimatePresence>
                            {showHint && currentQuestion?.hint && (
                                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}>
                                    <NeuCard variant="pressed" className="py-3 px-4 text-xs font-semibold text-amber-700 bg-amber-50/50">
                                        💡 {currentQuestion.hint}
                                    </NeuCard>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* Question */}
                        <NeuCard className="p-8">
                            <h2 className="text-xl font-bold text-slate-800 leading-relaxed">{currentQuestion?.question}</h2>
                        </NeuCard>

                        {/* Answer area — hide after scoring */}
                        {!result && (
                            <NeuCard variant="pressed" className="p-4">
                                <textarea
                                    ref={textareaRef}
                                    rows={6}
                                    value={answer}
                                    onChange={(e) => setAnswer(e.target.value)}
                                    placeholder="Type your answer here... Be as detailed as possible."
                                    className="w-full bg-transparent text-sm font-semibold text-slate-700 placeholder:text-slate-400 focus:outline-none resize-none"
                                    autoFocus
                                />
                                <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-200/50">
                                    <span className="text-xs text-slate-400 font-semibold">{answer.trim().split(/\s+/).filter(Boolean).length} words</span>
                                    <NeuButton
                                        variant="primary"
                                        className="flex items-center gap-2 px-6 py-2.5 text-sm"
                                        onClick={handleSubmitAnswer}
                                        disabled={!answer.trim() || scoring}
                                    >
                                        {scoring ? <Loader2 className="h-4 w-4 animate-spin" /> : <><span>Submit Answer</span><ArrowRight className="h-4 w-4" /></>}
                                    </NeuButton>
                                </div>
                            </NeuCard>
                        )}

                        {/* Result */}
                        {result && (
                            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
                                {/* Score */}
                                <NeuCard className="p-6">
                                    <div className="flex items-center justify-between mb-4">
                                        <h3 className="font-bold text-slate-800">Your Score</h3>
                                        <div className={`text-3xl font-black ${result.score >= 75 ? "text-emerald-600" : result.score >= 50 ? "text-amber-600" : "text-red-500"}`}>
                                            {result.score}<span className="text-base text-slate-400 font-bold">/100</span>
                                        </div>
                                    </div>
                                    <p className="text-sm text-slate-600 leading-relaxed">{result.feedback}</p>

                                    <div className="grid grid-cols-2 gap-4 mt-4">
                                        <div>
                                            <p className="text-xs font-bold text-emerald-600 mb-2">✓ Strengths</p>
                                            {result.strengths.map((s, i) => <p key={i} className="text-xs text-slate-600 mb-1">• {s}</p>)}
                                        </div>
                                        <div>
                                            <p className="text-xs font-bold text-amber-600 mb-2">↑ Improve</p>
                                            {result.improvements.map((s, i) => <p key={i} className="text-xs text-slate-600 mb-1">• {s}</p>)}
                                        </div>
                                    </div>
                                </NeuCard>

                                {/* Ideal answer */}
                                <NeuCard variant="pressed" className="p-5">
                                    <p className="text-xs font-bold text-blue-600 mb-2">💡 Ideal Answer</p>
                                    <p className="text-sm text-slate-700 leading-relaxed">{result.idealAnswer}</p>
                                </NeuCard>

                                <NeuButton
                                    variant="primary"
                                    className="w-full flex items-center justify-center gap-2 py-4"
                                    onClick={handleNext}
                                >
                                    {isLast ? (
                                        <><CheckCircle2 className="h-4 w-4" /> Finish & See Report</>
                                    ) : (
                                        <><span>Next Question</span><ArrowRight className="h-4 w-4" /></>
                                    )}
                                </NeuButton>
                            </motion.div>
                        )}
                    </motion.div>
                </AnimatePresence>
            </main>
        </div>
    );
};

export default InterviewRoom;
