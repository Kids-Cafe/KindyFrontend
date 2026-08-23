import type { ComponentType } from "react";

/**
 * 로그인 대시보드(디스코드형 레이아웃) 전용 도메인 타입입니다.
 * 백엔드가 붙기 전까지는 `mockData.ts`의 목업 데이터가 이 타입들을 채웁니다.
 */

/** 대시보드 좌측 구조/기능목록을 결정하는 계정 종류입니다. AuthUser.role/accountType/teacherRole로부터 파생됩니다. */
export type DashboardRole = "child" | "parent" | "teacher" | "director";

/** 아이가 선택하는 AI 파트너입니다. */
export type AIPartnerId = "kio" | "kina";

export interface KindergartenRecord {
  id: number;
  name: string;
}

export interface ClassRecord {
  id: number;
  name: string;
  kindergartenId: number;
}

/**
 * 디스코드의 "역할(role)"과 동일한 개념의 권한 플래그입니다. 원장이 교사 계정에 배정합니다.
 * 백엔드 `RoleDTO.Permission`과 1:1로 대응합니다(`@/app/lib/permissions`).
 */
export type PermissionKey =
  | "manageNotices"
  | "manageClasses"
  | "manageMembers"
  | "manageSchedule"
  | "manageSupplies"
  | "managePhotos";

export const PERMISSION_LABELS: Record<PermissionKey, string> = {
  manageNotices: "공지사항 관리",
  manageClasses: "반 관리 (반 편성 포함)",
  manageMembers: "멤버 및 권한 관리",
  manageSchedule: "일정 관리 (전체 반)",
  manageSupplies: "준비물 작성",
  managePhotos: "사진첩 관리 (전체 반)",
};

/** 원장이 만들고 교사 계정에 배정하는 권한 묶음입니다. */
export interface RoleDef {
  id: number;
  name: string;
  color: string;
  permissions: PermissionKey[];
}

/**
 * 아이 한 명의 보호자입니다. `user/family/parents`가 내려주는 값 그대로입니다.
 *
 * 보호자는 유치원의 멤버가 아니라 `T_FAMILY`를 타고 붙는 사람이라, 관계 목록에는
 * 이름이 없습니다. 전화번호는 서버가 교사에게만 열어 주는 연락처입니다(없을 수 있습니다).
 */
export interface ParentRef {
  id: string;
  name: string;
  phone?: string;
}

/**
 * 유치원에 등록된 아이 한 명입니다. 서버의 `RelationshipDTO`(type=CHILD)에서 만들어집니다.
 *
 * 관계 응답에 없는 값은 선택 필드입니다 — 나이·성별은 아이 계정의 프로필에만 있고
 * (`user/info`는 본인 것만 내려줍니다), 보호자는 `user/family/parents`로 따로 이어 붙입니다.
 * 아바타는 표시용이라 서버에 저장하지 않고 아이디에서 결정적으로 만들어 씁니다.
 */
export interface ChildRecord {
  id: string;
  /** 실명 */
  name: string;
  /** 별명/애칭 (아이·부모·선생님 화면에 실제로 표시되는 이름) */
  nickname: string;
  age?: number;
  gender?: "male" | "female";
  classId: number;
  className: string;
  kindergartenId: number;
  kindergartenName: string;
  /**
   * 이 아이의 보호자 전부입니다. `T_FAMILY`는 처음부터 다대다라 한 명으로 단정할 수 없습니다 —
   * 예전에는 단수 `parentId`/`parentName`이라 아빠·엄마 중 한쪽이 조용히 사라졌습니다.
   * 아직 못 받아 왔거나 연결된 보호자가 없으면 빈 배열입니다.
   */
  parents: ParentRef[];
  teacherId?: string;
  aiPartner: AIPartnerId | null;
  avatarEmoji: string;
  avatarColor: string;
}

export interface TeacherRecord {
  id: string;
  name: string;
  /** 원장이 멤버 프로필 패널에서 지어줄 수 있는 별칭입니다. 없으면 실명(name)이 그대로 표시됩니다. */
  nickname?: string;
  classId?: number;
  className: string;
  kindergartenId: number;
  kindergartenName: string;
  /** 원장이 배정한 권한 역할 목록입니다(디스코드식). 원장 본인은 별도 표기 없이 전권을 가집니다. */
  roleIds: number[];
}

export type MoodTag = "happy" | "excited" | "calm" | "sad" | "upset";

export interface DiaryEntry {
  id: number;
  childId: string;
  /** YYYY-MM-DD. 사용자당 날짜 하나가 곧 일기 하나입니다(서버의 사실상 기본키). */
  date: string;
  mood: MoodTag;
  title: string;
  /** 카드에 보여주는 AI 요약입니다. */
  summary: string;
  /** 일기 본문 전체입니다. 요약만 있는 예전 글에는 없습니다. */
  text?: string;
  tags: string[];
}

