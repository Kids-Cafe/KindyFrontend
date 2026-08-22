import { useEffect, useState } from "react";
import { Check, Loader2 } from "lucide-react";
import { PROVIDERS, PROVIDER_ORDER } from "@/app/auth/providers";
import { ProviderIcon } from "@/app/auth/ProviderIcon";
import type { SocialProviderId } from "@/app/auth/types";
import { beginOAuth, getOAuthLinks, unlinkOAuth } from "@/app/lib/api";
import { withJosa } from "@/app/lib/korean";

/**
 * "연동된 계정" 패널입니다. 소셜 계정을 계정에 붙이고 떼는 화면입니다.
 *
 * 가입은 언제나 이메일과 비밀번호로 합니다. 여기서 붙이는 소셜 계정은 **로그인 수단이
 * 하나 더 생기는 것**이지 새 계정이 생기는 게 아닙니다. 반대로 연동을 해제해도 비밀번호
 * 로그인은 그대로 남아 있어서 계정에 못 들어가게 되는 일이 없습니다 — "마지막 하나는
 * 못 지웁니다" 같은 제약이 없는 이유입니다.
 *
 * 목록은 화면에 들어올 때 서버에서 다시 읽습니다. 다른 기기에서 연동을 바꿨거나 방금
 * 연동을 마치고 돌아온 경우, localStorage에 남은 값은 이미 틀린 값이기 때문입니다.
 */
export function LinkedAccountsPanel({ onDone }: { onDone: (message?: string) => void }) {
  const [linked, setLinked] = useState<SocialProviderId[] | null>(null);
  const [busy, setBusy] = useState<SocialProviderId | null>(null);
  const [confirming, setConfirming] = useState<SocialProviderId | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      try {
        const links = await getOAuthLinks();
        if (cancelled) return;
        setLinked(links.map((link) => link.provider.toLowerCase() as SocialProviderId));
      } catch {
        if (cancelled) return;
        setLinked([]);
        setError("연동 정보를 불러오지 못했어요. 잠시 후 다시 시도해주세요.");
      }
    })();

    return () => { cancelled = true; };
  }, []);

  async function handleUnlink(id: SocialProviderId) {
    setConfirming(null);
    setBusy(id);
    setError(null);
    try {
      await unlinkOAuth(id);
      setLinked((prev) => (prev ?? []).filter((p) => p !== id));
      onDone(`${withJosa(PROVIDERS[id].label, "과/와")}의 연동을 해제했어요`);
    } catch {
      setError("연동을 해제하지 못했어요. 잠시 후 다시 시도해주세요.");
    } finally {
      setBusy(null);
    }
  }

  if (linked === null) {
    return (
      <div className="flex items-center gap-2 text-sm" style={{ color: "#9CA3AF" }}>
        <Loader2 className="w-4 h-4 animate-spin" />
        연동 정보를 불러오는 중이에요
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {PROVIDER_ORDER.map((id) => {
        const provider = PROVIDERS[id];
        const isLinked = linked.includes(id);
        const isBusy = busy === id;

        return (
          <div key={id} className="flex items-center gap-3 rounded-2xl px-3 py-2.5" style={{ border: "1.5px solid #F3F4F6" }}>
            <span
              className="relative w-11 h-11 rounded-2xl flex items-center justify-center shrink-0"
              style={{
                background: provider.brand.background,
                border: provider.brand.border ?? "none",
                opacity: isLinked ? 1 : 0.28,
                filter: isLinked ? "none" : "grayscale(1)",
              }}
            >
              <ProviderIcon provider={id} size={18} />
              {isLinked && (
                <span className="absolute -top-1 -right-1 rounded-full flex items-center justify-center" style={{ width: 18, height: 18, background: "#22C55E", border: "1.5px solid white" }}>
                  <Check className="w-2.5 h-2.5" style={{ color: "white" }} strokeWidth={3.5} />
                </span>
              )}
            </span>

            <span className="flex-1 min-w-0">
              <span className="block text-sm font-bold" style={{ color: "#1F0A3C" }}>{provider.label}</span>
              <span className="block text-xs" style={{ color: "#9CA3AF" }}>
                {isLinked ? "연동됨" : "연동하면 이 계정으로도 로그인할 수 있어요"}
              </span>
            </span>

            {confirming === id ? (
              <span className="flex gap-1.5 shrink-0">
                <button
                  onClick={() => void handleUnlink(id)}
                  className="px-3 h-9 rounded-xl text-xs font-bold"
                  style={{ background: "#EF4444", color: "white" }}
                >
                  해제
                </button>
                <button
                  onClick={() => setConfirming(null)}
                  className="px-3 h-9 rounded-xl text-xs font-bold"
                  style={{ color: "#6B7280", border: "1.5px solid #E5E7EB" }}
                >
                  취소
                </button>
              </span>
            ) : (
              <button
                onClick={() => (isLinked ? setConfirming(id) : beginOAuth(id, "link", "/"))}
                disabled={isBusy}
                className="px-3.5 h-9 rounded-xl text-xs font-bold shrink-0 disabled:opacity-50"
                style={
                  isLinked
                    ? { color: "#EF4444", border: "1.5px solid #FECACA" }
                    : { color: "#E879A0", border: "1.5px solid #FBCFE8", background: "rgba(232,121,160,0.08)" }
                }
              >
                {isBusy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : isLinked ? "연동 해제" : "연동하기"}
              </button>
            )}
          </div>
        );
      })}

      {error && <p className="text-xs font-bold" style={{ color: "#EF4444" }}>{error}</p>}

      <p className="text-xs leading-relaxed" style={{ color: "#9CA3AF" }}>
        연동을 해제해도 아이디와 비밀번호로는 계속 로그인할 수 있어요.
      </p>
    </div>
  );
}
