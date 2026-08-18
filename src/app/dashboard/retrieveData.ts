import type { AuthUser } from "@/app/auth/types";
import { getDisplayName } from "@/app/auth/getDisplayName";
import {
    ChildRecord,
    ChildReports,
    DashboardData,
    DiaryEntry,
    TeacherRecord,
    ChatThread,
    AiChatThread,
    MemberChatThread,
    ParentNote, NoticeRecord,
} from "@/app/dashboard/types";
import { buildClasses, buildRoles, buildTeachers } from "@/app/dashboard/mock/classesAndRoles";
import { findAcceptedInvite, listInvitesSentByKindergarten } from "@/app/dashboard/mock/membershipInvites";
import { buildNotices } from "@/app/dashboard/mock/notices";
import { buildSupplies } from "@/app/dashboard/mock/supplies";
import { buildSchedule } from "@/app/dashboard/mock/schedule";
import { buildPhotos } from "@/app/dashboard/mock/photos";
import {newId} from "@/app/lib/id.ts";

/**
 * 대시보드 목업 데이터입니다. 백엔드가 없는 상태에서도 화면이 그럴듯하게 채워지도록,
 * 로그인한 사용자의 실제 정보(별명·아이디·유치원)를 시드 데이터 중 하나에 덮어써서
 * "내 아이" / "내 학급" / "나"의 이야기가 되도록 구성합니다.
 */

