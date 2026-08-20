import { useCallback, useEffect, useState } from "react";
import { Mail, Check, X, Clock } from "lucide-react";
import { useAuth } from "@/app/auth/AuthContext";
import {
  acceptInviteOnServer,
  cancelInviteOnServer,
  fetchReceivedInvites,
  rejectInviteOnServer,
} from "@/app/dashboard/backendSync";
import { FamilyInvites } from "@/app/auth/FamilyInvites";
import { withJosa } from "@/app/lib/korean";
import type { InviteDTO } from "@/app/lib/dto";

/**
 * 초대장에 적힌 관계 종류를 사람이 읽는 말로 바꿉니다.
 *
 * 티켓에 적힌 계정 유형(`accountType`)을 봅니다. 예전에는 **로그인한 사람의**
 * `user.accountType`을 봤는데, 그 값이 없는 세션에서는 성인으로 취급돼서
 * (`auth/accountType.ts`) 아이가 낸 신청이 "학부모"로 표시됐습니다.
 * 이제 유치원은 CHILD 관계에 CHILD 계정만 넣으므로 이 둘은 어긋나지 않습니다.
 */
function typeLabel(invite: InviteDTO): string {
  if (invite.type === "TEACHER") return "선생님";
  return invite.accountType === "ADULT" ? "학부모" : "아이";
}

function RoundButton({
  onClick,
  disabled,
  label,
  filled,
  children,
}: {
  onClick: () => void;
  disabled: boolean;
  label: string;
  filled?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      title={label}
      className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition-transform active:scale-95 disabled:opacity-50"
      style={filled ? { background: "linear-gradient(135deg,#E879A0,#F472B6)", color: "white" } : { background: "#F3F4F6" }}
    >
      {children}
    </button>
  );
}

/**
 * 로그인한 계정에 걸려 있는 대기 중인 초대장을 전부 보여줍니다.
 * 회원가입 온보딩 중이나, 대시보드 안에서나, 마이페이지에서나 동일하게 씁니다.
 *
 * 두 방향을 함께 다룹니다.
 * - `INVITE` — 원장/관리자가 나를 부른 초대입니다. 여기서 수락/거절합니다.
 * - `JOIN` — 내가 유치원에 넣은 가입 신청입니다. 아직 수락되지 않았음을 알려주고,
 *   원치 않으면 취소합니다. 이게 없으면 신청을 넣은 사람은 자기 신청이 살아 있는지
 *   확인할 방법이 없었습니다.
 *
 * 이전에는 화면마다 정해진 역할(`teacher`/`parent`/`child`)과 초대장의 관계 타입이
 * 정확히 맞을 때만 보여줘서, 학부모 계정이 선생님으로 초대받은 경우처럼 한 칸이라도
 * 어긋나면 초대장이 어디에서도 보이지 않았습니다. 초대장은 받은 사람 앞으로 온 것이라
 * 걸러낼 이유가 없으므로, 지금은 전부 보여주고 종류를 문구로 알려줍니다.
 *
 * 수락하면 서버에 유치원 관계가 생기고, 대시보드가 `kindergarten/memberships`를
 * 다시 읽어 워크스페이스를 만듭니다 — 여기서 계정 정보를 직접 고치지는 않습니다.
 */
