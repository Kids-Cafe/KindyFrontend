import { Zap, Sparkles } from "lucide-react";
import { MiniStar } from "@/app/components/decorative";
import { LEGAL_DOCS, LEGAL_DOC_ORDER, type LegalDocId } from "@/app/data/legalData";

/** 랜딩 안에 실제로 존재하는 섹션으로만 이동하는 링크입니다. */
const SECTION_LINKS = [
  ["#features", "서비스 소개"],
  ["#how", "이용 방법"],
  ["#analytics", "분석 기능"],
  ["#personas", "사용자"],
] as const;

/**
 * 브랜드 소개, 섹션 바로가기, 약관/방침 링크로 구성된 사이트 푸터입니다.
 * 공모전 제출본이라 블로그·채용·요금제처럼 존재하지 않는 페이지로 가는
 * 링크는 두지 않고, 실제로 열리는 것만 남겼습니다.
 */
export function Footer({ onOpenLegal }: { onOpenLegal: (doc: LegalDocId) => void }) {
  return (
    <footer style={{ background: "#3B1355" }} className="text-white py-16">
      <div className="max-w-6xl mx-auto px-6">
        <div className="grid md:grid-cols-3 gap-10 mb-12">
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

          {/* 페이지 안 섹션 바로가기 */}
          <div>
            <div className="text-xs font-bold uppercase tracking-widest mb-5" style={{ color: "rgba(255,255,255,0.45)" }}>둘러보기</div>
            <ul className="space-y-3.5">
              {SECTION_LINKS.map(([href, label]) => (
                <li key={href}>
                  <a href={href} className="text-sm transition-colors" style={{ color: "rgba(255,255,255,0.38)" }}
                    onMouseEnter={e => (e.currentTarget.style.color = "rgba(255,181,200,0.8)")}
                    onMouseLeave={e => (e.currentTarget.style.color = "rgba(255,255,255,0.38)")}>
                    {label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* 약관과 방침 */}
          <div>
            <div className="text-xs font-bold uppercase tracking-widest mb-5" style={{ color: "rgba(255,255,255,0.45)" }}>약관 및 방침</div>
            <ul className="space-y-3.5">
              {LEGAL_DOC_ORDER.map((id) => (
                <li key={id}>
                  <button onClick={() => onOpenLegal(id)} className="text-sm text-left transition-colors" style={{ color: "rgba(255,255,255,0.38)" }}
                    onMouseEnter={e => (e.currentTarget.style.color = "rgba(255,181,200,0.8)")}
                    onMouseLeave={e => (e.currentTarget.style.color = "rgba(255,255,255,0.38)")}>
                    {LEGAL_DOCS[id].title}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="border-t pt-8 flex flex-col md:flex-row items-center justify-between gap-4"
          style={{ borderColor: "rgba(255,255,255,0.08)" }}>
          <div className="text-xs" style={{ color: "rgba(255,255,255,0.28)" }}>© 2025 Kindy</div>
          <div className="text-xs text-center md:text-right" style={{ color: "rgba(255,255,255,0.28)" }}>
            공모전 제출용 프로토타입입니다. 실제 서비스가 아니며 내용은 언제든지 바뀔 수 있습니다.
          </div>
        </div>
      </div>
    </footer>
  );
}
