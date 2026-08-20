import type { AccountType, AuthUser } from "@/app/auth/types";

/**
 * 계정이 아이 것인지 어른 것인지 묻는 곳이 여럿이라 한곳에 모았습니다.
 *
 * `accountType`은 `undefined`일 수 있습니다 — 서버 프로필이 도착하기 전이거나, 이 필드가
 * 생기기 전에 저장된 세션이 복원됐을 때입니다. 그때는 **어른으로 봅니다.** 서버 칼럼의
 * 기본값이 ADULT인 것과 같은 판단이고, 아이 계정에서 감추는 항목들이 어른에게 잘못
 * 사라지는 쪽보다 낫습니다.
 *
 * `types.ts`가 아니라 별 파일인 이유는 그쪽이 타입만 내보내는 모듈이기 때문입니다.
 */
type MaybeUser = Pick<AuthUser, "accountType"> | null | undefined;

export function isChildAccount(user: MaybeUser): boolean {
  return user?.accountType === "child";
}

export function isAdultAccount(user: MaybeUser): boolean {
  return !!user && !isChildAccount(user);
}

/** 화면 로직이 `AccountType`으로 분기할 때 씁니다. 모르면 어른입니다. */
export function accountTypeOf(user: MaybeUser): AccountType {
  return isChildAccount(user) ? "child" : "adult";
}
