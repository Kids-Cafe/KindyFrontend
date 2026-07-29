import { useState } from "react";
import { MessagesSquare, BookOpen } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/app/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/app/components/ui/tabs";
import { useDashboardStore } from "@/app/dashboard/DashboardStoreContext";
import { REPORT_CATEGORY_ORDER, REPORT_META } from "@/app/dashboard/reportMeta";
import { ReportByCategory } from "@/app/dashboard/reports";
import type { ReportCategory } from "@/app/dashboard/types";

/**
 * 우측 멤버 목록에서 학생을 클릭했을 때 뜨는 정보창입니다(선생님 전용).
 * 기능별(건강/식단/성격/학습/교우관계) 리포트를 탭으로 보여주고,
 * 하단에 해당 학생 부모님과 바로 채팅을 시작할 수 있는 버튼을 둡니다.
 */
export function StudentInfoDialog({
  childId,
  onClose,
  onStartChat,
}: {
  childId: string | null;
  onClose: () => void;
  onStartChat: (childId: string) => void;
}) {
  const { data } = useDashboardStore();
  const [tab, setTab] = useState<ReportCategory>("food");

  const child = data.classChildren.find((c) => c.id === childId);
  const reports = child ? data.reportsByChild[child.id] : undefined;
  const diary = child ? data.diaryByChild[child.id] : undefined;

  return (
    <Dialog open={Boolean(childId)} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto rounded-3xl">
        {child && reports && (
          <>
            <DialogHeader>
              <div className="flex items-center gap-3">
                <span className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shrink-0" style={{ background: child.avatarColor }}>{child.avatarEmoji}</span>
                <div className="min-w-0">
                  <DialogTitle className="text-base">{child.nickname}</DialogTitle>
                  <p className="text-xs" style={{ color: "#A06080" }}>{child.age}세 · {child.className} · {child.parentName}</p>
                </div>
              </div>
            </DialogHeader>

            {diary && diary.length > 0 && (
              <div className="rounded-2xl p-3.5" style={{ background: "linear-gradient(135deg,#FCE7F3,#EDE9FE)" }}>
                <div className="flex items-center gap-1.5 text-xs font-bold mb-1.5" style={{ color: "#E879A0" }}>
                  <BookOpen className="w-3 h-3" /> 최근 일기
                </div>
                <p className="text-xs leading-relaxed line-clamp-2" style={{ color: "#6B3580" }}>{diary[diary.length - 1].summary}</p>
              </div>
            )}

            <Tabs value={tab} onValueChange={(v) => setTab(v as ReportCategory)}>
              <TabsList className="mb-1 flex-wrap h-auto">
                {REPORT_CATEGORY_ORDER.map((category) => (
                  <TabsTrigger key={category} value={category} className="text-xs px-2.5">{REPORT_META[category].short}</TabsTrigger>
                ))}
              </TabsList>
              {REPORT_CATEGORY_ORDER.map((category) => (
                <TabsContent key={category} value={category}>
                  <ReportByCategory category={category} reports={reports} />
                </TabsContent>
              ))}
            </Tabs>

            <button
              onClick={() => onStartChat(child.id)}
              className="w-full flex items-center justify-center gap-2 rounded-2xl font-bold text-sm py-3 text-white transition-all active:scale-[0.98]"
              style={{ background: "linear-gradient(135deg,#E879A0,#F472B6)" }}
            >
              <MessagesSquare className="w-4 h-4" />
              {child.parentName}과 채팅하기
            </button>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
