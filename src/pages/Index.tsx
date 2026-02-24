import { motion, useScroll, useTransform } from "framer-motion";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Brain, Zap, Users, Shield, ArrowRight, Sparkles, Play, Menu, X } from "lucide-react";
import { GlassCard, AmbientOrb, FloatingParticles, CursorGlow } from "@/components/LiquidGlass";
import { useRef, useState } from "react";

/* ===== NAVBAR ===== */
const Navbar = () => {
  const [open, setOpen] = useState(false);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 glass-nav">
      <div className="container mx-auto flex h-16 items-center justify-between px-6">
        <Link to="/" className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/20 border border-primary/30 glow-teal">
            <Zap className="h-4 w-4 text-primary" />
          </div>
          <span className="font-display text-lg font-bold text-foreground">
            Interview<span className="text-primary">Guru</span>
          </span>
        </Link>
        <div className="hidden items-center gap-1 md:flex">
          {["Features", "Pricing", "About"].map((item) => (
            <button key={item} className="btn-glass rounded-lg px-4 py-2 text-sm font-medium text-foreground/70 hover:text-primary transition-colors">
              {item}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" className="text-foreground/70 hover:text-primary" asChild>
            <Link to="/dashboard">Log in</Link>
          </Button>
          <Button size="sm" className="btn-liquid rounded-lg text-primary-foreground font-semibold" asChild>
            <Link to="/dashboard">Start Free</Link>
          </Button>
          <button className="md:hidden text-foreground" onClick={() => setOpen(!open)}>
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>
    </nav>
  );
};

/* ===== HERO ===== */
const HeroSection = () => {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const bgY = useTransform(scrollYProgress, [0, 1], [0, 150]);
  const opacity = useTransform(scrollYProgress, [0, 0.8], [1, 0]);

  return (
    <section ref={ref} className="relative min-h-screen overflow-hidden bg-deep-space pt-16">
      {/* Ambient orbs */}
      <AmbientOrb color="teal" size={500} className="top-[-10%] left-[10%]" delay={0} />
      <AmbientOrb color="purple" size={400} className="top-[20%] right-[5%]" delay={1} />
      <AmbientOrb color="teal" size={300} className="bottom-[10%] left-[50%]" delay={2} />

      <FloatingParticles count={30} />

      <motion.div style={{ y: bgY, opacity }} className="container relative z-10 mx-auto flex min-h-[calc(100vh-4rem)] flex-col items-center justify-center px-6 text-center">
        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.8, type: "spring" }}
          className="mb-8 glass-card inline-flex items-center gap-2 rounded-full px-5 py-2 text-sm text-primary"
        >
          <Sparkles className="h-3.5 w-3.5" />
          AI-Powered Interview Preparation
        </motion.div>

        {/* Headline */}
        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.15 }}
          className="max-w-4xl font-display text-5xl font-black leading-[1.05] tracking-tight text-foreground md:text-7xl lg:text-8xl"
        >
          Your Forever{" "}
          <span className="text-gradient-teal">Interview</span>
          <br />
          <span className="text-glow">Guru</span>
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3 }}
          className="mt-6 max-w-2xl text-lg leading-relaxed text-muted-foreground md:text-xl"
        >
          Not just mock. A personal AI mentor that remembers everything,
          adapts to your weaknesses, and levels you up until you land the job.
        </motion.p>

        {/* CTA buttons */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.45 }}
          className="mt-10 flex flex-col items-center gap-4 sm:flex-row"
        >
          <Link to="/dashboard" className="btn-liquid rounded-xl px-8 py-4 font-display text-base font-bold text-primary-foreground flex items-center gap-2 animate-pulse-glow">
            Start Practicing Free
            <ArrowRight className="h-4 w-4" />
          </Link>
          <button className="btn-glass rounded-xl px-8 py-4 font-display text-base font-semibold text-foreground flex items-center gap-2">
            <Play className="h-4 w-4 text-primary" />
            Watch Demo
          </button>
        </motion.div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 0.8 }}
          className="mt-20 flex flex-wrap justify-center gap-8"
        >
          {["15,000+ Users", "45% Pro Conversion", "NPS 80+", "92% Skill Accuracy"].map((stat) => (
            <div key={stat} className="flex items-center gap-2 text-sm text-muted-foreground">
              <div className="h-2 w-2 rounded-full bg-primary glow-teal" />
              {stat}
            </div>
          ))}
        </motion.div>
      </motion.div>
    </section>
  );
};

