import { describe, expect, it } from "vitest";
import { canOpenFeature, featuresFor, FEATURES_BY_ROLE } from "@/app/dashboard/featureDefs";
import { canManageRoster } from "@/app/dashboard/classAccess";
import type { DashboardData, PermissionKey, RoleDef } from "@/app/dashboard/types";

/**
 * 사이드바에 무엇이 뜨는지는 역할만이 아니라 배정된 권한으로도 갈립니다.
 * 이 파일이 지키는 건 "서버가 허락하는 일은 화면에도 길이 있어야 한다"는 규칙입니다.
 */

function role(id: number, permissions: PermissionKey[]): RoleDef {
  return { id, name: `역할${id}`, color: "#E879A0", permissions };
}

/** 권한 판정에 필요한 칸만 채운 최소 데이터입니다(featuresFor는 role·roles·teacher만 봅니다). */
function makeData(partial: Partial<DashboardData> = {}): DashboardData {
  return {
    role: "teacher",
    kindergarten: { id: 7, name: "햇살유치원" },
    teacher: {
      id: "teacher-1",
      name: "박선생",
      className: "해바라기반",
      kindergartenId: 7,
      kindergartenName: "햇살유치원",
      roleIds: [],
    },
    classChildren: [],
    diaryByChild: {},
    reportsByChild: {},
    threadsByChild: {},
    aiThreadsByChild: {},
    memberThreadsByTeacher: {},
    classes: [],
    roles: [],
    teachers: [],
    notices: [],
    suppliesByClass: {},
    scheduleEvents: [],
    photos: [],
    parentNotesByChild: {},
    homeWidgets: [],
    ...partial,
  };
}

describe("featuresFor", () => {
  it("권한이 없는 선생님은 역할 기본 목록 그대로다", () => {
    const data = makeData();
    expect(featuresFor(data)).toEqual(FEATURES_BY_ROLE.teacher);
  });

  it("반·멤버 관리 권한을 받은 선생님에게는 그 항목이 생긴다", () => {
    const data = makeData({
      roles: [role(10, ["manageClasses", "manageMembers"])],
      teacher: { ...makeData().teacher, roleIds: [10] },
    });

    const ids = featuresFor(data).map((f) => f.id);
    expect(ids).toContain("classes");
    expect(ids).toContain("members");
    // 홈 바로 다음에 모여야 원장 화면과 순서가 같습니다.
    expect(ids.slice(0, 3)).toEqual(["home", "classes", "members"]);
  });

  it("가진 권한에 해당하는 항목만 생긴다", () => {
    const data = makeData({
      roles: [role(10, ["manageNotices"])],
      teacher: { ...makeData().teacher, roleIds: [10] },
    });

    const ids = featuresFor(data).map((f) => f.id);
    expect(ids).toContain("notices");
    expect(ids).not.toContain("members");
    expect(ids).not.toContain("classes");
  });

  it("배정되지 않은 역할의 권한은 세지 않는다", () => {
    const data = makeData({ roles: [role(10, ["manageMembers"])] }); // roleIds가 비어 있음
    expect(featuresFor(data).map((f) => f.id)).not.toContain("members");
  });

  it("원장은 역할 목록을 그대로 쓴다", () => {
    const data = makeData({ role: "director" });
    expect(featuresFor(data)).toEqual(FEATURES_BY_ROLE.director);
    expect(canOpenFeature(data, "members")).toBe(true);
  });

  it("학부모·아이에게는 관리 화면이 열리지 않는다", () => {
    for (const r of ["parent", "child"] as const) {
      const data = makeData({ role: r, roles: [role(10, ["manageMembers"])] });
      expect(canOpenFeature(data, "members")).toBe(false);
    }
  });
});

describe("canManageRoster", () => {
  it("원장은 언제나, 선생님은 멤버나 반 권한이 있을 때만 전체 명단을 본다", () => {
    expect(canManageRoster(makeData({ role: "director" }))).toBe(true);
    expect(canManageRoster(makeData())).toBe(false);

    const withMembers = makeData({
      roles: [role(10, ["manageMembers"])],
      teacher: { ...makeData().teacher, roleIds: [10] },
    });
    expect(canManageRoster(withMembers)).toBe(true);

    const withClasses = makeData({
      roles: [role(11, ["manageClasses"])],
      teacher: { ...makeData().teacher, roleIds: [11] },
    });
    expect(canManageRoster(withClasses)).toBe(true);

    // 다른 권한만 있으면 명단은 열리지 않습니다.
    const withPhotos = makeData({
      roles: [role(12, ["managePhotos"])],
      teacher: { ...makeData().teacher, roleIds: [12] },
    });
    expect(canManageRoster(withPhotos)).toBe(false);
  });
});
