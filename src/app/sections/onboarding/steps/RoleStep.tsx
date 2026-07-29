import type { UserRole } from "@/app/auth/types";

export function RoleStep({ onSelect }: { onSelect: (role: UserRole) => void }) {
  return (
    <div>
      <h2 className="text-xl font-bold mb-1" style={{ fontFamily: "'Fredoka',sans-serif", color: "#1F0A3C" }}>
        만나서 반가워요!
      </h2>
      <p className="text-sm mb-6" style={{ color: "#6B7280" }}>학부모이신가요, 선생님이신가요?</p>

      <div className="grid grid-cols-2 gap-3">
        <button onClick={() => onSelect("parent")}
          className="rounded-2xl py-8 text-center font-bold transition-all hover:scale-[1.02] active:scale-95"
          style={{ background: "#FDF2F8", color: "#E879A0", border: "1.5px solid #FBCFE8" }}>
          학부모예요
        </button>
        <button onClick={() => onSelect("teacher")}
          className="rounded-2xl py-8 text-center font-bold transition-all hover:scale-[1.02] active:scale-95"
          style={{ background: "#EFF6FF", color: "#3B82F6", border: "1.5px solid #BFDBFE" }}>
          선생님이에요
        </button>
      </div>
    </div>
  );
}
