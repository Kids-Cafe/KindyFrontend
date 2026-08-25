import { useEffect, useState } from "react";
import { X, Info } from "lucide-react";
import { MiniStar } from "@/app/components/decorative";
import { LEGAL_DOCS, LEGAL_DOC_ORDER, LEGAL_NOTICE, type LegalDocId } from "@/app/data/legalData";

/**
 * 푸터에서 열리는 전체 화면 약관/방침 뷰어입니다. 라우터를 쓰지 않는 앱이라
 * 세 문서를 각각의 페이지로 두는 대신 하나의 모달 안에서 탭으로 전환합니다.
 * 문서 본문보다 상단의 공모전 고지가 먼저 눈에 들어오도록 배치했습니다.
 */
export function LegalPage({ docId, onClose }: { docId: LegalDocId; onClose: () => void }) {
  // 푸터에서 어떤 문서를 눌렀는지는 첫 렌더에만 반영하면 됩니다. 열려 있는 동안
  // 탭 전환은 이 state로만 이뤄지고, 푸터에서 다른 문서를 다시 고르는 경우는
  // App이 `key`로 이 컴포넌트를 다시 마운트해 처리합니다.
  const [current, setCurrent] = useState<LegalDocId>(docId);
  const doc = LEGAL_DOCS[current];

  // Escape 키로 닫습니다. (CharacterShowcase와 같은 방식입니다.)
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-[8000] overflow-y-auto"
      style={{ background: "linear-gradient(160deg, #FBF6FF 0%, #FFF7FA 45%, #FFF9F2 100%)" }}
      role="dialog"
      aria-modal="true"
      aria-label={doc.title}
    >
      {/* ── 상단 바: 로고와 닫기 ── */}
      <div
        className="sticky top-0 z-10 flex items-center justify-between px-6 py-4"
        style={{ background: "rgba(255,250,253,0.92)", backdropFilter: "blur(16px)", borderBottom: "1px solid rgba(232,121,160,0.15)" }}
      >
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center"
            style={{ background: "linear-gradient(135deg, #E879A0, #F472B6)" }}>
            <MiniStar size={16} color="white" />
          </div>
          <span className="text-xl font-bold" style={{ fontFamily: "'Fredoka', sans-serif", color: "#3B1355" }}>Kindy</span>
        </div>
        <button
          onClick={onClose}
          aria-label="닫기"
          className="w-9 h-9 rounded-full flex items-center justify-center transition-colors hover:bg-black/5"
          style={{ color: "#A06080" }}
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="max-w-3xl mx-auto px-6 py-10">
        {/* ── 문서 전환 탭 ── */}
        <div className="flex flex-wrap gap-2 mb-8">
          {LEGAL_DOC_ORDER.map((id) => {
            const active = id === current;
            return (
              <button
                key={id}
                onClick={() => setCurrent(id)}
                aria-current={active ? "page" : undefined}
                className="text-sm font-bold px-4 py-2 rounded-full transition-all"
                style={active
                  ? { background: "linear-gradient(135deg,#E879A0,#F472B6)", color: "white" }
                  : { background: "rgba(232,121,160,0.08)", color: "#A06080", border: "1px solid rgba(232,121,160,0.2)" }}
              >
                {LEGAL_DOCS[id].title}
              </button>
            );
          })}
        </div>

        <h1 className="text-4xl font-bold mb-2" style={{ fontFamily: "'Fredoka', sans-serif", color: "#3B1355" }}>
          {doc.title}
        </h1>
        <p className="text-sm mb-1" style={{ color: "#A06080" }}>{doc.summary}</p>
        <p className="text-xs mb-8" style={{ color: "#C09CB4" }}>기준: {doc.updated}</p>

        {/* ── 공통 고지: 문서 본문보다 먼저 읽히도록 강조합니다. ── */}
        <div className="rounded-3xl p-6 mb-10"
          style={{ background: "rgba(255,255,255,0.7)", border: "1.5px solid rgba(232,121,160,0.3)", boxShadow: "0 4px 24px rgba(232,121,160,0.08)" }}>
          <div className="flex items-center gap-2 mb-4">
            <Info className="w-4 h-4" style={{ color: "#E879A0" }} />
            <span className="text-sm font-bold" style={{ color: "#C0397A" }}>먼저 확인해 주세요</span>
          </div>
          <ul className="space-y-3">
            {LEGAL_NOTICE.map((line) => (
              <li key={line} className="flex gap-2.5 text-sm leading-relaxed" style={{ color: "#6B3580" }}>
                <span aria-hidden="true" style={{ color: "#E879A0" }}>·</span>
                <span>{line}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* ── 문서 본문 ── */}
        <div className="space-y-9">
          {doc.sections.map((section) => (
            <section key={section.heading}>
              <h2 className="text-lg font-bold mb-3" style={{ color: "#3B1355" }}>{section.heading}</h2>
              <div className="space-y-2.5">
                {section.body.map((line) => (
                  <p
                    key={line}
                    className="text-sm leading-relaxed"
                    style={{ color: "#6B3580", paddingLeft: line.startsWith("· ") ? "0.9rem" : 0 }}
                  >
                    {line}
                  </p>
                ))}
              </div>
            </section>
          ))}
        </div>

        <div className="mt-12 pt-8 flex justify-center" style={{ borderTop: "1px solid rgba(232,121,160,0.15)" }}>
          <button
            onClick={onClose}
            className="text-sm font-bold px-8 py-3 rounded-2xl text-white transition-all hover:-translate-y-0.5"
            style={{ background: "linear-gradient(135deg, #E879A0, #C084FC)" }}
          >
            돌아가기
          </button>
        </div>
      </div>
    </div>
  );
}
