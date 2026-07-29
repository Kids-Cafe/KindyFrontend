import { useDashboardStore } from "@/app/dashboard/DashboardStoreContext";
import { ChevronRight } from "lucide-react";

/** 선생님 시점: 학급 학생 전체를 카드 그리드로 보여줍니다. 클릭하면 학생 정보 창이 열립니다. */
export function TeacherStudentsFeature({ onOpenStudent }: { onOpenStudent: (childId: string) => void }) {
  const { data } = useDashboardStore();
  const children = data.myClassChildren ?? [];

  return (
    <div className="max-w-3xl">
      <p className="text-xs font-bold mb-4" style={{ color: "#A06080" }}>{data.teacher.className} · 학생 {children.length}명</p>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {children.map((child) => (
          <button
            key={child.id}
            onClick={() => onOpenStudent(child.id)}
            className="flex items-center gap-3 rounded-2xl bg-card border p-4 text-left transition-all hover:shadow-md hover:scale-[1.02]"
            style={{ borderColor: "rgba(232,121,160,0.15)" }}
          >
            <span className="w-11 h-11 rounded-2xl flex items-center justify-center text-xl shrink-0" style={{ background: child.avatarColor }}>{child.avatarEmoji}</span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-bold truncate" style={{ color: "#3B1355" }}>{child.nickname}</p>
              <p className="text-xs truncate" style={{ color: "#A06080" }}>{child.age}세 · {child.parentName}</p>
            </div>
            <ChevronRight className="w-4 h-4 shrink-0" style={{ color: "#D1D5DB" }} />
          </button>
        ))}
      </div>
    </div>
  );
}
