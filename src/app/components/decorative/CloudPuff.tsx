import type { CSSProperties } from "react";

/** 겹친 원으로 만든 부드럽고 둥근 구름 형태이며, 배경 채움 요소로 사용됩니다. */
export function CloudPuff({
  className,
  style,
  color = "white",
}: {
  className?: string;
  style?: CSSProperties;
  color?: string;
}) {
  return (
    <svg viewBox="0 0 120 60" className={className} style={style} fill="none">
      <circle cx="30" cy="38" r="22" fill={color} opacity="0.72" />
      <circle cx="55" cy="28" r="28" fill={color} opacity="0.78" />
      <circle cx="85" cy="35" r="24" fill={color} opacity="0.72" />
      <rect x="8" y="38" width="104" height="22" rx="2" fill={color} opacity="0.72" />
    </svg>
  );
}
