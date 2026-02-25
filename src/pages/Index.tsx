import { motion, useScroll, useTransform } from "framer-motion";
import { Link } from "react-router-dom";
import { Brain, Zap, Users, Shield, ArrowRight, Sparkles, Play, Menu, X, Target, Search, BarChart3, User, Star } from "lucide-react";
import { NeuCard, NeuButton, CursorGlow, NeuBackground } from "@/components/LiquidGlass";
import { useRef, useState } from "react";

/* ===== NAVBAR (Neumorphism Theme) ===== */
const Navbar = () => {
  const [open, setOpen] = useState(false);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 pt-6 px-6 lg:px-12 transition-all duration-300">
      <div className="container mx-auto flex h-16 items-center justify-between">
        {/* Left: Logo */}
        <Link to="/" className="flex items-center gap-2">
          <div className="flex flex-col gap-0.5 relative top-1">
             <div className="h-4 w-4 border-l-2 border-t-2 border-white rounded-tl-sm -rotate-45 relative left-1" />
             <div className="h-4 w-4 border-l-2 border-b-2 border-white rounded-bl-sm -rotate-45 relative left-1" />
          </div>
          <div className="flex flex-col leading-none ml-2">
            <span className="font-display text-sm font-bold text-foreground">APEX</span>
            <span className="font-display text-xs font-semibold text-foreground/80 tracking-widest">SOLUTIONS</span>
          </div>
        </Link>
        
        {/* Middle: Links */}
        <div className="hidden items-center gap-8 md:flex absolute left-1/2 -translate-x-1/2">
          {["Home", "About", "Services", "Portfolio", "Contact"].map((item, idx) => (
            <button key={item} className="relative text-xs font-medium text-foreground hover:text-white transition-colors pb-1 group">
              {item}
              {idx === 0 && <span className="absolute bottom-0 left-0 w-full h-[1px] bg-white opacity-80" />}
              {idx !== 0 && <span className="absolute bottom-0 left-0 w-0 h-[1px] bg-white opacity-0 group-hover:w-full group-hover:opacity-80 transition-all duration-300" />}
            </button>
          ))}
        </div>

        {/* Right: CTA */}
        <div className="flex items-center gap-3">
          <Link to="/auth" className="hidden md:inline-flex text-xs font-bold text-foreground hover:text-white transition-colors mr-2">
            Log in
          </Link>
          <NeuButton variant="primary" className="hidden md:inline-flex shadow-xl">
            <Link to="/dashboard">Get started</Link>
          </NeuButton>
          <button className="md:hidden text-foreground" onClick={() => setOpen(!open)}>
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>
    </nav>
  );
};

