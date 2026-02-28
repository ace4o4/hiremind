import { useState, useEffect } from "react";
import { motion, AnimatePresence, useMotionValue, useSpring } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Zap, FileText, Play, BarChart3, Clock,
  Target, Brain, Users, TrendingUp, AlertCircle,
  ChevronRight, Star, CheckCircle2, Shield,
  Share2, Download, Trophy, XCircle, AlertTriangle, BrainCircuit,
  LayoutDashboard, MessageSquare, Briefcase, ArrowUpRight, StopCircle, RefreshCw, Upload, Eye, LogOut
} from "lucide-react";
import { CursorGlow, NeuCard, NeuButton, NeuBackground } from "@/components/LiquidGlass";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useAuth } from "@/contexts/AuthContext";
import { getInterviewSessions, getUserProfile } from "@/lib/api";

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

/* ===== STATS DATA ===== */
const statsData = [
  { label: "Sessions", value: "24", icon: Play, change: "+6 this week", color: "teal" as const },
  { label: "Avg Score", value: "78", icon: ArrowUpRight, change: "+12 pts", color: "purple" as const },
  { label: "Streak", value: "7 days", icon: Star, change: "Personal best!", color: "warm" as const },
  { label: "Skills Improved", value: "5", icon: Target, change: "STAR, System Design...", color: "teal" as const },
];

