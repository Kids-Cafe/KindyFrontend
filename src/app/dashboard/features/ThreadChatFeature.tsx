import { useEffect, useRef, useState } from "react";
import { RefreshCw, Send } from "lucide-react";
import { useDashboardStore } from "@/app/dashboard/DashboardStoreContext";
import { REPORT_CATEGORY_ORDER, REPORT_META } from "@/app/dashboard/reportMeta";
import { ReportByCategoryData } from "@/app/dashboard/reports";
import type { ChatSender, DataCardType } from "@/app/dashboard/types";

function formatTime(ms: number): string {
  const d = new Date(ms);
  return `${d.getHours().toString().padStart(2, "0")}:${d.getMinutes().toString().padStart(2, "0")}`;
}

/**
 * 부모 ↔ 선생님 채팅 한 개 스레드의 대화창입니다.
 * 공식 상담 채널처럼, 입력창 위 칩 버튼으로 아이의 데이터(건강/식단/성격/학습/교우관계)를
 * 카드 형태로 대화에 바로 불러올 수 있습니다.
 *
 * 대화 상대는 아이가 아니라 **보호자 한 명**입니다(`parentId`). 아이에게 보호자가 둘이면
 * 담임과의 대화도 둘이라, 어느 쪽인지 부르는 쪽이 정해 줘야 합니다.
 */
