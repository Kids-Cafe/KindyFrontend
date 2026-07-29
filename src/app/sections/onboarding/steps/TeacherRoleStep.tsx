import type { TeacherRole } from "@/app/auth/types";

export function TeacherRoleStep({ onSelect }: { onSelect: (role: TeacherRole) => void }) {
  return (
    <div>
      <h2 className="text-xl font-bold mb-1" style={{ fontFamily: "'Fredoka',sans-serif", color: "#1F0A3C" }}>
        어떤 역할이신가요?
      </h2>
      <p className="text-sm mb-6" style={{ color: "#6B7280" }}>원장 선생님이신가요, 일반 선생님이신가요?</p>

      <div className="grid grid-cols-2 gap-3">
        <button onClick={() => onSelect("director")}
          className="rounded-2xl py-8 text-center font-bold transition-all hover:scale-[1.02] active:scale-95"
          style={{ background: "#FDF2F8", color: "#E879A0", border: "1.5px solid #FBCFE8" }}>
          원장이에요
        </button>
        <button onClick={() => onSelect("teacher")}
          className="rounded-2xl py-8 text-center font-bold transition-all hover:scale-[1.02] active:scale-95"
          style={{ background: "#EFF6FF", color: "#3B82F6", border: "1.5px solid #BFDBFE" }}>
          일반 선생님이에요
        </button>
      </div>
    </div>
  );
}
