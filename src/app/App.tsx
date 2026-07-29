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

type AuthFlow = "login" | "signup" | "onboarding" | null;

/**
 * Kindy 마케팅 랜딩 페이지입니다. 이 컴포넌트는 페이지 수준 상태
 * (스플래시 완료 여부와 열려 있는 전체 화면 모달)만 관리하고 아래 섹션을
 * 순서대로 조합합니다. 각 섹션의 실제 마크업은 `./sections`, 장식용 SVG는
 * `./components/decorative`, 문구와 샘플 데이터는 `./data`에 있습니다.
 *
 * 라우터를 따로 쓰지 않으므로 OAuth 콜백 경로만 pathname으로 분기합니다.
 */
export default function App() {
  const [splashDone, setSplashDone] = useState(false);
  const [showCharacters, setShowCharacters] = useState(false);
  const [authFlow, setAuthFlow] = useState<AuthFlow>(null);
  const [showMyPage, setShowMyPage] = useState(false);

  const { isAuthenticated } = useAuth();

  // 로그인에 성공하면 열려 있던 로그인 모달을 닫습니다. (회원가입 → 온보딩 전환은 그대로 둡니다.)
  useEffect(() => {
    if (isAuthenticated && authFlow === "login") setAuthFlow(null);
  }, [isAuthenticated, authFlow]);

  // ── OAuth 콜백 경로: 랜딩을 렌더하지 않고 처리 화면만 보여줍니다. ──
  if (isOnCallbackRoute()) return <OAuthCallback />;

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
        />
        <HeroSection />
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
