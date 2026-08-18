import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { beginSocialLogin } from "@/app/auth/oauth";
import { SESSION_TTL_MS, clearSession, loadSession, saveSession } from "@/app/auth/storage";
import type { AuthSession, AuthUser, SocialProviderId } from "@/app/auth/types";
import { ApiError, apiGet, apiPost } from "@/app/lib/api";
import type { PlainUserDTO } from "@/app/lib/dto";
import { newId } from "@/app/lib/id";

/**
 * 서버 프로필을 화면이 쓰는 사용자 정보로 옮깁니다.
 *
 * 역할(role/teacherRole)·별칭·소속 유치원은 `PlainUserDTO`에 없습니다 — 백엔드에서
 * 이 값들은 사용자가 아니라 유치원과의 "관계"(RelationshipDTO)에 붙어 있기 때문입니다.
 * 그래서 여기서 채우지 않고, 대시보드가 `kindergarten/memberships`로 따로 알아냅니다.
 */
function toAuthUser(profile: PlainUserDTO): AuthUser {
  return {
    id: profile.id,
    name: profile.name,
    loginId: profile.id,
    email: profile.email ?? "",
    provider: "email",
    // 서버는 epoch(ms)로 주지만 AuthUser.joinedAt은 ISO 문자열입니다.
    joinedAt: profile.createdAt ? new Date(profile.createdAt).toISOString() : new Date().toISOString(),
    accountType: profile.accountType === "CHILD" ? "child" : "adult",
    birthDate: profile.birthDate,
    gender: profile.gender === "MALE" ? "male" : profile.gender === "FEMALE" ? "female" : undefined,
    guardianName: profile.guardianName,
    guardianPhone: profile.guardianPhone,
    phone: profile.phone,
    address: profile.address,
    addressDetail: profile.addressDetail,
    zonecode: profile.postcode,
    onboardingCompleted: profile.onboardingCompleted,
  };
}

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
  /** 아이디/비밀번호로 로그인합니다. 성공하면 true를 돌려주고 세션을 반영합니다. */
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
      await apiPost("/api/user/login", { id: loginId, password });
      const profile = await apiGet<PlainUserDTO>("/api/user/info");

      setSession({ user: toAuthUser(profile), accessToken: String(newId()), expiresAt: Date.now() + SESSION_TTL_MS });
      return true;
    } catch (cause) {
      if (cause instanceof ApiError) {
        setError(cause.code === "UNKNOWN_ERROR" ? "알 수 없는 오류가 발생했습니다." : "아이디 또는 비밀번호가 올바르지 않아요.");
        return false;
      }
      console.error("[Kindy] 로그인 처리 실패", cause);
      setError("로그인 중 문제가 생겼어요. 잠시 후 다시 시도해주세요.");
      return false;
    } finally {
      setIsSubmittingPassword(false);
    }
  }, [setSession]);

  /**
   * 사용자 정보 일부를 세션에 병합합니다.
   *
   * 주소는 서버에도 저장되지만(`user/update`), 역할·별칭·소속 유치원은 백엔드에서
   * 사용자가 아니라 유치원과의 관계에 붙어 있어 여기서 서버로 보낼 곳이 없습니다.
   * 그 값들은 세션에만 남고, 실제 판정은 대시보드가 관계 정보로 다시 합니다.
   */
  const updateProfile = useCallback((partial: Partial<AuthUser>) => {
    setSessionState((prev) => {
      if (!prev) return prev;
      const next: AuthSession = { ...prev, user: { ...prev.user, ...partial } };
      saveSession(next);
      return next;
    });

    if (partial.address !== undefined || partial.zonecode !== undefined) {
      apiPost("/api/user/update", {
        address: partial.address,
        addressDetail: partial.addressDetail,
        postcode: partial.zonecode,
      }).catch((cause) => console.warn("[Kindy] 주소를 저장하지 못했어요.", cause));
    }
  }, []);

  const logout = useCallback(() => {
    // 서버 세션 정리는 실패해도 로컬 로그아웃을 막지 않습니다.
    apiPost("/api/user/logout").catch(() => {});
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
