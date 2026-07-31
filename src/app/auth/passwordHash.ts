/**
 * mock 계정 저장소용 비밀번호 해싱입니다.
 *
 * ⚠️ 이건 백엔드 인증을 대신하지 못합니다. 브라우저에서 도는 이상 반복 횟수도,
 * 솔트도, 검증 결과도 전부 사용자가 조작할 수 있습니다. 실제 인증은 서버가
 * 담당해야 하고, 이 파일의 존재 이유는 하나입니다:
 * **평문 비밀번호를 localStorage에 남기지 않는 것.**
 * 사람들은 비밀번호를 재사용하기 때문에, 데모 계정이라도 평문으로 굴러다니면
 * 그 자체가 유출입니다.
 *
 * 백엔드가 붙으면 이 파일과 mockSignup.ts는 통째로 지우세요.
 */

/** PBKDF2 반복 횟수. 서버 권장치보다 낮습니다 — 브라우저에서 UI를 막지 않을 만큼만 씁니다. */
const ITERATIONS = 100_000;
const SALT_BYTES = 16;
const KEY_BITS = 256;
const PREFIX = "pbkdf2-sha256";

export class CryptoUnavailableError extends Error {
  constructor() {
    super("이 브라우저에서는 보안 연결(HTTPS 또는 localhost)에서만 비밀번호를 처리할 수 있어요.");
    this.name = "CryptoUnavailableError";
  }
}

/**
 * WebCrypto의 subtle API는 보안 컨텍스트(HTTPS/localhost)에서만 노출됩니다.
 * http://192.168.x.x 같은 주소로 열면 없으므로, 조용히 평문으로 되돌아가는 대신
 * 명시적으로 실패시킵니다.
 */
function requireSubtle(): SubtleCrypto {
  const subtle = globalThis.crypto?.subtle;
  if (!subtle) throw new CryptoUnavailableError();
  return subtle;
}

function toBase64(bytes: Uint8Array): string {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary);
}

function fromBase64(value: string): Uint8Array {
  const binary = atob(value);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

async function derive(password: string, salt: Uint8Array, iterations: number): Promise<string> {
  const subtle = requireSubtle();
  const material = await subtle.importKey("raw", new TextEncoder().encode(password), "PBKDF2", false, [
    "deriveBits",
  ]);
  const bits = await subtle.deriveBits(
    { name: "PBKDF2", hash: "SHA-256", salt: salt as BufferSource, iterations },
    material,
    KEY_BITS,
  );
  return toBase64(new Uint8Array(bits));
}

/**
 * `pbkdf2-sha256$<반복횟수>$<솔트>$<해시>` 형태의 한 줄 문자열을 만듭니다.
 * 파라미터를 문자열 안에 같이 넣어야 나중에 반복 횟수를 올려도 기존 계정을 검증할 수 있습니다.
 */
export async function hashPassword(password: string): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(SALT_BYTES));
  const hash = await derive(password, salt, ITERATIONS);
  return `${PREFIX}$${ITERATIONS}$${toBase64(salt)}$${hash}`;
}

/** 길이와 내용이 모두 같은지를 입력에 따라 조기 종료 없이 비교합니다. */
function timingSafeEqual(a: string, b: string): boolean {
  // 길이 자체는 어차피 해시 길이로 고정이라 숨길 필요가 없습니다.
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i += 1) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const parts = stored.split("$");
  if (parts.length !== 4 || parts[0] !== PREFIX) return false;

  const iterations = Number.parseInt(parts[1], 10);
  if (!Number.isFinite(iterations) || iterations <= 0) return false;

  try {
    const candidate = await derive(password, fromBase64(parts[2]), iterations);
    return timingSafeEqual(candidate, parts[3]);
  } catch (cause) {
    if (cause instanceof CryptoUnavailableError) throw cause;
    return false; // 손상된 솔트/해시 문자열
  }
}

/** 저장된 해시가 지금 쓰는 파라미터보다 약하면 true — 로그인 성공 시 다시 해싱할 신호입니다. */
export function needsRehash(stored: string): boolean {
  const parts = stored.split("$");
  if (parts.length !== 4 || parts[0] !== PREFIX) return true;
  return Number.parseInt(parts[1], 10) < ITERATIONS;
}
