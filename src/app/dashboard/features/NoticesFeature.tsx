import { useState } from "react";
import { Megaphone, Pin, Trash2, Plus } from "lucide-react";
import { useDashboardStore } from "@/app/dashboard/DashboardStoreContext";
import { useAuth } from "@/app/auth/AuthContext";
import { getDisplayName } from "@/app/auth/getDisplayName";

function formatDateTime(ms: number): string {
  const d = new Date(ms);
  return `${d.getFullYear()}.${(d.getMonth() + 1).toString().padStart(2, "0")}.${d.getDate().toString().padStart(2, "0")}`;
}

/**
 * 유치원 공지사항 목록입니다. `canManage`가 켜지면(원장 전용) 작성/고정/삭제 컨트롤이 함께 표시되고,
 * 그 외 역할(선생님/부모/아이)에서는 읽기 전용 목록으로만 씁니다.
 */
export function NoticesFeature({ canManage = false }: { canManage?: boolean }) {
  const { user } = useAuth();
  const { data, addNotice, togglePinNotice, deleteNotice } = useDashboardStore();
  const [composing, setComposing] = useState(false);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");

  const sorted = [...data.notices].sort((a, b) => (a.pinned === b.pinned ? b.createdAt - a.createdAt : a.pinned ? -1 : 1));

  function handleSubmit() {
    if (!title.trim() || !body.trim() || !user) return;
    addNotice(title.trim(), body.trim(), getDisplayName(user));
    setTitle("");
    setBody("");
    setComposing(false);
  }

  return (
    <div className="max-w-2xl">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2 text-xs font-bold" style={{ color: "#E879A0" }}>
          <Megaphone className="w-3.5 h-3.5" />
          {data.kindergarten.name} 공지사항
        </div>
        {canManage && !composing && (
          <button
            onClick={() => setComposing(true)}
            className="flex items-center gap-1 text-xs font-bold px-3 py-1.5 rounded-full text-white transition-transform active:scale-95"
            style={{ background: "linear-gradient(135deg,#E879A0,#F472B6)" }}
          >
            <Plus className="w-3.5 h-3.5" /> 공지 작성
          </button>
        )}
      </div>

      {canManage && composing && (
        <div className="rounded-2xl bg-card border p-4 mb-4 space-y-2.5" style={{ borderColor: "rgba(232,121,160,0.2)" }}>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="제목"
            className="w-full rounded-xl px-3.5 py-2.5 text-sm font-bold outline-none"
            style={{ background: "var(--input-background)", border: "1px solid rgba(232,121,160,0.2)", color: "#3B1355" }}
          />
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="내용을 입력하세요"
            rows={3}
            className="w-full rounded-xl px-3.5 py-2.5 text-sm outline-none resize-none"
            style={{ background: "var(--input-background)", border: "1px solid rgba(232,121,160,0.2)", color: "#3B1355" }}
          />
          <div className="flex justify-end gap-2">
            <button onClick={() => setComposing(false)} className="text-xs font-bold px-3 py-2 rounded-full" style={{ color: "#A06080" }}>
              취소
            </button>
            <button
              onClick={handleSubmit}
              className="text-xs font-bold px-4 py-2 rounded-full text-white transition-transform active:scale-95"
              style={{ background: "linear-gradient(135deg,#E879A0,#F472B6)" }}
            >
              등록
            </button>
          </div>
        </div>
      )}

      <div className="space-y-3">
        {sorted.length === 0 && <p className="text-sm" style={{ color: "#A06080" }}>등록된 공지사항이 없어요.</p>}
        {sorted.map((notice) => (
          <div key={notice.id} className="rounded-2xl bg-card border p-4" style={{ borderColor: "rgba(232,121,160,0.15)" }}>
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 mb-1">
                  {notice.pinned && <Pin className="w-3 h-3 shrink-0" style={{ color: "#E879A0" }} />}
                  <p className="font-bold text-sm truncate" style={{ color: "#3B1355" }}>{notice.title}</p>
                </div>
                <p className="text-xs" style={{ color: "#A06080" }}>{notice.authorName} · {formatDateTime(notice.createdAt)}</p>
              </div>
              {canManage && (
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => togglePinNotice(notice.id)}
                    title={notice.pinned ? "고정 해제" : "상단 고정"}
                    className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors hover:bg-black/[0.04]"
                  >
                    <Pin className="w-3.5 h-3.5" style={{ color: notice.pinned ? "#E879A0" : "#D1D5DB" }} />
                  </button>
                  <button
                    onClick={() => deleteNotice(notice.id)}
                    title="삭제"
                    className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors hover:bg-black/[0.04]"
                  >
                    <Trash2 className="w-3.5 h-3.5" style={{ color: "#F87171" }} />
                  </button>
                </div>
              )}
            </div>
            <p className="text-xs leading-relaxed mt-2.5" style={{ color: "#6B3580" }}>{notice.body}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
