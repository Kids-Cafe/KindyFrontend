import type { AuthUser } from "@/app/auth/types";
import { getDisplayName } from "@/app/auth/getDisplayName";
import type { FamilyDTO, RelationshipDTO } from "@/app/lib/dto";
import type {
  ChildRecord,
  ChildReports,
  ClassRecord,
  DashboardData,
  KindergartenRecord,
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
  if (relationship.type === "CHILD") {
    // 유치원과 CHILD로 이어진 쪽이 아이 본인인지, 아이를 등록한 학부모인지 구분합니다.
    return user.accountType === "child" ? "child" : "parent";
  }
  return isOwner ? "director" : "teacher";
}

/** 서버 응답이 도착하기 전에 화면이 기대는 빈 껍데기입니다. */
export function emptyDashboardData(
  user: AuthUser,
  kindergarten: KindergartenRecord,
  role: DashboardData["role"],
): DashboardData {
  const displayName = getDisplayName(user);

  const teacher: TeacherRecord = {
    id: user.id,
    name: displayName,
    className: "유치원 소속",
    kindergartenId: kindergarten.id,
    kindergartenName: kindergarten.name,
    roleIds: [],
  };

  return {
    role,
    kindergarten,
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
  parentByChildId: Map<string, string>,
  teachers: TeacherRecord[],
): ChildRecord {
  const className = classes.find((c) => c.id === relationship.classId)?.name ?? "반 미배정";
  const parentId = parentByChildId.get(relationship.userId);
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
    parentId,
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
  me?: ChildRecord;
  myChild?: ChildRecord;
  myClassChildren?: ChildRecord[];
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
): MemberSnapshot {
  const teachers = toTeacherRecords(relationships, classes, kindergarten);

  const parentByChildId = new Map(families.map((f) => [f.child, f.parent]));
  const childIdsOfUser = new Set(families.filter((f) => f.parent === user.id).map((f) => f.child));

  const classChildren = relationships
    .filter((r) => r.type === "CHILD")
    .map((r) => toChildRecord(r, classes, kindergarten, parentByChildId, teachers));

  // 부모 이름은 교사 명단이나 가족 관계에서 알 수 있는 만큼만 채웁니다.
  const nameByUserId = new Map(relationships.map((r) => [r.userId, r.userName ?? r.userId]));
  for (const child of classChildren) {
    if (child.parentId) child.parentName = nameByUserId.get(child.parentId) ?? undefined;
    if (child.parentId === user.id) child.parentName = getDisplayName(user);
  }

  const me = role === "child" ? classChildren.find((c) => c.id === user.id) : undefined;
  const myChild = role === "parent" ? classChildren.find((c) => childIdsOfUser.has(c.id)) : undefined;

  // 로그인한 본인이 교사/원장이면 자기 멤버십이 곧 "교사 자리"입니다.
  // 학부모·아이 화면에서는 우리 반 담임이 그 자리에 앉습니다.
  const ownMembership = teachers.find((t) => t.id === user.id);
  const viewerClassId = me?.classId ?? myChild?.classId;
  const classTeacher = viewerClassId !== undefined ? teachers.find((t) => t.classId === viewerClassId) : undefined;

  const teacher: TeacherRecord =
    ownMembership ??
    classTeacher ?? {
      id: user.id,
      name: getDisplayName(user),
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
    me,
    myChild,
    myClassChildren:
      role === "teacher" && teacher.classId !== undefined
        ? classChildren.filter((c) => c.classId === teacher.classId)
        : undefined,
  };
}
