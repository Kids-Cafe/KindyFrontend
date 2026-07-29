import { useAuth } from "@/app/auth/AuthContext";
import { getDisplayName } from "@/app/auth/getDisplayName";
import { useDashboardStore } from "@/app/dashboard/DashboardStoreContext";
import { ThreadChatFeature } from "@/app/dashboard/features/ThreadChatFeature";

/** 부모 시점: 본인 아이의 담임 선생님과의 채팅 1개 스레드입니다. */
export function ParentChatFeature() {
  const { user } = useAuth();
  const { data } = useDashboardStore();
  if (!data.myChild || !user) return null;

  return <ThreadChatFeature childId={data.myChild.id} viewerRole="parent" viewerName={getDisplayName(user)} />;
}
