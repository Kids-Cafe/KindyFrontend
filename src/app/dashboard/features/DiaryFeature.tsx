import { useCallback, useEffect, useRef, useState } from "react";
import { Smile, PartyPopper, Cloud, CloudRain, Frown, BookOpen, RefreshCw, Sparkles } from "lucide-react";
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
            <>
              {/* 본문은 요약과 다를 때만 덧붙입니다. 모델이 요약만 준 날은 서버가 둘을 같게
                  저장하므로, 그대로 두면 같은 문장을 두 번 읽게 됩니다. */}
              {entry.text && entry.text !== entry.summary && (
                <p className="text-xs leading-relaxed mt-2 whitespace-pre-line" style={{ color: "#6B3580" }}>
                  {entry.text}
                </p>
              )}
              <div className="flex flex-wrap gap-1.5 mt-2.5">
                {entry.tags.map((tag) => (
                  <span key={tag} className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ background: "#FCE7F3", color: "#BE185D" }}>#{tag}</span>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </button>
  );
}

/** 일기를 쓰는 중에 화면이 무엇을 기다리는지 알려주는 한 줄입니다. */
type WriteState =
  | { kind: "idle" }
  | { kind: "writing" }
  /**
   * 이번에 정리된 편수. 새로 쓴 날과, 대화가 이어져 다시 쓴 날(주로 오늘)이 함께 셉니다.
   * 0은 "정리할 대화가 없었다"입니다.
   */
  | { kind: "done"; written: number }
  | { kind: "failed" };

/**
 * 아이(본인) 또는 부모·선생님이 보는 아이의 일기장입니다.
 *
 * 일기는 사람이 쓰는 것이 아니라 아이가 AI 파트너와 나눈 대화에서 만들어집니다. 화면이
 * 열릴 때 `generateDiary`가 한 번 돌면서 아직 일기가 없는 날을 채우고, **대화가 이어진
 * 날은 다시 씁니다** — 아침에 쓰인 오늘의 일기가 오후의 이야기를 담게 되는 자리가 여기뿐입니다.
 * 그 뒤로는 버튼으로만 다시 시도합니다(모델 호출이라 느립니다).
 */
export function DiaryFeature({ childId }: { childId: string }) {
  const { data, generateDiary } = useDashboardStore();
  const entries = data.diaryByChild[childId] ?? [];

  const [state, setState] = useState<WriteState>({ kind: "idle" });
  /** 이 화면이 이 아이에 대해 자동 생성을 이미 한 번 걸었는지. */
  const startedFor = useRef<string | null>(null);
  /** 언마운트 뒤에 상태를 건드리지 않기 위한 표시입니다(생성은 수십 초가 걸립니다). */
  const alive = useRef(true);

  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
    };
  }, []);

  const write = useCallback(async () => {
    setState({ kind: "writing" });
    try {
      const written = await generateDiary(childId);
      if (alive.current) setState({ kind: "done", written });
    } catch (cause) {
      console.warn("[Kindy] 일기를 쓰지 못했어요.", cause);
      if (alive.current) setState({ kind: "failed" });
    }
  }, [childId, generateDiary]);

  useEffect(() => {
    if (startedFor.current === childId) return;
    startedFor.current = childId;
    void write();
  }, [childId, write]);

  const writing = state.kind === "writing";

  return (
    <div>
      <div className="flex items-center gap-2 mb-1.5 text-xs font-bold" style={{ color: "#E879A0" }}>
        <BookOpen className="w-3.5 h-3.5" />
        AI 파트너와의 대화를 바탕으로 자동으로 기록돼요
      </div>
      <p className="text-xs mb-3" style={{ color: "#A06080" }}>최근 대화가 쌓일수록 더 풍부한 일기가 만들어져요.</p>

      <div className="flex items-center gap-2 mb-5">
        <button
          onClick={() => void write()}
          disabled={writing}
          className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full border transition-colors disabled:opacity-60"
          style={{ borderColor: "rgba(232,121,160,0.3)", color: "#BE185D", background: "#FDF2F8" }}
        >
          {writing ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
          {writing ? "일기를 쓰는 중…" : "지난 대화로 일기 쓰기"}
        </button>
        <span className="text-xs" style={{ color: "#A06080" }}>
          {writing && "며칠치를 한 번에 쓰면 조금 오래 걸려요."}
          {/* "정리했어요" — 오늘처럼 대화가 이어진 날은 새로 쓴 게 아니라 다시 쓴 것입니다. */}
          {state.kind === "done" && state.written > 0 && `일기 ${state.written}편을 정리했어요!`}
          {/* 0편은 실패가 아닙니다. 대화가 없었거나 한두 마디뿐이라, 지어내지 않고는
              일기가 되지 않는 날들만 남았다는 뜻입니다. */}
          {state.kind === "done" && state.written === 0 && "새로 정리할 대화가 아직 없어요."}
          {state.kind === "failed" && "일기를 쓰지 못했어요. 잠시 뒤 다시 눌러 주세요."}
        </span>
      </div>

      <div className="space-y-3">
        {entries.length === 0 && !writing && (
          <p className="text-sm" style={{ color: "#A06080" }}>아직 기록된 일기가 없어요. AI 파트너와 대화를 나눠보세요!</p>
        )}
        {entries.map((entry) => (
          <DiaryCard key={entry.id} entry={entry} />
        ))}
      </div>
    </div>
  );
}
