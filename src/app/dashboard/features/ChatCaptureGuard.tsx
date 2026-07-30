import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import { ShieldAlert } from "lucide-react";

/**
 * 선생님/원장 채팅 화면을 감싸는 캡처 저지 래퍼입니다.
 *
 * 주의: 웹 기술로는 OS 레벨 스크린샷(PrintScreen, 캡처 도구 등)을 근본적으로 막을 수 없습니다.
 * 아래는 어디까지나 "저지 + 유출 시 추적"을 위한 최선의 대응이며, 완전 차단이 아닙니다.
 * - 우클릭/드래그선택 차단, 인쇄 시 숨김
 * - 대표적인 캡처 단축키 입력을 감지해 잠깐 경고를 띄움
 * - 계정명+시각 워터마크를 화면에 겹쳐 그려 캡처되더라도 출처를 남김
 */
export function ChatCaptureGuard({ children, viewerName }: { children: ReactNode; viewerName: string }) {
  const [warning, setWarning] = useState(false);
  const [watermarkTime, setWatermarkTime] = useState(() => new Date());

  useEffect(() => {
    const timer = window.setInterval(() => setWatermarkTime(new Date()), 30_000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      const isPrintScreen = e.key === "PrintScreen";
      const isMacCapture = e.metaKey && e.shiftKey && ["3", "4", "5"].includes(e.key);
      const isWinSnip = e.metaKey && e.shiftKey && e.key.toLowerCase() === "s";
      if (isPrintScreen || isMacCapture || isWinSnip) {
        setWarning(true);
        window.setTimeout(() => setWarning(false), 2500);
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  const watermarkLabel = `${viewerName} · ${watermarkTime.toLocaleString("ko-KR", { hour: "2-digit", minute: "2-digit" })}`;

  return (
    <div
      className="relative select-none print:hidden"
      onContextMenu={(e) => e.preventDefault()}
      style={{ WebkitUserSelect: "none", userSelect: "none" }}
    >
      <div className="pointer-events-none absolute inset-0 z-10 overflow-hidden opacity-[0.07]">
        <div className="grid grid-cols-3 gap-10 -rotate-[28deg] scale-125 -translate-x-6 -translate-y-6">
          {Array.from({ length: 18 }).map((_, i) => (
            <span key={i} className="text-xs font-bold whitespace-nowrap" style={{ color: "#1F0A3C" }}>
              {watermarkLabel}
            </span>
          ))}
        </div>
      </div>

      {warning && (
        <div className="absolute inset-x-4 top-3 z-20 flex items-center gap-2 rounded-2xl px-4 py-2.5" style={{ background: "rgba(239,68,68,0.95)" }}>
          <ShieldAlert className="w-4 h-4 text-white shrink-0" />
          <p className="text-xs font-bold text-white">이 대화는 캡처가 제한됩니다. 자료가 필요하면 "정보 불러오기" 버튼을 사용해주세요.</p>
        </div>
      )}

      {children}
    </div>
  );
}
