import { useState, useEffect, useRef, type CSSProperties } from "react";
import {
  BarChart2, Users, Mic, Star, ArrowRight, Menu, X,
  Heart, Shield, Bell, ChevronRight, BookOpen, Brain, Download,
  Smile, Frown, Sun, PartyPopper, UtensilsCrossed,
  Compass, Zap, Flame, HeartHandshake, Palette, Feather,
  Dumbbell, Handshake, GraduationCap, User, MessageCircle,
  Sparkles, Award,
} from "lucide-react";
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip,
  PieChart, Pie, Cell,
} from "recharts";
import kioImg from "@/imports/image.png";
import kinaImg from "@/imports/image-1.png";
import worldBgImg from "@/imports/image_24b8520.png";
import crystalBg from "@/imports/image_5b6ed8e7.png";
import mushroomBg from "@/imports/image_22d709cf.png";
import { ImageWithFallback } from "@/app/components/figma/ImageWithFallback";

// ─── Data ────────────────────────────────────────────────────────────────────

const emotionData = [
  { day: "월", 기쁨: 4, 슬픔: 1, 흥분: 3 },
  { day: "화", 기쁨: 3, 슬픔: 2, 흥분: 2 },
  { day: "수", 기쁨: 5, 슬픔: 0, 흥분: 4 },
  { day: "목", 기쁨: 2, 슬픔: 3, 흥분: 1 },
  { day: "금", 기쁨: 4, 슬픔: 1, 흥분: 5 },
];
const nutritionData = [
  { name: "채소·과일", value: 35, color: "#86EFAC" },
  { name: "단백질", value: 28, color: "#7ECECA" },
  { name: "탄수화물", value: 22, color: "#F9D56E" },
  { name: "유제품", value: 15, color: "#F472B6" },
];
const personalityData = [
  { trait: "사교성", value: 82 },
  { trait: "창의성", value: 71 },
  { trait: "집중력", value: 58 },
  { trait: "활동성", value: 88 },
  { trait: "감수성", value: 76 },
];

// ─── Decorative SVG components ────────────────────────────────────────────────

function Sparkle({ size = 20, color = "#F9D56E", style }: { size?: number; color?: string; style?: CSSProperties }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" style={style} fill="none">
      <path d="M12 2 L13.5 9 L20 12 L13.5 15 L12 22 L10.5 15 L4 12 L10.5 9 Z" fill={color} />
    </svg>
  );
}

function MiniStar({ size = 16, color = "#F9D56E", style }: { size?: number; color?: string; style?: CSSProperties }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" style={style} fill="none">
      <path d="M12 3 L13.8 8.5 L19.5 8.5 L15 12 L16.8 17.5 L12 14 L7.2 17.5 L9 12 L4.5 8.5 L10.2 8.5 Z" fill={color} />
    </svg>
  );
}

function CloudPuff({ className, style, color = "white" }: { className?: string; style?: CSSProperties; color?: string }) {
  return (
    <svg viewBox="0 0 120 60" className={className} style={style} fill="none">
      <circle cx="30" cy="38" r="22" fill={color} opacity="0.72" />
      <circle cx="55" cy="28" r="28" fill={color} opacity="0.78" />
      <circle cx="85" cy="35" r="24" fill={color} opacity="0.72" />
      <rect x="8" y="38" width="104" height="22" rx="2" fill={color} opacity="0.72" />
    </svg>
  );
}

function MushroomPink({ className, style }: { className?: string; style?: CSSProperties }) {
  return (
    <svg viewBox="0 0 100 130" className={className} style={style} fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="mpCap" cx="38%" cy="30%" r="65%" gradientUnits="objectBoundingBox">
          <stop offset="0%" stopColor="#FFB8E8" />
          <stop offset="30%" stopColor="#F472B6" />
          <stop offset="72%" stopColor="#DB2777" />
          <stop offset="100%" stopColor="#9D174D" />
        </radialGradient>
        <radialGradient id="mpSpec" cx="32%" cy="25%" r="38%" gradientUnits="objectBoundingBox">
          <stop offset="0%" stopColor="rgba(255,255,255,0.92)" />
          <stop offset="60%" stopColor="rgba(255,255,255,0.22)" />
          <stop offset="100%" stopColor="rgba(255,255,255,0)" />
        </radialGradient>
        <radialGradient id="mpStem" cx="32%" cy="50%" r="70%" gradientUnits="objectBoundingBox">
          <stop offset="0%" stopColor="#FDE8F4" />
          <stop offset="55%" stopColor="#F9A8D4" />
          <stop offset="100%" stopColor="#EC4899" />
        </radialGradient>
        <filter id="mpShadow" x="-20%" y="-10%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="3" />
        </filter>
      </defs>
      {/* Ground shadow */}
      <ellipse cx="50" cy="126" rx="26" ry="5" fill="rgba(0,0,0,0.22)" filter="url(#mpShadow)" />
      {/* Stem */}
      <path d="M41 124 Q39 98 42 84 Q50 79 58 84 Q61 98 59 124 Z" fill="url(#mpStem)" />
      {/* Stem bottom shadow */}
      <path d="M41 124 Q39 108 42 98 Q50 95 58 98 Q61 108 59 124 Z" fill="rgba(150,40,90,0.18)" />
      {/* Cap base shadow (ambient occlusion) */}
      <ellipse cx="50" cy="68" rx="40" ry="10" fill="rgba(120,20,60,0.3)" />
      {/* Cap 3D */}
      <ellipse cx="50" cy="58" rx="46" ry="30" fill="url(#mpCap)" />
      {/* Cap rim darker edge */}
      <ellipse cx="50" cy="58" rx="46" ry="30" fill="none" stroke="rgba(100,10,50,0.25)" strokeWidth="4" />
      {/* Specular highlight */}
      <ellipse cx="34" cy="44" rx="20" ry="15" fill="url(#mpSpec)" />
      {/* Spots */}
      <circle cx="28" cy="56" r="7" fill="rgba(255,255,255,0.52)" />
      <circle cx="28" cy="56" r="4" fill="rgba(255,255,255,0.78)" />
      <circle cx="64" cy="50" r="5" fill="rgba(255,255,255,0.48)" />
      <circle cx="64" cy="50" r="3" fill="rgba(255,255,255,0.72)" />
      <circle cx="50" cy="68" r="3.5" fill="rgba(255,255,255,0.4)" />
    </svg>
  );
}

function MushroomTeal({ className, style }: { className?: string; style?: CSSProperties }) {
  return (
    <svg viewBox="0 0 90 120" className={className} style={style} fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="mtCap" cx="36%" cy="28%" r="65%" gradientUnits="objectBoundingBox">
          <stop offset="0%" stopColor="#B2F5EC" />
          <stop offset="28%" stopColor="#5EEAD4" />
          <stop offset="68%" stopColor="#0EA5A0" />
          <stop offset="100%" stopColor="#065F5A" />
        </radialGradient>
        <radialGradient id="mtSpec" cx="30%" cy="24%" r="40%">
          <stop offset="0%" stopColor="rgba(255,255,255,0.90)" />
          <stop offset="58%" stopColor="rgba(255,255,255,0.18)" />
          <stop offset="100%" stopColor="rgba(255,255,255,0)" />
        </radialGradient>
        <radialGradient id="mtStem" cx="30%" cy="50%" r="72%">
          <stop offset="0%" stopColor="#CCFBF1" />
          <stop offset="55%" stopColor="#5EEAD4" />
          <stop offset="100%" stopColor="#14B8A6" />
        </radialGradient>
        <filter id="mtShadow"><feGaussianBlur stdDeviation="3" /></filter>
      </defs>
      <ellipse cx="45" cy="116" rx="22" ry="4.5" fill="rgba(0,0,0,0.2)" filter="url(#mtShadow)" />
      <path d="M37 114 Q35 90 38 77 Q45 73 52 77 Q55 90 53 114 Z" fill="url(#mtStem)" />
      <path d="M37 114 Q35 99 38 91 Q45 88 52 91 Q55 99 53 114 Z" fill="rgba(10,80,75,0.18)" />
      <ellipse cx="45" cy="60" rx="36" ry="9" fill="rgba(5,70,65,0.28)" />
      <ellipse cx="45" cy="52" rx="42" ry="27" fill="url(#mtCap)" />
      <ellipse cx="45" cy="52" rx="42" ry="27" fill="none" stroke="rgba(0,60,55,0.22)" strokeWidth="3.5" />
      <ellipse cx="30" cy="39" rx="18" ry="13" fill="url(#mtSpec)" />
      <circle cx="24" cy="50" r="6" fill="rgba(255,255,255,0.50)" />
      <circle cx="24" cy="50" r="3.5" fill="rgba(255,255,255,0.78)" />
      <circle cx="58" cy="44" r="4.5" fill="rgba(255,255,255,0.45)" />
      <circle cx="58" cy="44" r="2.5" fill="rgba(255,255,255,0.70)" />
    </svg>
  );
}

function MushroomOrange({ className, style }: { className?: string; style?: CSSProperties }) {
  return (
    <svg viewBox="0 0 110 140" className={className} style={style} fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="moCap" cx="37%" cy="29%" r="64%" gradientUnits="objectBoundingBox">
          <stop offset="0%" stopColor="#FDDBA0" />
          <stop offset="28%" stopColor="#FB923C" />
          <stop offset="68%" stopColor="#EA580C" />
          <stop offset="100%" stopColor="#9A3412" />
        </radialGradient>
        <radialGradient id="moSpec" cx="31%" cy="24%" r="38%">
          <stop offset="0%" stopColor="rgba(255,255,255,0.90)" />
          <stop offset="60%" stopColor="rgba(255,255,255,0.18)" />
          <stop offset="100%" stopColor="rgba(255,255,255,0)" />
        </radialGradient>
        <radialGradient id="moStem" cx="30%" cy="50%" r="72%">
          <stop offset="0%" stopColor="#FEF0D0" />
          <stop offset="55%" stopColor="#FDBA74" />
          <stop offset="100%" stopColor="#F97316" />
        </radialGradient>
        <filter id="moShadow"><feGaussianBlur stdDeviation="3.5" /></filter>
      </defs>
      <ellipse cx="55" cy="135" rx="30" ry="6" fill="rgba(0,0,0,0.22)" filter="url(#moShadow)" />
      <path d="M44 133 Q41 104 45 89 Q55 84 65 89 Q69 104 66 133 Z" fill="url(#moStem)" />
      <path d="M44 133 Q41 116 45 106 Q55 102 65 106 Q69 116 66 133 Z" fill="rgba(140,50,10,0.18)" />
      <ellipse cx="55" cy="74" rx="48" ry="12" fill="rgba(120,35,5,0.28)" />
      <ellipse cx="55" cy="62" rx="52" ry="34" fill="url(#moCap)" />
      <ellipse cx="55" cy="62" rx="52" ry="34" fill="none" stroke="rgba(110,30,5,0.22)" strokeWidth="4" />
      <ellipse cx="36" cy="46" rx="24" ry="17" fill="url(#moSpec)" />
      <circle cx="28" cy="60" r="8" fill="rgba(255,255,255,0.50)" />
      <circle cx="28" cy="60" r="4.5" fill="rgba(255,255,255,0.78)" />
      <circle cx="72" cy="53" r="6" fill="rgba(255,255,255,0.45)" />
      <circle cx="72" cy="53" r="3.5" fill="rgba(255,255,255,0.72)" />
      <circle cx="56" cy="76" r="4" fill="rgba(255,255,255,0.38)" />
    </svg>
  );
}

// ─── Character Image Components ───────────────────────────────────────────────

// Kio — blue tinted via hue-rotate (원본 핑크 → 파란색)
function KioSVG({ className, style }: { className?: string; style?: CSSProperties }) {
  return (
    <ImageWithFallback
      src={kioImg}
      alt="키오 - Kindy AI 파트너 (남)"
      className={className}
      style={{ filter: "hue-rotate(215deg) saturate(1.05) brightness(1.04)", ...style }}
    />
  );
}

// Kina — original pink
function KinaSVG({ className, style }: { className?: string; style?: CSSProperties }) {
  return (
    <ImageWithFallback
      src={kinaImg}
      alt="키나 - Kindy AI 파트너 (여)"
      className={className}
      style={style}
    />
  );
}

// ─── _unused ─────────────────────────────────────────────────────────────────
// (SVG placeholders removed — real character images used above)
function _placeholder({ className: _c, style: _s }: { className?: string; style?: CSSProperties }) {
  return (
    <svg viewBox="0 0 1 1" className={_c} style={_s} fill="none">
    </svg>
  );
}

// ─── Bubble intro data (module-level, no re-computation) ─────────────────────

const SPLASH_BUBBLES = [
  // size  x%   delay  dur   wobble      gradient
  { s: 310, x: 50, d: 1.00, t: 1.55, a: "kindyBubC", g: "radial-gradient(circle at 32% 28%, rgba(255,255,255,0.58), #F9A8D4 48%, rgba(232,121,160,0.78))" },
  { s: 230, x: 18, d: 1.06, t: 1.38, a: "kindyBubA", g: "radial-gradient(circle at 32% 28%, rgba(255,255,255,0.52), #DDD6FE 48%, rgba(192,132,252,0.74))" },
  { s: 255, x: 82, d: 1.04, t: 1.44, a: "kindyBubB", g: "radial-gradient(circle at 32% 28%, rgba(255,255,255,0.52), #FBCFE8 48%, rgba(244,114,182,0.74))" },
  { s: 168, x:  9, d: 1.12, t: 1.2,  a: "kindyBubB", g: "radial-gradient(circle at 32% 28%, rgba(255,255,255,0.5),  #E9D5FF 48%, rgba(168,85,247,0.70))" },
  { s: 188, x: 38, d: 1.08, t: 1.3,  a: "kindyBubA", g: "radial-gradient(circle at 32% 28%, rgba(255,255,255,0.56), #FDE68A 48%, rgba(249,213,110,0.72))" },
  { s: 158, x: 64, d: 1.10, t: 1.24, a: "kindyBubC", g: "radial-gradient(circle at 32% 28%, rgba(255,255,255,0.5),  #BAE6FD 48%, rgba(56,189,248,0.70))" },
  { s: 174, x: 92, d: 1.14, t: 1.22, a: "kindyBubA", g: "radial-gradient(circle at 32% 28%, rgba(255,255,255,0.5),  #BBF7D0 48%, rgba(74,222,128,0.68))" },
  { s: 118, x:  5, d: 1.18, t: 1.08, a: "kindyBubA", g: "radial-gradient(circle at 32% 28%, rgba(255,255,255,0.5),  #F9A8D4 48%, rgba(232,121,160,0.70))" },
  { s: 132, x: 28, d: 1.15, t: 1.14, a: "kindyBubB", g: "radial-gradient(circle at 32% 28%, rgba(255,255,255,0.5),  #DDD6FE 48%, rgba(192,132,252,0.67))" },
  { s: 108, x: 53, d: 1.20, t: 1.04, a: "kindyBubC", g: "radial-gradient(circle at 32% 28%, rgba(255,255,255,0.56), #FDE68A 48%, rgba(249,213,110,0.67))" },
  { s: 122, x: 72, d: 1.16, t: 1.12, a: "kindyBubA", g: "radial-gradient(circle at 32% 28%, rgba(255,255,255,0.5),  #BAE6FD 48%, rgba(56,189,248,0.64))" },
  { s: 100, x: 95, d: 1.22, t: 1.00, a: "kindyBubB", g: "radial-gradient(circle at 32% 28%, rgba(255,255,255,0.5),  #C4B5E8 48%, rgba(168,85,247,0.64))" },
  { s:  74, x: 16, d: 1.24, t: 0.93, a: "kindyBubC", g: "radial-gradient(circle at 32% 28%, rgba(255,255,255,0.5),  #E9D5FF 48%, rgba(168,85,247,0.62))" },
  { s:  90, x: 44, d: 1.20, t: 0.98, a: "kindyBubB", g: "radial-gradient(circle at 32% 28%, rgba(255,255,255,0.5),  #FBCFE8 48%, rgba(244,114,182,0.64))" },
  { s:  68, x: 67, d: 1.26, t: 0.90, a: "kindyBubA", g: "radial-gradient(circle at 32% 28%, rgba(255,255,255,0.5),  #F9A8D4 48%, rgba(232,121,160,0.62))" },
  { s:  58, x: 34, d: 1.28, t: 0.85, a: "kindyBubC", g: "radial-gradient(circle at 32% 28%, rgba(255,255,255,0.56), #FDE68A 48%, rgba(249,213,110,0.60))" },
  { s:  50, x: 57, d: 1.30, t: 0.82, a: "kindyBubA", g: "radial-gradient(circle at 32% 28%, rgba(255,255,255,0.5),  #DDD6FE 48%, rgba(192,132,252,0.60))" },
  { s:  44, x: 78, d: 1.25, t: 0.84, a: "kindyBubB", g: "radial-gradient(circle at 32% 28%, rgba(255,255,255,0.5),  #BAE6FD 48%, rgba(56,189,248,0.60))" },
  { s:  38, x: 23, d: 1.32, t: 0.78, a: "kindyBubC", g: "radial-gradient(circle at 32% 28%, rgba(255,255,255,0.5),  #BBF7D0 48%, rgba(74,222,128,0.58))" },
  { s:  32, x: 86, d: 1.34, t: 0.75, a: "kindyBubA", g: "radial-gradient(circle at 32% 28%, rgba(255,255,255,0.56), #F9A8D4 48%, rgba(232,121,160,0.58))" },
] as const;

