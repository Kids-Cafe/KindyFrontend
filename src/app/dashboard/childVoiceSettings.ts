import { useCallback, useSyncExternalStore } from "react";

/**
 * 아이 계정의 음성 환경설정입니다. 백엔드에 저장할 곳이 없어 계정별로 localStorage에 둡니다.
 *
 * 이 값을 읽는 화면이 둘 이상 동시에 떠 있을 수 있어(마이페이지의 알림설정, 채팅 화면의
 * 스피커 버튼) 훅마다 상태를 따로 들면 서로의 변경을 보지 못합니다. 한쪽에서 끄고 다른
 * 쪽에서 저장하면 방금 끈 것이 되살아납니다. 그래서 값은 **모듈 수준에 하나**만 두고
 * 구독자에게 알립니다 — `api.ts`의 `onSessionExpired`와 같은 모양입니다.
 */
export interface ChildVoiceSettings {
  /** 일정 안내를 캐릭터 목소리로 읽어 줍니다. */
  enabled: boolean;
  /**
   * AI 파트너의 답장을 소리로 읽어 줍니다.
   *
   * 일정 안내와 따로 둡니다. 하나로 묶으면 "알림만 조용히 하고 싶다"는 선택이 채팅까지
   * 말없게 만들고, 그 반대도 마찬가지입니다.
   */
  readReplies: boolean;
  /** 0~1 */
  volume: number;
}

const DEFAULT_SETTINGS: ChildVoiceSettings = { enabled: true, readReplies: true, volume: 0.8 };

function keyFor(userId: string): string {
  return `kindy.childVoice.${userId}`;
}

/**
 * 사용자별 현재 값입니다.
 *
 * `useSyncExternalStore`는 값이 바뀌지 않았으면 **같은 참조**를 돌려받기를 요구합니다.
 * 호출할 때마다 새 객체를 만들면 리액트가 매번 변경으로 보고 무한히 다시 그립니다.
 */
const cache = new Map<string, ChildVoiceSettings>();
const listeners = new Set<() => void>();

function readFromStorage(userId: string): ChildVoiceSettings {
  try {
    const raw = localStorage.getItem(keyFor(userId));
    if (raw) return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
  } catch {
    // localStorage를 쓸 수 없는 환경이면 기본값을 그대로 씁니다.
  }
  return DEFAULT_SETTINGS;
}

function snapshot(userId: string): ChildVoiceSettings {
  let current = cache.get(userId);
  if (!current) {
    current = readFromStorage(userId);
    cache.set(userId, current);
  }
  return current;
}

function notify(): void {
  for (const listener of listeners) listener();
}

export function loadChildVoiceSettings(userId: string): ChildVoiceSettings {
  return snapshot(userId);
}

export function saveChildVoiceSettings(userId: string, settings: ChildVoiceSettings): void {
  cache.set(userId, settings);
  try {
    localStorage.setItem(keyFor(userId), JSON.stringify(settings));
  } catch {
    // 저장 실패는 조용히 무시합니다. 이번 세션 동안은 위 캐시가 값을 들고 있습니다.
  }
  notify();
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);

  // 다른 탭에서 바꾼 값도 따라갑니다(같은 탭 안의 변경은 storage 이벤트를 내지 않으므로
  // 위 notify가 담당합니다).
  const onStorage = (e: StorageEvent) => {
    if (e.key && !e.key.startsWith("kindy.childVoice.")) return;
    cache.clear();
    notify();
  };
  window.addEventListener("storage", onStorage);

  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
}

/** 아이 계정의 음성 설정을 읽고 씁니다. 같은 값을 보는 화면끼리 항상 같은 상태를 봅니다. */
export function useChildVoiceSettings(userId: string) {
  const settings = useSyncExternalStore(
    subscribe,
    () => snapshot(userId),
    () => DEFAULT_SETTINGS,
  );

  const update = useCallback(
    (partial: Partial<ChildVoiceSettings>) => {
      saveChildVoiceSettings(userId, { ...snapshot(userId), ...partial });
    },
    [userId],
  );

  return { settings, update };
}
