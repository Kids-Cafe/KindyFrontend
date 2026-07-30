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
  id: string;
  name: string;
}

export interface ClassRecord {
  id: string;
  name: string;
  kindergartenId: string;
}

/** 디스코드의 "역할(role)"과 동일한 개념의 권한 플래그입니다. 원장이 교사 계정에 배정합니다. */
export type PermissionKey =
  | "manageNotices"
  | "manageClasses"
  | "manageMembers"
  | "manageSchedule"
  | "manageSupplies";

export const PERMISSION_LABELS: Record<PermissionKey, string> = {
  manageNotices: "공지사항 관리",
  manageClasses: "반 관리",
  manageMembers: "멤버 및 권한 관리",
  manageSchedule: "일정 등록",
  manageSupplies: "준비물 작성",
};

/** 원장이 만들고 교사 계정에 배정하는 권한 묶음입니다. */
export interface RoleDef {
  id: string;
  name: string;
  color: string;
  permissions: PermissionKey[];
}

export interface ChildRecord {
  id: string;
  /** 실명 */
  name: string;
  /** 별명/애칭 (아이·부모·선생님 화면에 실제로 표시되는 이름) */
  nickname: string;
  age: number;
  gender: "male" | "female";
  classId: string;
  className: string;
  kindergartenId: string;
  kindergartenName: string;
  parentId: string;
  parentName: string;
  teacherId: string;
  aiPartner: AIPartnerId | null;
  avatarEmoji: string;
  avatarColor: string;
}

export interface ParentRecord {
  id: string;
  name: string;
  childId: string;
}

export interface TeacherRecord {
  id: string;
  name: string;
  classId: string;
  className: string;
  kindergartenId: string;
  kindergartenName: string;
  /** 원장이 배정한 권한 역할 목록입니다(디스코드식). 원장 본인은 별도 표기 없이 전권을 가집니다. */
  roleIds: string[];
}

export type MoodTag = "happy" | "excited" | "calm" | "sad" | "upset";

export interface DiaryEntry {
  id: string;
  childId: string;
  /** YYYY-MM-DD */
  date: string;
  mood: MoodTag;
  title: string;
  /** AI 파트너와의 대화를 바탕으로 생성된 일기 본문입니다. */
  summary: string;
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

export type ChatSender = "child" | "parent" | "teacher" | "ai";

export type DataCardType = ReportCategory;

export interface ChatMessage {
  id: string;
  sender: ChatSender;
  senderName: string;
  kind: "text" | "data-card";
  text?: string;
  cardType?: DataCardType;
  /** epoch ms */
  time: number;
}

/** 부모 ↔ 선생님 채팅 스레드입니다. 아이 1명당 1개입니다. */
export interface ChatThread {
  id: string;
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
  messages: ChatMessage[];
}

/** 유치원 공지사항입니다. 원장만 작성/수정/고정/삭제할 수 있고, 나머지 역할은 읽기 전용입니다. */
export interface NoticeRecord {
  id: string;
  kindergartenId: string;
  title: string;
  body: string;
  authorName: string;
  /** epoch ms */
  createdAt: number;
  pinned: boolean;
}

export interface SupplyComment {
  id: string;
  authorName: string;
  authorRole: DashboardRole;
  text: string;
  /** epoch ms */
  createdAt: number;
}

/** 반별 준비물 안내입니다. 선생님/원장이 작성하고 같은 반 학부모 전원이 열람·댓글 가능합니다. */
export interface SupplyItem {
  id: string;
  classId: string;
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
  id: string;
  kindergartenId: string;
  classId?: string;
  title: string;
  /** YYYY-MM-DD */
  date: string;
  time?: string;
  createdBy: string;
  /** epoch ms */
  createdAt: number;
}

export type PhotoScope = "kindergarten";

/** 사진첩 한 장입니다. data URL 또는 object URL을 그대로 저장합니다(목업이라 서버 업로드 없음). */
export interface PhotoRecord {
  id: string;
  scope: PhotoScope;
  scopeId: string;
  url: string;
  caption?: string;
  uploadedBy: string;
  /** epoch ms */
  takenAt: number;
}

/** 선생님이 특정 아이에 대해 남기는, 그 아이의 부모만 볼 수 있는 게시글/의견입니다. */
export interface ParentNote {
  id: string;
  childId: string;
  authorName: string;
  text: string;
  /** epoch ms */
  createdAt: number;
}

export type FeatureId =
  | "partner-select"
  | "ai-text-chat"
  | "ai-voice-chat"
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
  /** 로그인한 사람 본인이 "아이"일 때만 채워집니다. */
  me?: ChildRecord;
  /** 로그인한 사람이 "부모"일 때 본인 아이입니다. */
  myChild?: ChildRecord;
  /** 로그인한 사람이 "선생님"일 때 담당 학급입니다. */
  myClassChildren?: ChildRecord[];
  teacher: TeacherRecord;
  /** 학급 전체 아이 목록 (선생님 시점의 멤버 목록에 사용) */
  classChildren: ChildRecord[];
  diaryByChild: Record<string, DiaryEntry[]>;
  reportsByChild: Record<string, ChildReports>;
  threadsByChild: Record<string, ChatThread>;
  aiThreadsByChild: Record<string, AiChatThread>;

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
