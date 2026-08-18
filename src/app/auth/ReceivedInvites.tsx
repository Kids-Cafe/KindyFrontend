import { useEffect, useMemo, useState } from "react";
import { Mail, Check, X } from "lucide-react";
import { useAuth } from "@/app/auth/AuthContext";
import { getKindergartenById } from "@/app/auth/mockSignup";
import { listInvitesForTarget, respondToInvite } from "@/app/dashboard/mock/membershipInvites";
import type { InviteTargetRole, MembershipInvite } from "@/app/dashboard/mock/membershipInvites";
import { apiGet, apiPost } from "@/app/lib/api";
import type { AuthUser, KindergartenInfo } from "@/app/auth/types";

const ROLE_LABEL: Record<InviteTargetRole, string> = { teacher: "선생님", parent: "학부모", child: "아이" };

/** 백엔드 InviteDTO입니다. 유치원 이름이 없어(백엔드 개선 필요) 별도로 조회해 보충합니다. */
interface BackendInvite {
  id: number;
  kindergartenId: number;
  inviterId: string;
  status: "PENDING" | "ACCEPTED" | "REJECTED" | "CANCELED";
}

/**
 * 원장이 아이디로 검색해 보낸 초대 중, 로그인한 계정 앞으로 온 대기 중인 것들을 보여줍니다.
 * 수락하면 그 자리에서 유치원/역할(+선생님이면 배정 반)을 계정에 반영하고 초대 상태도 갱신합니다.
 * 회원가입 온보딩 중이나, 마이페이지에서 나중에 확인할 때나 동일하게 씁니다.
 *
 * 교사(role="teacher") 초대는 실제 백엔드(`/api/kindergarten/invite/*`)를 쓰고,
 * 학부모/아이 초대는 백엔드에 대응하는 관계 타입이 없어(백엔드 개선 필요, "PARENT" 타입 부재)
 * 계속 로컬 mock(`mock/membershipInvites`)을 씁니다.
 */
export function ReceivedInvites({ role, onAccepted }: { role: InviteTargetRole; onAccepted?: () => void }) {
  const { user, updateProfile } = useAuth();
  const [version, setVersion] = useState(0);
  const [backendInvites, setBackendInvites] = useState<{ invite: BackendInvite; kindergartenName: string }[]>([]);

  const mockInvites = useMemo(() => {
    if (!user || role === "teacher") return [];
    void version;
    return listInvitesForTarget(user.id).filter((i) => i.role === role && i.status === "pending");
  }, [user, role, version]);

  useEffect(() => {
    if (!user || role !== "teacher") return;
    apiGet<BackendInvite[]>("/api/user/invite/list")
      .then(async (list) => {
        const pending = list.filter((i) => i.status === "PENDING");
        const withNames = await Promise.all(
          pending.map(async (invite) => {
            try {
              const kg = await apiGet<{ name: string }>("/api/kindergarten/info", { id: invite.kindergartenId });
              return { invite, kindergartenName: kg.name };
            } catch {
              return { invite, kindergartenName: "" };
            }
          }),
        );
        setBackendInvites(withNames);
      })
      .catch(() => {});
  }, [user, role, version]);

  if (!user || (mockInvites.length === 0 && backendInvites.length === 0)) return null;

  function handleAccept(invite: MembershipInvite) {
    const kindergarten = getKindergartenById(invite.kindergartenId);
    if (!kindergarten) return;
    const partial: Partial<AuthUser> = {
      kindergarten,
      role: invite.role === "teacher" ? "teacher" : "parent",
      ...(invite.role === "teacher" ? { teacherRole: "teacher" as const } : {}),
    };
    updateProfile(partial);
    respondToInvite(invite.id, true);
    setVersion((v) => v + 1);
    onAccepted?.();
  }

  function handleReject(inviteId: number) {
    respondToInvite(inviteId, false);
    setVersion((v) => v + 1);
  }

  function handleAcceptBackend(entry: { invite: BackendInvite; kindergartenName: string }) {
    const kindergarten: KindergartenInfo = { id: entry.invite.kindergartenId, name: entry.kindergartenName };
    updateProfile({ kindergarten, role: "teacher", teacherRole: "teacher" });
    apiPost("/api/kindergarten/invite/accept", { id: entry.invite.id })
      .catch(() => {})
      .finally(() => setVersion((v) => v + 1));
    onAccepted?.();
  }

  function handleRejectBackend(inviteId: number) {
    apiPost("/api/kindergarten/invite/reject", { id: inviteId })
      .catch(() => {})
      .finally(() => setVersion((v) => v + 1));
  }

  return (
    <div className="space-y-2 mb-4">
      <p className="text-xs font-bold flex items-center gap-1.5" style={{ color: "#E879A0" }}>
        <Mail className="w-3.5 h-3.5" /> 받은 초대가 있어요
      </p>
      {mockInvites.map((invite) => (
        <div key={invite.id} className="rounded-2xl px-4 py-3 flex items-center gap-3" style={{ background: "#FDF2F8", border: "1px solid #FBCFE8" }}>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold truncate" style={{ color: "#1F0A3C" }}>{invite.kindergartenName}</p>
            <p className="text-xs truncate" style={{ color: "#9CA3AF" }}>
              {invite.invitedByName}님이 {invite.className ? `${invite.className} ` : ""}{ROLE_LABEL[invite.role]}(으)로 초대했어요
            </p>
          </div>
          <button
            onClick={() => handleReject(invite.id)}
            aria-label="거절"
            className="w-8 h-8 rounded-full flex items-center justify-center shrink-0"
            style={{ background: "#F3F4F6" }}
          >
            <X className="w-4 h-4" style={{ color: "#9CA3AF" }} />
          </button>
          <button
            onClick={() => handleAccept(invite)}
            aria-label="수락"
            className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-white transition-transform active:scale-95"
            style={{ background: "linear-gradient(135deg,#E879A0,#F472B6)" }}
          >
            <Check className="w-4 h-4" />
          </button>
        </div>
      ))}
      {backendInvites.map((entry) => (
        <div key={entry.invite.id} className="rounded-2xl px-4 py-3 flex items-center gap-3" style={{ background: "#FDF2F8", border: "1px solid #FBCFE8" }}>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold truncate" style={{ color: "#1F0A3C" }}>{entry.kindergartenName || entry.invite.kindergartenId}</p>
            <p className="text-xs truncate" style={{ color: "#9CA3AF" }}>{ROLE_LABEL.teacher}(으)로 초대했어요</p>
          </div>
          <button
            onClick={() => handleRejectBackend(entry.invite.id)}
            aria-label="거절"
            className="w-8 h-8 rounded-full flex items-center justify-center shrink-0"
            style={{ background: "#F3F4F6" }}
          >
            <X className="w-4 h-4" style={{ color: "#9CA3AF" }} />
          </button>
          <button
            onClick={() => handleAcceptBackend(entry)}
            aria-label="수락"
            className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-white transition-transform active:scale-95"
            style={{ background: "linear-gradient(135deg,#E879A0,#F472B6)" }}
          >
            <Check className="w-4 h-4" />
          </button>
        </div>
      ))}
    </div>
  );
}
