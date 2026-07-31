import { beforeEach, describe, expect, it } from "vitest";
import type { AuthUser } from "@/app/auth/types";
import { buildDashboardData, resolveDashboardRole } from "@/app/dashboard/mockData";

const KINDERGARTEN = {
  id: "kg-seed-1",
  name: "햇살유치원",
  zonecode: "06234",
  address: "서울특별시 강남구 테헤란로 123",
};

function makeUser(partial: Partial<AuthUser> = {}): AuthUser {
  return {
    id: "user-1",
    name: "김데모",
    email: "demo@kindy.demo",
    loginId: "demo",
    provider: "email",
    joinedAt: "2026-01-01T00:00:00.000Z",
    nickname: "데모",
    accountType: "adult",
    role: "teacher",
    teacherRole: "director",
    kindergarten: KINDERGARTEN,
    onboardingCompleted: true,
    ...partial,
  };
}

beforeEach(() => {
  // 초대 목록이 localStorage에 남아 있으면 교사 워크스페이스의 반 배정이 달라집니다.
  localStorage.clear();
});

describe("resolveDashboardRole", () => {
  it("계정 정보에서 역할 하나를 결정한다", () => {
    expect(resolveDashboardRole(makeUser())).toBe("director");
    expect(resolveDashboardRole(makeUser({ teacherRole: "teacher" }))).toBe("teacher");
    expect(resolveDashboardRole(makeUser({ role: "parent", teacherRole: undefined }))).toBe("parent");
    expect(resolveDashboardRole(makeUser({ accountType: "child" }))).toBe("child");
  });
});

describe("buildDashboardData", () => {
  it("오버라이드가 없으면 계정의 실제 역할을 따른다", () => {
    expect(buildDashboardData(makeUser()).role).toBe("director");
    expect(buildDashboardData(makeUser({ role: "parent", teacherRole: undefined })).role).toBe("parent");
  });

  it("통합 데모 계정의 네 역할 워크스페이스를 모두 만들 수 있다", () => {
    const user = makeUser();
    const roles = ["director", "teacher", "parent", "child"] as const;

    for (const role of roles) {
      const data = buildDashboardData(user, role);
      expect(data.role).toBe(role);
      // 네 워크스페이스는 같은 유치원을 서로 다른 역할로 보는 것입니다.
      expect(data.kindergarten.name).toBe(KINDERGARTEN.name);
    }
  });

  it("아이 워크스페이스는 '나'를 만들고 파트너를 아직 고르지 않은 상태로 둔다", () => {
    const data = buildDashboardData(makeUser(), "child");

    expect(data.me).toBeDefined();
    expect(data.me?.nickname).toBe("데모");
    expect(data.me?.aiPartner).toBeNull(); // 첫 진입에서 키오/키나를 직접 고릅니다.
    expect(data.myChild).toBeUndefined();
  });

  it("학부모 워크스페이스는 '내 아이'를 만들고 '나'는 만들지 않는다", () => {
    const data = buildDashboardData(makeUser(), "parent");

    expect(data.myChild).toBeDefined();
    expect(data.myChild?.parentId).toBe("user-1");
    expect(data.me).toBeUndefined();
  });

  it("원장/교사 워크스페이스에서는 로그인한 본인이 교사 자리에 앉는다", () => {
    expect(buildDashboardData(makeUser(), "director").teacher.id).toBe("user-1");
    expect(buildDashboardData(makeUser(), "teacher").teacher.id).toBe("user-1");
  });

  it("학부모/아이 워크스페이스에서는 담임이 시드 교사로 채워진다", () => {
    expect(buildDashboardData(makeUser(), "parent").teacher.id).toBe("teacher-seed");
    expect(buildDashboardData(makeUser(), "child").teacher.id).toBe("teacher-seed");
  });

  it("워크스페이스끼리 데이터를 공유하지 않는다", () => {
    const user = makeUser();
    const director = buildDashboardData(user, "director");
    const parent = buildDashboardData(user, "parent");

    expect(director.notices).not.toBe(parent.notices);
    expect(director.scheduleEvents).not.toBe(parent.scheduleEvents);
  });
});
