import { describe, expect, it } from "vitest";
import { toBackendPermission, toPermissionKeys } from "@/app/lib/permissions";
import { PERMISSION_LABELS } from "@/app/dashboard/types";
import type { PermissionKey } from "@/app/dashboard/types";
import type { BackendPermission } from "@/app/lib/dto";

const ALL_KEYS = Object.keys(PERMISSION_LABELS) as PermissionKey[];

describe("권한 매핑", () => {
  it("화면 권한과 백엔드 권한이 1:1로 왕복한다", () => {
    for (const key of ALL_KEYS) {
      expect(toPermissionKeys([toBackendPermission(key)])).toEqual([key]);
    }
  });

  it("서로 다른 화면 권한이 같은 백엔드 권한으로 뭉개지지 않는다", () => {
    const mapped = ALL_KEYS.map(toBackendPermission);
    expect(new Set(mapped).size).toBe(ALL_KEYS.length);
  });

  it("사진첩은 반 관리와 별개의 권한이다", () => {
    // 서버의 class/photo/*가 MANAGE_PHOTO를 검사하므로 둘이 붙어 있으면 안 됩니다.
    expect(toBackendPermission("managePhotos")).toBe("MANAGE_PHOTO");
    expect(toBackendPermission("manageClasses")).toBe("MANAGE_CLASS");
  });

  it("서버가 새 권한을 추가해도 모르는 값은 조용히 걸러낸다", () => {
    const withUnknown = ["MANAGE_NOTICE", "MANAGE_SOMETHING_NEW"] as BackendPermission[];
    expect(toPermissionKeys(withUnknown)).toEqual(["manageNotices"]);
  });

  it("빈 목록은 빈 목록으로 남는다", () => {
    expect(toPermissionKeys([])).toEqual([]);
  });
});
