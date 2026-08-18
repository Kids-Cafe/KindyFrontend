import { useEffect, useMemo, useState } from "react";
import { ShieldCheck, Plus, Trash2, Search, Mail, X } from "lucide-react";
import { useDashboardStore } from "@/app/dashboard/DashboardStoreContext";
import { useAuth } from "@/app/auth/AuthContext";
import { searchUsersByLoginId } from "@/app/auth/mockSignup";
import type { UserSearchResult } from "@/app/auth/mockSignup";
import { apiGet, apiPost } from "@/app/lib/api";
import { PERMISSION_LABELS } from "@/app/dashboard/types";
import type { PermissionKey } from "@/app/dashboard/types";
import { useConfirm } from "@/app/components/ConfirmDialog";

const ALL_PERMISSIONS = Object.keys(PERMISSION_LABELS) as PermissionKey[];
const ROLE_COLORS = ["#E879A0", "#60A5FA", "#86EFAC", "#F9D56E", "#C084FC"];

/** 백엔드 InviteDTO입니다. 표시용 이름/아이디/반 정보가 없어(백엔드 개선 필요), 검색 결과에서 알아낸 값만 보충합니다. */
interface InviteDTO {
  id: number;
  kindergartenId: number;
  userId: string;
  status: "PENDING" | "ACCEPTED" | "REJECTED" | "CANCELED";
  createdAt: number;
}

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

function formatDate(ms: number): string {
  const d = new Date(ms);
  return `${d.getFullYear()}.${(d.getMonth() + 1).toString().padStart(2, "0")}.${d.getDate().toString().padStart(2, "0")}`;
}

/**
 * 원장 전용 멤버 관리 화면입니다. 디스코드의 "역할(role)" 시스템과 동일하게
 * 권한 묶음(역할)을 만들고, 유치원 소속 교사 계정에 배정합니다.
 * 교사 초대는 아이디로 검색해 실제로 가입된 계정을 특정한 뒤 초대 메시지를 보내는
 * 방식이며, 상대가 수락해야 비로소 정식 멤버(교사 계정 목록)에 합류합니다.
 */
export function MemberManageFeature() {
  const { user } = useAuth();
  const { data, createRole, updateRolePermissions, deleteRole, assignTeacherRole, removeTeacherMembership } = useDashboardStore();
  const { ask, dialog } = useConfirm();
  const [newRoleName, setNewRoleName] = useState("");

  const [query, setQuery] = useState("");
  const [results, setResults] = useState<UserSearchResult[]>([]);
  const [searched, setSearched] = useState(false);
  const [invitingId, setInvitingId] = useState<string | null>(null);
  // 백엔드 초대에는 classId가 없어(백엔드 개선 필요) 화면에만 남겨둔 선택값입니다.
  const [inviteClassId, setInviteClassId] = useState<number | "">(data.classes[0]?.id ?? "");
  const [sentInvites, setSentInvites] = useState<InviteDTO[]>([]);
  // 초대 대상의 이름/아이디는 InviteDTO에 없어, 이번 세션에서 검색해 알아낸 결과로만 채웁니다.
  const [nameById, setNameById] = useState<Record<string, { name: string; loginId: string }>>({});

  function refreshInvites() {
    apiGet<InviteDTO[]>("/api/kindergarten/invite/list", { kindergartenId: data.kindergarten.id })
      .then(setSentInvites)
      .catch(() => {});
  }

  useEffect(() => {
    refreshInvites();
  }, [data.kindergarten.id]);

  const pendingTargetIds = useMemo(
    () => new Set(sentInvites.filter((i) => STATUS_MAP[i.status] === "pending").map((i) => i.userId)),
    [sentInvites],
  );
  const memberIds = useMemo(() => new Set(data.teachers.map((t) => t.id)), [data.teachers]);

  function togglePermission(roleId: number, key: PermissionKey, current: PermissionKey[]) {
    const next = current.includes(key) ? current.filter((p) => p !== key) : [...current, key];
    updateRolePermissions(roleId, next);
  }

  function handleSearch() {
    const all = searchUsersByLoginId(query);
    const filtered = all.filter((r) => r.accountType === "adult" && r.id !== user?.id);
    setResults(filtered);
    setNameById((prev) => ({
      ...prev,
      ...Object.fromEntries(filtered.map((r) => [r.id, { name: r.name, loginId: r.loginId }])),
    }));
    setSearched(true);
  }

  function openInviteForm(resultId: string) {
    setInvitingId(resultId);
    setInviteClassId(data.classes[0]?.id ?? "");
  }

  async function handleSendInvite(result: UserSearchResult) {
    if (!user) return;
    // 초대 시점에 반을 지정하는 필드가 백엔드 InviteDTO에 없어(백엔드 개선 필요),
    // 여기서 고른 반은 화면 안내용일 뿐 서버로 전달되지 않습니다.
    await apiPost("/api/kindergarten/invite", { id: data.kindergarten.id, userId: result.id, type: "TEACHER" }).catch(() => {});
    setInvitingId(null);
    refreshInvites();
  }

  function handleCancelInvite(inviteId: number) {
    apiPost("/api/kindergarten/invite/cancel", { id: inviteId })
      .catch(() => {})
      .finally(refreshInvites);
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
              <p className="text-xs" style={{ color: "#A06080" }}>일치하는 계정이 없어요. 아이디를 다시 확인해주세요.</p>
            )}
            {results.map((r) => {
              const isMember = memberIds.has(r.id);
              const isPending = pendingTargetIds.has(r.id);
              return (
                <div key={r.id} className="rounded-xl px-3.5 py-3" style={{ background: "#FAFAFA", border: "1px solid #F3F4F6" }}>
                  <div className="flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-sm font-bold truncate" style={{ color: "#3B1355" }}>{r.name} <span className="font-normal" style={{ color: "#A06080" }}>· {r.loginId}</span></p>
                      <p className="text-xs" style={{ color: "#A06080" }}>
                        {r.kindergartenName ? `${r.kindergartenName} 소속` : "소속 유치원 없음"}
                      </p>
                    </div>
                    {isMember ? (
                      <span className="text-[11px] font-bold px-2.5 py-1 rounded-full shrink-0" style={{ background: STATUS_COLOR.accepted.bg, color: STATUS_COLOR.accepted.fg }}>
                        이미 우리 교사
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
                      <select
                        value={inviteClassId}
                        onChange={(e) => setInviteClassId(e.target.value ? Number(e.target.value) : "")}
                        className="flex-1 rounded-lg px-2.5 py-1.5 text-xs outline-none"
                        style={{ background: "var(--input-background)", border: "1px solid rgba(232,121,160,0.2)", color: "#6B3580" }}
                      >
                        <option value="">유치원 소속 (반 없음)</option>
                        {data.classes.map((c) => (
                          <option key={c.id} value={c.id}>{c.name} 담임으로</option>
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
                      <p className="text-[11px]" style={{ color: "#A06080" }}>{formatDate(invite.createdAt)}</p>
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
