import { useCallback, useEffect, useState } from "react";
import { Mail, Check, X } from "lucide-react";
import { useAuth } from "@/app/auth/AuthContext";
import { acceptInviteOnServer, fetchReceivedInvites, rejectInviteOnServer } from "@/app/dashboard/backendSync";
import type { InviteDTO } from "@/app/lib/dto";

/** 초대는 유치원과의 관계 종류(CHILD/TEACHER)로 구분됩니다. */
export type InviteTargetRole = "teacher" | "parent" | "child";

const ROLE_LABEL: Record<InviteTargetRole, string> = { teacher: "선생님", parent: "학부모", child: "아이" };

/** 화면의 역할과 백엔드 관계 타입의 대응입니다. 학부모와 아이는 서버에서 같은 CHILD 관계입니다. */
const TYPE_FOR_ROLE: Record<InviteTargetRole, InviteDTO["type"]> = {
  teacher: "TEACHER",
  parent: "CHILD",
  child: "CHILD",
};

/**
 * 로그인한 계정 앞으로 온 대기 중인 초대를 보여주고, 그 자리에서 수락/거절합니다.
 * 회원가입 온보딩 중이나 마이페이지에서 나중에 확인할 때나 동일하게 씁니다.
 *
 * 수락하면 서버에 유치원 관계가 생기고, 대시보드가 `kindergarten/memberships`를
 * 다시 읽어 워크스페이스를 만듭니다 — 여기서 계정 정보를 직접 고치지는 않습니다.
 */
export function ReceivedInvites({ role, onAccepted }: { role: InviteTargetRole; onAccepted?: () => void }) {
  const { user } = useAuth();
  const [invites, setInvites] = useState<InviteDTO[]>([]);
  const [busyId, setBusyId] = useState<number | null>(null);

  const refresh = useCallback(() => {
    if (!user) return;
    fetchReceivedInvites()
      .then((list) =>
        // INVITE 방향(원장이 보낸 것)의 대기 중인 초대만, 지금 화면의 역할에 맞는 것으로 거릅니다.
        setInvites(list.filter((i) => i.status === "PENDING" && i.direction === "INVITE" && i.type === TYPE_FOR_ROLE[role])),
      )
      .catch(() => setInvites([]));
  }, [user, role]);

  useEffect(refresh, [refresh]);

  if (!user || invites.length === 0) return null;

  /** 서버가 수락을 받아들인 뒤에야 목록에서 지웁니다. 실패하면 초대가 그대로 남습니다. */
  async function respond(inviteId: number, accept: boolean) {
    setBusyId(inviteId);
    try {
      await (accept ? acceptInviteOnServer(inviteId) : rejectInviteOnServer(inviteId));
      setInvites((prev) => prev.filter((i) => i.id !== inviteId));
      if (accept) onAccepted?.();
    } catch (cause) {
      console.warn("[Kindy] 초대를 처리하지 못했어요.", cause);
      refresh();
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="space-y-2 mb-4">
      <p className="text-xs font-bold flex items-center gap-1.5" style={{ color: "#E879A0" }}>
        <Mail className="w-3.5 h-3.5" /> 받은 초대가 있어요
      </p>
      {invites.map((invite) => (
        <div key={invite.id} className="rounded-2xl px-4 py-3 flex items-center gap-3" style={{ background: "#FDF2F8", border: "1px solid #FBCFE8" }}>
          <div className="flex-1 min-w-0">
            {/* 유치원 이름이 초대에 함께 오므로 따로 조회하지 않습니다. */}
            <p className="text-sm font-bold truncate" style={{ color: "#1F0A3C" }}>
              {invite.kindergartenName || `유치원 #${invite.kindergartenId}`}
            </p>
            <p className="text-xs truncate" style={{ color: "#9CA3AF" }}>
              {invite.inviterId ? `${invite.inviterId}님이 ` : ""}
              {ROLE_LABEL[role]}(으)로 초대했어요
            </p>
          </div>
          <button
            onClick={() => respond(invite.id, false)}
            disabled={busyId === invite.id}
            aria-label="거절"
            className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 disabled:opacity-50"
            style={{ background: "#F3F4F6" }}
          >
            <X className="w-4 h-4" style={{ color: "#9CA3AF" }} />
          </button>
          <button
            onClick={() => respond(invite.id, true)}
            disabled={busyId === invite.id}
            aria-label="수락"
            className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-white transition-transform active:scale-95 disabled:opacity-50"
            style={{ background: "linear-gradient(135deg,#E879A0,#F472B6)" }}
          >
            <Check className="w-4 h-4" />
          </button>
        </div>
      ))}
    </div>
  );
}
