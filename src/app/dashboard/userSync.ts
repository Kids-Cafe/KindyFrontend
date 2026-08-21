import { apiGet, apiPost } from "@/app/lib/api";
import type {
  DiaryDTO,
  FamilyDTO,
  FamilyInviteDTO,
  ParentNoteCommentDTO,
  ParentNoteDTO,
  PlainUserDTO,
  ReportCategoryDTO,
  ReportDTO,
} from "@/app/lib/dto";
import type {
  ChildReports,
  DiaryEntry,
  MoodTag,
  ParentNote,
  ReportCategory,
} from "@/app/dashboard/types";

/**
 * 사용자 단위 데이터(일기·리포트·부모 알림장·가족 관계·계정 검색)를 백엔드와 주고받습니다.
 * 유치원/반 단위 데이터는 `backendSync.ts`가 맡습니다.
 */

// ---- Diary ----
const MOODS: MoodTag[] = ["happy", "excited", "calm", "sad", "upset"];

function mapDiary(dto: DiaryDTO, childId: string): DiaryEntry {
  return {
    id: dto.id,
    childId,
    date: dto.date,
    mood: MOODS.includes(dto.mood as MoodTag) ? (dto.mood as MoodTag) : "calm",
    title: dto.title ?? "",
    summary: dto.summary ?? "",
    text: dto.text,
    tags: dto.tags ?? [],
  };
}

/**
 * 한 사람의 일기 전체입니다.
 *
 * `userId`를 생략하면 로그인한 본인 것이고, 아이의 것을 받으려면 열람 권한(본인·보호자·
 * 다니는 유치원의 교사)이 있어야 합니다 — 리포트·알림장과 같은 기준입니다.
 */
export async function fetchDiaries(userId: string): Promise<DiaryEntry[]> {
  const list = await apiGet<DiaryDTO[]>("/api/user/diary/list", { userId });
  return list.map((dto) => mapDiary(dto, userId));
}

/**
 * AI 파트너와의 대화를 일기로 옮깁니다.
 *
 * 날짜를 주지 않으면 최근 날짜부터, **아직 일기가 없는 날**과 **일기를 쓴 뒤로 대화가
 * 이어진 날**을 함께 정리합니다(한 번에 최대 7일 — 나머지는 다음 호출이 이어받습니다).
 * 뒤엣것이 오늘의 일기가 오전에서 멈추지 않게 하는 부분입니다.
 *
 * 건드리지 않는 것: 사람이 직접 쓰거나 고친 일기(서버가 `SOURCE_AT`으로 구분합니다),
 * 그리고 대화가 너무 적었던 날 — 빈 일기를 만들지 않고 그냥 건너뜁니다. 그래서
 * **빈 배열은 오류가 아니라 "정리할 것이 없었다"입니다.**
 *
 * `force`는 날짜를 특정했을 때만 의미가 있고, 사람이 쓴 일기까지 덮어 다시 씁니다.
 * 모델이 느리거나 죽어 있으면 `GENERATION_FAILED`로 던집니다.
 */
export async function generateDiaries(
  userId: string,
  options: { date?: string; force?: boolean } = {},
): Promise<DiaryEntry[]> {
  const list = await apiPost<DiaryDTO[]>("/api/user/diary/generate", {
    userId,
    date: options.date,
    force: options.force ? "true" : undefined,
  });
  return list.map((dto) => mapDiary(dto, userId));
}

/** 특정 날짜의 일기 한 편입니다. 아이 본인이 아니어도 열람 권한이 있으면 볼 수 있습니다. */
export async function fetchDiaryByDate(userId: string, date: string): Promise<DiaryEntry | null> {
  const dto = await apiGet<DiaryDTO | null>("/api/user/diary/info", { userId, date });
  return dto ? mapDiary(dto, userId) : null;
}

export interface DiaryDraft {
  date: string;
  mood?: MoodTag;
  title?: string;
  summary?: string;
  text?: string;
  tags?: string[];
}

export async function saveDiaryOnServer(userId: string, draft: DiaryDraft, isNew: boolean): Promise<DiaryEntry[]> {
  await apiPost(isNew ? "/api/user/diary/create" : "/api/user/diary/modify", {
    date: draft.date,
    mood: draft.mood,
    title: draft.title,
    summary: draft.summary,
    text: draft.text,
    // 서버는 콤마로 구분된 한 문자열로 받습니다.
    tags: draft.tags?.join(","),
  });
  return fetchDiaries(userId);
}

export async function deleteDiaryOnServer(userId: string, date: string): Promise<DiaryEntry[]> {
  await apiPost("/api/user/diary/delete", { date });
  return fetchDiaries(userId);
}

// ---- Reports ----
const CATEGORY_TO_DTO: Record<ReportCategory, ReportCategoryDTO> = {
  food: "FOOD",
  health: "HEALTH",
  friendship: "FRIENDSHIP",
  personality: "PERSONALITY",
  learning: "LEARNING",
};

