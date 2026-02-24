import { useState } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Zap, Upload, FileText, Play, BarChart3, Clock,
  Target, TrendingUp, Brain, Users, Mic, ArrowRight,
  ChevronRight, Star
} from "lucide-react";

const Sidebar = () => (
  <aside className="fixed left-0 top-0 z-40 hidden h-screen w-64 flex-col border-r border-sidebar-border bg-sidebar p-4 lg:flex">
    <Link to="/" className="mb-8 flex items-center gap-2 px-2">
      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-sidebar-primary">
        <Zap className="h-4 w-4 text-sidebar-primary-foreground" />
      </div>
      <span className="font-display text-lg font-bold text-sidebar-foreground">InterviewForge</span>
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
          className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
            item.active
              ? "bg-sidebar-accent text-sidebar-primary"
              : "text-sidebar-foreground/60 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
          }`}
        >
          <item.icon className="h-4 w-4" />
          {item.label}
        </button>
      ))}
    </nav>

    <div className="rounded-xl border border-sidebar-border bg-sidebar-accent p-4">
      <p className="text-xs font-semibold text-sidebar-primary">Pro Plan</p>
      <p className="mt-1 text-xs text-sidebar-foreground/60">Unlimited interviews</p>
      <div className="mt-2 h-1.5 w-full rounded-full bg-sidebar-border">
        <div className="h-full w-3/4 rounded-full bg-sidebar-primary" />
      </div>
      <p className="mt-1 text-[10px] text-sidebar-foreground/40">18 of 24 sessions this month</p>
    </div>
  </aside>
);

const stats = [
  { label: "Sessions", value: "24", icon: Play, change: "+6 this week" },
  { label: "Avg Score", value: "78", icon: TrendingUp, change: "+12 pts" },
  { label: "Streak", value: "7 days", icon: Star, change: "Personal best!" },
  { label: "Skills Improved", value: "5", icon: Target, change: "STAR, System Design..." },
];

const SetupCard = () => {
  const [step, setStep] = useState<"upload" | "configure" | "ready">("upload");

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl border border-border bg-card p-8 shadow-card"
    >
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
          <Mic className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h2 className="font-display text-xl font-bold text-card-foreground">Start New Mock Interview</h2>
          <p className="text-sm text-muted-foreground">Upload your resume & paste the job description</p>
        </div>
      </div>

      <div className="mt-6 flex gap-2">
        {["upload", "configure", "ready"].map((s, i) => (
          <div key={s} className="flex flex-1 items-center gap-2">
            <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
              step === s ? "bg-primary text-primary-foreground" :
              i < ["upload", "configure", "ready"].indexOf(step)
                ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground"
            }`}>
              {i + 1}
            </div>
            <span className="text-xs font-medium text-muted-foreground capitalize hidden sm:inline">{s}</span>
            {i < 2 && <ChevronRight className="h-3 w-3 text-muted-foreground/40 ml-auto" />}
          </div>
        ))}
      </div>

      {step === "upload" && (
        <div className="mt-6 space-y-4">
          <div
            className="flex cursor-pointer flex-col items-center gap-3 rounded-xl border-2 border-dashed border-border p-8 transition-colors hover:border-primary/40 hover:bg-primary/5"
            onClick={() => setStep("configure")}
          >
            <Upload className="h-8 w-8 text-muted-foreground" />
            <p className="text-sm font-medium text-card-foreground">Drop your resume here</p>
            <p className="text-xs text-muted-foreground">PDF, DOCX, or paste text</p>
          </div>
          <div className="rounded-xl border border-border p-4">
            <label className="text-sm font-medium text-card-foreground">Job Description</label>
            <textarea
              className="mt-2 w-full rounded-lg border border-input bg-background p-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              rows={3}
              placeholder="Paste the job description or LinkedIn URL..."
              onFocus={() => setStep("configure")}
            />
          </div>
        </div>
      )}

      {step === "configure" && (
        <div className="mt-6 space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            {[
              { label: "Interview Type", options: ["Behavioral", "Technical", "System Design", "Mixed"] },
              { label: "Difficulty", options: ["Junior", "Mid-Level", "Senior", "Staff+"] },
            ].map((field) => (
              <div key={field.label}>
                <label className="text-sm font-medium text-card-foreground">{field.label}</label>
                <div className="mt-2 flex flex-wrap gap-2">
                  {field.options.map((opt, i) => (
                    <button
                      key={opt}
                      className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${
                        i === 0
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border text-muted-foreground hover:border-primary/40"
                      }`}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <div className="flex items-center gap-3 rounded-xl bg-primary/5 p-4">
            <Brain className="h-5 w-5 text-primary" />
            <div>
              <p className="text-sm font-medium text-card-foreground">Memory Active</p>
              <p className="text-xs text-muted-foreground">2 past weaknesses detected: STAR format, conciseness</p>
            </div>
          </div>
          <Button variant="hero" className="w-full" size="lg" onClick={() => setStep("ready")}>
            Analyze & Generate Questions
            <ArrowRight className="ml-1 h-4 w-4" />
          </Button>
        </div>
      )}

      {step === "ready" && (
        <div className="mt-6 space-y-4">
          <div className="rounded-xl border border-primary/20 bg-primary/5 p-4">
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-primary" />
              <p className="text-sm font-semibold text-card-foreground">Interview Blueprint Ready</p>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">12 questions generated • 35 min estimated • Behavioral + Technical</p>
            <div className="mt-3 grid grid-cols-5 gap-1">
              {["Content", "Structure", "Delivery", "Non-verbal", "Relevance"].map((s) => (
                <div key={s} className="text-center">
                  <div className="mx-auto h-8 w-8 rounded-full border-2 border-primary/30 flex items-center justify-center text-[10px] font-bold text-primary">
                    {Math.floor(Math.random() * 30 + 60)}
                  </div>
                  <p className="mt-1 text-[9px] text-muted-foreground">{s}</p>
                </div>
              ))}
            </div>
          </div>
          <Button variant="hero" size="lg" className="w-full animate-pulse-glow">
            <Play className="mr-1 h-4 w-4" /> Start Interview Now
          </Button>
        </div>
      )}
    </motion.div>
  );
};

const RecentSession = ({ title, score, date, tags }: { title: string; score: number; date: string; tags: string[] }) => (
  <div className="flex items-center gap-4 rounded-xl border border-border bg-card p-4 transition-all hover:shadow-card-hover hover:-translate-y-0.5">
    <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl font-display text-lg font-black ${
      score >= 80 ? "bg-primary/10 text-primary" : score >= 60 ? "bg-accent/10 text-accent" : "bg-destructive/10 text-destructive"
    }`}>
      {score}
    </div>
    <div className="flex-1 min-w-0">
      <p className="font-medium text-card-foreground truncate">{title}</p>
      <div className="mt-1 flex items-center gap-2">
        <span className="text-xs text-muted-foreground">{date}</span>
        {tags.map((t) => (
          <span key={t} className="rounded-md bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">{t}</span>
        ))}
      </div>
    </div>
    <Button variant="ghost" size="icon">
      <ChevronRight className="h-4 w-4" />
    </Button>
  </div>
);

const Dashboard = () => (
  <div className="min-h-screen bg-background">
    <Sidebar />
    <main className="lg:pl-64">
      <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border bg-background/80 backdrop-blur-sm px-6">
        <div>
          <h1 className="font-display text-lg font-bold text-foreground">Welcome back, Alex 👋</h1>
          <p className="text-xs text-muted-foreground">7-day streak • Keep going!</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold text-primary">A</div>
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
              transition={{ delay: i * 0.1 }}
              className="rounded-xl border border-border bg-card p-5 shadow-card"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-muted-foreground">{stat.label}</span>
                <stat.icon className="h-4 w-4 text-primary" />
              </div>
              <p className="mt-2 font-display text-2xl font-black text-card-foreground">{stat.value}</p>
              <p className="mt-1 text-xs text-primary">{stat.change}</p>
            </motion.div>
          ))}
        </div>

        {/* Main content grid */}
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
