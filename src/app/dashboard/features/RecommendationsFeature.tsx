import { useState } from "react";
import { Sparkles, RefreshCw, ExternalLink } from "lucide-react";
import { useDashboardStore } from "@/app/dashboard/DashboardStoreContext";
import { withJosa } from "@/app/lib/korean";

interface Recommendation {
  id: string;
  title: string;
  source: string;
  summary: string;
  tag: string;
}

const POOL: Recommendation[] = [
  { id: "r1", title: "6~7세 아이의 감정 표현을 돕는 대화법", source: "육아정책연구소", summary: "아이가 속상함을 말로 표현하도록 돕는 5가지 질문법을 소개합니다.", tag: "정서" },
  { id: "r2", title: "편식 줄이는 식탁 놀이 아이디어", source: "국민건강영양조사", summary: "채소를 놀이처럼 접하게 하는 식사 시간 팁을 모았습니다.", tag: "식습관" },
  { id: "r3", title: "또래 관계를 키우는 주말 활동", source: "아동발달센터", summary: "낯가림이 있는 아이도 참여하기 쉬운 소규모 놀이 모임 아이디어입니다.", tag: "사회성" },
  { id: "r4", title: "집중력을 키우는 짧은 몰입 놀이", source: "발달심리 저널", summary: "10~15분 단위로 할 수 있는 몰입 놀이 루틴을 제안합니다.", tag: "학습" },
  { id: "r5", title: "잠자리 루틴이 정서 안정에 미치는 영향", source: "수면건강학회", summary: "일정한 취침 루틴이 아이 정서에 주는 긍정적 효과를 설명합니다.", tag: "건강" },
  { id: "r6", title: "창의력을 자극하는 열린 질문 30가지", source: "유아교육협회", summary: "정답이 없는 질문으로 아이의 상상력을 넓히는 방법입니다.", tag: "창의성" },
];

function formatTime(ms: number): string {
  const d = new Date(ms);
  return `${d.getHours().toString().padStart(2, "0")}:${d.getMinutes().toString().padStart(2, "0")} 갱신`;
}

/**
 * 부모 전용 화면입니다. AI가 아이의 리포트를 바탕으로 스크랩해온 육아/성장 추천 자료를 보여줍니다.
 * 실제 백엔드가 없어 새로고침 버튼을 누르면 목업 자료 중 일부를 다시 골라 보여주는 방식으로
 * "실시간으로 갱신되는" 느낌을 흉내 냅니다.
 */
export function RecommendationsFeature() {
  const { data } = useDashboardStore();
  const [items, setItems] = useState<Recommendation[]>(() => POOL.slice(0, 3));
  const [updatedAt, setUpdatedAt] = useState(() => Date.now());

  function refresh() {
    const shuffled = [...POOL].sort(() => Math.random() - 0.5);
    setItems(shuffled.slice(0, 3));
    setUpdatedAt(Date.now());
  }

  return (
    <div className="max-w-2xl">
      <div className="flex items-center justify-between mb-1.5">
        <div className="flex items-center gap-2 text-xs font-bold" style={{ color: "#E879A0" }}>
          <Sparkles className="w-3.5 h-3.5" />
          {withJosa(data.myChild?.nickname ?? "우리 아이", "을/를")} 위한 AI 추천자료
        </div>
        <button onClick={refresh} className="flex items-center gap-1 text-xs font-bold px-2.5 py-1.5 rounded-full transition-colors hover:bg-black/[0.04]" style={{ color: "#A06080" }}>
          <RefreshCw className="w-3.5 h-3.5" /> 새로고침
        </button>
      </div>
      <p className="text-xs mb-5" style={{ color: "#A06080" }}>{formatTime(updatedAt)}</p>

      <div className="space-y-3">
        {items.map((item) => (
          <div key={item.id} className="rounded-2xl bg-card border p-4" style={{ borderColor: "rgba(232,121,160,0.15)" }}>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ background: "#FCE7F3", color: "#BE185D" }}>#{item.tag}</span>
              <ExternalLink className="w-3.5 h-3.5" style={{ color: "#D1D5DB" }} />
            </div>
            <p className="font-bold text-sm" style={{ color: "#3B1355" }}>{item.title}</p>
            <p className="text-xs mt-1" style={{ color: "#A06080" }}>{item.source}</p>
            <p className="text-xs leading-relaxed mt-2" style={{ color: "#6B3580" }}>{item.summary}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
