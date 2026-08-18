import { useState } from "react";
import { School, Plus, Pencil, Trash2, Check, X } from "lucide-react";
import { useDashboardStore } from "@/app/dashboard/DashboardStoreContext";
import { useConfirm } from "@/app/components/ConfirmDialog";

/** 원장 전용: 반 생성/이름변경/삭제 화면입니다. */
export function ClassManageFeature() {
  const { data, addClass, renameClass, deleteClass } = useDashboardStore();
  const { ask, dialog } = useConfirm();
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingName, setEditingName] = useState("");

  function countChildren(classId: number): number {
    return data.classChildren.filter((c) => c.classId === classId).length;
  }

  function startEdit(classId: number, current: string) {
    setEditingId(classId);
    setEditingName(current);
  }

  function commitEdit() {
    if (editingId && editingName.trim()) renameClass(editingId, editingName.trim());
    setEditingId(null);
  }

  return (
    <div className="max-w-2xl">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2 text-xs font-bold" style={{ color: "#E879A0" }}>
          <School className="w-3.5 h-3.5" />
          {data.kindergarten.name} 반 관리
        </div>
        {!creating && (
          <button
            onClick={() => setCreating(true)}
            className="flex items-center gap-1 text-xs font-bold px-3 py-1.5 rounded-full text-white transition-transform active:scale-95"
            style={{ background: "linear-gradient(135deg,#E879A0,#F472B6)" }}
          >
            <Plus className="w-3.5 h-3.5" /> 반 추가
          </button>
        )}
      </div>

      {creating && (
        <div className="flex items-center gap-2 mb-4">
          <input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="예: 튤립반"
            autoFocus
            className="flex-1 rounded-xl px-3.5 py-2.5 text-sm outline-none"
            style={{ background: "var(--input-background)", border: "1px solid rgba(232,121,160,0.2)", color: "#3B1355" }}
          />
          <button onClick={() => { if (newName.trim()) addClass(newName.trim()); setNewName(""); setCreating(false); }}
            className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: "#DCFCE7" }}>
            <Check className="w-4 h-4" style={{ color: "#166534" }} />
          </button>
          <button onClick={() => { setCreating(false); setNewName(""); }} className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: "#F3F4F6" }}>
            <X className="w-4 h-4" style={{ color: "#6B7280" }} />
          </button>
        </div>
      )}

      <div className="space-y-2.5">
        {data.classes.map((c) => (
          <div key={c.id} className="flex items-center gap-3 rounded-2xl bg-card border p-4" style={{ borderColor: "rgba(232,121,160,0.15)" }}>
            {editingId === c.id ? (
              <input
                value={editingName}
                onChange={(e) => setEditingName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && commitEdit()}
                autoFocus
                className="flex-1 rounded-xl px-3 py-1.5 text-sm font-bold outline-none"
                style={{ background: "var(--input-background)", border: "1px solid rgba(232,121,160,0.2)", color: "#3B1355" }}
              />
            ) : (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold" style={{ color: "#3B1355" }}>{c.name}</p>
                <p className="text-xs" style={{ color: "#A06080" }}>학생 {countChildren(c.id)}명</p>
              </div>
            )}
            <div className="flex items-center gap-1 shrink-0">
              {editingId === c.id ? (
                <button onClick={commitEdit} className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors hover:bg-black/[0.04]">
                  <Check className="w-4 h-4" style={{ color: "#22C55E" }} />
                </button>
              ) : (
                <button onClick={() => startEdit(c.id, c.name)} className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors hover:bg-black/[0.04]">
                  <Pencil className="w-3.5 h-3.5" style={{ color: "#A06080" }} />
                </button>
              )}
              <button
                onClick={() =>
                  ask({
                    title: `'${c.name}' 반을 삭제할까요?`,
                    description:
                      countChildren(c.id) > 0
                        ? `이 반에 배정된 학생 ${countChildren(c.id)}명의 반 정보도 함께 사라져요. 되돌릴 수 없어요.`
                        : "되돌릴 수 없어요.",
                    onConfirm: () => deleteClass(c.id),
                  })
                }
                aria-label={`${c.name} 반 삭제`}
                className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors hover:bg-black/[0.04]"
              >
                <Trash2 className="w-3.5 h-3.5" style={{ color: "#F87171" }} />
              </button>
            </div>
          </div>
        ))}
      </div>
      {dialog}
    </div>
  );
}
