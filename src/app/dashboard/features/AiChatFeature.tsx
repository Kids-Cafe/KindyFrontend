import { useCallback, useEffect, useRef, useState } from "react";
import { Mic, RotateCcw, Send, Square, Volume2, VolumeX } from "lucide-react";
import { KioSVG, KinaSVG } from "@/app/components/decorative";
import { CHAR_DATA } from "@/app/data/characterData";
import { useDashboardStore } from "@/app/dashboard/DashboardStoreContext";
import { useChildVoiceSettings } from "@/app/dashboard/childVoiceSettings";
import { canRecordAudio, useVoiceRecorder } from "@/app/dashboard/useVoiceRecorder";
import { speakAssistant, transcribeAudio } from "@/app/dashboard/chatSync";
import { withJosa } from "@/app/lib/korean";
import type { AIPartnerId } from "@/app/dashboard/types";

/**
 * 아이 ↔ AI 파트너 대화창입니다. 쓰기와 말하기가 **한 화면**에 있습니다.
 *
 * 기본은 타이핑이고, 마이크 버튼을 누르면 녹음한 소리를 서버가 받아 적어 그대로 보냅니다.
 * AI의 답은 설정이 켜져 있으면 캐릭터 목소리로 읽어 줍니다.
 */
export function AiChatFeature({ childId, partner }: { childId: string; partner: AIPartnerId }) {
  const { data, sendAiMessage, retryAiReply, aiTyping, aiReplyFailed } = useDashboardStore();
  const { settings, update } = useChildVoiceSettings(childId);
  const [input, setInput] = useState("");
  const [transcribing, setTranscribing] = useState(false);
  const [speakingId, setSpeakingId] = useState<number | null>(null);
  const [blockedId, setBlockedId] = useState<number | null>(null);

  const thread = data.aiThreadsByChild[childId];
  const busy = aiTyping[childId] || transcribing;
  const failed = aiReplyFailed[childId];
  const char = CHAR_DATA[partner];
  const Svg = partner === "kio" ? KioSVG : KinaSVG;
  const endRef = useRef<HTMLDivElement>(null);

  /**
   * 재생용 엘리먼트 **하나**를 계속 씁니다.
   *
   * 답변마다 `new Audio()`를 만들면 iOS·Chrome의 자동재생 정책에 걸립니다. 그 정책은
   * `play()`가 사용자 조작과 같은 흐름에 있기를 요구하는데, 여기서는 전송 → LLM 왕복(최대
   * 1분) → TTS를 기다린 뒤라 조작은 이미 한참 전에 끝나 있습니다. 대신 조작이 일어난
   * 순간에 이 엘리먼트를 한 번 "열어 두면"(아래 `unlockAudio`) 이후에는 `src`만 갈아 끼워
   * 재생할 수 있습니다.
   */
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const objectUrlRef = useRef<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const unlockedRef = useRef(false);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [thread?.messages.length, busy]);

  const stopSpeaking = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
    const audio = audioRef.current;
    if (audio) {
      audio.pause();
      audio.removeAttribute("src");
    }
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
      objectUrlRef.current = null;
    }
    setSpeakingId(null);
  }, []);

  // 화면을 떠날 때 소리가 따라가지 않도록 합니다.
  useEffect(() => stopSpeaking, [stopSpeaking]);

  /** 사용자 조작 안에서 호출해야 의미가 있습니다. */
  const unlockAudio = useCallback(() => {
    if (unlockedRef.current) return;
    const audio = audioRef.current;
    if (!audio) return;
    audio.muted = true;
    audio
      .play()
      .then(() => {
        audio.pause();
        audio.muted = false;
        unlockedRef.current = true;
      })
      .catch(() => {
        audio.muted = false;
      });
  }, []);

  const speak = useCallback(
    async (text: string, messageId: number) => {
      stopSpeaking();
      const controller = new AbortController();
      abortRef.current = controller;
      setSpeakingId(messageId);

      const blob = await speakAssistant(text, { partner, signal: controller.signal });
      if (controller.signal.aborted) return;
      if (!blob) {
        setSpeakingId(null);
        return;
      }

      const audio = audioRef.current;
      if (!audio) return;
      const url = URL.createObjectURL(blob);
      objectUrlRef.current = url;
      audio.src = url;
      // iOS는 미디어 볼륨을 OS가 쥐고 있어 이 값을 무시합니다. 다른 환경에서는 먹습니다.
      audio.volume = settings.volume;
      try {
        await audio.play();
        setBlockedId(null);
      } catch {
        // 자동재생이 막혔습니다. 답변 옆의 스피커 버튼이 남은 경로입니다.
        setBlockedId(messageId);
        setSpeakingId(null);
      }
    },
    [partner, settings.volume, stopSpeaking],
  );

  const send = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || busy) return;
      unlockAudio();
      stopSpeaking();
      setInput("");
      await sendAiMessage(childId, trimmed);
    },
    [busy, childId, sendAiMessage, stopSpeaking, unlockAudio],
  );

  const recorder = useVoiceRecorder({ onStart: stopSpeaking });

  const toggleRecording = useCallback(async () => {
    if (recorder.recording) {
      recorder.stop();
      return;
    }
    if (busy) return;
    unlockAudio();

    // 말이 멈추면 녹음이 스스로 끝나므로, 대개 이 약속은 버튼을 다시 누르지 않아도
    // 풀립니다. 아무 말도 없었으면 `null`이라 그대로 없던 일이 됩니다.
    const result = await recorder.start();
    if (!result) return;

    setTranscribing(true);
    try {
      const text = await transcribeAudio(result.blob, result.mimeType);
      // 잘 못 알아들었으면 아무것도 보내지 않습니다. 빈 말풍선은 아이에게 더 혼란스럽습니다.
      if (text) await send(text);
    } finally {
      setTranscribing(false);
    }
  }, [busy, recorder, send, unlockAudio]);

  const messages = thread?.messages ?? [];
  const lastMessage = messages[messages.length - 1];

  /**
   * 새 답변이 붙으면 읽어 줍니다.
   *
   * 전송 함수가 아니라 여기서 하는 이유는 **말풍선의 id가 필요하기 때문**입니다. 서버가 준
   * 번호는 재조회가 끝나야 정해지므로, 화면에 실제로 그려진 메시지를 보고 읽는 편이
   * 정확합니다(다시 듣기 버튼의 강조도 같은 id를 씁니다).
   *
   * 처음 들어왔을 때 지난 대화를 줄줄이 읽지 않도록, 마운트 시점의 마지막 메시지는 이미
   * 읽은 것으로 칩니다.
   */
  const spokenIdRef = useRef<number | null>(null);
  useEffect(() => {
    if (spokenIdRef.current === null) {
      spokenIdRef.current = lastMessage?.id ?? 0;
      return;
    }
    if (!lastMessage || lastMessage.id === spokenIdRef.current) return;
    spokenIdRef.current = lastMessage.id;

    if (lastMessage.sender !== "ai" || !lastMessage.text) return;
    if (!settings.readReplies) return;
    void speak(lastMessage.text, lastMessage.id);
  }, [lastMessage, settings.readReplies, speak]);

  return (
    <div className="flex flex-col h-full">
      <audio ref={audioRef} onEnded={stopSpeaking} className="hidden" />

      <header className="flex items-center gap-2 pb-3 mb-1 shrink-0 border-b" style={{ borderColor: `${char.color}22` }}>
        <span className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 overflow-hidden" style={{ background: `${char.color}22` }}>
          <Svg className="h-7 w-auto" />
        </span>
        <p className="font-bold text-sm flex-1" style={{ color: "#3B1355", fontFamily: "'Fredoka',sans-serif" }}>
          {char.name}
        </p>
        <button
          onClick={() => {
            if (settings.readReplies) stopSpeaking();
            update({ readReplies: !settings.readReplies });
          }}
          aria-label={settings.readReplies ? "목소리 끄기" : "목소리 켜기"}
          aria-pressed={settings.readReplies}
          title={settings.readReplies ? "목소리 끄기" : "목소리 켜기"}
          className="w-9 h-9 rounded-full flex items-center justify-center transition-transform active:scale-90"
          style={{ background: settings.readReplies ? `${char.color}22` : "var(--muted)", color: settings.readReplies ? char.color : "#A06080" }}
        >
          {settings.readReplies ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
        </button>
      </header>

      <div className="flex-1 overflow-y-auto space-y-3 pr-1 pb-3">
        {/* 아직 한 마디도 나누지 않았을 때의 인사입니다. 화면에만 그리고 서버에는 남기지
            않습니다 — 저장하면 다음 턴의 대화 기록에 AI가 한 말로 섞여 들어갑니다. */}
        {messages.length === 0 && !busy && (
          <div className="flex items-end gap-2">
            <span className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 overflow-hidden" style={{ background: `${char.color}22` }}>
              <Svg className="h-7 w-auto" />
            </span>
            <div
              className="max-w-[75%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed"
              style={{ background: "var(--card)", border: `1px solid ${char.color}33`, color: "#3B1355", borderTopLeftRadius: 4 }}
            >
              {char.greeting}
            </div>
          </div>
        )}

        {messages.map((msg) => {
          const isAi = msg.sender === "ai";
          const speakable = isAi && Boolean(msg.text);
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
              {/* 자동재생이 막히는 브라우저가 있어 언제나 직접 누를 수 있는 길을 함께 둡니다. */}
              {speakable && (
                <button
                  onClick={() => {
                    unlockAudio();
                    void speak(msg.text ?? "", msg.id);
                  }}
                  aria-label={`${char.name}의 말 다시 듣기`}
                  className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 transition-transform active:scale-90"
                  style={{
                    background: blockedId === msg.id ? `${char.color}33` : "transparent",
                    color: speakingId === msg.id ? char.color : "#A06080",
                  }}
                >
                  <Volume2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          );
        })}

        {busy && (
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

        {/* 아이가 한 말은 이미 저장돼 있고 답변만 못 받은 상태입니다. 그래서 다시 보내는 게
            아니라 답변만 다시 청합니다. */}
        {failed && !busy && (
          <div className="flex items-center gap-2 pl-10">
            <p className="text-xs" style={{ color: "#A06080" }}>
              {withJosa(char.name, "이/가")} 지금 대답하지 못했어요.
            </p>
            <button
              onClick={() => {
                unlockAudio();
                void retryAiReply(childId);
              }}
              className="flex items-center gap-1 text-xs font-bold px-3 py-1.5 rounded-full transition-transform active:scale-95"
              style={{ background: `${char.color}22`, color: "#3B1355" }}
            >
              <RotateCcw className="w-3 h-3" /> 다시 물어보기
            </button>
          </div>
        )}

        <div ref={endRef} />
      </div>

      {recorder.recording && (
        <div className="flex items-center gap-2 mb-2 px-3 py-2 rounded-2xl shrink-0" style={{ background: `${char.color}14` }}>
          <span className="w-2 h-2 rounded-full animate-pulse shrink-0" style={{ background: "#F87171" }} />
          <div className="flex items-end gap-0.5 h-6 flex-1">
            {Array.from({ length: 24 }).map((_, i) => (
              <span
                key={i}
                className="flex-1 rounded-full transition-all duration-100"
                style={{
                  // 실제 입력 크기입니다. 막대마다 조금씩 어긋나게 해 파형처럼 보이게 합니다.
                  height: `${Math.max(3, recorder.level * 24 * (0.55 + 0.45 * Math.sin(i * 0.9)))}px`,
                  background: char.color,
                  opacity: 0.85,
                }}
              />
            ))}
          </div>
          {/* 아이는 초를 세지 않습니다. "말하면 알아서 끝난다"만 알면 되므로 남은 시간
              대신 지금 듣고 있는지를 보여 주고, 상한이 코앞일 때만 초를 꺼냅니다. */}
          <span className="text-xs font-bold shrink-0 tabular-nums" style={{ color: "#A06080" }}>
            {recorder.secondsLeft <= 5 ? `${recorder.secondsLeft}초` : recorder.heard ? "듣고 있어요" : "말해 보세요"}
          </span>
        </div>
      )}

      {recorder.denied && (
        <p className="text-xs mb-2 shrink-0" style={{ color: "#A06080" }}>
          마이크를 쓸 수 없어요. 글로 이야기해도 좋아요!
        </p>
      )}

      <div className="flex items-center gap-2 mt-2 shrink-0">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && !e.nativeEvent.isComposing && void send(input)}
          disabled={recorder.recording}
          placeholder={
            transcribing
              ? "무슨 말인지 듣고 있어요…"
              : `${char.name}에게 오늘 있었던 일을 이야기해보세요`
          }
          className="flex-1 rounded-full px-4 py-2.5 text-sm outline-none disabled:opacity-60"
          style={{ background: "var(--input-background)", border: "1px solid rgba(232,121,160,0.2)" }}
        />

        {/* 보안 컨텍스트가 아니거나 지원하지 않는 브라우저에서는 아예 감춥니다. */}
        {canRecordAudio() && (
          <button
            onClick={() => void toggleRecording()}
            disabled={busy && !recorder.recording}
            aria-label={recorder.recording ? "말하기 끝내기" : "목소리로 말하기"}
            aria-pressed={recorder.recording}
            className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 transition-transform active:scale-90 disabled:opacity-50"
            style={{ background: recorder.recording ? "#F87171" : "var(--muted)", color: recorder.recording ? "white" : "#6B3580" }}
          >
            {recorder.recording ? <Square className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
          </button>
        )}

        <button
          onClick={() => void send(input)}
          disabled={busy || recorder.recording || !input.trim()}
          aria-label="보내기"
          className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 transition-transform active:scale-90 disabled:opacity-50"
          style={{ background: "linear-gradient(135deg,#E879A0,#F472B6)" }}
        >
          <Send className="w-4 h-4 text-white" />
        </button>
      </div>

      {/* 마지막 답변을 다시 듣는 길을 하나 더 둡니다(위 말풍선 옆 버튼과 같은 동작). */}
      {lastMessage?.sender === "ai" && blockedId !== null && (
        <p className="text-xs mt-2 shrink-0" style={{ color: "#A06080" }}>
          소리가 안 나면 말풍선 옆의 스피커를 눌러 주세요.
        </p>
      )}
    </div>
  );
}
