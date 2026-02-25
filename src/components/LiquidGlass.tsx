import { useRef, useState, useCallback, useEffect } from "react";
import { motion, useMotionValue, useSpring, useTransform, useScroll } from "framer-motion";
import { cn } from "@/lib/utils";

/* ===== Cursor Glow Tracker (Adapted for Light Theme) ===== */
export const CursorGlow = () => null;

/* ===== NEUMORPHIC CARD ===== */
interface NeuCardProps {
  children: React.ReactNode;
  className?: string;
  variant?: "flat" | "pressed";
  onClick?: () => void;
  as?: any;
  [key: string]: any;
}

export const NeuCard = ({
  children,
  className,
  variant = "flat",
  onClick,
  as: Component = "div",
  ...props
}: NeuCardProps) => {
  const baseClass = variant === "pressed" ? "neu-pressed" : "neu-flat";
  
  return (
    <Component
      onClick={onClick}
      className={cn(baseClass, "p-6", className)}
      {...props}
    >
      {children}
    </Component>
  );
};

/* ===== NEUMORPHIC BUTTON ===== */
interface NeuButtonProps {
  children: React.ReactNode;
  className?: string;
  variant?: "default" | "primary" | "icon";
  onClick?: () => void;
  as?: any;
  [key: string]: any;
}

export const NeuButton = ({
  children,
  className,
  variant = "default",
  onClick,
  as: Component = "button",
  ...props
}: NeuButtonProps) => {
  
  let baseClass = "btn-neu px-6 py-3 text-sm";
  if (variant === "primary") baseClass = "btn-neu-primary px-6 py-3 text-sm";
  if (variant === "icon") baseClass = "btn-neu p-3 rounded-full";

  return (
    <Component
      onClick={onClick}
      className={cn(baseClass, className)}
      {...props}
    >
      {children}
    </Component>
  );
};

/* ===== Neumorphism Background (Depth & Waves) ===== */
export const NeuBackground = ({ scrollOverride }: { scrollOverride?: import("framer-motion").MotionValue<number> }) => {
  const { scrollYProgress } = useScroll();
  const progress = scrollOverride || scrollYProgress;
  
  // Window Scroll Parallax (Full Page Percentage Maps from 0 to 1)
  const scrollY1 = useTransform(progress, [0, 1], [0, -400]); // Moves way up 
  const scrollY2 = useTransform(progress, [0, 1], [0, 400]);  // Moves way down
  const rotateWavesScroll = useTransform(progress, [0, 1], [0, 15]);
  const scaleWavesScroll = useTransform(progress, [0, 1], [1, 1.2]);

  return (
    <div className="fixed inset-0 pointer-events-none z-[0] overflow-hidden bg-[#e0e5ec]">
      
      {/* Giant flat circle top-right */}
      <motion.div style={{ y: scrollY1 }} className="absolute inset-0 transition-transform duration-700 ease-out">
        <div className="absolute top-[-25vh] right-[-15vw] w-[70vw] h-[70vw] rounded-full neu-hero-flat opacity-100 animate-pulse-glow" style={{ animationDuration: '8s' }} />
      </motion.div>
      
      {/* Giant pressed circle bottom-left */}
      <motion.div style={{ y: scrollY2 }} className="absolute inset-0 transition-transform duration-700 ease-out">
        <div className="absolute bottom-[-25vh] left-[-15vw] w-[80vw] h-[80vw] rounded-full neu-hero-pressed opacity-100" />
      </motion.div>
      
      {/* Wave SVG (Detailed lines) with both scroll rotate and ambient continuous rotate */}
      <motion.div style={{ rotate: rotateWavesScroll, scale: scaleWavesScroll }} className="absolute inset-[-20%] w-[140%] h-[140%] transition-transform duration-700 ease-out">
        <svg className="w-full h-full opacity-40 mix-blend-multiply animate-orbit" style={{ '--orbit-duration': '120s', '--orbit-radius': '0px' } as any} preserveAspectRatio="none" viewBox="0 0 1440 800" fill="none" xmlns="http://www.w3.org/2000/svg">
          {/* Generative-style overlapping lines */}
          <path d="M-100 200 C 300 0, 800 600, 1540 200" stroke="#a3b1c6" strokeWidth="1" fill="none" />
          <path d="M-100 215 C 320 20, 820 620, 1540 215" stroke="#a3b1c6" strokeWidth="1" fill="none" />
          <path d="M-100 230 C 340 40, 840 640, 1540 230" stroke="#a3b1c6" strokeWidth="1" fill="none" />
          <path d="M-100 245 C 360 60, 860 660, 1540 245" stroke="#a3b1c6" strokeWidth="1" fill="none" />
          <path d="M-100 260 C 380 80, 880 680, 1540 260" stroke="#a3b1c6" strokeWidth="1" fill="none" />
          <path d="M-100 275 C 400 100, 900 700, 1540 275" stroke="#a3b1c6" strokeWidth="1" fill="none" />
          
          {/* Second set of intersecting waves */}
          <path d="M-100 500 C 400 700, 1000 100, 1540 400" stroke="#a3b1c6" strokeWidth="0.8" fill="none" />
          <path d="M-100 515 C 420 720, 1020 120, 1540 415" stroke="#a3b1c6" strokeWidth="0.8" fill="none" />
          <path d="M-100 530 C 440 740, 1040 140, 1540 430" stroke="#a3b1c6" strokeWidth="0.8" fill="none" />
          <path d="M-100 545 C 460 760, 1060 160, 1540 445" stroke="#a3b1c6" strokeWidth="0.8" fill="none" />
        </svg>
      </motion.div>

    </div>
  );
};
