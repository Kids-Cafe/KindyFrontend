import { useCallback, useSyncExternalStore } from "react";

/**
 * 미디어 쿼리 하나를 구독합니다.
 *
 * `resize` 리스너가 아니라 `matchMedia`의 change 이벤트를 쓰므로 스크롤바나
 * 주소창 높이 변화 같은 잡음에 반응하지 않습니다. `useSyncExternalStore`라
 * **첫 렌더부터 정확한 값**이 나와, 좁은 화면에서 잠깐 데스크톱 레이아웃이
 * 번쩍였다가 바뀌는 일이 없습니다.
 */
export function useMediaQuery(query: string): boolean {
  const subscribe = useCallback(
    (onStoreChange: () => void) => {
      const mql = window.matchMedia(query);
      mql.addEventListener("change", onStoreChange);
      return () => mql.removeEventListener("change", onStoreChange);
    },
    [query],
  );

  return useSyncExternalStore(
    subscribe,
    () => window.matchMedia(query).matches,
    // 서버/테스트 환경 폴백입니다. 넓은 화면(데스크톱) 레이아웃을 기본으로 둡니다.
    () => true,
  );
}
