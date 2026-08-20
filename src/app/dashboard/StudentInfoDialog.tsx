import { MessagesSquare } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/app/components/ui/dialog";
import { useDashboardStore } from "@/app/dashboard/DashboardStoreContext";
import { ChildFullReport } from "@/app/dashboard/features/ChildFullReport";
import type { ChatTarget } from "@/app/dashboard/features/TeacherChatFeature";

/**
 * 우측 멤버 목록에서 학생을 클릭했을 때 뜨는 정보창입니다(선생님 전용).
 * 탭으로 나뉘어 있던 리포트를 `ChildFullReport`로 합쳐서, 목록 선택 없이 전체가
 * 한 번에 스크랩되어 보이도록 합니다. 하단에 해당 학생 부모님과 바로 채팅을 시작할 수 있는 버튼을 둡니다.
 */
export function StudentInfoDialog({
  childId,
  onClose,
  onStartChat,
}: {
  childId: string | null;
  onClose: () => void;
  onStartChat: (target: ChatTarget) => void;
}) {
  const { data } = useDashboardStore();
  const child = data.classChildren.find((c) => c.id === childId);

  return (
    <Dialog open={Boolean(childId)} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto rounded-3xl">
        {child && (
          <>
            <DialogHeader>
              <DialogTitle className="sr-only">{child.nickname} 정보</DialogTitle>
            </DialogHeader>

            <ChildFullReport child={child} viewerRole="teacher" />

            {/* 보호자가 여럿이면 버튼도 여럿입니다 — 누구와의 대화인지 눌러서 정합니다. */}
            {child.parents.length === 0 ? (
              <p className="text-sm text-center py-3" style={{ color: "#A06080" }}>
                아직 연결된 보호자가 없어 채팅을 시작할 수 없어요.
              </p>
            ) : (
              <div className="space-y-2">
                {child.parents.map((parent) => (
                  <button
                    key={parent.id}
                    onClick={() => onStartChat({ childId: child.id, parentId: parent.id })}
                    className="w-full flex items-center justify-center gap-2 rounded-2xl font-bold text-sm py-3 text-white transition-all active:scale-[0.98]"
                    style={{ background: "linear-gradient(135deg,#E879A0,#F472B6)" }}
                  >
                    <MessagesSquare className="w-4 h-4" />
                    {parent.name}님과 채팅하기
                  </button>
                ))}
              </div>
            )}
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
