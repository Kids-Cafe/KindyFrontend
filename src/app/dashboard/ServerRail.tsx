import type { KindergartenRecord } from "@/app/dashboard/types";

/**
 * 디스코드의 "서버 목록" 자리를 대체하는 가장 왼쪽 얇은 레일입니다.
 * 지금은 유치원 1곳만 표시하지만, 여러 유치원/자녀를 오가야 할 경우를 대비해
 * 배열을 받는 구조로 만들어 두었습니다.
 */
export function ServerRail({ kindergarten, onGoMain }: { kindergarten: KindergartenRecord; onGoMain: () => void }) {
  return (
    <div
      className="w-[72px] shrink-0 flex flex-col items-center py-4 gap-3"
      style={{ background: "linear-gradient(180deg, #3B1355 0%, #6B2D8C 55%, #1F0A3C 100%)" }}
    >
      <button
        onClick={onGoMain}
        title="대시보드 메인으로 이동"
        aria-label="대시보드 메인으로 이동"
        className="h-9 px-2.5 rounded-xl flex items-center justify-center shrink-0 transition-transform hover:scale-110 active:scale-95 text-white text-[13px] font-bold tracking-tight"
        style={{ background: "linear-gradient(135deg,#E879A0,#F472B6)", fontFamily: "'Fredoka',sans-serif" }}
      >
        kindy
      </button>
      <div className="w-8 h-px" style={{ background: "rgba(255,255,255,0.15)" }} />
      <button
        title={kindergarten.name}
        className="w-12 h-12 rounded-2xl flex items-center justify-center font-bold text-white text-sm transition-all hover:rounded-xl hover:scale-105 active:scale-95"
        style={{ background: "rgba(255,255,255,0.14)", border: "1px solid rgba(255,255,255,0.2)" }}
      >
        {kindergarten.name.charAt(0)}
      </button>
    </div>
  );
}
