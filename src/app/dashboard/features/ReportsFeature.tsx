import { useState } from "react";
import { useDashboardStore } from "@/app/dashboard/DashboardStoreContext";
import { ChildFullReport } from "@/app/dashboard/features/ChildFullReport";
import type { ChildRecord } from "@/app/dashboard/types";

/** 학생 한 명을 고르는 칩 목록입니다. 선생님 시점에서만 보입니다. */
function StudentPicker({ children, selectedId, onSelect }: { children: ChildRecord[]; selectedId: string; onSelect: (id: string) => void }) {
  return (
    <div className="flex gap-2 flex-wrap mb-5">
      {children.map((child) => (
        <button
          key={child.id}
          onClick={() => onSelect(child.id)}
          className="flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-bold transition-all"
          style={selectedId === child.id
            ? { background: "linear-gradient(135deg,#E879A0,#F472B6)", color: "white" }
            : { background: "var(--muted)", color: "#6B3580" }}
        >
          <span className="w-5 h-5 rounded-full flex items-center justify-center text-xs" style={{ background: child.avatarColor }}>{child.avatarEmoji}</span>
          {child.nickname}
        </button>
      ))}
    </div>
  );
}

/**
 * 아이의 전체 리포트 화면입니다. 부모는 본인 아이 리포트를 바로 보고,
 * 선생님은 학급 학생을 골라서 봅니다. 실제 내용은 하나로 합쳐진 `ChildFullReport`가 그립니다.
 */
export function ReportsFeature() {
  const { data } = useDashboardStore();
  const isTeacher = data.role === "teacher";
  const teacherChildren = data.myClassChildren ?? [];
  const [selectedChildId, setSelectedChildId] = useState<string>(
    isTeacher ? teacherChildren[0]?.id ?? "" : data.myChild?.id ?? "",
  );

  const child = isTeacher ? teacherChildren.find((c) => c.id === selectedChildId) : data.myChild;
  if (!child) return null;

  return (
    <div>
      {isTeacher && <StudentPicker children={teacherChildren} selectedId={selectedChildId} onSelect={setSelectedChildId} />}
      <ChildFullReport child={child} viewerRole={isTeacher ? "teacher" : "parent"} />
    </div>
  );
}