/* ===== HERO (Neumorphism Theme) ===== */
const HeroSection = () => {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const opacity = useTransform(scrollYProgress, [0, 0.8], [1, 0]);

  return (
    <section ref={ref} className="relative min-h-screen pt-32 pb-20 flex flex-col justify-center overflow-hidden">
      <motion.div 
        style={{ opacity }} 
        className="container relative z-10 mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-8 px-6 lg:px-12 items-center"
      >
        {/* Left Column - Text Content & Inline Graphics */}
        <div className="flex flex-col items-start text-left max-w-2xl z-20 xl:pr-10">
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="font-display text-[3.5rem] sm:text-[4.5rem] lg:text-[5rem] xl:text-[5.5rem] font-bold leading-[1.1] tracking-tight text-slate-800 mb-6"
          >
            Let's Interview 
            {/* Inline Neu Avatar Element */}
            <span className="inline-flex items-center justify-center align-middle mx-4 w-[60px] h-[60px] sm:w-[80px] sm:h-[80px] lg:w-[100px] lg:h-[100px] rounded-full neu-flat overflow-hidden relative top-[-4px] sm:top-[-8px] p-1.5 focus:outline-none">
               <img src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=200&auto=format&fit=crop" alt="User" className="w-full h-full object-cover" />
            </span>
            <br className="hidden sm:block" />
            With Elite 
            {/* Inline Neu Slider Graphic */}
            <span className="inline-flex items-center align-middle mx-4 w-[120px] sm:w-[160px] h-[40px] sm:h-[50px] lg:w-[200px] lg:h-[60px] rounded-full neu-pressed px-2 relative top-[-4px] sm:top-[-8px]">
               <span className="w-1/2 h-[60%] rounded-full bg-blue-400/80 absolute left-2 opacity-80"></span>
               <span className="w-8 h-8 lg:w-10 lg:h-10 rounded-full neu-flat ml-auto flex items-center justify-center z-10">
                 <div className="flex gap-0.5 opacity-60">
                   <div className="w-1 h-1 rounded-full bg-slate-600" />
                   <div className="w-1 h-1 rounded-full bg-slate-600 opacity-50" />
                   <div className="w-1 h-1 rounded-full bg-slate-600 opacity-20" />
                 </div>
               </span>
            </span>
            <br className="hidden sm:block" />
            Personas
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.15 }}
            className="text-slate-500 font-medium text-sm sm:text-base leading-relaxed max-w-sm mb-12 sm:pl-2"
          >
            Experience simulated interviews with highly calibrated AI personas that test your limits and prepare you for any scenario.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="flex items-center gap-6"
          >
            <NeuButton variant="primary" className="px-8 py-4 sm:px-10 sm:py-5 shadow-[0_15px_40px_-5px_rgba(75,123,229,0.3)]">
              <Link to="/dashboard">Get Started</Link>
            </NeuButton>
            
            {/* Adjoining Graphic */}
            <div className="hidden sm:flex flex-col gap-1 items-start neu-flat rounded-xl px-4 py-2">
               <div className="flex items-center gap-2">
                 <Sparkles className="h-4 w-4 text-emerald-500 fill-current" />
                 <span className="text-slate-700 text-sm font-bold">Try AI</span>
               </div>
               <span className="text-slate-400 text-[10px] uppercase tracking-wider font-bold">Free Trial Active</span>
            </div>
          </motion.div>
        </div>

        {/* Right Column - Complex Layered Collage */}
        <div className="relative h-[500px] lg:h-[700px] w-full flex items-center justify-center mt-8 lg:mt-0 lg:left-8 z-10">
          
          {/* Layer 1: Main Professional Cutout */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, x: 20 }}
            animate={{ opacity: 1, scale: 1, x: 0 }}
            transition={{ duration: 1, delay: 0.2 }}
            className="absolute top-[5%] right-[5%] lg:right-[0%] w-[320px] lg:w-[450px] aspect-[3/4] rounded-t-[100px] neu-flat overflow-hidden flex items-end justify-center z-10 p-4"
          >
             {/* Using an Unsplash portrait */}
             <div className="w-full h-full rounded-t-[84px] overflow-hidden bg-slate-200">
                <img src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=600&auto=format&fit=crop" alt="Professional Woman" className="w-[120%] h-[110%] object-cover opacity-90 pb-8" />
             </div>
          </motion.div>

          {/* Layer 2: Network / Floating Mini Avatars */}
          <motion.div 
             initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8, duration: 1 }}
             className="absolute top-[15%] right-[10%] lg:right-[40%] z-20"
          >
             {/* Connecting SVG Lines */}
             <svg className="absolute top-8 right-[-100px] w-[200px] h-[150px] pointer-events-none opacity-30" viewBox="0 0 200 150">
                <path d="M 0 0 C 50 50, 150 20, 200 100" fill="transparent" stroke="white" strokeWidth="1" strokeDasharray="4 4" />
                <path d="M 0 0 C 80 80, 100 150, 180 140" fill="transparent" stroke="white" strokeWidth="1" strokeDasharray="4 4" />
             </svg>
             
             <div className="flex gap-3">
               <div className="w-12 h-12 rounded-full border-2 border-white/20 overflow-hidden bg-blue-900 absolute -top-10 -right-20 shadow-xl">
                  <img src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=150&auto=format&fit=crop" className="w-full h-full object-cover opacity-80 mix-blend-luminosity" />
               </div>
               <div className="w-14 h-14 rounded-full border-2 border-white/20 overflow-hidden bg-blue-800 absolute top-5 -right-10 shadow-xl">
                  <img src="https://images.unsplash.com/photo-1599566150163-29194dcaad36?q=80&w=150&auto=format&fit=crop" className="w-full h-full object-cover opacity-80 mix-blend-luminosity" />
               </div>
               <div className="w-10 h-10 rounded-full border border-blue-400 overflow-hidden bg-white/10 absolute top-[100px] -right-5 shadow-[0_0_15px_rgba(96,165,250,0.5)] flex items-center justify-center">
                  <div className="w-6 h-6 rounded-full bg-blue-400/50" />
               </div>
             </div>
          </motion.div>

          {/* Layer 3: Secondary Cutout (Background Right) */}
          <motion.div 
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 1, delay: 0.4 }}
            className="absolute bottom-[20%] right-[-5%] lg:right-[5%] w-[180px] lg:w-[250px] aspect-square rounded-full lg:rounded-[3rem] bg-blue-800/20 border border-white/5 overflow-hidden flex items-center justify-center z-0 lg:z-20 hidden sm:flex"
          >
             <img src="https://images.unsplash.com/photo-1560250097-0b93528c311a?q=80&w=400&auto=format&fit=crop" alt="Professional Man" className="w-[120%] h-[120%] object-cover mix-blend-luminosity opacity-70" />
          </motion.div>

          {/* Layer 4: "Challenges / Sessions" GlassCard (Bottom Left) */}
          <motion.div
             initial={{ opacity: 0, y: 30 }}
             animate={{ opacity: 1, y: 0 }}
             transition={{ duration: 0.8, delay: 0.6 }}
             className="absolute bottom-[10%] left-[5%] lg:left-[10%] w-[220px] lg:w-[260px] z-30"
          >
             <NeuCard className="p-5" variant="pressed">
                <h4 className="text-slate-800 text-xs font-bold mb-4">Sessions <span className="text-slate-500 font-normal">in progress</span></h4>
                <div className="space-y-4">
                  {[
                    { title: "System Design", status: "emerald-400", time: "18m" },
                    { title: "Behavioral Grid", status: "amber-400", time: "42m" },
                    { title: "Code Pairing", status: "blue-400", time: "05m" }
                  ].map((s, i) => (
                    <div key={i} className="flex justify-between items-center group cursor-pointer">
                      <div className="flex items-center gap-3">
                         <div className={`w-2 h-2 rounded-full bg-${s.status} shadow-[0_0_8px_currentColor] opacity-80`} />
                         <div>
                            <p className="text-slate-700 text-xs font-bold">{s.title}</p>
                            <p className="text-slate-400 text-[10px] font-medium">Active</p>
                         </div>
                      </div>
                      <span className="text-slate-500 text-[10px] font-bold neu-pressed px-2 py-0.5 rounded-full">{s.time}</span>
                    </div>
                  ))}
                </div>
             </NeuCard>
          </motion.div>

          {/* Layer 5: Prominent White "Rating" Card (Center Foreground) */}
          <motion.div
             initial={{ opacity: 0, scale: 0.9, y: 20 }}
             animate={{ opacity: 1, scale: 1, y: 0 }}
             transition={{ duration: 0.8, delay: 0.7 }}
             className="absolute top-[40%] left-[25%] lg:left-[45%] w-[200px] lg:w-[240px] z-40"
          >
            <div className="neu-flat rounded-3xl p-6 transform -rotate-2 hover:rotate-0 transition-transform duration-500">
              
              {/* Floating Reviewer Avatar */}
              <div className="absolute -top-6 left-1/2 -translate-x-1/2 w-14 h-14 rounded-full border-4 border-white bg-blue-100 shadow-xl overflow-hidden">
                 <img src="https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=150&auto=format&fit=crop" className="w-full h-full object-cover" />
              </div>

              <div className="mt-6 text-center">
                 <div className="flex justify-center gap-1 mb-1">
                   {[1,2,3,4].map(i => <Star key={i} className="h-4 w-4 text-amber-400 fill-current" />)}
                   <div className="relative overflow-hidden w-4 h-4 text-amber-400">
                     <Star className="absolute top-0 left-0 h-4 w-4 text-slate-200 fill-current" />
                     <Star className="absolute top-0 left-0 h-4 w-4 fill-current" style={{ clipPath: "polygon(0 0, 50% 0, 50% 100%, 0 100%)" }} />
                   </div>
                 </div>
                 <h3 className="text-blue-950 font-display text-2xl font-black">4.5</h3>
                 <p className="text-slate-400 text-[10px] uppercase tracking-wider mb-5">Global Score</p>
                 
                 <div className="space-y-2">
                   {[
                     { m: "Jan", s: "4.2" },
                     { m: "Feb", s: "3.6", isLow: true },
                     { m: "Mar", s: "4.5", bg: "bg-blue-50 border-blue-100" }
                   ].map(row => (
                     <div key={row.m} className={`flex justify-between items-center rounded-xl px-3 py-2 text-xs font-semibold ${row.bg ? 'neu-pressed' : 'border border-transparent'}`}>
                       <span className={row.bg ? 'text-blue-600' : 'text-slate-500'}>{row.m}</span>
                       <div className="flex items-center gap-2">
                         <span className={row.bg ? 'text-blue-600' : (row.isLow ? 'text-amber-600' : 'text-slate-700')}>{row.s}</span>
                         <div className={`w-1.5 h-1.5 rounded-full ${row.bg ? 'bg-blue-500' : (row.isLow ? 'bg-amber-400' : 'bg-slate-300')}`} />
                       </div>
                     </div>
                   ))}
                 </div>
              </div>
            </div>
          </motion.div>

        </div>
      </motion.div>
    </section>
  );
};


