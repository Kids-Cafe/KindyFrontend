import { PROVIDERS, buildAuthorizeUrl, isMockMode, OAUTH_REDIRECT_URI } from "@/app/auth/providers";
import { createCodeChallenge, createCodeVerifier, createState } from "@/app/auth/pkce";
import { savePendingRequest, takePendingRequest } from "@/app/auth/storage";
import type { AuthSession, OAuthCallbackParams, SocialProviderId } from "@/app/auth/types";

/** 인가 서버에서 돌아왔을 때 앱이 받아주는 경로입니다. */
export const OAUTH_CALLBACK_PATH = "/oauth/callback";

/** 목업 모드에서 콜백 URL에 붙이는 표시입니다. */
const MOCK_FLAG = "kindy_mock";

/** 지금 열린 URL이 OAuth 콜백 경로인지 판별합니다. */
export function isOnCallbackRoute(): boolean {
  return window.location.pathname === OAUTH_CALLBACK_PATH;
}

/**
 * 소셜 로그인을 시작합니다. state/PKCE를 만들어 저장한 뒤 인가 페이지로 이동합니다.
 * 이 함수는 정상 동작 시 페이지를 떠나므로 반환되지 않습니다.
 */
export async function beginSocialLogin(providerId: SocialProviderId): Promise<void> {
  const provider = PROVIDERS[providerId];
  const state = createState();

  let codeVerifier: string | undefined;
  let codeChallenge: string | undefined;

  if (provider.supportsPkce) {
    codeVerifier = createCodeVerifier();
    codeChallenge = (await createCodeChallenge(codeVerifier)) ?? undefined;
    // 보안 컨텍스트가 아니어서 challenge를 못 만들었으면 PKCE 없이 진행합니다.
    if (!codeChallenge) codeVerifier = undefined;
  }

  savePendingRequest({
    provider: providerId,
    state,
    codeVerifier,
    returnTo: window.location.pathname + window.location.search,
    createdAt: Date.now(),
  });

  if (isMockMode(provider)) {
    // 앱 키가 없을 때: 실제 인가 서버 대신 콜백 경로로 바로 이동해
    // 리다이렉트 왕복 흐름을 그대로 재현합니다.
    const mockUrl = new URL(OAUTH_REDIRECT_URI);
    mockUrl.searchParams.set("code", `mock_code_${providerId}_${state.slice(0, 8)}`);
    mockUrl.searchParams.set("state", state);
    mockUrl.searchParams.set(MOCK_FLAG, "1");
    window.location.assign(mockUrl.toString());
    return;
  }

  window.location.assign(buildAuthorizeUrl(provider, { state, codeChallenge }));
}

/** 현재 URL 쿼리에서 콜백 파라미터를 읽습니다. */
export function readCallbackParams(): OAuthCallbackParams {
  const query = new URLSearchParams(window.location.search);
  return {
    code: query.get("code"),
    state: query.get("state"),
    error: query.get("error"),
    errorDescription: query.get("error_description"),
  };
}

/** 콜백 처리 결과입니다. */
export type CallbackResult =
  | { ok: true; session: AuthSession; returnTo: string }
  | { ok: false; message: string };

/**
 * 콜백 파라미터를 검증하고 세션을 만들어 돌려줍니다.
 * state 불일치나 code 누락은 모두 실패로 처리합니다.
 */
