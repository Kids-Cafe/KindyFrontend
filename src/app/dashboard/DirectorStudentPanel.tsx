import { useState } from "react";
import { Info, MessagesSquare } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/app/components/ui/sheet";
import { useAuth } from "@/app/auth/AuthContext";
import { getDisplayName } from "@/app/auth/getDisplayName";
import { useDashboardStore } from "@/app/dashboard/DashboardStoreContext";
import { ClassAssignSelect } from "@/app/dashboard/ClassAssignSelect";
import { ChildFullReport } from "@/app/dashboard/features/ChildFullReport";
import { ThreadChatFeature } from "@/app/dashboard/features/ThreadChatFeature";

/**
 * 원장 화면의 우측 멤버 목록에서 학생을 클릭했을 때 뜨는 프로필 패널입니다.
 * 클릭하면 바로 채팅으로 들어가는 대신 아이 정보(리포트 · 연동된 부모님)를 먼저 보여주고,
 * 필요할 때만 "부모님께 연락하기" 버튼으로 전환해 해당 학생의 담임-학부모 대화창에
 * 원장 자격으로 메시지를 보낼 수 있게 합니다.
 */
export function DirectorStudentPanel({ childId, onClose }: { childId: string | null; onClose: () => void }) {
  const { user } = useAuth();
  const { data } = useDashboardStore();
  const child = data.classChildren.find((c) => c.id === childId);
  const [view, setView] = useState<"info" | "contact">("info");

  return (
    <Sheet
      open={Boolean(childId)}
      onOpenChange={(open) => {
        if (!open) {
          onClose();
          setView("info");
        }
      }}
    >
      <SheetContent className="flex flex-col w-full sm:max-w-2xl p-0">
        {child && (
          <>
            <SheetHeader className="border-b" style={{ borderColor: "rgba(232,121,160,0.15)" }}>
              <SheetTitle className="sr-only">{child.nickname} 정보</SheetTitle>
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <span className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shrink-0" style={{ background: child.avatarColor }}>{child.avatarEmoji}</span>
                  <div className="min-w-0">
                    {/* 나이는 아이 계정 프로필에만 있어 서버 멤버 목록에는 없을 수 있습니다. */}
                    <p className="font-bold text-base truncate" style={{ color: "#3B1355" }}>
                      {child.nickname}{child.age ? ` · ${child.age}세` : ""}
                    </p>
                    <p className="text-xs truncate" style={{ color: "#A06080" }}>
                      {child.className}{child.parentName ? ` · ${child.parentName}` : ""}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0 rounded-full p-1" style={{ background: "#F9FAFB" }}>
                  <button
                    onClick={() => setView("info")}
                    className="flex items-center gap-1 text-xs font-bold px-2.5 py-1.5 rounded-full transition-all"
                    style={view === "info" ? { background: "white", color: "#E879A0", boxShadow: "0 1px 2px rgba(0,0,0,0.06)" } : { color: "#9CA3AF" }}
                  >
                    <Info className="w-3.5 h-3.5" /> 정보
                  </button>
                  <button
                    onClick={() => setView("contact")}
                    className="flex items-center gap-1 text-xs font-bold px-2.5 py-1.5 rounded-full transition-all"
                    style={view === "contact" ? { background: "white", color: "#E879A0", boxShadow: "0 1px 2px rgba(0,0,0,0.06)" } : { color: "#9CA3AF" }}
                  >
                    <MessagesSquare className="w-3.5 h-3.5" /> 부모님께 연락하기
                  </button>
                </div>
              </div>
            </SheetHeader>

            {view === "info" ? (
              <div className="flex-1 min-h-0 overflow-y-auto px-4 pb-4">
                <div className="py-3">
                  <p className="text-xs font-bold mb-2" style={{ color: "#E879A0" }}>소속 반</p>
                  <ClassAssignSelect userId={child.id} classId={child.classId || undefined} />
                </div>
                <ChildFullReport child={child} viewerRole="teacher" />
              </div>
            ) : (
              <div className="flex-1 min-h-0 flex flex-col px-4 pb-4">
                {user && <ThreadChatFeature childId={child.id} viewerRole="director" viewerName={getDisplayName(user)} />}
              </div>
            )}
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
