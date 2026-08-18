import type { BackendPermission } from "@/app/lib/dto";
import type { PermissionKey } from "@/app/dashboard/types";

/**
 * 화면용 권한 키와 백엔드 `RoleDTO.Permission` 사이의 1:1 대응입니다.
 * 서버가 모르는 권한을 화면에서 만들어 내지 않도록 이 표를 유일한 통로로 씁니다.
 */
const TO_BACKEND: Record<PermissionKey, BackendPermission> = {
  manageNotices: "MANAGE_NOTICE",
  manageClasses: "MANAGE_CLASS",
  manageMembers: "MANAGE_MEMBER",
  manageSchedule: "MANAGE_SCHEDULE",
  manageSupplies: "MANAGE_SUPPLY",
};

const TO_FRONTEND = Object.fromEntries(
  Object.entries(TO_BACKEND).map(([key, permission]) => [permission, key as PermissionKey]),
) as Record<BackendPermission, PermissionKey>;

export function toBackendPermission(key: PermissionKey): BackendPermission {
  return TO_BACKEND[key];
}

/** 서버가 훗날 새 권한을 추가해도 화면이 깨지지 않도록, 모르는 값은 걸러냅니다. */
export function toPermissionKeys(permissions: BackendPermission[]): PermissionKey[] {
  return permissions.map((p) => TO_FRONTEND[p]).filter(Boolean);
}
