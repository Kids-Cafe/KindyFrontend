import {
  Sparkles,
  MessageCircle,
  Mic,
  BookOpen,
  LineChart,
  Users,
  MessagesSquare,
} from "lucide-react";
import type { DashboardRole, FeatureDef } from "@/app/dashboard/types";

/** 역할별 좌측 기능목록입니다. 디스코드의 "텍스트 채널 목록" 자리를 대체합니다. */
export const FEATURES_BY_ROLE: Record<DashboardRole, FeatureDef[]> = {
  child: [
    { id: "partner-select", label: "AI 파트너", hint: "키오 · 키나 고르기", icon: Sparkles },
    { id: "ai-text-chat", label: "텍스트 채팅", hint: "오늘 있었던 일 이야기하기", icon: MessageCircle },
    { id: "ai-voice-chat", label: "음성 채팅", hint: "목소리로 대화하기", icon: Mic },
    { id: "diary", label: "나의 일기장", hint: "AI가 정리해준 하루", icon: BookOpen },
  ],
  parent: [
    { id: "diary", label: "우리 아이 일기장", hint: "매일의 이야기", icon: BookOpen },
    { id: "reports", label: "성장 리포트", hint: "식단 · 건강 · 교우 · 성격 · 학습", icon: LineChart },
    { id: "parent-chat", label: "선생님과 채팅", hint: "궁금한 점 물어보기", icon: MessagesSquare },
  ],
  teacher: [
    { id: "students", label: "우리 반 학생", hint: "학급 아이들 보기", icon: Users },
    { id: "reports", label: "학생별 리포트", hint: "성장 데이터 확인", icon: LineChart },
    { id: "teacher-chat", label: "학부모와 채팅", hint: "가정과 소통하기", icon: MessagesSquare },
  ],
};

/** 역할별 처음 열리는 기본 기능입니다. 아이는 파트너를 아직 안 골랐으면 선택 화면부터 봅니다. */
export function getDefaultFeature(role: DashboardRole, hasPartner: boolean): FeatureDef["id"] {
  if (role === "child") return hasPartner ? "ai-text-chat" : "partner-select";
  if (role === "parent") return "diary";
  return "students";
}
