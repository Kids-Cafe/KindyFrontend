import { useState } from "react";
import { searchKindergartens } from "@/app/auth/mockSignup";
import type { KindergartenInfo } from "@/app/auth/types";

const inputStyle = { height: 54, border: "1.5px solid #E5E7EB", background: "#FAFAFA", color: "#1F0A3C" } as const;

/**
 * 일반 교사가 소속 유치원을 검색해서 선택하는 단계입니다. 동명 유치원이 있을 수
 * 있어 이름뿐 아니라 주소도 함께 보여줘 헷갈리지 않도록 합니다.
 */
export function KindergartenSearchStep({
  onSelect,
  onSkip,
}: {
  onSelect: (kindergarten: KindergartenInfo) => void;
  /** 등록할 유치원이 아직 없을 때 건너뛸 수 있게 합니다. */
  onSkip?: () => void;
}) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<KindergartenInfo[]>([]);
  const [searched, setSearched] = useState(false);

  async function handleSearch() {
    setResults(await searchKindergartens(query));
    setSearched(true);
  }

  return (
    <div>
      <h2 className="text-xl font-bold mb-1" style={{ fontFamily: "'Fredoka',sans-serif", color: "#1F0A3C" }}>
        소속 유치원을 찾아볼까요?
      </h2>
      <p className="text-sm mb-6" style={{ color: "#6B7280" }}>이름이 같은 유치원도 있을 수 있어 주소로 구분해드려요</p>

      <div className="flex gap-2 mb-4">
        <input type="text" placeholder="유치원 이름을 입력해주세요"
          value={query} onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSearch()}
          className="flex-1 rounded-2xl px-4 outline-none text-sm" style={inputStyle} />
        <button type="button" onClick={handleSearch}
          className="px-4 rounded-2xl text-sm font-bold whitespace-nowrap"
          style={{ height: 54, background: "#F3F4F6", color: "#1F0A3C" }}>
          검색
        </button>
      </div>

      <div className="space-y-2 mb-2 max-h-64 overflow-y-auto">
        {results.map((kg) => (
          <button key={kg.id} onClick={() => onSelect(kg)}
            className="w-full text-left rounded-2xl px-4 py-3 transition-all hover:scale-[1.01] active:scale-95"
            style={{ background: "#FAFAFA", border: "1.5px solid #E5E7EB" }}>
            <p className="text-sm font-bold" style={{ color: "#1F0A3C" }}>{kg.name}</p>
            <p className="text-xs" style={{ color: "#9CA3AF" }}>{kg.address}</p>
          </button>
        ))}
        {searched && results.length === 0 && (
          <p className="text-xs font-semibold text-center py-4" style={{ color: "#9CA3AF" }}>
            검색 결과가 없어요. 이름을 다시 확인해주세요.
          </p>
        )}
      </div>

      {onSkip && (
        <button type="button" onClick={onSkip}
          className="w-full text-center text-xs font-semibold py-3 mt-2"
          style={{ color: "#9CA3AF" }}>
          아직 등록할 유치원이 없어요, 나중에 할게요
        </button>
      )}
    </div>
  );
}