/* ===== 4-COLUMN SERVICES GRID (Blue 3D Theme) ===== */
const services = [
  {
    title: "Services",
    desc: "Team Scrums",
    icon: Users,
    glow: "blue" as const,
    img: "https://images.unsplash.com/photo-1634152962476-4b8a00e1915c?q=80&w=400&auto=format&fit=crop" // 3D blocks placeholder
  },
  {
    title: "Profiles Studies",
    desc: "User Personas",
    icon: User,
    glow: "blue" as const,
    img: "https://images.unsplash.com/photo-1618005192384-a83a8bd57fbe?q=80&w=400&auto=format&fit=crop" // 3D cylinders placeholder
  },
  {
    title: "Purfoct",
    desc: "Team Server",
    icon: Target,
    glow: "blue" as const,
    img: "https://images.unsplash.com/photo-1633394866579-dd27ffb2a0fb?q=80&w=400&auto=format&fit=crop" // 3D grid placeholder
  },
  {
    title: "Puffort",
    desc: "Top Secret",
    icon: Shield,
    glow: "blue" as const,
    img: "https://images.unsplash.com/photo-1633394866528-984e7236d933?q=80&w=400&auto=format&fit=crop" // 3D spheres placeholder
  }
];

const ServicesGridSection = () => (
  <section className="relative z-20 py-24">
    <div className="container mx-auto px-6 lg:px-12 max-w-7xl">
      <div className="flex items-center justify-between mb-16 text-xs font-bold text-slate-400 tracking-widest uppercase">
         <span className="hidden md:inline-block">/</span>
         <span className="hidden md:inline-block">/</span>
         <span className="hidden md:inline-block">/</span>
         <span className="flex items-center gap-2"><div className="h-1.5 w-1.5 rounded-full bg-white/50"/> PROJECTS</span>
         <span>SERVICES <div className="inline-block h-4 w-4 rounded-full border border-white/30 text-center leading-none ml-1 relative top-0.5">3</div></span>
         <span className="hidden md:inline-block">/</span>
         <span className="hidden md:flex items-center gap-2"><div className="h-2 w-2 rounded-full bg-blue-500"/></span>
         <span className="hidden md:inline-block text-right">/ /</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {services.map((svc, i) => (
          <motion.div
            key={svc.title}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.15, duration: 0.8, type: "spring" }}
          >
            <NeuCard className="h-[320px] p-6 flex flex-col justify-between group rounded-[2rem] hover:scale-[1.02] transition-transform">
              
              {/* Header */}
              <div className="flex justify-between items-start">
                 <div className="flex items-center gap-2 text-slate-500 font-bold">
                   <svc.icon className="h-4 w-4" />
                   <span className="text-xs">{svc.title}</span>
                 </div>
                 <div className="h-6 w-6 rounded-full neu-pressed flex items-center justify-center text-slate-400 group-hover:text-blue-600 transition-colors">
                   <div className="h-1 w-2 border-b border-l border-current -rotate-45 relative bottom-0.5" />
                 </div>
              </div>
              
              {/* 3D Graphic (Proxy image) */}
              <div className="relative w-full flex-1 flex items-center justify-center my-4 overflow-hidden mask-image-bottom">
                 <img src={svc.img} alt={svc.title} className="max-h-[140px] object-contain drop-shadow-2xl mix-blend-luminosity opacity-80 group-hover:scale-110 group-hover:opacity-100 transition-all duration-700" loading="lazy" />
                 {/* Floor reflection effect */}
                 <div className="absolute -bottom-4 w-[120%] h-8 bg-blue-500/20 blur-xl rounded-[100%] scale-y-50"></div>
              </div>

              {/* Footer text */}
              <div>
                 <h3 className="font-display text-xl font-bold text-slate-800 mb-2">{svc.title}</h3>
                 <div className="flex justify-between items-center">
                    <span className="px-3 py-1 rounded-full text-[10px] font-bold text-slate-500 tracking-wide uppercase neu-pressed">{svc.desc}</span>
                    <div className="h-8 w-8 rounded-full neu-convex flex items-center justify-center text-slate-500 group-hover:text-blue-600 transition-colors cursor-pointer">
                      <ArrowRight className="h-3 w-3 -rotate-45" />
                    </div>
                 </div>
              </div>
            </NeuCard>
          </motion.div>
        ))}
      </div>
    </div>
  </section>
);

