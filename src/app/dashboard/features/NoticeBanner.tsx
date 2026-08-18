import { useMemo, useState } from "react";
import { Megaphone, X } from "lucide-react";
import { useDashboardStore } from "@/app/dashboard/DashboardStoreContext";

/**
 * 배너로 알리기가 켜진 공지사항을 전 계정 대시보드 상단에 노출합니다. `data.notices`를
 * 직접 읽으므로 원장이 배너를 끄거나 공지를 삭제하면 즉시 사라집니다(별도 동기화 불필요).
 */
export function NoticeBanner() {
  const { data } = useDashboardStore();
  const [dismissed, setDismissed] = useState<Set<number>>(new Set());

  const bannered = useMemo(
    () => data.notices.filter((n) => n.bannerEnabled).sort((a, b) => b.createdAt - a.createdAt),
    [data.notices],
  );

  const visible = bannered.filter((n) => !dismissed.has(n.id));
  const notice = visible[0];
  if (!notice) return null;

  return (
    <div
      className="flex items-center gap-3 rounded-2xl px-4 py-3 mb-4"
      style={{ background: "linear-gradient(135deg,#FFF3D6,#FDE7F3)", border: "1px solid rgba(232,121,160,0.25)" }}
    >
      <span className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0" style={{ background: "rgba(232,121,160,0.18)" }}>
        <Megaphone className="w-4 h-4" style={{ color: "#E879A0" }} />
      </span>
      <p className="flex-1 text-sm font-bold truncate" style={{ color: "#3B1355" }}>
        {notice.title} — {notice.body}
      </p>
      {visible.length > 1 && (
        <span className="text-xs font-bold px-2 py-0.5 rounded-full shrink-0" style={{ background: "rgba(232,121,160,0.15)", color: "#E879A0" }}>
          +{visible.length - 1}개 더보기
        </span>
      )}
      <button
        onClick={() => setDismissed((prev) => new Set(prev).add(notice.id))}
        aria-label="배너 닫기"
        className="w-6 h-6 rounded-full flex items-center justify-center shrink-0 transition-colors hover:bg-black/[0.05]"
      >
        <X className="w-3.5 h-3.5" style={{ color: "#A06080" }} />
      </button>
    </div>
  );
}
