import { Star } from "lucide-react";
import { Sparkle, MiniStar } from "@/app/components/decorative";
import { testimonials } from "@/app/data/contentData";

/** "사용자 후기": 부모, 선생님, 아이 사용자의 인용 카드입니다. */
export function TestimonialsSection() {
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
              <p className="text-sm flex-1 mb-2" style={{ color: "#6B3580", opacity: 0.5, fontStyle: "italic" }}>모의 생성된 후기입니다.</p>
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
