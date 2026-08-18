import { useState } from "react";
import { Backpack, Plus, MessageCircle } from "lucide-react";
import { useDashboardStore } from "@/app/dashboard/DashboardStoreContext";
import { useAuth } from "@/app/auth/AuthContext";
import { getDisplayName } from "@/app/auth/getDisplayName";
import { DatePickerButton } from "@/app/dashboard/features/DatePickerButton";

function formatDate(ms: number): string {
  const d = new Date(ms);
  return `${d.getMonth() + 1}월 ${d.getDate()}일`;
}

function CommentBox({ classId, supplyId }: { classId: number; supplyId: number }) {
  const { user } = useAuth();
  const { data, addSupplyComment } = useDashboardStore();
  const [text, setText] = useState("");

  function submit() {
    if (!text.trim() || !user) return;
    addSupplyComment(classId, supplyId, getDisplayName(user), data.role, text);
    setText("");
  }

  return (
    <div className="flex items-center gap-2 mt-1">
      <input
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && submit()}
        placeholder="댓글을 남겨보세요"
        className="flex-1 rounded-full px-3 py-1.5 text-xs outline-none"
        style={{ background: "var(--input-background)", border: "1px solid rgba(232,121,160,0.2)" }}
      />
      <button
        onClick={submit}
        className="text-xs font-bold px-3 py-1.5 rounded-full text-white shrink-0"
        style={{ background: "linear-gradient(135deg,#E879A0,#F472B6)" }}
      >
        등록
      </button>
    </div>
  );
}

/**
 * 반별 준비물 안내입니다. 선생님/원장은 작성 폼을 볼 수 있고,
 * 부모는 읽기 + 댓글 작성, 아이는 읽기 전용입니다.
 */
export function SuppliesFeature() {
  const { user } = useAuth();
  const { data, addSupplyItem } = useDashboardStore();
  const [classId, setClassId] = useState(() => data.teacher.classId);
  const [composing, setComposing] = useState(false);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [dueDate, setDueDate] = useState("");

  const canWrite = data.role === "teacher" || data.role === "director";
  const canComment = data.role === "parent";
  const activeClassId = data.role === "parent" ? data.myChild?.classId ?? classId
    : data.role === "child" ? data.me?.classId ?? classId
    : data.role === "teacher" ? data.teacher.classId
    : classId;

  const activeClassName = data.classes.find((c) => c.id === activeClassId)?.name ?? data.teacher.className;
  // 아직 어떤 반에도 속하지 않은 계정(반 배정 전 교사 등)은 보여줄 준비물이 없습니다.
  const items = activeClassId === undefined ? [] : data.suppliesByClass[activeClassId] ?? [];

  function handleSubmit() {
    if (!title.trim() || !body.trim() || !user || activeClassId === undefined) return;
    addSupplyItem(activeClassId, title.trim(), body.trim(), getDisplayName(user), dueDate || undefined);
    setTitle("");
    setBody("");
    setDueDate("");
    setComposing(false);
  }

  return (
    <div className="max-w-2xl">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2 text-xs font-bold" style={{ color: "#E879A0" }}>
          <Backpack className="w-3.5 h-3.5" />
          {activeClassName} 준비물
        </div>
        {canWrite && !composing && (
          <button
            onClick={() => setComposing(true)}
            className="flex items-center gap-1 text-xs font-bold px-3 py-1.5 rounded-full text-white transition-transform active:scale-95"
            style={{ background: "linear-gradient(135deg,#E879A0,#F472B6)" }}
          >
            <Plus className="w-3.5 h-3.5" /> 준비물 작성
          </button>
        )}
      </div>

      {data.role === "director" && (
        <div className="flex gap-2 flex-wrap mb-4">
          {data.classes.map((c) => (
            <button
              key={c.id}
              onClick={() => setClassId(c.id)}
              className="px-3 py-1.5 rounded-full text-xs font-bold transition-all"
              style={activeClassId === c.id
                ? { background: "linear-gradient(135deg,#E879A0,#F472B6)", color: "white" }
                : { background: "var(--muted)", color: "#6B3580" }}
            >
              {c.name}
            </button>
          ))}
        </div>
      )}

      {canWrite && composing && (
        <div className="rounded-2xl bg-card border p-4 mb-4 space-y-2.5" style={{ borderColor: "rgba(232,121,160,0.2)" }}>
          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="제목"
            className="w-full rounded-xl px-3.5 py-2.5 text-sm font-bold outline-none"
            style={{ background: "var(--input-background)", border: "1px solid rgba(232,121,160,0.2)", color: "#3B1355" }} />
          <textarea value={body} onChange={(e) => setBody(e.target.value)} placeholder="준비물 내용을 입력하세요" rows={3}
            className="w-full rounded-xl px-3.5 py-2.5 text-sm outline-none resize-none"
            style={{ background: "var(--input-background)", border: "1px solid rgba(232,121,160,0.2)", color: "#3B1355" }} />
          {/* 네이티브 <input type="date">는 Safari·Firefox에서 전혀 다르게 그려지고,
              iOS에서는 16px 미만 글꼴이면 포커스 시 화면이 강제로 확대됩니다.
              일정 화면과 같은 커스텀 피커를 써서 어느 브라우저에서나 동일하게 보이게 합니다. */}
          <div className="max-w-[220px]">
            <DatePickerButton value={dueDate} onChange={setDueDate} />
          </div>
          <div className="flex justify-end gap-2">
            <button onClick={() => setComposing(false)} className="text-xs font-bold px-3 py-2 rounded-full" style={{ color: "#A06080" }}>취소</button>
            <button onClick={handleSubmit} className="text-xs font-bold px-4 py-2 rounded-full text-white transition-transform active:scale-95"
              style={{ background: "linear-gradient(135deg,#E879A0,#F472B6)" }}>등록</button>
          </div>
        </div>
      )}

      <div className="space-y-3">
        {items.length === 0 && <p className="text-sm" style={{ color: "#A06080" }}>등록된 준비물이 없어요.</p>}
        {items.map((item) => (
          <div key={item.id} className="rounded-2xl bg-card border p-4" style={{ borderColor: "rgba(232,121,160,0.15)" }}>
            <div className="flex items-center justify-between">
              <p className="font-bold text-sm" style={{ color: "#3B1355" }}>{item.title}</p>
              {item.dueDate && <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ background: "#FEF3C7", color: "#92400E" }}>~{item.dueDate.slice(5).replace("-", "/")}</span>}
            </div>
            <p className="text-xs mt-1" style={{ color: "#A06080" }}>{item.authorName} · {formatDate(item.createdAt)}</p>
            <p className="text-xs leading-relaxed mt-2" style={{ color: "#6B3580" }}>{item.body}</p>

            {item.comments.length > 0 && (
              <div className="mt-3 pt-3 border-t space-y-2" style={{ borderColor: "rgba(232,121,160,0.1)" }}>
                {item.comments.map((c) => (
                  <div key={c.id} className="flex items-start gap-1.5 text-xs">
                    <MessageCircle className="w-3 h-3 mt-0.5 shrink-0" style={{ color: "#C084FC" }} />
                    <p><span className="font-bold" style={{ color: "#3B1355" }}>{c.authorName}</span> <span style={{ color: "#6B3580" }}>{c.text}</span></p>
                  </div>
                ))}
              </div>
            )}

            {canComment && activeClassId !== undefined && <CommentBox classId={activeClassId} supplyId={item.id} />}
          </div>
        ))}
      </div>
    </div>
  );
}