const SEED_CHILDREN: Omit<ChildRecord, "kindergartenId" | "kindergartenName" | "teacherId">[] = [
    // 해바라기반 (class-1)
    { id: "child-1", name: "김하늘", nickname: "하늘이", age: 6, gender: "female", classId: -1, className: "해바라기반", parentId: "parent-1", parentName: "김하늘 부모님", aiPartner: "kina", avatarEmoji: "🌻", avatarColor: "#F472B6" },
    { id: "child-2", name: "이서준", nickname: "서준이", age: 7, gender: "male", classId: -1, className: "해바라기반", parentId: "parent-2", parentName: "이서준 부모님", aiPartner: "kio", avatarEmoji: "🚀", avatarColor: "#60A5FA" },
    { id: "child-3", name: "박지우", nickname: "지우", age: 6, gender: "male", classId: -1, className: "해바라기반", parentId: "parent-3", parentName: "박지우 부모님", aiPartner: "kio", avatarEmoji: "🦖", avatarColor: "#86EFAC" },
    { id: "child-4", name: "최다은", nickname: "다은이", age: 7, gender: "female", classId: -1, className: "해바라기반", parentId: "parent-4", parentName: "최다은 부모님", aiPartner: "kina", avatarEmoji: "🎨", avatarColor: "#C084FC" },

    // 햇님반 (class-2)
    { id: "child-5", name: "정유진", nickname: "유진이", age: 6, gender: "female", classId: -2, className: "햇님반", parentId: "parent-5", parentName: "정유진 부모님", aiPartner: "kina", avatarEmoji: "🌼", avatarColor: "#F9D56E" },
    { id: "child-6", name: "한도윤", nickname: "도윤이", age: 7, gender: "male", classId: -2, className: "햇님반", parentId: "parent-6", parentName: "한도윤 부모님", aiPartner: "kio", avatarEmoji: "⚽", avatarColor: "#60A5FA" },
    { id: "child-7", name: "임소율", nickname: "소율이", age: 6, gender: "female", classId: -2, className: "햇님반", parentId: "parent-7", parentName: "임소율 부모님", aiPartner: "kina", avatarEmoji: "🐰", avatarColor: "#F472B6" },
    { id: "child-8", name: "조은우", nickname: "은우", age: 7, gender: "male", classId: -2, className: "햇님반", parentId: "parent-8", parentName: "조은우 부모님", aiPartner: "kio", avatarEmoji: "🦁", avatarColor: "#FDBA74" },

    // 장미반 (class-3)
    { id: "child-9", name: "윤아린", nickname: "아린이", age: 6, gender: "female", classId: -3, className: "장미반", parentId: "parent-9", parentName: "윤아린 부모님", aiPartner: "kina", avatarEmoji: "🌹", avatarColor: "#F87171" },
    { id: "child-10", name: "장태현", nickname: "태현이", age: 7, gender: "male", classId: -3, className: "장미반", parentId: "parent-10", parentName: "장태현 부모님", aiPartner: "kio", avatarEmoji: "🐯", avatarColor: "#FB923C" },
    { id: "child-11", name: "서예은", nickname: "예은이", age: 6, gender: "female", classId: -3, className: "장미반", parentId: "parent-11", parentName: "서예은 부모님", aiPartner: "kina", avatarEmoji: "🦋", avatarColor: "#C084FC" },

    // 무지개반 (class-4)
    { id: "child-12", name: "문시우", nickname: "시우", age: 7, gender: "male", classId: -4, className: "무지개반", parentId: "parent-12", parentName: "문시우 부모님", aiPartner: "kio", avatarEmoji: "🌈", avatarColor: "#86EFAC" },
    { id: "child-13", name: "배지안", nickname: "지안이", age: 6, gender: "female", classId: -4, className: "무지개반", parentId: "parent-13", parentName: "배지안 부모님", aiPartner: "kina", avatarEmoji: "🦄", avatarColor: "#F472B6" },
    { id: "child-14", name: "노준서", nickname: "준서", age: 7, gender: "male", classId: -4, className: "무지개반", parentId: "parent-14", parentName: "노준서 부모님", aiPartner: "kio", avatarEmoji: "🐳", avatarColor: "#60A5FA" },

    // 별빛반 (class-5)
    { id: "child-15", name: "송하윤", nickname: "하윤이", age: 6, gender: "female", classId: -5, className: "별빛반", parentId: "parent-15", parentName: "송하윤 부모님", aiPartner: "kina", avatarEmoji: "⭐", avatarColor: "#FDE047" },
    { id: "child-16", name: "권민준", nickname: "민준이", age: 7, gender: "male", classId: -5, className: "별빛반", parentId: "parent-16", parentName: "권민준 부모님", aiPartner: "kio", avatarEmoji: "🌙", avatarColor: "#A78BFA" },
    { id: "child-17", name: "홍서아", nickname: "서아", age: 6, gender: "female", classId: -5, className: "별빛반", parentId: "parent-17", parentName: "홍서아 부모님", aiPartner: "kina", avatarEmoji: "✨", avatarColor: "#F9D56E" },
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
            id: newId(),
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
            { id: newId(), sender: "ai", senderName: partnerName, kind: "text", text: `${child.nickname}야 안녕! 오늘은 어떤 하루를 보냈어?`, time: now - 1000 * 60 * 40 },
            { id: newId(), sender: "child", senderName: child.nickname, kind: "text", text: "오늘 친구랑 블록놀이 했어!", time: now - 1000 * 60 * 38 },
            { id: newId(), sender: "ai", senderName: partnerName, kind: "text", text: "우와 재밌었겠다! 어떤 걸 만들었어?", time: now - 1000 * 60 * 37 },
        ],
    };
}

function buildThread(child: ChildRecord, classTeacher: TeacherRecord): ChatThread {
    const now = 1785300000000;
    return {
        id: newId(),
        childId: child.id,
        childNickname: child.nickname,
        parentId: child.parentId,
        parentName: child.parentName,
        teacherId: classTeacher.id,
        teacherName: classTeacher.name,
        messages: [
            { id: newId(), sender: "teacher", senderName: classTeacher.name, kind: "text", text: `안녕하세요! ${child.nickname} 오늘 즐겁게 지냈어요 😊`, time: now - 1000 * 60 * 60 * 5 },
            { id: newId(), sender: "parent", senderName: child.parentName, kind: "text", text: "감사합니다 선생님! 집에서도 오늘 있었던 일 재밌게 얘기해주더라고요.", time: now - 1000 * 60 * 60 * 4 },
        ],
    };
}

