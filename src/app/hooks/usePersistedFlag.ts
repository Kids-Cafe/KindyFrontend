import { useCallback, useState } from "react";

/**
 * `localStorage`에 남는 참/거짓 값입니다. 사이드바를 접어 둔 선택이 새로고침
 * 뒤에도 그대로 유지되도록 쓰입니다.
 *
 * 첫 렌더에서 바로 저장된 값을 읽으므로(지연 초기화) 열린 상태로 한 번 그려졌다가
 * 접히는 깜빡임이 없습니다. 시크릿 모드처럼 저장이 막힌 환경에서는 조용히
 * 메모리 상태로만 동작합니다.
 */
export function usePersistedFlag(key: string, fallback: boolean) {
  const [value, setValue] = useState<boolean>(() => {
    try {
      const raw = window.localStorage.getItem(key);
      return raw === null ? fallback : raw === "true";
    } catch {
      return fallback;
    }
  });

  const update = useCallback(
    (next: boolean | ((prev: boolean) => boolean)) => {
      setValue((prev) => {
        const resolved = typeof next === "function" ? next(prev) : next;
        try {
          window.localStorage.setItem(key, String(resolved));
        } catch {
          // 저장이 막혀 있어도 이번 세션 동안은 정상 동작해야 합니다.
        }
        return resolved;
      });
    },
    [key],
  );

  return [value, update] as const;
}
