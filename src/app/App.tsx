import { Suspense, lazy, useEffect, useRef, useState } from "react";
import { SplashIntro } from "@/app/sections/SplashIntro";
import { Navbar } from "@/app/sections/Navbar";
import { HeroSection } from "@/app/sections/HeroSection";
import { FeaturesSection } from "@/app/sections/FeaturesSection";
import { HowItWorks } from "@/app/sections/HowItWorks";
import { PersonasSection } from "@/app/sections/PersonasSection";
import { TestimonialsSection } from "@/app/sections/TestimonialsSection";
import { CTASection } from "@/app/sections/CTASection";
import { Footer } from "@/app/sections/Footer";
import { isOnCallbackRoute } from "@/app/auth/oauth";
import { useAuth } from "@/app/auth/AuthContext";
import { ErrorBoundary } from "@/app/components/ErrorBoundary";

// 첫 화면(랜딩 상단)에 필요 없는 것들은 따로 떼어 냅니다. 특히 대시보드와
// 로그인/가입 화면은 각각 무거운 의존성(차트, 대형 배경 이미지)을 끌고 오기 때문에
// 방문자가 실제로 그 화면에 들어갈 때 받도록 하는 편이 초기 로딩에 훨씬 유리합니다.
const AnalyticsDashboard = lazy(() =>
  import("@/app/sections/AnalyticsDashboard").then((m) => ({ default: m.AnalyticsDashboard })),
);
const CharacterShowcase = lazy(() =>
  import("@/app/sections/CharacterShowcase").then((m) => ({ default: m.CharacterShowcase })),
);
const LoginScreen = lazy(() => import("@/app/sections/LoginScreen").then((m) => ({ default: m.LoginScreen })));
const SignupScreen = lazy(() => import("@/app/sections/SignupScreen").then((m) => ({ default: m.SignupScreen })));
const OnboardingWizard = lazy(() =>
  import("@/app/sections/onboarding/OnboardingWizard").then((m) => ({ default: m.OnboardingWizard })),
);
const MyPage = lazy(() => import("@/app/sections/MyPage").then((m) => ({ default: m.MyPage })));
const OAuthCallback = lazy(() => import("@/app/sections/OAuthCallback").then((m) => ({ default: m.OAuthCallback })));
const DashboardShell = lazy(() =>
  import("@/app/dashboard/DashboardShell").then((m) => ({ default: m.DashboardShell })),
);

type AuthFlow = "login" | "signup" | "onboarding" | null;

/** 화면 전체를 덮는 청크를 기다리는 동안 보여줄 최소한의 표시입니다. */
function FullScreenLoader() {
  return (
    <div
      className="fixed inset-0 z-[9000] flex items-center justify-center"
      style={{ background: "#FFF7FA" }}
      role="status"
      aria-live="polite"
    >
      <span className="text-sm font-bold" style={{ color: "#A06080" }}>불러오는 중…</span>
    </div>
  );
}

/**
 * Kindy 마케팅 랜딩 페이지입니다. 이 컴포넌트는 페이지 수준 상태
 * (스플래시 완료 여부와 열려 있는 전체 화면 모달)만 관리하고 아래 섹션을
 * 순서대로 조합합니다. 각 섹션의 실제 마크업은 `./sections`, 장식용 SVG는
 * `./components/decorative`, 문구와 샘플 데이터는 `./data`에 있습니다.
 *
 * 라우터를 따로 쓰지 않으므로 OAuth 콜백 경로만 pathname으로 분기합니다.
 * 로그인 + 온보딩까지 마친 사용자는 랜딩 대신 디스코드형 대시보드(`DashboardShell`)를 보게 됩니다.
 */
