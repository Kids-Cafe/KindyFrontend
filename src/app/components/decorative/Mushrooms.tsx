import type { CSSProperties } from "react";

type MushroomProps = { className?: string; style?: CSSProperties };

/**
 * 세 가지 버섯 변형은 동일한 구조(바닥 그림자 → 줄기 → 갓 주변 폐색 →
 * 3D 갓 → 테두리 → 반사 하이라이트 → 반점)를 공유하며, 색상/크기별로
 * 그라디언트 중단점과 기하 형태만 다릅니다. 각각 Figma에서 손으로 조정했기
 * 때문에 하나의 매개변수화된 형태 대신 별도 컴포넌트로 유지합니다.
 */

export function MushroomPink({ className, style }: MushroomProps) {
  return (
    <svg viewBox="0 0 100 130" className={className} style={style} fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="mpCap" cx="38%" cy="30%" r="65%" gradientUnits="objectBoundingBox">
          <stop offset="0%" stopColor="#FFB8E8" />
          <stop offset="30%" stopColor="#F472B6" />
          <stop offset="72%" stopColor="#DB2777" />
          <stop offset="100%" stopColor="#9D174D" />
        </radialGradient>
        <radialGradient id="mpSpec" cx="32%" cy="25%" r="38%" gradientUnits="objectBoundingBox">
          <stop offset="0%" stopColor="rgba(255,255,255,0.92)" />
          <stop offset="60%" stopColor="rgba(255,255,255,0.22)" />
          <stop offset="100%" stopColor="rgba(255,255,255,0)" />
        </radialGradient>
        <radialGradient id="mpStem" cx="32%" cy="50%" r="70%" gradientUnits="objectBoundingBox">
          <stop offset="0%" stopColor="#FDE8F4" />
          <stop offset="55%" stopColor="#F9A8D4" />
          <stop offset="100%" stopColor="#EC4899" />
        </radialGradient>
        <filter id="mpShadow" x="-20%" y="-10%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="3" />
        </filter>
      </defs>
      {/* 바닥 그림자 */}
      <ellipse cx="50" cy="126" rx="26" ry="5" fill="rgba(0,0,0,0.22)" filter="url(#mpShadow)" />
      {/* 줄기 */}
      <path d="M41 124 Q39 98 42 84 Q50 79 58 84 Q61 98 59 124 Z" fill="url(#mpStem)" />
      {/* 줄기 하단 그림자 */}
      <path d="M41 124 Q39 108 42 98 Q50 95 58 98 Q61 108 59 124 Z" fill="rgba(150,40,90,0.18)" />
      {/* 갓 밑면 그림자(주변 폐색) */}
      <ellipse cx="50" cy="68" rx="40" ry="10" fill="rgba(120,20,60,0.3)" />
      {/* 3D 갓 */}
      <ellipse cx="50" cy="58" rx="46" ry="30" fill="url(#mpCap)" />
      {/* 갓 테두리의 어두운 가장자리 */}
      <ellipse cx="50" cy="58" rx="46" ry="30" fill="none" stroke="rgba(100,10,50,0.25)" strokeWidth="4" />
      {/* 반사 하이라이트 */}
      <ellipse cx="34" cy="44" rx="20" ry="15" fill="url(#mpSpec)" />
      {/* 반점 */}
      <circle cx="28" cy="56" r="7" fill="rgba(255,255,255,0.52)" />
      <circle cx="28" cy="56" r="4" fill="rgba(255,255,255,0.78)" />
      <circle cx="64" cy="50" r="5" fill="rgba(255,255,255,0.48)" />
      <circle cx="64" cy="50" r="3" fill="rgba(255,255,255,0.72)" />
      <circle cx="50" cy="68" r="3.5" fill="rgba(255,255,255,0.4)" />
    </svg>
  );
}

