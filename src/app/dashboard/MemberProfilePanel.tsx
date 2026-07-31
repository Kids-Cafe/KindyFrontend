import { useEffect, useRef, useState } from "react";
import { Send, Pencil, Check } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/app/components/ui/sheet";
import { useAuth } from "@/app/auth/AuthContext";
import { getDisplayName } from "@/app/auth/getDisplayName";
import { useDashboardStore } from "@/app/dashboard/DashboardStoreContext";

function formatTime(ms: number): string {
  const d = new Date(ms);
  return `${d.getHours().toString().padStart(2, "0")}:${d.getMinutes().toString().padStart(2, "0")}`;
}

/**
 * 원장 화면의 우측 멤버 목록에서 교사를 클릭했을 때 뜨는 프로필 사이드 패널입니다.
 * 원장은 별칭/권한을 그 자리에서 바로 편집할 수 있고, 누구나 이 패널에서 해당 교사에게
 * 바로 메시지를 보낼 수 있습니다(본인 자신은 제외).
 */
export function MemberProfilePanel({ teacherId, onClose }: { teacherId: string | null; onClose: () => void }) {
  const { user } = useAuth();
  const { data, updateTeacherNickname, assignTeacherRole, sendMemberMessage } = useDashboardStore();
  const teacher = data.teachers.find((t) => t.id === teacherId);
  const canEdit = data.role === "director";
  const isSelf = teacher?.id === user?.id;

  const [nicknameDraft, setNicknameDraft] = useState("");
  const [editingNickname, setEditingNickname] = useState(false);
  const [input, setInput] = useState("");
  const endRef = useRef<HTMLDivElement>(null);

  const thread = teacherId ? data.memberThreadsByTeacher[teacherId] : undefined;

  useEffect(() => {
    if (teacher) setNicknameDraft(teacher.nickname ?? teacher.name);
    setEditingNickname(false);
  }, [teacher?.id]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [thread?.messages.length]);

  function saveNickname() {
    if (!teacher) return;
    updateTeacherNickname(teacher.id, nicknameDraft);
    setEditingNickname(false);
  }

  function handleSend() {
    if (!teacher || !user || !input.trim()) return;
    sendMemberMessage(teacher.id, canEdit ? "director" : "teacher", getDisplayName(user), input);
    setInput("");
  }

  return (
    <Sheet open={Boolean(teacherId)} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="flex flex-col w-full sm:max-w-sm p-0">
        {teacher && (
          <>
            <SheetHeader className="border-b" style={{ borderColor: "rgba(232,121,160,0.15)" }}>
              <SheetTitle className="sr-only">{teacher.nickname || teacher.name} 프로필</SheetTitle>
              <div className="flex items-center gap-3">
                <span
                  className="w-14 h-14 rounded-full flex items-center justify-center text-xl font-bold text-white shrink-0"
                  style={{ background: "linear-gradient(135deg,#60A5FA,#3B82F6)" }}
                >
                  {(teacher.nickname || teacher.name).charAt(0)}
                </span>
                <div className="min-w-0 flex-1">
                  {editingNickname ? (
                    <div className="flex items-center gap-1.5">
                      <input
                        autoFocus
                        value={nicknameDraft}
                        onChange={(e) => setNicknameDraft(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && saveNickname()}
                        className="min-w-0 flex-1 rounded-lg px-2 py-1 text-sm font-bold outline-none"
                        style={{ background: "var(--input-background)", border: "1px solid rgba(232,121,160,0.3)", color: "#3B1355" }}
                      />
                      <button onClick={saveNickname} className="w-6 h-6 rounded-lg flex items-center justify-center shrink-0" style={{ background: "rgba(232,121,160,0.15)" }}>
                        <Check className="w-3.5 h-3.5" style={{ color: "#E879A0" }} />
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5">
                      <p className="text-base font-bold truncate" style={{ color: "#3B1355" }}>{teacher.nickname || teacher.name}</p>
                      {canEdit && (
                        <button onClick={() => setEditingNickname(true)} className="w-5 h-5 rounded flex items-center justify-center shrink-0 transition-colors hover:bg-black/[0.04]">
                          <Pencil className="w-3 h-3" style={{ color: "#A06080" }} />
                        </button>
                      )}
                    </div>
                  )}
                  {teacher.nickname && <p className="text-xs truncate" style={{ color: "#A06080" }}>{teacher.name}</p>}
                  <p className="text-xs truncate" style={{ color: "#A06080" }}>{teacher.className || "유치원 소속"}</p>
                </div>
              </div>
            </SheetHeader>

            <div className="px-4 pt-3">
              <p className="text-xs font-bold mb-2" style={{ color: "#E879A0" }}>권한 역할</p>
              <div className="flex flex-wrap gap-1.5 mb-1">
                {data.roles.length === 0 && <p className="text-xs" style={{ color: "#A06080" }}>아직 만들어진 역할이 없어요.</p>}
                {data.roles.map((role) => {
                  const assigned = teacher.roleIds.includes(role.id);
                  const chip = (
                    <span
                      className="text-xs font-bold px-2.5 py-1 rounded-full transition-all"
                      style={assigned ? { background: role.color, color: "white" } : { background: "#F9FAFB", color: "#9CA3AF", border: "1px solid #F3F4F6" }}
                    >
                      {role.name}
                    </span>
                  );
                  return canEdit ? (
                    <button key={role.id} onClick={() => assignTeacherRole(teacher.id, role.id, !assigned)}>
                      {chip}
                    </button>
                  ) : (
                    <span key={role.id}>{assigned ? chip : null}</span>
                  );
                })}
              </div>
            </div>

            {!isSelf && (
              <div className="flex-1 min-h-0 flex flex-col px-4 pt-4">
                <p className="text-xs font-bold mb-2" style={{ color: "#E879A0" }}>메시지</p>
                <div className="flex-1 overflow-y-auto space-y-3 pr-1 pb-3">
                  {(thread?.messages ?? []).map((msg) => {
                    const isMine = msg.sender === (canEdit ? "director" : "teacher");
                    return (
                      <div key={msg.id} className={`flex flex-col ${isMine ? "items-end" : "items-start"}`}>
                        <div
                          className="max-w-[85%] rounded-2xl px-3.5 py-2 text-sm leading-relaxed"
                          style={isMine
                            ? { background: "linear-gradient(135deg,#E879A0,#F472B6)", color: "white", borderTopRightRadius: 4 }
                            : { background: "var(--card)", border: "1px solid rgba(232,121,160,0.18)", color: "#3B1355", borderTopLeftRadius: 4 }}
                        >
                          {msg.text}
                        </div>
                        <p className="text-xs mt-1 px-1" style={{ color: "#C0A0B5" }}>{msg.senderName} · {formatTime(msg.time)}</p>
                      </div>
                    );
                  })}
                  <div ref={endRef} />
                </div>

                <div className="shrink-0 pb-4 flex items-center gap-2">
                  <input
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && !e.nativeEvent.isComposing && handleSend()}
                    placeholder={`${teacher.nickname || teacher.name}님께 메시지 보내기`}
                    className="flex-1 rounded-full px-4 py-2.5 text-sm outline-none"
                    style={{ background: "var(--input-background)", border: "1px solid rgba(232,121,160,0.2)" }}
                  />
                  <button
                    onClick={handleSend}
                    className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 transition-transform active:scale-90"
                    style={{ background: "linear-gradient(135deg,#E879A0,#F472B6)" }}
                  >
                    <Send className="w-4 h-4 text-white" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
