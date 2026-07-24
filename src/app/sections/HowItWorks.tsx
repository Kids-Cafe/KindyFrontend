import { MiniStar, MushroomPink, MushroomTeal } from "@/app/components/decorative";
import { steps } from "@/app/data/contentData";

/** "이용 방법": 데스크톱에서 가로 그라디언트 선으로 연결되는 4단계 이용 흐름입니다. */
export function HowItWorks() {
  return (
    <section id="how" className="py-28 relative overflow-hidden"
      style={{ background: "linear-gradient(160deg, #FFF0F8 0%, #F5F0FF 50%, #F0F8FF 100%)" }}>
      {/* 버섯 장식 */}
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
