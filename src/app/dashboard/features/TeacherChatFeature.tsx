import { useAuth } from "@/app/auth/AuthContext";
import { useDisplayName } from "@/app/auth/useDisplayName";
import { useDashboardStore } from "@/app/dashboard/DashboardStoreContext";
import { ThreadChatFeature } from "@/app/dashboard/features/ThreadChatFeature";
import { ChatCaptureGuard } from "@/app/dashboard/features/ChatCaptureGuard";
import { MessagesSquare } from "lucide-react";

/**
 * 선생님 시점: 학급 학부모 목록(스레드 인박스) + 선택된 스레드 대화창입니다.
 * 우측 멤버 목록에서 학생을 클릭해 "부모님과 채팅"으로 들어온 경우 targetChildId가 채워져 있습니다.
 */
export function TeacherChatFeature({ targetChildId, onSelectChild }: { targetChildId: string | null; onSelectChild: (childId: string) => void }) {
  const { user } = useAuth();
  const viewerName = useDisplayName();
  const { data } = useDashboardStore();
  const children = data.myClassChildren ?? [];

  if (!user) return null;

  if (!targetChildId) {
    return (
      <div className="max-w-2xl">
        <div className="flex items-center gap-2 mb-4 text-xs font-bold" style={{ color: "#E879A0" }}>
          <MessagesSquare className="w-3.5 h-3.5" />
          대화할 학부모를 선택하세요
        </div>
        <div className="space-y-2">
          {children.map((child) => {
            const thread = data.threadsByChild[child.id];
            const last = thread?.messages[thread.messages.length - 1];
            return (
              <button
                key={child.id}
                onClick={() => onSelectChild(child.id)}
                className="w-full flex items-center gap-3 rounded-2xl bg-card border p-3.5 text-left transition-all hover:shadow-md"
                style={{ borderColor: "rgba(232,121,160,0.15)" }}
              >
                <span className="w-10 h-10 rounded-xl flex items-center justify-center text-lg shrink-0" style={{ background: child.avatarColor }}>{child.avatarEmoji}</span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold" style={{ color: "#3B1355" }}>{child.parentName}</p>
                  <p className="text-xs truncate" style={{ color: "#A06080" }}>
                    {last?.kind === "data-card" ? "정보 카드를 보냈어요" : last?.text ?? "아직 대화가 없어요"}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <ChatCaptureGuard viewerName={viewerName}>
      <ThreadChatFeature childId={targetChildId} viewerRole="teacher" viewerName={viewerName} />
    </ChatCaptureGuard>
  );
}