export async function completeSocialLogin(): Promise<CallbackResult> {
  const params = readCallbackParams();
  const pending = takePendingRequest();

  if (params.error) {
    return {
      ok: false,
      message:
        params.error === "access_denied"
          ? "로그인을 취소하셨어요. 다시 시도해주세요."
          : params.errorDescription || `인증에 실패했어요. (${params.error})`,
    };
  }

  if (!pending) {
    return { ok: false, message: "로그인 요청 정보를 찾을 수 없어요. 처음부터 다시 시도해주세요." };
  }

  // state 검증 — CSRF 및 세션 고정 공격 방어의 핵심입니다.
  if (!params.state || params.state !== pending.state) {
    return { ok: false, message: "보안 검증에 실패했어요. 안전을 위해 로그인을 중단합니다." };
  }

  if (!params.code) {
    return { ok: false, message: "인가 코드를 받지 못했어요. 다시 시도해주세요." };
  }

  const isMock = new URLSearchParams(window.location.search).get(MOCK_FLAG) === "1";

  try {
    const session = isMock
      ? await createMockSession(pending.provider)
      : await exchangeCodeForSession({
          provider: pending.provider,
          code: params.code,
          codeVerifier: pending.codeVerifier,
        });

    return { ok: true, session, returnTo: pending.returnTo || "/" };
  } catch (error) {
    const message = error instanceof Error ? error.message : "로그인 처리 중 문제가 생겼어요.";
    return { ok: false, message };
  }
}

/**
 * ⚠️ 백엔드 연동 지점입니다.
 *
 * 인가 코드를 액세스 토큰으로 바꾸는 요청에는 client secret이 필요한데,
 * 이 값은 브라우저에 절대 두면 안 됩니다. 그래서 실제 서비스에서는
 * 아래처럼 code를 우리 서버로 넘기고, 서버가 제공자와 토큰 교환을 한 뒤
 * 우리 서비스의 세션(JWT 등)을 내려주는 구조가 됩니다.
 *
 * 서버가 준비되면 아래 주석을 풀고 목업 반환을 지우면 됩니다.
 */
async function exchangeCodeForSession(input: {
  provider: SocialProviderId;
  code: string;
  codeVerifier?: string;
}): Promise<AuthSession> {
  // TODO(백엔드 연동): 아래 요청으로 교체하세요.
  //
  // const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/auth/social/${input.provider}`, {
  //   method: "POST",
  //   headers: { "Content-Type": "application/json" },
  //   credentials: "include",
  //   body: JSON.stringify({
  //     code: input.code,
  //     codeVerifier: input.codeVerifier,
  //     redirectUri: OAUTH_REDIRECT_URI,
  //   }),
  // });
  // if (!response.ok) throw new Error("서버에서 로그인 처리를 완료하지 못했어요.");
  // const data = await response.json();
  // return { user: data.user, accessToken: data.accessToken, expiresAt: Date.now() + data.expiresIn * 1000 };

  console.info(
    `[Kindy] ${input.provider} 인가 코드를 받았습니다. 백엔드 토큰 교환이 아직 연결되지 않아 임시 세션을 만듭니다.`,
    { code: input.code, hasCodeVerifier: Boolean(input.codeVerifier) },
  );
  return createMockSession(input.provider);
}

/** 제공자별 목업 프로필입니다. 백엔드 연동 전까지 화면 확인용으로만 씁니다. */
const MOCK_PROFILES: Record<SocialProviderId, { name: string; email: string }> = {
  kakao: { name: "김카카오", email: "kakao.user@kakao.com" },
  naver: { name: "이네이버", email: "naver.user@naver.com" },
  google: { name: "박구글", email: "google.user@gmail.com" },
  apple: { name: "최애플", email: "apple.user@privaterelay.appleid.com" },
};

/** 네트워크 지연을 흉내 내 로딩 상태가 실제처럼 보이게 합니다. */
async function createMockSession(provider: SocialProviderId): Promise<AuthSession> {
  await new Promise((resolve) => setTimeout(resolve, 700));

  const profile = MOCK_PROFILES[provider];
  return {
    user: {
      id: `${provider}_${Math.random().toString(36).slice(2, 10)}`,
      name: profile.name,
      email: profile.email,
      provider,
      joinedAt: new Date().toISOString(),
    },
    accessToken: `mock_access_token_${provider}`,
    // 목업 세션은 24시간 유지합니다.
    expiresAt: Date.now() + 24 * 60 * 60 * 1000,
  };
}