export default function App() {
  const [splashDone, setSplashDone] = useState(false);
  const [showCharacters, setShowCharacters] = useState(false);
  const [authFlow, setAuthFlow] = useState<AuthFlow>(null);
  const [showMyPage, setShowMyPage] = useState(false);

  const { isAuthenticated, user, sessionExpired } = useAuth();

  // 세션이 만료돼 자동 로그아웃되면 열려 있던 모달(마이페이지·온보딩)을 닫고,
  // 사용자가 안내를 확인한 뒤에는 바로 로그인 화면으로 이어줍니다.
  const wasSessionExpired = useRef(false);
  useEffect(() => {
    if (sessionExpired) {
      wasSessionExpired.current = true;
      setAuthFlow(null);
      setShowMyPage(false);
    } else if (wasSessionExpired.current) {
      wasSessionExpired.current = false;
      setAuthFlow("login");
    }
  }, [sessionExpired]);

  // 로그인에 성공하면 로그인 모달을 닫습니다. 온보딩을 마치지 못한 계정이면
  // 홈페이지 대신 온보딩으로 보내 계정 종류(아동/선생님/학부모)에 맞는
  // 대시보드로 이어지게 합니다. (회원가입 → 온보딩 전환은 그대로 둡니다.)
  //
  // 카카오/네이버 등 소셜 로그인은 OAuth 콜백에서 `window.location.replace`로
  // 페이지를 새로고침하며 돌아오기 때문에 authFlow state가 "login"으로
  // 남아있지 않고 초기값(null)으로 리셋됩니다. authFlow 값과 상관없이
  // "로그인은 됐지만 온보딩이 안 끝난 상태"인지만 보고 판단해야
  // 소셜 로그인 후에도 온보딩(→ 대시보드)으로 이어집니다.
  useEffect(() => {
    if (!isAuthenticated) return;
    if (!user?.onboardingCompleted) {
      setAuthFlow("onboarding");
    } else if (authFlow === "login" || authFlow === "onboarding") {
      setAuthFlow(null);
    }
  }, [isAuthenticated, authFlow, user?.onboardingCompleted]);

  // ── OAuth 콜백 경로: 랜딩을 렌더하지 않고 처리 화면만 보여줍니다. ──
  if (isOnCallbackRoute()) {
    return (
      <Suspense fallback={<FullScreenLoader />}>
        <OAuthCallback />
      </Suspense>
    );
  }

  // ── 로그인 + 온보딩 완료: 랜딩 대신 기능 대시보드를 보여줍니다. ──
  // 대시보드 안에서는 좌측 상단 "kindy" 로고를 눌러도 대시보드 메인페이지로 돌아올 뿐,
  // 마케팅 랜딩으로는 나가지 않습니다(로그아웃해야 랜딩을 다시 보게 됩니다).
  // 대시보드가 통째로 터져도 로그아웃은 할 수 있어야 하므로 별도 경계로 감쌉니다.
  if (isAuthenticated && user?.onboardingCompleted) {
    return (
      <ErrorBoundary label="dashboard">
        <Suspense fallback={<FullScreenLoader />}>
          <DashboardShell />
        </Suspense>
      </ErrorBoundary>
    );
  }

  return (
    <div className="min-h-dvh bg-background text-foreground">
      <SplashIntro onDone={() => setSplashDone(true)} />

      {/* 전체 화면 모달들. 각자 별도 청크라 열릴 때 받아옵니다. */}
      <Suspense fallback={<FullScreenLoader />}>
        {showCharacters && <CharacterShowcase onClose={() => setShowCharacters(false)} />}
        {authFlow === "login" && (
          <LoginScreen onClose={() => setAuthFlow(null)} onSwitchToSignup={() => setAuthFlow("signup")} />
        )}
        {authFlow === "signup" && (
          <SignupScreen
            onClose={() => setAuthFlow(null)}
            onSwitchToLogin={() => setAuthFlow("login")}
            onSignedUp={() => setAuthFlow("onboarding")}
          />
        )}
        {authFlow === "onboarding" && <OnboardingWizard onComplete={() => setAuthFlow(null)} />}
        {showMyPage && <MyPage onClose={() => setShowMyPage(false)} />}
      </Suspense>

      <div style={{ opacity: splashDone ? 1 : 0, transition: "opacity 0.5s ease-in" }}>
        <Navbar
          onOpenCharacters={() => setShowCharacters(true)}
          onOpenLogin={() => setAuthFlow("login")}
          onOpenSignup={() => setAuthFlow("signup")}
          onOpenMyPage={() => setShowMyPage(true)}
          onGoDashboard={() => setAuthFlow(user?.onboardingCompleted ? null : "onboarding")}
        />
        <HeroSection onOpenSignup={() => setAuthFlow("signup")} />
        <FeaturesSection />
        <HowItWorks />
        {/* 차트 라이브러리를 끌고 오는 섹션이라 스크롤이 닿을 때 받아옵니다. */}
        <Suspense fallback={<div style={{ minHeight: 480 }} aria-hidden="true" />}>
          <AnalyticsDashboard />
        </Suspense>
        <PersonasSection />
        <TestimonialsSection />
        <CTASection />
        <Footer />
      </div>
    </div>
  );
}
