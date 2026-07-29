import type { AuthUser } from "@/app/auth/types";
import { getDisplayName } from "@/app/auth/getDisplayName";
import type {
  ChildRecord,
  ChildReports,
  DashboardData,
  DiaryEntry,
  TeacherRecord,
  ChatThread,
  AiChatThread,
} from "@/app/dashboard/types";

/**
 * 대시보드 목업 데이터입니다. 백엔드가 없는 상태에서도 화면이 그럴듯하게 채워지도록,
 * 로그인한 사용자의 실제 정보(별명·아이디·유치원)를 시드 데이터 중 하나에 덮어써서
 * "내 아이" / "내 학급" / "나"의 이야기가 되도록 구성합니다.
 */

const SEED_CHILDREN: Omit<ChildRecord, "kindergartenId" | "kindergartenName" | "teacherId">[] = [
  { id: "child-1", name: "김하늘", nickname: "하늘이", age: 6, gender: "female", classId: "class-1", className: "해바라기반", parentId: "parent-1", parentName: "김하늘 부모님", aiPartner: "kina", avatarEmoji: "🌻", avatarColor: "#F472B6" },
  { id: "child-2", name: "이서준", nickname: "서준이", age: 7, gender: "male", classId: "class-1", className: "해바라기반", parentId: "parent-2", parentName: "이서준 부모님", aiPartner: "kio", avatarEmoji: "🚀", avatarColor: "#60A5FA" },
  { id: "child-3", name: "박지우", nickname: "지우", age: 6, gender: "male", classId: "class-1", className: "해바라기반", parentId: "parent-3", parentName: "박지우 부모님", aiPartner: "kio", avatarEmoji: "🦖", avatarColor: "#86EFAC" },
  { id: "child-4", name: "최다은", nickname: "다은이", age: 7, gender: "female", classId: "class-1", className: "해바라기반", parentId: "parent-4", parentName: "최다은 부모님", aiPartner: "kina", avatarEmoji: "🎨", avatarColor: "#C084FC" },
];

const MOOD_CYCLE = ["happy", "excited", "calm", "happy", "sad", "excited", "calm"] as const;

function buildDiary(child: ChildRecord): DiaryEntry[] {
  const templates = [
    { title: "블록으로 만든 커다란 성", summary: `오늘 ${child.nickname}는 친구들과 블록으로 커다란 성을 쌓았어요. 무너졌을 때 속상해했지만 다시 웃으며 처음부터 다시 만들었어요. ${child.aiPartner === "kio" ? "키오" : "키나"}에게 자랑하듯 이야기해줬답니다.`, tags: ["놀이", "회복탄력성"] },
    { title: "점심시간의 작은 다툼", summary: `친구와 장난감을 두고 잠깐 다투었지만 선생님의 도움으로 금방 화해했어요. 점심으로 나온 채소볶음밥을 절반 넘게 먹었다고 뿌듯해했어요.`, tags: ["또래관계", "식사"] },
    { title: "그림 그리기 시간에 집중!", summary: `그림 그리기 시간에 평소보다 오래 집중하는 모습을 보였어요. 완성한 그림을 보여주며 색깔 이름을 하나하나 설명해줬어요.`, tags: ["집중력", "창의성"] },
    { title: "낮잠 후 상쾌한 오후", summary: `낮잠을 푹 자고 일어나 기분 좋게 오후 활동에 참여했어요. 노래 시간에 제일 크게 따라 불렀다고 해요.`, tags: ["컨디션", "정서"] },
    { title: "새 친구와 인사", summary: `처음 보는 친구에게 먼저 다가가 인사를 건넸어요. 낯가림이 있던 지난주와 달리 부쩍 자신감이 생긴 모습이에요.`, tags: ["사회성", "성장"] },
  ];

  return templates.map((t, i) => {
    const date = new Date(2026, 6, 29 - (templates.length - 1 - i));
    return {
      id: `${child.id}-diary-${i}`,
      childId: child.id,
      date: date.toISOString().slice(0, 10),
      mood: MOOD_CYCLE[i % MOOD_CYCLE.length],
      title: t.title,
      summary: t.summary,
      tags: t.tags,
    };
  });
}

