import type { SocialProviderId } from "@/app/auth/types";

/**
 * 제공자별 OAuth 2.0 설정입니다.
 *
 * clientId는 `.env.local`에서 읽어옵니다(예: VITE_KAKAO_CLIENT_ID).
 * 값이 비어 있으면 해당 제공자는 자동으로 "목업 모드"로 동작해서,
 * 실제 인가 서버로 나가지 않고 가짜 계정으로 로그인 흐름만 재현합니다.
 * 덕분에 앱 키를 아직 발급받지 않아도 화면을 그대로 확인할 수 있습니다.
 */
export interface ProviderConfig {
  id: SocialProviderId;
  /** 화면에 노출되는 이름 */
  label: string;
  /** 인가 코드를 받기 위한 authorization endpoint */
  authorizeUrl: string;
  /** .env에서 읽은 클라이언트 ID (없으면 빈 문자열 → 목업 모드) */
  clientId: string;
  /** 요청할 스코프. 빈 배열이면 scope 파라미터를 아예 붙이지 않습니다. */
  scope: string[];
  /** PKCE(code_challenge) 지원 여부 */
  supportsPkce: boolean;
  /** 제공자별로 추가로 필요한 쿼리 파라미터 */
  extraParams?: Record<string, string>;
  /** 버튼 브랜드 스타일 */
  brand: { background: string; border?: string };
}

/** 인가 서버가 되돌려 보낼 리다이렉트 URI입니다. 콘솔에 등록한 값과 정확히 같아야 합니다. */
export const OAUTH_REDIRECT_URI: string =
  import.meta.env.VITE_OAUTH_REDIRECT_URI || `${window.location.origin}/oauth/callback`;

export const PROVIDERS: Record<SocialProviderId, ProviderConfig> = {
  kakao: {
    id: "kakao",
    label: "카카오",
    authorizeUrl: "https://kauth.kakao.com/oauth/authorize",
    clientId: import.meta.env.VITE_KAKAO_CLIENT_ID || "",
    // 카카오는 콘솔에서 켠 동의 항목을 기준으로 하므로 scope를 생략해도 됩니다.
    scope: [],
    supportsPkce: true,
    brand: { background: "#FEE500" },
  },
  naver: {
    id: "naver",
    label: "네이버",
    authorizeUrl: "https://nid.naver.com/oauth2.0/authorize",
    clientId: import.meta.env.VITE_NAVER_CLIENT_ID || "",
    scope: [],
    // 네이버 로그인은 PKCE를 지원하지 않아 state만으로 위조 요청을 막습니다.
    supportsPkce: false,
    brand: { background: "#03C75A" },
  },
  google: {
    id: "google",
    label: "구글",
    authorizeUrl: "https://accounts.google.com/o/oauth2/v2/auth",
    clientId: import.meta.env.VITE_GOOGLE_CLIENT_ID || "",
    scope: ["openid", "email", "profile"],
    supportsPkce: true,
    // refresh token을 받으려면 서버 쪽에서 access_type=offline을 함께 씁니다.
    extraParams: { prompt: "select_account" },
    brand: { background: "#FFFFFF", border: "1.5px solid #E5E7EB" },
  },
  apple: {
    id: "apple",
    label: "애플",
    authorizeUrl: "https://appleid.apple.com/auth/authorize",
    // 애플은 앱 ID가 아니라 Services ID를 client_id로 사용합니다.
    clientId: import.meta.env.VITE_APPLE_CLIENT_ID || "",
    // name/email 스코프를 요청하면 애플이 response_mode=form_post(POST)를 강제하므로,
    // 프론트 단독 처리에서는 스코프 없이 code만 받고 사용자 정보는 백엔드에서 채웁니다.
    scope: [],
    supportsPkce: false,
    extraParams: { response_mode: "query" },
    brand: { background: "#000000" },
  },
};

/** 버튼 렌더 순서 */
export const PROVIDER_ORDER: SocialProviderId[] = ["kakao", "naver", "google", "apple"];

/** clientId가 없으면 목업 모드로 동작합니다. */
export function isMockMode(provider: ProviderConfig): boolean {
  return provider.clientId.trim() === "";
}

/** 인가 요청 URL을 조립합니다. */
export function buildAuthorizeUrl(
  provider: ProviderConfig,
  options: { state: string; codeChallenge?: string },
): string {
  const params = new URLSearchParams({
    response_type: "code",
    client_id: provider.clientId,
    redirect_uri: OAUTH_REDIRECT_URI,
    state: options.state,
    ...provider.extraParams,
  });

  if (provider.scope.length > 0) params.set("scope", provider.scope.join(" "));

  if (provider.supportsPkce && options.codeChallenge) {
    params.set("code_challenge", options.codeChallenge);
    params.set("code_challenge_method", "S256");
  }

  return `${provider.authorizeUrl}?${params.toString()}`;
}
