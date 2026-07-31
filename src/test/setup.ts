import "@testing-library/jest-dom/vitest";
import { webcrypto } from "node:crypto";

/**
 * jsdom에는 실제 WebCrypto가 붙어 있지 않은 판이 있습니다.
 * 비밀번호 해싱 테스트가 실제 PBKDF2를 돌려야 의미가 있으므로
 * Node의 webcrypto를 그대로 연결해 줍니다.
 */
if (!globalThis.crypto?.subtle) {
  Object.defineProperty(globalThis, "crypto", { value: webcrypto, configurable: true });
}

/** localStorage/sessionStorage의 최소 구현입니다. 테스트마다 새로 만들어 서로 간섭하지 않게 씁니다. */
function createMemoryStorage(): Storage {
  const entries = new Map<string, string>();

  return {
    get length() {
      return entries.size;
    },
    key(index: number) {
      return [...entries.keys()][index] ?? null;
    },
    getItem(key: string) {
      return entries.get(String(key)) ?? null;
    },
    setItem(key: string, value: string) {
      entries.set(String(key), String(value));
    },
    removeItem(key: string) {
      entries.delete(String(key));
    },
    clear() {
      entries.clear();
    },
  };
}

/**
 * Node 22+ 는 `localStorage`/`sessionStorage`를 전역 getter로 정의하는데,
 * `--localstorage-file` 없이 실행하면 undefined를 돌려줍니다. 이 getter가
 * jsdom이 만든 스토리지를 완전히 가려서(테스트에서 globalThis === window),
 * `window.localStorage`로도 접근할 수 없습니다.
 *
 * 목업 저장소 코드가 전역 `localStorage`를 그대로 쓰므로, 여기서 동작하는 구현으로
 * 덮어씁니다. `--localstorage-file`을 붙이면 파일이 남아 테스트 간 상태가 새어
 * 나가므로 인메모리 구현을 쓰는 편이 낫습니다.
 */
for (const key of ["localStorage", "sessionStorage"] as const) {
  if (!globalThis[key]) {
    Object.defineProperty(globalThis, key, {
      value: createMemoryStorage(),
      configurable: true,
      writable: true,
    });
  }
}
