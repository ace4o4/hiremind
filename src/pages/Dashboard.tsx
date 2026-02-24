import { useState } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Zap, Upload, FileText, Play, BarChart3, Clock,
  Target, TrendingUp, Brain, Users, Mic, ArrowRight,
  ChevronRight, Star, Settings
} from "lucide-react";
import { GlassCard, AmbientOrb, FloatingParticles, CursorGlow } from "@/components/LiquidGlass";

/* ===== SIDEBAR ===== */
const Sidebar = () => (
  <aside className="fixed left-0 top-0 z-40 hidden h-screen w-64 flex-col glass-sidebar p-4 lg:flex">
    <Link to="/" className="mb-8 flex items-center gap-2.5 px-2">
      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/20 border border-primary/30">
        <Zap className="h-4 w-4 text-primary" />
      </div>
      <span className="font-display text-lg font-bold text-sidebar-foreground">
        Interview<span className="text-primary">Guru</span>
      </span>
    </Link>

    <nav className="flex flex-1 flex-col gap-1">
      {[
        { icon: Play, label: "New Interview", active: true },
        { icon: Clock, label: "Past Sessions" },
        { icon: BarChart3, label: "Progress Hub" },
        { icon: Target, label: "Skill Map" },
        { icon: Users, label: "Panel Mode" },
        { icon: Brain, label: "Memory Bank" },
      ].map((item) => (
        <button
          key={item.label}
          className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-300 ${
            item.active
              ? "glass-card bg-primary/5 text-primary border-primary/20 glow-teal"
              : "text-sidebar-foreground/50 hover:text-sidebar-foreground hover:bg-white/[0.03] border border-transparent"
          }`}
        >
          <item.icon className="h-4 w-4" />
          {item.label}
        </button>
      ))}
    </nav>

    <div className="glass-card rounded-xl p-4">
      <p className="text-xs font-semibold text-primary text-glow">Pro Plan</p>
      <p className="mt-1 text-xs text-sidebar-foreground/50">Unlimited interviews</p>
      <div className="mt-3 h-1.5 w-full rounded-full bg-white/[0.06] overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: "75%" }}
          transition={{ duration: 1.2, ease: "easeOut" }}
          className="h-full rounded-full bg-gradient-to-r from-primary to-teal-glow"
          style={{ boxShadow: "0 0 10px hsl(168 100% 48% / 0.4)" }}
        />
      </div>
      <p className="mt-1.5 text-[10px] text-sidebar-foreground/30">18 of 24 sessions this month</p>
    </div>
  </aside>
);

/* ===== STATS ===== */
const stats = [
  { label: "Sessions", value: "24", icon: Play, change: "+6 this week", color: "teal" as const },
  { label: "Avg Score", value: "78", icon: TrendingUp, change: "+12 pts", color: "purple" as const },
  { label: "Streak", value: "7 days", icon: Star, change: "Personal best!", color: "warm" as const },
  { label: "Skills Improved", value: "5", icon: Target, change: "STAR, System Design...", color: "teal" as const },
];

/* ===== SETUP CARD ===== */
const SetupCard = () => {
  const [step, setStep] = useState<"upload" | "configure" | "ready">("upload");

  return (
    <GlassCard className="p-8" glowColor="teal">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 border border-primary/20 glow-teal">
          <Mic className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h2 className="font-display text-xl font-bold text-foreground">Start New Mock Interview</h2>
          <p className="text-sm text-muted-foreground">Upload your resume & paste the job description</p>
        </div>
      </div>

      {/* Step indicator */}
      <div className="mt-6 flex gap-2">
        {(["upload", "configure", "ready"] as const).map((s, i) => (
          <div key={s} className="flex flex-1 items-center gap-2">
            <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold transition-all duration-500 ${
              step === s
                ? "bg-primary text-primary-foreground glow-teal"
                : i < ["upload", "configure", "ready"].indexOf(step)
                  ? "bg-primary/20 text-primary"
                  : "bg-white/[0.06] text-muted-foreground"
            }`}>
              {i + 1}
            </div>
            <span className="text-xs font-medium text-muted-foreground capitalize hidden sm:inline">{s}</span>
            {i < 2 && <ChevronRight className="h-3 w-3 text-muted-foreground/30 ml-auto" />}
          </div>
        ))}
      </div>

      {step === "upload" && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mt-6 space-y-4">
          <div
            className="flex cursor-pointer flex-col items-center gap-3 rounded-xl border border-dashed border-white/[0.1] p-8 transition-all hover:border-primary/30 hover:bg-primary/[0.03] group"
            onClick={() => setStep("configure")}
          >
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 border border-primary/20 group-hover:glow-teal transition-all">
              <Upload className="h-6 w-6 text-muted-foreground group-hover:text-primary transition-colors" />
            </div>
            <p className="text-sm font-medium text-foreground">Drop your resume here</p>
            <p className="text-xs text-muted-foreground">PDF, DOCX, or paste text</p>
          </div>
          <div className="glass-card rounded-xl p-4">
            <label className="text-sm font-medium text-foreground">Job Description</label>
            <textarea
              className="mt-2 w-full rounded-lg bg-white/[0.03] border border-white/[0.08] p-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/30 focus:ring-1 focus:ring-primary/20 transition-all"
              rows={3}
              placeholder="Paste the job description or LinkedIn URL..."
              onFocus={() => setStep("configure")}
            />
          </div>
        </motion.div>
      )}

      {step === "configure" && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mt-6 space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            {[
              { label: "Interview Type", options: ["Behavioral", "Technical", "System Design", "Mixed"] },
              { label: "Difficulty", options: ["Junior", "Mid-Level", "Senior", "Staff+"] },
            ].map((field) => (
              <div key={field.label}>
                <label className="text-sm font-medium text-foreground">{field.label}</label>
                <div className="mt-2 flex flex-wrap gap-2">
                  {field.options.map((opt, i) => (
                    <button
                      key={opt}
                      className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
                        i === 0
                          ? "bg-primary/15 text-primary border border-primary/30 glow-teal"
                          : "btn-glass text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <div className="flex items-center gap-3 glass-card rounded-xl p-4 border-primary/20">
            <Brain className="h-5 w-5 text-primary" />
            <div>
              <p className="text-sm font-medium text-foreground">Memory Active</p>
              <p className="text-xs text-muted-foreground">2 past weaknesses detected: STAR format, conciseness</p>
            </div>
          </div>
          <button
            className="btn-liquid w-full rounded-xl py-3 text-sm font-bold text-primary-foreground flex items-center justify-center gap-2"
            onClick={() => setStep("ready")}
          >
            Analyze & Generate Questions
            <ArrowRight className="h-4 w-4" />
          </button>
        </motion.div>
      )}

      {step === "ready" && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mt-6 space-y-4">
          <div className="glass-card rounded-xl p-4 border-primary/20">
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-primary" />
              <p className="text-sm font-semibold text-foreground">Interview Blueprint Ready</p>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">12 questions generated • 35 min estimated • Behavioral + Technical</p>
            <div className="mt-3 grid grid-cols-5 gap-1">
              {["Content", "Structure", "Delivery", "Non-verbal", "Relevance"].map((s) => (
                <div key={s} className="text-center">
                  <div className="mx-auto h-8 w-8 rounded-full border border-primary/30 flex items-center justify-center text-[10px] font-bold text-primary bg-primary/5">
                    {Math.floor(Math.random() * 30 + 60)}
                  </div>
                  <p className="mt-1 text-[9px] text-muted-foreground">{s}</p>
                </div>
              ))}
            </div>
          </div>
          <button className="btn-liquid w-full rounded-xl py-3.5 text-sm font-bold text-primary-foreground flex items-center justify-center gap-2 animate-pulse-glow">
            <Play className="h-4 w-4" /> Start Interview Now
          </button>
        </motion.div>
      )}
    </GlassCard>
  );
};

/* ===== RECENT SESSION ===== */
const RecentSession = ({ title, score, date, tags }: { title: string; score: number; date: string; tags: string[] }) => (
  <GlassCard className="flex items-center gap-4 p-4 cursor-pointer" glowColor={score >= 80 ? "teal" : "purple"}>
    <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl font-display text-lg font-black border ${
      score >= 80
        ? "bg-primary/10 text-primary border-primary/20"
        : score >= 60
          ? "bg-purple/10 text-purple border-purple/20"
          : "bg-destructive/10 text-destructive border-destructive/20"
    }`}>
      {score}
    </div>
    <div className="flex-1 min-w-0">
      <p className="font-medium text-foreground truncate">{title}</p>
      <div className="mt-1 flex items-center gap-2">
        <span className="text-xs text-muted-foreground">{date}</span>
        {tags.map((t) => (
          <span key={t} className="rounded-md bg-white/[0.04] border border-white/[0.06] px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">{t}</span>
        ))}
      </div>
    </div>
    <ChevronRight className="h-4 w-4 text-muted-foreground/40" />
  </GlassCard>
);

/* ===== MAIN DASHBOARD ===== */
const Dashboard = () => (
  <div className="min-h-screen bg-deep-space">
    <CursorGlow />
    <Sidebar />

    {/* Background ambient effects */}
    <div className="fixed inset-0 pointer-events-none overflow-hidden">
      <AmbientOrb color="teal" size={500} className="top-[-10%] right-[20%]" />
      <AmbientOrb color="purple" size={400} className="bottom-[10%] left-[30%]" delay={2} />
    </div>

    <main className="lg:pl-64 relative z-10">
      <header className="sticky top-0 z-30 flex h-16 items-center justify-between glass-nav px-6">
        <div>
          <h1 className="font-display text-lg font-bold text-foreground">Welcome back, Alex 👋</h1>
          <p className="text-xs text-muted-foreground">7-day streak • Keep going!</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="btn-glass rounded-lg p-2">
            <Settings className="h-4 w-4 text-muted-foreground" />
          </button>
          <div className="h-8 w-8 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center text-xs font-bold text-primary glow-teal">A</div>
        </div>
      </header>

      <div className="p-6 space-y-6">
        {/* Stats */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1, type: "spring" }}
            >
              <GlassCard className="p-5" glowColor={stat.color}>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-muted-foreground">{stat.label}</span>
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10 border border-primary/20">
                    <stat.icon className="h-3.5 w-3.5 text-primary" />
                  </div>
                </div>
                <p className="mt-2 font-display text-2xl font-black text-foreground">{stat.value}</p>
                <p className="mt-1 text-xs text-primary text-glow">{stat.change}</p>
              </GlassCard>
            </motion.div>
          ))}
        </div>

        {/* Main content */}
        <div className="grid gap-6 lg:grid-cols-5">
          <div className="lg:col-span-3">
            <SetupCard />
          </div>
          <div className="lg:col-span-2 space-y-4">
            <h3 className="font-display text-sm font-semibold text-foreground">Recent Sessions</h3>
            <RecentSession title="Amazon SDE-2 Behavioral" score={82} date="Today" tags={["Behavioral", "Senior"]} />
            <RecentSession title="Google System Design" score={71} date="Yesterday" tags={["Technical", "Staff"]} />
            <RecentSession title="Flipkart PM Round" score={68} date="Feb 20" tags={["PM", "Mixed"]} />
            <RecentSession title="Startup CTO Panel" score={89} date="Feb 18" tags={["Panel", "Leadership"]} />
          </div>
        </div>
      </div>
    </main>
  </div>
);

export default Dashboard;
