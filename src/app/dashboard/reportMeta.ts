import { UtensilsCrossed, HeartPulse, Users, Brain, BookOpen } from "lucide-react";
import type { ReportCategory } from "@/app/dashboard/types";

/** 5종 리포트 공통 메타데이터(라벨·아이콘·색상)입니다. 탭, 데이터 카드, 불러오기 버튼에서 함께 씁니다. */
export const REPORT_META: Record<ReportCategory, { label: string; short: string; icon: typeof UtensilsCrossed; color: string }> = {
  food: { label: "음식 섭취 분석", short: "식단", icon: UtensilsCrossed, color: "#86EFAC" },
  health: { label: "건강 상태 추적", short: "건강", icon: HeartPulse, color: "#F472B6" },
  friendship: { label: "교우관계 맵", short: "교우관계", icon: Users, color: "#C084FC" },
  personality: { label: "성격 성향 분석", short: "성격", icon: Brain, color: "#F9D56E" },
  learning: { label: "학습 발달 현황", short: "학습", icon: BookOpen, color: "#7ECECA" },
};

export const REPORT_CATEGORY_ORDER: ReportCategory[] = ["food", "health", "friendship", "personality", "learning"];