export function ReceivedInvites({ onAccepted }: { onAccepted?: () => void }) {
  const { user } = useAuth();
  const [invites, setInvites] = useState<InviteDTO[]>([]);
  const [busyId, setBusyId] = useState<number | null>(null);

  const refresh = useCallback(() => {
    if (!user) return;
    // 서버는 대기 중인 것만 내려주지만, 상태를 여기서도 한 번 확인합니다.
    fetchReceivedInvites()
      .then((list) => setInvites(list.filter((i) => i.status === "PENDING")))
      .catch(() => setInvites([]));
  }, [user]);

  useEffect(refresh, [refresh]);

  const received = invites.filter((i) => i.direction === "INVITE");
  const requested = invites.filter((i) => i.direction === "JOIN");

  // 유치원 초대가 없어도 가족 연결 요청은 있을 수 있습니다. 예전처럼 여기서 바로 null을
  // 돌려주면 아래에 붙인 FamilyInvites까지 함께 사라집니다.
  if (!user) return null;

  /** 서버가 처리를 받아들인 뒤에야 목록에서 지웁니다. 실패하면 초대장이 그대로 남습니다. */
  async function respond(inviteId: number, action: "accept" | "reject" | "cancel") {
    setBusyId(inviteId);
    try {
      if (action === "accept") await acceptInviteOnServer(inviteId);
      else if (action === "reject") await rejectInviteOnServer(inviteId);
      else await cancelInviteOnServer(inviteId);

      setInvites((prev) => prev.filter((i) => i.id !== inviteId));
      if (action === "accept") onAccepted?.();
    } catch (cause) {
      console.warn("[Kindy] 초대를 처리하지 못했어요.", cause);
      refresh();
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="space-y-2 mb-4">
      {/* 가족 연결 요청도 "나에게 온 것"이라 같은 자리에 놓습니다. 이 컴포넌트가 이미
          대시보드·마이페이지·온보딩 네 곳에 붙어 있어 새 알림 자리를 만들 필요가 없습니다. */}
      <FamilyInvites onChanged={onAccepted} />

      {received.length > 0 && (
        <>
          <p className="text-xs font-bold flex items-center gap-1.5" style={{ color: "#E879A0" }}>
            <Mail className="w-3.5 h-3.5" /> 받은 초대가 있어요 · {received.length}건
          </p>
          {received.map((invite) => (
            <div
              key={invite.id}
              className="rounded-2xl px-4 py-3 flex items-center gap-3"
              style={{ background: "#FDF2F8", border: "1px solid #FBCFE8" }}
            >
              <div className="flex-1 min-w-0">
                {/* 유치원 이름이 초대에 함께 오므로 따로 조회하지 않습니다. */}
                <p className="text-sm font-bold truncate" style={{ color: "#1F0A3C" }}>
                  {invite.kindergartenName || `유치원 #${invite.kindergartenId}`}
                </p>
                <p className="text-xs truncate" style={{ color: "#9CA3AF" }}>
                  {invite.inviterId ? `${invite.inviterId}님이 ` : ""}
                  {withJosa(typeLabel(invite), "으로/로")} 초대했어요
                </p>
              </div>
              <RoundButton onClick={() => respond(invite.id, "reject")} disabled={busyId === invite.id} label="거절">
                <X className="w-4 h-4" style={{ color: "#9CA3AF" }} />
              </RoundButton>
              <RoundButton onClick={() => respond(invite.id, "accept")} disabled={busyId === invite.id} label="수락" filled>
                <Check className="w-4 h-4" />
              </RoundButton>
            </div>
          ))}
        </>
      )}

      {requested.length > 0 && (
        <>
          <p className="text-xs font-bold flex items-center gap-1.5" style={{ color: "#A06080" }}>
            <Clock className="w-3.5 h-3.5" /> 수락을 기다리는 가입 신청 · {requested.length}건
          </p>
          {requested.map((invite) => (
            <div
              key={invite.id}
              className="rounded-2xl px-4 py-3 flex items-center gap-3"
              style={{ background: "#FAFAFA", border: "1px solid #F3F4F6" }}
            >
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold truncate" style={{ color: "#1F0A3C" }}>
                  {invite.kindergartenName || `유치원 #${invite.kindergartenId}`}
                </p>
                <p className="text-xs truncate" style={{ color: "#9CA3AF" }}>
                  {/*
                    보호자가 아이를 대신해 낸 신청은 티켓의 주인이 아이입니다. "내가 아이로
                    신청했어요"라고 쓰면 누구 이야기인지 알 수 없어서 아이 이름을 밝힙니다.
                  */}
                  {invite.userId !== user?.id
                    ? `${withJosa(invite.userName || invite.userId, "을/를")} ${withJosa(typeLabel(invite), "으로/로")} 가입 신청했어요.`
                    : `${withJosa(typeLabel(invite), "으로/로")} 가입을 신청했어요.`}{" "}
                  원장님의 수락을 기다리고 있어요.
                </p>
              </div>
              <RoundButton onClick={() => respond(invite.id, "cancel")} disabled={busyId === invite.id} label="가입 신청 취소">
                <X className="w-4 h-4" style={{ color: "#9CA3AF" }} />
              </RoundButton>
            </div>
          ))}
        </>
      )}
    </div>
  );
}