/* ===== TIMELINE SECTION (Blue 3D Theme) ===== */
const timelineSteps = [
  { num: "01", title: "Testimonials", desc: "The only way to attract new clients, is to show your experience with the previous ones. Include real photo, position at company, links their profiles.", textClass: "text-amber-400", borderClass: "border-amber-400/20", glowClass: "bg-amber-400" },
  { num: "02", title: "Trust Badges", desc: "Show all the achievements you have. Awards, certificates, payment protections, etc.", textClass: "text-blue-400", borderClass: "border-blue-400/20", glowClass: "bg-blue-400" },
  { num: "03", title: "Add Contacts", desc: "People need to understand that if something will happen, they can always reach out to you. Leave links to your social media, your email and the phone.", textClass: "text-purple-400", borderClass: "border-purple-400/20", glowClass: "bg-purple-400" },
  { num: "04", title: "Case Studies", desc: "Share detailed examples of how your product or service solved real problems. This helps visitors imagine their own success.", textClass: "text-emerald-400", borderClass: "border-emerald-400/20", glowClass: "bg-emerald-400" },
  { num: "05", title: "Clear Refund Policy", desc: "Offer a transparent money-back guarantee or easy return process.", textClass: "text-sky-400", borderClass: "border-sky-400/20", glowClass: "bg-sky-400" },
];