export function MushroomTeal({ className, style }: MushroomProps) {
  return (
    <svg viewBox="0 0 90 120" className={className} style={style} fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="mtCap" cx="36%" cy="28%" r="65%" gradientUnits="objectBoundingBox">
          <stop offset="0%" stopColor="#B2F5EC" />
          <stop offset="28%" stopColor="#5EEAD4" />
          <stop offset="68%" stopColor="#0EA5A0" />
          <stop offset="100%" stopColor="#065F5A" />
        </radialGradient>
        <radialGradient id="mtSpec" cx="30%" cy="24%" r="40%">
          <stop offset="0%" stopColor="rgba(255,255,255,0.90)" />
          <stop offset="58%" stopColor="rgba(255,255,255,0.18)" />
          <stop offset="100%" stopColor="rgba(255,255,255,0)" />
        </radialGradient>
        <radialGradient id="mtStem" cx="30%" cy="50%" r="72%">
          <stop offset="0%" stopColor="#CCFBF1" />
          <stop offset="55%" stopColor="#5EEAD4" />
          <stop offset="100%" stopColor="#14B8A6" />
        </radialGradient>
        <filter id="mtShadow"><feGaussianBlur stdDeviation="3" /></filter>
      </defs>
      <ellipse cx="45" cy="116" rx="22" ry="4.5" fill="rgba(0,0,0,0.2)" filter="url(#mtShadow)" />
      <path d="M37 114 Q35 90 38 77 Q45 73 52 77 Q55 90 53 114 Z" fill="url(#mtStem)" />
      <path d="M37 114 Q35 99 38 91 Q45 88 52 91 Q55 99 53 114 Z" fill="rgba(10,80,75,0.18)" />
      <ellipse cx="45" cy="60" rx="36" ry="9" fill="rgba(5,70,65,0.28)" />
      <ellipse cx="45" cy="52" rx="42" ry="27" fill="url(#mtCap)" />
      <ellipse cx="45" cy="52" rx="42" ry="27" fill="none" stroke="rgba(0,60,55,0.22)" strokeWidth="3.5" />
      <ellipse cx="30" cy="39" rx="18" ry="13" fill="url(#mtSpec)" />
      <circle cx="24" cy="50" r="6" fill="rgba(255,255,255,0.50)" />
      <circle cx="24" cy="50" r="3.5" fill="rgba(255,255,255,0.78)" />
      <circle cx="58" cy="44" r="4.5" fill="rgba(255,255,255,0.45)" />
      <circle cx="58" cy="44" r="2.5" fill="rgba(255,255,255,0.70)" />
    </svg>
  );
}

export function MushroomOrange({ className, style }: MushroomProps) {
  return (
    <svg viewBox="0 0 110 140" className={className} style={style} fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="moCap" cx="37%" cy="29%" r="64%" gradientUnits="objectBoundingBox">
          <stop offset="0%" stopColor="#FDDBA0" />
          <stop offset="28%" stopColor="#FB923C" />
          <stop offset="68%" stopColor="#EA580C" />
          <stop offset="100%" stopColor="#9A3412" />
        </radialGradient>
        <radialGradient id="moSpec" cx="31%" cy="24%" r="38%">
          <stop offset="0%" stopColor="rgba(255,255,255,0.90)" />
          <stop offset="60%" stopColor="rgba(255,255,255,0.18)" />
          <stop offset="100%" stopColor="rgba(255,255,255,0)" />
        </radialGradient>
        <radialGradient id="moStem" cx="30%" cy="50%" r="72%">
          <stop offset="0%" stopColor="#FEF0D0" />
          <stop offset="55%" stopColor="#FDBA74" />
          <stop offset="100%" stopColor="#F97316" />
        </radialGradient>
        <filter id="moShadow"><feGaussianBlur stdDeviation="3.5" /></filter>
      </defs>
      <ellipse cx="55" cy="135" rx="30" ry="6" fill="rgba(0,0,0,0.22)" filter="url(#moShadow)" />
      <path d="M44 133 Q41 104 45 89 Q55 84 65 89 Q69 104 66 133 Z" fill="url(#moStem)" />
      <path d="M44 133 Q41 116 45 106 Q55 102 65 106 Q69 116 66 133 Z" fill="rgba(140,50,10,0.18)" />
      <ellipse cx="55" cy="74" rx="48" ry="12" fill="rgba(120,35,5,0.28)" />
      <ellipse cx="55" cy="62" rx="52" ry="34" fill="url(#moCap)" />
      <ellipse cx="55" cy="62" rx="52" ry="34" fill="none" stroke="rgba(110,30,5,0.22)" strokeWidth="4" />
      <ellipse cx="36" cy="46" rx="24" ry="17" fill="url(#moSpec)" />
      <circle cx="28" cy="60" r="8" fill="rgba(255,255,255,0.50)" />
      <circle cx="28" cy="60" r="4.5" fill="rgba(255,255,255,0.78)" />
      <circle cx="72" cy="53" r="6" fill="rgba(255,255,255,0.45)" />
      <circle cx="72" cy="53" r="3.5" fill="rgba(255,255,255,0.72)" />
      <circle cx="56" cy="76" r="4" fill="rgba(255,255,255,0.38)" />
    </svg>
  );
}
