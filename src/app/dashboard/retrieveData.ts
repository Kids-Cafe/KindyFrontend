import type { AuthUser } from "@/app/auth/types";
import type { FamilyDTO, RelationshipDTO } from "@/app/lib/dto";
import type {
  ChildRecord,
  ChildReports,
  ClassRecord,
  DashboardData,
  KindergartenRecord,
  ParentRef,
  TeacherRecord,
} from "@/app/dashboard/types";
import { toTeacherRecords } from "@/app/dashboard/backendSync";

/**
 * 대시보드 데이터의 뼈대를 만듭니다.
 *
 * 화면은 서버 응답이 도착하기 전에도 한 번 렌더되므로, 먼저 비어 있는 `DashboardData`를
 * 동기적으로 만들어 두고(`emptyDashboardData`) 응답이 오면 `applyMembers` 등으로 채웁니다.
 * 목업 명단은 더 이상 쓰지 않습니다 — 반·교사·아이 모두 서버 관계(RelationshipDTO)가 원본입니다.
 */

/** 아바타는 서버에 저장되는 값이 아니라, 아이디에서 항상 같은 값이 나오도록 만들어 씁니다. */
const AVATAR_EMOJIS = ["🌻", "🚀", "🦖", "🎨", "🌼", "⚽", "🐰", "🦁", "🌹", "🐯", "🦋", "🌈", "🦄", "🐳", "⭐", "🌙", "✨", "🐥"];
const AVATAR_COLORS = ["#F472B6", "#60A5FA", "#86EFAC", "#C084FC", "#F9D56E", "#FDBA74", "#F87171", "#FB923C", "#A78BFA"];

function hashOf(id: string): number {
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = (hash * 31 + id.charCodeAt(i)) % 100000;
  return hash;
}

export function avatarFor(id: string): { avatarEmoji: string; avatarColor: string } {
  const hash = hashOf(id);
  return {
    avatarEmoji: AVATAR_EMOJIS[hash % AVATAR_EMOJIS.length],
    avatarColor: AVATAR_COLORS[hash % AVATAR_COLORS.length],
  };
}

/** 생년월일에서 만 나이를 셉니다. 서버는 나이를 내려주지 않고 BIRTH_DATE만 갖고 있습니다. */
export function ageFromBirthDate(birthDate?: string): number | undefined {
  if (!birthDate) return undefined;
  const born = new Date(birthDate);
  if (Number.isNaN(born.getTime())) return undefined;
  const now = new Date();
  let age = now.getFullYear() - born.getFullYear();
  const beforeBirthday =
    now.getMonth() < born.getMonth() ||
    (now.getMonth() === born.getMonth() && now.getDate() < born.getDate());
  if (beforeBirthday) age -= 1;
  return age >= 0 ? age : undefined;
}

/** 아직 아무 카테고리도 저장되지 않은 아이의 리포트입니다. 화면이 빈 상태를 그릴 수 있게 뼈대를 채웁니다. */
export function emptyChildReports(): ChildReports {
  return {
    food: { weekly: [], balanceNote: "", favorite: [], caution: [] },
    health: { timeline: [], heightCm: 0, weightKg: 0, note: "" },
    friendship: { sociabilityScore: 0, closest: [], groupNote: "" },
    personality: { traits: [], mbtiLike: "", summary: "" },
    learning: { subjects: [], recentTopic: "", interestNote: "" },
  };
}

/** 계정 정보(AuthUser)에서 대시보드 역할을 끌어냅니다. */
export function resolveDashboardRole(user: AuthUser): DashboardData["role"] {
  if (user.accountType === "child") return "child";
  if (user.role !== "teacher") return "parent";
  return user.teacherRole === "director" ? "director" : "teacher";
}

/**
 * 서버 관계에서 이 사람이 해당 유치원에서 갖는 대시보드 역할을 정합니다.
 * 계정 전체의 역할(`resolveDashboardRole`)과 달리, 유치원마다 다를 수 있습니다 —
 * 자기 유치원에서는 원장이면서 다른 유치원에는 학부모로 등록돼 있을 수 있습니다.
 */
