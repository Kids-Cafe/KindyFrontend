import { ArrowRight, Download, Shield, Bell, Star } from "lucide-react";
import { Sparkle, CloudPuff, MushroomTeal, MushroomPink, MushroomOrange, KioSVG, KinaSVG } from "@/app/components/decorative";

/** 푸터 앞에 표시되는 앱스토어 배지가 있는 최종 행동 유도 배너입니다. */
export function CTASection() {
  return (
    <section className="py-28 relative overflow-hidden"
      style={{ background: "linear-gradient(160deg, #C8B8F0 0%, #E8B8D8 30%, #F9C0D4 60%, #FFD8C0 100%)" }}>

      {/* 구름 */}
      <CloudPuff className="absolute top-8 left-0 w-56 opacity-40" />
      <CloudPuff className="absolute top-16 right-4 w-44 opacity-35" />
      <CloudPuff className="absolute bottom-8 left-1/3 w-48 opacity-30" />

      {/* 반짝임 */}
      {[
        { top: "15%", left: "8%", size: 20 }, { top: "70%", left: "5%", size: 14 },
        { top: "25%", right: "6%", size: 18 }, { top: "65%", right: "4%", size: 12 },
      ].map((s, i) => (
        <Sparkle key={i} size={s.size} color="#F9D56E"
          style={{ position: "absolute", top: s.top, left: "left" in s ? s.left : undefined,
            right: "right" in s ? (s as {right: string}).right : undefined, opacity: 0.6 }} />
      ))}

      {/* 하단 버섯 */}
      <div className="absolute bottom-0 left-0 right-0 flex items-end justify-around pointer-events-none overflow-hidden">
        <MushroomTeal className="w-12 h-auto opacity-50" />
        <MushroomPink className="w-16 h-auto opacity-60" />
        <MushroomOrange className="w-14 h-auto opacity-45" />
        <MushroomPink className="w-10 h-auto opacity-40" />
        <MushroomTeal className="w-14 h-auto opacity-55" />
        <div className="absolute bottom-0 left-0 right-0 h-8" style={{ background: "#3B1355" }} />
      </div>

      <div className="max-w-4xl mx-auto px-6 text-center relative z-10">
        {/* 캐릭터 */}
        <div className="flex items-end justify-center gap-6 mb-8">
          {/* 키오 - 파란색 */}
          <div className="flex flex-col items-center" style={{ animation: "float 3.2s ease-in-out infinite" }}>
            <KioSVG className="w-36 h-auto drop-shadow-2xl" />
            <div className="mt-2 text-sm font-bold px-4 py-1 rounded-full"
              style={{ background: "rgba(219,234,254,0.7)", color: "#1D4ED8" }}>
              키오
            </div>
          </div>
          {/* 키나 - 분홍색 */}
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

        {/* 앱스토어 배지 */}
        <div className="flex items-center justify-center gap-4 mb-10 flex-wrap">
          {/* 앱스토어 */}
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
          {/* 구글 플레이 */}
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
