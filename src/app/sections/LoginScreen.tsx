import { useState } from "react";
import { X } from "lucide-react";
import mushroomBg from "@/imports/image_22d709cf.png";
import { MiniStar, KioSVG, KinaSVG } from "@/app/components/decorative";

/**
 * 전체 화면 로그인/회원가입 모달입니다. 왼쪽에는 테마형 비주얼 패널(데스크톱 전용),
 * 오른쪽에는 실제 폼을 배치합니다. 이메일/비밀번호/비밀번호 표시 상태를 제외한
 * 폼 필드는 비제어 방식이며, 아직 어디에도 제출하지 않는 시각용 목업입니다.
 */
export function LoginScreen({ onClose }: { onClose: () => void }) {
  const [tab, setTab] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [showPw, setShowPw] = useState(false);

  return (
    <div className="fixed inset-0 z-[9000] flex">

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
          <button onClick={onClose}
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
              {tab === "login" ? "다시 만나 반가워요!" : "함께 시작해요!"}
            </h1>
            <p className="text-sm" style={{color:"#9CA3AF"}}>
              {tab === "login" ? "계정에 로그인하고 오늘 하루를 기록해보세요" : "키오와 키나를 지금 만나보세요"}
            </p>
          </div>

          {/* 탭 토글 */}
          <div className="flex rounded-2xl p-1 mb-7" style={{background:"#F3F4F6"}}>
            {(["login","signup"] as const).map(t => (
              <button key={t} onClick={() => setTab(t)}
                className="flex-1 py-2.5 rounded-xl text-sm font-bold transition-all"
                style={{
                  background: tab === t ? "white" : "transparent",
                  color: tab === t ? "#E879A0" : "#9CA3AF",
                  boxShadow: tab === t ? "0 1px 8px rgba(0,0,0,0.08)" : "none",
                }}>
                {t === "login" ? "로그인" : "회원가입"}
              </button>
            ))}
          </div>

          {/* 입력 필드 */}
          <div className="space-y-3 mb-4">
            {tab === "signup" && (
              <div>
                <label className="block text-xs font-semibold mb-1.5" style={{color:"#6B7280"}}>이름</label>
                <input
                  type="text" placeholder="이름을 입력해주세요"
                  className="w-full rounded-2xl px-4 outline-none transition-all text-sm"
                  style={{
                    height:54, border:"1.5px solid #E5E7EB", background:"#FAFAFA", color:"#1F0A3C",
                  }}
                  onFocus={e => { e.target.style.border="1.5px solid #E879A0"; e.target.style.boxShadow="0 0 0 3px rgba(232,121,160,0.12)"; }}
                  onBlur={e  => { e.target.style.border="1.5px solid #E5E7EB"; e.target.style.boxShadow="none"; }}
                />
              </div>
            )}
            <div>
              <label className="block text-xs font-semibold mb-1.5" style={{color:"#6B7280"}}>이메일</label>
              <input
                type="email" placeholder="이메일 주소를 입력해주세요"
                value={email} onChange={e => setEmail(e.target.value)}
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
                <button onClick={() => setShowPw(v => !v)}
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
          {tab === "login" && (
            <div className="flex justify-end mb-5">
              <button className="text-xs font-semibold" style={{color:"#9CA3AF"}}>비밀번호를 잊으셨나요?</button>
            </div>
          )}

          {/* 기본 버튼 */}
          <button
            className="w-full rounded-2xl font-bold text-white text-base transition-all hover:opacity-90 active:scale-[0.98] mb-5"
            style={{
              height:52,
              background:"linear-gradient(135deg, #E879A0 0%, #F472B6 50%, #C084FC 100%)",
              boxShadow:"0 4px 20px rgba(232,121,160,0.40)",
            }}>
            {tab === "login" ? "로그인" : "가입하기"}
          </button>

          {/* 구분선 */}
          <div className="flex items-center gap-3 mb-5">
            <div className="flex-1 h-px" style={{background:"#E5E7EB"}} />
            <span className="text-xs font-medium" style={{color:"#D1D5DB"}}>또는 간편 로그인</span>
            <div className="flex-1 h-px" style={{background:"#E5E7EB"}} />
          </div>

          {/* 소셜 로그인 */}
          <div className="flex justify-center gap-3">
            {/* 카카오 */}
            <button className="w-12 h-12 rounded-2xl flex items-center justify-center transition-all hover:scale-105 active:scale-95 shadow-sm"
              style={{background:"#FEE500"}}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="#3C1E1E">
                <path d="M12 3C6.477 3 2 6.477 2 10.8c0 2.7 1.714 5.08 4.286 6.514L5.143 21l4.714-2.571c.693.1 1.41.143 2.143.143 5.523 0 10-3.477 10-7.772C22 6.477 17.523 3 12 3z"/>
              </svg>
            </button>
            {/* 네이버 */}
            <button className="w-12 h-12 rounded-2xl flex items-center justify-center transition-all hover:scale-105 active:scale-95 shadow-sm"
              style={{background:"#03C75A"}}>
              <span className="font-black text-white text-lg" style={{fontFamily:"sans-serif",lineHeight:1}}>N</span>
            </button>
            {/* 구글 */}
            <button className="w-12 h-12 rounded-2xl flex items-center justify-center transition-all hover:scale-105 active:scale-95 shadow-sm"
              style={{background:"white", border:"1.5px solid #E5E7EB"}}>
              <svg width="18" height="18" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
            </button>
            {/* 애플 */}
            <button className="w-12 h-12 rounded-2xl flex items-center justify-center transition-all hover:scale-105 active:scale-95 shadow-sm"
              style={{background:"#000"}}>
              <svg width="16" height="20" viewBox="0 0 814 1000" fill="white">
                <path d="M788.1 340.9c-5.8 4.5-108.2 62.2-108.2 190.5 0 148.4 130.3 200.9 134.2 202.2-.6 3.2-20.7 71.9-68.7 141.9-42.8 61.6-87.5 123.1-155.5 123.1s-85.5-39.5-164-39.5c-76 0-103.7 40.8-165.9 40.8s-105-42.4-148.8-106.3C46.5 763.2 0 661.1 0 563.8c0-171.6 111.6-262.1 221.4-262.1 85.5 0 155.5 54.1 208.4 54.1 52.9 0 134.7-58.2 231.7-58.2 50.4 0 198.5 5.8 293.3 124.5zm-240.9-157.2c45.4-53.5 76-128.3 76-203.1 0-10.3-.6-20.7-2.6-29.4-72.5 2.6-159.3 48.9-211.6 109.6-41.5 47.7-79.6 122.5-79.6 198.1 0 11 1.9 21.9 2.6 25.4 4.5.6 11.6 1.9 18.7 1.9 64.7 0 145.2-43.4 196.5-102.5z"/>
              </svg>
            </button>
          </div>

          {/* 하단 전환 */}
          <p className="text-center text-xs mt-7" style={{color:"#9CA3AF"}}>
            {tab === "login"
              ? <span>아직 계정이 없으신가요? <button onClick={() => setTab("signup")} className="font-bold" style={{color:"#E879A0"}}>회원가입</button></span>
              : <span>이미 계정이 있으신가요? <button onClick={() => setTab("login")} className="font-bold" style={{color:"#E879A0"}}>로그인</button></span>
            }
          </p>
        </div>
      </div>
    </div>
  );
}
