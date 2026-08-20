import { useState } from "react";
import { ChevronRight, Plus, X } from "lucide-react";
import { useDashboardStore } from "@/app/dashboard/DashboardStoreContext";
import { featuresFor } from "@/app/dashboard/featureDefs";
import { NoticesFeature } from "@/app/dashboard/features/NoticesFeature";
import { parentNames } from "@/app/dashboard/parents";
import type { DashboardRole, FeatureId } from "@/app/dashboard/types";

/**
 * 선생님/학부모/원장 계정의 메인 화면(홈)입니다. 공지사항과 함께, 각 계정이
 * 자주 쓰는 기능을 스스로 골라 붙여 둘 수 있는 위젯 영역을 보여줍니다.
 */
export function DashboardHomeFeature({
  role,
  onOpenStudent,
  onNavigate,
}: {
  role: DashboardRole;
  onOpenStudent: (childId: string) => void;
  onNavigate: (id: FeatureId) => void;
}) {
  const { data, addHomeWidget, removeHomeWidget } = useDashboardStore();
  const [pickerOpen, setPickerOpen] = useState(false);
  const children = data.myClassChildren ?? [];

  // 위젯으로 붙일 수 있는 기능은 사이드바에 실제로 뜨는 것과 같아야 합니다 — 권한으로
  // 열린 반/멤버 관리도 여기서 바로 꺼내 쓸 수 있습니다.
  const catalogue = featuresFor(data).filter((f) => f.id !== "home");
  const widgetIds = data.homeWidgets;
  const addedWidgets = catalogue.filter((f) => widgetIds.includes(f.id));
  const availableToAdd = catalogue.filter((f) => !widgetIds.includes(f.id));

  return (
    <div className="max-w-3xl space-y-8">
      <NoticesFeature />

      {role === "teacher" && (
        <div>
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
                  <p className="text-xs truncate" style={{ color: "#A06080" }}>
                    {[child.age ? `${child.age}세` : null, parentNames(child, "")].filter(Boolean).join(" · ") || child.className}
                  </p>
                </div>
                <ChevronRight className="w-4 h-4 shrink-0" style={{ color: "#D1D5DB" }} />
              </button>
            ))}
          </div>
        </div>
      )}

      <div>
        <div className="flex items-center justify-between mb-4">
          <p className="text-xs font-bold" style={{ color: "#A06080" }}>내 위젯</p>
          <button
            onClick={() => setPickerOpen((v) => !v)}
            className="flex items-center gap-1 text-xs font-bold px-3 py-1.5 rounded-full transition-colors"
            style={{ background: "rgba(232,121,160,0.1)", color: "#E879A0" }}
          >
            <Plus className="w-3.5 h-3.5" /> 위젯 추가
          </button>
        </div>

        {pickerOpen && (
          <div className="mb-4 p-4 rounded-2xl" style={{ background: "#F9FAFB", border: "1px solid #F3F4F6" }}>
            {availableToAdd.length === 0 ? (
              <p className="text-xs" style={{ color: "#9CA3AF" }}>추가할 수 있는 위젯이 없어요.</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {availableToAdd.map((f) => (
                  <button
                    key={f.id}
                    onClick={() => {
                      addHomeWidget(f.id);
                      setPickerOpen(false);
                    }}
                    className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold transition-colors hover:bg-white"
                    style={{ background: "white", border: "1px solid #F3F4F6", color: "#3B1355" }}
                  >
                    <f.icon className="w-3.5 h-3.5" style={{ color: "#E879A0" }} />
                    {f.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {addedWidgets.length === 0 ? (
          <p className="text-xs" style={{ color: "#9CA3AF" }}>위젯을 추가하면 여기에 바로가기 카드가 나타나요.</p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {addedWidgets.map((f) => (
              <div
                key={f.id}
                className="group relative rounded-2xl bg-card border p-4 text-left transition-all hover:shadow-md"
                style={{ borderColor: "rgba(232,121,160,0.15)" }}
              >
                <button
                  onClick={() => removeHomeWidget(f.id)}
                  aria-label={`${f.label} 위젯 제거`}
                  className="absolute top-2 right-2 w-6 h-6 rounded-full flex items-center justify-center opacity-0 transition-opacity group-hover:opacity-100"
                  style={{ background: "rgba(0,0,0,0.06)" }}
                >
                  <X className="w-3.5 h-3.5" style={{ color: "#6B7280" }} />
                </button>
                <button onClick={() => onNavigate(f.id)} className="w-full text-left">
                  <span className="w-10 h-10 rounded-xl flex items-center justify-center mb-3" style={{ background: "rgba(232,121,160,0.1)" }}>
                    <f.icon className="w-4.5 h-4.5" style={{ color: "#E879A0" }} />
                  </span>
                  <p className="text-sm font-bold" style={{ color: "#3B1355" }}>{f.label}</p>
                  <p className="text-xs mt-0.5" style={{ color: "#A06080" }}>{f.hint}</p>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
