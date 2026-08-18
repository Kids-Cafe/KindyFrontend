import type { PhotoRecord, PhotoThemeId } from "@/app/dashboard/types";
import {newId} from "@/app/lib/id.ts";

const NOW = 1785300000000;

/** 실제 업로드 사진이 없는 상태를 대비해 인라인 SVG로 그럴듯한 썸네일을 만듭니다. */
function placeholder(emoji: string, bg: string): string {
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='400' height='400'><rect width='400' height='400' fill='${bg}'/><text x='50%' y='54%' font-size='160' text-anchor='middle' dominant-baseline='middle'>${emoji}</text></svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

/**
 * 반별 사진첩 목업입니다. `classIds`에 담긴 반마다 사진을 돌아가며 배정하고,
 * 테마도 네 가지를 골고루 섞어 반마다 다른 분위기가 나도록 합니다.
 */
export function buildPhotos(classIds: number[]): PhotoRecord[] {
  if (classIds.length === 0) return [];

  const themes: PhotoThemeId[] = ["clip", "polaroid", "frame-wood", "frame-gold"];
  const seeds: { emoji: string; bg: string; caption: string; uploadedBy: string; hoursAgo: number }[] = [
    { emoji: "🌻", bg: "#FDE68A", caption: "바깥놀이 시간", uploadedBy: "박지현 선생님", hoursAgo: 72 },
    { emoji: "🎨", bg: "#FBCFE8", caption: "그림 그리기 활동", uploadedBy: "박지현 선생님", hoursAgo: 50 },
    { emoji: "🧩", bg: "#BFDBFE", caption: "블록놀이", uploadedBy: "이수민 선생님", hoursAgo: 30 },
    { emoji: "🍓", bg: "#FECACA", caption: "점심시간", uploadedBy: "이수민 선생님", hoursAgo: 20 },
    { emoji: "🎶", bg: "#DDD6FE", caption: "노래 시간", uploadedBy: "정다은 선생님", hoursAgo: 5 },
    { emoji: "⚽", bg: "#BBF7D0", caption: "체육 활동", uploadedBy: "정다은 선생님", hoursAgo: 2 },
    { emoji: "📚", bg: "#FED7AA", caption: "동화 읽기", uploadedBy: "한지민 선생님", hoursAgo: 44 },
    { emoji: "🧁", bg: "#FBCFE8", caption: "간식 만들기", uploadedBy: "한지민 선생님", hoursAgo: 12 },
  ];

  return seeds.map((s, i) => ({
    id: newId(),
    classId: classIds[i % classIds.length],
    url: placeholder(s.emoji, s.bg),
    caption: s.caption,
    uploadedBy: s.uploadedBy,
    theme: themes[i % themes.length],
    takenAt: NOW - 1000 * 60 * 60 * s.hoursAgo,
  }));
}