export function ThreadChatFeature({
  childId,
  parentId,
  viewerRole,
  viewerName,
}: {
  childId: string;
  parentId: string;
  viewerRole: ChatSender;
  viewerName: string;
}) {
  const { data, sendThreadMessage, insertDataCard, generateReports } = useDashboardStore();
  const [input, setInput] = useState("");
  /** 지금 새로 쓰고 있는 리포트 종류입니다. 누른 칩 하나만 도는 표시라 한 개면 충분합니다. */
  const [fetching, setFetching] = useState<DataCardType | null>(null);
  const thread = (data.threadsByChild[childId] ?? []).find((t) => t.parentId === parentId);
  const child = data.classChildren.find((c) => c.id === childId);
  const reports = data.reportsByChild[childId];
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [thread?.messages.length]);

  // 아직 한 번도 주고받지 않은 상대와도 대화를 시작할 수 있어야 합니다. 서버 대화는
  // 첫 메시지를 보낼 때 만들어지므로, 스레드가 없으면 빈 대화창을 그립니다.
  const messages = thread?.messages ?? [];
  const childNickname = thread?.childNickname ?? child?.nickname ?? "";
  const counterpartName =
    viewerRole === "parent"
      ? thread?.teacherName ?? data.homeroomTeacher?.name ?? "선생님"
      : thread?.parentName ?? child?.parents.find((p) => p.id === parentId)?.name ?? "보호자";

  if (!parentId) {
    return (
      <p className="text-sm" style={{ color: "#A06080" }}>
        아직 연결된 보호자가 없어 대화를 시작할 수 없어요.
      </p>
    );
  }

  function handleSend() {
    if (!input.trim()) return;
    sendThreadMessage(childId, parentId, input);
    setInput("");
  }

  /**
   * 칩을 누르면 그 종류의 리포트를 먼저 최신으로 만들고, 그 다음에 카드를 붙입니다.
   *
   * 이 순서가 이제는 화면 깜빡임이 아니라 **카드에 무엇이 남느냐**의 문제입니다. 서버는 카드를
   * 붙이는 순간의 리포트를 못박고, 그 뒤로 그 카드는 영원히 그 판을 보여줍니다. 순서를 뒤집으면
   * 카드에 낡은 판이 박히고, 새로 쓴 리포트는 카드 밖에만 남습니다.
   *
   * 생성에 실패해도 카드는 붙입니다 — 지금 저장돼 있는 리포트라도 보여주는 편이, 칩을 눌렀는데
   * 아무 일도 일어나지 않는 것보다 낫습니다. 저장된 리포트가 아예 없으면 서버가 카드를 거절하고
   * (`NOT_FOUND`), `insertDataCard`가 그 실패를 삼킵니다.
   */
  async function handleDataFetch(category: DataCardType) {
    setFetching(category);
    try {
      await generateReports(childId, category);
    } catch (cause) {
      console.warn("[Kindy] 리포트를 새로 쓰지 못했어요.", cause);
    } finally {
      setFetching(null);
    }
    insertDataCard(childId, parentId, category);
  }

  return (
    <div className="flex flex-col h-full">
      <div className="pb-3 mb-3 border-b" style={{ borderColor: "rgba(232,121,160,0.15)" }}>
        <p className="text-xs" style={{ color: "#A06080" }}>{childNickname} 학생 · {counterpartName}님과의 대화</p>
      </div>

      <div className="flex-1 overflow-y-auto space-y-3 pr-1 pb-3">
        {messages.length === 0 && (
          <p className="text-sm" style={{ color: "#A06080" }}>아직 대화가 없어요. 먼저 인사를 건네보세요.</p>
        )}
        {messages.map((msg) => {
          const isMine = msg.sender === viewerRole;
          if (msg.kind === "data-card" && msg.cardType) {
            // 카드에 실려 온 리포트가 곧 그때 보낸 리포트입니다. 서버가 보낼 때 그 판을
            // 못박아 두므로, 그 뒤에 리포트를 몇 번을 다시 쓰든 이 카드는 그대로입니다.
            //
            // 없는 경우는 `reportId` 칼럼이 생기기 전에 붙은 카드뿐이고(그중에서도 어느
            // 아이인지 확정할 수 없던 것들), 그때는 예전처럼 현재 리포트로 그립니다.
            // 둘 다 없으면 안내 문구를 냅니다 — 예전에는 `reports`가 없으면 그대로
            // 터졌습니다(`reports.food`).
            const cardData = msg.cardData ?? reports?.[msg.cardType];
            return (
              <div key={msg.id} className={`flex flex-col ${isMine ? "items-end" : "items-start"}`}>
                <p className="text-xs mb-1 px-1" style={{ color: "#A06080" }}>{msg.senderName}님이 {REPORT_META[msg.cardType].short} 정보를 불러왔어요</p>
                <div className="max-w-[85%] w-full">
                  {cardData
                    ? <ReportByCategoryData category={msg.cardType} data={cardData} />
                    : (
                      <div className="rounded-2xl bg-card border p-5 text-sm" style={{ borderColor: "rgba(232,121,160,0.15)", color: "#A06080" }}>
                        이 카드의 리포트를 불러올 수 없어요.
                      </div>
                    )}
                </div>
              </div>
            );
          }
          return (
            <div key={msg.id} className={`flex flex-col ${isMine ? "items-end" : "items-start"}`}>
              <div
                className="max-w-[75%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed"
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

      <div className="shrink-0">
        <div className="flex gap-1.5 flex-wrap mb-2">
          {REPORT_CATEGORY_ORDER.map((category) => {
            const meta = REPORT_META[category];
            const busy = fetching === category;
            return (
              <button
                key={category}
                onClick={() => void handleDataFetch(category)}
                // 다른 칩까지 잠그지는 않습니다. 한 종류를 쓰는 동안 다른 종류를 눌러도
                // 서버가 각각 따로 처리하고, 대화에는 누른 순서대로 붙습니다.
                disabled={busy}
                className="flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-full font-bold transition-all hover:scale-[1.03] active:scale-95 disabled:opacity-60 disabled:hover:scale-100"
                style={{ background: `${meta.color}22`, color: "#3B1355", border: `1px solid ${meta.color}55` }}
              >
                {busy
                  ? <RefreshCw className="w-3 h-3 animate-spin" style={{ color: meta.color }} />
                  : <meta.icon className="w-3 h-3" style={{ color: meta.color }} />}
                {meta.short} {busy ? "쓰는 중…" : "불러오기"}
              </button>
            );
          })}
        </div>
        <div className="flex items-center gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !e.nativeEvent.isComposing && handleSend()}
            placeholder={`${counterpartName}님께 메시지 보내기`}
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
    </div>
  );
}
