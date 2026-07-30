import { useCallback, useState } from "react";

/** 아이 계정의 "캐릭터 음성 알림" 환경설정입니다. 백엔드가 없어 계정별로 localStorage에 저장합니다. */
export interface ChildVoiceSettings {
  enabled: boolean;
  /** 0~1 */
  volume: number;
}

const DEFAULT_SETTINGS: ChildVoiceSettings = { enabled: true, volume: 0.8 };

function keyFor(userId: string): string {
  return `kindy.childVoice.${userId}`;
}

export function loadChildVoiceSettings(userId: string): ChildVoiceSettings {
  try {
    const raw = localStorage.getItem(keyFor(userId));
    if (raw) return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
  } catch {
    // localStorage를 쓸 수 없는 환경이면 기본값을 그대로 씁니다.
  }
  return DEFAULT_SETTINGS;
}

function saveChildVoiceSettings(userId: string, settings: ChildVoiceSettings): void {
  try {
    localStorage.setItem(keyFor(userId), JSON.stringify(settings));
  } catch {
    // 저장 실패는 조용히 무시합니다(목업 설정이라 치명적이지 않음).
  }
}

/** 마이페이지 알림설정에서 아이 계정의 캐릭터 음성알림 on/off·볼륨을 읽고 씁니다. */
export function useChildVoiceSettings(userId: string) {
  const [settings, setSettings] = useState<ChildVoiceSettings>(() => loadChildVoiceSettings(userId));

  const update = useCallback((partial: Partial<ChildVoiceSettings>) => {
    setSettings((prev) => {
      const next = { ...prev, ...partial };
      saveChildVoiceSettings(userId, next);
      return next;
    });
  }, [userId]);

  return { settings, update };
}
