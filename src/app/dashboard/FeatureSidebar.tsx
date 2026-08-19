import { PanelLeftClose, Settings } from "lucide-react";
import { useAuth } from "@/app/auth/AuthContext";
import { UserAvatar } from "@/app/auth/UserAvatar";
import { useDisplayName } from "@/app/auth/useDisplayName";
import type { FeatureDef, FeatureId } from "@/app/dashboard/types";

/**
 * 디스코드의 "채널 목록" 자리를 기능 목록으로 대체한 좌측 사이드바입니다.
 * 맨 아래에는 디스코드의 유저 패널처럼 마이페이지 진입 버튼을 고정 배치합니다.
 */
export function FeatureSidebar({
  kindergartenName,
  contextLabel,
  features,
  activeFeature,
  onSelectFeature,
  onOpenMyPage,
  onCollapse,
}: {
  kindergartenName: string;
  contextLabel: string;
  features: FeatureDef[];
  activeFeature: FeatureId;
  onSelectFeature: (id: FeatureId) => void;
  onOpenMyPage: () => void;
  onCollapse: () => void;
}) {
  const { user } = useAuth();
  const displayName = useDisplayName();
  if (!user) return null;

  return (
    <div className="w-64 h-full shrink-0 flex flex-col bg-card border-r" style={{ borderColor: "rgba(232,121,160,0.15)" }}>
      <div className="px-4 py-4 border-b flex items-center justify-between gap-2" style={{ borderColor: "rgba(232,121,160,0.12)" }}>
        <div className="min-w-0">
          <p className="font-bold text-sm truncate" style={{ color: "#3B1355", fontFamily: "'Fredoka',sans-serif" }}>{kindergartenName}</p>
          <p className="text-xs truncate mt-0.5" style={{ color: "#A06080" }}>{contextLabel}</p>
        </div>
        <button
          onClick={onCollapse}
          aria-label="기능 목록 닫기"
          className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-colors hover:bg-black/[0.04]"
        >
          <PanelLeftClose className="w-4 h-4" style={{ color: "#A06080" }} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-2.5 py-3 space-y-0.5">
        <p className="px-2 mb-1.5 text-xs font-bold uppercase tracking-wide" style={{ color: "#C0A0B5" }}>기능</p>
        {features.map((feature) => {
          const active = feature.id === activeFeature;
          return (
            <button
              key={feature.id}
              onClick={() => onSelectFeature(feature.id)}
              className="w-full flex items-center gap-2.5 px-2.5 py-2.5 rounded-xl text-left transition-all"
              style={active ? { background: "rgba(232,121,160,0.12)" } : {}}
            >
              <feature.icon className="w-4 h-4 shrink-0" style={{ color: active ? "#E879A0" : "#A06080" }} />
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-bold truncate" style={{ color: active ? "#E879A0" : "#3B1355" }}>{feature.label}</span>
                <span className="block text-xs truncate" style={{ color: "#A06080" }}>{feature.hint}</span>
              </span>
            </button>
          );
        })}
      </div>

      <button
        onClick={onOpenMyPage}
        className="flex items-center gap-2.5 px-3 py-3 border-t transition-colors hover:bg-black/[0.02]"
        style={{ borderColor: "rgba(232,121,160,0.12)" }}
      >
        <UserAvatar user={user} size={34} />
        <div className="min-w-0 flex-1 text-left">
          <p className="text-sm font-bold truncate" style={{ color: "#3B1355" }}>{displayName}</p>
          <p className="text-xs truncate" style={{ color: "#A06080" }}>마이페이지</p>
        </div>
        <Settings className="w-4 h-4 shrink-0" style={{ color: "#A06080" }} />
      </button>
    </div>
  );
}