/* ===== FEATURES ===== */
const features = [
  {
    icon: Brain,
    title: "Long-term Memory Mentor",
    description: "Remembers every past session. Your AI Guru knows your strengths, weaknesses, and growth trajectory across all interviews.",
    glow: "teal" as const,
  },
  {
    icon: Zap,
    title: "Live Company Intelligence",
    description: "Pulls real-time company news, funding rounds, and Glassdoor sentiment to craft killer interview questions.",
    glow: "purple" as const,
  },
  {
    icon: Users,
    title: "Panel Attack Mode",
    description: "Face 3 distinct AI personalities simultaneously — Strict HR, Tough Tech Lead, and Friendly Manager who interact with each other.",
    glow: "teal" as const,
  },
  {
    icon: Shield,
    title: "Real-time Stress & EQ Coach",
    description: "Detects anxiety live through voice analysis and gives subtle calming cues. Breathe… you're doing great.",
    glow: "warm" as const,
  },
  {
    icon: Sparkles,
    title: "Replay & Level Up",
    description: "Re-record any weak answer with instant side-by-side video comparison and score improvement tracking.",
    glow: "purple" as const,
  },
  {
    icon: ArrowRight,
    title: "Voice Cloning Feedback",
    description: "Hear the perfect answer to any question spoken in your own cloned voice. Practice makes permanent.",
    glow: "teal" as const,
  },
];

const FeaturesSection = () => (
  <section className="relative bg-deep-space py-24 overflow-hidden">
    <AmbientOrb color="purple" size={400} className="top-0 right-[10%]" />
    <AmbientOrb color="teal" size={300} className="bottom-0 left-[5%]" delay={3} />

    <div className="container relative z-10 mx-auto px-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="text-center"
      >
        <span className="text-sm font-semibold uppercase tracking-widest text-primary text-glow">
          6 Game-Changing Features
        </span>
        <h2 className="mt-3 font-display text-4xl font-bold text-foreground md:text-5xl">
          No Competitor Offers All Six
        </h2>
        <p className="mx-auto mt-4 max-w-xl text-muted-foreground">
          The only platform combining stateful memory, live research, multi-persona panels,
          real-time EQ coaching, replay comparison, and voice cloning.
        </p>
      </motion.div>

      <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {features.map((feature, i) => (
          <motion.div
            key={feature.title}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.1, type: "spring", stiffness: 200 }}
          >
            <GlassCard className="p-8 h-full" glowColor={feature.glow}>
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary border border-primary/20">
                <feature.icon className="h-6 w-6" />
              </div>
              <h3 className="font-display text-lg font-bold text-foreground">{feature.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{feature.description}</p>
            </GlassCard>
          </motion.div>
        ))}
      </div>
    </div>
  </section>
);

