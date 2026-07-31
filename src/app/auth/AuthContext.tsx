import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { beginSocialLogin } from "@/app/auth/oauth";
import { loginMockUser, updateMockUser } from "@/app/auth/mockSignup";
import { SESSION_TTL_MS, clearSession, loadSession, saveSession } from "@/app/auth/storage";
import type { AuthSession, AuthUser, SocialProviderId } from "@/app/auth/types";
import { newId } from "@/app/lib/id";

interface AuthContextValue {
  /** 로그인한 사용자. 비로그인 상태면 null */
  user: AuthUser | null;
  isAuthenticated: boolean;
  /** 첫 렌더에서 localStorage를 읽는 동안 true */
  isLoading: boolean;
  /** 로그인 진행 중인 제공자. 버튼 스피너 표시에 씁니다. */
  pendingProvider: SocialProviderId | null;
  /** 마지막 로그인 실패 메시지 */
  error: string | null;
  /** 인가 페이지로 이동시킵니다. */
  loginWith: (provider: SocialProviderId) => Promise<void>;
  /** 아이디/비밀번호로 mock 로그인을 시도합니다. 성공하면 true를 돌려주고 세션을 반영합니다. */
  loginWithPassword: (loginId: string, password: string) => Promise<boolean>;
  /** 비밀번호 대조가 진행 중인지. 로그인 버튼 잠금/스피너에 씁니다. */
  isSubmittingPassword: boolean;
  /** 콜백 처리 결과로 받은 세션을 확정합니다. */
  setSession: (session: AuthSession) => void;
  /** 로그인된 사용자 정보 일부를 병합해 저장합니다. 온보딩 단계에서 씁니다. */
  updateProfile: (partial: Partial<AuthUser>) => void;
  setError: (message: string | null) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

/**
 * 앱 전역 인증 상태 제공자입니다.
 * 세션은 localStorage에 저장되어 새로고침 후에도 유지되고,
 * 다른 탭에서 로그아웃하면 storage 이벤트로 이 탭도 함께 정리됩니다.
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSessionState] = useState<AuthSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [pendingProvider, setPendingProvider] = useState<SocialProviderId | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmittingPassword, setIsSubmittingPassword] = useState(false);

  // 최초 마운트 시 저장된 세션을 복원합니다.
  useEffect(() => {
    setSessionState(loadSession());
    setIsLoading(false);
  }, []);

  // 다른 탭에서의 로그인/로그아웃을 따라갑니다.
  useEffect(() => {
    const onStorage = (event: StorageEvent) => {
      if (event.key && !event.key.startsWith("kindy.auth")) return;
      setSessionState(loadSession());
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const setSession = useCallback((next: AuthSession) => {
    saveSession(next);
    setSessionState(next);
    setError(null);
    setPendingProvider(null);
  }, []);

  const loginWith = useCallback(async (provider: SocialProviderId) => {
    setError(null);
    setPendingProvider(provider);
    try {
      await beginSocialLogin(provider);
      // 정상 흐름이면 여기서 페이지를 떠나므로 아래 코드는 실행되지 않습니다.
    } catch (cause) {
      console.error("[Kindy] 소셜 로그인 시작 실패", cause);
      setError("로그인 페이지로 이동하지 못했어요. 잠시 후 다시 시도해주세요.");
      setPendingProvider(null);
    }
  }, []);

  const loginWithPassword = useCallback(async (loginId: string, password: string): Promise<boolean> => {
    setError(null);
    setIsSubmittingPassword(true);
    try {
      const result = await loginMockUser(loginId, password);
      if (!result.ok) {
        setError(
          result.reason === "crypto-unavailable"
            ? "보안 연결(HTTPS)에서만 로그인할 수 있어요. 주소를 확인해주세요."
            : // 아이디 존재 여부가 드러나지 않도록 나머지는 같은 문구를 보여줍니다.
              "아이디 또는 비밀번호가 올바르지 않아요.",
        );
        return false;
      }
      setSession({ user: result.user, accessToken: newId(), expiresAt: Date.now() + SESSION_TTL_MS });
      return true;
    } catch (cause) {
      console.error("[Kindy] 로그인 처리 실패", cause);
      setError("로그인 중 문제가 생겼어요. 잠시 후 다시 시도해주세요.");
      return false;
    } finally {
      setIsSubmittingPassword(false);
    }
  }, [setSession]);

  const updateProfile = useCallback((partial: Partial<AuthUser>) => {
    setSessionState((prev) => {
      if (!prev) return prev;
      const next: AuthSession = { ...prev, user: { ...prev.user, ...partial } };
      saveSession(next);
      // 세션(localStorage)뿐 아니라 mock 계정 저장소에도 반영해야
      // 로그아웃 후 다시 로그인했을 때 별칭 등이 유지됩니다.
      if (next.user.provider === "email") {
        updateMockUser(next.user.id, partial);
      }
      return next;
    });
  }, []);

  const logout = useCallback(() => {
    clearSession();
    setSessionState(null);
    setError(null);
  }, []);

  // 세션 만료는 `loadSession()`이 앱을 열 때만 검사합니다. 탭을 며칠씩 켜 두는
  // 사용자를 위해 만료 시각에 맞춰 한 번 더 정리해 줍니다.
  useEffect(() => {
    if (!session) return;

    const remaining = session.expiresAt - Date.now();
    if (remaining <= 0) {
      logout();
      return;
    }
    // setTimeout의 지연은 32비트 정수를 넘기면 즉시 실행되므로 상한을 둡니다.
    const delay = Math.min(remaining, 2 ** 31 - 1);
    const timer = window.setTimeout(logout, delay);
    return () => window.clearTimeout(timer);
  }, [session, logout]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user: session?.user ?? null,
      isAuthenticated: Boolean(session),
      isLoading,
      pendingProvider,
      error,
      loginWith,
      loginWithPassword,
      isSubmittingPassword,
      setSession,
      updateProfile,
      setError,
      logout,
    }),
    [session, isLoading, pendingProvider, error, loginWith, loginWithPassword, isSubmittingPassword, setSession, updateProfile, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

/** 어디서든 인증 상태를 꺼내 쓰는 훅입니다. */
export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth는 <AuthProvider> 안에서만 사용할 수 있어요.");
  return context;
}
