import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Brain, Zap, Users, Shield, ArrowRight, Sparkles } from "lucide-react";
import heroBg from "@/assets/hero-bg.jpg";

const Navbar = () => (
  <nav className="fixed top-0 left-0 right-0 z-50 glass">
    <div className="container mx-auto flex h-16 items-center justify-between px-6">
      <Link to="/" className="flex items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
          <Zap className="h-4 w-4 text-primary-foreground" />
        </div>
        <span className="font-display text-lg font-bold text-secondary-foreground">
          InterviewForge
        </span>
      </Link>
      <div className="hidden items-center gap-1 md:flex">
        <Button variant="nav" size="sm">Features</Button>
        <Button variant="nav" size="sm">Pricing</Button>
        <Button variant="nav" size="sm">About</Button>
      </div>
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" asChild>
          <Link to="/dashboard">Log in</Link>
        </Button>
        <Button variant="hero" size="sm" asChild>
          <Link to="/dashboard">Start Free</Link>
        </Button>
      </div>
    </div>
  </nav>
);

const HeroSection = () => (
  <section className="relative min-h-screen overflow-hidden bg-hero pt-16">
    <div
      className="absolute inset-0 opacity-30"
      style={{ backgroundImage: `url(${heroBg})`, backgroundSize: "cover", backgroundPosition: "center" }}
    />
    <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-navy/90" />

    <div className="container relative z-10 mx-auto flex min-h-[calc(100vh-4rem)] flex-col items-center justify-center px-6 text-center">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="mb-6 inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 text-sm text-teal-glow"
      >
        <Sparkles className="h-3.5 w-3.5" />
        AI-Powered Interview Preparation
      </motion.div>

      <motion.h1
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.15 }}
        className="max-w-4xl font-display text-5xl font-black leading-[1.1] tracking-tight text-secondary-foreground md:text-7xl"
      >
        Your Forever Interview{" "}
        <span className="text-gradient-teal">Guru</span>
      </motion.h1>

      <motion.p
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.3 }}
        className="mt-6 max-w-2xl text-lg leading-relaxed text-muted-foreground md:text-xl"
      >
        Not just mock. A personal AI mentor that remembers everything, adapts to your weaknesses, and levels you up until you land the job.
      </motion.p>

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.45 }}
        className="mt-10 flex flex-col items-center gap-4 sm:flex-row"
      >
        <Button variant="hero" size="lg" className="text-base px-8 py-6" asChild>
          <Link to="/dashboard">
            Start Practicing Free
            <ArrowRight className="ml-1 h-4 w-4" />
          </Link>
        </Button>
        <Button variant="hero-outline" size="lg" className="text-base px-8 py-6">
          Watch Demo
        </Button>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1, delay: 0.8 }}
        className="mt-16 flex flex-wrap justify-center gap-8 text-sm text-muted-foreground"
      >
        {["15,000+ Users", "45% Pro Conversion", "NPS 80+", "92% Skill Accuracy"].map((stat) => (
          <div key={stat} className="flex items-center gap-2">
            <div className="h-1.5 w-1.5 rounded-full bg-primary" />
            {stat}
          </div>
        ))}
      </motion.div>
    </div>
  </section>
);

const features = [
  {
    icon: Brain,
    title: "Long-term Memory Mentor",
    description: "Remembers every past session. Your AI Guru knows your strengths, weaknesses, and growth trajectory across all interviews.",
  },
  {
    icon: Zap,
    title: "Live Company Intelligence",
    description: "Pulls real-time company news, funding rounds, and Glassdoor sentiment to craft killer interview questions.",
  },
  {
    icon: Users,
    title: "Panel Attack Mode",
    description: "Face 3 distinct AI personalities simultaneously — Strict HR, Tough Tech Lead, and Friendly Manager who interact with each other.",
  },
  {
    icon: Shield,
    title: "Real-time Stress & EQ Coach",
    description: "Detects anxiety live through voice analysis and gives subtle calming cues. Breathe… you're doing great.",
  },
  {
    icon: Sparkles,
    title: "Replay & Level Up",
    description: "Re-record any weak answer with instant side-by-side video comparison and score improvement tracking.",
  },
  {
    icon: ArrowRight,
    title: "Voice Cloning Feedback",
    description: "Hear the perfect answer to any question spoken in your own cloned voice. Practice makes permanent.",
  },
];

