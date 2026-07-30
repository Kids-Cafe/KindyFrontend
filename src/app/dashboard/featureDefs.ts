import {
  Sparkles,
  MessageCircle,
  Mic,
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
import type { DashboardRole, FeatureDef } from "@/app/dashboard/types";

/** 역할별 좌측 기능목록입니다. 디스코드의 "텍스트 채널 목록" 자리를 대체합니다. */
export const FEATURES_BY_ROLE: Record<DashboardRole, FeatureDef[]> = {
  child: [
    { id: "partner-select", label: "AI 파트너", hint: "키오 · 키나 고르기", icon: Sparkles },
    { id: "ai-text-chat", label: "텍스트 채팅", hint: "오늘 있었던 일 이야기하기", icon: MessageCircle },
    { id: "ai-voice-chat", label: "음성 채팅", hint: "목소리로 대화하기", icon: Mic },
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

/** 역할별 처음 열리는 기본 기능입니다. 아이는 파트너를 아직 안 골랐으면 선택 화면부터 봅니다. */
export function getDefaultFeature(role: DashboardRole, hasPartner: boolean): FeatureDef["id"] {
  if (role === "child") return hasPartner ? "ai-text-chat" : "partner-select";
  return "home";
}
