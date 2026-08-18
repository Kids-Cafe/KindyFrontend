import { ApiError, apiPost } from "@/app/lib/api";

/**
 * 비밀번호 확인과 변경입니다.
 *
 * ⚠️ 백엔드에는 "로그인한 사람이 현재 비밀번호를 대고 새 비밀번호로 바꾸는" 엔드포인트가
 * 없습니다. 있는 건 비밀번호 찾기 흐름뿐입니다:
 *
 *   `searchPassword`(아이디+이름+이메일로 본인 확인) → 세션에 NEW_PASSWORD를 심음
 *   → `newPassword`(새 비밀번호 저장)
 *
 * 그래서 여기서는 현재 비밀번호를 `login`으로 직접 대조한 뒤 그 흐름을 이어 붙입니다.
 * 전용 엔드포인트(예: `user/changePassword`)가 생기면 이 파일은 그것 하나로 줄어듭니다.
 */

/** 현재 비밀번호가 맞는지 확인합니다. 성공하면 같은 계정으로 세션이 다시 만들어집니다. */
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
  loginId: string;
  name: string;
  email: string;
  currentPassword: string;
  newPassword: string;
}

export type ChangePasswordResult = "ok" | "wrong-password" | "not-found" | "failed";

export async function changePassword(input: ChangePasswordInput): Promise<ChangePasswordResult> {
  if (!(await verifyCurrentPassword(input.loginId, input.currentPassword))) return "wrong-password";

  try {
    // 본인 확인이 통과해야 서버가 세션에 "이 계정의 비밀번호를 바꿔도 좋다"는 표시를 남깁니다.
    await apiPost("/api/user/searchPassword", { id: input.loginId, name: input.name, email: input.email });
  } catch (cause) {
    if (cause instanceof ApiError) return cause.code === "USER_NOT_FOUND" ? "not-found" : "failed";
    throw cause;
  }

  try {
    await apiPost("/api/user/newPassword", { password: input.newPassword });
    return "ok";
  } catch (cause) {
    if (cause instanceof ApiError) return "failed";
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
