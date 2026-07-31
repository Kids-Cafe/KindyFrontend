import { useMemo, useState } from "react";
import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";
import { FloatingPicker } from "@/app/dashboard/features/FloatingPicker";

const WEEKDAY_LABELS = ["일", "월", "화", "수", "목", "금", "토"];

function pad2(n: number): string {
  return n.toString().padStart(2, "0");
}

function toDateStr(y: number, m: number, d: number): string {
  return `${y}-${pad2(m)}-${pad2(d)}`;
}

function addDays(base: Date, days: number): Date {
  const d = new Date(base);
  d.setDate(d.getDate() + days);
  return d;
}

function formatLabel(dateStr: string): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  const weekday = WEEKDAY_LABELS[new Date(y, m - 1, d).getDay()];
  return `${y}.${pad2(m)}.${pad2(d)} (${weekday})`;
}

function daysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate();
}

/** 네이티브 date input 대신 쓰는 버튼식 날짜 선택기입니다. 오늘/내일/모레 빠른 선택 + 년/월/일 버튼을 제공합니다. */
export function DatePickerButton({ value, onChange }: { value: string; onChange: (dateStr: string) => void }) {
  const [open, setOpen] = useState(false);
  const [cursor, setCursor] = useState(() => {
    const base = value ? new Date(`${value}T00:00:00`) : new Date();
    return { year: base.getFullYear(), month: base.getMonth() + 1 };
  });

  const quickOptions = useMemo(() => {
    const today = new Date();
    return [
      { label: "오늘", date: today },
      { label: "내일", date: addDays(today, 1) },
      { label: "모레", date: addDays(today, 2) },
    ].map((o) => ({ label: o.label, dateStr: toDateStr(o.date.getFullYear(), o.date.getMonth() + 1, o.date.getDate()) }));
  }, []);

  const dayCells = useMemo(() => {
    const total = daysInMonth(cursor.year, cursor.month);
    const offset = new Date(cursor.year, cursor.month - 1, 1).getDay();
    return [...Array(offset).fill(null), ...Array.from({ length: total }, (_, i) => i + 1)];
  }, [cursor]);

  function select(year: number, month: number, day: number) {
    onChange(toDateStr(year, month, day));
    setOpen(false);
  }

  function selectDateStr(dateStr: string) {
    onChange(dateStr);
    setOpen(false);
  }

  function handleOpenChange(next: boolean) {
    if (next) {
      const base = value ? new Date(`${value}T00:00:00`) : new Date();
      setCursor({ year: base.getFullYear(), month: base.getMonth() + 1 });
    }
    setOpen(next);
  }

  return (
    <FloatingPicker
      open={open}
      onOpenChange={handleOpenChange}
      trigger={({ ref, onClick }) => (
        <button
          ref={ref}
          type="button"
          onClick={onClick}
          className="w-full flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-bold text-left outline-none"
          style={{ background: "var(--input-background)", border: "1px solid rgba(232,121,160,0.2)", color: value ? "#3B1355" : "#A06080" }}
        >
          <CalendarDays className="w-3.5 h-3.5 shrink-0" style={{ color: "#E879A0" }} />
          {value ? formatLabel(value) : "날짜 선택"}
        </button>
      )}
    >
      <div className="flex gap-1.5 mb-3">
        {quickOptions.map((opt) => (
          <button
            key={opt.label}
            type="button"
            onClick={() => selectDateStr(opt.dateStr)}
            className="flex-1 text-[11px] font-bold py-1.5 rounded-full transition-colors"
            style={{
              background: value === opt.dateStr ? "linear-gradient(135deg,#E879A0,#F472B6)" : "rgba(232,121,160,0.12)",
              color: value === opt.dateStr ? "#fff" : "#E879A0",
            }}
          >
            {opt.label}
          </button>
        ))}
      </div>

      <p className="text-[10px] font-bold mb-1" style={{ color: "#A06080" }}>년</p>
      <div className="flex items-center justify-between mb-3">
        <button
          type="button"
          onClick={() => setCursor((c) => ({ ...c, year: c.year - 1 }))}
          aria-label="이전 해"
          className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors hover:bg-black/[0.04]"
        >
          <ChevronLeft className="w-3.5 h-3.5" style={{ color: "#A06080" }} />
        </button>
        <p className="text-sm font-bold" style={{ color: "#3B1355" }}>{cursor.year}년</p>
        <button
          type="button"
          onClick={() => setCursor((c) => ({ ...c, year: c.year + 1 }))}
          aria-label="다음 해"
          className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors hover:bg-black/[0.04]"
        >
          <ChevronRight className="w-3.5 h-3.5" style={{ color: "#A06080" }} />
        </button>
      </div>

      <p className="text-[10px] font-bold mb-1" style={{ color: "#A06080" }}>월</p>
      <div className="grid grid-cols-4 gap-1 mb-3">
        {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => setCursor((c) => ({ ...c, month: m }))}
            className="rounded-lg text-[11px] font-bold py-1.5 transition-colors"
            style={{
              background: cursor.month === m ? "linear-gradient(135deg,#E879A0,#F472B6)" : "rgba(232,121,160,0.08)",
              color: cursor.month === m ? "#fff" : "#3B1355",
            }}
          >
            {m}월
          </button>
        ))}
      </div>

      <p className="text-[10px] font-bold mb-1" style={{ color: "#A06080" }}>일</p>
      <div className="grid grid-cols-7 gap-0.5 mb-0.5">
        {WEEKDAY_LABELS.map((w) => (
          <div key={w} className="text-center text-[10px] font-bold py-0.5" style={{ color: "#A06080" }}>{w}</div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-0.5">
        {dayCells.map((day, i) => {
          if (day === null) return <span key={`blank-${i}`} />;
          const dateStr = toDateStr(cursor.year, cursor.month, day);
          const selected = dateStr === value;
          return (
            <button
              key={dateStr}
              type="button"
              onClick={() => select(cursor.year, cursor.month, day)}
              className="aspect-square rounded-lg text-[11px] font-bold transition-colors"
              style={{
                background: selected ? "linear-gradient(135deg,#E879A0,#F472B6)" : "transparent",
                color: selected ? "#fff" : "#3B1355",
              }}
            >
              {day}
            </button>
          );
        })}
      </div>
    </FloatingPicker>
  );
}
