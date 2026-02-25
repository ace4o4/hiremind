import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import { Mail, Lock, User, ArrowRight, Github, Star, Loader2 } from "lucide-react";
import { NeuBackground, NeuButton, NeuCard } from "@/components/LiquidGlass";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { user, signIn, signUp, signInWithOAuth } = useAuth();
  const navigate = useNavigate();

  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      navigate("/dashboard", { replace: true });
    }
  }, [user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    if (!email || !password) {
      toast.error("Please fill in all required fields.");
      return;
    }

    if (!isLogin && !fullName) {
      toast.error("Please enter your full name.");
      return;
    }

    setIsSubmitting(true);

    try {
      if (isLogin) {
        const { error } = await signIn(email, password);
        if (error) {
          toast.error(error.message);
        } else {
          toast.success("Welcome back! 🎉");
          navigate("/dashboard", { replace: true });
        }
      } else {
        const { error } = await signUp(email, password, fullName);
        if (error) {
          toast.error(error.message);
        } else {
          toast.success("Account created! Check your email to confirm, or sign in now.");
        }
      }
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOAuth = async (provider: "google" | "github") => {
    const { error } = await signInWithOAuth(provider);
    if (error) {
      toast.error(error.message);
    }
  };

  return (
    <div className="min-h-screen relative flex overflow-hidden bg-[#e0e5ec] selection:bg-blue-500/30">
      <NeuBackground />

      {/* Left Branding Panel (Skewed) */}
      <div
        className="hidden lg:flex absolute top-0 left-0 h-full w-[55%] bg-gradient-to-br from-blue-700 to-indigo-900 z-10 items-center justify-center p-12"
        style={{ clipPath: "polygon(0 0, 100% 0, 85% 100%, 0% 100%)" }}
      >
        <div className="absolute inset-0 opacity-20 bg-[url('https://images.unsplash.com/photo-1550751827-4bd374c3f58b?q=80&w=2070&auto=format&fit=crop')] bg-cover bg-center mix-blend-overlay" />
        <div className="relative z-20 text-white max-w-lg pr-20">
          <Link to="/" className="inline-flex items-center gap-2 mb-12 hover:opacity-80 transition-opacity">
            <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/30">
              <div className="flex flex-col gap-0.5 relative top-0.5">
                <div className="h-4 w-4 border-l-2 border-t-2 border-white rounded-tl-sm -rotate-45 relative left-1" />
                <div className="h-4 w-4 border-l-2 border-b-2 border-white rounded-bl-sm -rotate-45 relative left-1" />
              </div>
            </div>
            <span className="font-display text-2xl font-black tracking-tight">APEX<span className="text-blue-300">SOLUTIONS</span></span>
          </Link>

          <h1 className="text-5xl font-black mb-6 leading-tight">Your gateway to<br />perfect interviews.</h1>
          <p className="text-blue-100/80 text-lg leading-relaxed mb-8 font-medium">
            Experience the future of preparation with Neumorphic AI panels. Train in a calm, focused environment designed to help you succeed.
          </p>

          <div className="flex bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/20 items-center gap-4 shadow-xl">
            <div className="flex -space-x-3">
              {[1, 2, 3].map(i => (
                <div key={i} className="w-10 h-10 rounded-full border-2 border-indigo-800 bg-slate-300 overflow-hidden">
                  <img src={`https://i.pravatar.cc/100?img=${i + 10}`} alt="User" />
                </div>
              ))}
            </div>
            <div>
              <div className="flex items-center gap-1">
                {[...Array(5)].map((_, i) => <Star key={i} className="w-3 h-3 fill-yellow-400 text-yellow-400" />)}
              </div>
              <p className="text-xs font-bold mt-0.5 text-blue-100">Trusted by 10,000+ candidates</p>
            </div>
          </div>
        </div>
      </div>

      {/* Right Form Panel */}
      <div className="w-full lg:w-[45%] lg:ml-auto min-h-screen flex items-center justify-center p-6 lg:p-12 relative z-20">
        <div className="w-full max-w-md">

          {/* Mobile Logo */}
          <Link to="/" className="flex lg:hidden items-center justify-center gap-2 mb-10">
            <div className="w-10 h-10 rounded-xl neu-convex flex items-center justify-center text-blue-600">
              <div className="flex flex-col gap-0.5 relative top-0.5">
                <div className="h-4 w-4 border-l-2 border-t-2 border-blue-600 rounded-tl-sm -rotate-45 relative left-1" />
                <div className="h-4 w-4 border-l-2 border-b-2 border-blue-600 rounded-bl-sm -rotate-45 relative left-1" />
              </div>
            </div>
            <span className="font-display text-2xl font-black text-slate-800 tracking-tight">APEX<span className="text-blue-600">SOLUTIONS</span></span>
          </Link>

          <NeuCard className="p-8 pb-10">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-black text-slate-800">{isLogin ? 'Welcome back' : 'Create account'}</h2>
              <button
                onClick={() => { setIsLogin(!isLogin); setEmail(""); setPassword(""); setFullName(""); }}
                className="text-sm font-bold text-blue-600 hover:text-blue-700 transition-colors"
              >
                {isLogin ? 'Sign Up' : 'Log In'}
              </button>
            </div>

            <AnimatePresence mode="wait">
              <motion.div
                key={isLogin ? 'login' : 'signup'}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
              >
                <form className="space-y-4" onSubmit={handleSubmit}>

                  {!isLogin && (
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-500 pl-1">Full Name</label>
                      <div className="relative">
                        <User className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <input
                          type="text"
                          placeholder="John Doe"
                          value={fullName}
                          onChange={(e) => setFullName(e.target.value)}
                          className="w-full neu-pressed bg-transparent border-none rounded-2xl py-3.5 pl-11 pr-4 text-sm font-semibold text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                        />
                      </div>
                    </div>
                  )}

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-500 pl-1">Email Address</label>
                    <div className="relative">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                      <input
                        type="email"
                        placeholder="john@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full neu-pressed bg-transparent border-none rounded-2xl py-3.5 pl-11 pr-4 text-sm font-semibold text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex justify-between items-center pl-1">
                      <label className="text-xs font-bold text-slate-500">Password</label>
                      {isLogin && <a href="#" className="text-[10px] font-bold text-blue-600 hover:underline">Forgot password?</a>}
                    </div>
                    <div className="relative">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                      <input
                        type="password"
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full neu-pressed bg-transparent border-none rounded-2xl py-3.5 pl-11 pr-4 text-sm font-semibold text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                      />
                    </div>
                  </div>

                  <NeuButton
                    variant="primary"
                    className="w-full py-4 mt-6 text-sm flex items-center justify-center gap-2"
                    as="button"
                    type="submit"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <>
                        {isLogin ? 'Sign In' : 'Create Account'}
                        <ArrowRight className="h-4 w-4" />
                      </>
                    )}
                  </NeuButton>
                </form>

                <div className="mt-8 relative flex items-center justify-center">
                  <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-300/50"></div></div>
                  <span className="relative bg-[#e0e5ec] px-4 text-xs font-bold text-slate-400">OR CONTINUE WITH</span>
                </div>

                <div className="mt-6 grid grid-cols-2 gap-4">
                  <NeuButton
                    variant="default"
                    className="w-full py-3 flex items-center justify-center gap-2"
                    onClick={() => handleOAuth("google")}
                  >
                    <svg className="h-4 w-4" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" /><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" /><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" /><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" /><path d="M1 1h22v22H1z" fill="none" /></svg>
                    <span className="text-xs">Google</span>
                  </NeuButton>
                  <NeuButton
                    variant="default"
                    className="w-full py-3 flex items-center justify-center gap-2"
                    onClick={() => handleOAuth("github")}
                  >
                    <Github className="h-4 w-4 text-slate-700" />
                    <span className="text-xs">Github</span>
                  </NeuButton>
                </div>
              </motion.div>
            </AnimatePresence>
          </NeuCard>

          <p className="mt-8 text-center text-[10px] font-bold text-slate-400">
            By continuing, you agree to our <a href="#" className="underline">Terms of Service</a> and <a href="#" className="underline">Privacy Policy</a>.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Auth;