// ─── Splash bubble intro ──────────────────────────────────────────────────────
// Pure CSS timing — zero state changes during animation = zero stutter.

function SplashIntro({ onDone }: { onDone: () => void }) {
  const [done, setDone] = useState(false);
  // Single state change happens AFTER all CSS animations finish — no mid-animation re-renders.
  useEffect(() => {
    const t = setTimeout(() => { setDone(true); onDone(); }, 3000);
    return () => clearTimeout(t);
  }, [onDone]);

  if (done) return null;

  return (
    <div className="fixed inset-0 z-[9999] overflow-hidden" style={{ pointerEvents: "none" }}>

      {/* ── Gradient background — holds full, then fades away ── */}
      <div
        className="absolute inset-0"
        style={{
          background: "linear-gradient(160deg, #C4B0F0 0%, #E2B2DC 22%, #F7BBCC 52%, #FFCFB8 100%)",
          animation: "kindySplashBg 3s ease-out forwards",
        }}
      />

      {/* ── Brand content — logo + characters, fades before bubbles peak ── */}
      <div
        className="absolute inset-0 flex flex-col items-center justify-center gap-7 select-none"
        style={{ animation: "kindySplashContent 3s ease-out forwards" }}
      >
        {/* Sparkle decorations */}
        <Sparkle size={24} color="#F9D56E" style={{ position: "absolute", top: "16%", left: "12%", opacity: 0.75 }} />
        <Sparkle size={16} color="white"   style={{ position: "absolute", top: "20%", right: "14%", opacity: 0.55 }} />
        <MiniStar size={18} color="#F9D56E" style={{ position: "absolute", bottom: "20%", left: "16%", opacity: 0.65 }} />
        <MiniStar size={13} color="white"   style={{ position: "absolute", bottom: "26%", right: "20%", opacity: 0.5 }} />

        {/* Logo */}
        <div className="flex items-center gap-4">
          <div
            style={{
              width: 72, height: 72, borderRadius: 20,
              background: "rgba(255,255,255,0.28)",
              backdropFilter: "blur(14px)",
              border: "2px solid rgba(255,255,255,0.55)",
              boxShadow: "0 8px 32px rgba(0,0,0,0.12), inset 0 1px 0 rgba(255,255,255,0.6)",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}
          >
            <MiniStar size={34} color="white" />
          </div>
          <div
            style={{
              fontFamily: "'Fredoka', sans-serif",
              fontSize: 72, fontWeight: 700,
              color: "white", lineHeight: 1,
              textShadow: "0 4px 24px rgba(100,40,80,0.2), 0 2px 8px rgba(0,0,0,0.12)",
            }}
          >
            Kindy
          </div>
        </div>

        <div style={{ color: "rgba(255,255,255,0.82)", fontSize: 18, fontWeight: 600, textShadow: "0 2px 8px rgba(0,0,0,0.1)" }}>
          아이의 하루, 더 가까이
        </div>

        {/* Characters */}
        <div style={{ display: "flex", alignItems: "flex-end", gap: 56 }}>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
            <KioSVG className="w-36 h-auto" style={{ filter: "drop-shadow(0 8px 24px rgba(59,99,255,0.35)) hue-rotate(215deg) saturate(1.05) brightness(1.04)" }} />
            <div style={{
              fontSize: 13, fontWeight: 700, padding: "5px 16px", borderRadius: 999,
              background: "rgba(219,234,254,0.55)", color: "#1D4ED8",
              backdropFilter: "blur(8px)", border: "1px solid rgba(255,255,255,0.45)",
            }}>키오</div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
            <KinaSVG className="w-36 h-auto" style={{ filter: "drop-shadow(0 8px 24px rgba(232,121,160,0.4))" }} />
            <div style={{
              fontSize: 13, fontWeight: 700, padding: "5px 16px", borderRadius: 999,
              background: "rgba(252,231,243,0.55)", color: "#BE185D",
              backdropFilter: "blur(8px)", border: "1px solid rgba(255,255,255,0.45)",
            }}>키나</div>
          </div>
        </div>
      </div>

      {/* ── Bubbles — rise from bottom with staggered delays, no JS phase switch ── */}
      {SPLASH_BUBBLES.map((b, i) => (
        <div
          key={i}
          style={{
            position: "absolute",
            width: b.s, height: b.s,
            left: `${b.x}%`,
            bottom: 0,
            transform: "translateX(-50%)",
            borderRadius: "50%",
            background: b.g,
            border: "1px solid rgba(255,255,255,0.38)",
            boxShadow: "inset 0 3px 10px rgba(255,255,255,0.32)",
            willChange: "transform, opacity",
            animation: `${b.a} ${b.t}s ${b.d}s cubic-bezier(0.25, 0.46, 0.45, 0.94) both`,
          }}
        />
      ))}

      <style>{`
        /* Background fades: hold full → fade out as bubbles take over */
        @keyframes kindySplashBg {
          0%,  33% { opacity: 1; }
          58%, 100% { opacity: 0; }
        }
        /* Content fades: hold → shrink-fade before bubbles peak */
        @keyframes kindySplashContent {
          0%,  28% { opacity: 1; transform: scale(1); }
          44%, 100% { opacity: 0; transform: scale(0.91); }
        }
        /* Three wobble paths so bubbles don't all go straight up */
        @keyframes kindyBubA {
          0%   { transform: translateX(-50%) translateY(0)      scale(1);    opacity: 0; }
          7%   { opacity: 0.92; }
          43%  { transform: translateX(-42%) translateY(-43vh)  scale(0.87); opacity: 0.75; }
          74%  { transform: translateX(-57%) translateY(-82vh)  scale(0.56); opacity: 0.28; }
          100% { transform: translateX(-47%) translateY(-122vh) scale(0.08); opacity: 0; }
        }
        @keyframes kindyBubB {
          0%   { transform: translateX(-50%) translateY(0)      scale(1);    opacity: 0; }
          7%   { opacity: 0.9; }
          43%  { transform: translateX(-59%) translateY(-39vh)  scale(0.84); opacity: 0.72; }
          74%  { transform: translateX(-43%) translateY(-79vh)  scale(0.53); opacity: 0.25; }
          100% { transform: translateX(-53%) translateY(-120vh) scale(0.06); opacity: 0; }
        }
        @keyframes kindyBubC {
          0%   { transform: translateX(-50%) translateY(0)      scale(1);    opacity: 0; }
          7%   { opacity: 0.88; }
          43%  { transform: translateX(-50%) translateY(-45vh)  scale(0.89); opacity: 0.70; }
          74%  { transform: translateX(-50%) translateY(-83vh)  scale(0.58); opacity: 0.22; }
          100% { transform: translateX(-50%) translateY(-124vh) scale(0.04); opacity: 0; }
        }
      `}</style>
    </div>
  );
}

// ─── Navbar ──────────────────────────────────────────────────────────────────

function Navbar({ onOpenCharacters, onOpenLogin }: { onOpenCharacters: () => void; onOpenLogin: () => void }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const overlayRef = useRef<HTMLDivElement>(null);
  const busy = useRef(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 30);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    e.preventDefault();
    if (busy.current || !overlayRef.current) return;
    busy.current = true;
    setMenuOpen(false);

    const overlay = overlayRef.current;

    // ── 1. Fade IN (screen goes white) ──
    overlay.style.transition = "opacity 0.3s ease-in";
    overlay.style.opacity = "1";
    overlay.style.pointerEvents = "auto";

    setTimeout(() => {
      // ── 2. Scroll while covered ──
      const el = document.querySelector(href);
      el?.scrollIntoView({ behavior: "instant" });

      // ── 3. Fade OUT (new section revealed) ──
      overlay.style.transition = "opacity 0.45s ease-out";
      overlay.style.opacity = "0";

      setTimeout(() => {
        overlay.style.pointerEvents = "none";
        busy.current = false;
      }, 460);
    }, 310);
  };

  const NAV_LINKS = [["#features", "서비스 소개"], ["#how", "이용 방법"], ["#analytics", "분석 기능"], ["#personas", "사용자"]] as const;

  return (
    <>
      {/* ── Fade overlay — always in DOM, opacity-driven via ref ── */}
      <div
        ref={overlayRef}
        className="fixed inset-0"
        style={{
          zIndex: 9000,
          opacity: 0,
          pointerEvents: "none",
          background: "linear-gradient(135deg, #EDE8FF 0%, #FFE8F6 50%, #FFF5E8 100%)",
        }}
      />

      <nav
        className="fixed top-0 left-0 right-0 z-50 transition-all duration-300"
        style={scrolled
          ? { background: "rgba(255,250,253,0.92)", backdropFilter: "blur(16px)", borderBottom: "1px solid rgba(232,121,160,0.15)", boxShadow: "0 2px 20px rgba(232,121,160,0.08)" }
          : {}
        }
      >
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          {/* Logo */}
          <a href="#" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform"
              style={{ background: "linear-gradient(135deg, #E879A0, #F472B6)" }}>
              <MiniStar size={18} color="white" />
            </div>
            <span className={`text-2xl font-bold tracking-tight transition-colors ${scrolled ? "text-foreground" : "text-white"}`}
              style={{ fontFamily: "'Fredoka', sans-serif" }}>
              Kindy
            </span>
          </a>

          {/* Desktop links */}
          <div className={`hidden md:flex items-center gap-8 text-sm font-semibold ${scrolled ? "text-foreground/70" : "text-white/85"}`}>
            {NAV_LINKS.map(([href, label]) => (
              <a key={href} href={href}
                className="hover:opacity-100 opacity-80 transition-opacity cursor-pointer"
                onClick={(e) => handleNavClick(e, href)}>
                {label}
              </a>
            ))}
          </div>

          {/* Desktop CTA */}
          <div className="hidden md:flex items-center gap-3">
            <button
              onClick={onOpenCharacters}
              className="flex items-center gap-1.5 text-sm font-bold px-4 py-2 rounded-full transition-all hover:scale-105 active:scale-95"
              style={{
                background: scrolled ? "rgba(232,121,160,0.1)" : "rgba(255,255,255,0.12)",
                color: scrolled ? "#E879A0" : "white",
                border: scrolled ? "1px solid rgba(232,121,160,0.3)" : "1px solid rgba(255,255,255,0.25)",
              }}>
              <Sparkles className="w-3.5 h-3.5" />
              캐릭터 소개
            </button>
            <button onClick={onOpenLogin} className={`text-sm font-semibold hover:opacity-70 transition-opacity ${scrolled ? "text-foreground" : "text-white"}`}>
              로그인
            </button>
            <button className="text-sm font-bold px-5 py-2.5 rounded-full transition-all shadow-sm hover:shadow-md active:scale-95"
              style={{ background: scrolled ? "linear-gradient(135deg,#E879A0,#F472B6)" : "white",
                color: scrolled ? "white" : "#E879A0" }}>
              무료 시작하기
            </button>
          </div>

          {/* Hamburger */}
          <button className={`md:hidden ${scrolled ? "text-foreground" : "text-white"}`}
            onClick={() => setMenuOpen(!menuOpen)}>
            {menuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {menuOpen && (
          <div className="md:hidden bg-white border-t border-border px-6 py-5 space-y-1">
            {NAV_LINKS.map(([href, label]) => (
              <a key={href} href={href}
                className="block text-sm font-semibold text-foreground py-3 border-b border-border/50 cursor-pointer"
                onClick={(e) => handleNavClick(e, href)}>
                {label}
              </a>
            ))}
            <div className="pt-4 flex flex-wrap gap-3">
              <button
                onClick={() => { setMenuOpen(false); onOpenCharacters(); }}
                className="flex items-center gap-1.5 text-sm font-bold px-4 py-2 rounded-full"
                style={{background:"rgba(232,121,160,0.1)", color:"#E879A0", border:"1px solid rgba(232,121,160,0.3)"}}>
                <Sparkles className="w-3.5 h-3.5" />
                캐릭터 소개
              </button>
              <button onClick={() => { setMenuOpen(false); onOpenLogin(); }} className="text-sm font-semibold text-foreground">로그인</button>
              <button className="text-sm font-bold px-5 py-2.5 rounded-full text-white"
                style={{ background: "linear-gradient(135deg,#E879A0,#F472B6)" }}>
                무료 시작하기
              </button>
            </div>
          </div>
        )}
      </nav>
    </>
  );
}

// ─── Hero ─────────────────────────────────────────────────────────────────────

const heroEmotions = [
  { Icon: Smile,          color: "#F9D56E", text: "오늘 블록 놀이 너무 재밌었어요!" },
  { Icon: Frown,          color: "#A78BFA", text: "친구 수호랑 잠깐 싸웠어요..." },
  { Icon: Sun,            color: "#7ECECA", text: "오늘 그림 그리기 너무 좋았어요!" },
  { Icon: PartyPopper,    color: "#F472B6", text: "선생님한테 칭찬 받았어요!" },
  { Icon: UtensilsCrossed,color: "#86EFAC", text: "점심에 김치볶음밥 먹었어요!" },
];

const KIO_TRAITS = [
  { Icon: Shield,  text: "용감해요" },
  { Icon: Compass, text: "탐험왕" },
  { Icon: Zap,     text: "활동적이에요" },
  { Icon: Flame,   text: "열정가득" },
];

const KINA_TRAITS = [
  { Icon: Heart,        text: "따뜻해요" },
  { Icon: HeartHandshake, text: "공감왕" },
  { Icon: Palette,      text: "감성충만" },
  { Icon: Feather,      text: "섬세해요" },
];

const KIO_INFO = {
  name: "키오",
  subtitle: "씩씩한 AI 탐험 파트너",
  color: "#1D4ED8",
  darkColor: "#1E3A8A",
  lightBg: "linear-gradient(135deg, #DBEAFE 0%, #BFDBFE 100%)",
  cardBg: "rgba(219,234,254,0.55)",
  border: "rgba(147,197,253,0.7)",
  speech: "안녕! 나는 키오야! 오늘 어떤 멋진 일이 있었어? 신나는 것도, 힘든 것도 나한테 다 말해줘! 우리 같이 오늘 하루 기록하자~!",
  desc: "씩씩하고 에너지 넘치는 키오는 아이의 모든 모험과 도전을 함께 기록해요. 어떤 이야기도 놓치지 않는 최고의 탐험 파트너예요!",
  traits: KIO_TRAITS,
};

const KINA_INFO = {
  name: "키나",
  subtitle: "따뜻한 AI 감성 친구",
  color: "#BE185D",
  darkColor: "#9D174D",
  lightBg: "linear-gradient(135deg, #FCE7F3 0%, #FBCFE8 100%)",
  cardBg: "rgba(252,231,243,0.55)",
  border: "rgba(251,207,232,0.8)",
  speech: "안녕~ 나는 키나야! 오늘 기분이 어때? 기쁜 일도 슬픈 일도 키나한테 살짝 이야기해줘~ 소중한 하루를 같이 기억하자!",
  desc: "따뜻하고 섬세한 키나는 아이의 감정과 마음을 누구보다 잘 이해해요. 기쁨부터 슬픔까지, 모든 마음을 소중히 들어주는 다정한 친구예요!",
  traits: KINA_TRAITS,
};

function HeroSection() {
  const [emotionIdx, setEmotionIdx] = useState(0);
  const [fade, setFade] = useState(true);
  const [selectedChar, setSelectedChar] = useState<"kio" | "kina" | null>(null);
  const [kioHover, setKioHover] = useState(false);
  const [kinaHover, setKinaHover] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setFade(false);
      setTimeout(() => { setEmotionIdx((i) => (i + 1) % heroEmotions.length); setFade(true); }, 300);
    }, 2800);
    return () => clearInterval(interval);
  }, []);

  return (
    <section className="relative min-h-screen flex items-center overflow-hidden pt-20"
      style={{ background: "linear-gradient(160deg, #C8B8F0 0%, #E0C8F0 18%, #F4C8E0 40%, #FFD8EC 62%, #FFE8C8 100%)" }}>

      {/* Background cloud puffs */}
      <CloudPuff className="absolute top-14 left-4 w-48 opacity-50" />
      <CloudPuff className="absolute top-28 right-8 w-36 opacity-40" />
      <CloudPuff className="absolute bottom-32 left-1/4 w-40 opacity-35" />

      {/* Floating sparkles */}
      {[
        { top: "15%", left: "6%", size: 22, opacity: 0.7, color: "#F9D56E" },
        { top: "38%", left: "2%", size: 14, opacity: 0.5, color: "#F472B6" },
        { top: "22%", right: "5%", size: 18, opacity: 0.6, color: "#F9D56E" },
        { top: "68%", right: "3%", size: 12, opacity: 0.45, color: "#A78BFA" },
        { top: "55%", left: "48%", size: 10, opacity: 0.4, color: "#F9D56E" },
      ].map((s, i) => (
        <div key={i} className="absolute animate-pulse pointer-events-none"
          style={{ top: s.top, left: "left" in s ? s.left : undefined, right: "right" in s ? s.right as string : undefined,
            animationDelay: `${i * 0.4}s`, animationDuration: "2.8s" }}>
          <Sparkle size={s.size} color={s.color} style={{ opacity: s.opacity }} />
        </div>
      ))}

      {/* Mini floating stars */}
      {[
        { top: "30%", left: "10%", size: 10, opacity: 0.55 },
        { top: "70%", left: "15%", size: 8, opacity: 0.4 },
        { top: "20%", right: "12%", size: 12, opacity: 0.5 },
        { top: "60%", right: "9%", size: 8, opacity: 0.45 },
        { top: "45%", left: "28%", size: 6, opacity: 0.35 },
      ].map((s, i) => (
        <MiniStar key={i} size={s.size} color="#F9D56E"
          style={{ position: "absolute", top: s.top, left: "left" in s ? s.left : undefined,
            right: "right" in s ? (s as { right: string }).right : undefined, opacity: s.opacity }} />
      ))}

      <div className="max-w-6xl mx-auto px-6 py-16 w-full">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          {/* Left: Text */}
          <div className="space-y-7 order-2 md:order-1">
            <div className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-bold"
              style={{ background: "rgba(255,255,255,0.55)", backdropFilter: "blur(8px)",
                border: "1px solid rgba(255,255,255,0.6)", color: "#C0397A" }}>
              <MiniStar size={14} color="#F9D56E" />
              AI 기반 키즈 데이터 플랫폼
            </div>

            <h1 className="text-5xl md:text-6xl font-bold leading-tight"
              style={{ fontFamily: "'Fredoka', sans-serif", color: "#3B1355", letterSpacing: "-0.01em" }}>
              아이의 하루를<br />
              <span style={{ background: "linear-gradient(135deg, #E879A0, #C084FC)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                함께 기억해요
              </span>
            </h1>

            <p className="text-lg leading-relaxed" style={{ color: "#6B3580" }}>
              키오와 키나가 아이의 모든 이야기를 들어줘요.<br />
              기쁨, 슬픔, 화남, 설렘까지 — 매일의 소중한 순간을<br />
              부모님과 선생님께 아름답게 전달해드려요.
            </p>

            {/* Animated chat bubble */}
            <div className="rounded-3xl p-4 max-w-xs"
              style={{ background: "rgba(255,255,255,0.65)", backdropFilter: "blur(12px)",
                border: "1px solid rgba(255,255,255,0.8)", boxShadow: "0 4px 24px rgba(232,121,160,0.12)" }}>
              <div className="flex items-center gap-2 mb-2">
                <div className="w-7 h-7 rounded-full flex items-center justify-center"
                  style={{ background: "linear-gradient(135deg,#E879A0,#F472B6)" }}>
                  <Mic className="w-3.5 h-3.5 text-white" />
                </div>
                <span className="text-xs font-bold" style={{ color: "#A06080" }}>아이가 말해요</span>
              </div>
              <div className="flex items-center gap-2 transition-opacity duration-300" style={{ opacity: fade ? 1 : 0 }}>
                {(() => { const { Icon, color, text } = heroEmotions[emotionIdx]; return (
                  <>
                    <span className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0"
                      style={{ background: `${color}22` }}>
                      <Icon style={{ width: 13, height: 13, color }} strokeWidth={2.5} />
                    </span>
                    <span className="text-sm font-bold" style={{ color: "#3B1355" }}>{text}</span>
                  </>
                ); })()}
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <button className="font-bold px-8 py-4 rounded-2xl transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0 flex items-center justify-center gap-2 text-sm text-white"
                style={{ background: "linear-gradient(135deg, #E879A0 0%, #C084FC 100%)" }}>
                무료로 시작하기
                <ArrowRight className="w-5 h-5" />
              </button>
              <button className="font-semibold px-8 py-4 rounded-2xl transition-all flex items-center justify-center gap-2 text-sm"
                style={{ background: "rgba(255,255,255,0.65)", border: "2px solid rgba(232,121,160,0.3)",
                  color: "#C0397A", backdropFilter: "blur(8px)" }}>
                데모 영상 보기
                <div className="w-5 h-5 rounded-full flex items-center justify-center"
                  style={{ background: "rgba(232,121,160,0.2)" }}>
                  <div className="w-0 h-0 border-t-[4px] border-t-transparent border-b-[4px] border-b-transparent border-l-[7px] ml-0.5"
                    style={{ borderLeftColor: "#E879A0" }} />
                </div>
              </button>
            </div>

            {/* Stats */}
            <div className="flex items-center gap-6 pt-2 flex-wrap">
              {[{ value: "2,400+", label: "이용 아동" }, { value: "180+", label: "파트너 기관" }, { value: "98%", label: "만족도" }].map((s, i) => (
                <div key={i} className="flex items-center gap-5">
                  {i > 0 && <div className="w-px h-10" style={{ background: "rgba(192,57,122,0.2)" }} />}
                  <div>
                    <div className="text-2xl font-bold" style={{ fontFamily: "'Fredoka', sans-serif", color: "#3B1355" }}>
                      {s.value}
                    </div>
                    <div className="text-xs" style={{ color: "#A06080" }}>{s.label}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right: Kio + Kina side by side */}
          <div className="relative flex items-end justify-center h-[520px] order-1 md:order-2">
            {/* Soft glow behind characters */}
            <div className="absolute inset-0 rounded-3xl pointer-events-none"
              style={{ background: "radial-gradient(ellipse at 30% 75%, rgba(184,212,255,0.4) 0%, transparent 52%), radial-gradient(ellipse at 70% 75%, rgba(255,181,200,0.38) 0%, transparent 52%)" }} />

            {/* Hint tooltip — shown when no char selected */}
            {!selectedChar && (
              <div className="absolute top-0 left-1/2 -translate-x-1/2 text-xs font-semibold px-4 py-2 rounded-full pointer-events-none"
                style={{ background: "rgba(255,255,255,0.7)", backdropFilter: "blur(8px)", color: "#A06080",
                  border: "1px solid rgba(255,255,255,0.8)", animation: "float 3s ease-in-out infinite" }}>
                캐릭터를 클릭해서 소개를 확인해요!
              </div>
            )}

            {/* Kio — blue, left */}
            <div className="absolute left-0 bottom-0 z-10 flex flex-col items-center"
              style={{ animation: "float 3.2s ease-in-out infinite" }}>
              <div
                className="relative cursor-pointer"
                onMouseEnter={() => setKioHover(true)}
                onMouseLeave={() => setKioHover(false)}
                onClick={() => setSelectedChar(selectedChar === "kio" ? null : "kio")}
                style={{
                  transform: kioHover ? "scale(1.08)" : "scale(1)",
                  transition: "transform 0.28s cubic-bezier(0.34, 1.56, 0.64, 1)",
                  filter: selectedChar === "kina" ? "brightness(0.7) blur(1px)" : "none",
                }}
              >
                <KioSVG className="w-52 h-auto drop-shadow-2xl" />
                {/* Name badge */}
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 text-xs font-bold px-4 py-1.5 rounded-full shadow-lg whitespace-nowrap"
                  style={{ background: "linear-gradient(135deg,#DBEAFE,#BFDBFE)", color: "#1D4ED8",
                    border: "1.5px solid rgba(147,197,253,0.7)",
                    transform: kioHover ? "scale(1.05)" : "scale(1)",
                    transition: "transform 0.2s ease" }}>
                  키오 (남)
                </div>
                {/* Pulse ring on hover */}
                {kioHover && (
                  <div className="absolute inset-0 rounded-full pointer-events-none"
                    style={{ boxShadow: "0 0 0 12px rgba(147,197,253,0.2), 0 0 0 24px rgba(147,197,253,0.08)" }} />
                )}
              </div>
            </div>

            {/* Center floating diary card */}
            <div className="absolute top-10 left-1/2 -translate-x-1/2 rounded-3xl p-4 shadow-2xl w-44 z-20 pointer-events-none"
              style={{ background: "rgba(255,255,255,0.88)", backdropFilter: "blur(18px)",
                border: "1.5px solid rgba(255,255,255,0.95)",
                animation: "float 4s ease-in-out infinite", animationDelay: "0.5s",
                boxShadow: "0 16px 48px rgba(232,121,160,0.18)",
                opacity: selectedChar ? 0 : 1, transition: "opacity 0.2s" }}>
              <div className="text-center mb-2">
                <div className="flex justify-center mb-1">
                  <BookOpen className="w-6 h-6" style={{ color: "#E879A0" }} />
                </div>
                <div className="font-bold text-xs" style={{ fontFamily: "'Fredoka', sans-serif", color: "#3B1355" }}>오늘의 일기</div>
                <div className="text-xs" style={{ color: "#A06080" }}>2025.07.23 수</div>
              </div>
              <div className="space-y-1.5">
                {[
                  { Icon: Smile,          color: "#F9D56E", text: "행복한 하루" },
                  { Icon: UtensilsCrossed,color: "#86EFAC", text: "비빔밥 점심" },
                  { Icon: Users,          color: "#C084FC", text: "친구 3명과 놀기" },
                ].map(({ Icon, color, text }) => (
                  <div key={text} className="flex items-center gap-2 rounded-xl px-2 py-1.5"
                    style={{ background: "rgba(232,121,160,0.08)" }}>
                    <span className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0"
                      style={{ background: `${color}33` }}>
                      <Icon style={{ width: 11, height: 11, color }} strokeWidth={2.5} />
                    </span>
                    <span className="text-xs font-medium" style={{ color: "#6B3580" }}>{text}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Kina — pink, right */}
            <div className="absolute right-0 bottom-0 z-10 flex flex-col items-center"
              style={{ animation: "float 3.5s ease-in-out infinite", animationDelay: "1s" }}>
              <div
                className="relative cursor-pointer"
                onMouseEnter={() => setKinaHover(true)}
                onMouseLeave={() => setKinaHover(false)}
                onClick={() => setSelectedChar(selectedChar === "kina" ? null : "kina")}
                style={{
                  transform: kinaHover ? "scale(1.08)" : "scale(1)",
                  transition: "transform 0.28s cubic-bezier(0.34, 1.56, 0.64, 1)",
                  filter: selectedChar === "kio" ? "brightness(0.7) blur(1px)" : "none",
                }}
              >
                <KinaSVG className="w-52 h-auto drop-shadow-2xl" />
                {/* Name badge */}
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 text-xs font-bold px-4 py-1.5 rounded-full shadow-lg whitespace-nowrap"
                  style={{ background: "linear-gradient(135deg,#FCE7F3,#FBCFE8)", color: "#BE185D",
                    border: "1.5px solid rgba(251,207,232,0.8)",
                    transform: kinaHover ? "scale(1.05)" : "scale(1)",
                    transition: "transform 0.2s ease" }}>
                  키나 (여)
                </div>
                {kinaHover && (
                  <div className="absolute inset-0 rounded-full pointer-events-none"
                    style={{ boxShadow: "0 0 0 12px rgba(251,207,232,0.25), 0 0 0 24px rgba(251,207,232,0.1)" }} />
                )}
              </div>
            </div>

            {/* ── Character intro card ── */}
            {selectedChar && (() => {
              const info = selectedChar === "kio" ? KIO_INFO : KINA_INFO;
              return (
                <div
                  className="absolute inset-0 z-30 flex items-center justify-center"
                  style={{ background: "rgba(255,255,255,0.18)", backdropFilter: "blur(4px)" }}
                  onClick={() => setSelectedChar(null)}
                >
                  <div
                    className="relative rounded-3xl p-5 shadow-2xl w-72"
                    style={{
                      background: "rgba(255,255,255,0.97)",
                      border: `2px solid ${info.border}`,
                      boxShadow: `0 24px 60px rgba(0,0,0,0.12), 0 0 0 1px ${info.border}`,
                      animation: "charCardIn 0.32s cubic-bezier(0.34,1.56,0.64,1) forwards",
                    }}
                    onClick={(e) => e.stopPropagation()}
                  >
                    {/* Close */}
                    <button
                      onClick={() => setSelectedChar(null)}
                      className="absolute top-3 right-3 w-7 h-7 rounded-full flex items-center justify-center transition-colors"
                      style={{ background: "rgba(0,0,0,0.06)", color: "#888", fontSize: 16, lineHeight: 1 }}>
                      ×
                    </button>

                    {/* Header: image + name */}
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-16 h-16 rounded-2xl overflow-hidden flex items-end justify-center flex-shrink-0"
                        style={{ background: info.lightBg }}>
                        {selectedChar === "kio"
                          ? <KioSVG className="w-12 h-auto" />
                          : <KinaSVG className="w-12 h-auto" />}
                      </div>
                      <div>
                        <div className="font-bold text-xl" style={{ fontFamily: "'Fredoka', sans-serif", color: info.color }}>
                          {info.name}
                        </div>
                        <div className="text-xs font-semibold mt-0.5" style={{ color: "#A06080" }}>
                          {info.subtitle}
                        </div>
                      </div>
                    </div>

                    {/* Speech bubble */}
                    <div className="relative rounded-2xl px-4 py-3 mb-3"
                      style={{ background: info.lightBg }}>
                      {/* Bubble tail */}
                      <div className="absolute -top-2 left-8 w-4 h-4 rotate-45 rounded-sm"
                        style={{ background: selectedChar === "kio" ? "#DBEAFE" : "#FCE7F3" }} />
                      <p className="text-sm font-semibold leading-relaxed relative z-10"
                        style={{ color: info.darkColor }}>
                        "{info.speech}"
                      </p>
                    </div>

                    {/* Description */}
                    <p className="text-xs leading-relaxed mb-3" style={{ color: "#6B3580" }}>
                      {info.desc}
                    </p>

                    {/* Trait chips */}
                    <div className="flex flex-wrap gap-1.5">
                      {info.traits.map(({ Icon, text }) => (
                        <span key={text} className="flex items-center gap-1 text-xs font-bold px-3 py-1 rounded-full"
                          style={{ background: info.lightBg, color: info.color }}>
                          <Icon style={{ width: 11, height: 11 }} strokeWidth={2.5} />
                          {text}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      </div>

      {/* Mushroom bottom border */}
      <div className="absolute bottom-0 left-0 right-0 flex items-end justify-around pointer-events-none overflow-hidden">
        <MushroomTeal className="w-16 h-auto opacity-70" style={{ marginBottom: "-8px" }} />
        <MushroomPink className="w-24 h-auto opacity-80" style={{ marginBottom: "-12px" }} />
        <MushroomOrange className="w-20 h-auto opacity-65" style={{ marginBottom: "-8px" }} />
        <MushroomPink className="w-14 h-auto opacity-60" style={{ marginBottom: "-6px" }} />
        <MushroomTeal className="w-20 h-auto opacity-75" style={{ marginBottom: "-10px" }} />
        <MushroomOrange className="w-16 h-auto opacity-60" style={{ marginBottom: "-6px" }} />
        <MushroomPink className="w-18 h-auto opacity-70" style={{ marginBottom: "-10px" }} />
        <div className="absolute bottom-0 left-0 right-0 h-10" style={{ background: "#FFFAFD" }} />
      </div>

      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-14px); }
        }
        @keyframes charCardIn {
          from { opacity: 0; transform: scale(0.82) translateY(12px); }
          to   { opacity: 1; transform: scale(1)    translateY(0); }
        }
      `}</style>
    </section>
  );
}

// ─── Features ─────────────────────────────────────────────────────────────────

const features = [
  {
    icon: Mic, icon2: Mic,
    bg: "#FEE2E2", iconColor: "#E879A0",
    tag: "AI 대화 일기",
    title: "말하면 일기가 돼요",
    desc: "음성이나 텍스트로 자유롭게 대화하면 키오/키나 AI가 하루를 아름다운 일기로 정리해줘요.",
    points: ["음성 인식 지원", "자연어 감정 분석", "자동 일기 생성"],
  },
  {
    icon: BarChart2, icon2: BarChart2,
    bg: "#EDE9FE", iconColor: "#A78BFA",
    tag: "스마트 분석",
    title: "데이터로 성장을 확인해요",
    desc: "음식 섭취, 건강 상태, 교우관계, 성격 성향, 학습 발달을 5가지 관점으로 분석해요.",
    points: ["식습관 & 영양 분석", "MBTI 성향 파악", "학습 발달 추적"],
  },
  {
    icon: Users,
    bg: "#DCFCE7", iconColor: "#22C55E",
    tag: "소통 브릿지",
    title: "부모님-선생님 연결",
    desc: "데이터를 바탕으로 부모님과 선생님이 아이를 더 잘 이해하고 원활하게 소통해요.",
    points: ["실시간 알림", "교사-부모 채팅", "성장 리포트 공유"],
  },
];

function FeaturesSection() {
  return (
    <section id="features" className="py-28 bg-background relative overflow-hidden">
      {/* Decorative */}
      <Sparkle size={28} color="#F9D56E" style={{ position: "absolute", top: 40, right: 80, opacity: 0.3 }} />
      <MiniStar size={16} color="#F472B6" style={{ position: "absolute", bottom: 60, left: 60, opacity: 0.35 }} />

      <div className="max-w-6xl mx-auto px-6">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-bold mb-5"
            style={{ background: "linear-gradient(135deg, #FCE7F3, #EDE9FE)", color: "#C0397A" }}>
            <MiniStar size={14} color="#F9D56E" /> 핵심 기능
          </div>
          <h2 className="text-4xl md:text-5xl font-bold mb-5" style={{ color: "#3B1355" }}>
            아이의 성장을<br />데이터로 만나요
          </h2>
          <p className="text-lg max-w-lg mx-auto leading-relaxed" style={{ color: "#A06080" }}>
            Kindy는 단순한 일기장이 아니에요. 아이의 하루를 분석하고
            성장 여정 전체를 함께 기록해요.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-7">
          {features.map((f, i) => (
            <div key={i} className="bg-card rounded-3xl p-8 border hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 cursor-default"
              style={{ borderColor: "rgba(232,121,160,0.15)", boxShadow: "0 4px 20px rgba(232,121,160,0.06)" }}>
              <div className="flex items-center justify-between mb-6">
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center" style={{ background: f.bg }}>
                  <f.icon className="w-7 h-7" style={{ color: f.iconColor }} />
                </div>
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `${f.iconColor}18` }}>
                  <f.icon className="w-5 h-5" style={{ color: f.iconColor }} strokeWidth={1.5} />
                </div>
              </div>
              <div className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: f.iconColor }}>{f.tag}</div>
              <h3 className="text-xl font-bold mb-3" style={{ color: "#3B1355" }}>{f.title}</h3>
              <p className="text-sm leading-relaxed mb-6" style={{ color: "#A06080" }}>{f.desc}</p>
              <ul className="space-y-2.5">
                {f.points.map((p, j) => (
                  <li key={j} className="flex items-center gap-2.5 text-sm" style={{ color: "#6B3580" }}>
                    <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: f.iconColor }} />
                    {p}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── How It Works ─────────────────────────────────────────────────────────────

const steps = [
  { num: "01", icon: Mic, title: "아이가 대화해요", desc: "키오나 키나와 자유롭게 하루를 이야기해요. 음성으로 말하거나 텍스트로 입력할 수 있어요.", gradient: "from-[#F472B6] to-[#E879A0]", ring: "rgba(244,114,182,0.25)" },
  { num: "02", icon: Brain, title: "AI가 일기를 써요", desc: "AI가 대화를 분석하고 감정, 사건, 인물 관계를 파악해 아름다운 일기를 작성해요.", gradient: "from-[#A78BFA] to-[#8B5CF6]", ring: "rgba(167,139,250,0.25)" },
  { num: "03", icon: BarChart2, title: "데이터를 분석해요", desc: "음식, 건강, 감정, 친구관계, 학습 상태를 종합 분석하고 시각화된 인사이트로 보여줘요.", gradient: "from-[#F9D56E] to-[#F59E0B]", ring: "rgba(249,213,110,0.3)" },
  { num: "04", icon: Users, title: "함께 확인해요", desc: "부모님과 선생님이 대시보드에서 아이의 하루를 확인하고 서로 더 깊이 소통해요.", gradient: "from-[#86EFAC] to-[#22C55E]", ring: "rgba(134,239,172,0.3)" },
];

function HowItWorks() {
  return (
    <section id="how" className="py-28 relative overflow-hidden"
      style={{ background: "linear-gradient(160deg, #FFF0F8 0%, #F5F0FF 50%, #F0F8FF 100%)" }}>
      {/* Mushroom decorations */}
      <MushroomPink className="absolute bottom-0 left-0 w-24 opacity-25" />
      <MushroomTeal className="absolute bottom-0 right-8 w-20 opacity-20" />

      <div className="max-w-6xl mx-auto px-6">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-bold mb-5"
            style={{ background: "linear-gradient(135deg, #FCE7F3, #EDE9FE)", color: "#C0397A" }}>
            <MiniStar size={14} color="#F9D56E" /> 이용 방법
          </div>
          <h2 className="text-4xl md:text-5xl font-bold mb-5" style={{ color: "#3B1355" }}>
            단 4단계로<br />아이와 연결돼요
          </h2>
        </div>

        <div className="grid md:grid-cols-4 gap-8 relative">
          <div className="absolute top-10 hidden md:block"
            style={{ left: "calc(12.5% + 24px)", right: "calc(12.5% + 24px)", height: "2px",
              background: "linear-gradient(to right, #F472B6, #A78BFA, #F9D56E, #86EFAC)" }} />

          {steps.map((step, i) => (
            <div key={i} className="relative flex flex-col items-center text-center group">
              <div className={`w-20 h-20 rounded-full bg-gradient-to-br ${step.gradient} flex items-center justify-center shadow-lg mb-6 relative z-10 group-hover:scale-110 transition-transform duration-300`}
                style={{ boxShadow: `0 8px 24px ${step.ring}` }}>
                <step.icon className="w-9 h-9 text-white" />
                <div className="absolute -top-2 -right-2 w-7 h-7 bg-white rounded-full flex items-center justify-center shadow text-xs font-bold border-2"
                  style={{ color: "#3B1355", borderColor: "rgba(232,121,160,0.3)" }}>
                  {step.num}
                </div>
              </div>
              <h3 className="text-lg font-bold mb-2" style={{ color: "#3B1355" }}>{step.title}</h3>
              <p className="text-sm leading-relaxed" style={{ color: "#A06080" }}>{step.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Analytics Dashboard ──────────────────────────────────────────────────────

function AnalyticsDashboard() {
  const [activeTab, setActiveTab] = useState<"감정" | "영양" | "성격">("감정");

  return (
    <section id="analytics" className="py-28 bg-background relative overflow-hidden">
      <Sparkle size={24} color="#A78BFA" style={{ position: "absolute", top: 60, left: 40, opacity: 0.25 }} />
      <Sparkle size={18} color="#F9D56E" style={{ position: "absolute", bottom: 80, right: 50, opacity: 0.3 }} />

      <div className="max-w-6xl mx-auto px-6">
        <div className="grid md:grid-cols-2 gap-16 items-center">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-bold mb-5"
              style={{ background: "linear-gradient(135deg, #FCE7F3, #EDE9FE)", color: "#C0397A" }}>
              <MiniStar size={14} color="#F9D56E" /> 분석 대시보드
            </div>
            <h2 className="text-4xl md:text-5xl font-bold mb-6" style={{ color: "#3B1355" }}>
              아이의 모든 것을<br />한눈에 확인해요
            </h2>
            <p className="text-lg leading-relaxed mb-8" style={{ color: "#A06080" }}>
              일주일, 한 달, 1년 단위로 아이의 성장 추이를 확인하고
              전문적인 인사이트를 받아보세요.
            </p>
            <div className="space-y-3">
              {[
                { Icon: UtensilsCrossed, color: "#86EFAC", label: "음식 섭취 분석", desc: "매일 먹은 음식의 영양 균형을 체크해요" },
                { Icon: Dumbbell,        color: "#F472B6", label: "건강 상태 추적", desc: "몸이 아팠던 날, 컨디션 변화를 기록해요" },
                { Icon: Users,          color: "#C084FC", label: "교우관계 맵",    desc: "친구들과의 관계와 사회성 발달을 파악해요" },
                { Icon: Brain,          color: "#F9D56E", label: "성격 성향 분석", desc: "아이만의 성격 특성과 MBTI 성향을 알아요" },
                { Icon: BookOpen,       color: "#7ECECA", label: "학습 발달 현황", desc: "배운 내용과 학습 흥미도를 추적해요" },
              ].map((item, i) => (
                <div key={i} className="flex items-start gap-4 p-4 bg-card rounded-2xl border hover:shadow-md transition-all duration-200 group cursor-default"
                  style={{ borderColor: "rgba(232,121,160,0.15)" }}>
                  <span className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5"
                    style={{ background: `${item.color}22` }}>
                    <item.Icon style={{ width: 17, height: 17, color: item.color }} strokeWidth={2} />
                  </span>
                  <div>
                    <div className="font-bold text-sm group-hover:text-primary transition-colors" style={{ color: "#3B1355" }}>{item.label}</div>
                    <div className="text-xs mt-0.5" style={{ color: "#A06080" }}>{item.desc}</div>
                  </div>
                  <ChevronRight className="w-4 h-4 ml-auto mt-0.5 flex-shrink-0 group-hover:text-primary transition-colors" style={{ color: "#C0C0D0" }} />
                </div>
              ))}
            </div>
          </div>

          {/* Dashboard card */}
          <div className="bg-card rounded-3xl border overflow-hidden" style={{ borderColor: "rgba(232,121,160,0.15)", boxShadow: "0 20px 60px rgba(232,121,160,0.12)" }}>
            {/* Header */}
            <div className="p-5" style={{ background: "linear-gradient(135deg, #E879A0 0%, #C084FC 100%)" }}>
              <div className="flex items-center justify-between mb-3">
                <div>
                  <div className="text-white/65 text-xs font-medium">학생 프로필</div>
                  <div className="text-white font-bold text-base" style={{ fontFamily: "'Fredoka', sans-serif" }}>
                    김민준 · 7세 · 해바라기반
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-white/65 text-xs">이번 주</div>
                  <div className="text-white font-bold text-sm">07.21 — 07.25</div>
                </div>
              </div>
              <div className="flex gap-2 mt-4">
                {(["감정", "영양", "성격"] as const).map((tab) => (
                  <button key={tab} onClick={() => setActiveTab(tab)}
                    className="text-xs px-4 py-1.5 rounded-full font-bold transition-all"
                    style={activeTab === tab
                      ? { background: "white", color: "#E879A0" }
                      : { background: "rgba(255,255,255,0.18)", color: "white" }}>
                    {tab}
                  </button>
                ))}
              </div>
            </div>

            <div className="p-5">
              {activeTab === "감정" && (
                <>
                  <div className="text-sm font-bold mb-4" style={{ color: "#3B1355" }}>이번 주 감정 기록</div>
                  <ResponsiveContainer width="100%" height={190}>
                    <BarChart data={emotionData} barGap={3} barCategoryGap="30%">
                      <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "#A06080" }} />
                      <YAxis hide domain={[0, 6]} />
                      <Tooltip contentStyle={{ borderRadius: "14px", border: "1px solid rgba(232,121,160,0.2)", boxShadow: "0 8px 24px rgba(0,0,0,0.08)", fontSize: "12px" }} cursor={{ fill: "rgba(232,121,160,0.06)" }} />
                      <Bar dataKey="기쁨" fill="#F472B6" radius={[6, 6, 0, 0]} />
                      <Bar dataKey="슬픔" fill="#C4B5E8" radius={[6, 6, 0, 0]} />
                      <Bar dataKey="흥분" fill="#F9D56E" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                  <div className="flex gap-5 mt-2">
                    {[["#F472B6", "기쁨"], ["#C4B5E8", "슬픔"], ["#F9D56E", "흥분"]].map(([color, label]) => (
                      <span key={label} className="flex items-center gap-1.5 text-xs" style={{ color: "#A06080" }}>
                        <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ background: color }} />{label}
                      </span>
                    ))}
                  </div>
                </>
              )}

              {activeTab === "영양" && (
                <>
                  <div className="text-sm font-bold mb-3" style={{ color: "#3B1355" }}>영양소 섭취 현황</div>
                  <div className="flex items-center gap-2">
                    <ResponsiveContainer width={155} height={155}>
                      <PieChart>
                        <Pie data={nutritionData} dataKey="value" innerRadius={48} outerRadius={72} paddingAngle={3} startAngle={90} endAngle={-270}>
                          {nutritionData.map((entry, i) => <Cell key={i} fill={entry.color} stroke="none" />)}
                        </Pie>
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="space-y-2.5 flex-1">
                      {nutritionData.map((item) => (
                        <div key={item.name} className="flex items-center justify-between text-xs">
                          <div className="flex items-center gap-2">
                            <div className="w-2.5 h-2.5 rounded-full" style={{ background: item.color }} />
                            <span style={{ color: "#6B3580" }}>{item.name}</span>
                          </div>
                          <span className="font-bold" style={{ color: "#3B1355" }}>{item.value}%</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}

              {activeTab === "성격" && (
                <>
                  <div className="text-sm font-bold mb-2" style={{ color: "#3B1355" }}>성격 성향 분석</div>
                  <ResponsiveContainer width="100%" height={195}>
                    <RadarChart data={personalityData}>
                      <PolarGrid stroke="rgba(232,121,160,0.18)" />
                      <PolarAngleAxis dataKey="trait" tick={{ fontSize: 11, fill: "#A06080" }} />
                      <PolarRadiusAxis domain={[0, 100]} hide />
                      <Radar dataKey="value" stroke="#E879A0" fill="#E879A0" fillOpacity={0.22} strokeWidth={2} dot={{ fill: "#E879A0", r: 4 }} />
                    </RadarChart>
                  </ResponsiveContainer>
                </>
              )}

              {/* Diary snippet */}
              <div className="mt-4 p-4 rounded-2xl" style={{ background: "linear-gradient(135deg, #FCE7F3, #EDE9FE)" }}>
                <div className="flex items-center gap-1.5 text-xs font-bold mb-2" style={{ color: "#E879A0" }}>
                  <BookOpen style={{ width: 12, height: 12 }} strokeWidth={2.5} /> 오늘의 일기 요약
                </div>
                <p className="text-xs leading-relaxed" style={{ color: "#6B3580" }}>
                  "오늘은 블록 놀이를 하다가 친구 수호와 잠깐 다투었지만, 선생님 도움으로 화해했어요.
                  점심에 김치볶음밥을 맛있게 먹었고, 낮잠 후 그림 그리기에서 집중력이 돋보였어요."
                </p>
                <div className="flex flex-wrap gap-2 mt-3">
                  <span className="flex items-center gap-1 text-xs px-2.5 py-0.5 rounded-full font-medium" style={{ background: "#FCE7F3", color: "#BE185D" }}>
                    <Smile style={{ width: 11, height: 11 }} strokeWidth={2.5} /> 전반적으로 긍정
                  </span>
                  <span className="flex items-center gap-1 text-xs px-2.5 py-0.5 rounded-full font-medium" style={{ background: "#DCFCE7", color: "#166534" }}>
                    <Palette style={{ width: 11, height: 11 }} strokeWidth={2.5} /> 창의성 발현
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── Personas ─────────────────────────────────────────────────────────────────

const personas = [
  {
    icon: Smile, bg: "#FEF9C3", iconColor: "#D97706",
    accent: "#D97706", subtitle: "나의 AI 친구", title: "아이들", avatarIcon: Sparkles, avatarColor: "#D97706", avatarBg: "#FEF9C3",
    desc: "키오나 키나와 신나게 수다를 떨다 보면 자연스럽게 하루가 기록돼요. 말하기와 표현력이 쑥쑥 늘어나요!",
    benefits: ["자유로운 표현 능력 향상", "감정 인식 및 표현 연습", "재미있는 AI 친구와 대화"],
  },
  {
    icon: Heart, bg: "#FCE7F3", iconColor: "#E879A0",
    accent: "#E879A0", subtitle: "아이의 하루를 실시간으로", title: "부모님", avatarIcon: Heart, avatarColor: "#E879A0", avatarBg: "#FCE7F3",
    desc: "어린이집과 유치원에서의 아이 생활을 생생하게 확인하세요. 데이터로 아이를 더 깊이 이해해요.",
    benefits: ["아이의 하루 전체 확인", "건강·영양 상태 체크", "선생님과의 원활한 소통"],
  },
  {
    icon: BookOpen, bg: "#EDE9FE", iconColor: "#8B5CF6",
    accent: "#8B5CF6", subtitle: "데이터 기반 교육", title: "선생님", avatarIcon: GraduationCap, avatarColor: "#8B5CF6", avatarBg: "#EDE9FE",
    desc: "각 아이의 성향과 발달 데이터를 바탕으로 개인화된 교육 계획을 세우고 학부모와 효율적으로 소통하세요.",
    benefits: ["아이별 맞춤 교육 계획", "학부모 소통 간소화", "성장 리포트 자동 생성"],
  },
];

function PersonasSection() {
  return (
    <section id="personas" className="py-28 relative overflow-hidden"
      style={{ background: "linear-gradient(160deg, #FFF0F8 0%, #F5F0FF 60%, #F0F8FF 100%)" }}>
      <MushroomPink className="absolute top-0 right-12 w-16 opacity-20 rotate-12" />
      <MushroomTeal className="absolute bottom-0 left-16 w-14 opacity-15" />

      <div className="max-w-6xl mx-auto px-6">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-bold mb-5"
            style={{ background: "linear-gradient(135deg, #FCE7F3, #EDE9FE)", color: "#C0397A" }}>
            <MiniStar size={14} color="#F9D56E" /> 모두를 위한 Kindy
          </div>
          <h2 className="text-4xl md:text-5xl font-bold mb-5" style={{ color: "#3B1355" }}>
            아이, 부모님, 선생님<br />모두가 행복해요
          </h2>
          <p className="text-lg max-w-md mx-auto leading-relaxed" style={{ color: "#A06080" }}>
            Kindy는 아이의 성장을 둘러싼 모든 사람을 하나로 연결해요.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-7">
          {personas.map((p, i) => (
            <div key={i} className="bg-card rounded-3xl p-8 border hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 cursor-default"
              style={{ borderColor: "rgba(232,121,160,0.15)", boxShadow: "0 4px 20px rgba(232,121,160,0.06)" }}>
              <div className="flex items-center justify-between mb-6">
                <div className="w-16 h-16 rounded-2xl flex items-center justify-center" style={{ background: p.bg }}>
                  <p.icon className="w-8 h-8" style={{ color: p.iconColor }} />
                </div>
              </div>
              <div className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: p.accent }}>{p.subtitle}</div>
              <h3 className="text-2xl font-bold mb-3" style={{ color: "#3B1355" }}>{p.title}</h3>
              <p className="text-sm leading-relaxed mb-6" style={{ color: "#A06080" }}>{p.desc}</p>
              <ul className="space-y-2.5">
                {p.benefits.map((b, j) => (
                  <li key={j} className="flex items-center gap-2.5 text-sm" style={{ color: "#6B3580" }}>
                    <ChevronRight className="w-4 h-4 flex-shrink-0" style={{ color: p.accent }} />
                    {b}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Testimonials ─────────────────────────────────────────────────────────────

const testimonials = [
  {
    avatarIcon: Heart, avatarColor: "#E879A0", avatarBg: "#FCE7F3",
    name: "이지영", role: "7세 아이 엄마 · 2년 사용", rating: 5,
    text: "아이가 어린이집에서 무슨 일이 있었는지 항상 궁금했는데, Kindy 덕분에 아이의 하루를 생생하게 알 수 있어요. 선생님과 소통도 훨씬 자연스러워졌어요!",
  },
  {
    avatarIcon: GraduationCap, avatarColor: "#8B5CF6", avatarBg: "#EDE9FE",
    name: "박지수 선생님", role: "유치원 교사 · 5년차", rating: 5,
    text: "학부모님께 일일이 연락드리기 어려웠는데 Kindy로 아이 상황을 자연스럽게 공유할 수 있어요. 아이별 데이터로 맞춤 교육도 가능해졌어요. 강력 추천해요!",
  },
  {
    avatarIcon: Smile, avatarColor: "#D97706", avatarBg: "#FEF9C3",
    name: "최준서", role: "6세 · Kindy 사용자", rating: 5,
    text: "키나랑 얘기하는 거 너무너무 재밌어요! 오늘 학교에서 있었던 일 다 얘기해줬어요. 내일도 하고 싶어요!",
  },
];

function TestimonialsSection() {
  return (
    <section className="py-28 bg-background relative overflow-hidden">
      <Sparkle size={20} color="#F472B6" style={{ position: "absolute", top: 50, right: 100, opacity: 0.25 }} />
      <MiniStar size={14} color="#A78BFA" style={{ position: "absolute", bottom: 60, left: 80, opacity: 0.3 }} />

      <div className="max-w-6xl mx-auto px-6">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-bold mb-5"
            style={{ background: "linear-gradient(135deg, #FCE7F3, #EDE9FE)", color: "#C0397A" }}>
            <MiniStar size={14} color="#F9D56E" /> 사용자 후기
          </div>
          <h2 className="text-4xl md:text-5xl font-bold mb-5" style={{ color: "#3B1355" }}>
            Kindy 가족들의<br />생생한 이야기
          </h2>
        </div>

        <div className="grid md:grid-cols-3 gap-7">
          {testimonials.map((t, i) => (
            <div key={i} className="bg-card rounded-3xl p-8 border hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 flex flex-col"
              style={{ borderColor: "rgba(232,121,160,0.15)", boxShadow: "0 4px 20px rgba(232,121,160,0.06)" }}>
              <div className="flex gap-1 mb-5">
                {Array.from({ length: t.rating }).map((_, j) => (
                  <Star key={j} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                ))}
              </div>
              <p className="text-sm leading-relaxed flex-1 mb-6" style={{ color: "#6B3580" }}>
                &ldquo;{t.text}&rdquo;
              </p>
              <div className="flex items-center gap-3 pt-4" style={{ borderTop: "1px solid rgba(232,121,160,0.12)" }}>
                <div className="w-11 h-11 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{ background: t.avatarBg }}>
                  <t.avatarIcon style={{ width: 20, height: 20, color: t.avatarColor }} strokeWidth={2} />
                </div>
                <div>
                  <div className="font-bold text-sm" style={{ color: "#3B1355" }}>{t.name}</div>
                  <div className="text-xs mt-0.5" style={{ color: "#A06080" }}>{t.role}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── CTA ──────────────────────────────────────────────────────────────────────

function CTASection() {
  return (
    <section className="py-28 relative overflow-hidden"
      style={{ background: "linear-gradient(160deg, #C8B8F0 0%, #E8B8D8 30%, #F9C0D4 60%, #FFD8C0 100%)" }}>

      {/* Clouds */}
      <CloudPuff className="absolute top-8 left-0 w-56 opacity-40" />
      <CloudPuff className="absolute top-16 right-4 w-44 opacity-35" />
      <CloudPuff className="absolute bottom-8 left-1/3 w-48 opacity-30" />

      {/* Sparkles */}
      {[
        { top: "15%", left: "8%", size: 20 }, { top: "70%", left: "5%", size: 14 },
        { top: "25%", right: "6%", size: 18 }, { top: "65%", right: "4%", size: 12 },
      ].map((s, i) => (
        <Sparkle key={i} size={s.size} color="#F9D56E"
          style={{ position: "absolute", top: s.top, left: "left" in s ? s.left : undefined,
            right: "right" in s ? (s as {right: string}).right : undefined, opacity: 0.6 }} />
      ))}

      {/* Mushrooms at bottom */}
      <div className="absolute bottom-0 left-0 right-0 flex items-end justify-around pointer-events-none overflow-hidden">
        <MushroomTeal className="w-12 h-auto opacity-50" />
        <MushroomPink className="w-16 h-auto opacity-60" />
        <MushroomOrange className="w-14 h-auto opacity-45" />
        <MushroomPink className="w-10 h-auto opacity-40" />
        <MushroomTeal className="w-14 h-auto opacity-55" />
        <div className="absolute bottom-0 left-0 right-0 h-8" style={{ background: "#3B1355" }} />
      </div>

      <div className="max-w-4xl mx-auto px-6 text-center relative z-10">
        {/* Characters */}
        <div className="flex items-end justify-center gap-6 mb-8">
          {/* Kio - blue */}
          <div className="flex flex-col items-center" style={{ animation: "float 3.2s ease-in-out infinite" }}>
            <KioSVG className="w-36 h-auto drop-shadow-2xl" />
            <div className="mt-2 text-sm font-bold px-4 py-1 rounded-full"
              style={{ background: "rgba(219,234,254,0.7)", color: "#1D4ED8" }}>
              키오
            </div>
          </div>
          {/* Kina - pink */}
          <div className="flex flex-col items-center" style={{ animation: "float 3.5s ease-in-out infinite", animationDelay: "1s" }}>
            <KinaSVG className="w-36 h-auto drop-shadow-2xl" />
            <div className="mt-2 text-sm font-bold px-4 py-1 rounded-full"
              style={{ background: "rgba(252,231,243,0.7)", color: "#BE185D" }}>
              키나
            </div>
          </div>
        </div>

        <h2 className="text-5xl md:text-6xl font-bold mb-6"
          style={{ fontFamily: "'Fredoka', sans-serif", color: "#3B1355" }}>
          오늘부터 Kindy와<br />함께 시작해요
        </h2>
        <p className="text-xl mb-10 max-w-lg mx-auto leading-relaxed" style={{ color: "#6B3580" }}>
          키오와 키나가 기다리고 있어요.<br />
          아이의 소중한 하루를 지금 바로 기록해보세요.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
          <button className="font-bold px-10 py-4 rounded-2xl transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5 flex items-center justify-center gap-2 text-sm text-white"
            style={{ background: "linear-gradient(135deg, #E879A0, #C084FC)" }}>
            무료로 시작하기 <ArrowRight className="w-5 h-5" />
          </button>
          <button className="font-bold px-10 py-4 rounded-2xl transition-all flex items-center justify-center gap-2 text-sm"
            style={{ background: "rgba(255,255,255,0.65)", border: "2px solid rgba(255,255,255,0.8)", color: "#C0397A", backdropFilter: "blur(8px)" }}>
            <Download className="w-5 h-5" /> 앱 다운로드
          </button>
        </div>

        {/* App store badges */}
        <div className="flex items-center justify-center gap-4 mb-10 flex-wrap">
          {/* App Store */}
          <button className="flex items-center gap-3 px-5 py-3 rounded-2xl transition-all"
            style={{ background: "rgba(255,255,255,0.55)", border: "1px solid rgba(255,255,255,0.7)", backdropFilter: "blur(8px)" }}>
            <svg viewBox="0 0 24 24" fill="#3B1355" width={28} height={28} aria-label="Apple">
              <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
            </svg>
            <div className="text-left">
              <div className="text-xs" style={{ color: "#A06080" }}>iOS</div>
              <div className="font-bold text-sm" style={{ color: "#3B1355" }}>App Store</div>
            </div>
          </button>
          {/* Google Play */}
          <button className="flex items-center gap-3 px-5 py-3 rounded-2xl transition-all"
            style={{ background: "rgba(255,255,255,0.55)", border: "1px solid rgba(255,255,255,0.7)", backdropFilter: "blur(8px)" }}>
            <svg viewBox="0 0 24 24" fill="none" width={28} height={28} aria-label="Google Play">
              <path d="M3.18 23.76a1.49 1.49 0 001.24.05l13.02-7.54-2.91-2.91-11.35 10.4z" fill="#EA4335"/>
              <path d="M22.56 10.26l-3.92-2.28-3.28 3.04 3.28 3.04 3.96-2.3a1.49 1.49 0 000-2.5z" fill="#FBBC04"/>
              <path d="M3.18.24A1.49 1.49 0 002.5 1.5v21a1.49 1.49 0 00.68 1.26L15.53 12 3.18.24z" fill="#4285F4"/>
              <path d="M4.42.05L17.44 7.6l-2.91 2.91L3.18.24A1.49 1.49 0 014.42.05z" fill="#34A853"/>
            </svg>
            <div className="text-left">
              <div className="text-xs" style={{ color: "#A06080" }}>Android</div>
              <div className="font-bold text-sm" style={{ color: "#3B1355" }}>Google Play</div>
            </div>
          </button>
        </div>

        <div className="flex items-center justify-center gap-8 text-sm flex-wrap" style={{ color: "#8B5A80" }}>
          {[{ icon: Shield, label: "아동 개인정보 보호" }, { icon: Bell, label: "실시간 알림" }, { icon: Star, label: "14일 무료 체험" }].map((item) => (
            <div key={item.label} className="flex items-center gap-2">
              <item.icon className="w-4 h-4" /> {item.label}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Footer ───────────────────────────────────────────────────────────────────

function Footer() {
  return (
    <footer style={{ background: "#3B1355" }} className="text-white py-16">
      <div className="max-w-6xl mx-auto px-6">
        <div className="grid md:grid-cols-4 gap-10 mb-12">
          <div>
            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center"
                style={{ background: "linear-gradient(135deg, #E879A0, #F472B6)" }}>
                <MiniStar size={18} color="white" />
              </div>
              <span className="text-2xl font-bold" style={{ fontFamily: "'Fredoka', sans-serif" }}>Kindy</span>
            </div>
            <p className="text-sm leading-relaxed mb-5" style={{ color: "rgba(255,255,255,0.45)" }}>
              AI 기반 키즈 데이터 플랫폼.<br />아이의 하루, 더 가까이.
            </p>
            <div className="flex gap-2">
              {[
                { bg: "rgba(184,212,255,0.18)", color: "#B8D4FF", label: "키오", Icon: Zap },
                { bg: "rgba(255,181,200,0.18)", color: "#FFB5C8", label: "키나", Icon: Sparkles },
              ].map((item) => (
                <div key={item.label} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold"
                  style={{ background: item.bg, color: item.color }}>
                  <item.Icon style={{ width: 11, height: 11 }} strokeWidth={2.5} />
                  {item.label}
                </div>
              ))}
            </div>
          </div>

          {[
            { title: "서비스", links: ["AI 대화 일기", "데이터 분석", "소통 브릿지", "모바일 앱"] },
            { title: "사용자", links: ["부모님 가이드", "선생님 가이드", "기관 파트너십", "요금제"] },
            { title: "회사", links: ["소개", "블로그", "채용", "문의하기"] },
          ].map((col) => (
            <div key={col.title}>
              <div className="text-xs font-bold uppercase tracking-widest mb-5" style={{ color: "rgba(255,255,255,0.45)" }}>{col.title}</div>
              <ul className="space-y-3.5">
                {col.links.map((link) => (
                  <li key={link}>
                    <a href="#" className="text-sm transition-colors" style={{ color: "rgba(255,255,255,0.38)" }}
                      onMouseEnter={e => (e.currentTarget.style.color = "rgba(255,181,200,0.8)")}
                      onMouseLeave={e => (e.currentTarget.style.color = "rgba(255,255,255,0.38)")}>
                      {link}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="border-t pt-8 flex flex-col md:flex-row items-center justify-between gap-4"
          style={{ borderColor: "rgba(255,255,255,0.08)" }}>
          <div className="text-xs" style={{ color: "rgba(255,255,255,0.28)" }}>© 2025 Kindy Inc. All rights reserved.</div>
          <div className="flex gap-6 text-xs flex-wrap justify-center" style={{ color: "rgba(255,255,255,0.28)" }}>
            {["개인정보처리방침", "서비스 이용약관", "아동 개인정보 보호정책"].map((link) => (
              <a key={link} href="#" className="transition-colors hover:text-white/55">{link}</a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}

// ─── Character Showcase ───────────────────────────────────────────────────────

const FOREST_PARTICLES = [
  {x:12,y:15,s:3,o:0.9,d:1.8,dl:0.2},{x:28,y:8, s:2,o:0.7,d:2.2,dl:0.6},
  {x:45,y:12,s:4,o:0.8,d:1.5,dl:0.1},{x:68,y:6, s:2,o:0.9,d:2.0,dl:0.8},
  {x:82,y:18,s:3,o:0.75,d:1.7,dl:0.3},{x:92,y:10,s:2,o:0.85,d:2.3,dl:0.5},
  {x:7, y:35,s:2,o:0.6,d:2.5,dl:0.9},{x:35,y:28,s:3,o:0.8,d:1.9,dl:0.2},
  {x:55,y:22,s:2,o:0.7,d:2.1,dl:0.7},{x:75,y:32,s:4,o:0.85,d:1.6,dl:0.4},
  {x:88,y:25,s:2,o:0.7,d:2.4,dl:0.1},{x:18,y:55,s:3,o:0.6,d:2.0,dl:0.6},
  {x:42,y:48,s:2,o:0.75,d:1.8,dl:0.3},{x:62,y:52,s:3,o:0.65,d:2.2,dl:0.8},
  {x:78,y:45,s:2,o:0.8,d:1.7,dl:0.2},{x:95,y:58,s:3,o:0.7,d:2.3,dl:0.5},
  {x:5, y:72,s:2,o:0.6,d:1.9,dl:0.9},{x:25,y:68,s:4,o:0.5,d:2.1,dl:0.4},
  {x:50,y:65,s:2,o:0.7,d:1.6,dl:0.1},{x:72,y:70,s:3,o:0.55,d:2.0,dl:0.7},
  {x:90,y:62,s:2,o:0.65,d:2.4,dl:0.3},{x:38,y:78,s:2,o:0.5,d:2.2,dl:0.2},
  {x:60,y:85,s:3,o:0.45,d:1.7,dl:0.8},{x:80,y:80,s:2,o:0.5,d:2.0,dl:0.4},
  {x:20,y:40,s:2,o:0.65,d:2.3,dl:0.6},{x:58,y:38,s:3,o:0.7,d:1.8,dl:0.1},
];

const FOREST_ORBS = [
  {x:"8%", y:"42%",c:"rgba(255,220,80,0.7)", s:18},
  {x:"15%",y:"32%",c:"rgba(210,140,255,0.6)",s:14},
  {x:"23%",y:"60%",c:"rgba(80,220,200,0.6)", s:16},
  {x:"76%",y:"38%",c:"rgba(255,170,100,0.7)",s:18},
  {x:"85%",y:"55%",c:"rgba(200,110,230,0.6)",s:14},
  {x:"68%",y:"28%",c:"rgba(100,200,255,0.6)",s:16},
  {x:"48%",y:"18%",c:"rgba(255,200,120,0.5)",s:12},
  {x:"33%",y:"25%",c:"rgba(180,240,180,0.5)",s:10},
];

const FLOWERS = [
  {x:4, b:9,c:"#F472B6",s:7},{x:10,b:6,c:"#FBBF24",s:5},{x:18,b:10,c:"#A78BFA",s:6},
  {x:27,b:7,c:"#34D399",s:5},{x:38,b:8,c:"#F9D56E",s:7},{x:50,b:5,c:"#F472B6",s:6},
  {x:61,b:9,c:"#60A5FA",s:5},{x:72,b:7,c:"#FBBF24",s:7},{x:82,b:9,c:"#A78BFA",s:6},
  {x:91,b:6,c:"#34D399",s:5},{x:96,b:8,c:"#F472B6",s:6},
];

const CHAR_DATA = {
  kio: {
    name: "키오", nameTag: "KIO",
    role: "씩씩한 AI 친구",
    color: "#60A5FA", darkColor: "#1D4ED8",
    glow: "rgba(96,165,250,0.5)", borderGlow: "rgba(147,197,253,0.45)",
    panelBg: "rgba(4,14,46,0.85)",
    greeting: "안녕! 나는 키오야! 오늘 어떤 멋진 일이 있었어? 신나는 것도, 힘든 것도 나한테 다 말해줘!",
    story: "씩씩하고 에너지 넘치는 키오는 아이의 이야기라면 뭐든 귀 기울여 들어요. 매일의 작은 모험들을 함께 기록하고, 용기가 필요할 때 옆에서 응원해주는 든든한 친구예요.",
    tags: [
      {Icon:Compass,  label:"호기심 많아요"},
      {Icon:Zap,      label:"활발해요"},
      {Icon:BookOpen, label:"같이 기록해요"},
      {Icon:Smile,    label:"항상 응원해요"},
    ],
    moments: [
      {Icon:Sun,    text:"오늘 있었던 신나는 일을 같이 이야기해요"},
      {Icon:Shield, text:"힘든 일이 생겼을 때 함께 생각해봐요"},
      {Icon:Star,   text:"잘한 일을 기억하고 칭찬해드려요"},
    ],
  },
  kina: {
    name: "키나", nameTag: "KINA",
    role: "따뜻한 AI 친구",
    color: "#F472B6", darkColor: "#BE185D",
    glow: "rgba(244,114,182,0.5)", borderGlow: "rgba(251,207,232,0.45)",
    panelBg: "rgba(46,4,24,0.85)",
    greeting: "안녕~ 나는 키나야! 오늘 기분이 어때? 기쁜 일도 슬픈 일도 키나한테 살짝 이야기해줘~",
    story: "따뜻하고 섬세한 키나는 아이의 마음을 누구보다 잘 이해해요. 기쁠 때 함께 웃고, 속상할 때 조용히 옆에 있어주는, 언제나 다정한 친구예요.",
    tags: [
      {Icon:Heart,         label:"공감을 잘해요"},
      {Icon:HeartHandshake,label:"마음을 들어줘요"},
      {Icon:Palette,       label:"감성적이에요"},
      {Icon:Feather,       label:"섬세해요"},
    ],
    moments: [
      {Icon:Smile,  text:"오늘 기분이 어떤지 편하게 말해줘요"},
      {Icon:Heart,  text:"속상한 마음도 판단 없이 들어드려요"},
      {Icon:Star,   text:"소중한 하루를 함께 기억해요"},
    ],
  },
} as const;

function CharacterShowcase({ onClose }: { onClose: () => void }) {
  const [selected, setSelected] = useState<"kio" | "kina">("kio");
  const [animKey, setAnimKey] = useState(0);
  const [cloudPhase, setCloudPhase] = useState<"idle" | "in" | "out">("idle");

  const char = CHAR_DATA[selected];

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  const switchTo = (c: "kio" | "kina") => {
    if (c === selected || cloudPhase !== "idle") return;
    // 1. clouds sweep IN from right
    setCloudPhase("in");
    setTimeout(() => {
      // 2. swap character behind the cloud cover
      setSelected(c);
      setAnimKey(k => k + 1);
      // 3. clouds sweep OUT to the left
      setCloudPhase("out");
      setTimeout(() => setCloudPhase("idle"), 850);
    }, 650);
  };

  return (
    <div className="fixed inset-0 z-[8000] flex flex-col overflow-hidden">

      {/* ══ World Background ══ */}
      <div className="absolute inset-0 pointer-events-none select-none overflow-hidden">

        {/* Full-screen world image */}
        <img
          src={selected === "kio" ? crystalBg : mushroomBg}
          alt=""
          className="absolute inset-0 w-full h-full"
          style={{ objectFit:"cover", objectPosition:"center center" }}
        />

        {/* Very light top/bottom fade only — keeps image bright, gives header/footer breathing room */}
        <div className="absolute top-0 left-0 right-0" style={{height:"12%", background:"linear-gradient(180deg, rgba(0,0,0,0.22) 0%, transparent 100%)"}} />
        <div className="absolute bottom-0 left-0 right-0" style={{height:"10%", background:"linear-gradient(0deg, rgba(0,0,0,0.18) 0%, transparent 100%)"}} />

        {/* ── KIO: Crystal Cave glow effects ── */}
        {selected === "kio" && <>
          {/* Central back-glow — the big white light source deep in the cave */}
          <div className="absolute" style={{
            top:"18%", left:"50%", transform:"translateX(-50%)",
            width:480, height:380,
            background:"radial-gradient(ellipse, rgba(255,255,240,0.55) 0%, rgba(200,180,255,0.30) 30%, rgba(150,120,255,0.12) 58%, transparent 75%)",
            filter:"blur(28px)",
            animation:"crystalPulse 3.2s ease-in-out infinite",
          }} />
          {/* Left crystal cluster — purple/lavender */}
          <div className="absolute" style={{
            top:"30%", left:"14%",
            width:220, height:280,
            background:"radial-gradient(ellipse at 50% 70%, rgba(180,130,255,0.6) 0%, rgba(140,90,240,0.30) 45%, transparent 72%)",
            filter:"blur(18px)",
            animation:"crystalPulse 2.8s ease-in-out infinite",
            animationDelay:"0.4s",
          }} />
          {/* Right crystal cluster — teal/cyan */}
          <div className="absolute" style={{
            top:"28%", right:"12%",
            width:210, height:260,
            background:"radial-gradient(ellipse at 50% 70%, rgba(100,230,220,0.58) 0%, rgba(60,200,200,0.28) 45%, transparent 72%)",
            filter:"blur(18px)",
            animation:"crystalPulse 3.0s ease-in-out infinite",
            animationDelay:"0.8s",
          }} />
          {/* Front-left crystal — pink/rose */}
          <div className="absolute" style={{
            top:"52%", left:"4%",
            width:160, height:220,
            background:"radial-gradient(ellipse at 50% 60%, rgba(240,130,210,0.55) 0%, rgba(200,80,180,0.25) 50%, transparent 74%)",
            filter:"blur(14px)",
            animation:"crystalPulse 2.5s ease-in-out infinite",
            animationDelay:"1.2s",
          }} />
          {/* Front-right crystal — gold/amber */}
          <div className="absolute" style={{
            top:"50%", right:"5%",
            width:150, height:200,
            background:"radial-gradient(ellipse at 50% 60%, rgba(255,220,100,0.52) 0%, rgba(255,180,60,0.22) 50%, transparent 74%)",
            filter:"blur(14px)",
            animation:"crystalPulse 2.9s ease-in-out infinite",
            animationDelay:"0.6s",
          }} />
          {/* Center-left mid crystal — blue */}
          <div className="absolute" style={{
            top:"40%", left:"30%",
            width:120, height:180,
            background:"radial-gradient(ellipse at 50% 65%, rgba(120,180,255,0.48) 0%, rgba(80,140,240,0.20) 52%, transparent 74%)",
            filter:"blur(12px)",
            animation:"crystalPulse 3.4s ease-in-out infinite",
            animationDelay:"1.6s",
          }} />
          {/* Center-right mid crystal — green */}
          <div className="absolute" style={{
            top:"42%", right:"28%",
            width:110, height:160,
            background:"radial-gradient(ellipse at 50% 65%, rgba(120,240,180,0.45) 0%, rgba(80,210,140,0.18) 52%, transparent 74%)",
            filter:"blur(12px)",
            animation:"crystalPulse 2.7s ease-in-out infinite",
            animationDelay:"2.0s",
          }} />

          {/* Floating gem particles — color-matched to crystals */}
          {[
            {x:"50%",y:"22%",c:"rgba(255,255,200,0.95)",s:6,d:2.2,dl:0},{x:"28%",y:"38%",c:"rgba(200,160,255,0.90)",s:5,d:2.8,dl:0.4},
            {x:"70%",y:"36%",c:"rgba(100,230,220,0.90)",s:5,d:2.5,dl:0.8},{x:"18%",y:"55%",c:"rgba(240,140,210,0.88)",s:4,d:3.0,dl:0.2},
            {x:"80%",y:"52%",c:"rgba(255,210,80,0.88)",s:4,d:2.6,dl:1.0},{x:"42%",y:"44%",c:"rgba(140,190,255,0.85)",s:3,d:2.9,dl:1.4},
            {x:"60%",y:"46%",c:"rgba(140,240,180,0.85)",s:3,d:2.4,dl:0.6},{x:"35%",y:"28%",c:"rgba(255,200,140,0.80)",s:4,d:3.2,dl:1.8},
            {x:"62%",y:"26%",c:"rgba(180,140,255,0.80)",s:4,d:2.7,dl:1.2},{x:"48%",y:"60%",c:"rgba(100,220,255,0.78)",s:3,d:3.1,dl:0.3},
            {x:"22%",y:"44%",c:"rgba(255,150,200,0.78)",s:3,d:2.3,dl:1.6},{x:"76%",y:"44%",c:"rgba(255,240,100,0.75)",s:3,d:2.8,dl:2.0},
          ].map((g, i) => (
            <div key={i} style={{
              position:"absolute", left:g.x, top:g.y,
              width:g.s*2, height:g.s*2,
              background:`radial-gradient(circle, white 0%, ${g.c} 40%, transparent 70%)`,
              borderRadius:"50%",
              boxShadow:`0 0 ${g.s*5}px ${g.c}, 0 0 ${g.s*10}px ${g.c.replace("0.","0.0")}`,
              animation:`twinkle ${g.d}s ease-in-out infinite`,
              animationDelay:`${g.dl}s`,
              transform:"translate(-50%,-50%)",
            }} />
          ))}

          {/* Light ray shafts from center glow */}
          {[15,45,75,105,135,165,195,225,255,285,315,345].map((deg, i) => (
            <div key={i} style={{
              position:"absolute", top:"26%", left:"50%",
              width:2, height:180,
              background:`linear-gradient(180deg, rgba(255,255,220,${0.18-i%3*0.04}) 0%, transparent 100%)`,
              transformOrigin:"top center",
              transform:`rotate(${deg}deg)`,
              animation:`rayPulse ${2.4+i*0.15}s ease-in-out infinite`,
              animationDelay:`${i*0.18}s`,
            }} />
          ))}
        </>}

        {/* ── KINA: Mushroom Village glow effects ── */}
        {selected === "kina" && <>
          {/* Warm golden sky glow — ambient light source top */}
          <div className="absolute" style={{
            top:"-5%", left:"50%", transform:"translateX(-50%)",
            width:600, height:400,
            background:"radial-gradient(ellipse, rgba(255,220,120,0.32) 0%, rgba(255,180,80,0.14) 45%, transparent 70%)",
            filter:"blur(30px)",
            animation:"warmPulse 4.0s ease-in-out infinite",
          }} />

          {/* String light sparkles — across the garland area in the image */}
          {[
            {x:"28%",y:"22%"},{x:"34%",y:"19%"},{x:"40%",y:"18%"},{x:"46%",y:"17%"},
            {x:"52%",y:"17%"},{x:"58%",y:"18%"},{x:"64%",y:"19%"},{x:"70%",y:"22%"},
            {x:"31%",y:"25%"},{x:"43%",y:"22%"},{x:"55%",y:"21%"},{x:"67%",y:"24%"},
          ].map((sl, i) => (
            <div key={i} style={{
              position:"absolute", left:sl.x, top:sl.y,
              width:8, height:8,
              background:"radial-gradient(circle, rgba(255,255,180,1) 0%, rgba(255,220,80,0.7) 50%, transparent 80%)",
              borderRadius:"50%",
              boxShadow:"0 0 12px rgba(255,220,80,0.9), 0 0 24px rgba(255,200,60,0.5)",
              animation:`twinkle ${1.4+i*0.18}s ease-in-out infinite`,
              animationDelay:`${i*0.22}s`,
              transform:"translate(-50%,-50%)",
            }} />
          ))}

          {/* Firefly orbs — warm amber/gold floating throughout */}
          {[
            {x:"12%",y:"45%",s:10,d:2.6,dl:0.0},{x:"22%",y:"35%",s:8,d:2.2,dl:0.5},
            {x:"38%",y:"40%",s:9,d:3.0,dl:1.0},{x:"48%",y:"30%",s:7,d:2.8,dl:0.3},
            {x:"60%",y:"42%",s:9,d:2.4,dl:0.7},{x:"72%",y:"36%",s:8,d:2.9,dl:1.2},
            {x:"85%",y:"44%",s:10,d:2.5,dl:0.4},{x:"18%",y:"58%",s:7,d:3.2,dl:1.5},
            {x:"32%",y:"55%",s:6,d:2.7,dl:0.8},{x:"55%",y:"52%",s:7,d:2.3,dl:1.8},
            {x:"68%",y:"56%",s:6,d:3.0,dl:0.2},{x:"80%",y:"50%",s:8,d:2.6,dl:1.0},
            {x:"44%",y:"62%",s:6,d:2.8,dl:2.0},{x:"8%", y:"30%",s:7,d:3.3,dl:0.6},
            {x:"92%",y:"38%",s:7,d:2.4,dl:1.4},{x:"50%",y:"20%",s:5,d:2.9,dl:0.9},
          ].map((ff, i) => (
            <div key={i} style={{
              position:"absolute", left:ff.x, top:ff.y,
              width:ff.s, height:ff.s,
              background:"radial-gradient(circle, rgba(255,255,200,1) 0%, rgba(255,210,80,0.85) 40%, rgba(255,170,40,0.4) 70%, transparent 90%)",
              borderRadius:"50%",
              boxShadow:`0 0 ${ff.s*2.5}px rgba(255,200,80,0.9), 0 0 ${ff.s*5}px rgba(255,180,60,0.5)`,
              animation:`fireflyFloat ${ff.d}s ease-in-out infinite`,
              animationDelay:`${ff.dl}s`,
              transform:"translate(-50%,-50%)",
            }} />
          ))}

          {/* Soft flower glow at ground level */}
          {[
            {x:"10%",c:"rgba(255,160,200,0.5)"},{x:"24%",c:"rgba(255,220,100,0.5)"},
            {x:"40%",c:"rgba(200,240,180,0.45)"},{x:"58%",c:"rgba(255,160,200,0.45)"},
            {x:"74%",c:"rgba(255,220,100,0.5)"},{x:"88%",c:"rgba(160,220,255,0.45)"},
          ].map((fw, i) => (
            <div key={i} style={{
              position:"absolute", bottom:"8%", left:fw.x,
              width:60, height:60,
              background:`radial-gradient(circle, ${fw.c} 0%, transparent 70%)`,
              filter:"blur(8px)",
              animation:`warmPulse ${2.8+i*0.3}s ease-in-out infinite`,
              animationDelay:`${i*0.4}s`,
              transform:"translate(-50%,0)",
            }} />
          ))}

          {/* Magic dust sparkles */}
          {FOREST_PARTICLES.slice(0, 18).map((p, i) => (
            <div key={i} style={{
              position:"absolute", left:`${p.x}%`, top:`${p.y}%`,
              width:p.s, height:p.s, background:"rgba(255,240,180,0.9)", borderRadius:"50%",
              opacity: p.o * 0.75,
              boxShadow:`0 0 ${p.s*4}px rgba(255,220,100,0.8), 0 0 ${p.s*8}px rgba(255,200,60,0.35)`,
              animation:`twinkle ${p.d}s ease-in-out infinite`, animationDelay:`${p.dl}s`,
            }} />
          ))}
        </>}
      </div>

      {/* ══ Header ══ */}
      <div className="relative z-10 flex items-center justify-between px-5 py-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center shadow-lg"
            style={{background:"linear-gradient(135deg,#E879A0,#C084FC)"}}>
            <MiniStar size={18} color="white" />
          </div>
          <div>
            <div className="text-white text-sm font-bold" style={{fontFamily:"'Fredoka',sans-serif",letterSpacing:"0.12em",textShadow:"0 1px 8px rgba(0,0,0,0.6)"}}>
              KINDY
            </div>
            <div className="text-xs" style={{color:"rgba(255,255,255,0.85)",textShadow:"0 1px 6px rgba(0,0,0,0.5)"}}>AI 파트너 소개</div>
          </div>
        </div>
        <button onClick={onClose}
          className="w-9 h-9 rounded-full flex items-center justify-center transition-all hover:scale-110 active:scale-95"
          style={{background:"rgba(255,255,255,0.1)",border:"1px solid rgba(255,255,255,0.18)",color:"white"}}>
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* ══ Main content ══ */}
      <div className="relative z-10 flex-1 flex flex-col md:flex-row items-center justify-center gap-6 px-4 md:px-10 pb-2 overflow-y-auto">

        {/* Character display */}
        <div key={`char-${animKey}`} className="flex flex-col items-center flex-shrink-0"
          style={{animation:"csCharEnter 0.42s cubic-bezier(0.34,1.56,0.64,1) both"}}>
          {/* Glow platform */}
          <div style={{
            width:220, height:20, marginBottom:-14,
            background:`radial-gradient(ellipse, ${char.glow} 0%, transparent 70%)`,
            filter:"blur(10px)",
          }} />
          {/* Character image — drop-shadow creates separation from bright bg */}
          <div style={{
            filter:`drop-shadow(0 0 32px ${char.glow}) drop-shadow(0 0 64px ${char.glow.replace("0.5","0.25")}) drop-shadow(0 8px 24px rgba(0,0,0,0.45))`,
            animation:"float 3.6s ease-in-out infinite",
          }}>
            {selected === "kio"
              ? <KioSVG className="h-60 md:h-72 w-auto" />
              : <KinaSVG className="h-60 md:h-72 w-auto" />
            }
          </div>
          {/* Character name tag below */}
          <div className="mt-4 flex items-center gap-2 px-5 py-2 rounded-full"
            style={{
              background:`${char.color}28`,
              border:`1px solid ${char.color}60`,
              boxShadow:`0 0 24px ${char.glow}, 0 4px 16px rgba(0,0,0,0.30)`,
              backdropFilter:"blur(8px)",
            }}>
            <div className="w-2 h-2 rounded-full animate-pulse" style={{background:char.color}} />
            <span className="font-bold text-sm tracking-widest" style={{color:char.color, fontFamily:"'Fredoka',sans-serif", letterSpacing:"0.2em"}}>
              {char.nameTag}
            </span>
            <div className="w-2 h-2 rounded-full animate-pulse" style={{background:char.color}} />
          </div>
        </div>

        {/* Game info panel */}
        <div key={`info-${animKey}`} className="w-full max-w-sm"
          style={{animation:"csInfoEnter 0.38s ease-out both", animationDelay:"0.06s"}}>
          <div className="rounded-3xl p-5 md:p-6" style={{
            background: char.panelBg.replace("0.85","0.92"),
            backdropFilter:"blur(32px)",
            WebkitBackdropFilter:"blur(32px)",
            border:`1px solid ${char.borderGlow}`,
            boxShadow:`0 0 0 1px ${char.borderGlow}, 0 0 80px ${char.glow}25, 0 20px 60px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.08)`,
          }}>

            {/* Name + role */}
            <div className="mb-5">
              <div className="text-4xl font-bold leading-none mb-2"
                style={{fontFamily:"'Fredoka',sans-serif", color:"white",
                  textShadow:`0 0 40px ${char.glow}, 0 2px 8px rgba(0,0,0,0.5)`}}>
                {char.name}
              </div>
              <div className="text-sm font-semibold" style={{color:`${char.color}dd`}}>
                {char.role}
              </div>
            </div>

            {/* Greeting bubble */}
            <div className="rounded-2xl p-4 mb-4" style={{
              background:`${char.color}14`,
              border:`1px solid ${char.color}30`,
            }}>
              <p className="text-sm leading-relaxed" style={{color:"rgba(255,255,255,0.88)"}}>
                "{char.greeting}"
              </p>
            </div>

            {/* Story */}
            <p className="text-sm leading-relaxed mb-5" style={{color:"rgba(255,255,255,0.68)"}}>
              {char.story}
            </p>

            {/* Personality tags */}
            <div className="flex flex-wrap gap-2 mb-5">
              {char.tags.map(({Icon, label}) => (
                <span key={label} className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full"
                  style={{background:`${char.color}18`, color:"rgba(255,255,255,0.85)", border:`1px solid ${char.color}30`}}>
                  <Icon style={{width:11,height:11,color:char.color}} strokeWidth={2} />
                  {label}
                </span>
              ))}
            </div>

            {/* What we do together */}
            <div className="space-y-2.5">
              {char.moments.map(({Icon, text}) => (
                <div key={text} className="flex items-start gap-3">
                  <div className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
                    style={{background:`${char.color}20`}}>
                    <Icon style={{width:13,height:13,color:char.color}} strokeWidth={2} />
                  </div>
                  <p className="text-sm leading-snug" style={{color:"rgba(255,255,255,0.72)"}}>
                    {text}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ══ Character selector tabs ══ */}
      <div className="relative z-10 flex justify-center gap-3 py-4">
        {(["kio","kina"] as const).map((c) => {
          const d = CHAR_DATA[c];
          const active = selected === c;
          return (
            <button key={c} onClick={() => switchTo(c)}
              className="flex items-center gap-2.5 px-5 py-2.5 rounded-full transition-all duration-300"
              style={{
                background: active ? `${d.color}22` : "rgba(255,255,255,0.07)",
                border:`1.5px solid ${active ? d.color : "rgba(255,255,255,0.14)"}`,
                color: active ? d.color : "rgba(255,255,255,0.45)",
                boxShadow: active ? `0 0 28px ${d.glow}, 0 0 8px ${d.glow}` : "none",
                transform: active ? "scale(1.06)" : "scale(1)",
              }}>
              <div className="w-8 h-8 rounded-full overflow-hidden flex items-end justify-center flex-shrink-0"
                style={{background:`${d.color}18`, border:`1px solid ${d.color}40`}}>
                {c === "kio" ? <KioSVG className="w-7 h-auto" /> : <KinaSVG className="w-7 h-auto" />}
              </div>
              <span className="font-bold text-sm">{d.name}</span>
              {active && (
                <div className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                  style={{background:d.color, boxShadow:`0 0 8px ${d.color}`}} />
              )}
            </button>
          );
        })}
      </div>

      {/* ══ Cloud Wipe Transition ══ */}
      {cloudPhase !== "idle" && (
        <div className="absolute inset-0 z-[50] pointer-events-none overflow-hidden">
          {[0,1,2,3,4,5,6,7].map(i => {
            const topPct = -14 + i * 17;
            const delay = i * 0.055;
            return (
              <div key={i} style={{
                position:"absolute",
                top:`${topPct}%`,
                left:"-10%",
                width:"120%",
                height:"26%",
                background: "radial-gradient(ellipse 70% 80% at 50% 50%, rgba(255,252,255,0.98) 0%, rgba(248,240,255,0.96) 40%, rgba(235,225,255,0.90) 75%, rgba(220,210,250,0.78) 100%)",
                borderRadius:"50%",
                animation: cloudPhase === "in"
                  ? `cloudIn 0.65s ${delay}s cubic-bezier(0.22,0.8,0.36,1) both`
                  : `cloudOut 0.80s ${delay}s cubic-bezier(0.64,0,0.78,0.2) both`,
              }} />
            );
          })}
        </div>
      )}

      <style>{`
        @keyframes csCharEnter {
          from { opacity:0; transform:translateX(-24px) scale(0.92); }
          to   { opacity:1; transform:translateX(0)    scale(1); }
        }
        @keyframes csInfoEnter {
          from { opacity:0; transform:translateX(20px); }
          to   { opacity:1; transform:translateX(0); }
        }
        @keyframes twinkle {
          0%,100% { opacity:0.35; transform:scale(1); }
          50%     { opacity:1;    transform:scale(1.4); }
        }
        @keyframes float {
          0%,100% { transform:translateY(0); }
          50%     { transform:translateY(-12px); }
        }
        @keyframes cloudIn {
          from { transform:translateX(115%); }
          to   { transform:translateX(-5%); }
        }
        @keyframes cloudOut {
          from { transform:translateX(-5%); }
          to   { transform:translateX(-120%); }
        }
        @keyframes crystalPulse {
          0%,100% { opacity:0.75; transform:translateX(-50%) scale(1); }
          50%      { opacity:1;    transform:translateX(-50%) scale(1.08); }
        }
        @keyframes rayPulse {
          0%,100% { opacity:0; }
          50%     { opacity:1; }
        }
        @keyframes warmPulse {
          0%,100% { opacity:0.7; transform:translateX(-50%) scale(1); }
          50%      { opacity:1;   transform:translateX(-50%) scale(1.06); }
        }
        @keyframes fireflyFloat {
          0%   { opacity:0.3; transform:translate(-50%,-50%) translateY(0px); }
          30%  { opacity:1;   transform:translate(-50%,-50%) translateY(-8px); }
          60%  { opacity:0.7; transform:translate(-50%,-50%) translateY(-4px); }
          100% { opacity:0.3; transform:translate(-50%,-50%) translateY(0px); }
        }
      `}</style>
    </div>
  );
}

// ─── App ──────────────────────────────────────────────────────────────────────

// ─── Login Screen ─────────────────────────────────────────────────────────────

function LoginScreen({ onClose }: { onClose: () => void }) {
  const [tab, setTab] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [showPw, setShowPw] = useState(false);

  return (
    <div className="fixed inset-0 z-[9000] flex">

      {/* ── Left: Visual panel ── */}
      <div className="hidden md:flex relative w-[46%] flex-col overflow-hidden">
        {/* Background image */}
        <img src={mushroomBg} alt="" className="absolute inset-0 w-full h-full object-cover object-center" />
        {/* Warm overlay */}
        <div className="absolute inset-0" style={{background:"linear-gradient(160deg, rgba(30,10,60,0.55) 0%, rgba(120,40,160,0.25) 50%, rgba(10,30,10,0.60) 100%)"}} />

        {/* Logo */}
        <div className="relative z-10 p-8 flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center shadow-lg" style={{background:"linear-gradient(135deg,#E879A0,#F472B6)"}}>
            <MiniStar size={20} color="white" />
          </div>
          <span className="text-2xl font-bold text-white" style={{fontFamily:"'Fredoka',sans-serif"}}>Kindy</span>
        </div>

        {/* Characters floating */}
        <div className="relative z-10 flex-1 flex items-end justify-center pb-16 gap-6">
          <div style={{filter:"drop-shadow(0 0 24px rgba(244,114,182,0.6))", animation:"float 3.8s ease-in-out infinite"}}>
            <KinaSVG className="h-52 w-auto" />
          </div>
          <div style={{filter:"drop-shadow(0 0 24px rgba(96,165,250,0.6))", animation:"float 3.4s ease-in-out infinite", animationDelay:"0.6s"}}>
            <KioSVG className="h-52 w-auto" />
          </div>
        </div>

        {/* Bottom copy */}
        <div className="relative z-10 px-10 pb-12">
          <p className="text-white text-xl font-bold leading-snug mb-2" style={{fontFamily:"'Fredoka',sans-serif", textShadow:"0 2px 12px rgba(0,0,0,0.4)"}}>
            아이의 하루를 함께 기억하는<br />따뜻한 AI 친구
          </p>
          <p className="text-sm" style={{color:"rgba(255,255,255,0.65)"}}>키오와 키나가 언제나 옆에 있어요</p>
        </div>
      </div>

      {/* ── Right: Form panel ── */}
      <div className="flex-1 bg-white flex flex-col overflow-y-auto">
        {/* Top bar */}
        <div className="flex items-center justify-between px-8 pt-8 pb-2">
          <button onClick={onClose}
            className="w-9 h-9 rounded-full flex items-center justify-center transition-all hover:bg-gray-100 active:scale-95"
            style={{color:"#6B7280"}}>
            <X className="w-5 h-5" />
          </button>
          {/* Mobile logo */}
          <div className="md:hidden flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{background:"linear-gradient(135deg,#E879A0,#F472B6)"}}>
              <MiniStar size={16} color="white" />
            </div>
            <span className="text-lg font-bold" style={{fontFamily:"'Fredoka',sans-serif",color:"#3B1355"}}>Kindy</span>
          </div>
          <div className="w-9" />
        </div>

        {/* Form content */}
        <div className="flex-1 flex flex-col justify-center px-8 md:px-12 py-8 max-w-md w-full mx-auto">

          {/* Heading */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2" style={{fontFamily:"'Fredoka',sans-serif", color:"#1F0A3C"}}>
              {tab === "login" ? "다시 만나 반가워요!" : "함께 시작해요!"}
            </h1>
            <p className="text-sm" style={{color:"#9CA3AF"}}>
              {tab === "login" ? "계정에 로그인하고 오늘 하루를 기록해보세요" : "키오와 키나를 지금 만나보세요"}
            </p>
          </div>

          {/* Tab toggle */}
          <div className="flex rounded-2xl p-1 mb-7" style={{background:"#F3F4F6"}}>
            {(["login","signup"] as const).map(t => (
              <button key={t} onClick={() => setTab(t)}
                className="flex-1 py-2.5 rounded-xl text-sm font-bold transition-all"
                style={{
                  background: tab === t ? "white" : "transparent",
                  color: tab === t ? "#E879A0" : "#9CA3AF",
                  boxShadow: tab === t ? "0 1px 8px rgba(0,0,0,0.08)" : "none",
                }}>
                {t === "login" ? "로그인" : "회원가입"}
              </button>
            ))}
          </div>

          {/* Inputs */}
          <div className="space-y-3 mb-4">
            {tab === "signup" && (
              <div>
                <label className="block text-xs font-semibold mb-1.5" style={{color:"#6B7280"}}>이름</label>
                <input
                  type="text" placeholder="이름을 입력해주세요"
                  className="w-full rounded-2xl px-4 outline-none transition-all text-sm"
                  style={{
                    height:54, border:"1.5px solid #E5E7EB", background:"#FAFAFA", color:"#1F0A3C",
                  }}
                  onFocus={e => { e.target.style.border="1.5px solid #E879A0"; e.target.style.boxShadow="0 0 0 3px rgba(232,121,160,0.12)"; }}
                  onBlur={e  => { e.target.style.border="1.5px solid #E5E7EB"; e.target.style.boxShadow="none"; }}
                />
              </div>
            )}
            <div>
              <label className="block text-xs font-semibold mb-1.5" style={{color:"#6B7280"}}>이메일</label>
              <input
                type="email" placeholder="이메일 주소를 입력해주세요"
                value={email} onChange={e => setEmail(e.target.value)}
                className="w-full rounded-2xl px-4 outline-none transition-all text-sm"
                style={{height:54, border:"1.5px solid #E5E7EB", background:"#FAFAFA", color:"#1F0A3C"}}
                onFocus={e => { e.target.style.border="1.5px solid #E879A0"; e.target.style.boxShadow="0 0 0 3px rgba(232,121,160,0.12)"; }}
                onBlur={e  => { e.target.style.border="1.5px solid #E5E7EB"; e.target.style.boxShadow="none"; }}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1.5" style={{color:"#6B7280"}}>비밀번호</label>
              <div className="relative">
                <input
                  type={showPw ? "text" : "password"} placeholder="비밀번호를 입력해주세요"
                  value={pw} onChange={e => setPw(e.target.value)}
                  className="w-full rounded-2xl px-4 pr-12 outline-none transition-all text-sm"
                  style={{height:54, border:"1.5px solid #E5E7EB", background:"#FAFAFA", color:"#1F0A3C"}}
                  onFocus={e => { e.target.style.border="1.5px solid #E879A0"; e.target.style.boxShadow="0 0 0 3px rgba(232,121,160,0.12)"; }}
                  onBlur={e  => { e.target.style.border="1.5px solid #E5E7EB"; e.target.style.boxShadow="none"; }}
                />
                <button onClick={() => setShowPw(v => !v)}
                  className="absolute right-4 top-1/2 -translate-y-1/2"
                  style={{color:"#9CA3AF"}}>
                  {showPw
                    ? <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                    : <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                  }
                </button>
              </div>
            </div>
          </div>

          {/* Forgot password */}
          {tab === "login" && (
            <div className="flex justify-end mb-5">
              <button className="text-xs font-semibold" style={{color:"#9CA3AF"}}>비밀번호를 잊으셨나요?</button>
            </div>
          )}

          {/* Primary button */}
          <button
            className="w-full rounded-2xl font-bold text-white text-base transition-all hover:opacity-90 active:scale-[0.98] mb-5"
            style={{
              height:52,
              background:"linear-gradient(135deg, #E879A0 0%, #F472B6 50%, #C084FC 100%)",
              boxShadow:"0 4px 20px rgba(232,121,160,0.40)",
            }}>
            {tab === "login" ? "로그인" : "가입하기"}
          </button>

          {/* Divider */}
          <div className="flex items-center gap-3 mb-5">
            <div className="flex-1 h-px" style={{background:"#E5E7EB"}} />
            <span className="text-xs font-medium" style={{color:"#D1D5DB"}}>또는 간편 로그인</span>
            <div className="flex-1 h-px" style={{background:"#E5E7EB"}} />
          </div>

          {/* Social logins */}
          <div className="flex justify-center gap-3">
            {/* Kakao */}
            <button className="w-12 h-12 rounded-2xl flex items-center justify-center transition-all hover:scale-105 active:scale-95 shadow-sm"
              style={{background:"#FEE500"}}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="#3C1E1E">
                <path d="M12 3C6.477 3 2 6.477 2 10.8c0 2.7 1.714 5.08 4.286 6.514L5.143 21l4.714-2.571c.693.1 1.41.143 2.143.143 5.523 0 10-3.477 10-7.772C22 6.477 17.523 3 12 3z"/>
              </svg>
            </button>
            {/* Naver */}
            <button className="w-12 h-12 rounded-2xl flex items-center justify-center transition-all hover:scale-105 active:scale-95 shadow-sm"
              style={{background:"#03C75A"}}>
              <span className="font-black text-white text-lg" style={{fontFamily:"sans-serif",lineHeight:1}}>N</span>
            </button>
            {/* Google */}
            <button className="w-12 h-12 rounded-2xl flex items-center justify-center transition-all hover:scale-105 active:scale-95 shadow-sm"
              style={{background:"white", border:"1.5px solid #E5E7EB"}}>
              <svg width="18" height="18" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
            </button>
            {/* Apple */}
            <button className="w-12 h-12 rounded-2xl flex items-center justify-center transition-all hover:scale-105 active:scale-95 shadow-sm"
              style={{background:"#000"}}>
              <svg width="16" height="20" viewBox="0 0 814 1000" fill="white">
                <path d="M788.1 340.9c-5.8 4.5-108.2 62.2-108.2 190.5 0 148.4 130.3 200.9 134.2 202.2-.6 3.2-20.7 71.9-68.7 141.9-42.8 61.6-87.5 123.1-155.5 123.1s-85.5-39.5-164-39.5c-76 0-103.7 40.8-165.9 40.8s-105-42.4-148.8-106.3C46.5 763.2 0 661.1 0 563.8c0-171.6 111.6-262.1 221.4-262.1 85.5 0 155.5 54.1 208.4 54.1 52.9 0 134.7-58.2 231.7-58.2 50.4 0 198.5 5.8 293.3 124.5zm-240.9-157.2c45.4-53.5 76-128.3 76-203.1 0-10.3-.6-20.7-2.6-29.4-72.5 2.6-159.3 48.9-211.6 109.6-41.5 47.7-79.6 122.5-79.6 198.1 0 11 1.9 21.9 2.6 25.4 4.5.6 11.6 1.9 18.7 1.9 64.7 0 145.2-43.4 196.5-102.5z"/>
              </svg>
            </button>
          </div>

          {/* Bottom switch */}
          <p className="text-center text-xs mt-7" style={{color:"#9CA3AF"}}>
            {tab === "login"
              ? <span>아직 계정이 없으신가요? <button onClick={() => setTab("signup")} className="font-bold" style={{color:"#E879A0"}}>회원가입</button></span>
              : <span>이미 계정이 있으신가요? <button onClick={() => setTab("login")} className="font-bold" style={{color:"#E879A0"}}>로그인</button></span>
            }
          </p>
        </div>
      </div>
    </div>
  );
}

// ─── App ──────────────────────────────────────────────────────────────────────

export default function App() {
  const [splashDone, setSplashDone] = useState(false);
  const [showCharacters, setShowCharacters] = useState(false);
  const [showLogin, setShowLogin] = useState(false);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <SplashIntro onDone={() => setSplashDone(true)} />
      {showCharacters && <CharacterShowcase onClose={() => setShowCharacters(false)} />}
      {showLogin && <LoginScreen onClose={() => setShowLogin(false)} />}

      <div style={{ opacity: splashDone ? 1 : 0, transition: "opacity 0.5s ease-in" }}>
        <Navbar onOpenCharacters={() => setShowCharacters(true)} onOpenLogin={() => setShowLogin(true)} />
        <HeroSection />
        <FeaturesSection />
        <HowItWorks />
        <AnalyticsDashboard />
        <PersonasSection />
        <TestimonialsSection />
        <CTASection />
        <Footer />
      </div>
    </div>
  );
}