const DTO_TO_CATEGORY = Object.fromEntries(
  Object.entries(CATEGORY_TO_DTO).map(([key, value]) => [value, key as ReportCategory]),
) as Record<ReportCategoryDTO, ReportCategory>;

/**
 * 아이의 리포트를 카테고리별로 받아 하나로 합칩니다.
 *
 * `ReportDTO.data`는 서버가 내용을 검증하지 않고 그대로 보관하는 JSON 문자열입니다.
 * 즉 모양이 맞는지는 전적으로 프론트 책임이라, 깨진 값 하나가 화면 전체를 무너뜨리지
 * 않도록 카테고리 단위로 파싱에 실패하면 그 칸만 비웁니다.
 */
export async function fetchChildReports(childId: string): Promise<Partial<ChildReports>> {
  const list = await apiGet<ReportDTO[]>("/api/user/report/list", { childId });
  const result: Partial<ChildReports> = {};
  for (const dto of list) {
    const category = DTO_TO_CATEGORY[dto.category];
    if (!category) continue;
    try {
      result[category] = JSON.parse(dto.data);
    } catch {
      console.warn(`[Kindy] ${childId}의 ${dto.category} 리포트를 읽지 못했어요.`);
    }
  }
  return result;
}

export async function saveChildReportOnServer<C extends ReportCategory>(
  childId: string,
  category: C,
  data: ChildReports[C],
): Promise<void> {
  await apiPost("/api/user/report/save", {
    childId,
    category: CATEGORY_TO_DTO[category],
    data: JSON.stringify(data),
  });
}

// ---- Parent notes ----
function mapNote(dto: ParentNoteDTO, comments: ParentNote["comments"]): ParentNote {
  return {
    id: dto.id,
    childId: dto.childId,
    authorName: dto.authorName ?? dto.author,
    text: dto.content,
    createdAt: dto.createdAt,
    comments,
  };
}

/**
 * 아이 한 명에 대한 알림장 글과 각 글의 댓글입니다. 댓글은 글별로만 조회할 수 있어
 * (`note/comment/list?noteId=`) 글 수만큼 요청이 나갑니다.
 */
export async function fetchParentNotes(childId: string): Promise<ParentNote[]> {
  const list = await apiGet<ParentNoteDTO[]>("/api/user/note/list", { childId });
  return Promise.all(
    list.map(async (dto) => {
      const comments = await fetchNoteComments(dto.id).catch(() => []);
      return mapNote(dto, comments);
    }),
  );
}

async function fetchNoteComments(noteId: number): Promise<ParentNote["comments"]> {
  const list = await apiGet<ParentNoteCommentDTO[]>("/api/user/note/comment/list", { noteId });
  return list.map((c) => ({
    id: c.id,
    authorName: c.authorName ?? c.author,
    // 댓글 작성자의 대시보드 역할은 서버가 알려주지 않습니다. 표시는 이름으로만 합니다.
    authorRole: "parent" as const,
    text: c.content,
    createdAt: c.createdAt,
  }));
}

export async function createParentNoteOnServer(childId: string, content: string): Promise<ParentNote[]> {
  await apiPost("/api/user/note/create", { childId, content });
  return fetchParentNotes(childId);
}

export async function deleteParentNoteOnServer(childId: string, noteId: number): Promise<ParentNote[]> {
  await apiPost("/api/user/note/delete", { id: noteId });
  return fetchParentNotes(childId);
}

export async function createParentNoteCommentOnServer(childId: string, noteId: number, content: string): Promise<ParentNote[]> {
  await apiPost("/api/user/note/comment/create", { noteId, content });
  return fetchParentNotes(childId);
}

export async function deleteParentNoteCommentOnServer(childId: string, commentId: number): Promise<ParentNote[]> {
  await apiPost("/api/user/note/comment/delete", { id: commentId });
  return fetchParentNotes(childId);
}

// ---- Family ----
/** 로그인한 사람의 부모↔아이 연결입니다. "내 아이가 누구인지"의 유일한 출처입니다. */
export async function fetchFamilies(): Promise<FamilyDTO[]> {
  return apiGet<FamilyDTO[]>("/api/user/family/list");
}

/**
 * 아이 한 명의 **보호자 전부**입니다. `family/list`가 로그인한 본인의 행만 돌려주는 것과
 * 달리, 이건 아이를 기준으로 조회하므로 교사·원장도 자기 반 아이의 보호자를 알 수 있습니다.
 * 서버는 `canViewChild`(본인·보호자·그 아이가 다니는 유치원의 교사)로 막습니다.
 */
export async function fetchChildGuardians(childId: string): Promise<PlainUserDTO[]> {
  return apiGet<PlainUserDTO[]>("/api/user/family/parents", { childId });
}

/**
 * 여러 아이의 보호자를 한 번에 채웁니다. 서버에 묶음 조회가 없어 아이 수만큼 나갑니다.
 * 개별 실패는 삼킵니다 — 볼 수 없는 아이가 섞여 있어도 나머지는 이름이 나와야 합니다.
 */