const FeaturesSection = () => (
  <section className="bg-surface py-24">
    <div className="container mx-auto px-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="text-center"
      >
        <span className="text-sm font-semibold uppercase tracking-widest text-primary">
          6 Game-Changing Features
        </span>
        <h2 className="mt-3 font-display text-4xl font-bold text-foreground md:text-5xl">
          No Competitor Offers All Six
        </h2>
        <p className="mx-auto mt-4 max-w-xl text-muted-foreground">
          The only platform combining stateful memory, live research, multi-persona panels, real-time EQ coaching, replay comparison, and voice cloning.
        </p>
      </motion.div>

      <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {features.map((feature, i) => (
          <motion.div
            key={feature.title}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.1 }}
            className="group rounded-2xl border border-border bg-card p-8 shadow-card transition-all duration-300 hover:shadow-card-hover hover:-translate-y-1"
          >
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
              <feature.icon className="h-6 w-6" />
            </div>
            <h3 className="font-display text-lg font-bold text-card-foreground">{feature.title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{feature.description}</p>
          </motion.div>
        ))}
      </div>
    </div>
  </section>
);

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
  <section className="bg-background py-24">
    <div className="container mx-auto px-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="text-center"
      >
        <span className="text-sm font-semibold uppercase tracking-widest text-primary">Pricing</span>
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
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.15 }}
            className={`relative rounded-2xl border p-8 ${
              plan.highlighted
                ? "border-primary bg-card shadow-glow animate-pulse-glow"
                : "border-border bg-card shadow-card"
            }`}
          >
            {plan.highlighted && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-primary px-4 py-1 text-xs font-semibold text-primary-foreground">
                Most Popular
              </div>
            )}
            <h3 className="font-display text-xl font-bold text-card-foreground">{plan.name}</h3>
            <div className="mt-4 flex items-baseline gap-1">
              <span className="font-display text-4xl font-black text-card-foreground">{plan.price}</span>
              <span className="text-sm text-muted-foreground">{plan.period}</span>
            </div>
            <p className="mt-2 text-sm text-muted-foreground">{plan.description}</p>
            <ul className="mt-6 space-y-3">
              {plan.features.map((f) => (
                <li key={f} className="flex items-start gap-2 text-sm text-card-foreground">
                  <div className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                  {f}
                </li>
              ))}
            </ul>
            <Button
              variant={plan.highlighted ? "hero" : "outline"}
              className="mt-8 w-full"
              asChild
            >
              <Link to="/dashboard">{plan.cta}</Link>
            </Button>
          </motion.div>
        ))}
      </div>
    </div>
  </section>
);

const Footer = () => (
  <footer className="border-t border-border bg-secondary py-12">
    <div className="container mx-auto flex flex-col items-center gap-4 px-6 text-center text-sm text-secondary-foreground/60">
      <div className="flex items-center gap-2">
        <div className="flex h-6 w-6 items-center justify-center rounded-md bg-primary">
          <Zap className="h-3 w-3 text-primary-foreground" />
        </div>
        <span className="font-display font-bold text-secondary-foreground">InterviewForge</span>
      </div>
      <p>"Not just mock. Your forever Interview Guru."</p>
      <p>© 2026 InterviewForge. All rights reserved.</p>
    </div>
  </footer>
);

const Index = () => (
  <div className="min-h-screen">
    <Navbar />
    <HeroSection />
    <FeaturesSection />
    <PricingSection />
    <Footer />
  </div>
);

export default Index;
