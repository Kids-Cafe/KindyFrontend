import { KioSVG, KinaSVG } from "@/app/components/decorative";
import { CHAR_DATA } from "@/app/data/characterData";
import { useDashboardStore } from "@/app/dashboard/DashboardStoreContext";
import type { AIPartnerId } from "@/app/dashboard/types";

const CARDS: { id: AIPartnerId; Svg: typeof KioSVG }[] = [
  { id: "kio", Svg: KioSVG },
  { id: "kina", Svg: KinaSVG },
];

/** 아이 계정이 대화 상대(AI 파트너)를 처음 고르는 화면입니다. 이미 골랐다면 다시 바꿀 수도 있습니다. */
export function PartnerSelect({ childId, currentPartner, onSelected }: { childId: string; currentPartner: AIPartnerId | null; onSelected: (partner: AIPartnerId) => void }) {
  const { choosePartner } = useDashboardStore();

  function handleSelect(partner: AIPartnerId) {
    choosePartner(childId, partner);
    onSelected(partner);
  }

  return (
    <div>
      <h2 className="text-lg font-bold mb-1" style={{ color: "#3B1355", fontFamily: "'Fredoka',sans-serif" }}>
        {currentPartner ? "파트너를 바꿔볼까요?" : "누구와 이야기하고 싶어요?"}
      </h2>
      <p className="text-sm mb-6" style={{ color: "#A06080" }}>
        매일 이야기 나눌 나만의 AI 친구를 골라주세요. 언제든 다시 바꿀 수 있어요.
      </p>

      <div className="grid grid-cols-2 gap-4">
        {CARDS.map(({ id, Svg }) => {
          const char = CHAR_DATA[id];
          const active = currentPartner === id;
          return (
            <button
              key={id}
              onClick={() => handleSelect(id)}
              className="relative rounded-3xl p-6 text-center transition-all hover:scale-[1.02] active:scale-95"
              style={{
                background: active ? `linear-gradient(160deg, ${char.color}22, ${char.darkColor}18)` : "var(--card)",
                border: `2px solid ${active ? char.color : "rgba(232,121,160,0.15)"}`,
              }}
            >
              <Svg className="h-28 w-auto mx-auto mb-3" />
              <p className="font-bold text-base" style={{ color: char.darkColor, fontFamily: "'Fredoka',sans-serif" }}>{char.name}</p>
              <p className="text-xs mb-3" style={{ color: "#A06080" }}>{char.role}</p>
              <div className="flex flex-wrap justify-center gap-1.5">
                {char.tags.slice(0, 2).map((tag) => (
                  <span key={tag.label} className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ background: `${char.color}22`, color: char.darkColor }}>
                    {tag.label}
                  </span>
                ))}
              </div>
              {active && (
                <span className="absolute top-3 right-3 text-xs font-bold px-2 py-0.5 rounded-full" style={{ background: char.color, color: "white" }}>
                  선택됨
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
