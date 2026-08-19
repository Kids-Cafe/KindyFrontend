import { useEffect, useMemo, useRef, useState } from "react";
import { ShieldCheck, Plus, Trash2, Search, Mail, X, Check, UserPlus } from "lucide-react";
import { useDashboardStore } from "@/app/dashboard/DashboardStoreContext";
import { useAuth } from "@/app/auth/AuthContext";
import {
  acceptInviteOnServer,
  cancelInviteOnServer,
  fetchSentInvites,
  rejectInviteOnServer,
  sendInviteOnServer,
} from "@/app/dashboard/backendSync";
import { searchUsers } from "@/app/dashboard/userSync";
import type { InviteDTO, PlainUserDTO } from "@/app/lib/dto";
import { PERMISSION_LABELS } from "@/app/dashboard/types";
import type { PermissionKey } from "@/app/dashboard/types";
import { useConfirm } from "@/app/components/ConfirmDialog";

const ALL_PERMISSIONS = Object.keys(PERMISSION_LABELS) as PermissionKey[];
const ROLE_COLORS = ["#E879A0", "#60A5FA", "#86EFAC", "#F9D56E", "#C084FC"];

type InviteStatus = "pending" | "accepted" | "rejected";
const STATUS_MAP: Record<InviteDTO["status"], InviteStatus> = {
  PENDING: "pending",
  ACCEPTED: "accepted",
  REJECTED: "rejected",
  CANCELED: "rejected",
};

const STATUS_LABEL: Record<InviteStatus, string> = { pending: "승인 대기", accepted: "가입 완료", rejected: "거절됨" };
const STATUS_COLOR: Record<InviteStatus, { bg: string; fg: string }> = {
  pending: { bg: "rgba(232,121,160,0.12)", fg: "#E879A0" },
  accepted: { bg: "rgba(134,239,172,0.25)", fg: "#16A34A" },
  rejected: { bg: "rgba(248,113,113,0.15)", fg: "#DC2626" },
};

/** 초대장이 만들려는 관계입니다. 서버 타입은 CHILD/TEACHER 둘뿐입니다. */
const TYPE_LABEL: Record<InviteDTO["type"], string> = { TEACHER: "선생님", CHILD: "아이 · 학부모" };

function formatDate(ms: number): string {
  const d = new Date(ms);
  return `${d.getFullYear()}.${(d.getMonth() + 1).toString().padStart(2, "0")}.${d.getDate().toString().padStart(2, "0")}`;
}

/**
 * 원장 전용 멤버 관리 화면입니다. 디스코드의 "역할(role)" 시스템과 동일하게
 * 권한 묶음(역할)을 만들고, 유치원 소속 교사 계정에 배정합니다.
 * 교사 초대는 아이디로 검색해 실제로 가입된 계정을 특정한 뒤 초대 메시지를 보내는
 * 방식이며, 상대가 수락해야 비로소 정식 멤버(교사 계정 목록)에 합류합니다.
 *
 * 초대장(`kindergarten/invite/list`)에는 두 방향이 섞여 옵니다 — 우리가 보낸 초대(INVITE)와
 * 누군가 우리 유치원에 넣은 가입 신청(JOIN)입니다. 이전에는 둘을 구분하지 않고 전부
 * "보낸 초대"로 묶어 취소 버튼만 달아 둬서, **가입 신청을 수락할 방법이 아예 없었습니다.**
 * 지금은 방향별로 나눠 신청에는 수락/거절을, 우리가 보낸 초대에는 취소를 붙입니다.
 */
