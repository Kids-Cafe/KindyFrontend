import { ApiError, apiPost } from "@/app/lib/api";

/**
 * 비밀번호 확인과 변경입니다.
 *
 * 예전에는 전용 엔드포인트가 없어서 비밀번호 찾기 흐름(`searchPassword` → `newPassword`)을
 * 빌려 썼습니다. 지금은 `user/changePassword`가 생겨서 한 번의 요청으로 끝납니다 —
 * 서버가 세션의 사용자에 대해 현재 비밀번호를 직접 대조하므로, 확인을 위해 다시
 * 로그인할 필요도 없어졌습니다.
 */

/** 현재 비밀번호가 맞는지 확인합니다. */
export async function verifyCurrentPassword(loginId: string, password: string): Promise<boolean> {
  try {
    await apiPost("/api/user/login", { id: loginId, password });
    return true;
  } catch (cause) {
    if (cause instanceof ApiError) return false;
    throw cause;
  }
}

export interface ChangePasswordInput {
  currentPassword: string;
  newPassword: string;
}

export type ChangePasswordResult = "ok" | "wrong-password" | "not-found" | "failed";

export async function changePassword(input: ChangePasswordInput): Promise<ChangePasswordResult> {
  try {
    await apiPost("/api/user/changePassword", {
      currentPassword: input.currentPassword,
      newPassword: input.newPassword,
    });
    return "ok";
  } catch (cause) {
    if (cause instanceof ApiError) {
      if (cause.code === "SIGNIN_NO_MATCHES") return "wrong-password";
      if (cause.code === "INVALID_ACCESS") return "not-found";
      return "failed";
    }
    throw cause;
  }
}

/** 이메일 변경입니다. 이쪽은 현재 비밀번호를 함께 받는 전용 엔드포인트가 있습니다. */
export async function changeEmail(email: string, password: string): Promise<boolean> {
  try {
    await apiPost("/api/user/newEmail", { email, password });
    return true;
  } catch (cause) {
    if (cause instanceof ApiError) return false;
    throw cause;
  }
}