const TimelineSection = () => {
  return (
    <section className="relative py-24 lg:py-32 z-20 overflow-hidden">
      {/* Background glow for the section */}
      <div className="absolute inset-0 pointer-events-none">
         <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-blue-500/5 rounded-full blur-[100px]" />
         <div className="absolute bottom-1/4 right-1/4 w-[600px] h-[600px] bg-purple-500/5 rounded-full blur-[120px]" />
      </div>

      <div className="container mx-auto px-6 max-w-5xl relative">
        <div className="text-center mb-24">
           <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
             <h2 className="font-display text-4xl md:text-5xl font-bold text-slate-800 mb-6">Built for Success</h2>
             <p className="text-slate-500 font-medium max-w-2xl mx-auto">Follow our proven process to convert visitors into loyal clients.</p>
           </motion.div>
        </div>

        {/* Center Line */}
        <div className="absolute left-6 md:left-1/2 top-[200px] bottom-10 md:-translate-x-1/2 w-1 neu-pressed rounded-full" />

        <div className="space-y-16 lg:space-y-24 relative">
          {timelineSteps.map((step, idx) => {
             const isLeft = idx % 2 === 0;
             return (
                <div key={idx} className={`relative flex flex-col md:flex-row items-center justify-center gap-8 md:gap-0 ${isLeft ? "md:flex-row-reverse" : ""}`}>
                  
                  {/* Timeline Node Connector (Mobile: Absolute left, Desktop: Absolute center) */}
                  <div className="absolute left-6 md:left-1/2 top-1/2 -translate-y-1/2 -translate-x-[11px] md:-translate-x-1/2 w-8 h-8 flex items-center justify-center z-20 neu-convex rounded-full">
                     <div className="w-3 h-3 rounded-full bg-blue-500" />
                  </div>

                  {/* Empty space for desktop layout alignment */}
                  <div className="hidden md:block md:w-1/2" />

                  {/* Card Side */}
                  <motion.div 
                     initial={{ opacity: 0, x: isLeft ? -50 : 50, y: 20 }}
                     whileInView={{ opacity: 1, x: 0, y: 0 }}
                     viewport={{ once: true, margin: "-100px" }}
                     transition={{ duration: 0.8, type: "spring" }}
                     className={`w-full md:w-1/2 flex justify-center pl-16 md:pl-0 ${isLeft ? "md:pr-16" : "md:pl-16"}`}
                  >
                     {/* The Card */}
                     <div className={`w-full max-w-[380px] group transform transition-all duration-500 hover:scale-[1.02] ${isLeft ? "rotate-[-1deg] hover:rotate-0" : "rotate-[1deg] hover:rotate-0"}`}>
                       <NeuCard className="p-8 h-full relative overflow-hidden" variant="flat">
                             <div className={`font-display text-4xl font-black ${step.textClass} mb-4 opacity-90`}>{step.num}</div>
                             <h3 className="font-display font-bold text-slate-800 text-xl mb-3 relative z-10">{step.title}</h3>
                             <p className="text-slate-500 text-sm leading-relaxed relative z-10 font-medium">{step.desc}</p>
                       </NeuCard>
                     </div>
                  </motion.div>

                </div>
             )
          })}
        </div>
      </div>
    </section>
  )
}

