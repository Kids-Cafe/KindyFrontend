import { useState } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/app/components/ui/tabs";
import { useDashboardStore } from "@/app/dashboard/DashboardStoreContext";
import { REPORT_CATEGORY_ORDER, REPORT_META } from "@/app/dashboard/reportMeta";
import { ReportByCategory } from "@/app/dashboard/reports";
import type { ChildRecord, ReportCategory } from "@/app/dashboard/types";

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
 * 5종 성장 리포트(식단/건강/교우관계/성격/학습)를 탭으로 보여줍니다.
 * 부모는 본인 아이 리포트만, 선생님은 학급 학생을 골라서 봅니다.
 */
export function ReportsFeature() {
  const { data } = useDashboardStore();
  const isTeacher = data.role === "teacher";
  const teacherChildren = data.myClassChildren ?? [];
  const [selectedChildId, setSelectedChildId] = useState<string>(
    isTeacher ? teacherChildren[0]?.id ?? "" : data.myChild?.id ?? "",
  );
  const [tab, setTab] = useState<ReportCategory>("food");

  const child = isTeacher ? teacherChildren.find((c) => c.id === selectedChildId) : data.myChild;
  const reports = child ? data.reportsByChild[child.id] : undefined;

  if (!child || !reports) return null;

  return (
    <div className="max-w-3xl">
      {isTeacher && <StudentPicker children={teacherChildren} selectedId={selectedChildId} onSelect={setSelectedChildId} />}

      <div className="flex items-center gap-3 mb-5">
        <span className="w-11 h-11 rounded-2xl flex items-center justify-center text-xl" style={{ background: child.avatarColor }}>{child.avatarEmoji}</span>
        <div>
          <p className="font-bold text-sm" style={{ color: "#3B1355" }}>{child.nickname} · {child.age}세</p>
          <p className="text-xs" style={{ color: "#A06080" }}>{child.className}</p>
        </div>
      </div>

      <Tabs value={tab} onValueChange={(v) => setTab(v as ReportCategory)}>
        <TabsList className="mb-4 flex-wrap h-auto">
          {REPORT_CATEGORY_ORDER.map((category) => (
            <TabsTrigger key={category} value={category} className="text-xs px-3">
              {REPORT_META[category].short}
            </TabsTrigger>
          ))}
        </TabsList>
        {REPORT_CATEGORY_ORDER.map((category) => (
          <TabsContent key={category} value={category}>
            <ReportByCategory category={category} reports={reports} />
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
