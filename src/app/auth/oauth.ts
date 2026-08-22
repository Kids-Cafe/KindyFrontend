import type { SocialProviderId } from "@/app/auth/types";

/**
 * 소셜 로그인에서 프론트가 맡는 부분입니다.
 *
 * 예전에는 이 파일이 인가 URL을 조립하고 PKCE를 만들고, 백엔드가 없을 때는 가짜 세션까지
 * 지어냈습니다. 지금은 전부 서버가 합니다. 남은 일은 두 가지뿐입니다 —
 * 지금 열린 주소가 콜백 화면인지 판별하는 것, 그리고 서버가 붙여 보낸 결과 코드를
 * 사람이 읽을 말로 옮기는 것.
 */

/** 인가 서버에서 돌아온 브라우저가 도착하는 앱 경로입니다. */
export const OAUTH_CALLBACK_PATH = "/oauth/callback";

/** 지금 열린 URL이 OAuth 콜백 경로인지 판별합니다. */
export function isOnCallbackRoute(): boolean {
  return window.location.pathname === OAUTH_CALLBACK_PATH;
}

/** 백엔드가 `?result=`로 실어 보내는 결과 코드입니다. */
export type OAuthResult =
  | "SIGNIN_COMPLETE"
  | "LINK_COMPLETE"
  | "NO_LINKED_ACCOUNT"
  | "ALREADY_LINKED"
  | "INVALID_ACCESS"
  | "INVALID_STATE"
  | "NOT_AVAILABLE"
  | "OAUTH_FAILED";

export interface OAuthCallbackParams {
  result: OAuthResult | null;
  provider: SocialProviderId | null;
  returnTo: string;
}

/** 콜백 URL의 쿼리에서 결과를 읽습니다. */
export function readCallbackParams(): OAuthCallbackParams {
  const query = new URLSearchParams(window.location.search);
  const returnTo = query.get("returnTo") || "/";

  return {
    result: (query.get("result") as OAuthResult | null) ?? null,
    provider: (query.get("provider") as SocialProviderId | null) ?? null,
    // 서버가 이미 검증한 값이지만, 주소창은 누구나 고칠 수 있으므로 여기서도 한 번 더
    // 확인합니다. 앱 안의 경로가 아니면 첫 화면으로 보냅니다.
    returnTo: returnTo.startsWith("/") && !returnTo.startsWith("//") ? returnTo : "/",
  };
}

/**
 * 실패한 결과를 안내 문구로 옮깁니다.
 *
 * `NO_LINKED_ACCOUNT`가 실제로 가장 자주 보게 될 코드입니다 — 가입은 이메일로만 하고
 * 소셜은 나중에 연동하는 구조라, 연동한 적 없는 계정으로 소셜 로그인을 누르면
 * 여기로 옵니다. 그래서 "안 됩니다"가 아니라 다음에 뭘 하면 되는지를 알려줍니다.
 */
export function messageForResult(result: OAuthResult | null): string {
  switch (result) {
    case "NO_LINKED_ACCOUNT":
      return "아직 연동되지 않은 계정이에요. 이메일로 로그인한 뒤 마이페이지에서 연동해주세요.";
    case "ALREADY_LINKED":
      return "이미 다른 Kindy 계정에 연동된 소셜 계정이에요.";
    case "INVALID_ACCESS":
      return "로그인이 풀렸어요. 다시 로그인한 뒤 시도해주세요.";
    case "INVALID_STATE":
      return "보안 검증에 실패했어요. 안전을 위해 로그인을 중단합니다.";
    case "NOT_AVAILABLE":
      return "지금은 이 방법으로 로그인할 수 없어요. 잠시 후 다시 시도해주세요.";
    default:
      return "인증에 실패했어요. 다시 시도해주세요.";
  }
}
