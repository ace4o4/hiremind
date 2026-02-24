import { useRef, useState, useCallback, useEffect } from "react";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import { cn } from "@/lib/utils";

/* ===== Cursor Glow Tracker ===== */
export const CursorGlow = () => {
  const [pos, setPos] = useState({ x: -100, y: -100 });

  useEffect(() => {
    const handler = (e: MouseEvent) => setPos({ x: e.clientX, y: e.clientY });
    window.addEventListener("mousemove", handler);
    return () => window.removeEventListener("mousemove", handler);
  }, []);

  return (
    <div
      className="pointer-events-none fixed z-[9999] hidden md:block"
      style={{
        left: pos.x - 16,
        top: pos.y - 16,
        width: 32,
        height: 32,
        borderRadius: "50%",
        border: "1.5px solid hsl(168 100% 48% / 0.5)",
        boxShadow: "0 0 20px 4px hsl(168 100% 48% / 0.15)",
        transition: "left 0.08s ease-out, top 0.08s ease-out",
      }}
    />
  );
};

/* ===== Glass Card with Physics Tilt ===== */
interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  tiltIntensity?: number;
  glowColor?: "teal" | "purple" | "warm";
  onClick?: () => void;
}

export const GlassCard = ({
  children,
  className,
  tiltIntensity = 5,
  glowColor = "teal",
  onClick,
}: GlassCardProps) => {
  const ref = useRef<HTMLDivElement>(null);
  const [ripple, setRipple] = useState<{ x: number; y: number } | null>(null);

  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const rotateX = useSpring(useTransform(y, [-0.5, 0.5], [tiltIntensity, -tiltIntensity]), {
    stiffness: 300,
    damping: 30,
  });
  const rotateY = useSpring(useTransform(x, [-0.5, 0.5], [-tiltIntensity, tiltIntensity]), {
    stiffness: 300,
    damping: 30,
  });

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!ref.current) return;
      const rect = ref.current.getBoundingClientRect();
      x.set((e.clientX - rect.left) / rect.width - 0.5);
      y.set((e.clientY - rect.top) / rect.height - 0.5);
    },
    [x, y]
  );

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
  };

  const handleClick = (e: React.MouseEvent) => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    setRipple({ x: e.clientX - rect.left, y: e.clientY - rect.top });
    setTimeout(() => setRipple(null), 600);
    onClick?.();
  };

  const glowClasses = {
    teal: "hover:shadow-[0_0_50px_-8px_hsl(168_100%_48%/0.3)]",
    purple: "hover:shadow-[0_0_50px_-8px_hsl(270_70%_65%/0.3)]",
    warm: "hover:shadow-[0_0_50px_-8px_hsl(30_100%_60%/0.3)]",
  };

  return (
    <motion.div
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onClick={handleClick}
      style={{ rotateX, rotateY, transformPerspective: 800 }}
      className={cn("glass-card rounded-2xl", glowClasses[glowColor], className)}
    >
      {children}
      {ripple && (
        <span
          className="absolute pointer-events-none rounded-full bg-white/10"
          style={{
            left: ripple.x - 10,
            top: ripple.y - 10,
            width: 20,
            height: 20,
            animation: "ripple 0.6s ease-out forwards",
          }}
        />
      )}
    </motion.div>
  );
};

/* ===== Ambient Orb (Background Decoration) ===== */
interface AmbientOrbProps {
  color?: "teal" | "purple";
  size?: number;
  className?: string;
  delay?: number;
}

export const AmbientOrb = ({ color = "teal", size = 300, className, delay = 0 }: AmbientOrbProps) => {
  const bg =
    color === "teal"
      ? "radial-gradient(circle, hsl(168 100% 48% / 0.12) 0%, transparent 70%)"
      : "radial-gradient(circle, hsl(270 70% 65% / 0.1) 0%, transparent 70%)";

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 2, delay }}
      className={cn("absolute pointer-events-none animate-ambient", className)}
      style={{ width: size, height: size, background: bg, borderRadius: "50%", filter: "blur(40px)" }}
    />
  );
};

/* ===== Floating Particles ===== */
export const FloatingParticles = ({ count = 20 }: { count?: number }) => {
  const particles = Array.from({ length: count }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    y: Math.random() * 100,
    size: Math.random() * 3 + 1,
    duration: Math.random() * 20 + 15,
    delay: Math.random() * 10,
    opacity: Math.random() * 0.4 + 0.1,
  }));

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {particles.map((p) => (
        <motion.div
          key={p.id}
          className="absolute rounded-full"
          style={{
            left: `${p.x}%`,
            top: `${p.y}%`,
            width: p.size,
            height: p.size,
            background: p.id % 3 === 0 
              ? "hsl(270 70% 65% / 0.6)" 
              : "hsl(168 100% 48% / 0.6)",
            boxShadow: `0 0 ${p.size * 3}px hsl(168 100% 48% / 0.3)`,
          }}
          animate={{
            y: [0, -30, 0],
            x: [0, Math.random() * 20 - 10, 0],
            opacity: [p.opacity, p.opacity * 1.5, p.opacity],
          }}
          transition={{
            duration: p.duration,
            delay: p.delay,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      ))}
    </div>
  );
};

/* ===== Liquid Spinner ===== */
export const LiquidSpinner = ({ size = 48 }: { size?: number }) => (
  <div className="liquid-spinner" style={{ width: size, height: size }} />
);

/* ===== Glow Text ===== */
export const GlowText = ({
  children,
  className,
  as: Tag = "span",
}: {
  children: React.ReactNode;
  className?: string;
  as?: "span" | "h1" | "h2" | "h3" | "p";
}) => (
  <Tag className={cn("text-glow", className)}>{children}</Tag>
);
