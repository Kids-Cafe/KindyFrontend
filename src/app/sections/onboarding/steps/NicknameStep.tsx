import { useState } from "react";

export function NicknameStep({
  greetingName,
  onConfirm,
}: {
  greetingName: string;
  onConfirm: (nickname: string) => void;
}) {
  const [nickname, setNickname] = useState("");

  return (
    <div>
      <h2 className="text-xl font-bold mb-1" style={{ fontFamily: "'Fredoka',sans-serif", color: "#1F0A3C" }}>
        {greetingName ? `${greetingName}님, ` : ""}뭐라고 불러드릴까요?
      </h2>
      <p className="text-sm mb-6" style={{ color: "#6B7280" }}>애칭이나 별칭을 알려주시면 그렇게 부를게요</p>

      <form onSubmit={(e) => { e.preventDefault(); onConfirm(nickname.trim() || greetingName); }}>
        <input type="text" placeholder="예: 민준맘, 햇살쌤"
          value={nickname} onChange={(e) => setNickname(e.target.value)}
          className="w-full rounded-2xl px-4 outline-none text-sm mb-6"
          style={{ height: 54, border: "1.5px solid #E5E7EB", background: "#FAFAFA", color: "#1F0A3C" }} />

        <button
          type="submit"
          className="w-full rounded-2xl font-bold text-white text-base transition-all hover:opacity-90 active:scale-[0.98]"
          style={{ height: 52, background: "linear-gradient(135deg, #E879A0 0%, #F472B6 50%, #C084FC 100%)" }}>
          다음
        </button>
      </form>
    </div>
  );
}
