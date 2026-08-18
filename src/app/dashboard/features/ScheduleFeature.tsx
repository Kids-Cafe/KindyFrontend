import { useMemo, useState } from "react";
import { CalendarDays, LayoutList, Plus, Bell, X, Pencil, Trash2 } from "lucide-react";
import { useDashboardStore } from "@/app/dashboard/DashboardStoreContext";
import { useAuth } from "@/app/auth/AuthContext";
import { getDisplayName } from "@/app/auth/getDisplayName";
import type { ScheduleEvent } from "@/app/dashboard/types";
import { CalendarMonthView } from "@/app/dashboard/features/CalendarMonthView";
import { DayEventDialog } from "@/app/dashboard/features/DayEventDialog";
import { DatePickerButton } from "@/app/dashboard/features/DatePickerButton";
import { TimePickerButton } from "@/app/dashboard/features/TimePickerButton";
import { useConfirm } from "@/app/components/ConfirmDialog";
import {
  canBrowseAllClasses,
  canManageClass,
  canManageKindergartenWide,
  getLockedClassId,
  teacherHasPermission,
} from "@/app/dashboard/classAccess";

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
  const [dismissed, setDismissed] = useState<Set<number>>(new Set());

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

function EventRow({ event, canEdit }: { event: ScheduleEvent; canEdit: boolean }) {
  const { data, updateScheduleEvent, deleteScheduleEvent } = useDashboardStore();
  const { ask, dialog } = useConfirm();
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(event.title);
  const [date, setDate] = useState(event.date);
  const [time, setTime] = useState(event.time ?? "");
  const [classId, setClassId] = useState<number | undefined>(event.classId);

  const upcoming = daysUntil(event.date) >= 0;

  function startEdit() {
    setTitle(event.title);
    setDate(event.date);
    setTime(event.time ?? "");
    setClassId(event.classId);
    setEditing(true);
  }

  function handleSave() {
    if (!title.trim() || !date) return;
    updateScheduleEvent(event.id, title.trim(), date, time || undefined, data.role === "director" ? classId : event.classId);
    setEditing(false);
  }

  if (editing) {
    return (
      <div className="rounded-2xl bg-card border p-4 space-y-2.5" style={{ borderColor: "rgba(232,121,160,0.2)" }}>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="일정 제목"
          className="w-full rounded-xl px-3.5 py-2.5 text-sm font-bold outline-none"
          style={{ background: "var(--input-background)", border: "1px solid rgba(232,121,160,0.2)", color: "#3B1355" }}
        />
        <div className="flex gap-2">
          <div className="flex-1">
            <DatePickerButton value={date} onChange={setDate} />
          </div>
          <div className="flex-1">
            <TimePickerButton value={time} onChange={setTime} />
          </div>
        </div>
        {data.role === "director" && (
          <select
            value={classId ?? ""}
            onChange={(e) => setClassId(e.target.value ? Number(e.target.value) : undefined)}
            className="w-full rounded-xl px-3.5 py-2 text-xs outline-none"
            style={{ background: "var(--input-background)", border: "1px solid rgba(232,121,160,0.2)", color: "#6B3580" }}
          >
            <option value="">유치원 전체 대상</option>
            {data.classes.map((c) => (
              <option key={c.id} value={c.id}>{c.name} 대상</option>
            ))}
          </select>
        )}
        <div className="flex justify-end gap-2">
          <button onClick={() => setEditing(false)} className="text-xs font-bold px-3 py-2 rounded-full" style={{ color: "#A06080" }}>취소</button>
          <button onClick={handleSave} className="text-xs font-bold px-4 py-2 rounded-full text-white transition-transform active:scale-95"
            style={{ background: "linear-gradient(135deg,#E879A0,#F472B6)" }}>저장</button>
        </div>
      </div>
    );
  }

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
      {canEdit && (
        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={startEdit}
            title="수정"
            className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors hover:bg-black/[0.04]"
          >
            <Pencil className="w-3.5 h-3.5" style={{ color: "#A06080" }} />
          </button>
          <button
            onClick={() =>
              ask({
                title: `'${event.title}' 일정을 삭제할까요?`,
                description: "이 일정을 보고 있던 학부모에게도 더 이상 보이지 않아요. 되돌릴 수 없어요.",
                onConfirm: () => deleteScheduleEvent(event.id),
              })
            }
            title="삭제"
            aria-label={`${event.title} 일정 삭제`}
            className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors hover:bg-black/[0.04]"
          >
            <Trash2 className="w-3.5 h-3.5" style={{ color: "#F87171" }} />
          </button>
        </div>
      )}
      {dialog}
    </div>
  );
}