function buildMemberThread(teacher: TeacherRecord, directorName: string): MemberChatThread {
    const now = 1785300000000;
    return {
        id: newId(),
        teacherId: teacher.id,
        teacherName: teacher.name,
        directorName,
        messages: [
            { id: newId(), sender: "director", senderName: directorName, kind: "text", text: `${teacher.name}님 안녕하세요! 잘 부탁드려요 😊`, time: now - 1000 * 60 * 60 * 24 },
        ],
    };
}

/** 계정 정보(AuthUser)에서 대시보드 역할을 끌어냅니다. */
export function resolveDashboardRole(user: AuthUser): DashboardData["role"] {
    if (user.accountType === "child") return "child";
    if (user.role !== "teacher") return "parent";
    return user.teacherRole === "director" ? "director" : "teacher";
}

/**
 * 로그인한 사용자를 기준으로 대시보드에 필요한 목업 데이터 전체를 구성합니다.
 *
 * `roleOverride`는 4역할 데모 계정 전용입니다. 계정의 실제 역할과 무관하게
 * 원장/교사/학부모/아이 화면을 같은 유치원 위에서 나란히 띄워 보기 위한 값이며,
 * 실제 사용자는 항상 `resolveDashboardRole()`이 정한 역할 하나만 갖습니다.
 */
