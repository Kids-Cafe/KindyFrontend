import { useState } from "react";
import { Smile, PartyPopper, Cloud, CloudRain, Frown, BookOpen } from "lucide-react";
import { useDashboardStore } from "@/app/dashboard/DashboardStoreContext";
import type { DiaryEntry, MoodTag } from "@/app/dashboard/types";

const MOOD_META: Record<MoodTag, { icon: typeof Smile; label: string; color: string }> = {
  happy: { icon: Smile, label: "기뻤어요", color: "#F9D56E" },
  excited: { icon: PartyPopper, label: "신났어요", color: "#F472B6" },
  calm: { icon: Cloud, label: "차분했어요", color: "#7ECECA" },
  sad: { icon: CloudRain, label: "속상했어요", color: "#A78BFA" },
  upset: { icon: Frown, label: "힘들었어요", color: "#F87171" },
};

function formatDate(iso: string): string {
  const d = new Date(iso);
  return `${d.getMonth() + 1}월 ${d.getDate()}일`;
}

function DiaryCard({ entry }: { entry: DiaryEntry }) {
  const [open, setOpen] = useState(false);
  const mood = MOOD_META[entry.mood];
  return (
    <button
      onClick={() => setOpen((v) => !v)}
      className="w-full text-left rounded-2xl bg-card border p-4 transition-all hover:shadow-md"
      style={{ borderColor: "rgba(232,121,160,0.15)" }}
    >
      <div className="flex items-start gap-3">
        <span className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: `${mood.color}30` }}>
          <mood.icon className="w-4 h-4" style={{ color: mood.color }} />
        </span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold" style={{ color: "#A06080" }}>{formatDate(entry.date)} · {mood.label}</p>
          </div>
          <p className="font-bold text-sm mt-0.5" style={{ color: "#3B1355" }}>{entry.title}</p>
          <p className={`text-xs leading-relaxed mt-1.5 ${open ? "" : "line-clamp-2"}`} style={{ color: "#6B3580" }}>
            {entry.summary}
          </p>
          {open && (
            <div className="flex flex-wrap gap-1.5 mt-2.5">
              {entry.tags.map((tag) => (
                <span key={tag} className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ background: "#FCE7F3", color: "#BE185D" }}>#{tag}</span>
              ))}
            </div>
          )}
        </div>
      </div>
    </button>
  );
}

/** 아이(본인) 또는 부모(아이의) 일기장입니다. AI 파트너와의 대화를 바탕으로 자동 생성된 기록이라는 점을 안내합니다. */
export function DiaryFeature({ childId }: { childId: string }) {
  const { data } = useDashboardStore();
  const entries = data.diaryByChild[childId] ?? [];

  return (
    <div className="max-w-2xl">
      <div className="flex items-center gap-2 mb-1.5 text-xs font-bold" style={{ color: "#E879A0" }}>
        <BookOpen className="w-3.5 h-3.5" />
        AI 파트너와의 대화를 바탕으로 자동으로 기록돼요
      </div>
      <p className="text-xs mb-5" style={{ color: "#A06080" }}>최근 대화가 쌓일수록 더 풍부한 일기가 만들어져요.</p>
      <div className="space-y-3">
        {entries.length === 0 && (
          <p className="text-sm" style={{ color: "#A06080" }}>아직 기록된 일기가 없어요. AI 파트너와 대화를 나눠보세요!</p>
        )}
        {entries.map((entry) => (
          <DiaryCard key={entry.id} entry={entry} />
        ))}
      </div>
    </div>
  );
}