export function roleFromRelationship(relationship: RelationshipDTO, isOwner: boolean, user: AuthUser): DashboardData["role"] {
  // 학부모는 유치원의 멤버가 아닙니다. 서버가 T_FAMILY를 타고 "우리 아이가 다니는 유치원"을
  // 함께 내려주기 때문에, 내 것이 아닌 관계 행이 곧 학부모라는 뜻입니다.
  // 계정 유형(accountType)으로 판정하지 않는 이유는 그 값이 예전 세션에는 없어서
  // undefined일 때 성인으로 취급돼(auth/accountType.ts) 아이가 학부모로 보이기 때문입니다.
  if (relationship.userId !== user.id) return "parent";
  if (relationship.type === "CHILD") return "child";
  return isOwner ? "director" : "teacher";
}

/** 서버 응답이 도착하기 전에 화면이 기대는 빈 껍데기입니다. */
export function emptyDashboardData(
  user: AuthUser,
  kindergarten: KindergartenRecord,
  role: DashboardData["role"],
  /** 이 유치원에서의 별칭입니다. 멤버 목록이 오기 전에도 제 이름으로 불리게 합니다. */
  myNickname?: string,
): DashboardData {
  const teacher: TeacherRecord = {
    id: user.id,
    name: myNickname?.trim() || user.name,
    className: "유치원 소속",
    kindergartenId: kindergarten.id,
    kindergartenName: kindergarten.name,
    roleIds: [],
  };

  return {
    role,
    kindergarten,
    myNickname: myNickname?.trim() || undefined,
    teacher,
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
    homeWidgets: defaultHomeWidgets(role),
  };
}

export function defaultHomeWidgets(role: DashboardData["role"]): DashboardData["homeWidgets"] {
  switch (role) {
    case "teacher":
      return ["reports", "teacher-chat"];
    case "parent":
      return ["schedule", "photos"];
    case "director":
      return ["classes", "members"];
    default:
      return [];
  }
}

function toChildRecord(
  relationship: RelationshipDTO,
  classes: ClassRecord[],
  kindergarten: KindergartenRecord,
  parentsByChildId: Map<string, ParentRef[]>,
  teachers: TeacherRecord[],
): ChildRecord {
  const className = classes.find((c) => c.id === relationship.classId)?.name ?? "반 미배정";
  return {
    id: relationship.userId,
    name: relationship.userName ?? relationship.userId,
    // 별칭을 지어 주지 않았으면 실명을 그대로 부릅니다.
    nickname: relationship.nickname || relationship.userName || relationship.userId,
    // classId가 없는 아이는 아직 반 배정 전입니다. 0은 어떤 반과도 일치하지 않습니다.
    classId: relationship.classId ?? 0,
    className,
    kindergartenId: kindergarten.id,
    kindergartenName: kindergarten.name,
    parents: parentsByChildId.get(relationship.userId) ?? [],
    teacherId: teachers.find((t) => t.classId === relationship.classId)?.id,
    // AI 파트너 선택은 서버에 저장되는 값이 아닙니다(백엔드에 칼럼 없음).
    aiPartner: null,
    ...avatarFor(relationship.userId),
  };
}

export interface MemberSnapshot {
  classes: ClassRecord[];
  teachers: TeacherRecord[];
  classChildren: ChildRecord[];
  /** 로그인한 사람이 이 유치원에서 앉는 "교사 자리"입니다. */
  teacher: TeacherRecord;
  /**
   * 지금 보고 있는 아이의 담임입니다. 담임이 정해지지 않았으면 undefined입니다.
   * `teacher`와 달리 **본인으로 되돌아가지 않습니다** — 학부모 화면이 `teacher`를 쓰면
   * 담임이 없을 때 자기 자신이 "담임 선생님"으로 표시됩니다.
   */
  homeroomTeacher?: TeacherRecord;
  me?: ChildRecord;
  /** 화면이 기준으로 삼는 아이입니다. 여럿이면 `myChildren[0]`과 같습니다. */
  myChild?: ChildRecord;
  /** 이 유치원에 다니는, 로그인한 사람의 아이 전부입니다. */
  myChildren?: ChildRecord[];
  myClassChildren?: ChildRecord[];
  /** 이 유치원에서 로그인한 사람이 쓰는 별칭입니다. 정하지 않았으면 undefined입니다. */
  myNickname?: string;
}

