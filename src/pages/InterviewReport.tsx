import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useParams, useNavigate, Link } from "react-router-dom";
import { ChevronDown, ChevronUp, Home, Plus, Trophy, TrendingUp, AlertCircle } from "lucide-react";
import { NeuCard, NeuButton, NeuBackground } from "@/components/LiquidGlass";
import { getSession } from "@/lib/db";
import type { Session } from "@/lib/db";
import { toast } from "sonner";

const ScoreCircle = ({ score }: { score: number }) => {
    const radius = 54;
    const circumference = 2 * Math.PI * radius;
    const dash = (score / 100) * circumference;
    const color = score >= 75 ? "#10b981" : score >= 50 ? "#f59e0b" : "#ef4444";

    return (
        <div className="relative w-40 h-40">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
                <circle cx="60" cy="60" r={radius} stroke="#e2e8f0" strokeWidth="10" fill="none" />
                <motion.circle
                    cx="60" cy="60" r={radius}
                    stroke={color} strokeWidth="10" fill="none"
                    strokeLinecap="round"
                    strokeDasharray={`${circumference}`}
                    initial={{ strokeDashoffset: circumference }}
                    animate={{ strokeDashoffset: circumference - dash }}
                    transition={{ duration: 1.2, ease: "easeOut", delay: 0.3 }}
                />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
                <motion.span
                    className="text-4xl font-black text-slate-800"
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}
                >
                    {score}
                </motion.span>
                <span className="text-xs font-bold text-slate-400">/ 100</span>
            </div>
        </div>
    );
};

