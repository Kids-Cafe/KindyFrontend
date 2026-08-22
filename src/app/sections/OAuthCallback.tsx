import { useEffect, useRef, useState } from "react";
import { messageForResult, readCallbackParams } from "@/app/auth/oauth";
import { useAuth } from "@/app/auth/AuthContext";
import { apiGet } from "@/app/lib/api";
import type { PlainUserDTO } from "@/app/lib/dto";
import { MiniStar, KioSVG, KinaSVG } from "@/app/components/decorative";

/**
 * `/oauth/callback` 경로에서 렌더되는 화면입니다.
 *
 * code와 state 검증, 토큰 교환, 세션 발급은 전부 백엔드가 이미 끝냈습니다. 브라우저가
 * 여기 도착했을 때는 세션 쿠키가 이미 붙어 있고, 주소창에는 결과 코드만 실려 옵니다.
 * 그래서 이 화면이 하는 일은 결과를 읽고, 성공이면 서버에서 프로필을 받아 화면 상태를
 * 채운 뒤 원래 있던 곳으로 돌려보내는 것뿐입니다.
 */
export function OAuthCallback() {
  const { establishSession, setError } = useAuth();
  const [failure, setFailure] = useState<string | null>(null);
  // React StrictMode에서 effect가 두 번 실행돼도 콜백 처리는 한 번만 하도록 막습니다.
  const handled = useRef(false);

  useEffect(() => {
    if (handled.current) return;
    handled.current = true;

    void (async () => {
      const { result, provider, returnTo } = readCallbackParams();

      // 연동은 이미 로그인한 상태에서 하는 일이라 세션을 새로 만들 것이 없습니다.
      // 돌아간 화면이 목록을 다시 읽으면서 새 연동을 반영합니다.
      if (result === "LINK_COMPLETE") {
        window.location.replace(returnTo);
        return;
      }

      if (result !== "SIGNIN_COMPLETE") {
        const message = messageForResult(result);
        setFailure(message);
        setError(message);
        return;
      }

      try {
        // 쿠키는 이미 있습니다. 화면이 쓸 사용자 정보만 서버에서 받아옵니다.
        const profile = await apiGet<PlainUserDTO>("/api/user/info");
        establishSession(profile, provider ?? "email");
        // 히스토리에 콜백 URL이 남지 않도록 replace로 이동합니다.
        window.location.replace(returnTo);
      } catch {
        const message = "로그인은 됐지만 정보를 불러오지 못했어요. 다시 시도해주세요.";
        setFailure(message);
        setError(message);
      }
    })();
  }, [establishSession, setError]);

  return (
    <div
      className="fixed inset-0 z-[9500] flex flex-col items-center justify-center px-6"
      style={{ background: "linear-gradient(135deg, #EDE8FF 0%, #FFE8F6 50%, #FFF5E8 100%)" }}
    >
      {/*
        이 화면은 랜딩(HeroSection)과 함께 렌더되지 않으므로,
        거기서 정의하는 float 키프레임을 여기서 따로 선언해 줍니다.
      */}
      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-14px); }
        }
        @keyframes kindyDot {
          0%, 100% { transform: translateY(0); opacity: 0.35; }
          50%      { transform: translateY(-6px); opacity: 1; }
        }
      `}</style>

      {/* 로고 */}
      <div className="flex items-center gap-2.5 mb-10">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center shadow-sm"
          style={{ background: "linear-gradient(135deg,#E879A0,#F472B6)" }}>
          <MiniStar size={20} color="white" />
        </div>
        <span className="text-2xl font-bold" style={{ fontFamily: "'Fredoka',sans-serif", color: "#3B1355" }}>Kindy</span>
      </div>

      {failure ? (
        <div className="w-full max-w-sm text-center">
          <p className="text-xl font-bold mb-2" style={{ fontFamily: "'Fredoka',sans-serif", color: "#1F0A3C" }}>
            로그인을 마치지 못했어요
          </p>
          <p className="text-sm mb-8" style={{ color: "#6B7280" }}>{failure}</p>
          <button
            onClick={() => window.location.replace("/")}
            className="w-full rounded-2xl font-bold text-white text-base transition-all hover:opacity-90 active:scale-[0.98]"
            style={{
              height: 52,
              background: "linear-gradient(135deg, #E879A0 0%, #F472B6 50%, #C084FC 100%)",
              boxShadow: "0 4px 20px rgba(232,121,160,0.40)",
            }}
          >
            처음으로 돌아가기
          </button>
        </div>
      ) : (
        <div className="text-center" aria-live="polite">
          {/* 대기 중 캐릭터 */}
          <div className="flex items-end justify-center gap-4 mb-8">
            <div style={{ animation: "float 3.8s ease-in-out infinite" }}>
              <KinaSVG className="h-28 w-auto" />
            </div>
            <div style={{ animation: "float 3.4s ease-in-out infinite", animationDelay: "0.6s" }}>
              <KioSVG className="h-28 w-auto" />
            </div>
          </div>
          <p className="text-xl font-bold mb-1.5" style={{ fontFamily: "'Fredoka',sans-serif", color: "#1F0A3C" }}>
            로그인하는 중이에요
          </p>
          <p className="text-sm" style={{ color: "#9CA3AF" }}>키오와 키나가 계정을 확인하고 있어요…</p>

          {/* 진행 인디케이터 */}
          <div className="flex justify-center gap-1.5 mt-6">
            {[0, 1, 2].map((i) => (
              <span
                key={i}
                className="w-2 h-2 rounded-full"
                style={{
                  background: "#E879A0",
                  animation: "kindyDot 1.1s ease-in-out infinite",
                  animationDelay: `${i * 0.15}s`,
                }}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
