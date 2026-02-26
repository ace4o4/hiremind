import { useState, useEffect } from "react";
import { motion, AnimatePresence, useMotionValue, useSpring } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Zap, FileText, Play, BarChart3, Clock,
  Target, Brain, Users, TrendingUp, AlertCircle,
  ChevronRight, Star, CheckCircle2, Shield,
  Share2, Download, Trophy, XCircle, AlertTriangle, BrainCircuit,
  LayoutDashboard, MessageSquare, Briefcase, ArrowUpRight, StopCircle, RefreshCw, Upload, Eye, LogOut, Loader2
} from "lucide-react";
import { CursorGlow, NeuCard, NeuButton, NeuBackground } from "@/components/LiquidGlass";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useAuth } from "@/contexts/AuthContext";
import { generateQuestions } from "@/lib/groq";
import { saveInterview, getSessions, getUserStats } from "@/lib/db";
import type { Session, UserStats } from "@/lib/db";
import { toast } from "sonner";

/* ===== SIDEBAR ===== */
const Sidebar = ({ activeTab, setActiveTab, onSignOut }: { activeTab: string, setActiveTab: (t: string) => void, onSignOut: () => void }) => (
  <aside className="fixed left-0 top-0 z-40 hidden h-screen w-64 flex-col p-6 lg:flex border-r border-white/40 bg-[#e0e5ec]">
    <Link to="/" className="mb-10 flex items-center gap-2.5 px-2">
      <div className="flex h-10 w-10 items-center justify-center rounded-xl neu-convex text-blue-600">
        <Zap className="h-5 w-5" />
      </div>
      <span className="font-display text-xl font-black text-slate-800 tracking-tight">
        Interview<span className="text-blue-600">Guru</span>
      </span>
    </Link>

    <nav className="flex flex-1 flex-col gap-2">
      {[
        { icon: Play, label: "New Interview" },
        { icon: Clock, label: "Past Sessions" },
        { icon: BarChart3, label: "Progress Hub" },
        { icon: Target, label: "Skill Map" },
        { icon: Users, label: "Panel Mode" },
        { icon: Brain, label: "Memory Bank" },
        { icon: LayoutDashboard, label: "Jobie Overview" },
      ].map((item) => (
        <button
          key={item.label}
          onClick={() => setActiveTab(item.label)}
          className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-bold transition-all duration-300 ${activeTab === item.label
            ? "neu-pressed text-blue-600"
            : "text-slate-500 hover:text-slate-800 hover:bg-white/40"
            }`}
        >
          <item.icon className={`h-4 w-4 ${activeTab === item.label ? 'text-blue-600' : 'text-slate-400'}`} />
          {item.label}
        </button>
      ))}
    </nav>

    <div className="neu-flat rounded-2xl p-5 mt-auto">
      <div className="flex justify-between items-center mb-1">
        <p className="text-sm font-black text-blue-600">Pro Plan</p>
        <Zap className="h-4 w-4 text-blue-500 fill-current" />
      </div>
      <p className="text-xs font-bold text-slate-500 mb-4">Unlimited interviews</p>

      <div className="h-2 w-full rounded-full neu-pressed overflow-hidden p-0.5">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: "75%" }}
          transition={{ duration: 1.2, ease: "easeOut" }}
          className="h-full rounded-full bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.5)]"
        />
      </div>
      <p className="mt-3 text-[10px] uppercase tracking-wider font-bold text-slate-400 text-center">18 of 24 sessions</p>
    </div>

    <button
      onClick={onSignOut}
      className="mt-4 flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-bold text-red-500 hover:text-red-600 hover:bg-red-50/50 transition-all duration-300 w-full"
    >
      <LogOut className="h-4 w-4" />
      Sign Out
    </button>
  </aside>
);

/* ===== STATS DATA (static icons/labels only; values filled from DB) ===== */
const statsIcons = [
  { label: "Sessions", icon: Play, changeLabel: "total" },
  { label: "Avg Score", icon: ArrowUpRight, changeLabel: "/ 100" },
  { label: "Streak", icon: Star, changeLabel: "days" },
  { label: "Skills", icon: Target, changeLabel: "roles practiced" },
];

/* ===== RECENT SESSION BLOCK ===== */
const RecentSessionCard = ({ title, score, date, tags }: { title: string; score: number; date: string; tags: string[] }) => (
  <NeuCard className="flex items-center gap-4 p-4 cursor-pointer hover:bg-white/5 transition-colors">
    <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl font-display text-lg font-black border ${score >= 80
      ? "bg-primary/10 text-primary border-primary/20"
      : score >= 60
        ? "bg-purple-500/10 text-purple border-purple-500/20"
        : "bg-destructive/10 text-destructive border-destructive/20"
      }`}>
      {score}
    </div>
    <div className="flex-1 min-w-0">
      <p className="font-bold text-slate-800 truncate">{title}</p>
      <div className="mt-1 flex items-center gap-2">
        <span className="text-xs font-semibold text-slate-500">{date}</span>
        <div className="flex items-center gap-1">
          {tags.map((t) => (
            <span key={t} className="neu-pressed px-2 py-0.5 rounded-full text-[10px] font-bold text-slate-500">{t}</span>
          ))}
        </div>
      </div>
    </div>
    <ChevronRight className="h-4 w-4 text-slate-400" />
  </NeuCard>
);

/* ===== VIEW: NEW INTERVIEW ===== */
const NewInterviewView = ({ stats }: { stats: UserStats | null }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [resumeText, setResumeText] = useState("");
  const [jdText, setJdText] = useState("");
  const [role, setRole] = useState("");
  const [company, setCompany] = useState("");
  const [step, setStep] = useState<"input" | "configure" | "generating">("input");
  const [generatedId, setGeneratedId] = useState<string | null>(null);
  const [questionCount, setQuestionCount] = useState(0);

  const handleGenerate = async () => {
    if (!resumeText.trim() || !jdText.trim() || !role.trim()) {
      toast.error("Please fill in resume, job description and target role.");
      return;
    }
    setStep("generating");
    try {
      const questions = await generateQuestions(resumeText, jdText, role, company);
      const interviewId = await saveInterview({
        user_id: user!.id,
        job_role: role,
        company: company || undefined,
        jd_text: jdText,
        resume_text: resumeText,
        questions,
      });
      setQuestionCount(questions.length);
      setGeneratedId(interviewId);
    } catch (e) {
      toast.error("Failed to generate questions. Please try again.");
      setStep("configure");
    }
  };

  const statsValues = [
    { label: "Sessions", icon: Play, value: String(stats?.totalSessions ?? 0), change: "total" },
    { label: "Avg Score", icon: ArrowUpRight, value: String(stats?.avgScore ?? 0), change: "/ 100" },
    { label: "Streak", icon: Star, value: String(stats?.streak ?? 0), change: "days" },
    { label: "Skills", icon: Target, value: String(stats?.skillsImproved ?? 0), change: "roles practiced" },
  ];

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-6">
        {statsValues.map((stat, i) => (
          <motion.div key={stat.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1, type: "spring" }}>
            <NeuCard className="p-5" as="div">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500">{stat.label}</span>
                <div className="flex h-7 w-7 items-center justify-center rounded-lg neu-pressed text-blue-600">
                  <stat.icon className="h-3.5 w-3.5" />
                </div>
              </div>
              <p className="mt-2 font-display text-2xl font-black text-slate-800">{stat.value}</p>
              <p className="mt-1 text-xs font-bold text-blue-500">{stat.change}</p>
            </NeuCard>
          </motion.div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        <div className="lg:col-span-3">
          <NeuCard className="p-8">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl neu-pressed text-blue-600">
                <BrainCircuit className="h-5 w-5" />
              </div>
              <div>
                <h2 className="font-display text-xl font-bold text-slate-800">Start New Mock Interview</h2>
                <p className="text-sm font-semibold text-slate-500">Paste your resume & job description to generate questions</p>
              </div>
            </div>

            {/* Step indicator */}
            <div className="mt-6 flex gap-2">
              {(["input", "configure"] as const).map((s, i) => (
                <div key={s} className="flex flex-1 items-center gap-2">
                  <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold transition-all duration-500 ${step === s || (step === "generating" && i < 2) ? "neu-convex text-blue-600" :
                      i < ["input", "configure"].indexOf(step) ? "neu-flat text-blue-500" : "neu-pressed text-slate-400"
                    }`}>{i + 1}</div>
                  <span className={`text-xs font-bold capitalize hidden sm:inline ${step === s ? "text-slate-800" : "text-slate-400"
                    }`}>{s === "input" ? "Resume & JD" : "Role Details"}</span>
                  {i < 1 && <ChevronRight className="h-3 w-3 text-slate-300 ml-auto" />}
                </div>
              ))}
            </div>

            {/* Step 1: Resume + JD */}
            {step === "input" && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mt-6 space-y-4">
                <div>
                  <label className="text-sm font-bold text-slate-700 mb-2 block">Your Resume</label>
                  <NeuCard variant="pressed" className="p-3">
                    <textarea
                      rows={5}
                      value={resumeText}
                      onChange={(e) => setResumeText(e.target.value)}
                      placeholder="Paste your resume text here (LinkedIn About + Experience section works great)..."
                      className="w-full bg-transparent text-sm font-semibold text-slate-800 placeholder:text-slate-400 focus:outline-none resize-none"
                    />
                  </NeuCard>
                </div>
                <div>
                  <label className="text-sm font-bold text-slate-700 mb-2 block">Job Description</label>
                  <NeuCard variant="pressed" className="p-3">
                    <textarea
                      rows={4}
                      value={jdText}
                      onChange={(e) => setJdText(e.target.value)}
                      placeholder="Paste the full job description here..."
                      className="w-full bg-transparent text-sm font-semibold text-slate-800 placeholder:text-slate-400 focus:outline-none resize-none"
                    />
                  </NeuCard>
                </div>
                <NeuButton
                  variant="primary"
                  className="w-full flex items-center justify-center gap-2 py-3.5"
                  onClick={() => {
                    if (!resumeText.trim() || !jdText.trim()) { toast.error("Please fill both fields."); return; }
                    setStep("configure");
                  }}
                >
                  Continue <ChevronRight className="h-4 w-4" />
                </NeuButton>
              </motion.div>
            )}

            {/* Step 2: Role + Company */}
            {step === "configure" && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mt-6 space-y-4">
                <div>
                  <label className="text-sm font-bold text-slate-700">Target Role <span className="text-red-400">*</span></label>
                  <input
                    type="text"
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    placeholder="e.g. Senior Frontend Engineer"
                    className="mt-2 w-full rounded-xl neu-pressed px-4 py-3 text-sm font-semibold text-slate-800 placeholder:text-slate-400 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-sm font-bold text-slate-700">Company (Optional)</label>
                  <input
                    type="text"
                    value={company}
                    onChange={(e) => setCompany(e.target.value)}
                    placeholder="e.g. Google, Stripe"
                    className="mt-2 w-full rounded-xl neu-pressed px-4 py-3 text-sm font-semibold text-slate-800 placeholder:text-slate-400 focus:outline-none"
                  />
                </div>
                <div className="pt-2 flex flex-col sm:flex-row gap-3">
                  <NeuButton onClick={() => setStep("input")} className="flex-1">Back</NeuButton>
                  <NeuButton variant="primary" onClick={handleGenerate} className="flex-1 flex items-center justify-center gap-2">
                    <BrainCircuit className="h-4 w-4" /> Generate Questions
                  </NeuButton>
                </div>
              </motion.div>
            )}

            {/* Generating spinner */}
            {step === "generating" && !generatedId && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center justify-center py-12 gap-6">
                <div className="w-16 h-16 rounded-full border-4 border-slate-200 border-t-blue-500 animate-spin" />
                <p className="text-sm font-bold text-slate-600 animate-pulse">Analyzing your profile & crafting questions...</p>
              </motion.div>
            )}

            {/* Ready to start */}
            {step === "generating" && generatedId && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mt-6 space-y-4">
                <NeuCard className="p-5" variant="pressed">
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                    <div>
                      <p className="text-sm font-bold text-slate-800">Blueprint Ready!</p>
                      <p className="text-xs text-slate-500 mt-0.5">{questionCount} questions generated for <span className="font-bold text-blue-600">{role}</span>{company ? ` @ ${company}` : ""}</p>
                    </div>
                  </div>
                </NeuCard>
                <NeuButton
                  variant="primary"
                  className="w-full flex items-center justify-center gap-2 py-4"
                  onClick={() => navigate(`/interview/${generatedId}`)}
                >
                  <Play className="h-4 w-4" /> Start Interview Now
                </NeuButton>
              </motion.div>
            )}

          </NeuCard>
        </div>

        <RecentSessionsSidebar />
      </div>
    </>
  );
};

/* ===== RECENT SESSIONS SIDEBAR (used in NewInterviewView) ===== */
const RecentSessionsSidebar = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [sessions, setSessions] = useState<Session[]>([]);

  useEffect(() => {
    if (!user) return;
    getSessions(user.id).then(setSessions);
  }, [user]);

  return (
    <div className="lg:col-span-2 space-y-4">
      <h3 className="font-bold text-sm text-slate-800">Recent Sessions</h3>
      {sessions.length === 0 ? (
        <NeuCard className="p-6 text-center" variant="pressed">
          <p className="text-sm text-slate-500 font-semibold">No sessions yet</p>
          <p className="text-xs text-slate-400 mt-1">Complete your first interview to see it here</p>
        </NeuCard>
      ) : sessions.slice(0, 3).map((s) => (
        <button key={s.id} onClick={() => navigate(`/report/${s.id}`)} className="w-full text-left">
          <RecentSessionCard
            title={s.job_role + (s.company ? ` @ ${s.company}` : "")}
            score={s.score}
            date={new Date(s.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
            tags={s.tags.slice(0, 2)}
          />
        </button>
      ))}
    </div>
  );
};

/* ===== VIEW: PAST SESSIONS ===== */
const PastSessionsView = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    getSessions(user.id).then((data) => { setSessions(data); setLoading(false); });
  }, [user]);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
        </div>
      ) : sessions.length === 0 ? (
        <NeuCard className="p-12 text-center">
          <BrainCircuit className="h-12 w-12 text-slate-300 mx-auto mb-4" />
          <h3 className="font-bold text-slate-700 mb-2">No sessions yet</h3>
          <p className="text-sm text-slate-500">Complete your first interview to see your history here.</p>
        </NeuCard>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {sessions.map((s, i) => (
            <motion.div key={s.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
              <button className="w-full text-left" onClick={() => navigate(`/report/${s.id}`)}>
                <RecentSessionCard
                  title={s.job_role + (s.company ? ` @ ${s.company}` : "")}
                  score={s.score}
                  date={new Date(s.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                  tags={s.tags.slice(0, 2)}
                />
              </button>
            </motion.div>
          ))}
        </div>
      )}
    </motion.div>
  );
};

/* ===== VIEW: PROGRESS HUB ===== */
const ProgressHubView = () => (
  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
    {/* Top Section: Overall & Analysis */}
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

      {/* Overall Score */}
      <NeuCard className="lg:col-span-1 flex flex-col items-center justify-center p-8">
        <h3 className="text-slate-500 font-bold text-sm mb-6 uppercase tracking-widest w-full text-center">Overall Fit Score</h3>

        <div className="relative w-48 h-48 mb-8">
          <svg className="w-full h-full transform -rotate-90">
            <circle cx="96" cy="96" r="84" stroke="currentColor" strokeWidth="12" fill="transparent" className="text-slate-200" />
            <circle cx="96" cy="96" r="84" stroke="currentColor" strokeWidth="12" fill="transparent" strokeDasharray="448 528" className="text-blue-500" strokeLinecap="round" />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-6xl font-black text-slate-800">85</span>
            <span className="text-sm font-bold text-slate-400">/ 100</span>
          </div>
        </div>
      </NeuCard>

      {/* Score History Chart Placeholder */}
      <NeuCard className="lg:col-span-2 p-8">
        <div className="flex justify-between items-center mb-6">
          <h3 className="font-bold text-slate-800">Score History</h3>
          <select className="neu-pressed rounded-lg text-xs font-bold text-slate-600 px-3 py-1.5 outline-none cursor-pointer">
            <option>Last 30 Days</option>
          </select>
        </div>

        <div className="h-64 flex items-end justify-between border-b border-slate-200 pb-2 relative px-4">
          {[40, 60, 45, 70, 65, 85, 78].map((val, i) => (
            <div key={i} className="w-8 ml-2 bg-blue-100 hover:bg-blue-300 rounded-t-lg transition-all relative group cursor-pointer neu-flat border-none" style={{ height: `${val}%` }}>
              <div className="absolute -top-8 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 bg-slate-800 text-white text-[10px] font-bold px-2 py-1 rounded transition-opacity">{val}</div>
            </div>
          ))}
        </div>
        <div className="flex justify-between mt-4 text-[10px] font-bold text-slate-400 px-6">
          <span>W1</span><span>W2</span><span>W3</span><span>W4</span><span>W5</span><span>W6</span><span>Now</span>
        </div>
      </NeuCard>
    </div>
  </motion.div>
);

/* ===== VIEW: SKILL MAP ===== */
const SkillMapView = () => (
  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
    {/* Sidebar / Secondary content */}
    <div className="space-y-8">
      <NeuCard className="p-6">
        <h3 className="flex items-center gap-2 font-bold text-slate-800 mb-6">
          <Clock className="h-4 w-4 text-blue-500" /> Recent Sessions
        </h3>
        <div className="space-y-4">
          {[
            { r: "Frontend Engineer", c: "Spotify", t: "2 days ago", s: "82/100" },
            { r: "Full Stack Developer", c: "Stripe", t: "1 week ago", s: "75/100" },
            { r: "System Design", c: "Netflix", t: "2 weeks ago", s: "88/100" },
          ].map((sesh, i) => (
            <div key={i} className="group flex cursor-pointer items-start justify-between rounded-2xl p-4 neu-flat hover:scale-[1.02] transition-transform">
              <div>
                <p className="text-sm font-bold text-slate-800">{sesh.r}</p>
                <p className="text-xs font-semibold text-slate-500">{sesh.c} • {sesh.t}</p>
              </div>
              <div className="flex h-8 w-8 items-center justify-center rounded-full neu-pressed text-xs font-bold text-blue-600">
                <ChevronRight className="h-4 w-4" />
              </div>
            </div>
          ))}
        </div>
        <NeuButton className="w-full mt-6 py-2 text-xs">View All History</NeuButton>
      </NeuCard>

      <NeuCard className="p-6 flex flex-col justify-center items-center text-center">
        <Trophy className="h-12 w-12 text-amber-500 mb-4" />
        <h3 className="text-xl font-bold text-slate-800">Top Achiever</h3>
        <p className="text-xs font-semibold text-slate-500 mt-2">You are currently scoring in the top 15% of all candidates for Senior Frontend roles.</p>
        <NeuButton variant="primary" className="mt-6 text-xs px-6 py-2">View Benchmark</NeuButton>
      </NeuCard>
    </div>
  </motion.div>
);

/* ===== VIEW: PANEL MODE ===== */
const PanelModeView = () => (
  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
    <NeuCard className="p-8">
      <h2 className="text-2xl font-black text-slate-800 mb-4">Panel Interview Mode</h2>
      <p className="text-slate-500 font-medium mb-8">Face multiple specialized AI personas simultaneously for the ultimate stress test.</p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { name: "The Architect", desc: "Rigorous system design and scalability questions.", icon: Brain, color: "text-purple-600" },
          { name: "The Executive", desc: "Focuses on ROI, leadership, and product strategy.", icon: Briefcase, color: "text-emerald-600" },
          { name: "The Debugger", desc: "Deep technical trivia and live bug-hunting.", icon: Zap, color: "text-amber-600" }
        ].map((persona, i) => (
          <NeuCard key={i} className="p-6 text-center group cursor-pointer hover:scale-[1.02] transition-transform">
            <div className="h-16 w-16 mx-auto rounded-full neu-pressed flex items-center justify-center mb-4">
              <persona.icon className={`h-8 w-8 ${persona.color}`} />
            </div>
            <h3 className="font-bold text-slate-800 mb-2">{persona.name}</h3>
            <p className="text-xs font-semibold text-slate-500">{persona.desc}</p>
          </NeuCard>
        ))}
      </div>
      <div className="mt-8 flex justify-center">
        <NeuButton variant="primary" className="px-12 py-4">Start Panel Session</NeuButton>
      </div>
    </NeuCard>
  </motion.div>
);

/* ===== VIEW: MEMORY BANK ===== */
const MemoryBankView = () => (
  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
    <h2 className="font-display text-xl font-bold text-foreground mb-4">Feedback Vault</h2>
    {[
      { icon: Shield, title: "System Design: Microservices", desc: "You struggled to explain when NOT to use microservices. Focus on studying monolithic tradeoffs.", color: "text-blue-400" },
      { icon: TrendingUp, title: "Behavioral: Conflict Resolution", desc: "Excellent framing! Your story about the uncooperative designer was perfectly structured.", color: "text-emerald-400" },
      { icon: AlertCircle, title: "Technical: Time Complexity", desc: "You guessed O(N log N) initially without tracing the loops. Always trace before stating the bounds.", color: "text-amber-400" }
    ].map((item, i) => (
      <NeuCard key={i} className="flex gap-4 p-5 hover:bg-white/5 cursor-pointer">
        <div className={`mt-0.5 p-2 rounded-lg bg-white/5 ${item.color}`}>
          <item.icon className="h-5 w-5 fill-current/20" />
        </div>
        <div>
          <h4 className="font-bold text-sm text-foreground">{item.title}</h4>
          <p className="text-xs text-muted-foreground leading-relaxed mt-1">{item.desc}</p>
        </div>
      </NeuCard>
    ))}
  </motion.div>
);


/* ===== MAIN DASHBOARD ===== */
const Dashboard = () => {
  const [activeTab, setActiveTab] = useState("New Interview");
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState<UserStats | null>(null);

  // Calculate dynamic scroll progress based on the active tab index
  const tabList = ["New Interview", "Past Sessions", "Progress Hub", "Skill Map", "Panel Mode", "Memory Bank", "Jobie Overview"];
  const currentTabIdx = tabList.indexOf(activeTab);
  const targetProgress = currentTabIdx / Math.max(1, tabList.length - 1);

  const rawProgress = useMotionValue(targetProgress);
  const smoothProgress = useSpring(rawProgress, { stiffness: 45, damping: 15 });

  useEffect(() => {
    rawProgress.set(targetProgress);
  }, [targetProgress, rawProgress]);

  useEffect(() => {
    if (user) getUserStats(user.id).then(setStats);
  }, [user]);

  const handleSignOut = async () => {
    await signOut();
    navigate("/auth", { replace: true });
  };

  // Derive display name from user metadata or email
  const displayName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'User';
  const displayEmail = user?.email || '';

  return (
    <div className="min-h-screen bg-deep-space">
      <CursorGlow />
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} onSignOut={handleSignOut} />

      <NeuBackground scrollOverride={smoothProgress} />

      <main className="lg:pl-64 relative z-10 min-h-screen flex flex-col">
        <header className="sticky top-0 z-30 flex h-20 items-center justify-between px-6 lg:px-12 bg-[#e0e5ec]/80 backdrop-blur-md">
          <div>
            <h1 className="font-display text-xl font-black text-slate-800">Welcome back, {displayName} 👋</h1>
            <p className="text-xs font-bold text-slate-500">7-day streak • Keep going!</p>
          </div>
          <div className="flex items-center gap-6">
            {/* Profile Proxy Menu */}
            <div className="flex items-center gap-3 pl-6 border-l border-slate-300">
              <div className="flex flex-col items-end">
                <span className="text-sm font-black text-slate-800 leading-tight">{displayName}</span>
                <span className="text-[10px] font-bold text-slate-500 uppercase">{displayEmail}</span>
              </div>
              <div className="w-10 h-10 rounded-full neu-convex flex items-center justify-center p-0.5">
                <div className="w-full h-full rounded-full bg-blue-100 overflow-hidden shadow-inner flex items-center justify-center text-blue-600 font-black text-lg">
                  {displayName.charAt(0).toUpperCase()}
                </div>
              </div>
            </div>
          </div>
        </header>

        <div className="flex-1 p-6 flex flex-col overflow-y-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="w-full h-full"
            >
              {activeTab === "New Interview" && <NewInterviewView stats={stats} />}
              {activeTab === "Past Sessions" && <PastSessionsView />}
              {activeTab === "Progress Hub" && <ProgressHubView />}
              {activeTab === "Skill Map" && <SkillMapView />}
              {activeTab === "Panel Mode" && <PanelModeView />}
              {activeTab === "Memory Bank" && <MemoryBankView />}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
