import { Sparkle, MiniStar } from "@/app/components/decorative";
import { features } from "@/app/data/contentData";

/** "핵심 기능": 히어로 아래에 표시되는 세 가지 핵심 기능 카드입니다. */
export function FeaturesSection() {
  return (
    <section id="features" className="py-28 bg-background relative overflow-hidden">
      {/* 장식 요소 */}
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
