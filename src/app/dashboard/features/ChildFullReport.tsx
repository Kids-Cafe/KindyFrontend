import { useState } from "react";
import { Sparkles, MessagesSquare, Phone, Send } from "lucide-react";
import { useDashboardStore } from "@/app/dashboard/DashboardStoreContext";
import { useAuth } from "@/app/auth/AuthContext";
import { getDisplayName } from "@/app/auth/getDisplayName";
import { REPORT_CATEGORY_ORDER, REPORT_META } from "@/app/dashboard/reportMeta";
import { ReportByCategory } from "@/app/dashboard/reports";
import type { ChildRecord } from "@/app/dashboard/types";

// 키가 한글이라 따옴표로 감쌉니다. 식별자로 그냥 쓰면 유효하긴 하지만
// 편집기·도구에 따라 비 ASCII 식별자 경고가 붙습니다.
const TRAIT_TIPS: Record<string, string> = {
  "사교성": "친구들과의 놀이를 더 많이 만들어주면 사회성이 한층 더 자랄 거예요.",
  "창의성": '정답이 없는 열린 질문("이건 왜 이럴까?")을 자주 던져보세요.',
  "집중력": "짧은 시간이라도 방해받지 않는 몰입 놀이 시간을 마련해주세요.",
  "활동성": "충분히 뛰어놀 수 있는 바깥 활동을 자주 계획해주세요.",
  "감수성": "감정을 표현했을 때 판단 없이 먼저 들어주는 것이 큰 도움이 돼요.",
};

function formatDateTime(ms: number): string {
  const d = new Date(ms);
  return `${d.getMonth() + 1}월 ${d.getDate()}일`;
}

function SectionHeading({ icon: Icon, children }: { icon: typeof Sparkles; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2 mb-3 mt-8 first:mt-0">
      <Icon className="w-4 h-4" style={{ color: "#E879A0" }} />
      <h2 className="text-sm font-bold" style={{ color: "#3B1355" }}>{children}</h2>
    </div>
  );
}

/**
 * 아이 한 명의 전체 리포트를 "탭으로 골라보는 방식"이 아니라 하나의 연속된 스크롤로 합쳐 보여줍니다.
 * 최근 일기 전체, AI 파트너 분석/팁, 5종 성장 리포트, (선생님 시점 한정) 부모 전용 의견과 부모 정보까지
 * 한 화면에서 스크랩하듯 훑어볼 수 있습니다.
 */
