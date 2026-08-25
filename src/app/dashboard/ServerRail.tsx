import type { DashboardWorkspace } from "@/app/dashboard/DashboardStoreContext";

/** 같은 사람이라도 유치원마다 역할이 다를 수 있어, 아이콘 옆 설명으로 구분해 줍니다. */
const ROLE_LABEL: Record<DashboardWorkspace["role"], string> = {
  director: "원장으로 참여 중",
  teacher: "선생님으로 참여 중",
  parent: "학부모로 참여 중",
  child: "아이로 참여 중",
};

const ROLE_EMOJI: Partial<Record<DashboardWorkspace["role"], string>> = {
  parent: "✨",
  child: "🧒",
};

/**
 * 디스코드의 "서버 목록" 자리를 대체하는 가장 왼쪽 얇은 레일입니다.
 * 소속된 유치원마다 아이콘이 하나씩 붙고, 그 유치원에서의 역할이 툴팁에 함께 나옵니다.
 */
export function ServerRail({
  workspaces,
  activeWorkspaceId,
  onSwitchWorkspace,
  onGoMain,
}: {
  workspaces: DashboardWorkspace[];
  activeWorkspaceId: string;
  onSwitchWorkspace: (workspaceId: string) => void;
  onGoMain: () => void;
}) {
  return (
    <div
      className="w-14 md:w-[72px] shrink-0 flex flex-col items-center py-3 md:py-4 gap-2 md:gap-3 overflow-y-auto"
      style={{ background: "linear-gradient(180deg, #3B1355 0%, #6B2D8C 55%, #1F0A3C 100%)" }}
    >
      <button
        onClick={onGoMain}
        title="대시보드 메인으로 이동"
        aria-label="대시보드 메인으로 이동"
        className="h-9 px-1.5 md:px-2.5 rounded-xl flex items-center justify-center shrink-0 transition-transform hover:scale-110 active:scale-95 text-white text-[11px] md:text-[13px] font-bold tracking-tight"
        style={{ background: "linear-gradient(135deg,#E879A0,#F472B6)", fontFamily: "'Fredoka',sans-serif" }}
      >
        kindy
      </button>
      <div className="w-7 md:w-8 h-px shrink-0" style={{ background: "rgba(255,255,255,0.15)" }} />
      {workspaces.map((ws) => {
        const active = ws.id === activeWorkspaceId;
        const emoji = ROLE_EMOJI[ws.role];
        const title = `${ws.kindergarten.name} (${ROLE_LABEL[ws.role]})`;
        return (
          <button
            key={ws.id}
            onClick={() => onSwitchWorkspace(ws.id)}
            title={title}
            aria-label={title}
            aria-current={active ? "page" : undefined}
            className="w-11 h-11 md:w-12 md:h-12 shrink-0 rounded-2xl flex items-center justify-center font-bold text-white text-lg transition-all hover:rounded-xl hover:scale-105 active:scale-95"
            style={{
              background: active ? "linear-gradient(135deg,#E879A0,#F472B6)" : "rgba(255,255,255,0.14)",
              border: active ? "1px solid rgba(255,255,255,0.4)" : "1px solid rgba(255,255,255,0.2)",
            }}
          >
            {emoji ?? ws.kindergarten.name.charAt(0)}
          </button>
        );
      })}
    </div>
  );
}
