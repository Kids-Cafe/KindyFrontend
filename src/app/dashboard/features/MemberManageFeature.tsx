import { useState } from "react";
import { ShieldCheck, Plus, Trash2 } from "lucide-react";
import { useDashboardStore } from "@/app/dashboard/DashboardStoreContext";
import { PERMISSION_LABELS } from "@/app/dashboard/types";
import type { PermissionKey } from "@/app/dashboard/types";

const ALL_PERMISSIONS = Object.keys(PERMISSION_LABELS) as PermissionKey[];
const ROLE_COLORS = ["#E879A0", "#60A5FA", "#86EFAC", "#F9D56E", "#C084FC"];

/**
 * 원장 전용 멤버 관리 화면입니다. 디스코드의 "역할(role)" 시스템과 동일하게
 * 권한 묶음(역할)을 만들고, 유치원 소속 교사 계정에 배정합니다.
 */
export function MemberManageFeature() {
  const { data, createRole, updateRolePermissions, deleteRole, assignTeacherRole } = useDashboardStore();
  const [newRoleName, setNewRoleName] = useState("");

  function togglePermission(roleId: string, key: PermissionKey, current: PermissionKey[]) {
    const next = current.includes(key) ? current.filter((p) => p !== key) : [...current, key];
    updateRolePermissions(roleId, next);
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
                <button onClick={() => deleteRole(role.id)} className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors hover:bg-black/[0.04]">
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
        <p className="text-xs font-bold mb-4" style={{ color: "#E879A0" }}>교사 계정 · {data.teachers.length}명</p>
        <div className="space-y-3">
          {data.teachers.map((teacher) => (
            <div key={teacher.id} className="rounded-2xl bg-card border p-4" style={{ borderColor: "rgba(232,121,160,0.15)" }}>
              <div className="flex items-center justify-between mb-2.5">
                <div>
                  <p className="text-sm font-bold" style={{ color: "#3B1355" }}>{teacher.name}</p>
                  <p className="text-xs" style={{ color: "#A06080" }}>{teacher.className} 담임</p>
                </div>
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
    </div>
  );
}
