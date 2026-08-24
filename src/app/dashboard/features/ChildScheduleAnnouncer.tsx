import { useCallback, useEffect, useRef, useState } from "react";
import { Volume2, X } from "lucide-react";
import { KioSVG, KinaSVG } from "@/app/components/decorative";
import { useDashboardStore } from "@/app/dashboard/DashboardStoreContext";
import { useChildVoiceSettings } from "@/app/dashboard/childVoiceSettings";
import { speakAssistant } from "@/app/dashboard/chatSync";
import type { AIPartnerId } from "@/app/dashboard/types";

function daysUntil(dateStr: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(`${dateStr}T00:00:00`);
  return Math.round((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

function formatDate(dateStr: string): string {
  const [, m, d] = dateStr.split("-");
  return `${Number(m)}월 ${Number(d)}일`;
}

/**
 * 아이 대시보드에 마운트되어, 다가오는(3일 이내) 일정이 있으면 AI 파트너 캐릭터가
 * 말풍선으로 알려줍니다. 설정에서 음성알림이 켜져 있으면 짧게 읽어줍니다.
 *
 * 읽어 주는 목소리는 채팅과 **같은 경로**를 씁니다 — 서버의 `chat/speak`가 캐릭터 목소리로
 * 만들어 준 소리를 그대로 재생합니다. 예전에는 여기만 브라우저 SpeechSynthesis를 써서 같은
 * 캐릭터가 화면마다 다른 목소리로 말했고, 말 빠르기·음높이도 서버 값과 따로 관리해야
 * 했습니다. 이제 그 숫자들은 서버(`ChatDTO.Partner`)에만 있습니다.
 */
export function ChildScheduleAnnouncer({ childId, userId, partner }: { childId: string; userId: string; partner: AIPartnerId | null }) {
  const { data } = useDashboardStore();
  const { settings } = useChildVoiceSettings(userId);
  const [dismissed, setDismissed] = useState(false);

  const classId = data.classChildren.find((c) => c.id === childId)?.classId;
  const upcoming = data.scheduleEvents
    .filter((e) => !e.classId || e.classId === classId)
    .filter((e) => {
      const d = daysUntil(e.date);
      return d >= 0 && d <= 3;
    })
    .sort((a, b) => daysUntil(a.date) - daysUntil(b.date))[0];

  /**
   * 재생용 엘리먼트 하나를 계속 씁니다(채팅 화면과 같은 이유입니다). 소리를 서버에서 받아
   * 오는 동안 사용자 조작과의 연결이 끊기므로, `new Audio()`를 그때그때 만들면 자동재생
   * 정책에 더 쉽게 걸립니다.
   */
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const objectUrlRef = useRef<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const stop = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
    const audio = audioRef.current;
    if (audio) {
      audio.pause();
      audio.removeAttribute("src");
    }
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
      objectUrlRef.current = null;
    }
  }, []);

  const speak = useCallback(async () => {
    if (!upcoming || !settings.enabled) return;

    stop(); // 앞서 읽던 게 남아 있으면 겹칩니다.
    const controller = new AbortController();
    abortRef.current = controller;

    const text = `${daysUntil(upcoming.date) === 0 ? "오늘은" : `${daysUntil(upcoming.date)}일 뒤에`} ${upcoming.title} 일정이 있어요!`;
    // 파트너를 아직 고르지 않았으면 서버의 기본 목소리로 읽습니다 — 누구의 것도 아닌 소리가 맞습니다.
    const blob = await speakAssistant(text, { partner: partner ?? undefined, signal: controller.signal });
    if (controller.signal.aborted) return;

    const audio = audioRef.current;
    if (!blob || !audio) return;

    const url = URL.createObjectURL(blob);
    objectUrlRef.current = url;
    audio.src = url;
    // iOS는 미디어 볼륨을 OS가 쥐고 있어 이 값을 무시합니다. 다른 환경에서는 먹습니다.
    audio.volume = settings.volume;
    try {
      await audio.play();
    } catch {
      // 자동재생이 막혔습니다. 옆의 스피커 버튼이 남은 경로입니다.
    }
  }, [upcoming, partner, settings.enabled, settings.volume, stop]);

  // 자동 재생 시도입니다. 브라우저는 사용자 조작 없이 시작한 재생을 막을 수 있으므로 여기서
  // 소리가 나지 않을 수 있습니다. 그래서 아래에 직접 누를 수 있는 버튼을 함께 둡니다.
  useEffect(() => {
    void speak();
    return stop;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [upcoming?.id, userId]);

  if (!upcoming || dismissed) return null;

  const Char = partner === "kina" ? KinaSVG : KioSVG;

  return (
    <div className="flex items-start gap-3 rounded-2xl p-4 mb-5" style={{ background: "linear-gradient(135deg,#FCE7F3,#EDE9FE)", border: "1px solid rgba(232,121,160,0.25)" }}>
      <audio ref={audioRef} onEnded={stop} className="hidden" />
      <Char className="h-14 w-auto shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold leading-relaxed" style={{ color: "#3B1355" }}>
          {daysUntil(upcoming.date) === 0 ? "오늘은" : `${daysUntil(upcoming.date)}일 뒤에`} <span style={{ color: "#E879A0" }}>{upcoming.title}</span> 일정이 있어요!
        </p>
        <p className="text-xs mt-1" style={{ color: "#A06080" }}>{formatDate(upcoming.date)}{upcoming.time ? ` · ${upcoming.time}` : ""}</p>
      </div>
      {/* 음성알림을 꺼 두었으면 눌러도 아무 소리가 나지 않으므로 버튼도 함께 감춥니다. */}
      {settings.enabled && (
        <button
          onClick={() => void speak()}
          aria-label="일정 다시 듣기"
          title="다시 듣기"
          className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 transition-colors hover:bg-black/[0.05]"
        >
          <Volume2 className="w-4 h-4" style={{ color: "#A06080" }} />
        </button>
      )}
      <button
        onClick={() => {
          stop(); // 닫았는데 소리만 계속 나면 안 됩니다.
          setDismissed(true);
        }}
        aria-label="알림 닫기"
        className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 transition-colors hover:bg-black/[0.05]"
      >
        <X className="w-4 h-4" style={{ color: "#A06080" }} />
      </button>
    </div>
  );
}
