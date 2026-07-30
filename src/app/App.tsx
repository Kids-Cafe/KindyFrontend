import { useEffect, useState } from "react";
import { SplashIntro } from "@/app/sections/SplashIntro";
import { Navbar } from "@/app/sections/Navbar";
import { HeroSection } from "@/app/sections/HeroSection";
import { FeaturesSection } from "@/app/sections/FeaturesSection";
import { HowItWorks } from "@/app/sections/HowItWorks";
import { AnalyticsDashboard } from "@/app/sections/AnalyticsDashboard";
import { PersonasSection } from "@/app/sections/PersonasSection";
import { TestimonialsSection } from "@/app/sections/TestimonialsSection";
import { CTASection } from "@/app/sections/CTASection";
import { Footer } from "@/app/sections/Footer";
import { CharacterShowcase } from "@/app/sections/CharacterShowcase";
import { LoginScreen } from "@/app/sections/LoginScreen";
import { SignupScreen } from "@/app/sections/SignupScreen";
import { OnboardingWizard } from "@/app/sections/onboarding/OnboardingWizard";
import { MyPage } from "@/app/sections/MyPage";
import { OAuthCallback } from "@/app/sections/OAuthCallback";
import { isOnCallbackRoute } from "@/app/auth/oauth";
import { useAuth } from "@/app/auth/AuthContext";
import { DashboardShell } from "@/app/dashboard/DashboardShell";

type AuthFlow = "login" | "signup" | "onboarding" | null;

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

  const { isAuthenticated, user } = useAuth();

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
  if (isOnCallbackRoute()) return <OAuthCallback />;

  // ── 로그인 + 온보딩 완료: 랜딩 대신 기능 대시보드를 보여줍니다. ──
  // 대시보드 안에서는 좌측 상단 "kindy" 로고를 눌러도 대시보드 메인페이지로 돌아올 뿐,
  // 마케팅 랜딩으로는 나가지 않습니다(로그아웃해야 랜딩을 다시 보게 됩니다).
  if (isAuthenticated && user?.onboardingCompleted) {
    return <DashboardShell />;
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <SplashIntro onDone={() => setSplashDone(true)} />
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
        <AnalyticsDashboard />
        <PersonasSection />
        <TestimonialsSection />
        <CTASection />
        <Footer />
      </div>
    </div>
  );
}
