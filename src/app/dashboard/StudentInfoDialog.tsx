import { MessagesSquare } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/app/components/ui/dialog";
import { useDashboardStore } from "@/app/dashboard/DashboardStoreContext";
import { ChildFullReport } from "@/app/dashboard/features/ChildFullReport";

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
  onStartChat: (childId: string) => void;
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
