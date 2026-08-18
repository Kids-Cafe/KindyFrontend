import { useState } from "react";
import { useDashboardStore } from "@/app/dashboard/DashboardStoreContext";
import { canManageKindergartenWide } from "@/app/dashboard/classAccess";

/**
 * 멤버(아이·교사)를 반에 배정하거나 해제하는 선택기입니다.
 *
 * 반 편성은 반 관리에 딸린 권한이라 서버가 MANAGE_CLASS로 검사합니다. 여기서도 같은
 * 기준으로 판단해, 권한이 없으면 선택기 대신 지금 반 이름만 보여줍니다
 * (화면을 감추는 건 편의일 뿐이고, 실제 차단은 서버가 합니다).
 */
export function ClassAssignSelect({ userId, classId }: { userId: string; classId: number | undefined }) {
  const { data, assignMemberClass } = useDashboardStore();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canAssign = canManageKindergartenWide(data, "manageClasses");
  const currentName = data.classes.find((c) => c.id === classId)?.name;

  if (!canAssign) {
    return (
      <p className="text-xs" style={{ color: "#A06080" }}>
        {currentName ? `${currentName} 소속` : "반 미배정"}
      </p>
    );
  }

  async function handleChange(value: string) {
    setSaving(true);
    setError(null);
    try {
      await assignMemberClass(userId, value ? Number(value) : undefined);
    } catch {
      setError("반을 바꾸지 못했어요. 권한을 확인해주세요.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <select
        value={classId ?? ""}
        disabled={saving}
        onChange={(e) => void handleChange(e.target.value)}
        aria-label="소속 반"
        className="w-full rounded-xl px-3 py-2 text-xs outline-none disabled:opacity-60"
        style={{ background: "var(--input-background)", border: "1px solid rgba(232,121,160,0.2)", color: "#6B3580" }}
      >
        <option value="">반 미배정</option>
        {data.classes.map((c) => (
          <option key={c.id} value={c.id}>{c.name}</option>
        ))}
      </select>
      {error && <p className="text-[11px] mt-1" style={{ color: "#DC2626" }}>{error}</p>}
    </div>
  );
}
