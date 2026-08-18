import { apiGet, apiPost } from "@/app/lib/api";
import type {
  DiaryDTO,
  FamilyDTO,
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
 * 로그인한 본인의 일기 전체입니다.
 *
 * ⚠️ 백엔드에는 "남의 일기 목록"을 받는 엔드포인트가 없습니다(`diary/list`는 세션 사용자
 * 고정, `diary/info`는 날짜 하나씩). 그래서 부모/교사 화면에서 아이의 일기를 통째로
 * 보여줄 수는 없고, 날짜를 특정해 `fetchDiaryByDate`로 한 편씩만 열 수 있습니다.
 */
export async function fetchMyDiaries(userId: string): Promise<DiaryEntry[]> {
  const list = await apiGet<DiaryDTO[]>("/api/user/diary/list");
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
  return fetchMyDiaries(userId);
}

export async function deleteDiaryOnServer(userId: string, date: string): Promise<DiaryEntry[]> {
  await apiPost("/api/user/diary/delete", { date });
  return fetchMyDiaries(userId);
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

export async function addFamilyOnServer(parent: string, child: string): Promise<void> {
  await apiPost("/api/user/family/add", { parent, child });
}

export async function removeFamilyOnServer(parent: string, child: string): Promise<void> {
  await apiPost("/api/user/family/remove", { parent, child });
}

// ---- User search ----
/** 초대 대상을 찾습니다. 아이디/이름 부분 일치이며, 두 글자 이상이어야 합니다. */
export async function searchUsers(q: string): Promise<PlainUserDTO[]> {
  if (q.trim().length < 2) return [];
  return apiGet<PlainUserDTO[]>("/api/user/search", { q: q.trim() });
}
