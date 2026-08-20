import { useAuth } from "@/app/auth/AuthContext";
import { useDisplayName } from "@/app/auth/useDisplayName";
import { useDashboardStore } from "@/app/dashboard/DashboardStoreContext";
import { ThreadChatFeature } from "@/app/dashboard/features/ThreadChatFeature";
import { ChatCaptureGuard } from "@/app/dashboard/features/ChatCaptureGuard";
import { MessagesSquare } from "lucide-react";

/** 대화창 하나를 가리키는 좌표입니다. 아이가 아니라 **보호자**가 대화 상대입니다. */
export interface ChatTarget {
  childId: string;
  parentId: string;
}

/**
 * 선생님 시점: 학급 학부모 목록(스레드 인박스) + 선택된 스레드 대화창입니다.
 * 우측 멤버 목록에서 학생을 클릭해 "부모님과 채팅"으로 들어온 경우 target이 채워져 있습니다.
 *
 * 인박스는 **아이당 한 줄이 아니라 보호자당 한 줄**입니다. 아빠·엄마가 모두 연결된 아이는
 * 대화도 둘이고, 예전처럼 아이 기준으로 접으면 한쪽 대화가 화면에 아예 뜨지 않았습니다.
 */
export function TeacherChatFeature({ target, onSelectTarget }: { target: ChatTarget | null; onSelectTarget: (target: ChatTarget) => void }) {
  const { user } = useAuth();
  const viewerName = useDisplayName();
  const { data } = useDashboardStore();
  const children = data.myClassChildren ?? [];

  if (!user) return null;

  if (!target) {
    const rows = children.flatMap((child) => child.parents.map((parent) => ({ child, parent })));
    return (
      <div className="max-w-2xl">
        <div className="flex items-center gap-2 mb-4 text-xs font-bold" style={{ color: "#E879A0" }}>
          <MessagesSquare className="w-3.5 h-3.5" />
          대화할 학부모를 선택하세요
        </div>
        {rows.length === 0 && (
          <p className="text-sm" style={{ color: "#A06080" }}>
            아직 보호자 계정이 연결된 학생이 없어요.
          </p>
        )}
        <div className="space-y-2">
          {rows.map(({ child, parent }) => {
            const thread = (data.threadsByChild[child.id] ?? []).find((t) => t.parentId === parent.id);
            const last = thread?.messages[thread.messages.length - 1];
            return (
              <button
                key={`${child.id}:${parent.id}`}
                onClick={() => onSelectTarget({ childId: child.id, parentId: parent.id })}
                className="w-full flex items-center gap-3 rounded-2xl bg-card border p-3.5 text-left transition-all hover:shadow-md"
                style={{ borderColor: "rgba(232,121,160,0.15)" }}
              >
                <span className="w-10 h-10 rounded-xl flex items-center justify-center text-lg shrink-0" style={{ background: child.avatarColor }}>{child.avatarEmoji}</span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold" style={{ color: "#3B1355" }}>
                    {parent.name} <span className="font-normal text-xs" style={{ color: "#A06080" }}>· {child.nickname} 보호자</span>
                  </p>
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
      <ThreadChatFeature childId={target.childId} parentId={target.parentId} viewerRole="teacher" viewerName={viewerName} />
    </ChatCaptureGuard>
  );
}