export interface FoodReportData {
  weekly: { day: string; vegetable: number; protein: number; carbs: number; dairy: number }[];
  balanceNote: string;
  favorite: string[];
  caution: string[];
}

export interface HealthReportData {
  timeline: { date: string; status: "good" | "mild" | "bad"; note: string }[];
  heightCm: number;
  weightKg: number;
  note: string;
}

export interface FriendshipEntry {
  name: string;
  strength: number;
  note: string;
}

export interface FriendshipReportData {
  sociabilityScore: number;
  closest: FriendshipEntry[];
  groupNote: string;
}

export interface PersonalityReportData {
  traits: { trait: string; value: number }[];
  mbtiLike: string;
  summary: string;
}

export interface LearningReportData {
  subjects: { subject: string; progress: number }[];
  recentTopic: string;
  interestNote: string;
}

export interface ChildReports {
  food: FoodReportData;
  health: HealthReportData;
  friendship: FriendshipReportData;
  personality: PersonalityReportData;
  learning: LearningReportData;
}

export type ReportCategory = keyof ChildReports;

export type ChatSender = "child" | "parent" | "teacher" | "ai" | "director";

export type DataCardType = ReportCategory;

export interface ChatMessage {
  id: number;
  sender: ChatSender;
  senderName: string;
  kind: "text" | "data-card";
  text?: string;
  cardType?: DataCardType;
  /** epoch ms */
  time: number;
}

/**
 * 부모 ↔ 선생님 채팅 스레드입니다. **아이 1명당이 아니라 보호자 1명당 1개**입니다 —
 * 서버 대화는 두 사람 사이의 것이라, 보호자가 둘이면 담임과의 대화도 둘입니다.
 */
export interface ChatThread {
  id: number;
  childId: string;
  childNickname: string;
  parentId: string;
  parentName: string;
  teacherId: string;
  teacherName: string;
  messages: ChatMessage[];
}

/** 아이 ↔ AI 파트너 채팅입니다. 아이 1명당 1개입니다. */
export interface AiChatThread {
  childId: string;
  /**
   * 서버 대화의 id입니다. 아직 한 번도 말을 걸지 않았으면 없습니다.
   * 아이 ↔ AI 대화는 `host === client === childId`인 자기대화라, 이 id 하나만 있으면
   * `selfChat()`으로 `ChatDTO`를 복원할 수 있습니다.
   */
  chatId?: number;
  messages: ChatMessage[];
}

/** 원장 ↔ 교사 1:1 대화입니다(멤버 프로필 패널의 "메시지 보내기"). 교사 1명당 1개입니다. */
export interface MemberChatThread {
  id: number;
  teacherId: string;
  teacherName: string;
  directorName: string;
  messages: ChatMessage[];
}

/** 유치원 공지사항입니다. 원장만 작성/수정/고정/삭제할 수 있고, 나머지 역할은 읽기 전용입니다. */
export interface NoticeRecord {
  id: number;
  /** 서버가 공지 수정(`notice/edit`)에 요구하는 유치원별 일련번호입니다. 서버에서 온 공지가 아니면 없습니다. */
  num?: number;
  kindergartenId: number;
  title: string;
  body: string;
  authorName: string;
  /** epoch ms */
  createdAt: number;
  pinned: boolean;
  /** 켜져 있으면 전 계정 대시보드 상단 배너로 노출됩니다. 서버에 아직 저장되는 필드가 아니라 새로고침하면 초기화됩니다. */
  bannerEnabled: boolean;
}

export interface SupplyComment {
  id: number;
  authorName: string;
  authorRole: DashboardRole;
  text: string;
  /** epoch ms */
  createdAt: number;
}

/** 반별 준비물 안내입니다. 선생님/원장이 작성하고 같은 반 학부모 전원이 열람·댓글 가능합니다. */
export interface SupplyItem {
  id: number;
  classId: number;
  title: string;
  body: string;
  authorName: string;
  /** epoch ms */
  createdAt: number;
  dueDate?: string;
  comments: SupplyComment[];
}

/** 선생님/원장이 등록하는 일정입니다. classId가 없으면 유치원 전체 대상입니다. */
export interface ScheduleEvent {
  id: number;
  kindergartenId: number;
  classId?: number;
  title: string;
  /** YYYY-MM-DD */
  date: string;
  time?: string;
  createdBy: string;
  /** epoch ms */
  createdAt: number;
}

/** 사진 카드를 감싸는 장식 테마입니다. 업로더가 사진별로 지정합니다. */
export type PhotoThemeId = "clip" | "polaroid" | "frame-wood" | "frame-gold";

