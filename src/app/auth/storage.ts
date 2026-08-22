import type { AuthSession } from "@/app/auth/types";

/**
 * 세션 영속화 계층입니다.
 *
 * 로그인 세션을 localStorage에 담아 새로고침이나 탭 재방문에도 유지합니다.
 *
 * 진행 중인 소셜 로그인 요청(state·code_verifier)은 여기 없습니다 — 서버 세션이
 * 들고 있습니다. 브라우저가 보관하면 사용자가 직접 고칠 수 있는 값이 되기 때문입니다.
 *
 * 사파리 프라이빗 모드처럼 스토리지 접근이 막힌 환경에서도 앱이 죽지 않도록
 * 모든 접근을 try/catch로 감쌉니다.
 */

const SESSION_KEY = "kindy.auth.session";

/**
 * 로그인 세션 유효 기간(7일)입니다. 백엔드가 붙으면 이 값 대신 서버가 내려주는
 * 토큰 만료 시각을 써야 합니다. 지금은 클라이언트가 정하므로 보안 경계가 아닙니다.
 */
export const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000;

/**
 * localStorage에서 읽은 값이 세션의 형태를 갖췄는지 확인합니다.
 *
 * 저장된 JSON은 사용자가 직접 고칠 수도 있고, 예전 버전이 남긴 형식일 수도 있어
 * 신뢰할 수 없습니다. `as AuthSession`으로 단언해 버리면 아래 검사를 타입스크립트가
 * "항상 참"으로 보고 넘어가므로, unknown에서 시작해 실제로 좁혀 나갑니다.
 */
function isAuthSession(value: unknown): value is AuthSession {
  if (typeof value !== "object" || value === null) return false;

  const { user, expiresAt } = value as Record<string, unknown>;
  if (typeof expiresAt !== "number" || !Number.isFinite(expiresAt)) return false;
  if (typeof user !== "object" || user === null) return false;

  return typeof (user as Record<string, unknown>).id === "string";
}

export function loadSession(): AuthSession | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;

    const parsed: unknown = JSON.parse(raw);
    if (!isAuthSession(parsed)) return null;

    // 만료된 세션은 즉시 폐기합니다.
    if (parsed.expiresAt <= Date.now()) {
      clearSession();
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function saveSession(session: AuthSession): void {
  try {
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  } catch {
    // 스토리지를 못 쓰면 메모리 상태로만 유지됩니다.
  }
}

export function clearSession(): void {
  try {
    localStorage.removeItem(SESSION_KEY);
  } catch {
    /* noop */
  }
}