export function buildDashboardData(user: AuthUser, roleOverride?: DashboardData["role"]): DashboardData {
    const displayName = getDisplayName(user);
    const kindergartenName = user.kindergarten?.name ?? "새싹유치원";
    const kindergartenId = user.kindergarten?.id ?? -1;

    const role: DashboardData["role"] = roleOverride ?? resolveDashboardRole(user);

    const isDirector = role === "director";
    // 이 워크스페이스에서 "선생님 자리"에 로그인한 본인이 앉는지 여부입니다.
    const isStaff = isDirector || role === "teacher";

    // 원장의 초대(아이디로 검색해서 보낸 것)를 이 계정이 수락해 뒀다면, 그때 배정받은
    // 반/권한을 그대로 이어받습니다. "받은 초대" 화면에서 수락하는 순간 확정됩니다.
    const acceptedInvite = role === "teacher" ? findAcceptedInvite(kindergartenId, user.id) : undefined;

    // 초대 없이 직접 검색해 들어온 교사(또는 원장)는 데모용 기본 반을 그대로 씁니다.
    // 초대를 수락해서 들어왔다면, 그 초대에 반이 지정돼 있지 않은 경우("유치원 소속")
    // classId를 비워 둬 특정 반에 속하지 않은 상태를 그대로 반영합니다.
    const teacherClassId = acceptedInvite ? acceptedInvite.classId ?? undefined : -1;
    const teacherClassName = acceptedInvite ? acceptedInvite.className ?? "유치원 소속" : "해바라기반";

    const teacher: TeacherRecord = {
        id: isStaff ? user.id : "teacher-seed",
        name: isStaff ? displayName : "박지현 선생님",
        classId: teacherClassId,
        className: teacherClassName,
        kindergartenId,
        kindergartenName,
        roleIds: acceptedInvite?.roleIds ?? (isDirector ? [] : [-1]),
    };

    let seedChildren = SEED_CHILDREN.map((c) => ({
        ...c,
        kindergartenId,
        kindergartenName,
        teacherId: teacher.id,
    })) as ChildRecord[];

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

    const directorName = isDirector ? displayName : "김민지 원장";

    // 초대를 수락한 교사만 멤버 목록에 합칩니다(대기/거절 상태는 원장의 "초대 목록"에서만 보입니다).
    // 로그인한 본인은 위 `teacher`가 이미 대표하므로 중복 추가하지 않습니다.
    const acceptedTeacherInvites: TeacherRecord[] = listInvitesSentByKindergarten(kindergartenId)
        .filter((invite) => invite.role === "teacher" && invite.status === "accepted" && invite.targetUserId !== teacher.id)
        .map((invite) => ({
            id: invite.targetUserId,
            name: invite.targetName,
            classId: invite.classId,
            className: invite.className ?? "유치원 소속",
            kindergartenId,
            kindergartenName,
            roleIds: invite.roleIds ?? [],
        }));

    const teachers: TeacherRecord[] = [...buildTeachers(kindergartenId, kindergartenName, teacher), ...acceptedTeacherInvites];
    // 사진첩이 반 단위로 나뉘므로 반 목록을 먼저 만들어 두고 아래에서 함께 씁니다.
    const classes = buildClasses(kindergartenId);
    const memberThreadsByTeacher: DashboardData["memberThreadsByTeacher"] = {};
    for (const t of teachers) {
        memberThreadsByTeacher[t.id] = buildMemberThread(t, directorName);
    }

    const diaryByChild: DashboardData["diaryByChild"] = {};
    const reportsByChild: DashboardData["reportsByChild"] = {};
    const threadsByChild: DashboardData["threadsByChild"] = {};
    const aiThreadsByChild: DashboardData["aiThreadsByChild"] = {};
    const parentNotesByChild: DashboardData["parentNotesByChild"] = {};

    for (const child of seedChildren) {
        // 아이가 속한 반의 실제 담임 교사를 찾아 대화 상대로 씁니다(반마다 담임이 다르므로).
        const classTeacher = teachers.find((t) => t.classId === child.classId) ?? teacher;
        diaryByChild[child.id] = buildDiary(child);
        reportsByChild[child.id] = buildReports(child, seedFromId(child.id));
        threadsByChild[child.id] = buildThread(child, classTeacher);
        aiThreadsByChild[child.id] = buildAiThread(child);
        parentNotesByChild[child.id] = buildParentNotes(child, classTeacher);
    }

    const defaultHomeWidgets: DashboardData["homeWidgets"] =
        role === "teacher"
            ? ["reports", "teacher-chat"]
            : role === "parent"
                ? ["schedule", "photos"]
                : role === "director"
                    ? ["classes", "members"]
                    : [];

    return {
        role,
        kindergarten: { id: kindergartenId, name: kindergartenName },
        me,
        myChild,
        myClassChildren: role === "teacher" ? seedChildren.filter((c) => c.classId === teacher.classId) : undefined,
        teacher,
        classChildren: seedChildren,
        diaryByChild,
        reportsByChild,
        threadsByChild,
        aiThreadsByChild,
        memberThreadsByTeacher,

        classes,
        roles: buildRoles(),
        teachers,
        notices: buildNotices(kindergartenId, directorName),
        suppliesByClass: teacher.classId ? { [teacher.classId]: buildSupplies(teacher.classId, teacher.name) } : {},
        scheduleEvents: buildSchedule(kindergartenId, teacher.classId || undefined, teacher.name),
        photos: buildPhotos(classes.map((c) => c.id)),
        parentNotesByChild,
        homeWidgets: defaultHomeWidgets,
    };
}

function buildParentNotes(child: ChildRecord, teacher: TeacherRecord): ParentNote[] {
    return [
        {
            id: -1,
            childId: child.id,
            authorName: teacher.name,
            text: `${child.nickname}가 요즘 부쩍 자신감이 늘었어요. 집에서도 스스로 해보려는 모습을 보이면 많이 칭찬해주세요!`,
            createdAt: 1785300000000 - 1000 * 60 * 60 * 30,
            comments: [],
        },
    ];
}

/** "타 유치원" 데모 워크스페이스의 유치원 정보입니다. 원장도 자기 유치원 밖에서는 학부모일 수 있다는 걸 보여줍니다. */
export const ALT_KINDERGARTEN = { id: -1, name: "반짝반짝유치원" };