/* ===== RECENT SESSION BLOCK ===== */
const RecentSessionCard = ({ id = "mock-id", title, score, date, tags }: { id?: string; title: string; score: number; date: string; tags: string[] }) => (
  <Link to={`/report`} className="block group">
    <NeuCard className="flex items-center gap-4 p-4 cursor-pointer group-hover:bg-white/5 transition-colors">
      <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl font-display text-lg font-black border ${score >= 80
          ? "bg-primary/10 text-primary border-primary/20"
          : score >= 60
            ? "bg-purple-500/10 text-purple border-purple-500/20"
            : "bg-destructive/10 text-destructive border-destructive/20"
        }`}>
        {score}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-bold text-slate-800 truncate group-hover:text-blue-600 transition-colors">{title}</p>
        <div className="mt-1 flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-500">{date}</span>
          <div className="flex items-center gap-1">
            {tags.map((t) => (
              <span key={t} className="neu-pressed px-2 py-0.5 rounded-full text-[10px] font-bold text-slate-500">{t}</span>
            ))}
          </div>
        </div>
      </div>
      <ChevronRight className="h-4 w-4 text-slate-400 group-hover:text-blue-500 transition-colors" />
    </NeuCard>
  </Link>
);

const NewInterviewView = ({ sessions, profile }: { sessions: any[], profile: any }) => {
  const navigate = useNavigate();
  const [step, setStep] = useState<"upload" | "configure" | "ready" | "generating">("upload");
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [jobDescription, setJobDescription] = useState("");
  const [dragActive, setDragActive] = useState(false);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setResumeFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      setResumeFile(e.target.files[0]);
    }
  };

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-6">
        {statsData.map((stat, i) => {
          let value = stat.value;
          if (stat.label === "Sessions") value = sessions.length.toString();
          if (stat.label === "Streak") value = `${profile?.current_streak || 0} days`;
          
          return (
          <motion.div key={stat.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1, type: "spring" }}>
            <NeuCard className="p-5" as="div">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500">{stat.label}</span>
                <div className="flex h-7 w-7 items-center justify-center rounded-lg neu-pressed text-blue-600">
                  <stat.icon className="h-3.5 w-3.5" />
                </div>
              </div>
              <p className="mt-2 font-display text-2xl font-black text-slate-800">{value}</p>
              <p className="mt-1 text-xs font-bold text-blue-500">{stat.change}</p>
            </NeuCard>
          </motion.div>
        )})}
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        <div className="lg:col-span-3">
          <NeuCard className="p-8">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl neu-pressed text-blue-600">
                  <BrainCircuit className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="font-display text-xl font-bold text-slate-800">Start New Mock Interview</h2>
                  <p className="text-sm font-semibold text-slate-500">Upload your resume & paste the job description</p>
                </div>
              </div>
              
              <NeuButton 
                variant="primary" 
                className="px-6 py-2 bg-blue-600 text-white font-bold"
                onClick={() => navigate('/audio-setup')}
              >
                Launch Audio Coach &rarr;
              </NeuButton>
            </div>

            <div className="mt-6 flex gap-2">
              {(["upload", "configure", "ready"] as const).map((s, i) => (
                <div key={s} className="flex flex-1 items-center gap-2">
                  <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold transition-all duration-500 ${step === s ? "neu-convex text-blue-600" : i < ["upload", "configure", "ready"].indexOf(step) ? "neu-flat text-blue-500" : "neu-pressed text-slate-400"
                    }`}>
                    {i + 1}
                  </div>
                  <span className={`text-xs font-bold capitalize hidden sm:inline ${step === s ? 'text-slate-800' : 'text-slate-400'}`}>{s}</span>
                  {i < 2 && <ChevronRight className="h-3 w-3 text-slate-300 ml-auto" />}
                </div>
              ))}
            </div>

            {step === "upload" && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mt-6 space-y-4">
                <div 
                  className={`relative flex flex-col items-center gap-3 rounded-2xl border-2 border-dashed p-8 transition-all ${dragActive ? 'border-blue-500 bg-blue-50/50' : 'border-slate-300 hover:border-blue-400 hover:bg-blue-50'} group`}
                  onDragEnter={handleDrag}
                  onDragLeave={handleDrag}
                  onDragOver={handleDrag}
                  onDrop={handleDrop}
                >
                  <input 
                    type="file" 
                    id="resume-upload" 
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" 
                    accept=".pdf,.doc,.docx"
                    onChange={handleChange}
                  />
                  <div className={`flex h-14 w-14 items-center justify-center rounded-2xl transition-colors ${resumeFile ? 'neu-convex text-green-500' : 'neu-flat text-blue-500 group-hover:text-blue-600'}`}>
                    {resumeFile ? <CheckCircle2 className="h-6 w-6" /> : <Upload className="h-6 w-6" />}
                  </div>
                  {resumeFile ? (
                    <div className="text-center relative z-20 flex flex-col items-center">
                      <p className="text-sm font-bold text-slate-800">{resumeFile.name}</p>
                      <div className="flex items-center justify-center gap-3 mt-2">
                        <span className="text-xs font-semibold text-green-600">Ready for analysis</span>
                        <button 
                          onClick={(e) => { e.preventDefault(); e.stopPropagation(); setResumeFile(null); }}
                          className="flex items-center gap-1 text-xs font-bold text-red-500 hover:text-red-700 bg-red-500/10 hover:bg-red-500/20 px-2 py-1 rounded-md transition-colors cursor-pointer"
                        >
                          <XCircle className="w-3 h-3" /> Remove
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center">
                      <p className="text-sm font-bold text-slate-700">Drop your resume here, or click to browse</p>
                      <p className="text-xs font-semibold text-slate-500 mt-1">PDF, DOC, or DOCX up to 5MB</p>
                    </div>
                  )}
                </div>

                <NeuCard className="p-4" variant="pressed">
                  <label className="text-sm font-bold text-slate-700 mb-2 block">Job Description Context</label>
                  <textarea 
                    rows={3} 
                    value={jobDescription}
                    onChange={(e) => setJobDescription(e.target.value)}
                    placeholder="Paste the job description or LinkedIn URL..." 
                    className="w-full bg-transparent p-0 text-sm font-semibold text-slate-800 placeholder:text-slate-400 focus:outline-none resize-none" 
                  />
                </NeuCard>

                <div className="flex justify-end pt-2">
                  <NeuButton 
                    variant="primary" 
                    onClick={() => setStep("configure")} 
                    className={`text-white px-8 ${!resumeFile && !jobDescription.trim() ? 'opacity-50 cursor-not-allowed' : ''}`}
                    disabled={!resumeFile && !jobDescription.trim()}
                  >
                    Continue <ChevronRight className="w-4 h-4 ml-2" />
                  </NeuButton>
                </div>
              </motion.div>
            )}

            {step === "configure" && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mt-6 space-y-4">
                <div>
                  <label className="text-sm font-bold text-slate-700">Target Role</label>
                  <input type="text" placeholder="e.g. Senior Frontend Engineer" className="mt-2 w-full rounded-xl neu-pressed px-4 py-3 text-sm font-semibold text-slate-800 placeholder:text-slate-400 focus:outline-none" />
                </div>
                <div>
                  <label className="text-sm font-bold text-slate-700">Company Context (Optional)</label>
                  <input type="text" placeholder="e.g. Google, Stripe" className="mt-2 w-full rounded-xl neu-pressed px-4 py-3 text-sm font-semibold text-slate-800 placeholder:text-slate-400 focus:outline-none" />
                </div>

                <div className="pt-4 flex flex-col sm:flex-row gap-4">
                  <NeuButton onClick={() => setStep("upload")} className="flex-1">Back</NeuButton>
                  <NeuButton variant="primary" onClick={() => setStep("generating")} className="flex-1 text-white">Generate Tracks</NeuButton>
                </div>
              </motion.div>
            )}

            {step === "generating" && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center justify-center py-12 gap-6">
                <div className="w-16 h-16 rounded-full border-4 border-slate-200 border-t-blue-500 animate-spin" />
                <p className="text-sm font-bold text-slate-600 animate-pulse">Analyzing profile & drafting questions...</p>
              </motion.div>
            )}

            {step === "ready" && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mt-6 space-y-4">
                <NeuCard className="p-4" variant="pressed">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-blue-500" />
                    <p className="text-sm font-bold text-slate-800">Blueprint Ready</p>
                  </div>
                  <p className="mt-1 text-xs font-semibold text-slate-500">12 questions generated • 35 min estimated</p>
                </NeuCard>
                <Link to="/report" className="block w-full">
                  <NeuButton variant="primary" className="w-full justify-center gap-2 py-4">
                    <Play className="h-4 w-4" /> Mock Interview & View Report
                  </NeuButton>
                </Link>
              </motion.div>
            )}
          </NeuCard>
        </div>

        <div className="lg:col-span-2 space-y-4">
          <h3 className="font-bold text-sm text-slate-800">Recent Sessions</h3>
          {sessions.slice(0, 3).map((s: any, i: number) => (
             <RecentSessionCard 
               key={i}
               title={s.company_focus ? `${s.company_focus} ${s.role_focus}` : 'General Mock Interview'} 
               score={s.score || 0} 
               date={new Date(s.created_at).toLocaleDateString()} 
               tags={[s.company_focus || 'Tech', s.role_focus || 'Role']} 
             />
          ))}
          {sessions.length === 0 && (
            <div className="p-4 text-center rounded-xl neu-flat">
               <p className="text-xs font-bold text-slate-500">No recent sessions yet.</p>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

/* ===== VIEW: PAST SESSIONS ===== */
const PastSessionsView = ({ sessions }: { sessions: any[] }) => {
  const [filter, setFilter] = useState("All");
  
  // Create a mapping or derive tags safely if they don't exist yet
  const formattedSessions = sessions.map(s => ({
    title: s.company_focus ? `${s.company_focus} ${s.role_focus}` : 'General Mock Interview',
    score: s.score || 0,
    date: new Date(s.created_at).toLocaleDateString(),
    tags: [s.company_focus || 'Tech', s.role_focus || 'Role'],
    type: "Technical" // Dummy type for filtering until added to DB
  }));

  const filtered = filter === "All" ? formattedSessions : formattedSessions.filter(s => s.type === filter);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div className="flex items-center gap-3 bg-white/[0.03] p-1.5 rounded-xl border border-white/[0.06] w-fit">
        {["All", "Technical", "Behavioral", "Mixed"].map(f => (
          <button key={f} onClick={() => setFilter(f)} className={`px-4 py-1.5 text-xs font-semibold rounded-lg transition-all ${filter === f ? "bg-primary/20 text-primary border-primary/30 shadow-sm" : "hover:bg-white/5 text-muted-foreground"}`}>
            {f}
          </button>
        ))}
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filtered.map((s, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
            <RecentSessionCard {...s} />
          </motion.div>
        ))}
        {filtered.length === 0 && (
          <div className="col-span-full py-12 text-center">
            <p className="text-slate-500 font-bold">No sessions found yet. Start your first mock interview!</p>
          </div>
        )}
      </div>
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
const PanelModeView = () => {
  const navigate = useNavigate();
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const personas = [
    { 
      id: "p1", name: "The Architect", desc: "Strict system design, scalability, and code structure focus.", icon: Brain, color: "text-purple-600",
      avatarUrl: "https://images.unsplash.com/photo-1560250097-0b93528c311a?q=80&w=600&auto=format&fit=crop",
      simliFaceId: "tmp9c84fa1b-d1ec-4c17-9005-ed9c68097d2d", // Example male professional face
      voiceParams: { pitch: 0.8, rate: 1.0 }
    },
    { 
      id: "p2", name: "The Executive", desc: "Lenient and focuses on ROI, leadership, and product strategy.", icon: Briefcase, color: "text-emerald-600",
      avatarUrl: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=600&auto=format&fit=crop",
      simliFaceId: "c2c5eb29-2ec8-4903-abd6-946460fae2fc", // Example female professional face
      voiceParams: { pitch: 1.2, rate: 0.95 }
    },
    { 
      id: "p3", name: "The Debugger", desc: "Deep technical trivia, live bug-hunting, extremely logical.", icon: Zap, color: "text-amber-600",
      avatarUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=600&auto=format&fit=crop",
      simliFaceId: "5514e24d-6086-46a3-ace4-6a7264e5cb7c", // Example distinct male face
      voiceParams: { pitch: 1.0, rate: 1.1 }
    }
  ];

  const handleSelect = (id: string) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter(x => x !== id));
    } else {
      if (selectedIds.length < 2) {
        setSelectedIds([...selectedIds, id]);
      }
    }
  };

  const startSession = () => {
    if (selectedIds.length === 0) return;
    const selectedPersonas = personas
      .filter(p => selectedIds.includes(p.id))
      .map(({ icon, ...serializablePersona }) => serializablePersona); // Strip non-serializable React Component
      
    navigate('/virtual-room', { state: { selectedPersonas } });
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <NeuCard className="p-8">
        <h2 className="text-2xl font-black text-slate-800 mb-2">Panel Interview Mode</h2>
        <p className="text-slate-500 font-medium mb-8">Face multiple specialized AI personas simultaneously. <strong className="text-slate-700">Select up to 2 interviewers.</strong></p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {personas.map((persona) => {
            const isSelected = selectedIds.includes(persona.id);
            return (
              <NeuCard 
                key={persona.id} 
                className={`p-6 text-center group cursor-pointer transition-all duration-300 ${isSelected ? 'ring-2 ring-blue-500 shadow-md bg-blue-50/10' : 'hover:scale-[1.02]'}`}
                onClick={() => handleSelect(persona.id)}
              >
                <div className={`h-16 w-16 mx-auto rounded-full flex items-center justify-center mb-4 transition-colors ${isSelected ? 'bg-blue-100' : 'neu-pressed'}`}>
                  <persona.icon className={`h-8 w-8 ${isSelected ? 'text-blue-600' : persona.color}`} />
                </div>
                <h3 className="font-bold text-slate-800 mb-2">{persona.name}</h3>
                <p className="text-xs font-semibold text-slate-500">{persona.desc}</p>
                {isSelected && (
                  <div className="mt-4 flex justify-center">
                    <span className="bg-blue-500 text-white text-[10px] font-bold px-3 py-1 rounded-full flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> Selected
                    </span>
                  </div>
                )}
              </NeuCard>
            );
          })}
        </div>
        <div className="mt-8 flex flex-col items-center">
          <NeuButton 
            variant="primary" 
            className="px-12 py-4 text-white disabled:opacity-50 disabled:cursor-not-allowed" 
            disabled={selectedIds.length === 0}
            onClick={startSession}
          >
            Start Panel Session ({selectedIds.length}/2)
          </NeuButton>
        </div>
      </NeuCard>
    </motion.div>
  );
};

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
  
  const [profile, setProfile] = useState<any>(null);
  const [sessions, setSessions] = useState<any[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  // Calculate dynamic scroll progress based on the active tab index
  const tabList = ["New Interview", "Past Sessions", "Progress Hub", "Skill Map", "Panel Mode", "Memory Bank", "Jobie Overview"];
  const currentTabIdx = tabList.indexOf(activeTab);
  const targetProgress = currentTabIdx / Math.max(1, tabList.length - 1);

  const rawProgress = useMotionValue(targetProgress);
  const smoothProgress = useSpring(rawProgress, { stiffness: 45, damping: 15 });

  useEffect(() => {
    rawProgress.set(targetProgress);
  }, [targetProgress, rawProgress]);
  
  // Fetch real data from Supabase
  useEffect(() => {
    const loadData = async () => {
      if (!user) return;
      try {
        setLoadingData(true);
        const [profileData, sessionsData] = await Promise.all([
          getUserProfile(user.id).catch(() => null), // Graceful fail if profile not trigger-created yet
          getInterviewSessions(user.id)
        ]);
        setProfile(profileData);
        setSessions(sessionsData || []);
      } catch (err) {
        console.error("Failed to load dashboard data", err);
      } finally {
        setLoadingData(false);
      }
    };
    
    loadData();
  }, [user]);

  const handleSignOut = async () => {
    await signOut();
    navigate("/auth", { replace: true });
  };

  // Derive display name from user metadata or email
  const displayName = profile?.full_name || user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'User';
  const displayEmail = user?.email || '';
  const streak = profile?.current_streak || 0;

  return (
    <div className="min-h-screen bg-deep-space">
      <CursorGlow />
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} onSignOut={handleSignOut} />

      <NeuBackground scrollOverride={smoothProgress} />

      <main className="lg:pl-64 relative z-10 min-h-screen flex flex-col">
        <header className="sticky top-0 z-30 flex h-20 items-center justify-between px-6 lg:px-12 bg-[#e0e5ec]/80 backdrop-blur-md">
          <div>
            <h1 className="font-display text-xl font-black text-slate-800">Welcome back, {displayName} 👋</h1>
            <p className="text-xs font-bold text-slate-500">{streak}-day streak • Keep going!</p>
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
              {activeTab === "New Interview" && <NewInterviewView sessions={sessions} profile={profile} />}
              {activeTab === "Past Sessions" && <PastSessionsView sessions={sessions} />}
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
