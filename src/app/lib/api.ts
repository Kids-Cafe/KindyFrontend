/**
 * Kindy 백엔드(org.kidscafe.kindy) 공통 fetch 클라이언트입니다.
 * 모든 엔드포인트가 `{status, code, data}` 봉투(ResultDTO)로 응답하고, POST 본문은
 * JSON이 아니라 x-www-form-urlencoded이며, 세션 쿠키(`credentials: 'include'`)로 인증합니다.
 */

export class ApiError extends Error {
  code: string;
  constructor(code: string) {
    super(code);
    this.code = code;
    this.name = "ApiError";
  }
}

type Params = Record<string, string | number | boolean | undefined>;

interface ResultEnvelope<T> {
  status: "success" | "error";
  code: string;
  data: T;
}

/**
 * 백엔드가 무활동 세션을 버리는 시간입니다.
 * (UserController.login → `session.setMaxInactiveInterval(3600)`)
 * 이 값을 넘겨 아무 요청도 없었다면 서버 세션은 이미 끊겼다고 보고 확인에 들어갑니다.
 */
export const SERVER_SESSION_IDLE_MS = 3600 * 1000;

/**
 * 서버 세션이 끊긴 것을 처음 알아챈 순간 호출되는 구독자들입니다.
 * 화면 곳곳에서 `INVALID_ACCESS`를 각자 처리하는 대신, 인증 상태를 쥔 곳
 * (AuthProvider) 한 곳만 듣고 로그아웃 + 안내를 담당합니다.
 */
type SessionExpiredListener = () => void;
const sessionExpiredListeners = new Set<SessionExpiredListener>();

export function onSessionExpired(listener: SessionExpiredListener): () => void {
  sessionExpiredListeners.add(listener);
  return () => sessionExpiredListeners.delete(listener);
}

function notifySessionExpired(): void {
  for (const listener of sessionExpiredListeners) {
    try {
      listener();
    } catch (cause) {
      console.error("[Kindy] 세션 만료 처리 중 오류", cause);
    }
  }
}

/** 마지막으로 서버와 통신이 오간 시각(epoch ms). 무활동 시간을 재는 기준입니다. */
let lastActivityAt = Date.now();

export function getLastActivityAt(): number {
  return lastActivityAt;
}

/**
 * 서버 세션이 아직 살아있는지 확인합니다.
 *
 * `INVALID_ACCESS`는 "로그인이 풀렸다"와 "권한이 없다" 두 경우에 모두 쓰이므로
 * 코드만 보고 로그아웃시키면 남의 유치원을 열어본 사용자까지 튕겨 나갑니다.
 * 그래서 세션 여부만 따로 알려주는 `user/session`으로 한 번 더 확인합니다.
 * (이 엔드포인트는 비로그인도 success + `NOT_SIGNED_IN`으로 답합니다.)
 *
 * 네트워크가 흔들려 확인에 실패했을 때는 "살아있다"로 답합니다 —
 * 잠깐 끊긴 것 때문에 작업 중인 사용자를 로그아웃시키지 않기 위해서입니다.
 */
export async function checkSessionAlive(): Promise<boolean> {
  try {
    const res = await fetch("/api/user/session", { method: "GET", credentials: "include" });
    const body = (await res.json()) as ResultEnvelope<unknown>;
    lastActivityAt = Date.now();
    return body.code === "SIGNED_IN";
  } catch {
    return true;
  }
}

/** 확인 요청이 여러 개 겹치지 않도록 진행 중인 것을 재사용합니다. */
let pendingSessionCheck: Promise<boolean> | null = null;

/**
 * 응답이 `INVALID_ACCESS`일 때 세션 만료인지 확인하고, 맞으면 구독자에게 알립니다.
 * 호출자는 기다리지 않습니다 — 원래의 ApiError는 그대로 즉시 던져야 하니까요.
 */
function reportPossibleSessionExpiry(): void {
  if (!pendingSessionCheck) {
    pendingSessionCheck = checkSessionAlive().finally(() => {
      pendingSessionCheck = null;
    });
  }
  void pendingSessionCheck.then((alive) => {
    if (!alive) notifySessionExpired();
  });
}

function toSearchParams(params?: Params): URLSearchParams {
  const p = new URLSearchParams();
  if (params) {
    for (const [key, value] of Object.entries(params)) {
      if (value === undefined) continue;
      p.set(key, String(value));
    }
  }
  return p;
}

async function unwrap<T>(res: Response): Promise<T> {
  const body = (await res.json()) as ResultEnvelope<T>;
  lastActivityAt = Date.now();
  if (body.status !== "success") {
    if (body.code === "INVALID_ACCESS") reportPossibleSessionExpiry();
    throw new ApiError(body.code);
  }
  return body.data;
}

export async function apiGet<T>(path: string, params?: Params): Promise<T> {
  const qs = toSearchParams(params).toString();
  const res = await fetch(qs ? `${path}?${qs}` : path, {
    method: "GET",
    credentials: "include",
  });
  return unwrap<T>(res);
}

export async function apiPost<T = void>(path: string, params?: Params): Promise<T> {
  const res = await fetch(path, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    credentials: "include",
    body: toSearchParams(params),
  });
  return unwrap<T>(res);
}

export async function apiUpload<T = void>(path: string, params: Params, file: File, fileField = "file"): Promise<T> {
  const form = new FormData();
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined) continue;
    form.set(key, String(value));
  }
  form.set(fileField, file);
  const res = await fetch(path, {
    method: "POST",
    credentials: "include",
    body: form,
  });
  return unwrap<T>(res);
}
