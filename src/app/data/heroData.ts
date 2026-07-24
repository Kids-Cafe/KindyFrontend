import {
  Smile, Frown, Sun, PartyPopper, UtensilsCrossed,
  Shield, Compass, Zap, Flame,
  Heart, HeartHandshake, Palette, Feather,
} from "lucide-react";

/** 히어로의 애니메이션 채팅 말풍선에 순환 표시되는 "아이가 한 말" 문구입니다. */
export const heroEmotions = [
  { Icon: Smile,           color: "#F9D56E", text: "오늘 블록 놀이 너무 재밌었어요!" },
  { Icon: Frown,           color: "#A78BFA", text: "친구 수호랑 잠깐 싸웠어요..." },
  { Icon: Sun,             color: "#7ECECA", text: "오늘 그림 그리기 너무 좋았어요!" },
  { Icon: PartyPopper,     color: "#F472B6", text: "선생님한테 칭찬 받았어요!" },
  { Icon: UtensilsCrossed, color: "#86EFAC", text: "점심에 김치볶음밥 먹었어요!" },
];

const KIO_TRAITS = [
  { Icon: Shield,  text: "용감해요" },
  { Icon: Compass, text: "탐험왕" },
  { Icon: Zap,     text: "활동적이에요" },
  { Icon: Flame,   text: "열정가득" },
];

const KINA_TRAITS = [
  { Icon: Heart,          text: "따뜻해요" },
  { Icon: HeartHandshake, text: "공감왕" },
  { Icon: Palette,        text: "감성충만" },
  { Icon: Feather,        text: "섬세해요" },
];

/** 히어로 캐릭터를 클릭했을 때 표시되는 키오의 "나는 누구일까요" 카드 문구와 스타일입니다. */
export const KIO_INFO = {
  name: "키오",
  subtitle: "씩씩한 AI 탐험 파트너",
  color: "#1D4ED8",
  darkColor: "#1E3A8A",
  lightBg: "linear-gradient(135deg, #DBEAFE 0%, #BFDBFE 100%)",
  cardBg: "rgba(219,234,254,0.55)",
  border: "rgba(147,197,253,0.7)",
  speech: "안녕! 나는 키오야! 오늘 어떤 멋진 일이 있었어? 신나는 것도, 힘든 것도 나한테 다 말해줘! 우리 같이 오늘 하루 기록하자~!",
  desc: "씩씩하고 에너지 넘치는 키오는 아이의 모든 모험과 도전을 함께 기록해요. 어떤 이야기도 놓치지 않는 최고의 탐험 파트너예요!",
  traits: KIO_TRAITS,
};

/** 히어로 캐릭터를 클릭했을 때 표시되는 키나의 "나는 누구일까요" 카드 문구와 스타일입니다. */
export const KINA_INFO = {
  name: "키나",
  subtitle: "따뜻한 AI 감성 친구",
  color: "#BE185D",
  darkColor: "#9D174D",
  lightBg: "linear-gradient(135deg, #FCE7F3 0%, #FBCFE8 100%)",
  cardBg: "rgba(252,231,243,0.55)",
  border: "rgba(251,207,232,0.8)",
  speech: "안녕~ 나는 키나야! 오늘 기분이 어때? 기쁜 일도 슬픈 일도 키나한테 살짝 이야기해줘~ 소중한 하루를 같이 기억하자!",
  desc: "따뜻하고 섬세한 키나는 아이의 감정과 마음을 누구보다 잘 이해해요. 기쁨부터 슬픔까지, 모든 마음을 소중히 들어주는 다정한 친구예요!",
  traits: KINA_TRAITS,
};