/**
 * 사진첩 한 장입니다.
 *
 * `url`과 `thumbUrl`은 파일 주소가 아니라 이 서버의 조회 경로입니다. 사진 자체는 비공개
 * 저장소에 있고, 요청이 올 때마다 서버가 "이 사람이 이 반을 볼 수 있는가"를 다시 확인한 뒤
 * 내려줍니다. 그래서 사진을 지우면 곧바로 안 보이고, 링크를 남에게 넘겨도 소용이 없습니다.
 *
 * 목록(그리드)에서는 `thumbUrl`을, 전체화면 뷰어에서는 `url`을 씁니다. 그리드에 원본을 쓰면
 * 150px짜리 칸을 그리려고 8MB 파일을 스무 장씩 받아오게 됩니다.
 */
export interface PhotoRecord {
  id: number;
  classId: number;
  url: string;
  /** 그리드용 축소본. 축소본이 없는 형식이면 서버가 원본을 돌려주므로 항상 값이 있습니다. */
  thumbUrl: string;
  caption?: string;
  uploadedBy: string;
  theme: PhotoThemeId;
  /** epoch ms */
  takenAt: number;
}

/** 선생님이 남긴 글에 부모(또는 선생님 본인)가 다는 답글입니다. */
export interface ParentNoteComment {
  id: number;
  authorName: string;
  authorRole: DashboardRole;
  text: string;
  /** epoch ms */
  createdAt: number;
}

/** 선생님이 특정 아이에 대해 남기는, 그 아이의 부모만 볼 수 있는 게시글/의견입니다. */
export interface ParentNote {
  id: number;
  childId: string;
  authorName: string;
  text: string;
  /** epoch ms */
  createdAt: number;
  comments: ParentNoteComment[];
}

export type FeatureId =
  | "partner-select"
  | "ai-text-chat"
  | "diary"
  | "reports"
  | "students"
  | "teacher-chat"
  | "parent-chat"
  | "home"
  | "notices"
  | "classes"
  | "members"
  | "supplies"
  | "schedule"
  | "photos"
  | "recommendations";

export interface FeatureDef {
  id: FeatureId;
  label: string;
  hint: string;
  icon: ComponentType<{ className?: string; style?: React.CSSProperties }>;
}

export interface DashboardData {
  role: DashboardRole;
  kindergarten: KindergartenRecord;
  /**
   * 이 유치원에서 로그인한 사람이 쓰는 별칭입니다(T_RELATIONSHIP.NICKNAME).
   * 정하지 않았으면 비어 있고, 그때는 실명으로 불립니다.
   */
  myNickname?: string;
  /** 로그인한 사람 본인이 "아이"일 때만 채워집니다. */
  me?: ChildRecord;
  /** 로그인한 사람이 "부모"일 때, 화면이 기준으로 삼는 아이입니다. `selectedChildId`가 정합니다. */
  myChild?: ChildRecord;
  /** 이 유치원에 다니는 내 아이 전부입니다. 리포트·알림장은 이 목록 전체를 받아옵니다. */
  myChildren?: ChildRecord[];
  /** 아이가 둘 이상인 학부모가 지금 고른 아이입니다. 고르지 않았으면 `myChildren[0]`을 봅니다. */
  selectedChildId?: string;
  /** 로그인한 사람이 "선생님"일 때 담당 학급입니다. */
  myClassChildren?: ChildRecord[];
  teacher: TeacherRecord;
  /**
   * 지금 보고 있는 아이의 담임입니다. 아직 담임이 없으면 undefined입니다.
   * `teacher`는 아무 자리도 없을 때 본인으로 되돌아가므로 담임 표시에 쓰면 안 됩니다.
   */
  homeroomTeacher?: TeacherRecord;
  /** 학급 전체 아이 목록 (선생님 시점의 멤버 목록에 사용) */
  classChildren: ChildRecord[];
  diaryByChild: Record<string, DiaryEntry[]>;
  reportsByChild: Record<string, ChildReports>;
  /** 아이 id → 그 아이의 보호자들과 담임 사이의 대화입니다. 보호자 수만큼 들어 있습니다. */
  threadsByChild: Record<string, ChatThread[]>;
  aiThreadsByChild: Record<string, AiChatThread>;
  /** 원장 ↔ 교사 대화 스레드입니다. 교사 id로 조회합니다. */
  memberThreadsByTeacher: Record<string, MemberChatThread>;

  /** 유치원 내 반 목록입니다(원장이 관리). */
  classes: ClassRecord[];
  /** 원장이 정의한 권한 역할 목록입니다. */
  roles: RoleDef[];
  /** 유치원 내 전체 교사 계정 목록입니다(원장 시점 멤버 관리에 사용). */
  teachers: TeacherRecord[];
  notices: NoticeRecord[];
  suppliesByClass: Record<string, SupplyItem[]>;
  scheduleEvents: ScheduleEvent[];
  photos: PhotoRecord[];
  parentNotesByChild: Record<string, ParentNote[]>;
  /** 메인페이지(홈)에 계정별로 추가해 둔 기능 위젯 목록입니다. */
  homeWidgets: FeatureId[];
}
