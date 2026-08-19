import { useAuth } from "@/app/auth/AuthContext";
import { useDashboardStoreOptional } from "@/app/dashboard/DashboardStoreContext";

/**
 * 지금 보고 있는 유치원에서 이 사람이 불리는 이름입니다.
 *
 * 별칭은 계정이 아니라 유치원마다 따로 붙습니다(T_RELATIONSHIP.NICKNAME). 그래서
 * 같은 사람이라도 유치원 A에서는 "하늘반 선생님", B에서는 실명일 수 있습니다.
 * 대시보드 밖(랜딩·마이페이지 진입 전 등)에서는 소속을 알 수 없으므로 실명으로 돌아갑니다.
 */
export function useDisplayName(): string {
  const { user } = useAuth();
  const store = useDashboardStoreOptional();
  if (!user) return "";
  return store?.data.myNickname?.trim() || user.name;
}
