import { X, LogOut, Bell, Shield, Baby, ChevronRight, Check } from "lucide-react";
import { useAuth } from "@/app/auth/AuthContext";
import { PROVIDERS, PROVIDER_ORDER } from "@/app/auth/providers";
import { ProviderIcon } from "@/app/auth/ProviderIcon";
import { UserAvatar } from "@/app/auth/UserAvatar";

/** 마이페이지 메뉴 항목입니다. 아직 화면만 있는 목업입니다. */
const MENU_ITEMS = [
  { icon: Baby, label: "우리 아이 정보", hint: "이름 · 생년월일 · 관심사" },
  { icon: Bell, label: "알림 설정", hint: "하루 기록 알림 받기" },
  { icon: Shield, label: "개인정보 및 보안", hint: "데이터 관리와 계정 보호" },
] as const;

/** ISO 문자열을 "2026년 7월 29일" 형태로 바꿉니다. */
function formatJoinedAt(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "-";
  return `${date.getFullYear()}년 ${date.getMonth() + 1}월 ${date.getDate()}일`;
}

/**
 * 로그인한 사용자의 마이페이지 모달입니다.
 * 프로필, 연동된 소셜 계정 상태, 설정 메뉴, 로그아웃을 담습니다.
 */
export function MyPage({ onClose }: { onClose: () => void }) {
  const { user, logout } = useAuth();

  // 비로그인 상태에서 열릴 일은 없지만, 방어적으로 처리합니다.
  if (!user) return null;

  const provider = user.provider === "email" ? null : PROVIDERS[user.provider];

  const handleLogout = () => {
    logout();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[9000] flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-label="마이페이지">
      {/* 배경 딤 */}
      <div
        className="absolute inset-0"
        style={{ background: "rgba(31,10,60,0.45)", backdropFilter: "blur(4px)" }}
        onClick={onClose}
      />

      <div
        className="relative w-full max-w-md rounded-3xl bg-white overflow-hidden shadow-2xl max-h-[90vh] overflow-y-auto"
        style={{ boxShadow: "0 24px 64px rgba(31,10,60,0.28)" }}
      >
        {/* ── 헤더 ── */}
        <div
          className="relative px-7 pt-7 pb-8"
          style={{ background: "linear-gradient(135deg, #E879A0 0%, #F472B6 50%, #C084FC 100%)" }}
        >
          <button
            onClick={onClose}
            aria-label="마이페이지 닫기"
            className="absolute top-5 right-5 w-9 h-9 rounded-full flex items-center justify-center transition-all hover:bg-white/20 active:scale-95"
            style={{ color: "white" }}
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-4">
            <UserAvatar user={user} size={64} />
            <div className="min-w-0">
              <p className="text-xl font-bold text-white truncate" style={{ fontFamily: "'Fredoka',sans-serif" }}>
                {user.name}
              </p>
              <p className="text-sm truncate" style={{ color: "rgba(255,255,255,0.8)" }}>{user.email}</p>
              <p className="text-xs mt-1" style={{ color: "rgba(255,255,255,0.65)" }}>
                {formatJoinedAt(user.joinedAt)}부터 함께하는 중
              </p>
            </div>
          </div>
        </div>

        {/* ── 연동 계정 ── */}
        <div className="px-7 pt-6">
          <p className="text-xs font-bold mb-3" style={{ color: "#6B7280" }}>연동된 계정</p>
          <div className="flex gap-2.5">
            {PROVIDER_ORDER.map((id) => {
              const isLinked = id === user.provider;
              return (
                <div
                  key={id}
                  title={isLinked ? `${PROVIDERS[id].label} 연동됨` : `${PROVIDERS[id].label} 미연동`}
                  className="relative w-11 h-11 rounded-2xl flex items-center justify-center"
                  style={{
                    background: PROVIDERS[id].brand.background,
                    border: PROVIDERS[id].brand.border ?? "none",
                    // 연동되지 않은 제공자는 흐리게 표시합니다.
                    opacity: isLinked ? 1 : 0.28,
                    filter: isLinked ? "none" : "grayscale(1)",
                  }}
                >
                  <ProviderIcon provider={id} size={18} />
                  {isLinked && (
                    <span
                      className="absolute -top-1 -right-1 rounded-full flex items-center justify-center"
                      style={{ width: 18, height: 18, background: "#22C55E", border: "1.5px solid white" }}
                    >
                      <Check className="w-2.5 h-2.5" style={{ color: "white" }} strokeWidth={3.5} />
                    </span>
                  )}
                </div>
              );
            })}
          </div>
          <p className="text-xs mt-2.5" style={{ color: "#9CA3AF" }}>
            {provider ? `현재 ${provider.label} 계정으로 로그인되어 있어요` : "이메일 계정으로 로그인되어 있어요"}
          </p>
        </div>

        {/* ── 설정 메뉴 ── */}
        <div className="px-7 pt-6">
          <p className="text-xs font-bold mb-2" style={{ color: "#6B7280" }}>설정</p>
          <div className="rounded-2xl overflow-hidden" style={{ border: "1.5px solid #F3F4F6" }}>
            {MENU_ITEMS.map((item, index) => (
              <button
                key={item.label}
                className="w-full flex items-center gap-3 px-4 py-3.5 transition-colors hover:bg-gray-50 text-left"
                style={{ borderTop: index === 0 ? "none" : "1px solid #F3F4F6" }}
              >
                <span
                  className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                  style={{ background: "rgba(232,121,160,0.1)" }}
                >
                  <item.icon className="w-4 h-4" style={{ color: "#E879A0" }} />
                </span>
                <span className="flex-1 min-w-0">
                  <span className="block text-sm font-bold" style={{ color: "#1F0A3C" }}>{item.label}</span>
                  <span className="block text-xs truncate" style={{ color: "#9CA3AF" }}>{item.hint}</span>
                </span>
                <ChevronRight className="w-4 h-4 shrink-0" style={{ color: "#D1D5DB" }} />
              </button>
            ))}
          </div>
        </div>

        {/* ── 로그아웃 ── */}
        <div className="px-7 py-6">
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 rounded-2xl font-bold text-sm transition-all hover:bg-red-50 active:scale-[0.98]"
            style={{ height: 50, color: "#EF4444", border: "1.5px solid #FECACA" }}
          >
            <LogOut className="w-4 h-4" />
            로그아웃
          </button>
        </div>
      </div>
    </div>
  );
}
