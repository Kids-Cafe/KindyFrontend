import { Zap, Sparkles } from "lucide-react";
import { MiniStar } from "@/app/components/decorative";

/** 브랜드 소개, 세 개의 링크 열, 법적 고지 바를 포함한 사이트 푸터입니다. */
export function Footer() {
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