const InterviewReport = () => {
    const { sessionId } = useParams<{ sessionId: string }>();
    const navigate = useNavigate();
    const [session, setSession] = useState<Session | null>(null);
    const [loading, setLoading] = useState(true);
    const [expandedIdx, setExpandedIdx] = useState<number | null>(null);

    useEffect(() => {
        if (!sessionId) return;
        getSession(sessionId).then((data) => {
            if (!data) { toast.error("Report not found"); navigate("/dashboard"); return; }
            setSession(data);
            setLoading(false);
        });
    }, [sessionId, navigate]);

    if (loading) return (
        <div className="min-h-screen bg-[#e0e5ec] flex items-center justify-center">
            <div className="w-12 h-12 rounded-full border-4 border-slate-200 border-t-blue-500 animate-spin" />
        </div>
    );
    if (!session) return null;

    const date = new Date(session.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" });

    return (
        <div className="min-h-screen bg-[#e0e5ec] relative">
            <NeuBackground />

            {/* Header */}
            <header className="sticky top-0 z-30 flex h-16 items-center justify-between px-6 bg-[#e0e5ec]/80 backdrop-blur-md border-b border-white/40">
                <Link to="/dashboard" className="flex items-center gap-2 text-slate-500 hover:text-slate-800 transition-colors text-sm font-bold">
                    <Home className="h-4 w-4" /> Dashboard
                </Link>
                <span className="text-sm font-black text-slate-700">Interview Report</span>
                <NeuButton variant="primary" className="flex items-center gap-2 px-4 py-2 text-xs" onClick={() => navigate("/dashboard")}>
                    <Plus className="h-3.5 w-3.5" /> New Interview
                </NeuButton>
            </header>

            <main className="max-w-3xl mx-auto px-6 py-10 space-y-8 relative z-10">

                {/* Hero Score */}
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center">
                    <NeuCard className="p-10 flex flex-col items-center gap-6">
                        <ScoreCircle score={session.score} />
                        <div>
                            <h1 className="text-2xl font-black text-slate-800">{session.job_role}{session.company ? ` @ ${session.company}` : ''}</h1>
                            <p className="text-sm text-slate-500 font-semibold mt-1">{date}</p>
                        </div>
                        <div className="flex gap-2 flex-wrap justify-center">
                            {session.tags.map(t => (
                                <span key={t} className="neu-pressed px-3 py-1 rounded-full text-xs font-bold text-slate-600">{t}</span>
                            ))}
                        </div>
                    </NeuCard>
                </motion.div>

                {/* Summary */}
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                    <NeuCard className="p-6 space-y-4">
                        <h2 className="font-bold text-slate-800">AI Coach Summary</h2>
                        <p className="text-sm text-slate-600 leading-relaxed">{session.feedback.summary}</p>
                        <div className="grid grid-cols-2 gap-4 pt-2">
                            <div>
                                <div className="flex items-center gap-2 mb-3">
                                    <TrendingUp className="h-4 w-4 text-emerald-500" />
                                    <p className="text-xs font-bold text-emerald-600 uppercase tracking-wider">Top Strengths</p>
                                </div>
                                {session.feedback.topStrengths.map((s, i) => (
                                    <div key={i} className="flex items-start gap-2 mb-2">
                                        <span className="text-emerald-500 mt-0.5">✓</span>
                                        <p className="text-xs text-slate-600">{s}</p>
                                    </div>
                                ))}
                            </div>
                            <div>
                                <div className="flex items-center gap-2 mb-3">
                                    <AlertCircle className="h-4 w-4 text-amber-500" />
                                    <p className="text-xs font-bold text-amber-600 uppercase tracking-wider">Improve On</p>
                                </div>
                                {session.feedback.topImprovements.map((s, i) => (
                                    <div key={i} className="flex items-start gap-2 mb-2">
                                        <span className="text-amber-500 mt-0.5">↑</span>
                                        <p className="text-xs text-slate-600">{s}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </NeuCard>
                </motion.div>

                {/* Per-question breakdown */}
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
                    <h2 className="font-bold text-slate-800 mb-4">Question Breakdown</h2>
                    <div className="space-y-3">
                        {session.answers.map((a, i) => (
                            <NeuCard key={i} className="overflow-hidden">
                                <button
                                    onClick={() => setExpandedIdx(expandedIdx === i ? null : i)}
                                    className="w-full flex items-center justify-between p-5 text-left"
                                >
                                    <div className="flex items-center gap-4 flex-1 min-w-0">
                                        <div className={`shrink-0 flex h-10 w-10 items-center justify-center rounded-xl font-black text-sm neu-pressed ${a.score >= 75 ? "text-emerald-600" : a.score >= 50 ? "text-amber-600" : "text-red-500"
                                            }`}>
                                            {a.score}
                                        </div>
                                        <p className="text-sm font-semibold text-slate-700 truncate">{a.question}</p>
                                    </div>
                                    {expandedIdx === i ? <ChevronUp className="h-4 w-4 text-slate-400 shrink-0 ml-2" /> : <ChevronDown className="h-4 w-4 text-slate-400 shrink-0 ml-2" />}
                                </button>

                                {expandedIdx === i && (
                                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="px-5 pb-5 space-y-4 border-t border-slate-200/50 pt-4">
                                        <div>
                                            <p className="text-xs font-bold text-slate-500 mb-1">Your Answer</p>
                                            <p className="text-sm text-slate-700 leading-relaxed">{a.answer}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs font-bold text-blue-600 mb-1">AI Feedback</p>
                                            <p className="text-sm text-slate-600 leading-relaxed">{a.feedback}</p>
                                        </div>
                                        <NeuCard variant="pressed" className="py-3 px-4">
                                            <p className="text-xs font-bold text-emerald-600 mb-1">💡 Ideal Answer</p>
                                            <p className="text-sm text-slate-600 leading-relaxed">{a.idealAnswer}</p>
                                        </NeuCard>
                                    </motion.div>
                                )}
                            </NeuCard>
                        ))}
                    </div>
                </motion.div>

                {/* CTA */}
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }} className="flex gap-4 pb-12">
                    <NeuButton className="flex-1 py-4 flex items-center justify-center gap-2" onClick={() => navigate("/dashboard")}>
                        <Home className="h-4 w-4" /> Dashboard
                    </NeuButton>
                    <NeuButton variant="primary" className="flex-1 py-4 flex items-center justify-center gap-2" onClick={() => navigate("/dashboard")}>
                        <Trophy className="h-4 w-4" /> Practice Again
                    </NeuButton>
                </motion.div>
            </main>
        </div>
    );
};

export default InterviewReport;
