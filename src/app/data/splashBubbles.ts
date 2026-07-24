/**
 * 인트로 스플래시 애니메이션에 사용하는 상승 버블 설정입니다. 렌더링마다
 * 다시 계산되지 않도록 생성하지 않고 모듈 수준에서 정의했습니다. 각 버블의
 * 크기, 가로 위치, 애니메이션 지연/시간, 흔들림 경로, 그라디언트는 자연스럽게
 * 엇갈려 보이도록 고정하고 직접 조정했습니다.
 */
export const SPLASH_BUBBLES = [
  // 크기  x%   지연  시간  흔들림      그라디언트
  { s: 310, x: 50, d: 1.00, t: 1.55, a: "kindyBubC", g: "radial-gradient(circle at 32% 28%, rgba(255,255,255,0.58), #F9A8D4 48%, rgba(232,121,160,0.78))" },
  { s: 230, x: 18, d: 1.06, t: 1.38, a: "kindyBubA", g: "radial-gradient(circle at 32% 28%, rgba(255,255,255,0.52), #DDD6FE 48%, rgba(192,132,252,0.74))" },
  { s: 255, x: 82, d: 1.04, t: 1.44, a: "kindyBubB", g: "radial-gradient(circle at 32% 28%, rgba(255,255,255,0.52), #FBCFE8 48%, rgba(244,114,182,0.74))" },
  { s: 168, x:  9, d: 1.12, t: 1.2,  a: "kindyBubB", g: "radial-gradient(circle at 32% 28%, rgba(255,255,255,0.5),  #E9D5FF 48%, rgba(168,85,247,0.70))" },
  { s: 188, x: 38, d: 1.08, t: 1.3,  a: "kindyBubA", g: "radial-gradient(circle at 32% 28%, rgba(255,255,255,0.56), #FDE68A 48%, rgba(249,213,110,0.72))" },
  { s: 158, x: 64, d: 1.10, t: 1.24, a: "kindyBubC", g: "radial-gradient(circle at 32% 28%, rgba(255,255,255,0.5),  #BAE6FD 48%, rgba(56,189,248,0.70))" },
  { s: 174, x: 92, d: 1.14, t: 1.22, a: "kindyBubA", g: "radial-gradient(circle at 32% 28%, rgba(255,255,255,0.5),  #BBF7D0 48%, rgba(74,222,128,0.68))" },
  { s: 118, x:  5, d: 1.18, t: 1.08, a: "kindyBubA", g: "radial-gradient(circle at 32% 28%, rgba(255,255,255,0.5),  #F9A8D4 48%, rgba(232,121,160,0.70))" },
  { s: 132, x: 28, d: 1.15, t: 1.14, a: "kindyBubB", g: "radial-gradient(circle at 32% 28%, rgba(255,255,255,0.5),  #DDD6FE 48%, rgba(192,132,252,0.67))" },
  { s: 108, x: 53, d: 1.20, t: 1.04, a: "kindyBubC", g: "radial-gradient(circle at 32% 28%, rgba(255,255,255,0.56), #FDE68A 48%, rgba(249,213,110,0.67))" },
  { s: 122, x: 72, d: 1.16, t: 1.12, a: "kindyBubA", g: "radial-gradient(circle at 32% 28%, rgba(255,255,255,0.5),  #BAE6FD 48%, rgba(56,189,248,0.64))" },
  { s: 100, x: 95, d: 1.22, t: 1.00, a: "kindyBubB", g: "radial-gradient(circle at 32% 28%, rgba(255,255,255,0.5),  #C4B5E8 48%, rgba(168,85,247,0.64))" },
  { s:  74, x: 16, d: 1.24, t: 0.93, a: "kindyBubC", g: "radial-gradient(circle at 32% 28%, rgba(255,255,255,0.5),  #E9D5FF 48%, rgba(168,85,247,0.62))" },
  { s:  90, x: 44, d: 1.20, t: 0.98, a: "kindyBubB", g: "radial-gradient(circle at 32% 28%, rgba(255,255,255,0.5),  #FBCFE8 48%, rgba(244,114,182,0.64))" },
  { s:  68, x: 67, d: 1.26, t: 0.90, a: "kindyBubA", g: "radial-gradient(circle at 32% 28%, rgba(255,255,255,0.5),  #F9A8D4 48%, rgba(232,121,160,0.62))" },
  { s:  58, x: 34, d: 1.28, t: 0.85, a: "kindyBubC", g: "radial-gradient(circle at 32% 28%, rgba(255,255,255,0.56), #FDE68A 48%, rgba(249,213,110,0.60))" },
  { s:  50, x: 57, d: 1.30, t: 0.82, a: "kindyBubA", g: "radial-gradient(circle at 32% 28%, rgba(255,255,255,0.5),  #DDD6FE 48%, rgba(192,132,252,0.60))" },
  { s:  44, x: 78, d: 1.25, t: 0.84, a: "kindyBubB", g: "radial-gradient(circle at 32% 28%, rgba(255,255,255,0.5),  #BAE6FD 48%, rgba(56,189,248,0.60))" },
  { s:  38, x: 23, d: 1.32, t: 0.78, a: "kindyBubC", g: "radial-gradient(circle at 32% 28%, rgba(255,255,255,0.5),  #BBF7D0 48%, rgba(74,222,128,0.58))" },
  { s:  32, x: 86, d: 1.34, t: 0.75, a: "kindyBubA", g: "radial-gradient(circle at 32% 28%, rgba(255,255,255,0.56), #F9A8D4 48%, rgba(232,121,160,0.58))" },
] as const;
