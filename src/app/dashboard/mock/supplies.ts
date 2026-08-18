import type { SupplyItem } from "@/app/dashboard/types";

const NOW = 1785300000000;

/** 반별 준비물 안내 목업입니다. 학부모 전원이 열람 및 댓글 작성이 가능합니다. */
export function buildSupplies(classId: number, teacherName: string): SupplyItem[] {
  return [
    {
      id: -1,
      classId,
      title: "물놀이 준비물",
      body: "수영복, 여벌 옷, 큰 수건을 이름표와 함께 챙겨 보내주세요. 다음 주 화요일 오전에 진행됩니다.",
      authorName: teacherName,
      createdAt: NOW - 1000 * 60 * 60 * 20,
      dueDate: "2026-08-04",
      comments: [
        { id: -1, authorName: "이서준 부모님", authorRole: "parent", text: "네 선생님, 준비해서 보낼게요!", createdAt: NOW - 1000 * 60 * 60 * 10 },
      ],
    },
    {
      id: -2,
      classId,
      title: "곤충관찰 활동 준비물",
      body: "돋보기가 있는 친구는 가져와도 좋아요(없어도 괜찮아요). 편한 활동복을 입혀 보내주세요.",
      authorName: teacherName,
      createdAt: NOW - 1000 * 60 * 60 * 3,
      comments: [],
    },
  ];
}