/**
 * 서버에서 받은 반 목록·관계 목록·가족 관계를 대시보드가 쓰는 모양으로 옮깁니다.
 * `DashboardData` 중 "사람"에 해당하는 부분 전체가 여기서 결정됩니다.
 */
export function buildMemberSnapshot(
  user: AuthUser,
  role: DashboardData["role"],
  kindergarten: KindergartenRecord,
  classes: ClassRecord[],
  relationships: RelationshipDTO[],
  families: FamilyDTO[],
  /** 학부모가 아이 여럿을 뒀을 때 지금 보고 있는 아이입니다. 없으면 첫째를 봅니다. */
  selectedChildId?: string,
): MemberSnapshot {
  const teachers = toTeacherRecords(relationships, classes, kindergarten);

  // 별칭은 유치원마다 다릅니다. 이 유치원에서 내가 어떻게 불리는지는 내 관계 행에만 있습니다.
  const myNickname = relationships.find((r) => r.userId === user.id)?.nickname?.trim() || undefined;
  const myDisplayName = myNickname ?? user.name;

  // `user/family/list`는 **로그인한 사람의** 가족 행만 돌려줍니다. 그래서 여기서 알 수 있는
  // 보호자는 자기 자신뿐이고, 남의 아이의 보호자는 `user/family/parents`로 따로 받아
  // `applyGuardians`가 덧씌웁니다. 그 응답이 오기 전에도 학부모 화면이 비지 않도록
  // 아는 만큼(=나)만 먼저 채워 둡니다.
  const childIdsOfUser = new Set(families.filter((f) => f.parent === user.id).map((f) => f.child));
  const parentsByChildId = new Map<string, ParentRef[]>(
    [...childIdsOfUser].map((childId) => [childId, [{ id: user.id, name: myDisplayName }]]),
  );

  const classChildren = relationships
    .filter((r) => r.type === "CHILD")
    .map((r) => toChildRecord(r, classes, kindergarten, parentsByChildId, teachers));

  const me = role === "child" ? classChildren.find((c) => c.id === user.id) : undefined;
  // 한 부모에게 아이가 여럿일 수 있습니다. `myChild`는 화면 15곳이 읽는 단수 필드라
  // 없애지 않고, 고른 아이(없으면 첫째)를 가리키게 둡니다 — 화면들은 그대로 두고
  // 선택만 바꾸면 따라옵니다.
  const myChildren = role === "parent" ? classChildren.filter((c) => childIdsOfUser.has(c.id)) : undefined;
  const myChild = myChildren?.find((c) => c.id === selectedChildId) ?? myChildren?.[0];

  // 로그인한 본인이 교사/원장이면 자기 멤버십이 곧 "교사 자리"입니다.
  // 학부모·아이 화면에서는 우리 반 담임이 그 자리에 앉습니다.
  const ownMembership = teachers.find((t) => t.id === user.id);
  const viewerClassId = me?.classId ?? myChild?.classId;
  const homeroomTeacher = viewerClassId !== undefined ? teachers.find((t) => t.classId === viewerClassId) : undefined;

  // 마지막 갈래는 "이 사람 자신"입니다. 아직 아무 자리도 없을 때 화면이 비지 않게 하는
  // 자리채움이라 담임 표시에 쓰면 안 됩니다 — 그건 homeroomTeacher가 맡습니다.
  const teacher: TeacherRecord =
    ownMembership ??
    homeroomTeacher ?? {
      id: user.id,
      name: myDisplayName,
      className: "유치원 소속",
      kindergartenId: kindergarten.id,
      kindergartenName: kindergarten.name,
      roleIds: [],
    };

  return {
    classes,
    teachers,
    classChildren,
    teacher,
    homeroomTeacher,
    myNickname,
    me,
    myChild,
    myChildren,
    myClassChildren:
      role === "teacher" && teacher.classId !== undefined
        ? classChildren.filter((c) => c.classId === teacher.classId)
        : undefined,
  };
}
