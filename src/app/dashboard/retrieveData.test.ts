import { describe, expect, it } from "vitest";
import type { AuthUser } from "@/app/auth/types";
import type { FamilyDTO, RelationshipDTO } from "@/app/lib/dto";
import type { ClassRecord } from "@/app/dashboard/types";
import {
  avatarFor,
  buildMemberSnapshot,
  emptyDashboardData,
  resolveDashboardRole,
  roleFromRelationship,
} from "@/app/dashboard/retrieveData";

const KINDERGARTEN = { id: 7, name: "햇살유치원" };

const CLASSES: ClassRecord[] = [
  { id: 1, name: "해바라기반", kindergartenId: 7 },
  { id: 2, name: "햇님반", kindergartenId: 7 },
];

function makeUser(partial: Partial<AuthUser> = {}): AuthUser {
  return {
    id: "user-1",
    name: "김데모",
    email: "demo@kindy.demo",
    loginId: "demo",
    provider: "email",
    linkedProviders: [],
    joinedAt: "2026-01-01T00:00:00.000Z",
    accountType: "adult",
    role: "teacher",
    teacherRole: "director",
    onboardingCompleted: true,
    ...partial,
  };
}

function relationship(partial: Partial<RelationshipDTO> & Pick<RelationshipDTO, "userId" | "type">): RelationshipDTO {
  return { kindergartenId: 7, ...partial };
}

describe("resolveDashboardRole", () => {
  it("계정 정보에서 역할 하나를 결정한다", () => {
    expect(resolveDashboardRole(makeUser())).toBe("director");
    expect(resolveDashboardRole(makeUser({ teacherRole: "teacher" }))).toBe("teacher");
    expect(resolveDashboardRole(makeUser({ role: "parent", teacherRole: undefined }))).toBe("parent");
    expect(resolveDashboardRole(makeUser({ accountType: "child" }))).toBe("child");
  });
});

describe("roleFromRelationship", () => {
  it("소유자면 원장, 아니면 선생님이다", () => {
    const rel = relationship({ userId: "user-1", type: "TEACHER" });
    expect(roleFromRelationship(rel, true, makeUser())).toBe("director");
    expect(roleFromRelationship(rel, false, makeUser())).toBe("teacher");
  });

  it("내 CHILD 관계는 언제나 아이 본인이다", () => {
    // 유치원의 CHILD 관계에는 CHILD 계정만 들어갑니다(서버가 강제). 계정 종류는 예전
    // 세션에서 비어 있을 수 있어 판정에 쓰지 않고, 관계 행의 주인만 봅니다.
    const rel = relationship({ userId: "user-1", type: "CHILD" });
    expect(roleFromRelationship(rel, false, makeUser({ accountType: "child" }))).toBe("child");
    expect(roleFromRelationship(rel, false, makeUser({ accountType: undefined }))).toBe("child");
  });

  it("내 것이 아닌 관계 행은 아이를 통해 닿은 것이므로 학부모다", () => {
    // 학부모는 유치원의 멤버가 아니라서 자기 행이 없습니다. 서버가 T_FAMILY를 타고
    // 아이의 행을 대신 내려주므로, userId가 나와 다르면 그게 곧 학부모라는 뜻입니다.
    const rel = relationship({ userId: "child-9", type: "CHILD" });
    expect(roleFromRelationship(rel, false, makeUser({ accountType: "adult" }))).toBe("parent");
  });

  it("같은 계정이라도 유치원마다 역할이 다를 수 있다", () => {
    const user = makeUser();
    expect(roleFromRelationship(relationship({ userId: "user-1", type: "TEACHER" }), true, user)).toBe("director");
    // 다른 유치원에는 아이를 보낸 학부모일 수 있습니다.
    expect(roleFromRelationship(relationship({ userId: "child-9", type: "CHILD" }), false, user)).toBe("parent");
  });
});

describe("avatarFor", () => {
  it("같은 아이디는 언제나 같은 아바타를 준다", () => {
    expect(avatarFor("child-1")).toEqual(avatarFor("child-1"));
  });

  it("아이디가 다르면 대체로 다른 아바타가 나온다", () => {
    const emojis = new Set(["a", "b", "c", "d", "e"].map((id) => avatarFor(id).avatarEmoji));
    expect(emojis.size).toBeGreaterThan(1);
  });
});

