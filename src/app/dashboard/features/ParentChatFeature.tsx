import { useAuth } from "@/app/auth/AuthContext";
import { useDisplayName } from "@/app/auth/useDisplayName";
import { useDashboardStore } from "@/app/dashboard/DashboardStoreContext";
import { ThreadChatFeature } from "@/app/dashboard/features/ThreadChatFeature";

/** 부모 시점: 본인 아이의 담임 선생님과의 채팅 1개 스레드입니다. */
export function ParentChatFeature() {
  const { user } = useAuth();
  const displayName = useDisplayName();
  const { data } = useDashboardStore();
  if (!data.myChild || !user) return null;

  // 로그인한 본인이 곧 이 대화의 보호자 쪽입니다. 아이에게 보호자가 둘이어도 다른 보호자의
  // 대화는 남의 대화라 여기 섞이지 않습니다(서버 `chat/list`도 내 것만 돌려줍니다).
  return <ThreadChatFeature childId={data.myChild.id} parentId={user.id} viewerRole="parent" viewerName={displayName} />;
}