function buildReports(child: ChildRecord, seed: number): ChildReports {
  const wobble = (base: number, spread: number) => Math.max(0, Math.min(100, base + ((seed * 37) % spread) - spread / 2));

  return {
    food: {
      weekly: [
        { day: "월", vegetable: wobble(30, 10), protein: wobble(28, 8), carbs: wobble(25, 8), dairy: wobble(15, 6) },
        { day: "화", vegetable: wobble(34, 10), protein: wobble(26, 8), carbs: wobble(24, 8), dairy: wobble(14, 6) },
        { day: "수", vegetable: wobble(28, 10), protein: wobble(30, 8), carbs: wobble(26, 8), dairy: wobble(18, 6) },
        { day: "목", vegetable: wobble(38, 10), protein: wobble(24, 8), carbs: wobble(22, 8), dairy: wobble(12, 6) },
        { day: "금", vegetable: wobble(32, 10), protein: wobble(29, 8), carbs: wobble(23, 8), dairy: wobble(16, 6) },
      ],
      balanceNote: `채소 섭취가 지난주보다 늘었고 편식 없이 골고루 먹는 편이에요. ${child.nickname}는 특히 국물 요리를 잘 먹어요.`,
      favorite: ["김치볶음밥", "미역국", "딸기"],
      caution: ["매운 음식은 조금 남기는 편이에요"],
    },
    health: {
      timeline: [
        { date: "07-25", status: "good", note: "컨디션 좋음, 활동량 많음" },
        { date: "07-26", status: "good", note: "컨디션 좋음" },
        { date: "07-27", status: "mild", note: "미열 잠깐 있었으나 오후에 회복" },
        { date: "07-28", status: "good", note: "정상 체온, 활발" },
        { date: "07-29", status: "good", note: "컨디션 좋음" },
      ],
      heightCm: 110 + (seed % 8),
      weightKg: 18 + (seed % 3),
      note: "최근 한 달간 특이사항 없이 안정적으로 성장하고 있어요.",
    },
    friendship: {
      sociabilityScore: Math.round(wobble(74, 20)),
      closest: [
        { name: "이서준", strength: 88, note: "블록놀이를 함께 자주 해요" },
        { name: "박지우", strength: 71, note: "점심시간에 옆자리에 앉아요" },
        { name: "최다은", strength: 64, note: "그림 그리기를 같이 해요" },
      ].filter((f) => f.name !== child.name),
      groupNote: `${child.nickname}는 또래와 두루 잘 어울리고, 갈등이 생겨도 스스로 화해를 시도하는 모습을 보여요.`,
    },
    personality: {
      traits: [
        { trait: "사교성", value: Math.round(wobble(78, 24)) },
        { trait: "창의성", value: Math.round(wobble(70, 24)) },
        { trait: "집중력", value: Math.round(wobble(60, 24)) },
        { trait: "활동성", value: Math.round(wobble(84, 24)) },
        { trait: "감수성", value: Math.round(wobble(72, 24)) },
      ],
      mbtiLike: "ENFP형에 가까운 성향",
      summary: `호기심이 많고 표현이 풍부한 편이에요. 새로운 활동에 먼저 나서는 모습이 자주 관찰돼요.`,
    },
    learning: {
      subjects: [
        { subject: "언어", progress: Math.round(wobble(72, 20)) },
        { subject: "수리", progress: Math.round(wobble(64, 20)) },
        { subject: "예술", progress: Math.round(wobble(80, 20)) },
        { subject: "신체", progress: Math.round(wobble(75, 20)) },
      ],
      recentTopic: "여름과 곤충",
      interestNote: `이야기 만들기와 색칠 활동에 특히 흥미를 보여요. 최근에는 "${child.nickname}만의 이야기"를 만드는 걸 좋아해요.`,
    },
  };
}

function seedFromId(id: string): number {
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = (hash * 31 + id.charCodeAt(i)) % 1000;
  return hash;
}