const ALT_CLASSMATES: Omit<ChildRecord, "kindergartenId" | "kindergartenName" | "teacherId">[] = [
    { id: "alt-child-2", name: "우도현", nickname: "도현이", age: 6, gender: "male", classId: -101, className: "민들레반", parentId: "alt-parent-2", parentName: "우도현 부모님", aiPartner: "kio", avatarEmoji: "🐥", avatarColor: "#FDE047" },
    { id: "alt-child-3", name: "표나연", nickname: "나연이", age: 7, gender: "female", classId: -101, className: "민들레반", parentId: "alt-parent-3", parentName: "표나연 부모님", aiPartner: "kina", avatarEmoji: "🌷", avatarColor: "#F472B6" },
];

/**
 * 원장이 자신의 유치원을 관리하는 것과 별개로, 다른 유치원에 학부모로 등록되어 있을 수도 있는
 * 상황을 보여주는 데모 워크스페이스입니다. 좌측 서버 레일의 두 번째 아이콘에서 진입하며,
 * 이 화면 안에서는 완전히 다른 유치원의 "학부모" 계정처럼 동작합니다.
 */
export function buildAltDashboardData(user: AuthUser): DashboardData {
    const displayName = getDisplayName(user);
    const { id: kindergartenId, name: kindergartenName } = ALT_KINDERGARTEN;
    const classId = -101;
    const className = "민들레반";

    const teacher: TeacherRecord = {
        id: "alt-teacher-1",
        name: "오하늘 선생님",
        classId,
        className,
        kindergartenId,
        kindergartenName,
        roleIds: [],
    };

    const myChild: ChildRecord = {
        id: "alt-child-1",
        name: "김도담",
        nickname: "도담이",
        age: 6,
        gender: "male",
        classId,
        className,
        kindergartenId,
        kindergartenName,
        parentId: user.id,
        parentName: displayName,
        teacherId: teacher.id,
        aiPartner: "kina",
        avatarEmoji: "🐣",
        avatarColor: "#86EFAC",
    };

    const classChildren: ChildRecord[] = [
        myChild,
        ...ALT_CLASSMATES.map((c) => ({ ...c, kindergartenId, kindergartenName, teacherId: teacher.id })),
    ];

    const diaryByChild: DashboardData["diaryByChild"] = {};
    const reportsByChild: DashboardData["reportsByChild"] = {};
    const threadsByChild: DashboardData["threadsByChild"] = {};
    const aiThreadsByChild: DashboardData["aiThreadsByChild"] = {};
    const parentNotesByChild: DashboardData["parentNotesByChild"] = {};

    for (const child of classChildren) {
        diaryByChild[child.id] = buildDiary(child);
        reportsByChild[child.id] = buildReports(child, seedFromId(child.id));
        threadsByChild[child.id] = buildThread(child, teacher);
        aiThreadsByChild[child.id] = buildAiThread(child);
        parentNotesByChild[child.id] = buildParentNotes(child, teacher);
    }

    const memberThreadsByTeacher: DashboardData["memberThreadsByTeacher"] = {
        [teacher.id]: buildMemberThread(teacher, "원장 선생님"),
    };

    return {
        role: "parent",
        kindergarten: { id: kindergartenId, name: kindergartenName },
        myChild,
        teacher,
        classChildren,
        diaryByChild,
        reportsByChild,
        threadsByChild,
        aiThreadsByChild,
        memberThreadsByTeacher,

        classes: [{ id: classId, name: className, kindergartenId }],
        roles: [],
        teachers: [teacher],
        notices: buildNotices(kindergartenId, "박서연 원장"),
        suppliesByClass: { [classId]: buildSupplies(classId, teacher.name) },
        scheduleEvents: buildSchedule(kindergartenId, classId, teacher.name),
        photos: buildPhotos([classId]),
        parentNotesByChild,
        homeWidgets: ["schedule", "photos"],
    };
}
