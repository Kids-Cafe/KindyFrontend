import type { ClassRecord, RoleDef, TeacherRecord } from "@/app/dashboard/types";

/** 원장의 반 관리 화면에서 보여줄 유치원 내 반 목록입니다. */
export function buildClasses(kindergartenId: number): ClassRecord[] {
  return [
    { id: -1, name: "해바라기반", kindergartenId },
    { id: -2, name: "햇님반", kindergartenId },
    { id: -3, name: "장미반", kindergartenId },
    { id: -4, name: "무지개반", kindergartenId },
    { id: -5, name: "별빛반", kindergartenId },
  ];
}

/** 원장이 교사 계정에 배정하는 권한 역할입니다. */
export function buildRoles(): RoleDef[] {
  return [
    { id: -1, name: "수석교사", color: "#E879A0", permissions: ["manageNotices", "manageSchedule", "manageSupplies", "managePhotos"] },
    { id: -2, name: "담임교사", color: "#60A5FA", permissions: ["manageSchedule", "manageSupplies"] },
  ];
}

/** 원장의 멤버 관리 화면에서 보여줄 유치원 내 전체 교사 계정입니다. */
export function buildTeachers(kindergartenId: number, kindergartenName: string, myTeacher: TeacherRecord): TeacherRecord[] {
  const others: TeacherRecord[] = [
    { id: "teacher-2", name: "이수민 선생님", classId: -2, className: "햇님반", kindergartenId, kindergartenName, roleIds: [-2] },
    { id: "teacher-3", name: "정다은 선생님", classId: -3, className: "장미반", kindergartenId, kindergartenName, roleIds: [-2] },
    { id: "teacher-4", name: "한지민 선생님", classId: -4, className: "무지개반", kindergartenId, kindergartenName, roleIds: [-2] },
    { id: "teacher-5", name: "오세영 선생님", classId: -5, className: "별빛반", kindergartenId, kindergartenName, roleIds: [-1] },
  ];
  return [myTeacher, ...others].filter((t) => t.classId !== myTeacher.classId || t.id === myTeacher.id);
}