function buildAiThread(child: ChildRecord): AiChatThread {
  if (!child.aiPartner) return { childId: child.id, messages: [] };
  const partnerName = child.aiPartner === "kio" ? "키오" : "키나";
  const now = 1785300000000;
  return {
    childId: child.id,
    messages: [
      { id: `${child.id}-ai-1`, sender: "ai", senderName: partnerName, kind: "text", text: `${child.nickname}야 안녕! 오늘은 어떤 하루를 보냈어?`, time: now - 1000 * 60 * 40 },
      { id: `${child.id}-ai-2`, sender: "child", senderName: child.nickname, kind: "text", text: "오늘 친구랑 블록놀이 했어!", time: now - 1000 * 60 * 38 },
      { id: `${child.id}-ai-3`, sender: "ai", senderName: partnerName, kind: "text", text: "우와 재밌었겠다! 어떤 걸 만들었어?", time: now - 1000 * 60 * 37 },
    ],
  };
}

function buildThread(child: ChildRecord, teacher: TeacherRecord): ChatThread {
  const now = 1785300000000;
  return {
    id: `thread-${child.id}`,
    childId: child.id,
    childNickname: child.nickname,
    parentId: child.parentId,
    parentName: child.parentName,
    teacherId: teacher.id,
    teacherName: teacher.name,
    messages: [
      { id: `${child.id}-t-1`, sender: "teacher", senderName: teacher.name, kind: "text", text: `안녕하세요! ${child.nickname} 오늘 즐겁게 지냈어요 😊`, time: now - 1000 * 60 * 60 * 5 },
      { id: `${child.id}-t-2`, sender: "parent", senderName: child.parentName, kind: "text", text: "감사합니다 선생님! 집에서도 오늘 있었던 일 재밌게 얘기해주더라고요.", time: now - 1000 * 60 * 60 * 4 },
    ],
  };
}

/** 로그인한 사용자를 기준으로 대시보드에 필요한 목업 데이터 전체를 구성합니다. */
export function buildDashboardData(user: AuthUser): DashboardData {
  const displayName = getDisplayName(user);
  const kindergartenName = user.kindergarten?.name ?? "새싹유치원";
  const kindergartenId = user.kindergarten?.id ?? "kg-mock";

  const teacher: TeacherRecord = {
    id: user.role === "teacher" ? user.id : "teacher-seed",
    name: user.role === "teacher" ? displayName : "박지현 선생님",
    classId: "class-1",
    className: "해바라기반",
    kindergartenId,
    kindergartenName,
  };

  let seedChildren = SEED_CHILDREN.map((c) => ({
    ...c,
    kindergartenId,
    kindergartenName,
    teacherId: teacher.id,
  })) as ChildRecord[];

  const role: DashboardData["role"] =
    user.accountType === "child" ? "child" : user.role === "teacher" ? "teacher" : "parent";

  let me: ChildRecord | undefined;
  let myChild: ChildRecord | undefined;

  if (role === "child") {
    me = {
      ...seedChildren[0],
      id: user.id,
      name: user.name,
      nickname: displayName,
      gender: user.gender ?? seedChildren[0].gender,
      aiPartner: null, // 아이 계정은 처음 들어오면 파트너를 직접 고릅니다.
    };
    seedChildren = [me, ...seedChildren.slice(1)];
  } else if (role === "parent") {
    myChild = {
      ...seedChildren[0],
      parentId: user.id,
      parentName: displayName,
    };
    seedChildren = [myChild, ...seedChildren.slice(1)];
  }

  const diaryByChild: DashboardData["diaryByChild"] = {};
  const reportsByChild: DashboardData["reportsByChild"] = {};
  const threadsByChild: DashboardData["threadsByChild"] = {};
  const aiThreadsByChild: DashboardData["aiThreadsByChild"] = {};

  for (const child of seedChildren) {
    diaryByChild[child.id] = buildDiary(child);
    reportsByChild[child.id] = buildReports(child, seedFromId(child.id));
    threadsByChild[child.id] = buildThread(child, teacher);
    aiThreadsByChild[child.id] = buildAiThread(child);
  }

  return {
    role,
    kindergarten: { id: kindergartenId, name: kindergartenName },
    me,
    myChild,
    myClassChildren: role === "teacher" ? seedChildren : undefined,
    teacher,
    classChildren: seedChildren,
    diaryByChild,
    reportsByChild,
    threadsByChild,
    aiThreadsByChild,
  };
}
