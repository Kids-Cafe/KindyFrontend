import type { CSSProperties } from "react";

/** 떠 있는 배경 포인트로 사용하는 작은 4갈래 반짝임 글리프입니다. */
export function Sparkle({
  size = 20,
  color = "#F9D56E",
  style,
}: {
  size?: number;
  color?: string;
  style?: CSSProperties;
}) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" style={style} fill="none">
      <path d="M12 2 L13.5 9 L20 12 L13.5 15 L12 22 L10.5 15 L4 12 L10.5 9 Z" fill={color} />
    </svg>
  );
}
