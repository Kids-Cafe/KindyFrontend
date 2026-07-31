import type { DashboardWorkspace } from "@/app/dashboard/DashboardStoreContext";

/** 워크스페이스 역할별로 서버 아이콘에 붙일 이모지입니다. 원장 본인 유치원은 이니셜 그대로, 타 유치원은 이모지로 구분합니다. */
const WORKSPACE_EMOJI: Partial<Record<DashboardWorkspace["role"], string>> = {
  parent: "✨",
};

/**
 * 디스코드의 "서버 목록" 자리를 대체하는 가장 왼쪽 얇은 레일입니다.
 * 여러 유치원(워크스페이스)을 오갈 수 있도록 배열을 받아 아이콘 목록으로 그립니다.
 * 원장 계정에는 자기 유치원 아래에 데모용 "타 유치원(학부모로 참여 중)" 아이콘이 하나 더 붙습니다.
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
      {workspaces.map((ws) => {
        const active = ws.id === activeWorkspaceId;
        // 워크스페이스가 직접 지정한 아이콘(4역할 데모 계정)이 우선입니다.
        const emoji = ws.icon ?? WORKSPACE_EMOJI[ws.role];
        const suffix = ws.label ?? (WORKSPACE_EMOJI[ws.role] ? "학부모로 참여 중" : undefined);
        const title = suffix ? `${ws.kindergarten.name} (${suffix})` : ws.kindergarten.name;
        return (
          <button
            key={ws.id}
            onClick={() => onSwitchWorkspace(ws.id)}
            title={title}
            aria-label={title}
            aria-current={active ? "page" : undefined}
            className="w-12 h-12 rounded-2xl flex items-center justify-center font-bold text-white text-lg transition-all hover:rounded-xl hover:scale-105 active:scale-95"
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