/** 일정 목록입니다. 선생님/원장은 등록 폼을, 부모/아이는 읽기 전용 목록을 봅니다. */
/** 반 탭 중 "유치원 전체"(반이 지정되지 않은 일정)를 가리키는 값입니다. */
const WHOLE_KINDERGARTEN = "__whole__";

/** 반 탭은 두 개의 특수 탭과 실제 반 id(숫자)를 함께 씁니다. */
type ScheduleTab = "all" | typeof WHOLE_KINDERGARTEN | number;

export function ScheduleFeature() {
  const { user } = useAuth();
  const { data, addScheduleEvent } = useDashboardStore();
  const [view, setView] = useState<"list" | "calendar">("list");
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [composing, setComposing] = useState(false);
  const [title, setTitle] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");

  const canWrite = data.role === "teacher" || data.role === "director";
  const lockedClassId = getLockedClassId(data);
  const showClassTabs = canBrowseAllClasses(data);
  const hasElevatedPermission = teacherHasPermission(data, "manageSchedule");

  // 선생님은 자기 반 탭에서 시작합니다. 원장은 전체를 먼저 봅니다.
  const [activeTab, setActiveTab] = useState<ScheduleTab>(
    () => (data.role === "teacher" ? data.teacher.classId : undefined) ?? "all",
  );

  // 학부모/아이는 탭이 없으므로 항상 자기 반 + 유치원 전체만 봅니다.
  const viewerClassId = lockedClassId ?? (data.role === "teacher" ? data.teacher.classId : undefined);

  const events = useMemo(() => {
    const visible = data.scheduleEvents.filter(
      (e) => !e.classId || e.classId === viewerClassId || showClassTabs,
    );
    const filtered = !showClassTabs || activeTab === "all"
      ? visible
      : activeTab === WHOLE_KINDERGARTEN
        // "유치원 전체" 탭은 반이 지정되지 않은 일정만 봅니다.
        ? visible.filter((e) => !e.classId)
        // 특정 반 탭은 그 반 일정과 함께, 그 반에도 해당되는 유치원 전체 일정을 같이 보여줍니다.
        : visible.filter((e) => e.classId === activeTab || !e.classId);
    return [...filtered].sort((a, b) => a.date.localeCompare(b.date));
  }, [data.scheduleEvents, viewerClassId, showClassTabs, activeTab]);

  /** 새 일정을 어느 반으로 등록할지. 지금 보고 있는 탭을 그대로 따릅니다. */
  const composeClassId =
    data.role === "teacher" && !hasElevatedPermission
      ? data.teacher.classId || undefined // 일반 선생님은 항상 자기 반으로만 등록됩니다.
      : activeTab === "all" || activeTab === WHOLE_KINDERGARTEN
        ? undefined
        : activeTab;

  const composeTargetLabel =
    composeClassId === undefined
      ? "유치원 전체"
      : (data.classes.find((c) => c.id === composeClassId)?.name ?? "우리 반");

  // 지금 탭에 일정을 등록할 수 있는지. "전체"/"유치원 전체" 탭은 반 지정이 없는 일정입니다.
  const canComposeHere =
    canWrite &&
    (composeClassId === undefined
      ? canManageKindergartenWide(data, "manageSchedule")
      : canManageClass(data, composeClassId, "manageSchedule"));

  function handleSubmit() {
    if (!title.trim() || !date || !user) return;
    addScheduleEvent(title.trim(), date, time || undefined, getDisplayName(user), composeClassId);
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
        <div className="flex items-center gap-2">
          <button
            onClick={() => setView((v) => (v === "list" ? "calendar" : "list"))}
            className="flex items-center gap-1 text-xs font-bold px-3 py-1.5 rounded-full transition-colors"
            style={{ background: "rgba(232,121,160,0.12)", color: "#E879A0" }}
          >
            {view === "list" ? (
              <>
                <CalendarDays className="w-3.5 h-3.5" /> 달력 보기
              </>
            ) : (
              <>
                <LayoutList className="w-3.5 h-3.5" /> 목록 보기
              </>
            )}
          </button>
          {view === "list" && canComposeHere && !composing && (
            <button
              onClick={() => setComposing(true)}
              className="flex items-center gap-1 text-xs font-bold px-3 py-1.5 rounded-full text-white transition-transform active:scale-95"
              style={{ background: "linear-gradient(135deg,#E879A0,#F472B6)" }}
            >
              <Plus className="w-3.5 h-3.5" /> 일정 등록
            </button>
          )}
        </div>
      </div>

      {showClassTabs && data.classes.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-4" role="tablist" aria-label="반 선택">
          {([
            { id: "all", name: "전체" },
            { id: WHOLE_KINDERGARTEN, name: "유치원 전체" },
            ...data.classes.map((c) => ({ id: c.id, name: c.name })),
          ] satisfies { id: ScheduleTab; name: string }[]).map((c) => {
            const active = activeTab === c.id;
            return (
              <button
                key={c.id}
                role="tab"
                aria-selected={active}
                onClick={() => {
                  setActiveTab(c.id);
                  setComposing(false); // 탭을 옮기면 등록 대상이 바뀌므로 작성 중이던 폼은 닫습니다.
                }}
                className="text-xs font-bold px-3 py-1.5 rounded-full transition-colors"
                style={
                  active
                    ? { background: "linear-gradient(135deg,#E879A0,#F472B6)", color: "white" }
                    : { background: "#F9FAFB", color: "#9CA3AF", border: "1px solid #F3F4F6" }
                }
              >
                {c.name}
              </button>
            );
          })}
        </div>
      )}

      {view === "list" && canComposeHere && composing && (
        <div className="rounded-2xl bg-card border p-4 mb-4 space-y-2.5" style={{ borderColor: "rgba(232,121,160,0.2)" }}>
          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="일정 제목"
            className="w-full rounded-xl px-3.5 py-2.5 text-sm font-bold outline-none"
            style={{ background: "var(--input-background)", border: "1px solid rgba(232,121,160,0.2)", color: "#3B1355" }} />
          <div className="flex gap-2">
            <div className="flex-1">
              <DatePickerButton value={date} onChange={setDate} />
            </div>
            <div className="flex-1">
              <TimePickerButton value={time} onChange={setTime} />
            </div>
          </div>
          {/* 등록 대상은 지금 보고 있는 탭을 그대로 따릅니다. 별도 선택기를 두면
              탭에서 본 것과 다른 반에 등록되는 혼동이 생깁니다. */}
          <p className="text-xs" style={{ color: "#A06080" }}>
            <strong style={{ color: "#E879A0" }}>{composeTargetLabel}</strong> 일정으로 등록돼요.
            {showClassTabs && " 대상을 바꾸려면 위 탭에서 반을 골라주세요."}
          </p>
          <div className="flex justify-end gap-2">
            <button onClick={() => setComposing(false)} className="text-xs font-bold px-3 py-2 rounded-full" style={{ color: "#A06080" }}>취소</button>
            <button onClick={handleSubmit} className="text-xs font-bold px-4 py-2 rounded-full text-white transition-transform active:scale-95"
              style={{ background: "linear-gradient(135deg,#E879A0,#F472B6)" }}>등록</button>
          </div>
        </div>
      )}

      {view === "list" ? (
        <div className="space-y-2.5">
          {events.length === 0 && <p className="text-sm" style={{ color: "#A06080" }}>등록된 일정이 없어요.</p>}
          {events.map((e) => (
            <EventRow
              key={e.id}
              event={e}
              // 반 일정은 그 반 담당자만, 유치원 전체 일정은 원장(또는 전체 반 권한자)만 고칩니다.
              canEdit={
                e.classId
                  ? canManageClass(data, e.classId, "manageSchedule")
                  : canManageKindergartenWide(data, "manageSchedule")
              }
            />
          ))}
        </div>
      ) : (
        <CalendarMonthView events={events} onSelectDate={setSelectedDate} />
      )}

      <DayEventDialog dateStr={selectedDate} onClose={() => setSelectedDate(null)} />
    </div>
  );
}
