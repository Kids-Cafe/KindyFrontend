import type { NoticeRecord } from "@/app/dashboard/types";

const NOW = 1785300000000;

/** 원장이 작성한 유치원 공지사항 목업입니다. */
export function buildNotices(kindergartenId: string, directorName: string): NoticeRecord[] {
  return [
    {
      id: "notice-1",
      kindergartenId,
      title: "여름방학 특별활동 안내",
      body: "다음 주부터 여름방학 특별활동(물놀이, 곤충관찰)이 진행됩니다. 여벌 옷과 편한 신발을 준비해주세요.",
      authorName: directorName,
      createdAt: NOW - 1000 * 60 * 60 * 24 * 2,
      pinned: true,
      bannerEnabled: true,
    },
    {
      id: "notice-2",
      kindergartenId,
      title: "8월 등원 시간 안내",
      body: "무더위로 인해 8월 한 달간 등원 시간이 30분 늦춰집니다. 각 가정에서는 참고 부탁드립니다.",
      authorName: directorName,
      createdAt: NOW - 1000 * 60 * 60 * 24,
      pinned: false,
      bannerEnabled: false,
    },
  ];
}
