import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { KioSVG, KinaSVG } from "@/app/components/decorative";
import { useDashboardStore } from "@/app/dashboard/DashboardStoreContext";
import { loadChildVoiceSettings } from "@/app/dashboard/childVoiceSettings";
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
 * 말풍선으로 알려줍니다. 설정에서 음성알림이 켜져 있으면 SpeechSynthesis로 짧게 읽어줍니다.
 */
export function ChildScheduleAnnouncer({ childId, userId, partner }: { childId: string; userId: string; partner: AIPartnerId | null }) {
  const { data } = useDashboardStore();
  const [dismissed, setDismissed] = useState(false);

  const classId = data.classChildren.find((c) => c.id === childId)?.classId;
  const upcoming = data.scheduleEvents
    .filter((e) => !e.classId || e.classId === classId)
    .filter((e) => {
      const d = daysUntil(e.date);
      return d >= 0 && d <= 3;
    })
    .sort((a, b) => daysUntil(a.date) - daysUntil(b.date))[0];

  useEffect(() => {
    if (!upcoming) return;
    const settings = loadChildVoiceSettings(userId);
    if (!settings.enabled || typeof window === "undefined" || !window.speechSynthesis) return;
    const text = `${daysUntil(upcoming.date) === 0 ? "오늘은" : `${daysUntil(upcoming.date)}일 뒤에`} ${upcoming.title} 일정이 있어요!`;
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "ko-KR";
    utterance.volume = settings.volume;
    window.speechSynthesis.speak(utterance);
    return () => window.speechSynthesis.cancel();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [upcoming?.id, userId]);

  if (!upcoming || dismissed) return null;

  const Char = partner === "kina" ? KinaSVG : KioSVG;

  return (
    <div className="flex items-start gap-3 rounded-2xl p-4 mb-5" style={{ background: "linear-gradient(135deg,#FCE7F3,#EDE9FE)", border: "1px solid rgba(232,121,160,0.25)" }}>
      <Char className="h-14 w-auto shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold leading-relaxed" style={{ color: "#3B1355" }}>
          {daysUntil(upcoming.date) === 0 ? "오늘은" : `${daysUntil(upcoming.date)}일 뒤에`} <span style={{ color: "#E879A0" }}>{upcoming.title}</span> 일정이 있어요!
        </p>
        <p className="text-xs mt-1" style={{ color: "#A06080" }}>{formatDate(upcoming.date)}{upcoming.time ? ` · ${upcoming.time}` : ""}</p>
      </div>
      <button onClick={() => setDismissed(true)} aria-label="알림 닫기" className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 transition-colors hover:bg-black/[0.05]">
        <X className="w-4 h-4" style={{ color: "#A06080" }} />
      </button>
    </div>
  );
}
