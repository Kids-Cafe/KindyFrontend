import type { AuthUser } from "@/app/auth/types";

/**
 * 화면에 표시할 사용자 이름입니다.
 * 온보딩에서 별칭을 정했으면 별칭을, 아니면 실명을 보여줍니다.
 */
export function getDisplayName(user: AuthUser): string {
  return user.nickname?.trim() || user.name;
}