export function ChildFullReport({ child, viewerRole }: { child: ChildRecord; viewerRole: "teacher" | "parent" }) {
  const { user } = useAuth();
  const { data, addParentNote, addParentNoteComment } = useDashboardStore();
  const [noteText, setNoteText] = useState("");
  const [commentDrafts, setCommentDrafts] = useState<Record<string, string>>({});

  const reports = data.reportsByChild[child.id];
  const notes = data.parentNotesByChild[child.id] ?? [];
  if (!reports) return null;

  const topTraits = [...reports.personality.traits].sort((a, b) => b.value - a.value).slice(0, 2);

  function submitNote() {
    if (!noteText.trim() || !user) return;
    addParentNote(child.id, getDisplayName(user), noteText);
    setNoteText("");
  }

  function submitComment(noteId: number) {
    const text = commentDrafts[noteId] ?? "";
    if (!text.trim() || !user) return;
    addParentNoteComment(child.id, noteId, getDisplayName(user), data.role, text);
    setCommentDrafts((prev) => ({ ...prev, [noteId]: "" }));
  }

  return (
    <div className="max-w-2xl pb-10">
      <div className="flex items-center gap-3 mb-2">
        <span className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shrink-0" style={{ background: child.avatarColor }}>{child.avatarEmoji}</span>
        <div>
          <p className="font-bold text-base" style={{ color: "#3B1355" }}>
            {child.nickname}{child.age ? ` · ${child.age}세` : ""}
          </p>
          <p className="text-xs" style={{ color: "#A06080" }}>{child.className}</p>
        </div>
      </div>

      <SectionHeading icon={Sparkles}>AI 파트너 분석 & 팁</SectionHeading>
      <div className="rounded-2xl p-4" style={{ background: "linear-gradient(135deg,#FCE7F3,#EDE9FE)" }}>
        <p className="text-xs font-bold mb-1" style={{ color: "#E879A0" }}>{reports.personality.mbtiLike}</p>
        <p className="text-xs leading-relaxed" style={{ color: "#6B3580" }}>{reports.personality.summary}</p>
        <div className="mt-3 space-y-1.5">
          {topTraits.map((t) => (
            <p key={t.trait} className="text-xs leading-relaxed" style={{ color: "#6B3580" }}>
              <span className="font-bold" style={{ color: "#3B1355" }}>{t.trait} 팁</span> · {TRAIT_TIPS[t.trait] ?? "꾸준한 관심과 격려가 큰 힘이 돼요."}
            </p>
          ))}
        </div>
      </div>

      {REPORT_CATEGORY_ORDER.map((category) => (
        <div key={category}>
          <SectionHeading icon={REPORT_META[category].icon}>{REPORT_META[category].label}</SectionHeading>
          <ReportByCategory category={category} reports={reports} />
        </div>
      ))}

      <SectionHeading icon={MessagesSquare}>{viewerRole === "teacher" ? "부모님만 볼 수 있는 이야기" : "선생님이 남긴 이야기"}</SectionHeading>
      <div className="space-y-2.5">
        {notes.length === 0 && <p className="text-sm" style={{ color: "#A06080" }}>아직 등록된 이야기가 없어요.</p>}
        {notes.map((note) => (
          <div key={note.id} className="rounded-2xl bg-card border p-4" style={{ borderColor: "rgba(232,121,160,0.15)" }}>
            <p className="text-xs font-bold mb-1" style={{ color: "#A06080" }}>{note.authorName} · {formatDateTime(note.createdAt)}</p>
            <p className="text-xs leading-relaxed" style={{ color: "#6B3580" }}>{note.text}</p>

            {note.comments.length > 0 && (
              <div className="mt-3 pt-3 space-y-2" style={{ borderTop: "1px solid rgba(232,121,160,0.12)" }}>
                {note.comments.map((c) => (
                  <div key={c.id}>
                    <p className="text-[11px] font-bold" style={{ color: "#A06080" }}>{c.authorName} · {formatDateTime(c.createdAt)}</p>
                    <p className="text-xs leading-relaxed" style={{ color: "#6B3580" }}>{c.text}</p>
                  </div>
                ))}
              </div>
            )}

            <div className="flex items-center gap-1.5 mt-3">
              <input
                value={commentDrafts[note.id] ?? ""}
                onChange={(e) => setCommentDrafts((prev) => ({ ...prev, [note.id]: e.target.value }))}
                onKeyDown={(e) => e.key === "Enter" && !e.nativeEvent.isComposing && submitComment(note.id)}
                placeholder="댓글을 남겨보세요"
                className="flex-1 min-w-0 rounded-full px-3 py-1.5 text-xs outline-none"
                style={{ background: "var(--input-background)", border: "1px solid rgba(232,121,160,0.2)" }}
              />
              <button
                onClick={() => submitComment(note.id)}
                className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 transition-transform active:scale-90"
                style={{ background: "linear-gradient(135deg,#E879A0,#F472B6)" }}
              >
                <Send className="w-3 h-3 text-white" />
              </button>
            </div>
          </div>
        ))}
        {viewerRole === "teacher" && (
          <div className="flex items-center gap-2">
            <input
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && submitNote()}
              placeholder={`${child.parentName}에게 전할 이야기를 남겨보세요`}
              className="flex-1 rounded-full px-4 py-2.5 text-sm outline-none"
              style={{ background: "var(--input-background)", border: "1px solid rgba(232,121,160,0.2)" }}
            />
            <button onClick={submitNote} className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 transition-transform active:scale-90" style={{ background: "linear-gradient(135deg,#E879A0,#F472B6)" }}>
              <Send className="w-4 h-4 text-white" />
            </button>
          </div>
        )}
      </div>

      {viewerRole === "teacher" && (
        <>
          <SectionHeading icon={Phone}>부모 정보</SectionHeading>
          <div className="rounded-2xl bg-card border p-4" style={{ borderColor: "rgba(232,121,160,0.15)" }}>
            <p className="text-sm font-bold" style={{ color: "#3B1355" }}>{child.parentName}</p>
            <p className="text-xs mt-0.5" style={{ color: "#A06080" }}>{child.nickname} 학생의 보호자</p>
          </div>
        </>
      )}
    </div>
  );
}
