import { useMemo, useState } from "react";
import { CalendarDays, Plus, Bell, X } from "lucide-react";
import { useDashboardStore } from "@/app/dashboard/DashboardStoreContext";
import { useAuth } from "@/app/auth/AuthContext";
import { getDisplayName } from "@/app/auth/getDisplayName";
import type { ScheduleEvent } from "@/app/dashboard/types";

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

/** 아이 계정을 제외한 대시보드 상단에 붙는 "다가오는 일정" 배너입니다. 개별적으로 닫을 수 있습니다. */
export function UpcomingScheduleBanner() {
  const { data } = useDashboardStore();
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());

  const relevant = useMemo(() => {
    const classId = data.role === "teacher" ? data.teacher.classId : data.role === "parent" ? data.myChild?.classId : undefined;
    return data.scheduleEvents
      .filter((e) => !e.classId || e.classId === classId || data.role === "director")
      .filter((e) => {
        const d = daysUntil(e.date);
        return d >= 0 && d <= 3;
      })
      .sort((a, b) => daysUntil(a.date) - daysUntil(b.date));
  }, [data]);

  const event = relevant.find((e) => !dismissed.has(e.id));
  if (!event) return null;

  return (
    <div
      className="flex items-center gap-3 rounded-2xl px-4 py-3 mb-4"
      style={{ background: "linear-gradient(135deg,#FCE7F3,#EDE9FE)", border: "1px solid rgba(232,121,160,0.25)" }}
    >
      <span className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0" style={{ background: "rgba(232,121,160,0.18)" }}>
        <Bell className="w-4 h-4" style={{ color: "#E879A0" }} />
      </span>
      <p className="flex-1 text-sm font-bold" style={{ color: "#3B1355" }}>
        {daysUntil(event.date) === 0 ? "오늘" : `${daysUntil(event.date)}일 후`} — {event.title} ({formatDate(event.date)}{event.time ? ` ${event.time}` : ""})
      </p>
      <button
        onClick={() => setDismissed((prev) => new Set(prev).add(event.id))}
        aria-label="배너 닫기"
        className="w-6 h-6 rounded-full flex items-center justify-center shrink-0 transition-colors hover:bg-black/[0.05]"
      >
        <X className="w-3.5 h-3.5" style={{ color: "#A06080" }} />
      </button>
    </div>
  );
}

function EventRow({ event }: { event: ScheduleEvent }) {
  const upcoming = daysUntil(event.date) >= 0;
  return (
    <div className="flex items-center gap-3 rounded-2xl bg-card border p-3.5" style={{ borderColor: "rgba(232,121,160,0.15)", opacity: upcoming ? 1 : 0.6 }}>
      <div
        className="w-12 h-12 rounded-xl flex flex-col items-center justify-center shrink-0 text-white font-bold"
        style={{ background: upcoming ? "linear-gradient(135deg,#E879A0,#F472B6)" : "#D1D5DB" }}
      >
        <span className="text-[10px] leading-none">{event.date.slice(5, 7)}월</span>
        <span className="text-sm leading-none mt-0.5">{event.date.slice(8, 10)}</span>
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-bold truncate" style={{ color: "#3B1355" }}>{event.title}</p>
        <p className="text-xs" style={{ color: "#A06080" }}>{event.time ? `${event.time} · ` : ""}{event.classId ? "우리 반" : "유치원 전체"} · {event.createdBy}</p>
      </div>
    </div>
  );
}

/** 일정 목록입니다. 선생님/원장은 등록 폼을, 부모/아이는 읽기 전용 목록을 봅니다. */
export function ScheduleFeature() {
  const { user } = useAuth();
  const { data, addScheduleEvent } = useDashboardStore();
  const [composing, setComposing] = useState(false);
  const [title, setTitle] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [wholeKindergarten, setWholeKindergarten] = useState(false);

  const canWrite = data.role === "teacher" || data.role === "director";
  const classId = data.role === "teacher" ? data.teacher.classId : data.role === "parent" ? data.myChild?.classId : data.role === "child" ? data.me?.classId : undefined;

  const events = data.scheduleEvents
    .filter((e) => !e.classId || e.classId === classId || data.role === "director")
    .sort((a, b) => a.date.localeCompare(b.date));

  function handleSubmit() {
    if (!title.trim() || !date || !user) return;
    addScheduleEvent(title.trim(), date, time || undefined, getDisplayName(user), wholeKindergarten ? undefined : classId);
    setTitle("");
    setDate("");
    setTime("");
    setComposing(false);
  }

  return (
    <div className="max-w-2xl">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2 text-xs font-bold" style={{ color: "#E879A0" }}>
          <CalendarDays className="w-3.5 h-3.5" />
          일정
        </div>
        {canWrite && !composing && (
          <button
            onClick={() => setComposing(true)}
            className="flex items-center gap-1 text-xs font-bold px-3 py-1.5 rounded-full text-white transition-transform active:scale-95"
            style={{ background: "linear-gradient(135deg,#E879A0,#F472B6)" }}
          >
            <Plus className="w-3.5 h-3.5" /> 일정 등록
          </button>
        )}
      </div>

      {canWrite && composing && (
        <div className="rounded-2xl bg-card border p-4 mb-4 space-y-2.5" style={{ borderColor: "rgba(232,121,160,0.2)" }}>
          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="일정 제목"
            className="w-full rounded-xl px-3.5 py-2.5 text-sm font-bold outline-none"
            style={{ background: "var(--input-background)", border: "1px solid rgba(232,121,160,0.2)", color: "#3B1355" }} />
          <div className="flex gap-2">
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)}
              className="flex-1 rounded-xl px-3.5 py-2 text-xs outline-none"
              style={{ background: "var(--input-background)", border: "1px solid rgba(232,121,160,0.2)", color: "#6B3580" }} />
            <input type="time" value={time} onChange={(e) => setTime(e.target.value)}
              className="flex-1 rounded-xl px-3.5 py-2 text-xs outline-none"
              style={{ background: "var(--input-background)", border: "1px solid rgba(232,121,160,0.2)", color: "#6B3580" }} />
          </div>
          <label className="flex items-center gap-2 text-xs" style={{ color: "#6B3580" }}>
            <input type="checkbox" checked={wholeKindergarten} onChange={(e) => setWholeKindergarten(e.target.checked)} />
            유치원 전체 대상 일정이에요
          </label>
          <div className="flex justify-end gap-2">
            <button onClick={() => setComposing(false)} className="text-xs font-bold px-3 py-2 rounded-full" style={{ color: "#A06080" }}>취소</button>
            <button onClick={handleSubmit} className="text-xs font-bold px-4 py-2 rounded-full text-white transition-transform active:scale-95"
              style={{ background: "linear-gradient(135deg,#E879A0,#F472B6)" }}>등록</button>
          </div>
        </div>
      )}

      <div className="space-y-2.5">
        {events.length === 0 && <p className="text-sm" style={{ color: "#A06080" }}>등록된 일정이 없어요.</p>}
        {events.map((e) => <EventRow key={e.id} event={e} />)}
      </div>
    </div>
  );
}
