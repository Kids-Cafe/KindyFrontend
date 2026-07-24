import { useState } from "react";
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

/**
 * Kindy 마케팅 랜딩 페이지입니다. 이 컴포넌트는 페이지 수준 상태
 * (스플래시 완료 여부와 열려 있는 전체 화면 모달)만 관리하고 아래 섹션을
 * 순서대로 조합합니다. 각 섹션의 실제 마크업은 `./sections`, 장식용 SVG는
 * `./components/decorative`, 문구와 샘플 데이터는 `./data`에 있습니다.
 */
export default function App() {
  const [splashDone, setSplashDone] = useState(false);
  const [showCharacters, setShowCharacters] = useState(false);
  const [showLogin, setShowLogin] = useState(false);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <SplashIntro onDone={() => setSplashDone(true)} />
      {showCharacters && <CharacterShowcase onClose={() => setShowCharacters(false)} />}
      {showLogin && <LoginScreen onClose={() => setShowLogin(false)} />}

      <div style={{ opacity: splashDone ? 1 : 0, transition: "opacity 0.5s ease-in" }}>
        <Navbar onOpenCharacters={() => setShowCharacters(true)} onOpenLogin={() => setShowLogin(true)} />
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
