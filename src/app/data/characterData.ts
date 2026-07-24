import {
  Compass, Zap, BookOpen, Smile, Sun, Shield, Star,
  Heart, HeartHandshake, Palette, Feather,
} from "lucide-react";

/**
 * CharacterShowcase의 "숲"/버섯 마을 배경에 사용하는 주변 반짝임 입자 위치입니다.
 * 격자처럼 보이지 않고 자연스럽게 흩어져 보이도록 생성하지 않고 직접 배치했습니다.
 * 현재는 처음 18개만 사용합니다(`.slice(0, 18)` 참조).
 */
export const FOREST_PARTICLES = [
  {x:12,y:15,s:3,o:0.9,d:1.8,dl:0.2},{x:28,y:8, s:2,o:0.7,d:2.2,dl:0.6},
  {x:45,y:12,s:4,o:0.8,d:1.5,dl:0.1},{x:68,y:6, s:2,o:0.9,d:2.0,dl:0.8},
  {x:82,y:18,s:3,o:0.75,d:1.7,dl:0.3},{x:92,y:10,s:2,o:0.85,d:2.3,dl:0.5},
  {x:7, y:35,s:2,o:0.6,d:2.5,dl:0.9},{x:35,y:28,s:3,o:0.8,d:1.9,dl:0.2},
  {x:55,y:22,s:2,o:0.7,d:2.1,dl:0.7},{x:75,y:32,s:4,o:0.85,d:1.6,dl:0.4},
  {x:88,y:25,s:2,o:0.7,d:2.4,dl:0.1},{x:18,y:55,s:3,o:0.6,d:2.0,dl:0.6},
  {x:42,y:48,s:2,o:0.75,d:1.8,dl:0.3},{x:62,y:52,s:3,o:0.65,d:2.2,dl:0.8},
  {x:78,y:45,s:2,o:0.8,d:1.7,dl:0.2},{x:95,y:58,s:3,o:0.7,d:2.3,dl:0.5},
  {x:5, y:72,s:2,o:0.6,d:1.9,dl:0.9},{x:25,y:68,s:4,o:0.5,d:2.1,dl:0.4},
  {x:50,y:65,s:2,o:0.7,d:1.6,dl:0.1},{x:72,y:70,s:3,o:0.55,d:2.0,dl:0.7},
  {x:90,y:62,s:2,o:0.65,d:2.4,dl:0.3},{x:38,y:78,s:2,o:0.5,d:2.2,dl:0.2},
  {x:60,y:85,s:3,o:0.45,d:1.7,dl:0.8},{x:80,y:80,s:2,o:0.5,d:2.0,dl:0.4},
  {x:20,y:40,s:2,o:0.65,d:2.3,dl:0.6},{x:58,y:38,s:3,o:0.7,d:1.8,dl:0.1},
];

/** 아직 사용하지 않는 빛나는 구체 위치 모음이며, 향후 장면을 위해 FOREST_PARTICLES와 함께 보관합니다. */
export const FOREST_ORBS = [
  {x:"8%", y:"42%",c:"rgba(255,220,80,0.7)", s:18},
  {x:"15%",y:"32%",c:"rgba(210,140,255,0.6)",s:14},
  {x:"23%",y:"60%",c:"rgba(80,220,200,0.6)", s:16},
  {x:"76%",y:"38%",c:"rgba(255,170,100,0.7)",s:18},
  {x:"85%",y:"55%",c:"rgba(200,110,230,0.6)",s:14},
  {x:"68%",y:"28%",c:"rgba(100,200,255,0.6)",s:16},
  {x:"48%",y:"18%",c:"rgba(255,200,120,0.5)",s:12},
  {x:"33%",y:"25%",c:"rgba(180,240,180,0.5)",s:10},
];

/** 아직 사용하지 않는 꽃 마커 위치 모음이며, 향후 장면을 위해 FOREST_PARTICLES와 함께 보관합니다. */
export const FLOWERS = [
  {x:4, b:9,c:"#F472B6",s:7},{x:10,b:6,c:"#FBBF24",s:5},{x:18,b:10,c:"#A78BFA",s:6},
  {x:27,b:7,c:"#34D399",s:5},{x:38,b:8,c:"#F9D56E",s:7},{x:50,b:5,c:"#F472B6",s:6},
  {x:61,b:9,c:"#60A5FA",s:5},{x:72,b:7,c:"#FBBF24",s:7},{x:82,b:9,c:"#A78BFA",s:6},
  {x:91,b:6,c:"#34D399",s:5},{x:96,b:8,c:"#F472B6",s:6},
];

/** CharacterShowcase 모달에서 각 캐릭터에 사용하는 문구와 팔레트입니다. */
export const CHAR_DATA = {
  kio: {
    name: "키오", nameTag: "KIO",
    role: "씩씩한 AI 친구",
    color: "#60A5FA", darkColor: "#1D4ED8",
    glow: "rgba(96,165,250,0.5)", borderGlow: "rgba(147,197,253,0.45)",
    panelBg: "rgba(4,14,46,0.85)",
    greeting: "안녕! 나는 키오야! 오늘 어떤 멋진 일이 있었어? 신나는 것도, 힘든 것도 나한테 다 말해줘!",
    story: "씩씩하고 에너지 넘치는 키오는 아이의 이야기라면 뭐든 귀 기울여 들어요. 매일의 작은 모험들을 함께 기록하고, 용기가 필요할 때 옆에서 응원해주는 든든한 친구예요.",
    tags: [
      {Icon:Compass,  label:"호기심 많아요"},
      {Icon:Zap,      label:"활발해요"},
      {Icon:BookOpen, label:"같이 기록해요"},
      {Icon:Smile,    label:"항상 응원해요"},
    ],
    moments: [
      {Icon:Sun,    text:"오늘 있었던 신나는 일을 같이 이야기해요"},
      {Icon:Shield, text:"힘든 일이 생겼을 때 함께 생각해봐요"},
      {Icon:Star,   text:"잘한 일을 기억하고 칭찬해드려요"},
    ],
  },
  kina: {
    name: "키나", nameTag: "KINA",
    role: "따뜻한 AI 친구",
    color: "#F472B6", darkColor: "#BE185D",
    glow: "rgba(244,114,182,0.5)", borderGlow: "rgba(251,207,232,0.45)",
    panelBg: "rgba(46,4,24,0.85)",
    greeting: "안녕~ 나는 키나야! 오늘 기분이 어때? 기쁜 일도 슬픈 일도 키나한테 살짝 이야기해줘~",
    story: "따뜻하고 섬세한 키나는 아이의 마음을 누구보다 잘 이해해요. 기쁠 때 함께 웃고, 속상할 때 조용히 옆에 있어주는, 언제나 다정한 친구예요.",
    tags: [
      {Icon:Heart,         label:"공감을 잘해요"},
      {Icon:HeartHandshake,label:"마음을 들어줘요"},
      {Icon:Palette,       label:"감성적이에요"},
      {Icon:Feather,       label:"섬세해요"},
    ],
    moments: [
      {Icon:Smile,  text:"오늘 기분이 어떤지 편하게 말해줘요"},
      {Icon:Heart,  text:"속상한 마음도 판단 없이 들어드려요"},
      {Icon:Star,   text:"소중한 하루를 함께 기억해요"},
    ],
  },
} as const;
