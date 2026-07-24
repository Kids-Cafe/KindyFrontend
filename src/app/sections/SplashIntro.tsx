import { useState, useEffect } from "react";
import { Sparkle, MiniStar, KioSVG, KinaSVG } from "@/app/components/decorative";
import { SPLASH_BUBBLES } from "@/app/data/splashBubbles";

/**
 * 로드 시 한 번 표시되는 전체 화면 인트로 애니메이션입니다. 그라디언트 배경,
 * 로고, 캐릭터가 페이드 인된 뒤 버블들이 떠오르며 화면을 걷어냅니다.
 * 전부 CSS 기반(아래 keyframes)으로 동작하며, React 상태 변경은 애니메이션 완료 후
 * 한 번 언마운트하는 것뿐이라 애니메이션 중간 재렌더링으로 인한 끊김이 없습니다.
 */
export function SplashIntro({ onDone }: { onDone: () => void }) {
  const [done, setDone] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => {
      setDone(true);
      onDone();
    }, 3000);
    return () => clearTimeout(t);
  }, [onDone]);

  if (done) return null;

  return (
    <div className="fixed inset-0 z-[9999] overflow-hidden" style={{ pointerEvents: "none" }}>

      {/* ── 그라디언트 배경: 완전히 유지된 뒤 사라집니다. ── */}
      <div
        className="absolute inset-0"
        style={{
          background: "linear-gradient(160deg, #C4B0F0 0%, #E2B2DC 22%, #F7BBCC 52%, #FFCFB8 100%)",
          animation: "kindySplashBg 3s ease-out forwards",
        }}
      />

      {/* ── 브랜드 콘텐츠: 로고와 캐릭터가 버블이 정점에 오르기 전에 사라집니다. ── */}
      <div
        className="absolute inset-0 flex flex-col items-center justify-center gap-7 select-none"
        style={{ animation: "kindySplashContent 3s ease-out forwards" }}
      >
        {/* 반짝임 장식 */}
        <Sparkle size={24} color="#F9D56E" style={{ position: "absolute", top: "16%", left: "12%", opacity: 0.75 }} />
        <Sparkle size={16} color="white"   style={{ position: "absolute", top: "20%", right: "14%", opacity: 0.55 }} />
        <MiniStar size={18} color="#F9D56E" style={{ position: "absolute", bottom: "20%", left: "16%", opacity: 0.65 }} />
        <MiniStar size={13} color="white"   style={{ position: "absolute", bottom: "26%", right: "20%", opacity: 0.5 }} />

        {/* 로고 */}
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

        {/* 캐릭터 */}
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

      {/* ── 버블: JS 단계 전환 없이 엇갈린 지연으로 아래에서 떠오릅니다. ── */}
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
        /* 배경 페이드: 완전히 유지 → 버블이 화면을 덮으며 페이드 아웃 */
        @keyframes kindySplashBg {
          0%,  33% { opacity: 1; }
          58%, 100% { opacity: 0; }
        }
        /* 콘텐츠 페이드: 유지 → 버블이 정점에 오르기 전에 축소되며 페이드 아웃 */
        @keyframes kindySplashContent {
          0%,  28% { opacity: 1; transform: scale(1); }
          44%, 100% { opacity: 0; transform: scale(0.91); }
        }
        /* 버블이 모두 직선으로 올라가지 않도록 세 가지 흔들림 경로를 둡니다. */
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
