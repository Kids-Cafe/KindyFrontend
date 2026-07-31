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

export function savePendingRequest(pending: PendingAuthRequest): void {
  try {
    sessionStorage.setItem(PENDING_KEY, JSON.stringify(pending));
  } catch {
    /* noop */
  }
}

function isPendingAuthRequest(value: unknown): value is PendingAuthRequest {
  if (typeof value !== "object" || value === null) return false;

  const { state, provider, createdAt } = value as Record<string, unknown>;
  if (typeof state !== "string" || state.length === 0) return false;
  if (typeof provider !== "string" || provider.length === 0) return false;

  // createdAt이 없거나 숫자가 아니면 아래 TTL 비교가 NaN이 되어 "만료되지 않음"으로
  // 통과해 버립니다. 여기서 먼저 막아야 오래된/변조된 요청이 살아남지 않습니다.
  return typeof createdAt === "number" && Number.isFinite(createdAt);
}

/** 진행 중인 요청을 꺼내면서 동시에 지웁니다(일회용). */
export function takePendingRequest(): PendingAuthRequest | null {
  try {
    const raw = sessionStorage.getItem(PENDING_KEY);
    sessionStorage.removeItem(PENDING_KEY);
    if (!raw) return null;

    const parsed: unknown = JSON.parse(raw);
    if (!isPendingAuthRequest(parsed)) return null;
    if (Date.now() - parsed.createdAt > PENDING_TTL_MS) return null;

    return parsed;
  } catch {
    return null;
  }
}
