import type { CSSProperties } from "react";

/** 배지, 로고, 떠 있는 장식에 사용하는 작은 8갈래 별 글리프입니다. */
export function MiniStar({
  size = 16,
  color = "#F9D56E",
  style,
}: {
  size?: number;
  color?: string;
  style?: CSSProperties;
}) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" style={style} fill="none">
      <path d="M12 3 L13.8 8.5 L19.5 8.5 L15 12 L16.8 17.5 L12 14 L7.2 17.5 L9 12 L4.5 8.5 L10.2 8.5 Z" fill={color} />
    </svg>
  );
}
