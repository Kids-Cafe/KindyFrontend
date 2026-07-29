import { useEffect, useRef, useState } from "react";
import { Send } from "lucide-react";
import { KioSVG, KinaSVG } from "@/app/components/decorative";
import { CHAR_DATA } from "@/app/data/characterData";
import { useDashboardStore } from "@/app/dashboard/DashboardStoreContext";
import type { AIPartnerId } from "@/app/dashboard/types";

/** 아이 ↔ AI 파트너 텍스트 채팅입니다. 보낸 메시지가 쌓이면 잠시 후 AI가 답장합니다(완전 목업). */
export function AiChatFeature({ childId, partner }: { childId: string; partner: AIPartnerId }) {
  const { data, sendAiMessage, aiTyping } = useDashboardStore();
  const [input, setInput] = useState("");
  const thread = data.aiThreadsByChild[childId];
  const char = CHAR_DATA[partner];
  const Svg = partner === "kio" ? KioSVG : KinaSVG;
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [thread?.messages.length, aiTyping[childId]]);

  function handleSend() {
    if (!input.trim()) return;
    sendAiMessage(childId, input);
    setInput("");
  }

  return (
    <div className="flex flex-col h-full max-w-2xl">
      <div className="flex-1 overflow-y-auto space-y-3 pr-1 pb-3">
        {thread?.messages.map((msg) => {
          const isAi = msg.sender === "ai";
          return (
            <div key={msg.id} className={`flex items-end gap-2 ${isAi ? "" : "flex-row-reverse"}`}>
              {isAi && (
                <span className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 overflow-hidden" style={{ background: `${char.color}22` }}>
                  <Svg className="h-7 w-auto" />
                </span>
              )}
              <div
                className="max-w-[75%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed"
                style={isAi
                  ? { background: "var(--card)", border: `1px solid ${char.color}33`, color: "#3B1355", borderTopLeftRadius: 4 }
                  : { background: "linear-gradient(135deg,#E879A0,#F472B6)", color: "white", borderTopRightRadius: 4 }}
              >
                {msg.text}
              </div>
            </div>
          );
        })}
        {aiTyping[childId] && (
          <div className="flex items-end gap-2">
            <span className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 overflow-hidden" style={{ background: `${char.color}22` }}>
              <Svg className="h-7 w-auto" />
            </span>
            <div className="rounded-2xl px-4 py-3 flex gap-1" style={{ background: "var(--card)", border: `1px solid ${char.color}33`, borderTopLeftRadius: 4 }}>
              {[0, 1, 2].map((i) => (
                <span key={i} className="w-1.5 h-1.5 rounded-full animate-bounce" style={{ background: char.color, animationDelay: `${i * 0.15}s` }} />
              ))}
            </div>
          </div>
        )}
        <div ref={endRef} />
      </div>

      <div className="flex items-center gap-2 mt-2 shrink-0">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
          placeholder={`${char.name}에게 오늘 있었던 일을 이야기해보세요`}
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
  );
}
