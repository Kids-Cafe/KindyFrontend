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
  if (body.status !== "success") throw new ApiError(body.code);
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
