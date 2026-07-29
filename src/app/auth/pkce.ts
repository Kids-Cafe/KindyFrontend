/**
 * PKCE(Proof Key for Code Exchange)와 CSRF 방지용 state 생성 유틸입니다.
 *
 * 브라우저에서만 도는 SPA는 client secret을 안전하게 보관할 수 없으므로,
 * PKCE를 지원하는 제공자(구글/카카오)에는 code_challenge를 함께 보냅니다.
 * Web Crypto API를 쓰기 때문에 보안 컨텍스트(https 또는 localhost)가 필요합니다.
 */

/** 지정한 바이트 수만큼의 난수를 URL-safe base64 문자열로 반환합니다. */
function randomUrlSafeString(byteLength: number): string {
  const bytes = new Uint8Array(byteLength);
  crypto.getRandomValues(bytes);
  return base64UrlEncode(bytes);
}

/** Uint8Array를 padding 없는 base64url 문자열로 변환합니다. */
function base64UrlEncode(bytes: Uint8Array): string {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

/** CSRF 방지를 위한 state 값을 만듭니다. */
export function createState(): string {
  return randomUrlSafeString(16);
}

/** PKCE code_verifier를 만듭니다. (RFC 7636 권장 길이 43~128자) */
export function createCodeVerifier(): string {
  return randomUrlSafeString(32);
}

/**
 * code_verifier로부터 S256 방식의 code_challenge를 계산합니다.
 * crypto.subtle을 쓸 수 없는 환경(비보안 컨텍스트)에서는 null을 반환하므로,
 * 호출부에서 PKCE 없이 진행할지 결정하면 됩니다.
 */
export async function createCodeChallenge(verifier: string): Promise<string | null> {
  if (!crypto?.subtle) return null;
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(verifier));
  return base64UrlEncode(new Uint8Array(digest));
}
