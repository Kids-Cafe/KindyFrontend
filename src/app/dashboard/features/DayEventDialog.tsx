import { useEffect, useState } from "react";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/app/components/ui/dialog";
import { useDashboardStore } from "@/app/dashboard/DashboardStoreContext";
import { useAuth } from "@/app/auth/AuthContext";
import { getDisplayName } from "@/app/auth/getDisplayName";
import { TimePickerButton } from "@/app/dashboard/features/TimePickerButton";
import type { ScheduleEvent } from "@/app/dashboard/types";
import { useConfirm } from "@/app/components/ConfirmDialog";

function formatDateLabel(dateStr: string): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  const weekday = ["일", "월", "화", "수", "목", "금", "토"][new Date(y, m - 1, d).getDay()];
  return `${y}년 ${m}월 ${d}일 (${weekday})`;
}

const EMPTY_FORM = { title: "", time: "", classId: undefined as string | undefined };

/**
 * 달력 칸을 클릭했을 때 뜨는 팝업입니다. 해당 날짜의 일정을 보여주고, 원장/선생님(`canWrite`)은
 * 그 안에서 바로 등록·수정·삭제까지 처리합니다. 선생님은 본인 반 일정만 쓰고 지울 수 있습니다.
 */
export function DayEventDialog({ dateStr, onClose }: { dateStr: string | null; onClose: () => void }) {
  const { user } = useAuth();
  const { data, addScheduleEvent, updateScheduleEvent, deleteScheduleEvent } = useDashboardStore();
  const { ask, dialog } = useConfirm();
  const [mode, setMode] = useState<"list" | "new" | string>("list");
  const [form, setForm] = useState(EMPTY_FORM);

  useEffect(() => {
    setMode("list");
    setForm(EMPTY_FORM);
  }, [dateStr]);

  const isDirector = data.role === "director";
  const isTeacher = data.role === "teacher";
  const canWrite = isDirector || isTeacher;
  const myClassId = isTeacher ? data.teacher.classId : undefined;

  const viewerClassId =
    data.role === "teacher" ? data.teacher.classId
    : data.role === "parent" ? data.myChild?.classId
    : data.role === "child" ? data.me?.classId
    : undefined;

  const dayEvents = dateStr
    ? data.scheduleEvents
        .filter((e) => e.date === dateStr)
        .filter((e) => !e.classId || e.classId === viewerClassId || isDirector)
        .sort((a, b) => (a.time ?? "").localeCompare(b.time ?? ""))
    : [];

  function canEdit(e: ScheduleEvent): boolean {
    if (isDirector) return true;
    if (isTeacher) return e.classId === myClassId;
    return false;
  }

  function startNew() {
    setForm({ title: "", time: "", classId: isTeacher ? myClassId : undefined });
    setMode("new");
  }

  function startEdit(e: ScheduleEvent) {
    setForm({ title: e.title, time: e.time ?? "", classId: e.classId });
    setMode(e.id);
  }

  function handleSave() {
    if (!dateStr || !form.title.trim() || !user) return;
    const classId = isTeacher ? myClassId : form.classId;
    if (mode === "new") {
      addScheduleEvent(form.title.trim(), dateStr, form.time || undefined, getDisplayName(user), classId);
    } else if (mode !== "list") {
      updateScheduleEvent(mode, form.title.trim(), dateStr, form.time || undefined, classId);
    }
    setMode("list");
    setForm(EMPTY_FORM);
  }

  function handleDelete(event: ScheduleEvent) {
    ask({
      title: `'${event.title}' 일정을 삭제할까요?`,
      description: "이 일정을 보고 있던 학부모에게도 더 이상 보이지 않아요. 되돌릴 수 없어요.",
      onConfirm: () => {
        deleteScheduleEvent(event.id);
        if (mode === event.id) setMode("list");
      },
    });
  }

  const editing = mode !== "list" && mode !== "new";

  return (
    <Dialog open={Boolean(dateStr)} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md rounded-3xl">
        <DialogHeader>
          <DialogTitle style={{ color: "#3B1355" }}>{dateStr ? formatDateLabel(dateStr) : ""}</DialogTitle>
        </DialogHeader>

        <div className="space-y-2.5">
          {mode === "list" && (
            <>
              {dayEvents.length === 0 && <p className="text-sm" style={{ color: "#A06080" }}>등록된 일정이 없어요.</p>}
              {dayEvents.map((e) => (
                <div key={e.id} className="rounded-2xl bg-card border p-3.5" style={{ borderColor: "rgba(232,121,160,0.15)" }}>
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-sm font-bold truncate" style={{ color: "#3B1355" }}>{e.title}</p>
                      <p className="text-xs mt-0.5" style={{ color: "#A06080" }}>
                        {e.time ? `${e.time} · ` : ""}{e.classId ? "우리 반" : "유치원 전체"} · {e.createdBy}
                      </p>
                    </div>
                    {canEdit(e) && (
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          onClick={() => startEdit(e)}
                          title="수정"
                          className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors hover:bg-black/[0.04]"
                        >
                          <Pencil className="w-3.5 h-3.5" style={{ color: "#A06080" }} />
                        </button>
                        <button
                          onClick={() => handleDelete(e)}
                          title="삭제"
                          aria-label={`${e.title} 일정 삭제`}
                          className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors hover:bg-black/[0.04]"
                        >
                          <Trash2 className="w-3.5 h-3.5" style={{ color: "#F87171" }} />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {canWrite && (
                <button
                  onClick={startNew}
                  className="w-full flex items-center justify-center gap-1 text-xs font-bold px-3 py-2.5 rounded-full text-white transition-transform active:scale-95"
                  style={{ background: "linear-gradient(135deg,#E879A0,#F472B6)" }}
                >
                  <Plus className="w-3.5 h-3.5" /> 이 날짜에 일정 등록
                </button>
              )}
            </>
          )}

          {canWrite && (mode === "new" || editing) && (
            <div className="rounded-2xl bg-card border p-4 space-y-2.5" style={{ borderColor: "rgba(232,121,160,0.2)" }}>
              <input
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                placeholder="일정 제목"
                className="w-full rounded-xl px-3.5 py-2.5 text-sm font-bold outline-none"
                style={{ background: "var(--input-background)", border: "1px solid rgba(232,121,160,0.2)", color: "#3B1355" }}
              />
              <TimePickerButton value={form.time} onChange={(time) => setForm((f) => ({ ...f, time }))} />
              {isDirector && (
                <select
                  value={form.classId ?? ""}
                  onChange={(e) => setForm((f) => ({ ...f, classId: e.target.value || undefined }))}
                  className="w-full rounded-xl px-3.5 py-2 text-xs outline-none"
                  style={{ background: "var(--input-background)", border: "1px solid rgba(232,121,160,0.2)", color: "#6B3580" }}
                >
                  <option value="">유치원 전체 대상</option>
                  {data.classes.map((c) => (
                    <option key={c.id} value={c.id}>{c.name} 대상</option>
                  ))}
                </select>
              )}
              {isTeacher && (
                <p className="text-xs" style={{ color: "#A06080" }}>{data.teacher.className} 반 일정으로 등록돼요.</p>
              )}
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => { setMode("list"); setForm(EMPTY_FORM); }}
                  className="text-xs font-bold px-3 py-2 rounded-full"
                  style={{ color: "#A06080" }}
                >
                  취소
                </button>
                <button
                  onClick={handleSave}
                  className="text-xs font-bold px-4 py-2 rounded-full text-white transition-transform active:scale-95"
                  style={{ background: "linear-gradient(135deg,#E879A0,#F472B6)" }}
                >
                  {mode === "new" ? "등록" : "저장"}
                </button>
              </div>
            </div>
          )}
        </div>
        {dialog}
      </DialogContent>
    </Dialog>
  );
}
