import { PROVIDERS } from "@/app/auth/providers";
import { ProviderIcon } from "@/app/auth/ProviderIcon";
import { getDisplayName } from "@/app/auth/getDisplayName";
import type { AuthUser } from "@/app/auth/types";

/**
 * 프로필 아바타입니다. 이미지가 없으면 이름 첫 글자를 그라디언트 원 안에 그립니다.
 * `showBadge`를 켜면 오른쪽 아래에 어떤 소셜 계정으로 로그인했는지 뱃지를 붙입니다.
 */
export function UserAvatar({
  user,
  size = 36,
  showBadge = true,
}: {
  user: AuthUser;
  size?: number;
  showBadge?: boolean;
}) {
  const provider = user.provider === "email" ? null : PROVIDERS[user.provider];
  const badgeSize = Math.max(16, Math.round(size * 0.42));

  return (
    <span className="relative inline-flex shrink-0" style={{ width: size, height: size }}>
      {user.avatarUrl ? (
        <img
          src={user.avatarUrl}
          alt=""
          className="w-full h-full rounded-full object-cover"
          style={{ border: "2px solid rgba(255,255,255,0.9)" }}
        />
      ) : (
        <span
          className="w-full h-full rounded-full flex items-center justify-center font-bold text-white select-none"
          style={{
            background: "linear-gradient(135deg,#E879A0,#C084FC)",
            fontSize: size * 0.42,
            fontFamily: "'Fredoka',sans-serif",
            border: "2px solid rgba(255,255,255,0.9)",
          }}
        >
          {getDisplayName(user).trim().charAt(0) || "K"}
        </span>
      )}

      {showBadge && provider && user.provider !== "email" && (
        <span
          className="absolute -bottom-0.5 -right-0.5 rounded-full flex items-center justify-center"
          style={{
            width: badgeSize,
            height: badgeSize,
            background: provider.brand.background,
            border: "1.5px solid white",
            boxShadow: "0 1px 4px rgba(0,0,0,0.15)",
          }}
        >
          <ProviderIcon provider={user.provider} size={badgeSize * 0.6} />
        </span>
      )}
    </span>
  );
}
