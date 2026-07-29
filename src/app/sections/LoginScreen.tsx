import { useState } from "react";
import { X, Loader2 } from "lucide-react";
import mushroomBg from "@/imports/image_22d709cf.png";
import { MiniStar, KioSVG, KinaSVG } from "@/app/components/decorative";
import { useAuth } from "@/app/auth/AuthContext";
import { PROVIDERS, PROVIDER_ORDER, isMockMode } from "@/app/auth/providers";
import { ProviderIcon } from "@/app/auth/ProviderIcon";

/**
 * 전체 화면 로그인 모달입니다. 왼쪽에는 테마형 비주얼 패널(데스크톱 전용),
 * 오른쪽에는 실제 폼을 배치합니다. 아이디/비밀번호 로그인은 mock 저장소(localStorage)를
 * 조회해 검증하고, 소셜 로그인 버튼은 실제 OAuth 리다이렉트 흐름에 연결되어 있습니다.
 * 회원가입은 별도 화면(`SignupScreen`)에서 처리합니다.
 */
export function LoginScreen({
  onClose,
  onSwitchToSignup,
}: {
  onClose: () => void;
  onSwitchToSignup: () => void;
}) {
  const [loginId, setLoginId] = useState("");
  const [pw, setPw] = useState("");
  const [showPw, setShowPw] = useState(false);

  const { loginWith, loginWithPassword, pendingProvider, error } = useAuth();
  // 하나라도 진행 중이면 나머지 버튼은 잠급니다.
  const isBusy = pendingProvider !== null;

  function handleLoginSubmit(e: { preventDefault: () => void }) {
    e.preventDefault();
    loginWithPassword(loginId, pw);
  }

  return (
    <div className="fixed inset-0 z-[9000] flex" role="dialog" aria-modal="true" aria-label="로그인">

      {/* ── 왼쪽: 비주얼 패널 ── */}
      <div className="hidden md:flex relative w-[46%] flex-col overflow-hidden">
        {/* 배경 이미지 */}
        <img src={mushroomBg} alt="" className="absolute inset-0 w-full h-full object-cover object-center" />
        {/* 따뜻한 오버레이 */}
        <div className="absolute inset-0" style={{background:"linear-gradient(160deg, rgba(30,10,60,0.55) 0%, rgba(120,40,160,0.25) 50%, rgba(10,30,10,0.60) 100%)"}} />

        {/* 로고 */}
        <div className="relative z-10 p-8 flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center shadow-lg" style={{background:"linear-gradient(135deg,#E879A0,#F472B6)"}}>
            <MiniStar size={20} color="white" />
          </div>
          <span className="text-2xl font-bold text-white" style={{fontFamily:"'Fredoka',sans-serif"}}>Kindy</span>
        </div>

        {/* 떠 있는 캐릭터 */}
        <div className="relative z-10 flex-1 flex items-end justify-center pb-16 gap-6">
          <div style={{filter:"drop-shadow(0 0 24px rgba(244,114,182,0.6))", animation:"float 3.8s ease-in-out infinite"}}>
            <KinaSVG className="h-52 w-auto" />
          </div>
          <div style={{filter:"drop-shadow(0 0 24px rgba(96,165,250,0.6))", animation:"float 3.4s ease-in-out infinite", animationDelay:"0.6s"}}>
            <KioSVG className="h-52 w-auto" />
          </div>
        </div>

        {/* 하단 문구 */}
        <div className="relative z-10 px-10 pb-12">
          <p className="text-white text-xl font-bold leading-snug mb-2" style={{fontFamily:"'Fredoka',sans-serif", textShadow:"0 2px 12px rgba(0,0,0,0.4)"}}>
            아이의 하루를 함께 기억하는<br />따뜻한 AI 친구
          </p>
          <p className="text-sm" style={{color:"rgba(255,255,255,0.65)"}}>키오와 키나가 언제나 옆에 있어요</p>
        </div>
      </div>

      {/* ── 오른쪽: 폼 패널 ── */}
      <div className="flex-1 bg-white flex flex-col overflow-y-auto">
        {/* 상단 바 */}
        <div className="flex items-center justify-between px-8 pt-8 pb-2">
          <button onClick={onClose} aria-label="로그인 창 닫기"
            className="w-9 h-9 rounded-full flex items-center justify-center transition-all hover:bg-gray-100 active:scale-95"
            style={{color:"#6B7280"}}>
            <X className="w-5 h-5" />
          </button>
          {/* 모바일 로고 */}
          <div className="md:hidden flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{background:"linear-gradient(135deg,#E879A0,#F472B6)"}}>
              <MiniStar size={16} color="white" />
            </div>
            <span className="text-lg font-bold" style={{fontFamily:"'Fredoka',sans-serif",color:"#3B1355"}}>Kindy</span>
          </div>
          <div className="w-9" />
        </div>

        {/* 폼 콘텐츠 */}
        <div className="flex-1 flex flex-col justify-center px-8 md:px-12 py-8 max-w-md w-full mx-auto">

          {/* 제목 */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2" style={{fontFamily:"'Fredoka',sans-serif", color:"#1F0A3C"}}>
              다시 만나 반가워요!
            </h1>
            <p className="text-sm" style={{color:"#9CA3AF"}}>
              계정에 로그인하고 오늘 하루를 기록해보세요
            </p>
          </div>

          {/* 입력 필드 */}
          <form onSubmit={handleLoginSubmit}>
          <div className="space-y-3 mb-4">
            <div>
              <label className="block text-xs font-semibold mb-1.5" style={{color:"#6B7280"}}>아이디</label>
              <input
                type="text" placeholder="아이디를 입력해주세요"
                value={loginId} onChange={e => setLoginId(e.target.value)}
                className="w-full rounded-2xl px-4 outline-none transition-all text-sm"
                style={{height:54, border:"1.5px solid #E5E7EB", background:"#FAFAFA", color:"#1F0A3C"}}
                onFocus={e => { e.target.style.border="1.5px solid #E879A0"; e.target.style.boxShadow="0 0 0 3px rgba(232,121,160,0.12)"; }}
                onBlur={e  => { e.target.style.border="1.5px solid #E5E7EB"; e.target.style.boxShadow="none"; }}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1.5" style={{color:"#6B7280"}}>비밀번호</label>
              <div className="relative">
                <input
                  type={showPw ? "text" : "password"} placeholder="비밀번호를 입력해주세요"
                  value={pw} onChange={e => setPw(e.target.value)}
                  className="w-full rounded-2xl px-4 pr-12 outline-none transition-all text-sm"
                  style={{height:54, border:"1.5px solid #E5E7EB", background:"#FAFAFA", color:"#1F0A3C"}}
                  onFocus={e => { e.target.style.border="1.5px solid #E879A0"; e.target.style.boxShadow="0 0 0 3px rgba(232,121,160,0.12)"; }}
                  onBlur={e  => { e.target.style.border="1.5px solid #E5E7EB"; e.target.style.boxShadow="none"; }}
                />
                <button onClick={() => setShowPw(v => !v)} type="button"
                  aria-label={showPw ? "비밀번호 숨기기" : "비밀번호 보기"}
                  className="absolute right-4 top-1/2 -translate-y-1/2"
                  style={{color:"#9CA3AF"}}>
                  {showPw
                    ? <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                    : <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                  }
                </button>
              </div>
            </div>
          </div>

          {/* 비밀번호 찾기 */}
          <div className="flex justify-end mb-5">
            <button type="button" className="text-xs font-semibold" style={{color:"#9CA3AF"}}>비밀번호를 잊으셨나요?</button>
          </div>

          {/* 로그인 실패 메시지 */}
          {error && (
            <div
              role="alert"
              className="mb-4 rounded-2xl px-4 py-3 text-xs font-semibold"
              style={{ background: "#FEF2F2", color: "#DC2626", border: "1px solid #FECACA" }}
            >
              {error}
            </div>
          )}

          {/* 기본 버튼 */}
          <button
            type="submit"
            className="w-full rounded-2xl font-bold text-white text-base transition-all hover:opacity-90 active:scale-[0.98] mb-5"
            style={{
              height:52,
              background:"linear-gradient(135deg, #E879A0 0%, #F472B6 50%, #C084FC 100%)",
              boxShadow:"0 4px 20px rgba(232,121,160,0.40)",
            }}>
            로그인
          </button>
          </form>

          {/* 구분선 */}
          <div className="flex items-center gap-3 mb-5">
            <div className="flex-1 h-px" style={{background:"#E5E7EB"}} />
            <span className="text-xs font-medium" style={{color:"#D1D5DB"}}>또는 간편 로그인</span>
            <div className="flex-1 h-px" style={{background:"#E5E7EB"}} />
          </div>

          {/* 소셜 로그인 */}
          <div className="flex justify-center gap-3">
            {PROVIDER_ORDER.map((id) => {
              const provider = PROVIDERS[id];
              const isPending = pendingProvider === id;
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => loginWith(id)}
                  disabled={isBusy}
                  aria-label={`${provider.label} 계정으로 로그인`}
                  aria-busy={isPending}
                  title={isMockMode(provider) ? `${provider.label} 앱 키가 없어 목업 모드로 동작합니다` : `${provider.label}로 로그인`}
                  className="w-12 h-12 rounded-2xl flex items-center justify-center transition-all shadow-sm enabled:hover:scale-105 enabled:active:scale-95 disabled:cursor-not-allowed"
                  style={{
                    background: provider.brand.background,
                    border: provider.brand.border,
                    // 진행 중인 버튼은 또렷하게, 나머지는 흐리게 처리합니다.
                    opacity: isBusy && !isPending ? 0.4 : 1,
                  }}
                >
                  {isPending
                    ? <Loader2 className="w-5 h-5 animate-spin" style={{ color: id === "kakao" || id === "google" ? "#6B7280" : "white" }} />
                    : <ProviderIcon provider={id} />
                  }
                </button>
              );
            })}
          </div>

          {/* 하단 전환 */}
          <p className="text-center text-xs mt-7" style={{color:"#9CA3AF"}}>
            아직 계정이 없으신가요? <button onClick={onSwitchToSignup} className="font-bold" style={{color:"#E879A0"}}>회원가입</button>
          </p>
        </div>
      </div>
    </div>
  );
}
