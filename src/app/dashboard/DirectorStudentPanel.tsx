import { useState } from "react";
import { Info, MessagesSquare } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/app/components/ui/sheet";
import { useAuth } from "@/app/auth/AuthContext";
import { useDisplayName } from "@/app/auth/useDisplayName";
import { useDashboardStore } from "@/app/dashboard/DashboardStoreContext";
import { ClassAssignSelect } from "@/app/dashboard/ClassAssignSelect";
import { parentNames } from "@/app/dashboard/parents";
import { ChildFullReport } from "@/app/dashboard/features/ChildFullReport";
import { ThreadChatFeature } from "@/app/dashboard/features/ThreadChatFeature";

/**
 * 명단을 관리하는 사람(원장, 또는 멤버·반 관리 권한을 받은 선생님)이 우측 멤버 목록에서
 * 학생을 클릭했을 때 뜨는 프로필 패널입니다.
 * 클릭하면 바로 채팅으로 들어가는 대신 아이 정보(리포트 · 연동된 부모님)를 먼저 보여주고,
 * 필요할 때만 "부모님께 연락하기" 버튼으로 전환해 해당 학생의 담임-학부모 대화창에
 * 원장 자격으로 메시지를 보낼 수 있게 합니다.
 */
export function DirectorStudentPanel({ childId, onClose }: { childId: string | null; onClose: () => void }) {
  const { user } = useAuth();
  const displayName = useDisplayName();
  const { data } = useDashboardStore();
  const child = data.classChildren.find((c) => c.id === childId);
  const [view, setView] = useState<"info" | "contact">("info");
  // 보호자가 둘 이상일 수 있어 어느 쪽과 이야기할지 고릅니다. 고르지 않았으면 첫 보호자입니다.
  const [contactParentId, setContactParentId] = useState<string | null>(null);
  const parents = child?.parents ?? [];
  const activeParent = parents.find((p) => p.id === contactParentId) ?? parents[0];

  return (
    <Sheet
      open={Boolean(childId)}
      onOpenChange={(open) => {
        if (!open) {
          onClose();
          setView("info");
          setContactParentId(null);
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
                      {child.className} · {parentNames(child)}
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
                {/* 보호자가 둘 이상이면 어느 쪽과의 대화인지 먼저 고릅니다. */}
                {parents.length > 1 && (
                  <div className="flex items-center gap-1.5 flex-wrap pb-3">
                    {parents.map((parent) => {
                      const selected = parent.id === activeParent?.id;
                      return (
                        <button
                          key={parent.id}
                          onClick={() => setContactParentId(parent.id)}
                          aria-pressed={selected}
                          className="text-xs font-bold px-2.5 py-1.5 rounded-full transition-all"
                          style={selected
                            ? { background: "rgba(232,121,160,0.14)", color: "#C0568A" }
                            : { background: "#F9FAFB", color: "#9CA3AF", border: "1px solid #F3F4F6" }}
                        >
                          {parent.name}
                        </button>
                      );
                    })}
                  </div>
                )}
                {user && (
                  <ThreadChatFeature
                    childId={child.id}
                    parentId={activeParent?.id ?? ""}
                    viewerRole={data.role === "director" ? "director" : "teacher"}
                    viewerName={displayName}
                  />
                )}
              </div>
            )}
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
