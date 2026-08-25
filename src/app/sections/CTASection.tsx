import { ArrowRight, Shield, Bell, Sparkles } from "lucide-react";
import { Sparkle, CloudPuff, MushroomTeal, MushroomPink, MushroomOrange, KioSVG, KinaSVG } from "@/app/components/decorative";

/** 푸터 앞에 표시되는 최종 행동 유도 배너입니다. */
export function CTASection({ onOpenSignup }: { onOpenSignup: () => void }) {
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

        <div className="flex justify-center mb-12">
          <button
            onClick={onOpenSignup}
            className="font-bold px-10 py-4 rounded-2xl transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5 flex items-center justify-center gap-2 text-sm text-white"
            style={{ background: "linear-gradient(135deg, #E879A0, #C084FC)" }}>
            시작하기 <ArrowRight className="w-5 h-5" />
          </button>
        </div>

        <div className="flex items-center justify-center gap-8 text-sm flex-wrap" style={{ color: "#8B5A80" }}>
          {[{ icon: Shield, label: "아동 개인정보 보호" }, { icon: Bell, label: "실시간 알림" }, { icon: Sparkles, label: "AI 성장 리포트" }].map((item) => (
            <div key={item.label} className="flex items-center gap-2">
              <item.icon className="w-4 h-4" /> {item.label}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
