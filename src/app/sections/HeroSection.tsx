import { useState, useEffect } from "react";
import { Mic, ArrowRight, BookOpen, Users, Smile, UtensilsCrossed } from "lucide-react";
import { Sparkle, MiniStar, CloudPuff, MushroomTeal, MushroomPink, MushroomOrange, KioSVG, KinaSVG } from "@/app/components/decorative";
import { heroEmotions, KIO_INFO, KINA_INFO } from "@/app/data/heroData";
import { DEMO_VIDEO_URL } from "@/app/data/demoVideo";

/**
 * 랜딩 히어로입니다. 왼쪽에는 헤드라인과 애니메이션 "아이가 말해요" 채팅 말풍선,
 * 오른쪽에는 나란히 선 키오와 키나가 있습니다. 캐릭터를 클릭하면 해당 캐릭터의
 * 인라인 "나는 누구일까요" 소개 카드가 열립니다.
 */
export function HeroSection({ onOpenSignup }: { onOpenSignup: () => void }) {
  const [emotionIdx, setEmotionIdx] = useState(0);
  const [fade, setFade] = useState(true);
  const [selectedChar, setSelectedChar] = useState<"kio" | "kina" | null>(null);
  const [kioHover, setKioHover] = useState(false);
  const [kinaHover, setKinaHover] = useState(false);

  // 약 2.8초마다 다음 "아이가 한 말" 문구로 크로스페이드합니다.
  useEffect(() => {
    const interval = setInterval(() => {
      setFade(false);
      setTimeout(() => {
        setEmotionIdx((i) => (i + 1) % heroEmotions.length);
        setFade(true);
      }, 300);
    }, 2800);
    return () => clearInterval(interval);
  }, []);

  return (
    <section className="relative min-h-screen flex items-center overflow-hidden pt-20"
      style={{ background: "linear-gradient(160deg, #C8B8F0 0%, #E0C8F0 18%, #F4C8E0 40%, #FFD8EC 62%, #FFE8C8 100%)" }}>

      {/* 배경 구름 덩어리 */}
      <CloudPuff className="absolute top-14 left-4 w-48 opacity-50" />
      <CloudPuff className="absolute top-28 right-8 w-36 opacity-40" />
      <CloudPuff className="absolute bottom-32 left-1/4 w-40 opacity-35" />

      {/* 떠 있는 반짝임 */}
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

      {/* 떠 있는 작은 별 */}
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
          {/* 왼쪽: 텍스트 */}
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

            {/* 애니메이션 채팅 말풍선 */}
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
              <button
                onClick={onOpenSignup}
                className="font-bold px-8 py-4 rounded-2xl transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0 flex items-center justify-center gap-2 text-sm text-white"
                style={{ background: "linear-gradient(135deg, #E879A0 0%, #C084FC 100%)" }}>
                무료로 시작하기
                <ArrowRight className="w-5 h-5" />
              </button>
              <button
                onClick={() => { if (DEMO_VIDEO_URL) window.open(DEMO_VIDEO_URL, "_blank", "noopener,noreferrer"); }}
                className="font-semibold px-8 py-4 rounded-2xl transition-all flex items-center justify-center gap-2 text-sm"
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

            {/* 지표 */}
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

          {/* 오른쪽: 나란히 있는 키오와 키나 */}
          <div className="relative flex items-end justify-center h-[520px] order-1 md:order-2">
            {/* 캐릭터 뒤의 부드러운 빛 */}
            <div className="absolute inset-0 rounded-3xl pointer-events-none"
              style={{ background: "radial-gradient(ellipse at 30% 75%, rgba(184,212,255,0.4) 0%, transparent 52%), radial-gradient(ellipse at 70% 75%, rgba(255,181,200,0.38) 0%, transparent 52%)" }} />

            {/* 안내 툴팁: 선택된 캐릭터가 없을 때 표시됩니다. */}
            {!selectedChar && (
              <div className="absolute top-0 left-1/2 -translate-x-1/2 text-xs font-semibold px-4 py-2 rounded-full pointer-events-none"
                style={{ background: "rgba(255,255,255,0.7)", backdropFilter: "blur(8px)", color: "#A06080",
                  border: "1px solid rgba(255,255,255,0.8)", animation: "float 3s ease-in-out infinite" }}>
                캐릭터를 클릭해서 소개를 확인해요!
              </div>
            )}

            {/* 키오: 파란색, 왼쪽 */}
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
                {/* 이름 배지 */}
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 text-xs font-bold px-4 py-1.5 rounded-full shadow-lg whitespace-nowrap"
                  style={{ background: "linear-gradient(135deg,#DBEAFE,#BFDBFE)", color: "#1D4ED8",
                    border: "1.5px solid rgba(147,197,253,0.7)",
                    transform: kioHover ? "scale(1.05)" : "scale(1)",
                    transition: "transform 0.2s ease" }}>
                  키오 (남)
                </div>
                {/* 호버 시 맥동 링 */}
                {kioHover && (
                  <div className="absolute inset-0 rounded-full pointer-events-none"
                    style={{ boxShadow: "0 0 0 12px rgba(147,197,253,0.2), 0 0 0 24px rgba(147,197,253,0.08)" }} />
                )}
              </div>
            </div>

            {/* 가운데 떠 있는 일기 카드 */}
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
                  { Icon: Smile,           color: "#F9D56E", text: "행복한 하루" },
                  { Icon: UtensilsCrossed, color: "#86EFAC", text: "비빔밥 점심" },
                  { Icon: Users,           color: "#C084FC", text: "친구 3명과 놀기" },
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

            {/* 키나: 분홍색, 오른쪽 */}
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
                {/* 이름 배지 */}
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

            {/* ── 캐릭터 소개 카드 ── */}
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
                    {/* 닫기 */}
                    <button
                      onClick={() => setSelectedChar(null)}
                      className="absolute top-3 right-3 w-7 h-7 rounded-full flex items-center justify-center transition-colors"
                      style={{ background: "rgba(0,0,0,0.06)", color: "#888", fontSize: 16, lineHeight: 1 }}>
                      ×
                    </button>

                    {/* 헤더: 이미지와 이름 */}
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

                    {/* 말풍선 */}
                    <div className="relative rounded-2xl px-4 py-3 mb-3"
                      style={{ background: info.lightBg }}>
                      {/* 말풍선 꼬리 */}
                      <div className="absolute -top-2 left-8 w-4 h-4 rotate-45 rounded-sm"
                        style={{ background: selectedChar === "kio" ? "#DBEAFE" : "#FCE7F3" }} />
                      <p className="text-sm font-semibold leading-relaxed relative z-10"
                        style={{ color: info.darkColor }}>
                        "{info.speech}"
                      </p>
                    </div>

                    {/* 설명 */}
                    <p className="text-xs leading-relaxed mb-3" style={{ color: "#6B3580" }}>
                      {info.desc}
                    </p>

                    {/* 특성 칩 */}
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

      {/* 하단 버섯 테두리 */}
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
