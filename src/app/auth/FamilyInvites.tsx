import { useCallback, useEffect, useState } from "react";
import { Users, Check, X, Clock } from "lucide-react";
import { useAuth } from "@/app/auth/AuthContext";
import { fetchFamilyInvites, respondToFamilyInvite } from "@/app/dashboard/userSync";
import type { FamilyInviteDTO } from "@/app/lib/dto";

/**
 * 대기 중인 **가족 연결** 요청입니다. `ReceivedInvites`(유치원 초대)와 나란히 놓입니다.
 *
 * 유치원 초대와 한 컴포넌트로 합치지 않은 이유는 두 흐름의 판정 기준이 다르기 때문입니다.
 * 유치원 쪽은 `direction`으로 갈리지만, 가족 쪽은 요청을 만드는 경우가 셋이라 방향 하나로는
 * 부족하고, 답할 수 있는지는 아이의 현재 보호자 목록을 봐야 정해집니다. 그래서 서버가
 * `canRespond`로 알려주고 화면은 그것만 봅니다.
 *
 * 세 갈래로 묶입니다: 내가 답할 차례 / 내 요청이 남의 답을 기다리는 중 / 나와 관련은 있지만
 * 내가 답할 건 아닌 것(예: 다른 보호자가 승인할 건).
 */
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

/** 요청을 받은 사람 입장에서 무슨 일이 벌어지려는지 한 줄로 설명합니다. */
function describe(invite: FamilyInviteDTO, viewerId: string): string {
  const parent = invite.parentName ?? invite.parent;
  const child = invite.childName ?? invite.child;
  const requester = invite.requesterName ?? invite.requesterId;

  if (invite.child === viewerId) return `${parent}님이 보호자로 등록하려고 해요`;
  if (invite.parent === viewerId) {
    return invite.requesterId === invite.child
      ? `${child}이(가) 나를 보호자로 등록해 달라고 했어요`
      : `${requester}님이 나를 ${child}의 보호자로 등록하려고 해요`;
  }
  return `${child}의 보호자로 ${parent}님을 추가하려고 해요`;
}

/** 내가 보낸 요청을 내 쪽에서 어떻게 부를지. */
function describeOwn(invite: FamilyInviteDTO, viewerId: string): string {
  const parent = invite.parentName ?? invite.parent;
  const child = invite.childName ?? invite.child;
  if (invite.parent === viewerId) return `${child}과(와)의 연결을 요청했어요`;
  if (invite.child === viewerId) return `${parent}님을 보호자로 요청했어요`;
  return `${child}의 보호자로 ${parent}님을 요청했어요`;
}

export function FamilyInvites({ onChanged }: { onChanged?: () => void }) {
  const { user } = useAuth();
  const [invites, setInvites] = useState<FamilyInviteDTO[]>([]);
  const [busyId, setBusyId] = useState<number | null>(null);

  const refresh = useCallback(() => {
    if (!user) return;
    fetchFamilyInvites()
      .then((list) => setInvites(list.filter((i) => i.status === "PENDING")))
      .catch(() => setInvites([]));
  }, [user]);

  useEffect(refresh, [refresh]);

  if (!user || invites.length === 0) return null;

  const viewerId = user.id;
  const toAnswer = invites.filter((i) => i.canRespond);
  const waiting = invites.filter((i) => !i.canRespond && i.requesterId === viewerId);
  const others = invites.filter((i) => !i.canRespond && i.requesterId !== viewerId);

  /** 서버가 처리를 받아들인 뒤에야 목록에서 지웁니다. 실패하면 요청이 그대로 남습니다. */
  async function respond(id: number, action: "accept" | "reject" | "cancel") {
    setBusyId(id);
    try {
      await respondToFamilyInvite(id, action);
      setInvites((prev) => prev.filter((i) => i.id !== id));
      if (action === "accept") onChanged?.();
    } catch (cause) {
      console.warn("[Kindy] 가족 연결 요청을 처리하지 못했어요.", cause);
      refresh();
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="space-y-2 mb-4">
      {toAnswer.length > 0 && (
        <>
          <p className="text-xs font-bold flex items-center gap-1.5" style={{ color: "#E879A0" }}>
            <Users className="w-3.5 h-3.5" /> 가족 연결 요청이 왔어요 · {toAnswer.length}건
          </p>
          {toAnswer.map((invite) => (
            <div
              key={invite.id}
              className="rounded-2xl px-4 py-3 flex items-center gap-3"
              style={{ background: "#FDF2F8", border: "1px solid #FBCFE8" }}
            >
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold truncate" style={{ color: "#1F0A3C" }}>
                  {describe(invite, viewerId)}
                </p>
                <p className="text-xs truncate" style={{ color: "#9CA3AF" }}>
                  수락하면 아이의 일기 · 알림장 · 성장 리포트를 함께 볼 수 있게 돼요.
                </p>
              </div>
              <RoundButton onClick={() => void respond(invite.id, "reject")} disabled={busyId === invite.id} label="거절">
                <X className="w-4 h-4" style={{ color: "#9CA3AF" }} />
              </RoundButton>
              <RoundButton onClick={() => void respond(invite.id, "accept")} disabled={busyId === invite.id} label="수락" filled>
                <Check className="w-4 h-4" />
              </RoundButton>
            </div>
          ))}
        </>
      )}

      {waiting.length > 0 && (
        <>
          <p className="text-xs font-bold flex items-center gap-1.5" style={{ color: "#A06080" }}>
            <Clock className="w-3.5 h-3.5" /> 수락을 기다리는 연결 요청 · {waiting.length}건
          </p>
          {waiting.map((invite) => (
            <div
              key={invite.id}
              className="rounded-2xl px-4 py-3 flex items-center gap-3"
              style={{ background: "#FAFAFA", border: "1px solid #F3F4F6" }}
            >
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold truncate" style={{ color: "#1F0A3C" }}>
                  {describeOwn(invite, viewerId)}
                </p>
                <p className="text-xs truncate" style={{ color: "#9CA3AF" }}>
                  상대방의 수락을 기다리고 있어요.
                </p>
              </div>
              <RoundButton onClick={() => void respond(invite.id, "cancel")} disabled={busyId === invite.id} label="요청 취소">
                <X className="w-4 h-4" style={{ color: "#9CA3AF" }} />
              </RoundButton>
            </div>
          ))}
        </>
      )}

      {others.length > 0 && (
        <>
          {/* 답할 사람이 따로 있는 건입니다. 버튼 없이 무슨 일이 도는지만 알려줍니다. */}
          {others.map((invite) => (
            <div
              key={invite.id}
              className="rounded-2xl px-4 py-3"
              style={{ background: "#FAFAFA", border: "1px solid #F3F4F6" }}
            >
              <p className="text-sm font-bold truncate" style={{ color: "#1F0A3C" }}>
                {describe(invite, viewerId)}
              </p>
              <p className="text-xs truncate" style={{ color: "#9CA3AF" }}>
                다른 보호자의 수락을 기다리고 있어요.
              </p>
            </div>
          ))}
        </>
      )}
    </div>
  );
}