/* ===== PRICING ===== */
const pricingPlans = [
  {
    name: "Free",
    price: "₹0",
    period: "forever",
    description: "Get started with 3 full mocks per month",
    features: ["3 mock interviews/month", "Basic AI feedback report", "Voice-only mode", "Email support"],
    cta: "Start Free",
    highlighted: false,
  },
  {
    name: "Pro",
    price: "₹499",
    period: "/month",
    description: "Unlimited practice with all premium features",
    features: [
      "Unlimited mock interviews",
      "Panel Attack Mode",
      "Real-time EQ coaching",
      "Replay & Level Up",
      "Voice Cloning Feedback",
      "PDF export & analytics",
      "Priority support",
    ],
    cta: "Go Pro",
    highlighted: true,
  },
  {
    name: "Enterprise",
    price: "Custom",
    period: "",
    description: "For colleges and teams with group analytics",
    features: [
      "Everything in Pro",
      "White-label branding",
      "Group analytics dashboard",
      "SSO & admin panel",
      "Dedicated support",
    ],
    cta: "Contact Sales",
    highlighted: false,
  },
];

const PricingSection = () => (
  <section className="relative bg-deep-space py-24 overflow-hidden">
    <AmbientOrb color="teal" size={400} className="top-[10%] left-[20%]" />

    <div className="container relative z-10 mx-auto px-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="text-center"
      >
        <span className="text-sm font-semibold uppercase tracking-widest text-primary text-glow">Pricing</span>
        <h2 className="mt-3 font-display text-4xl font-bold text-foreground md:text-5xl">
          Invest in Your Career
        </h2>
        <p className="mx-auto mt-4 max-w-lg text-muted-foreground">
          Start free, upgrade when you're ready to land that dream job.
        </p>
      </motion.div>

      <div className="mt-16 grid gap-8 md:grid-cols-3">
        {pricingPlans.map((plan, i) => (
          <motion.div
            key={plan.name}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.15, type: "spring" }}
          >
            <GlassCard
              className={`p-8 h-full ${plan.highlighted ? "animate-pulse-glow border-primary/30" : ""}`}
              glowColor={plan.highlighted ? "teal" : "purple"}
            >
              {plan.highlighted && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-primary px-4 py-1 text-xs font-semibold text-primary-foreground glow-teal z-10">
                  Most Popular
                </div>
              )}
              <h3 className="font-display text-xl font-bold text-foreground">{plan.name}</h3>
              <div className="mt-4 flex items-baseline gap-1">
                <span className="font-display text-4xl font-black text-foreground">{plan.price}</span>
                <span className="text-sm text-muted-foreground">{plan.period}</span>
              </div>
              <p className="mt-2 text-sm text-muted-foreground">{plan.description}</p>
              <ul className="mt-6 space-y-3">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm text-foreground/80">
                    <div className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary glow-teal" />
                    {f}
                  </li>
                ))}
              </ul>
              <Link
                to="/dashboard"
                className={`mt-8 w-full flex items-center justify-center rounded-xl py-3 text-sm font-semibold transition-all ${
                  plan.highlighted
                    ? "btn-liquid text-primary-foreground"
                    : "btn-glass text-foreground"
                }`}
              >
                {plan.cta}
              </Link>
            </GlassCard>
          </motion.div>
        ))}
      </div>
    </div>
  </section>
);

/* ===== FOOTER ===== */
const Footer = () => (
  <footer className="border-t border-border/30 bg-deep-space py-12">
    <div className="container mx-auto flex flex-col items-center gap-4 px-6 text-center text-sm text-muted-foreground">
      <div className="flex items-center gap-2">
        <div className="flex h-6 w-6 items-center justify-center rounded-md bg-primary/20 border border-primary/30">
          <Zap className="h-3 w-3 text-primary" />
        </div>
        <span className="font-display font-bold text-foreground">Interview<span className="text-primary">Guru</span></span>
      </div>
      <p className="text-muted-foreground/70">"Not just mock. Your forever Interview Guru."</p>
      <p className="text-muted-foreground/50">© 2026 InterviewGuru. All rights reserved.</p>
    </div>
  </footer>
);

/* ===== PAGE ===== */
const Index = () => (
  <div className="min-h-screen bg-deep-space">
    <CursorGlow />
    <Navbar />
    <HeroSection />
    <FeaturesSection />
    <PricingSection />
    <Footer />
  </div>
);

export default Index;