export function MemberManageFeature() {
  const { user } = useAuth();
  const { data, createRole, updateRolePermissions, deleteRole, assignTeacherRole, removeTeacherMembership, refreshWorkspace } = useDashboardStore();
  const { ask, dialog } = useConfirm();
  const [newRoleName, setNewRoleName] = useState("");

  const [query, setQuery] = useState("");
  const [results, setResults] = useState<PlainUserDTO[]>([]);
  const [searched, setSearched] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [invitingId, setInvitingId] = useState<string | null>(null);
  // 초대에 붙일 역할입니다. 반 배정은 서버 초대에 담을 수 없어(RelationshipDTO.classId를
  // 세우는 엔드포인트가 없습니다) 수락 후 따로 지정해야 합니다.
  const [inviteRoleId, setInviteRoleId] = useState<number | "">("");
  // 유치원에 걸려 있는 대기 중인 초대장 전부입니다(우리가 보낸 것 + 받은 가입 신청).
  const [invites, setInvites] = useState<InviteDTO[]>([]);
  const [respondingId, setRespondingId] = useState<number | null>(null);
  // 초대 대상의 이름입니다. `invite/list`는 아이디만 내려주므로 `user/search`로 채웁니다.
  const [nameById, setNameById] = useState<Record<string, { name: string; loginId: string }>>({});
  // 한 번 찾아본 아이디는 (못 찾았더라도) 다시 조회하지 않습니다.
  const nameLookupTried = useRef<Set<string>>(new Set());

  function refreshInvites() {
    fetchSentInvites(data.kindergarten.id).then(setInvites).catch(() => {});
  }

  useEffect(() => {
    refreshInvites();
  }, [data.kindergarten.id]);

  // 우리가 보낸 초대와 받은 가입 신청은 처리하는 방법이 다릅니다.
  const sentInvites = useMemo(() => invites.filter((i) => i.direction === "INVITE"), [invites]);
  const joinRequests = useMemo(
    () => invites.filter((i) => i.direction === "JOIN" && STATUS_MAP[i.status] === "pending"),
    [invites],
  );

  /**
   * 초대장에 이름이 담기지 않아(아이디만 옵니다) 목록에 낯선 아이디가 그대로 보였습니다.
   * 모르는 아이디만 골라 `user/search`로 한 번씩 찾아 이름을 채웁니다.
   */
  useEffect(() => {
    const unknown = [
      ...new Set(
        invites
          .map((i) => i.userId)
          .filter((id) => id && id.trim().length >= 2 && !(id in nameById) && !nameLookupTried.current.has(id)),
      ),
    ];
    if (unknown.length === 0) return;
    unknown.forEach((id) => nameLookupTried.current.add(id));

    let cancelled = false;
    void Promise.all(
      unknown.map(async (id) => {
        // 부분 일치 검색이라 정확히 같은 아이디만 인정합니다.
        const found = await searchUsers(id).catch(() => []);
        const exact = found.find((u) => u.id === id);
        return exact ? ([id, { name: exact.name, loginId: exact.id }] as const) : null;
      }),
    ).then((pairs) => {
      const resolved = pairs.filter((p): p is [string, { name: string; loginId: string }] => p !== null);
      if (cancelled || resolved.length === 0) return;
      setNameById((prev) => ({ ...prev, ...Object.fromEntries(resolved) }));
    });

    return () => {
      cancelled = true;
    };
  }, [invites, nameById]);

  const pendingInviteIds = useMemo(
    () => new Set(sentInvites.filter((i) => STATUS_MAP[i.status] === "pending").map((i) => i.userId)),
    [sentInvites],
  );
  const requestedIds = useMemo(() => new Set(joinRequests.map((i) => i.userId)), [joinRequests]);
  const memberIds = useMemo(() => new Set(data.teachers.map((t) => t.id)), [data.teachers]);

  function togglePermission(roleId: number, key: PermissionKey, current: PermissionKey[]) {
    const next = current.includes(key) ? current.filter((p) => p !== key) : [...current, key];
    updateRolePermissions(roleId, next);
  }

  async function handleSearch() {
    // 서버가 아이디/이름 부분 일치로 찾아 줍니다. 두 글자 미만은 조회하지 않습니다.
    if (query.trim().length < 2) {
      setSearchError("두 글자 이상 입력해주세요.");
      setResults([]);
      setSearched(true);
      return;
    }
    setSearchError(null);
    try {
      const found = await searchUsers(query);
      const filtered = found.filter((r) => r.accountType !== "CHILD" && r.id !== user?.id);
      setResults(filtered);
      setNameById((prev) => ({
        ...prev,
        ...Object.fromEntries(filtered.map((r) => [r.id, { name: r.name, loginId: r.id }])),
      }));
    } catch {
      setResults([]);
      setSearchError("계정을 찾지 못했어요. 잠시 후 다시 시도해주세요.");
    }
    setSearched(true);
  }

  function openInviteForm(resultId: string) {
    setInvitingId(resultId);
    setInviteRoleId("");
  }

  async function handleSendInvite(result: PlainUserDTO) {
    if (!user) return;
    try {
      await sendInviteOnServer(data.kindergarten.id, result.id, "TEACHER", inviteRoleId === "" ? undefined : inviteRoleId);
    } catch (cause) {
      console.warn("[Kindy] 초대를 보내지 못했어요.", cause);
    }
    setInvitingId(null);
    refreshInvites();
  }

  function handleCancelInvite(inviteId: number) {
    cancelInviteOnServer(inviteId)
      .catch(() => {})
      .finally(refreshInvites);
  }

  /**
   * 가입 신청에 답합니다. 서버는 MANAGE_MEMBER 권한이 있는 사람의 응답만 받아들이고,
   * 수락하면 그 자리에서 유치원 관계를 만듭니다 — 그래서 멤버 목록을 다시 받아야 합니다.
   */
  async function handleRespondJoin(inviteId: number, accept: boolean) {
    setRespondingId(inviteId);
    try {
      await (accept ? acceptInviteOnServer(inviteId) : rejectInviteOnServer(inviteId));
      if (accept) refreshWorkspace();
    } catch (cause) {
      console.warn("[Kindy] 가입 신청을 처리하지 못했어요.", cause);
    } finally {
      setRespondingId(null);
      refreshInvites();
    }
  }

  return (
    <div className="max-w-2xl space-y-8">
      <div>
        <div className="flex items-center gap-2 text-xs font-bold mb-4" style={{ color: "#E879A0" }}>
          <ShieldCheck className="w-3.5 h-3.5" />
          권한 역할
        </div>
        <div className="flex items-center gap-2 mb-4">
          <input
            value={newRoleName}
            onChange={(e) => setNewRoleName(e.target.value)}
            placeholder="새 역할 이름 (예: 부담임)"
            className="flex-1 rounded-xl px-3.5 py-2.5 text-sm outline-none"
            style={{ background: "var(--input-background)", border: "1px solid rgba(232,121,160,0.2)", color: "#3B1355" }}
          />
          <button
            onClick={() => { if (!newRoleName.trim()) return; createRole(newRoleName.trim(), ROLE_COLORS[data.roles.length % ROLE_COLORS.length]); setNewRoleName(""); }}
            className="flex items-center gap-1 text-xs font-bold px-3.5 py-2.5 rounded-xl text-white shrink-0"
            style={{ background: "linear-gradient(135deg,#E879A0,#F472B6)" }}
          >
            <Plus className="w-3.5 h-3.5" /> 역할 추가
          </button>
        </div>

        <div className="space-y-3">
          {data.roles.map((role) => (
            <div key={role.id} className="rounded-2xl bg-card border p-4" style={{ borderColor: "rgba(232,121,160,0.15)" }}>
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-bold px-2.5 py-1 rounded-full" style={{ background: `${role.color}22`, color: role.color }}>
                  {role.name}
                </span>
                <button
                  onClick={() =>
                    ask({
                      title: `'${role.name}' 역할을 삭제할까요?`,
                      description: "이 역할이 배정된 교사들의 권한도 함께 사라져요. 되돌릴 수 없어요.",
                      onConfirm: () => deleteRole(role.id),
                    })
                  }
                  aria-label={`${role.name} 역할 삭제`}
                  className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors hover:bg-black/[0.04]"
                >
                  <Trash2 className="w-3.5 h-3.5" style={{ color: "#F87171" }} />
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {ALL_PERMISSIONS.map((perm) => {
                  const active = role.permissions.includes(perm);
                  return (
                    <button
                      key={perm}
                      onClick={() => togglePermission(role.id, perm, role.permissions)}
                      className="text-xs font-bold px-2.5 py-1.5 rounded-full transition-all"
                      style={active ? { background: `${role.color}22`, color: role.color, border: `1px solid ${role.color}55` } : { background: "#F9FAFB", color: "#9CA3AF", border: "1px solid #F3F4F6" }}
                    >
                      {PERMISSION_LABELS[perm]}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div>
        <p className="text-xs font-bold mb-4 flex items-center gap-1.5" style={{ color: "#E879A0" }}>
          <Search className="w-3.5 h-3.5" /> 아이디로 선생님 찾아 초대하기
        </p>
        <div className="rounded-2xl bg-card border p-4 mb-4" style={{ borderColor: "rgba(232,121,160,0.2)" }}>
          <div className="flex gap-2 mb-3">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              placeholder="아이디를 입력하세요"
              className="flex-1 rounded-xl px-3.5 py-2.5 text-sm outline-none"
              style={{ background: "var(--input-background)", border: "1px solid rgba(232,121,160,0.2)", color: "#3B1355" }}
            />
            <button
              onClick={handleSearch}
              className="flex items-center gap-1 text-xs font-bold px-3.5 py-2.5 rounded-xl text-white shrink-0"
              style={{ background: "linear-gradient(135deg,#E879A0,#F472B6)" }}
            >
              검색
            </button>
          </div>

          <div className="space-y-2">
            {searched && results.length === 0 && (
              <p className="text-xs" style={{ color: "#A06080" }}>
                {searchError ?? "일치하는 계정이 없어요. 아이디를 다시 확인해주세요."}
              </p>
            )}
            {results.map((r) => {
              const isMember = memberIds.has(r.id);
              const isPending = pendingInviteIds.has(r.id);
              // 이미 우리 유치원에 가입을 신청해 둔 사람이라면, 초대를 새로 보내는 대신
              // 아래 "받은 가입 신청"에서 수락하면 됩니다.
              const hasRequested = requestedIds.has(r.id);
              return (
                <div key={r.id} className="rounded-xl px-3.5 py-3" style={{ background: "#FAFAFA", border: "1px solid #F3F4F6" }}>
                  <div className="flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-sm font-bold truncate" style={{ color: "#3B1355" }}>{r.name} <span className="font-normal" style={{ color: "#A06080" }}>· {r.id}</span></p>
                      {/* 검색 결과에는 소속 유치원이 담기지 않습니다(공개 필드만 내려옵니다). */}
                      <p className="text-xs" style={{ color: "#A06080" }}>{r.email ?? ""}</p>
                    </div>
                    {isMember ? (
                      <span className="text-[11px] font-bold px-2.5 py-1 rounded-full shrink-0" style={{ background: STATUS_COLOR.accepted.bg, color: STATUS_COLOR.accepted.fg }}>
                        이미 우리 교사
                      </span>
                    ) : hasRequested ? (
                      <span className="text-[11px] font-bold px-2.5 py-1 rounded-full shrink-0" style={{ background: STATUS_COLOR.pending.bg, color: STATUS_COLOR.pending.fg }}>
                        가입 신청 대기중
                      </span>
                    ) : isPending ? (
                      <span className="text-[11px] font-bold px-2.5 py-1 rounded-full shrink-0" style={{ background: STATUS_COLOR.pending.bg, color: STATUS_COLOR.pending.fg }}>
                        초대 대기중
                      </span>
                    ) : (
                      <button
                        onClick={() => openInviteForm(r.id)}
                        className="flex items-center gap-1 text-[11px] font-bold px-2.5 py-1.5 rounded-full text-white shrink-0"
                        style={{ background: "linear-gradient(135deg,#E879A0,#F472B6)" }}
                      >
                        <Mail className="w-3 h-3" /> 초대
                      </button>
                    )}
                  </div>

                  {invitingId === r.id && (
                    <div className="flex items-center gap-2 mt-2.5 pt-2.5" style={{ borderTop: "1px solid #F3F4F6" }}>
                      {/* 서버 초대에 담을 수 있는 건 역할까지입니다. 반 배정은 수락 후 따로 해야 합니다. */}
                      <select
                        value={inviteRoleId}
                        onChange={(e) => setInviteRoleId(e.target.value ? Number(e.target.value) : "")}
                        className="flex-1 rounded-lg px-2.5 py-1.5 text-xs outline-none"
                        style={{ background: "var(--input-background)", border: "1px solid rgba(232,121,160,0.2)", color: "#6B3580" }}
                      >
                        <option value="">역할 없이 초대</option>
                        {data.roles.map((r) => (
                          <option key={r.id} value={r.id}>{r.name} 역할로</option>
                        ))}
                      </select>
                      <button onClick={() => setInvitingId(null)} className="text-xs font-bold px-2 py-1.5" style={{ color: "#A06080" }}>취소</button>
                      <button
                        onClick={() => handleSendInvite(r)}
                        className="text-xs font-bold px-3 py-1.5 rounded-full text-white"
                        style={{ background: "linear-gradient(135deg,#E879A0,#F472B6)" }}
                      >
                        초대 보내기
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {joinRequests.length > 0 && (
          <div className="mb-4">
            <p className="text-xs font-bold mb-2.5 flex items-center gap-1.5" style={{ color: "#E879A0" }}>
              <UserPlus className="w-3.5 h-3.5" /> 받은 가입 신청 · {joinRequests.length}건
            </p>
            <div className="space-y-2">
              {joinRequests.map((invite) => {
                const known = nameById[invite.userId];
                const busy = respondingId === invite.id;
                return (
                  <div
                    key={invite.id}
                    className="flex items-center justify-between gap-2 rounded-xl px-3.5 py-2.5"
                    style={{ background: "#FDF2F8", border: "1px solid #FBCFE8" }}
                  >
                    <div className="min-w-0">
                      <p className="text-xs font-bold truncate" style={{ color: "#3B1355" }}>
                        {known?.name ?? invite.userId} {known && <span className="font-normal" style={{ color: "#A06080" }}>· {known.loginId}</span>}
                      </p>
                      <p className="text-[11px]" style={{ color: "#A06080" }}>
                        {TYPE_LABEL[invite.type]}(으)로 신청 · {formatDate(invite.createdAt)}
                      </p>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        onClick={() => handleRespondJoin(invite.id, false)}
                        disabled={busy}
                        className="text-[11px] font-bold px-2.5 py-1.5 rounded-full disabled:opacity-50"
                        style={{ background: "#F3F4F6", color: "#A06080" }}
                      >
                        거절
                      </button>
                      <button
                        onClick={() => handleRespondJoin(invite.id, true)}
                        disabled={busy}
                        className="flex items-center gap-1 text-[11px] font-bold px-2.5 py-1.5 rounded-full text-white disabled:opacity-50"
                        style={{ background: "linear-gradient(135deg,#E879A0,#F472B6)" }}
                      >
                        <Check className="w-3 h-3" /> 수락
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {sentInvites.length > 0 && (
          <div className="mb-4">
            <p className="text-xs font-bold mb-2.5" style={{ color: "#6B3580" }}>보낸 초대 · {sentInvites.length}건</p>
            <div className="space-y-2">
              {sentInvites.map((invite) => {
                const status = STATUS_MAP[invite.status];
                const known = nameById[invite.userId];
                return (
                  <div key={invite.id} className="flex items-center justify-between gap-2 rounded-xl px-3.5 py-2.5" style={{ background: "#FAFAFA", border: "1px solid #F3F4F6" }}>
                    <div className="min-w-0">
                      <p className="text-xs font-bold truncate" style={{ color: "#3B1355" }}>
                        {known?.name ?? invite.userId} {known && <span className="font-normal" style={{ color: "#A06080" }}>· {known.loginId}</span>}
                      </p>
                      <p className="text-[11px]" style={{ color: "#A06080" }}>
                        {TYPE_LABEL[invite.type]}(으)로 초대 · {formatDate(invite.createdAt)}
                      </p>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <span className="text-[11px] font-bold px-2.5 py-1 rounded-full" style={{ background: STATUS_COLOR[status].bg, color: STATUS_COLOR[status].fg }}>
                        {STATUS_LABEL[status]}
                      </span>
                      {status === "pending" && (
                        <button onClick={() => handleCancelInvite(invite.id)} title="초대 취소" className="w-6 h-6 rounded-full flex items-center justify-center transition-colors hover:bg-black/[0.04]">
                          <X className="w-3.5 h-3.5" style={{ color: "#F87171" }} />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <p className="text-xs font-bold mb-4" style={{ color: "#E879A0" }}>교사 계정 · {data.teachers.length}명</p>
        <div className="space-y-3">
          {data.teachers.map((teacher) => (
            <div key={teacher.id} className="rounded-2xl bg-card border p-4" style={{ borderColor: "rgba(232,121,160,0.15)" }}>
              <div className="flex items-center justify-between mb-2.5">
                <div>
                  <p className="text-sm font-bold" style={{ color: "#3B1355" }}>{teacher.name}</p>
                  <p className="text-xs" style={{ color: "#A06080" }}>{teacher.className ? `${teacher.className} 담임` : "유치원 소속"}</p>
                </div>
                {teacher.id !== user?.id && (
                  <button
                    onClick={() =>
                      ask({
                        title: `${teacher.name} 선생님을 내보낼까요?`,
                        description: "유치원 소속과 배정된 역할이 모두 해제돼요. 다시 초대하려면 초대장을 새로 보내야 해요.",
                        confirmLabel: "내보내기",
                        onConfirm: () => removeTeacherMembership(teacher.id),
                      })
                    }
                    title="멤버에서 내보내기"
                    aria-label={`${teacher.name} 선생님 내보내기`}
                    className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors hover:bg-black/[0.04]"
                  >
                    <Trash2 className="w-3.5 h-3.5" style={{ color: "#F87171" }} />
                  </button>
                )}
              </div>
              <div className="flex flex-wrap gap-1.5">
                {data.roles.map((role) => {
                  const assigned = teacher.roleIds.includes(role.id);
                  return (
                    <button
                      key={role.id}
                      onClick={() => assignTeacherRole(teacher.id, role.id, !assigned)}
                      className="text-xs font-bold px-2.5 py-1 rounded-full transition-all"
                      style={assigned ? { background: role.color, color: "white" } : { background: "#F9FAFB", color: "#9CA3AF", border: "1px solid #F3F4F6" }}
                    >
                      {role.name}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
      {dialog}
    </div>
  );
}
