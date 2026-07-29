import type { ComponentType } from "react";

/**
 * 로그인 대시보드(디스코드형 레이아웃) 전용 도메인 타입입니다.
 * 백엔드가 붙기 전까지는 `mockData.ts`의 목업 데이터가 이 타입들을 채웁니다.
 */

/** 대시보드 좌측 구조/기능목록을 결정하는 계정 종류입니다. AuthUser.role/accountType으로부터 파생됩니다. */
export type DashboardRole = "child" | "parent" | "teacher";

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

export type FeatureId =
  | "partner-select"
  | "ai-text-chat"
  | "ai-voice-chat"
  | "diary"
  | "reports"
  | "students"
  | "teacher-chat"
  | "parent-chat";

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
}
