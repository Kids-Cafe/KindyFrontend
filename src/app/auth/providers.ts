import type { SocialProviderId } from "@/app/auth/types";

/**
 * 소셜 제공자의 **표시 정보**입니다. 이름과 버튼 색이 전부입니다.
 *
 * 예전에는 여기에 인가 URL과 client ID, 스코프, PKCE 지원 여부까지 들어 있었습니다.
 * 지금은 전부 백엔드로 옮겼습니다 — 토큰 교환에는 client secret이 필요한데 그 값은
 * 브라우저에 둘 수 없고, 브라우저가 만든 state보다 서버 세션에 있는 state가 더
 * 믿을 만하기 때문입니다. 프론트가 하는 일은 `beginOAuth()`로 주소창을 옮기는 것뿐입니다.
 */
export interface ProviderConfig {
  id: SocialProviderId;
  /** 화면에 노출되는 이름 */
  label: string;
  /** 버튼 브랜드 스타일 */
  brand: { background: string; border?: string };
}

export const PROVIDERS: Record<SocialProviderId, ProviderConfig> = {
  kakao: {
    id: "kakao",
    label: "카카오",
    brand: { background: "#FEE500" },
  },
  naver: {
    id: "naver",
    label: "네이버",
    brand: { background: "#03C75A" },
  },
  google: {
    id: "google",
    label: "구글",
    brand: { background: "#FFFFFF", border: "1.5px solid #E5E7EB" },
  },
  apple: {
    id: "apple",
    label: "애플",
    brand: { background: "#000000" },
  },
};

/**
 * 버튼 렌더 순서입니다.
 *
 * 애플은 빠져 있습니다. Sign in with Apple은 client secret이 .p8 키로 서명한 ES256 JWT라
 * 6개월마다 갱신해야 하고 콜백도 POST로 오기 때문에, 백엔드에 아직 구현돼 있지 않습니다.
 * 목록에 두면 눌렀을 때 NOT_AVAILABLE로 떨어지므로 아예 내보내지 않습니다.
 */
export const PROVIDER_ORDER: SocialProviderId[] = ["kakao", "naver", "google"];
