import type { ClassRecord, RoleDef, TeacherRecord } from "@/app/dashboard/types";

/** 원장의 반 관리 화면에서 보여줄 유치원 내 반 목록입니다. */
export function buildClasses(kindergartenId: string): ClassRecord[] {
  return [
    { id: "class-1", name: "해바라기반", kindergartenId },
    { id: "class-2", name: "햇님반", kindergartenId },
    { id: "class-3", name: "장미반", kindergartenId },
    { id: "class-4", name: "무지개반", kindergartenId },
    { id: "class-5", name: "별빛반", kindergartenId },
  ];
}

/** 원장이 교사 계정에 배정하는 권한 역할입니다. */
export function buildRoles(): RoleDef[] {
  return [
    { id: "role-senior", name: "수석교사", color: "#E879A0", permissions: ["manageNotices", "manageSchedule", "manageSupplies"] },
    { id: "role-teacher", name: "담임교사", color: "#60A5FA", permissions: ["manageSchedule", "manageSupplies"] },
  ];
}

/** 원장의 멤버 관리 화면에서 보여줄 유치원 내 전체 교사 계정입니다. */
export function buildTeachers(kindergartenId: string, kindergartenName: string, myTeacher: TeacherRecord): TeacherRecord[] {
  const others: TeacherRecord[] = [
    { id: "teacher-2", name: "이수민 선생님", classId: "class-2", className: "햇님반", kindergartenId, kindergartenName, roleIds: ["role-teacher"] },
    { id: "teacher-3", name: "정다은 선생님", classId: "class-3", className: "장미반", kindergartenId, kindergartenName, roleIds: ["role-teacher"] },
    { id: "teacher-4", name: "한지민 선생님", classId: "class-4", className: "무지개반", kindergartenId, kindergartenName, roleIds: ["role-teacher"] },
    { id: "teacher-5", name: "오세영 선생님", classId: "class-5", className: "별빛반", kindergartenId, kindergartenName, roleIds: ["role-senior"] },
  ];
  return [myTeacher, ...others].filter((t) => t.classId !== myTeacher.classId || t.id === myTeacher.id);
}
