import {
  Sparkles,
  MessageCircle,
  BookOpen,
  LineChart,
  Home,
  MessagesSquare,
  Megaphone,
  School,
  ShieldCheck,
  Backpack,
  CalendarDays,
  Images,
} from "lucide-react";
import { teacherHasPermission } from "@/app/dashboard/classAccess";
import type { DashboardData, DashboardRole, FeatureDef, FeatureId, PermissionKey } from "@/app/dashboard/types";

/** 역할별 좌측 기능목록입니다. 디스코드의 "텍스트 채널 목록" 자리를 대체합니다. */
export const FEATURES_BY_ROLE: Record<DashboardRole, FeatureDef[]> = {
  child: [
    { id: "partner-select", label: "AI 파트너", hint: "키오 · 키나 고르기", icon: Sparkles },
    // 글로 쓰든 말로 하든 같은 대화창 하나입니다(마이크·스피커는 채팅 화면 안에 있습니다).
    { id: "ai-text-chat", label: "채팅", hint: "쓰거나 말하며 이야기하기", icon: MessageCircle },
    { id: "diary", label: "나의 일기장", hint: "AI가 정리해준 하루", icon: BookOpen },
    { id: "schedule", label: "일정", hint: "다가오는 일정 보기", icon: CalendarDays },
    { id: "photos", label: "사진첩", hint: "우리 유치원 사진첩", icon: Images },
  ],
  parent: [
    { id: "home", label: "홈", hint: "공지사항 · 내 위젯", icon: Home },
    { id: "diary", label: "우리 아이 일기장", hint: "매일의 이야기", icon: BookOpen },
    { id: "reports", label: "성장 리포트", hint: "식단 · 건강 · 교우 · 성격 · 학습", icon: LineChart },
    { id: "parent-chat", label: "선생님과 채팅", hint: "궁금한 점 물어보기", icon: MessagesSquare },
    { id: "supplies", label: "준비물", hint: "반 준비물 안내 · 댓글", icon: Backpack },
    { id: "schedule", label: "일정", hint: "다가오는 일정 확인", icon: CalendarDays },
    { id: "photos", label: "사진첩", hint: "우리 유치원 사진첩", icon: Images },
    { id: "recommendations", label: "AI 추천자료", hint: "성장에 도움되는 자료", icon: Sparkles },
  ],
  teacher: [
    { id: "home", label: "홈", hint: "공지사항 · 우리 반 아이들", icon: Home },
    { id: "reports", label: "학생별 리포트", hint: "성장 데이터 확인", icon: LineChart },
    { id: "teacher-chat", label: "학부모와 채팅", hint: "가정과 소통하기", icon: MessagesSquare },
    { id: "supplies", label: "준비물", hint: "우리 반 준비물 작성", icon: Backpack },
    { id: "schedule", label: "일정", hint: "일정 등록", icon: CalendarDays },
    { id: "photos", label: "사진첩", hint: "우리 유치원 사진첩", icon: Images },
  ],
  director: [
    { id: "home", label: "홈", hint: "공지사항 · 내 위젯", icon: Home },
    { id: "notices", label: "공지사항 관리", hint: "유치원 공지 작성/고정", icon: Megaphone },
    { id: "classes", label: "반 관리", hint: "반 생성 · 수정 · 삭제", icon: School },
    { id: "members", label: "멤버 관리", hint: "선생님 계정 · 권한 설정", icon: ShieldCheck },
    { id: "supplies", label: "준비물", hint: "반별 준비물 안내", icon: Backpack },
    { id: "schedule", label: "일정", hint: "유치원 일정 등록", icon: CalendarDays },
    { id: "photos", label: "사진첩", hint: "우리 유치원 사진첩", icon: Images },
  ],
};

/**
 * 권한을 받아야만 열리는 관리 기능들입니다. 원장에게는 처음부터 붙어 있고
 * (`FEATURES_BY_ROLE.director`), 선생님에게는 해당 권한이 있는 역할을 배정받았을 때만 붙습니다.
 */
const PERMISSION_FEATURES: { permission: PermissionKey; feature: FeatureDef }[] = [
  { permission: "manageNotices", feature: { id: "notices", label: "공지사항 관리", hint: "유치원 공지 작성/고정", icon: Megaphone } },
  { permission: "manageClasses", feature: { id: "classes", label: "반 관리", hint: "반 생성 · 수정 · 삭제", icon: School } },
  { permission: "manageMembers", feature: { id: "members", label: "멤버 관리", hint: "선생님 계정 · 권한 설정", icon: ShieldCheck } },
];

/**
 * **임시로** 모든 계정에서 닫아 둔 기능입니다. 역할이나 권한과 상관없이 `featuresFor`가
 * 걸러내므로 사이드바·홈 위젯 목록에 뜨지 않고 `canOpenFeature`도 false를 돌려줍니다.
 *
 * 화면 코드(`features/RecommendationsFeature.tsx`)와 역할 목록은 그대로 두었습니다 —
 * 다시 열 때 이 배열에서 id만 지우면 됩니다.
 */
const TEMPORARILY_HIDDEN: FeatureId[] = ["recommendations"];

/**
 * 이 사람이 지금 유치원에서 실제로 열 수 있는 기능 목록입니다.
 *
 * 역할별 고정 목록(`FEATURES_BY_ROLE`)만 쓰던 시절에는 원장이 MANAGE_CLASS·MANAGE_MEMBER를
 * 쥐여 준 선생님도 **사이드바에 그 항목이 아예 없어** 반이나 멤버를 만질 방법이 없었습니다.
 * 서버는 처음부터 권한으로 판정하고 있었으니, 화면만 따라가지 못한 셈입니다.
 */
export function featuresFor(data: DashboardData): FeatureDef[] {
  return visible(featuresForRole(data));
}

function visible(features: FeatureDef[]): FeatureDef[] {
  if (TEMPORARILY_HIDDEN.length === 0) return features;
  return features.filter((f) => !TEMPORARILY_HIDDEN.includes(f.id));
}

function featuresForRole(data: DashboardData): FeatureDef[] {
  const base = FEATURES_BY_ROLE[data.role];
  if (data.role !== "teacher") return base;

  const granted = PERMISSION_FEATURES.filter(({ permission }) => teacherHasPermission(data, permission)).map(
    ({ feature }) => feature,
  );
  if (granted.length === 0) return base;

  // 관리 기능은 "홈" 바로 다음에 모아 둡니다(원장 화면과 같은 순서).
  const homeIndex = base.findIndex((f) => f.id === "home");
  const at = homeIndex >= 0 ? homeIndex + 1 : 0;
  return [...base.slice(0, at), ...granted, ...base.slice(at)];
}

/** 화면 하나를 열 자격이 있는지. 사이드바에 없는 항목을 다른 경로로 여는 걸 막습니다. */
export function canOpenFeature(data: DashboardData, id: FeatureDef["id"]): boolean {
  return featuresFor(data).some((f) => f.id === id);
}

/** 역할별 처음 열리는 기본 기능입니다. 아이는 파트너를 아직 안 골랐으면 선택 화면부터 봅니다. */
export function getDefaultFeature(role: DashboardRole, hasPartner: boolean): FeatureDef["id"] {
  if (role === "child") return hasPartner ? "ai-text-chat" : "partner-select";
  return "home";
}
