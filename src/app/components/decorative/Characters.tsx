import type { CSSProperties } from "react";
import kioImg from "@/imports/image.png";
import kinaImg from "@/imports/image-1.png";
import { ImageWithFallback } from "@/app/components/figma/ImageWithFallback";

type CharacterProps = { className?: string; style?: CSSProperties };

/** 키오: 남성 AI 파트너입니다. 원본 아트는 분홍색이며, 여기서는 색조를 파란색으로 회전했습니다. */
export function KioSVG({ className, style }: CharacterProps) {
  return (
    <ImageWithFallback
      src={kioImg}
      alt="키오 - Kindy AI 파트너 (남)"
      className={className}
      style={{ filter: "hue-rotate(215deg) saturate(1.05) brightness(1.04)", ...style }}
    />
  );
}

/** 키나: 여성 AI 파트너이며, 원본 분홍색 아트로 표시됩니다. */
export function KinaSVG({ className, style }: CharacterProps) {
  return <ImageWithFallback src={kinaImg} alt="키나 - Kindy AI 파트너 (여)" className={className} style={style} />;
}
