import {
  Mic, BarChart2, Users, Brain, BookOpen,
  Smile, Heart, GraduationCap, Sparkles,
} from "lucide-react";

/** "핵심 기능" 섹션에 표시되는 카드입니다. */
export const features = [
  {
    icon: Mic, icon2: Mic,
    bg: "#FEE2E2", iconColor: "#E879A0",
    tag: "AI 대화 일기",
    title: "말하면 일기가 돼요",
    desc: "음성이나 텍스트로 자유롭게 대화하면 키오/키나 AI가 하루를 아름다운 일기로 정리해줘요.",
    points: ["음성 인식 지원", "자연어 감정 분석", "자동 일기 생성"],
  },
  {
    icon: BarChart2, icon2: BarChart2,
    bg: "#EDE9FE", iconColor: "#A78BFA",
    tag: "스마트 분석",
    title: "데이터로 성장을 확인해요",
    desc: "음식 섭취, 건강 상태, 교우관계, 성격 성향, 학습 발달을 5가지 관점으로 분석해요.",
    points: ["식습관 & 영양 분석", "MBTI 성향 파악", "학습 발달 추적"],
  },
  {
    icon: Users,
    bg: "#DCFCE7", iconColor: "#22C55E",
    tag: "소통 브릿지",
    title: "부모님-선생님 연결",
    desc: "데이터를 바탕으로 부모님과 선생님이 아이를 더 잘 이해하고 원활하게 소통해요.",
    points: ["실시간 알림", "교사-부모 채팅", "성장 리포트 공유"],
  },
];

/** "이용 방법" 섹션에 표시되는 단계입니다. */
export const steps = [
  { num: "01", icon: Mic,      title: "아이가 대화해요",   desc: "키오나 키나와 자유롭게 하루를 이야기해요. 음성으로 말하거나 텍스트로 입력할 수 있어요.",             gradient: "from-[#F472B6] to-[#E879A0]", ring: "rgba(244,114,182,0.25)" },
  { num: "02", icon: Brain,    title: "AI가 일기를 써요",  desc: "AI가 대화를 분석하고 감정, 사건, 인물 관계를 파악해 아름다운 일기를 작성해요.",                     gradient: "from-[#A78BFA] to-[#8B5CF6]", ring: "rgba(167,139,250,0.25)" },
  { num: "03", icon: BarChart2,title: "데이터를 분석해요", desc: "음식, 건강, 감정, 친구관계, 학습 상태를 종합 분석하고 시각화된 인사이트로 보여줘요.",             gradient: "from-[#F9D56E] to-[#F59E0B]", ring: "rgba(249,213,110,0.3)" },
  { num: "04", icon: Users,    title: "함께 확인해요",     desc: "부모님과 선생님이 대시보드에서 아이의 하루를 확인하고 서로 더 깊이 소통해요.",                     gradient: "from-[#86EFAC] to-[#22C55E]", ring: "rgba(134,239,172,0.3)" },
];

/** "모두를 위한 Kindy" 섹션에 표시되는 대상별 카드입니다. */
export const personas = [
  {
    icon: Smile, bg: "#FEF9C3", iconColor: "#D97706",
    accent: "#D97706", subtitle: "나의 AI 친구", title: "아이들", avatarIcon: Sparkles, avatarColor: "#D97706", avatarBg: "#FEF9C3",
    desc: "키오나 키나와 신나게 수다를 떨다 보면 자연스럽게 하루가 기록돼요. 말하기와 표현력이 쑥쑥 늘어나요!",
    benefits: ["자유로운 표현 능력 향상", "감정 인식 및 표현 연습", "재미있는 AI 친구와 대화"],
  },
  {
    icon: Heart, bg: "#FCE7F3", iconColor: "#E879A0",
    accent: "#E879A0", subtitle: "아이의 하루를 실시간으로", title: "부모님", avatarIcon: Heart, avatarColor: "#E879A0", avatarBg: "#FCE7F3",
    desc: "어린이집과 유치원에서의 아이 생활을 생생하게 확인하세요. 데이터로 아이를 더 깊이 이해해요.",
    benefits: ["아이의 하루 전체 확인", "건강·영양 상태 체크", "선생님과의 원활한 소통"],
  },
  {
    icon: BookOpen, bg: "#EDE9FE", iconColor: "#8B5CF6",
    accent: "#8B5CF6", subtitle: "데이터 기반 교육", title: "선생님", avatarIcon: GraduationCap, avatarColor: "#8B5CF6", avatarBg: "#EDE9FE",
    desc: "각 아이의 성향과 발달 데이터를 바탕으로 개인화된 교육 계획을 세우고 학부모와 효율적으로 소통하세요.",
    benefits: ["아이별 맞춤 교육 계획", "학부모 소통 간소화", "성장 리포트 자동 생성"],
  },
];

/** "사용자 후기" 섹션에 표시되는 인용문입니다. */
export const testimonials = [
  {
    avatarIcon: Heart, avatarColor: "#E879A0", avatarBg: "#FCE7F3",
    name: "이지영", role: "7세 아이 엄마 · 2년 사용", rating: 5,
    text: "아이가 어린이집에서 무슨 일이 있었는지 항상 궁금했는데, Kindy 덕분에 아이의 하루를 생생하게 알 수 있어요. 선생님과 소통도 훨씬 자연스러워졌어요!",
  },
  {
    avatarIcon: GraduationCap, avatarColor: "#8B5CF6", avatarBg: "#EDE9FE",
    name: "박지수 선생님", role: "유치원 교사 · 5년차", rating: 5,
    text: "학부모님께 일일이 연락드리기 어려웠는데 Kindy로 아이 상황을 자연스럽게 공유할 수 있어요. 아이별 데이터로 맞춤 교육도 가능해졌어요. 강력 추천해요!",
  },
  {
    avatarIcon: Smile, avatarColor: "#D97706", avatarBg: "#FEF9C3",
    name: "최준서", role: "6세 · Kindy 사용자", rating: 5,
    text: "키나랑 얘기하는 거 너무너무 재밌어요! 오늘 학교에서 있었던 일 다 얘기해줬어요. 내일도 하고 싶어요!",
  },
];
