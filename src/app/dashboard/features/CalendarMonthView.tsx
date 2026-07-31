import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { ScheduleEvent } from "@/app/dashboard/types";

const WEEKDAY_LABELS = ["일", "월", "화", "수", "목", "금", "토"];

function toDateStr(d: Date): string {
  return `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, "0")}-${d.getDate().toString().padStart(2, "0")}`;
}

function todayStr(): string {
  return toDateStr(new Date());
}

/**
 * 실제 달력처럼 한 달을 격자로 보여주는 뷰입니다. 각 칸에는 그 날의 일정 제목이 최대 2개까지
 * 미리보기로 표시되고, 칸을 클릭하면 `onSelectDate`로 해당 날짜(YYYY-MM-DD)를 알려줍니다.
 */
export function CalendarMonthView({
  events,
  onSelectDate,
}: {
  events: ScheduleEvent[];
  onSelectDate: (dateStr: string) => void;
}) {
  const [cursor, setCursor] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });

  const eventsByDate = useMemo(() => {
    const map = new Map<string, ScheduleEvent[]>();
    for (const e of events) {
      const list = map.get(e.date) ?? [];
      list.push(e);
      map.set(e.date, list);
    }
    return map;
  }, [events]);

  const cells = useMemo(() => {
    const year = cursor.getFullYear();
    const month = cursor.getMonth();
    const firstOfMonth = new Date(year, month, 1);
    const startOffset = firstOfMonth.getDay();
    const gridStart = new Date(year, month, 1 - startOffset);

    return Array.from({ length: 42 }, (_, i) => {
      const d = new Date(gridStart.getFullYear(), gridStart.getMonth(), gridStart.getDate() + i);
      return { date: d, dateStr: toDateStr(d), inMonth: d.getMonth() === month };
    });
  }, [cursor]);

  const today = todayStr();
  const label = `${cursor.getFullYear()}년 ${cursor.getMonth() + 1}월`;

  return (
    <div className="rounded-2xl bg-card border p-4" style={{ borderColor: "rgba(232,121,160,0.15)" }}>
      <div className="flex items-center justify-between mb-3">
        <button
          onClick={() => setCursor((c) => new Date(c.getFullYear(), c.getMonth() - 1, 1))}
          aria-label="이전 달"
          className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors hover:bg-black/[0.04]"
        >
          <ChevronLeft className="w-4 h-4" style={{ color: "#A06080" }} />
        </button>
        <div className="flex items-center gap-2">
          <p className="text-sm font-bold" style={{ color: "#3B1355" }}>{label}</p>
          <button
            onClick={() => setCursor(() => { const n = new Date(); return new Date(n.getFullYear(), n.getMonth(), 1); })}
            className="text-[11px] font-bold px-2 py-0.5 rounded-full"
            style={{ background: "rgba(232,121,160,0.12)", color: "#E879A0" }}
          >
            오늘
          </button>
        </div>
        <button
          onClick={() => setCursor((c) => new Date(c.getFullYear(), c.getMonth() + 1, 1))}
          aria-label="다음 달"
          className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors hover:bg-black/[0.04]"
        >
          <ChevronRight className="w-4 h-4" style={{ color: "#A06080" }} />
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1 mb-1">
        {WEEKDAY_LABELS.map((w) => (
          <div key={w} className="text-center text-[11px] font-bold py-1" style={{ color: "#A06080" }}>
            {w}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {cells.map(({ date, dateStr, inMonth }) => {
          const dayEvents = eventsByDate.get(dateStr) ?? [];
          const isToday = dateStr === today;
          return (
            <button
              key={dateStr}
              onClick={() => onSelectDate(dateStr)}
              className="min-h-[64px] rounded-xl p-1.5 text-left flex flex-col gap-0.5 transition-colors hover:bg-black/[0.03]"
              style={{
                background: isToday ? "rgba(232,121,160,0.1)" : "transparent",
                border: isToday ? "1px solid rgba(232,121,160,0.35)" : "1px solid transparent",
                opacity: inMonth ? 1 : 0.35,
              }}
            >
              <span className="text-[11px] font-bold" style={{ color: isToday ? "#E879A0" : "#3B1355" }}>
                {date.getDate()}
              </span>
              <div className="flex flex-col gap-0.5 min-w-0">
                {dayEvents.slice(0, 2).map((e) => (
                  <span
                    key={e.id}
                    className="text-[10px] font-bold truncate rounded px-1 py-0.5"
                    style={{ background: "rgba(232,121,160,0.15)", color: "#C0568A" }}
                  >
                    {e.title}
                  </span>
                ))}
                {dayEvents.length > 2 && (
                  <span className="text-[10px] font-bold" style={{ color: "#A06080" }}>+{dayEvents.length - 2}개 더</span>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