export async function fetchGuardiansOf(childIds: string[]): Promise<Record<string, PlainUserDTO[]>> {
  const entries = await Promise.all(
    childIds.map(async (id) => [id, await fetchChildGuardians(id).catch(() => [])] as const),
  );
  return Object.fromEntries(entries);
}

/**
 * 연결을 끊습니다. 만드는 것과 달리 한쪽이 혼자 할 수 있습니다 — 행을 지우는 건 권한을
 * 줄이기만 해서 상대가 동의할 대상이 없기 때문입니다. 마지막 보호자가 자신을 끊는 것도
 * 서버는 막지 않으니, 그 경고는 화면이 합니다.
 */
export async function removeFamilyOnServer(parent: string, child: string): Promise<void> {
  await apiPost("/api/user/family/remove", { parent, child });
}

/**
 * 다른 사람의 프로필입니다. `userId`를 빼면 본인 것으로, 로그인 직후 호출과 같습니다.
 * 서버는 `canViewChild`(본인·부모·아이가 다니는 유치원의 교사)로 막습니다.
 */
export async function fetchUserInfo(userId?: string): Promise<PlainUserDTO> {
  return apiGet<PlainUserDTO>("/api/user/info", { userId });
}

/**
 * 여러 아이의 프로필을 한 번에 채웁니다. 서버에 묶음 조회가 없어 아이 수만큼 나갑니다.
 * 개별 실패는 삼킵니다 — 나이·성별은 선택 필드이고, 교사 시점에서는 볼 수 없는 아이가
 * 섞일 수 있어 한 명 때문에 목록 전체가 비면 안 됩니다.
 */
export async function fetchChildProfiles(ids: string[]): Promise<Record<string, PlainUserDTO>> {
  const entries = await Promise.all(
    ids.map(async (id) => [id, await fetchUserInfo(id).catch(() => null)] as const),
  );
  return Object.fromEntries(entries.filter((e): e is [string, PlainUserDTO] => e[1] !== null));
}

export interface ChildAccountDraft {
  loginId: string;
  password: string;
  name: string;
  phone: string;
  birthDate: string;
  gender?: "MALE" | "FEMALE";
  guardianName?: string;
  guardianPhone?: string;
}

/**
 * 로그인한 보호자가 아이 계정을 만들고, 같은 트랜잭션에서 가족 연결까지 세웁니다.
 * 계정을 만든 사람이 곧 관계의 당사자라 동의 절차가 없는 경로입니다.
 *
 * ⚠️ `auth/signup.ts`의 `registerUser`를 쓰면 안 됩니다. 그쪽은 생성 직후 `user/login`을
 * 부르고 서버 `login`은 세션을 새로 만들어, 부모가 방금 만든 아이 계정으로 로그인돼
 * 버립니다. 여기서는 요청 하나만 보내고 세션을 건드리지 않습니다.
 */
export async function createChildAccount(draft: ChildAccountDraft): Promise<void> {
  await apiPost("/api/user/child/create", {
    id: draft.loginId,
    password: draft.password,
    name: draft.name,
    phone: draft.phone,
    birthDate: draft.birthDate,
    gender: draft.gender,
    guardianName: draft.guardianName,
    guardianPhone: draft.guardianPhone,
  });
}

/** 보낸 항목만 저장됩니다(`undefined`는 `apiPost`가 떨어뜨립니다). 주소·이메일·비밀번호는 대상이 아닙니다. */
export interface ChildProfilePatch {
  name?: string;
  phone?: string;
  birthDate?: string;
  gender?: "MALE" | "FEMALE" | "UNSPECIFIED";
  guardianName?: string;
  guardianPhone?: string;
}

export async function updateChildProfileOnServer(childId: string, patch: ChildProfilePatch): Promise<void> {
  await apiPost("/api/user/child/update", { childId, ...patch });
}

// ---- Family link requests ----
/** 본인이 관련된 대기 중인 연결 요청입니다. 답할 수 있는지는 서버가 `canRespond`로 알려줍니다. */
export async function fetchFamilyInvites(): Promise<FamilyInviteDTO[]> {
  return apiGet<FamilyInviteDTO[]>("/api/user/family/invite/list");
}

export async function sendFamilyInvite(parent: string, child: string): Promise<void> {
  await apiPost("/api/user/family/invite", { parent, child });
}

export async function respondToFamilyInvite(
  id: number,
  action: "accept" | "reject" | "cancel",
): Promise<void> {
  await apiPost(`/api/user/family/invite/${action}`, { id });
}

// ---- User search ----
/** 초대 대상을 찾습니다. 아이디/이름 부분 일치이며, 두 글자 이상이어야 합니다. */
export async function searchUsers(q: string): Promise<PlainUserDTO[]> {
  if (q.trim().length < 2) return [];
  return apiGet<PlainUserDTO[]>("/api/user/search", { q: q.trim() });
}
