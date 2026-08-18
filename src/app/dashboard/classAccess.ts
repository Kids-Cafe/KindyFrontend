import type { DashboardData, PermissionKey } from "@/app/dashboard/types";

/**
 * "이 사람이 어느 반을 보고, 어느 반을 고칠 수 있는가"를 한곳에서 정합니다.
 * 사진첩과 일정이 같은 규칙을 써야 해서 화면마다 따로 판정하지 않고 여기로 모읍니다.
 *
 * ⚠️ 이건 화면을 감추는 용도일 뿐 보안 경계가 아닙니다. 백엔드가 붙으면 서버에서도
 * 같은 규칙을 검사해야 합니다(지금은 devtools로 얼마든지 우회할 수 있습니다).
 */

/** 학부모/아이처럼 반을 고를 수 없는 역할이 묶여 있는 반입니다. 고를 수 있으면 undefined. */
export function getLockedClassId(data: DashboardData): number | undefined {
  if (data.role === "parent") return data.myChild?.classId;
  if (data.role === "child") return data.me?.classId;
  return undefined;
}

/** 반 탭을 띄워 여러 반을 오갈 수 있는 역할인지. 원장과 선생님만 해당합니다. */
export function canBrowseAllClasses(data: DashboardData): boolean {
  return data.role === "director" || data.role === "teacher";
}

/** 로그인한 선생님이 특정 권한을 가진 역할을 배정받았는지 확인합니다. */
export function teacherHasPermission(data: DashboardData, permission: PermissionKey): boolean {
  if (data.role !== "teacher") return false;
  return data.teacher.roleIds.some((roleId) =>
    data.roles.find((r) => r.id === roleId)?.permissions.includes(permission),
  );
}

/**
 * 해당 반의 콘텐츠를 등록·수정·삭제할 수 있는지 판정합니다.
 *
 * - 원장: 모든 반
 * - 선생님: 자기 반만. 단 원장이 `elevatedPermission`("전체 반" 권한)을 준 경우 모든 반
 * - 학부모/아이: 불가
 */
export function canManageClass(
  data: DashboardData,
  classId: number | undefined,
  elevatedPermission: PermissionKey,
): boolean {
  if (!classId) return false;
  if (data.role === "director") return true;
  if (data.role !== "teacher") return false;
  return classId === data.teacher.classId || teacherHasPermission(data, elevatedPermission);
}

/**
 * 반이 지정되지 않은 "유치원 전체" 콘텐츠를 고칠 수 있는지 판정합니다.
 * 전체 공지성 일정이라 원장, 또는 "전체 반" 권한을 받은 선생님만 건드릴 수 있습니다.
 */
export function canManageKindergartenWide(data: DashboardData, elevatedPermission: PermissionKey): boolean {
  if (data.role === "director") return true;
  return teacherHasPermission(data, elevatedPermission);
}
