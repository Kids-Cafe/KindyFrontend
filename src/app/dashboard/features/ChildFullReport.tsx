import { useCallback, useEffect, useRef, useState } from "react";
import { Sparkles, MessagesSquare, Phone, Send, RefreshCw } from "lucide-react";
import { useDashboardStore } from "@/app/dashboard/DashboardStoreContext";
import { useAuth } from "@/app/auth/AuthContext";
import { useDisplayName } from "@/app/auth/useDisplayName";
import { REPORT_CATEGORY_ORDER, REPORT_META } from "@/app/dashboard/reportMeta";
import { ReportByCategory } from "@/app/dashboard/reports";
import { parentNames } from "@/app/dashboard/parents";
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

/** 리포트를 쓰는 중에 화면이 무엇을 기다리는지 알려주는 한 줄입니다. */
type WriteState =
  | { kind: "idle" }
  | { kind: "writing" }
  /**
   * 이번에 정리된 항목 수. 처음 쓴 것과, 이야기가 쌓여 다시 쓴 것이 함께 셉니다.
   * 0은 "정리할 대화가 없었다"입니다.
   */
  | { kind: "done"; written: number }
  | { kind: "failed" };

/**
 * 아이 한 명의 전체 리포트를 "탭으로 골라보는 방식"이 아니라 하나의 연속된 스크롤로 합쳐 보여줍니다.
 * 최근 일기 전체, AI 파트너 분석/팁, 5종 성장 리포트, (선생님 시점 한정) 부모 전용 의견과 부모 정보까지
 * 한 화면에서 스크랩하듯 훑어볼 수 있습니다.
 *
 * 리포트는 사람이 쓰는 것이 아니라 아이가 AI 파트너와 나눈 대화와 그 아이의 일기에서 만들어집니다.
 * 화면이 열릴 때 `generateReports`가 한 번 돌면서 아직 없는 항목을 채우고, **이야기가 쌓인 항목은
 * 다시 씁니다.** 이미 최신인 항목은 서버가 모델을 부르지 않고 건너뛰므로, 이 자동 실행이
 * 세 화면(성장 리포트·학생 정보창·원장 패널) 모두에 붙어 있어도 대개는 조회 몇 번으로 끝납니다.
 */
export function ChildFullReport({ child, viewerRole }: { child: ChildRecord; viewerRole: "teacher" | "parent" }) {
  const { user } = useAuth();
  const displayName = useDisplayName();
  const { data, addParentNote, addParentNoteComment, generateReports } = useDashboardStore();
  const [noteText, setNoteText] = useState("");
  const [commentDrafts, setCommentDrafts] = useState<Record<string, string>>({});

  const [state, setState] = useState<WriteState>({ kind: "idle" });
  /** 이 화면이 이 아이에 대해 자동 생성을 이미 한 번 걸었는지. */
  const startedFor = useRef<string | null>(null);
  /** 언마운트 뒤에 상태를 건드리지 않기 위한 표시입니다(생성은 수십 초가 걸립니다). */
  const alive = useRef(true);

  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
    };
  }, []);

  const write = useCallback(async () => {
    setState({ kind: "writing" });
    try {
      const written = await generateReports(child.id);
      if (alive.current) setState({ kind: "done", written });
    } catch (cause) {
      console.warn("[Kindy] 리포트를 쓰지 못했어요.", cause);
      if (alive.current) setState({ kind: "failed" });
    }
  }, [child.id, generateReports]);

  useEffect(() => {
    if (startedFor.current === child.id) return;
    startedFor.current = child.id;
    void write();
  }, [child.id, write]);

  const writing = state.kind === "writing";

  const reports = data.reportsByChild[child.id];
  const notes = data.parentNotesByChild[child.id] ?? [];
  if (!reports) return null;

  const topTraits = [...reports.personality.traits].sort((a, b) => b.value - a.value).slice(0, 2);

  function submitNote() {
    if (!noteText.trim() || !user) return;
    addParentNote(child.id, displayName, noteText);
    setNoteText("");
  }

  function submitComment(noteId: number) {
    const text = commentDrafts[noteId] ?? "";
    if (!text.trim() || !user) return;
    addParentNoteComment(child.id, noteId, displayName, data.role, text);
    setCommentDrafts((prev) => ({ ...prev, [noteId]: "" }));
  }

  return (
    <div className="pb-10">
      <div className="flex items-center gap-3 mb-2">
        <span className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shrink-0" style={{ background: child.avatarColor }}>{child.avatarEmoji}</span>
        <div>
          <p className="font-bold text-base" style={{ color: "#3B1355" }}>
            {child.nickname}{child.age ? ` · ${child.age}세` : ""}
          </p>
          <p className="text-xs" style={{ color: "#A06080" }}>{child.className}</p>
        </div>
      </div>

      <div className="flex items-center gap-2 flex-wrap mt-3">
        <button
          onClick={() => void write()}
          disabled={writing}
          className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full border transition-colors disabled:opacity-60"
          style={{ borderColor: "rgba(232,121,160,0.3)", color: "#BE185D", background: "#FDF2F8" }}
        >
          {writing ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
          {writing ? "리포트를 쓰는 중…" : "최근 기록으로 리포트 쓰기"}
        </button>
        <span className="text-xs" style={{ color: "#A06080" }}>
          {writing && "다섯 가지를 한 번에 쓰면 조금 오래 걸려요."}
          {/* "정리했어요" — 이야기가 쌓인 항목은 새로 쓴 게 아니라 다시 쓴 것입니다. */}
          {state.kind === "done" && state.written > 0 && `리포트 ${state.written}가지를 정리했어요!`}
          {/* 0가지는 실패가 아닙니다. 이미 전부 최신이거나, 대화와 일기가 너무 적어
              지어내지 않고는 리포트가 되지 않는다는 뜻입니다. */}
          {state.kind === "done" && state.written === 0 && "새로 정리할 기록이 아직 없어요."}
          {state.kind === "failed" && "리포트를 쓰지 못했어요. 잠시 뒤 다시 눌러 주세요."}
        </span>
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
              placeholder={`${parentNames(child, "보호자")}에게 전할 이야기를 남겨보세요`}
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
          <SectionHeading icon={Phone}>보호자 정보</SectionHeading>
          {/* 보호자는 여러 명일 수 있습니다. 한 명만 찍으면 나머지 보호자는 없는 사람이 됩니다. */}
          {child.parents.length === 0 ? (
            <div className="rounded-2xl bg-card border p-4" style={{ borderColor: "rgba(232,121,160,0.15)" }}>
              <p className="text-sm" style={{ color: "#A06080" }}>아직 연결된 보호자 계정이 없어요.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {child.parents.map((parent) => (
                <div key={parent.id} className="rounded-2xl bg-card border p-4" style={{ borderColor: "rgba(232,121,160,0.15)" }}>
                  <p className="text-sm font-bold" style={{ color: "#3B1355" }}>{parent.name}</p>
                  <p className="text-xs mt-0.5" style={{ color: "#A06080" }}>
                    {child.nickname} 학생의 보호자{parent.phone ? ` · ${parent.phone}` : ""}
                  </p>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
