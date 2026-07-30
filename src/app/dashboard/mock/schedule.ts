import type { ScheduleEvent } from "@/app/dashboard/types";

const NOW = 1785300000000;

/** 유치원/반 일정 목업입니다. 다가오는 일정이 항상 하나 이상 있도록 구성해 배너/캐릭터 알림을 확인할 수 있게 합니다. */
export function buildSchedule(kindergartenId: string, classId: string, createdBy: string): ScheduleEvent[] {
  return [
    { id: "sched-1", kindergartenId, classId, title: "물놀이 활동", date: "2026-07-31", time: "10:00", createdBy, createdAt: NOW - 1000 * 60 * 60 * 20 },
    { id: "sched-2", kindergartenId, title: "여름방학 시작", date: "2026-08-03", createdBy, createdAt: NOW - 1000 * 60 * 60 * 18 },
    { id: "sched-3", kindergartenId, classId, title: "학부모 상담주간", date: "2026-08-10", time: "14:00", createdBy, createdAt: NOW - 1000 * 60 * 60 * 5 },
    { id: "sched-4", kindergartenId, classId, title: "7월 생일잔치", date: "2026-07-24", createdBy, createdAt: NOW - 1000 * 60 * 60 * 24 * 7 },
  ];
}
