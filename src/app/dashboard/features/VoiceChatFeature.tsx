import { useEffect, useState } from "react";
import { Mic, MicOff, PhoneOff, Phone } from "lucide-react";
import { KioSVG, KinaSVG } from "@/app/components/decorative";
import { CHAR_DATA } from "@/app/data/characterData";
import type { AIPartnerId } from "@/app/dashboard/types";

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60).toString().padStart(2, "0");
  const s = (seconds % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}

/** 아이 ↔ AI 파트너 음성 채팅 화면입니다. 실제 음성 인식/합성은 없고, 통화 중인 느낌을 주는 UI만 목업으로 구현했습니다. */
export function VoiceChatFeature({ partner }: { partner: AIPartnerId }) {
  const [connected, setConnected] = useState(false);
  const [muted, setMuted] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [bars, setBars] = useState<number[]>(Array.from({ length: 24 }, () => 0.3));

  const char = CHAR_DATA[partner];
  const Svg = partner === "kio" ? KioSVG : KinaSVG;

  useEffect(() => {
    if (!connected) return;
    const timer = window.setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => window.clearInterval(timer);
  }, [connected]);

  useEffect(() => {
    if (!connected || muted) return;
    const timer = window.setInterval(() => {
      setBars(Array.from({ length: 24 }, () => 0.2 + Math.random() * 0.8));
    }, 220);
    return () => window.clearInterval(timer);
  }, [connected, muted]);

  return (
    <div className="max-w-md mx-auto flex flex-col items-center pt-10">
      <style>{`
        @keyframes kindyVoiceFloat {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-8px); }
        }
      `}</style>
      <div
        className="relative w-40 h-40 rounded-full flex items-center justify-center mb-5"
        style={{
          background: `radial-gradient(circle, ${char.color}33, transparent 70%)`,
          animation: connected ? "kindyVoiceFloat 3s ease-in-out infinite" : undefined,
        }}
      >
        <span className="w-32 h-32 rounded-full flex items-center justify-center overflow-hidden" style={{ background: "var(--card)", border: `3px solid ${char.color}` }}>
          <Svg className="h-28 w-auto" />
        </span>
        {connected && (
          <span className="absolute inset-0 rounded-full animate-ping" style={{ border: `2px solid ${char.color}55` }} />
        )}
      </div>

      <p className="font-bold text-lg" style={{ color: "#3B1355", fontFamily: "'Fredoka',sans-serif" }}>{char.name}</p>
      <p className="text-xs mt-0.5" style={{ color: "#A06080" }}>
        {connected ? (muted ? "마이크가 꺼져 있어요" : "듣고 있어요…") : "통화를 시작하면 목소리로 이야기할 수 있어요"}
      </p>

      {connected && (
        <>
          <p className="text-sm font-bold mt-4" style={{ color: "#E879A0" }}>{formatDuration(seconds)}</p>
          <div className="flex items-end gap-1 h-10 mt-3">
            {bars.map((h, i) => (
              <span
                key={i}
                className="w-1 rounded-full transition-all duration-200"
                style={{ height: `${muted ? 4 : h * 40}px`, background: char.color, opacity: muted ? 0.3 : 0.85 }}
              />
            ))}
          </div>
        </>
      )}

      <div className="flex items-center gap-4 mt-8">
        {connected && (
          <button
            onClick={() => setMuted((m) => !m)}
            className="w-12 h-12 rounded-full flex items-center justify-center transition-all active:scale-90"
            style={{ background: muted ? "#F87171" : "var(--muted)", color: muted ? "white" : "#6B3580" }}
          >
            {muted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
          </button>
        )}
        <button
          onClick={() => {
            if (connected) {
              setConnected(false);
              setSeconds(0);
            } else {
              setConnected(true);
            }
          }}
          className="w-14 h-14 rounded-full flex items-center justify-center transition-all active:scale-90 shadow-lg"
          style={{ background: connected ? "#F87171" : "linear-gradient(135deg,#86EFAC,#7ECECA)" }}
        >
          {connected ? <PhoneOff className="w-6 h-6 text-white" /> : <Phone className="w-6 h-6 text-white" />}
        </button>
      </div>
    </div>
  );
}
