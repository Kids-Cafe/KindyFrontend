import { ChevronRight } from "lucide-react";
import { MiniStar, MushroomPink, MushroomTeal } from "@/app/components/decorative";
import { personas } from "@/app/data/contentData";

/** "모두를 위한 Kindy": 대상별(아이, 부모, 선생님) 카드 하나씩 표시합니다. */
export function PersonasSection() {
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
