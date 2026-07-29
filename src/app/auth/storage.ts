import type { AuthSession, PendingAuthRequest } from "@/app/auth/types";

/**
 * 세션 영속화 계층입니다.
 *
 * - 로그인 세션: localStorage (새로고침/탭 재방문에도 유지)
 * - 진행 중인 인가 요청: sessionStorage (탭을 닫으면 사라져야 하는 일회성 값)
 *
 * 사파리 프라이빗 모드처럼 스토리지 접근이 막힌 환경에서도 앱이 죽지 않도록
 * 모든 접근을 try/catch로 감쌉니다.
 */

const SESSION_KEY = "kindy.auth.session";
const PENDING_KEY = "kindy.auth.pending";

/** 진행 중인 인가 요청이 유효한 것으로 인정되는 시간(10분) */
const PENDING_TTL_MS = 10 * 60 * 1000;

export function loadSession(): AuthSession | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw) as AuthSession;
    if (!parsed?.user?.id || typeof parsed.expiresAt !== "number") return null;

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

export function savePendingRequest(pending: PendingAuthRequest): void {
  try {
    sessionStorage.setItem(PENDING_KEY, JSON.stringify(pending));
  } catch {
    /* noop */
  }
}

/** 진행 중인 요청을 꺼내면서 동시에 지웁니다(일회용). */
export function takePendingRequest(): PendingAuthRequest | null {
  try {
    const raw = sessionStorage.getItem(PENDING_KEY);
    sessionStorage.removeItem(PENDING_KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw) as PendingAuthRequest;
    if (!parsed?.state || !parsed?.provider) return null;
    if (Date.now() - parsed.createdAt > PENDING_TTL_MS) return null;

    return parsed;
  } catch {
    return null;
  }
}
