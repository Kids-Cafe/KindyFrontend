import { useMemo, useState } from "react";
import { Clock } from "lucide-react";
import { FloatingPicker } from "@/app/dashboard/features/FloatingPicker";

const HOURS_12 = Array.from({ length: 12 }, (_, i) => i + 1);
const MINUTES = [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55];

function parseTime(value: string): { period: "오전" | "오후"; hour12: number; minute: number } {
  if (!value) return { period: "오전", hour12: 9, minute: 0 };
  const [h, m] = value.split(":").map(Number);
  const period = h < 12 ? "오전" : "오후";
  const hour12 = h % 12 === 0 ? 12 : h % 12;
  return { period, hour12, minute: m };
}

function toTimeValue(period: "오전" | "오후", hour12: number, minute: number): string {
  let h = hour12 % 12;
  if (period === "오후") h += 12;
  return `${h.toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")}`;
}

function formatLabel(value: string): string {
  const { period, hour12, minute } = parseTime(value);
  return `${period} ${hour12}:${minute.toString().padStart(2, "0")}:00`;
}

/**
 * 네이티브 time input 대신 쓰는 버튼식 시간 선택기입니다. 오전/오후 · 시 · 분을 버튼으로 고르고,
 * 초는 항상 00초로 고정됩니다(유치원 일정에는 초 단위가 필요 없어서 선택 UI 없이 표시만 합니다).
 */
export function TimePickerButton({ value, onChange }: { value: string; onChange: (time: string) => void }) {
  const [open, setOpen] = useState(false);
  const parsed = useMemo(() => parseTime(value), [value]);

  function update(patch: Partial<{ period: "오전" | "오후"; hour12: number; minute: number }>) {
    const next = { ...parsed, ...patch };
    onChange(toTimeValue(next.period, next.hour12, next.minute));
  }

  return (
    <FloatingPicker
      open={open}
      onOpenChange={setOpen}
      trigger={({ ref, onClick }) => (
        <button
          ref={ref}
          type="button"
          onClick={onClick}
          className="w-full flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-bold text-left outline-none"
          style={{ background: "var(--input-background)", border: "1px solid rgba(232,121,160,0.2)", color: value ? "#3B1355" : "#A06080" }}
        >
          <Clock className="w-3.5 h-3.5 shrink-0" style={{ color: "#E879A0" }} />
          {value ? formatLabel(value) : "시간 선택 (선택 사항)"}
        </button>
      )}
    >
      <p className="text-[10px] font-bold mb-1" style={{ color: "#A06080" }}>오전 / 오후</p>
      <div className="flex gap-1.5 mb-3">
        {(["오전", "오후"] as const).map((p) => (
          <button
            key={p}
            type="button"
            onClick={() => update({ period: p })}
            className="flex-1 text-xs font-bold py-1.5 rounded-full transition-colors"
            style={{
              background: parsed.period === p ? "linear-gradient(135deg,#E879A0,#F472B6)" : "rgba(232,121,160,0.12)",
              color: parsed.period === p ? "#fff" : "#E879A0",
            }}
          >
            {p}
          </button>
        ))}
      </div>

      <p className="text-[10px] font-bold mb-1" style={{ color: "#A06080" }}>시</p>
      <div className="grid grid-cols-6 gap-1 mb-3">
        {HOURS_12.map((h) => (
          <button
            key={h}
            type="button"
            onClick={() => update({ hour12: h })}
            className="rounded-lg text-[11px] font-bold py-1.5 transition-colors"
            style={{
              background: parsed.hour12 === h ? "linear-gradient(135deg,#E879A0,#F472B6)" : "rgba(232,121,160,0.08)",
              color: parsed.hour12 === h ? "#fff" : "#3B1355",
            }}
          >
            {h}
          </button>
        ))}
      </div>

      <p className="text-[10px] font-bold mb-1" style={{ color: "#A06080" }}>분</p>
      <div className="grid grid-cols-6 gap-1 mb-3">
        {MINUTES.map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => update({ minute: m })}
            className="rounded-lg text-[11px] font-bold py-1.5 transition-colors"
            style={{
              background: parsed.minute === m ? "linear-gradient(135deg,#E879A0,#F472B6)" : "rgba(232,121,160,0.08)",
              color: parsed.minute === m ? "#fff" : "#3B1355",
            }}
          >
            {m.toString().padStart(2, "0")}
          </button>
        ))}
      </div>

      <p className="text-[10px] font-bold mb-1" style={{ color: "#A06080" }}>초</p>
      <div className="grid grid-cols-6 gap-1 mb-3">
        <button
          type="button"
          disabled
          className="rounded-lg text-[11px] font-bold py-1.5 cursor-default"
          style={{ background: "rgba(232,121,160,0.2)", color: "#C0568A" }}
        >
          00
        </button>
      </div>

      <div className="flex justify-between gap-2">
        <button
          type="button"
          onClick={() => { onChange(""); setOpen(false); }}
          className="text-[11px] font-bold px-3 py-1.5 rounded-full"
          style={{ color: "#A06080" }}
        >
          시간 없음
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="text-[11px] font-bold px-4 py-1.5 rounded-full text-white transition-transform active:scale-95"
          style={{ background: "linear-gradient(135deg,#E879A0,#F472B6)" }}
        >
          확인
        </button>
      </div>
    </FloatingPicker>
  );
}