describe("emptyDashboardData", () => {
  it("서버 응답 전에도 화면이 기대는 모든 칸을 채워 둔다", () => {
    const data = emptyDashboardData(makeUser(), KINDERGARTEN, "director");

    expect(data.role).toBe("director");
    expect(data.kindergarten).toEqual(KINDERGARTEN);
    expect(data.classes).toEqual([]);
    expect(data.classChildren).toEqual([]);
    expect(data.teacher.id).toBe("user-1");
    expect(data.homeWidgets).toEqual(["classes", "members"]);
  });
});

describe("buildMemberSnapshot", () => {
  const relationships: RelationshipDTO[] = [
    relationship({ userId: "teacher-1", userName: "박선생", type: "TEACHER", classId: 1, roleIds: [10, 11] }),
    relationship({ userId: "teacher-2", userName: "이선생", type: "TEACHER", classId: 2 }),
    relationship({ userId: "child-1", userName: "김하늘", nickname: "하늘이", type: "CHILD", classId: 1 }),
    relationship({ userId: "child-2", userName: "이서준", type: "CHILD", classId: 2 }),
    relationship({ userId: "child-3", userName: "박지우", type: "CHILD" }),
  ];
  const families: FamilyDTO[] = [{ parent: "user-1", child: "child-2" }];

  it("교사와 아이를 관계 타입으로 갈라 놓는다", () => {
    const snap = buildMemberSnapshot(makeUser(), "director", KINDERGARTEN, CLASSES, relationships, []);

    expect(snap.teachers.map((t) => t.id)).toEqual(["teacher-1", "teacher-2"]);
    expect(snap.classChildren.map((c) => c.id)).toEqual(["child-1", "child-2", "child-3"]);
  });

  it("서버가 준 이름과 별칭, 반 이름을 그대로 쓴다", () => {
    const snap = buildMemberSnapshot(makeUser(), "director", KINDERGARTEN, CLASSES, relationships, []);

    const hanul = snap.classChildren.find((c) => c.id === "child-1")!;
    expect(hanul.name).toBe("김하늘");
    expect(hanul.nickname).toBe("하늘이");
    expect(hanul.className).toBe("해바라기반");

    // 별칭이 없으면 실명을 그대로 부릅니다.
    expect(snap.classChildren.find((c) => c.id === "child-2")!.nickname).toBe("이서준");
  });

  it("반이 배정되지 않은 아이도 목록에 남는다", () => {
    const snap = buildMemberSnapshot(makeUser(), "director", KINDERGARTEN, CLASSES, relationships, []);
    const jiwoo = snap.classChildren.find((c) => c.id === "child-3")!;

    expect(jiwoo.classId).toBe(0); // 어떤 반 id와도 일치하지 않는 값
    expect(jiwoo.className).toBe("반 미배정");
  });

  it("여러 역할을 가진 교사의 역할을 모두 가져온다", () => {
    const snap = buildMemberSnapshot(makeUser(), "director", KINDERGARTEN, CLASSES, relationships, []);
    expect(snap.teachers.find((t) => t.id === "teacher-1")!.roleIds).toEqual([10, 11]);
  });

  it("학부모 화면에서는 가족 관계로 '내 아이'를 찾는다", () => {
    const user = makeUser({ role: "parent", teacherRole: undefined });
    const snap = buildMemberSnapshot(user, "parent", KINDERGARTEN, CLASSES, relationships, families);

    expect(snap.myChild?.id).toBe("child-2");
    expect(snap.myChildren?.map((c) => c.id)).toEqual(["child-2"]);
    expect(snap.me).toBeUndefined();
    // 담임은 그 아이가 속한 반의 교사입니다.
    expect(snap.teacher.id).toBe("teacher-2");
  });

  it("아이가 여럿인 학부모는 전부 잡고, myChild는 그 첫 번째다", () => {
    const user = makeUser({ role: "parent", teacherRole: undefined });
    const twoChildren: FamilyDTO[] = [
      { parent: "user-1", child: "child-2" },
      { parent: "user-1", child: "child-3" },
    ];
    const snap = buildMemberSnapshot(user, "parent", KINDERGARTEN, CLASSES, relationships, twoChildren);

    // 둘째까지 잡혀야 리포트·알림장이 두 아이 모두에 대해 로드됩니다.
    expect(snap.myChildren?.map((c) => c.id)).toEqual(["child-2", "child-3"]);
    expect(snap.myChild?.id).toBe("child-2");
  });

  it("남의 가족 관계는 '내 아이'로 세지 않는다", () => {
    const user = makeUser({ role: "parent", teacherRole: undefined });
    const someoneElses: FamilyDTO[] = [{ parent: "other-parent", child: "child-1" }];
    const snap = buildMemberSnapshot(user, "parent", KINDERGARTEN, CLASSES, relationships, someoneElses);

    expect(snap.myChildren).toEqual([]);
    expect(snap.myChild).toBeUndefined();
  });

  it("내가 보호자인 아이에는 나를 보호자로 달아 둔다", () => {
    // `family/list`는 내 가족 행만 돌려주므로 여기서 알 수 있는 보호자는 나뿐입니다.
    // 나머지 보호자는 `user/family/parents`를 받아 applyGuardians가 덧씌웁니다.
    const user = makeUser({ role: "parent", teacherRole: undefined });
    const snap = buildMemberSnapshot(user, "parent", KINDERGARTEN, CLASSES, relationships, families);

    expect(snap.myChild?.parents).toEqual([{ id: "user-1", name: "김데모" }]);
    // 남의 아이는 보호자를 알 길이 없으니 비어 있고, 화면은 그 빈 값을 그릴 수 있어야 합니다.
    expect(snap.classChildren.find((c) => c.id === "child-1")!.parents).toEqual([]);
  });

  it("아이 화면에서는 본인이 '나'가 된다", () => {
    const user = makeUser({ id: "child-1", accountType: "child" });
    const snap = buildMemberSnapshot(user, "child", KINDERGARTEN, CLASSES, relationships, []);

    expect(snap.me?.id).toBe("child-1");
    expect(snap.myChild).toBeUndefined();
    expect(snap.teacher.id).toBe("teacher-1");
  });

  it("교사 화면에서는 본인 멤버십이 교사 자리에 앉고 담당 반만 따로 추려진다", () => {
    const user = makeUser({ id: "teacher-1", teacherRole: "teacher" });
    const snap = buildMemberSnapshot(user, "teacher", KINDERGARTEN, CLASSES, relationships, []);

    expect(snap.teacher.id).toBe("teacher-1");
    expect(snap.teacher.className).toBe("해바라기반");
    expect(snap.myClassChildren?.map((c) => c.id)).toEqual(["child-1"]);
  });

  it("소속 멤버가 아무도 없어도 교사 자리는 비지 않는다", () => {
    const snap = buildMemberSnapshot(makeUser(), "director", KINDERGARTEN, CLASSES, [], []);

    expect(snap.teacher.id).toBe("user-1");
    expect(snap.teacher.name).toBe("김데모"); // 별칭이 없으면 실명입니다.
    expect(snap.teacher.className).toBe("유치원 소속");
    expect(snap.classChildren).toEqual([]);
  });

  it("이 유치원에서 내가 쓰는 별칭을 내 관계에서 찾아 낸다", () => {
    const user = makeUser({ id: "teacher-1", teacherRole: "teacher" });
    const withNickname = [
      relationship({ userId: "teacher-1", userName: "박선생", nickname: "해바라기쌤", type: "TEACHER", classId: 1 }),
    ];

    expect(buildMemberSnapshot(user, "teacher", KINDERGARTEN, CLASSES, withNickname, []).myNickname).toBe("해바라기쌤");
    // 별칭은 유치원마다 다릅니다. 이 유치원에서 정해 두지 않았으면 없는 것으로 봅니다.
    expect(buildMemberSnapshot(user, "teacher", KINDERGARTEN, CLASSES, relationships, []).myNickname).toBeUndefined();
  });
});