/* ===== AVATAR PROFILES & CONTACT (Blue 3D Theme) ===== */
const AvatarsAndContactSection = () => (
  <section className="relative bg-transparent py-24 z-20 pb-32">
    <div className="container mx-auto px-6 max-w-6xl">
      
      {/* Top row: Message Bubble + 2 Avatars */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-end mb-16">
         {/* Message Bubble */}
         <motion.div 
           initial={{ opacity: 0, y: 30, scale: 0.9 }}
           whileInView={{ opacity: 1, y: 0, scale: 1 }}
           viewport={{ once: true }}
           transition={{ duration: 0.8, type: "spring" }}
           className="relative bg-white rounded-3xl rounded-br-md p-6 shadow-2xl z-10"
         >
           <h4 className="font-bold text-blue-950 text-sm mb-2">Im Active as Invictor</h4>
           <p className="text-xs leading-relaxed text-gray-500">Fast tracking your success beyond innovation and legacy workflows to share driven success.</p>
           {/* Tail pointing right */}
           <div className="absolute -bottom-4 right-10 w-8 h-8 bg-white" style={{ clipPath: "polygon(0 0, 100% 0, 100% 100%)" }}></div>
         </motion.div>

         {/* Avatar 1 */}
         <motion.div 
             initial={{ opacity: 0, y: 30 }}
             whileInView={{ opacity: 1, y: 0 }}
             viewport={{ once: true }}
             transition={{ duration: 0.8, delay: 0.2 }}
             className="flex flex-col items-center pb-8"
          >
           <div className="relative w-32 h-32 mb-4">
             {/* Circular halo background */}
             <div className="absolute inset-0 bg-blue-500/20 rounded-full blur-md"></div>
             {/* Avatar Placeholder */}
             <div className="absolute inset-0 border-[3px] border-white/10 rounded-full overflow-hidden bg-slate-800">
               <img src="https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=200&auto=format&fit=crop" alt="User" className="w-full h-full object-cover mix-blend-luminosity opacity-80" />
             </div>
           </div>
           <div className="text-center">
             <h4 className="font-bold text-white mb-1">Feezi Gothig Sirive <br/>Rapti</h4>
             <p className="text-[10px] text-white/50 max-w-[180px] leading-relaxed">Agenting cross company role allocation with precision tracking parameters metrics.</p>
           </div>
         </motion.div>

         {/* Avatar 2 */}
         <motion.div 
             initial={{ opacity: 0, y: 30 }}
             whileInView={{ opacity: 1, y: 0 }}
             viewport={{ once: true }}
             transition={{ duration: 0.8, delay: 0.4 }}
             className="flex flex-col items-center"
          >
           <div className="relative w-32 h-32 mb-4">
             {/* Circular halo background */}
             <div className="absolute inset-0 bg-blue-500/20 rounded-full blur-md"></div>
             {/* Avatar Placeholder */}
             <div className="absolute inset-0 border-[3px] border-white/10 rounded-full overflow-hidden bg-slate-800">
               <img src="https://images.unsplash.com/photo-1599566150163-29194dcaad36?q=80&w=200&auto=format&fit=crop" alt="User 2" className="w-full h-full object-cover mix-blend-luminosity opacity-80" />
             </div>
           </div>
           <div className="text-center">
             <h4 className="font-bold text-white mb-1">Aptite Mitu Irgan<br/>Call.</h4>
             <p className="text-[10px] text-white/50 max-w-[180px] leading-relaxed">Basic core foundation tier of the raw data out of quick noise background metrics.</p>
           </div>
         </motion.div>
      </div>

      {/* Bottom row: Avatar 3 + Message Bubble + Contact Form */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-end">
        <div className="flex gap-6 items-end relative z-10">
          {/* Avatar 3 */}
          <motion.div 
             initial={{ opacity: 0, y: 30 }}
             whileInView={{ opacity: 1, y: 0 }}
             viewport={{ once: true }}
             transition={{ duration: 0.8, delay: 0.6 }}
          >
           <div className="relative w-28 h-28 -mb-4 z-20">
             <div className="absolute inset-0 bg-blue-500/20 rounded-full blur-md"></div>
             <div className="absolute inset-0 border-[3px] border-white/10 rounded-full overflow-hidden bg-slate-800">
               <img src="https://images.unsplash.com/photo-1438761681033-6461ffad8d80?q=80&w=200&auto=format&fit=crop" alt="User 3" className="w-full h-full object-cover mix-blend-luminosity opacity-80" />
             </div>
           </div>
          </motion.div>
          
          {/* Linked Message Box */}
          <motion.div 
           initial={{ opacity: 0, x: -30 }}
           whileInView={{ opacity: 1, x: 0 }}
           viewport={{ once: true }}
           transition={{ duration: 0.8, delay: 0.7 }}
           className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-md pb-12 w-full max-w-[280px]"
          >
           <h4 className="font-bold text-white text-sm mb-2">Data Dosis Ourl<br/>Animatries.</h4>
           <p className="text-[10px] text-white/50 leading-relaxed">Keeps scaling this base on tracking success tools that map the correct markers values.</p>
          </motion.div>
        </div>

        {/* Contact Form Rounded White Box */}
        <motion.div 
           initial={{ opacity: 0, y: 30 }}
           whileInView={{ opacity: 1, y: 0 }}
           viewport={{ once: true }}
           transition={{ duration: 0.8, delay: 0.8 }}
           className="bg-white rounded-[2rem] p-8 shadow-[0_20px_50px_-5px_rgba(0,0,0,0.5)] z-20 lg:-mt-10"
        >
           <h3 className="font-bold text-blue-950 text-lg mb-6">Contact form</h3>
           
           <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
             <div className="relative">
               <input type="text" placeholder="Create first name" className="w-full bg-slate-50 border-none rounded-xl py-3 px-4 text-xs text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20" />
               <ArrowRight className="absolute right-4 top-1/2 -translate-y-1/2 h-3 w-3 text-slate-300" />
             </div>
             <div className="relative">
               <input type="text" placeholder="Last name" className="w-full bg-slate-50 border-none rounded-xl py-3 px-4 text-xs text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20" />
               <ArrowRight className="absolute right-4 top-1/2 -translate-y-1/2 h-3 w-3 text-slate-300" />
             </div>
           </div>
           
           <div className="flex justify-between items-center border-t border-slate-100 pt-6">
             <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center">
               <Sparkles className="h-3 w-3 text-slate-400" />
             </div>
             <div className="flex gap-2">
               {['fb', 'tw', 'db', 'ig'].map(n => (
                 <div key={n} className="w-8 h-8 rounded-full bg-blue-950 flex items-center justify-center text-white cursor-pointer hover:bg-blue-800 transition-colors">
                   <div className="text-[10px] font-bold">{n[0].toUpperCase()}</div>
                 </div>
               ))}
             </div>
           </div>
        </motion.div>
      </div>

    </div>
  </section>
);

/* ===== FOOTER ===== */
const Footer = () => (
  <footer className="border-t border-slate-200 py-12 relative z-20">
    <div className="container mx-auto flex flex-col items-center gap-6 px-6 text-center text-sm">
      <div className="flex items-center gap-2">
          <div className="flex flex-col leading-none ml-2 text-left">
            <span className="font-display text-sm font-bold text-slate-800">APEX</span>
            <span className="font-display text-xs font-semibold text-slate-500 tracking-widest">SOLUTIONS</span>
          </div>
      </div>
      <p className="text-slate-500 font-medium font-bold">"Innovate. Transform. Thrive."</p>
      <div className="flex gap-4 text-slate-400 font-bold text-xs">
         <span className="hover:text-blue-600 cursor-pointer transition-colors">Privacy Policy</span>
         <span className="hover:text-blue-600 cursor-pointer transition-colors">Terms of Service</span>
      </div>
      <p className="text-slate-400 text-xs mt-4">© 2026 Apex Solutions. All rights reserved.</p>
    </div>
  </footer>
);

/* ===== PAGE ===== */
const Index = () => (
  <div className="min-h-screen bg-deep-space overflow-x-hidden selection:bg-blue-500/30">
    <CursorGlow />
    <NeuBackground />
    <Navbar />
    <HeroSection />
    <TimelineSection />
    <ServicesGridSection />
    <AvatarsAndContactSection />
    <Footer />
  </div>
);

export default Index;
