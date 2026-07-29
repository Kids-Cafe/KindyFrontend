import { useState, useEffect, useRef } from "react";
import { Menu, X, Sparkles, User, LogOut } from "lucide-react";
import { MiniStar } from "@/app/components/decorative";
import { useAuth } from "@/app/auth/AuthContext";
import { UserAvatar } from "@/app/auth/UserAvatar";
import { getDisplayName } from "@/app/auth/getDisplayName";

const NAV_LINKS = [
  ["#features", "서비스 소개"],
  ["#how", "이용 방법"],
  ["#analytics", "분석 기능"],
  ["#personas", "사용자"],
] as const;

/**
 * 상단에 고정되는 내비게이션입니다. 페이지를 스크롤하면 배경/텍스트 색상이
 * 바뀌고(반투명 흰색), 맨 위에서는 히어로 그라디언트 위에 투명하게 표시됩니다.
 * 앵커 클릭 시 짧은 화이트아웃 오버레이를 보여 즉시 이동이 어색하게 느껴지지
 * 않도록 합니다. 로그인 상태에 따라 오른쪽 영역이 로그인 버튼 또는
 * 프로필 메뉴로 바뀝니다.
 */
export function Navbar({
  onOpenCharacters,
  onOpenLogin,
  onOpenSignup,
  onOpenMyPage,
}: {
  onOpenCharacters: () => void;
  onOpenLogin: () => void;
  onOpenSignup: () => void;
  onOpenMyPage: () => void;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const overlayRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);
  const busy = useRef(false);

  const { user, isAuthenticated, logout } = useAuth();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 30);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // 프로필 드롭다운: 바깥 클릭이나 Esc로 닫습니다.
  useEffect(() => {
    if (!profileOpen) return;

    const onPointerDown = (event: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setProfileOpen(false);
      }
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setProfileOpen(false);
    };

    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [profileOpen]);

  const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    e.preventDefault();
    if (busy.current || !overlayRef.current) return;
    busy.current = true;
    setMenuOpen(false);

    const overlay = overlayRef.current;

    // ── 1. 페이드 인(화면이 흰색으로 전환) ──
    overlay.style.transition = "opacity 0.3s ease-in";
    overlay.style.opacity = "1";
    overlay.style.pointerEvents = "auto";

    setTimeout(() => {
      // ── 2. 화면이 덮인 상태에서 스크롤 ──
      const el = document.querySelector(href);
      el?.scrollIntoView({ behavior: "instant" });

      // ── 3. 페이드 아웃(새 섹션 표시) ──
      overlay.style.transition = "opacity 0.45s ease-out";
      overlay.style.opacity = "0";

      setTimeout(() => {
        overlay.style.pointerEvents = "none";
        busy.current = false;
      }, 460);
    }, 310);
  };

  return (
    <>
      {/* ── 페이드 오버레이: 항상 DOM에 두고 ref로 투명도를 제어합니다. ── */}
      <div
        ref={overlayRef}
        className="fixed inset-0"
        style={{
          zIndex: 9000,
          opacity: 0,
          pointerEvents: "none",
          background: "linear-gradient(135deg, #EDE8FF 0%, #FFE8F6 50%, #FFF5E8 100%)",
        }}
      />

      <nav
        className="fixed top-0 left-0 right-0 z-50 transition-all duration-300"
        style={scrolled
          ? { background: "rgba(255,250,253,0.92)", backdropFilter: "blur(16px)", borderBottom: "1px solid rgba(232,121,160,0.15)", boxShadow: "0 2px 20px rgba(232,121,160,0.08)" }
          : {}
        }
      >
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          {/* 로고 */}
          <a href="#" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform"
              style={{ background: "linear-gradient(135deg, #E879A0, #F472B6)" }}>
              <MiniStar size={18} color="white" />
            </div>
            <span className={`text-2xl font-bold tracking-tight transition-colors ${scrolled ? "text-foreground" : "text-white"}`}
              style={{ fontFamily: "'Fredoka', sans-serif" }}>
              Kindy
            </span>
          </a>

          {/* 데스크톱 링크 */}
          <div className={`hidden md:flex items-center gap-8 text-sm font-semibold ${scrolled ? "text-foreground/70" : "text-white/85"}`}>
            {NAV_LINKS.map(([href, label]) => (
              <a key={href} href={href}
                className="hover:opacity-100 opacity-80 transition-opacity cursor-pointer"
                onClick={(e) => handleNavClick(e, href)}>
                {label}
              </a>
            ))}
          </div>

          {/* 데스크톱 CTA */}
          <div className="hidden md:flex items-center gap-3">
            <button
              onClick={onOpenCharacters}
              className="flex items-center gap-1.5 text-sm font-bold px-4 py-2 rounded-full transition-all hover:scale-105 active:scale-95"
              style={{
                background: scrolled ? "rgba(232,121,160,0.1)" : "rgba(255,255,255,0.12)",
                color: scrolled ? "#E879A0" : "white",
                border: scrolled ? "1px solid rgba(232,121,160,0.3)" : "1px solid rgba(255,255,255,0.25)",
              }}>
              <Sparkles className="w-3.5 h-3.5" />
              캐릭터 소개
            </button>

            {isAuthenticated && user ? (
              /* ── 로그인 상태: 프로필 드롭다운 ── */
              <div className="relative" ref={profileRef}>
                <button
                  onClick={() => setProfileOpen((open) => !open)}
                  aria-haspopup="menu"
                  aria-expanded={profileOpen}
                  aria-label="내 계정 메뉴 열기"
                  className="flex items-center gap-2 pl-1.5 pr-3 py-1.5 rounded-full transition-all hover:scale-105 active:scale-95"
                  style={{
                    background: scrolled ? "rgba(232,121,160,0.1)" : "rgba(255,255,255,0.15)",
                    border: scrolled ? "1px solid rgba(232,121,160,0.25)" : "1px solid rgba(255,255,255,0.25)",
                  }}
                >
                  <UserAvatar user={user} size={30} />
                  <span className={`text-sm font-bold max-w-[7rem] truncate ${scrolled ? "text-foreground" : "text-white"}`}>
                    {getDisplayName(user)}
                  </span>
                </button>

                {profileOpen && (
                  <div
                    role="menu"
                    className="absolute right-0 mt-2 w-60 rounded-2xl bg-white overflow-hidden"
                    style={{ boxShadow: "0 12px 36px rgba(31,10,60,0.18)", border: "1px solid #F3F4F6" }}
                  >
                    {/* 계정 요약 */}
                    <div className="flex items-center gap-3 px-4 py-3.5" style={{ borderBottom: "1px solid #F3F4F6" }}>
                      <UserAvatar user={user} size={38} />
                      <div className="min-w-0">
                        <p className="text-sm font-bold truncate" style={{ color: "#1F0A3C" }}>{getDisplayName(user)}</p>
                        <p className="text-xs truncate" style={{ color: "#9CA3AF" }}>{user.email}</p>
                      </div>
                    </div>

                    <button
                      role="menuitem"
                      onClick={() => { setProfileOpen(false); onOpenMyPage(); }}
                      className="w-full flex items-center gap-2.5 px-4 py-3 text-sm font-semibold transition-colors hover:bg-gray-50"
                      style={{ color: "#1F0A3C" }}
                    >
                      <User className="w-4 h-4" style={{ color: "#E879A0" }} />
                      마이페이지
                    </button>
                    <button
                      role="menuitem"
                      onClick={() => { setProfileOpen(false); logout(); }}
                      className="w-full flex items-center gap-2.5 px-4 py-3 text-sm font-semibold transition-colors hover:bg-red-50"
                      style={{ color: "#EF4444", borderTop: "1px solid #F3F4F6" }}
                    >
                      <LogOut className="w-4 h-4" />
                      로그아웃
                    </button>
                  </div>
                )}
              </div>
            ) : (
              /* ── 비로그인 상태 ── */
              <>
                <button onClick={onOpenLogin} className={`text-sm font-semibold hover:opacity-70 transition-opacity ${scrolled ? "text-foreground" : "text-white"}`}>
                  로그인
                </button>
                <button onClick={onOpenSignup} className="text-sm font-bold px-5 py-2.5 rounded-full transition-all shadow-sm hover:shadow-md active:scale-95"
                  style={{ background: scrolled ? "linear-gradient(135deg,#E879A0,#F472B6)" : "white",
                    color: scrolled ? "white" : "#E879A0" }}>
                  무료 시작하기
                </button>
              </>
            )}
          </div>

          {/* 햄버거 버튼 */}
          <button className={`md:hidden ${scrolled ? "text-foreground" : "text-white"}`}
            aria-label={menuOpen ? "메뉴 닫기" : "메뉴 열기"}
            onClick={() => setMenuOpen(!menuOpen)}>
            {menuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {menuOpen && (
          <div className="md:hidden bg-white border-t border-border px-6 py-5 space-y-1">
            {NAV_LINKS.map(([href, label]) => (
              <a key={href} href={href}
                className="block text-sm font-semibold text-foreground py-3 border-b border-border/50 cursor-pointer"
                onClick={(e) => handleNavClick(e, href)}>
                {label}
              </a>
            ))}

            {/* 모바일: 로그인 상태 요약 */}
            {isAuthenticated && user && (
              <div className="flex items-center gap-3 py-4" style={{ borderBottom: "1px solid rgba(0,0,0,0.06)" }}>
                <UserAvatar user={user} size={40} />
                <div className="min-w-0">
                  <p className="text-sm font-bold truncate" style={{ color: "#1F0A3C" }}>{getDisplayName(user)}</p>
                  <p className="text-xs truncate" style={{ color: "#9CA3AF" }}>{user.email}</p>
                </div>
              </div>
            )}

            <div className="pt-4 flex flex-wrap gap-3">
              <button
                onClick={() => { setMenuOpen(false); onOpenCharacters(); }}
                className="flex items-center gap-1.5 text-sm font-bold px-4 py-2 rounded-full"
                style={{background:"rgba(232,121,160,0.1)", color:"#E879A0", border:"1px solid rgba(232,121,160,0.3)"}}>
                <Sparkles className="w-3.5 h-3.5" />
                캐릭터 소개
              </button>

              {isAuthenticated ? (
                <>
                  <button onClick={() => { setMenuOpen(false); onOpenMyPage(); }} className="text-sm font-bold px-5 py-2.5 rounded-full text-white"
                    style={{ background: "linear-gradient(135deg,#E879A0,#F472B6)" }}>
                    마이페이지
                  </button>
                  <button onClick={() => { setMenuOpen(false); logout(); }} className="text-sm font-semibold" style={{ color: "#EF4444" }}>
                    로그아웃
                  </button>
                </>
              ) : (
                <>
                  <button onClick={() => { setMenuOpen(false); onOpenLogin(); }} className="text-sm font-semibold text-foreground">로그인</button>
                  <button onClick={() => { setMenuOpen(false); onOpenSignup(); }} className="text-sm font-bold px-5 py-2.5 rounded-full text-white"
                    style={{ background: "linear-gradient(135deg,#E879A0,#F472B6)" }}>
                    무료 시작하기
                  </button>
                </>
              )}
            </div>
          </div>
        )}
      </nav>
    </>
  );
}
