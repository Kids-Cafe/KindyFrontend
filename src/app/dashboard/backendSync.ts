import { apiGet, apiPost, apiUpload } from "@/app/lib/api";
import type {
  BackendPermission,
  ClassDTO,
  InviteDTO,
  KindergartenDTO,
  NoticeDTO,
  PhotoDTO,
  RelationshipDTO,
  RoleDTO,
  ScheduleDTO,
  SupplyCommentDTO,
  SupplyDTO,
} from "@/app/lib/dto";
import { toBackendPermission, toPermissionKeys } from "@/app/lib/permissions";
import type {
  ClassRecord,
  KindergartenRecord,
  NoticeRecord,
  PermissionKey,
  PhotoRecord,
  PhotoThemeId,
  RoleDef,
  ScheduleEvent,
  SupplyItem,
  TeacherRecord,
} from "@/app/dashboard/types";

/**
 * `DashboardData`를 실제 백엔드(org.kidscafe.kindy)와 동기화하는 함수들입니다.
 *
 * 백엔드의 생성/수정/삭제 엔드포인트는 대부분 `Void`만 돌려주므로("생성 후 재조회" 패턴),
 * 여기 있는 함수들은 변이 호출 뒤 해당 목록을 다시 받아와 매핑된 배열을 돌려줍니다.
 * 호출부(DashboardStoreContext)는 그 배열로 `setData`만 하면 됩니다.
 *
 * 서버에 대응 칼럼이 아예 없어 로컬에서만 유지되는 값은 지금 기준으로 딱 하나,
 * `ScheduleEvent.createdBy`뿐입니다(ScheduleDTO에 작성자 필드가 없습니다).
 * 나머지(공지 배너, 역할 색상, 사진 테마·캡션, 준비물 작성자·댓글)는 전부 서버에 저장됩니다.
 */

const DEFAULT_PHOTO_THEME: PhotoThemeId = "clip";
const PHOTO_THEMES: PhotoThemeId[] = ["clip", "polaroid", "frame-wood", "frame-gold"];

function toPhotoTheme(value: string | undefined): PhotoThemeId {
  return PHOTO_THEMES.includes(value as PhotoThemeId) ? (value as PhotoThemeId) : DEFAULT_PHOTO_THEME;
}

// ---- Class ----
function mapClass(dto: ClassDTO): ClassRecord {
  return { id: dto.id, name: dto.name, kindergartenId: dto.kindergartenId };
}

export async function fetchClasses(kindergartenId: number): Promise<ClassRecord[]> {
  const list = await apiGet<ClassDTO[]>("/api/class/list", { kindergartenId });
  return list.map(mapClass);
}

export async function createClass(kindergartenId: number, name: string): Promise<ClassRecord[]> {
  await apiPost("/api/class/create", { kindergartenId, name });
  return fetchClasses(kindergartenId);
}

export async function renameClassOnServer(kindergartenId: number, classId: number, name: string): Promise<ClassRecord[]> {
  await apiPost("/api/class/rename", { id: classId, name });
  return fetchClasses(kindergartenId);
}

export async function deleteClassOnServer(kindergartenId: number, classId: number): Promise<ClassRecord[]> {
  await apiPost("/api/class/delete", { id: classId });
  return fetchClasses(kindergartenId);
}

// ---- Notice ----
function mapNotice(dto: NoticeDTO): NoticeRecord {
  return {
    id: dto.id,
    num: dto.num,
    kindergartenId: dto.kindergartenId,
    title: dto.title,
    body: dto.content,
    authorName: dto.authorName ?? dto.author,
    createdAt: dto.createdAt,
    pinned: dto.pinned,
    bannerEnabled: dto.bannerEnabled,
  };
}

export async function fetchNotices(kindergartenId: number): Promise<NoticeRecord[]> {
  const list = await apiGet<NoticeDTO[]>("/api/kindergarten/notice/list", { kindergartenId });
  return list.map(mapNotice);
}

export async function createNoticeOnServer(
  kindergartenId: number,
  title: string,
  content: string,
  bannerEnabled: boolean,
): Promise<NoticeRecord[]> {
  await apiPost("/api/kindergarten/notice/create", { kindergartenId, title, content, pinned: false, bannerEnabled });
  return fetchNotices(kindergartenId);
}

/**
 * 공지 수정입니다. `notice/edit`은 id가 아니라 유치원별 일련번호(num)로 대상을 찾고,
 * 넘기지 않은 필드는 비워 버리므로 항상 전체 값을 함께 보냅니다.
 */
export async function updateNoticeOnServer(
  kindergartenId: number,
  notice: NoticeRecord,
  patch: Partial<Pick<NoticeRecord, "title" | "body" | "pinned" | "bannerEnabled">>,
): Promise<NoticeRecord[]> {
  const next = { ...notice, ...patch };
  await apiPost("/api/kindergarten/notice/edit", {
    kindergartenId,
    num: notice.num ?? notice.id,
    title: next.title,
    content: next.body,
    pinned: next.pinned,
    bannerEnabled: next.bannerEnabled,
  });
  return fetchNotices(kindergartenId);
}

export async function deleteNoticeOnServer(kindergartenId: number, noticeId: number): Promise<NoticeRecord[]> {
  await apiPost("/api/kindergarten/notice/delete", { id: noticeId });
  return fetchNotices(kindergartenId);
}

// ---- Schedule ----
function mapSchedule(dto: ScheduleDTO, prev: ScheduleEvent | undefined): ScheduleEvent {
  return {
    id: dto.id,
    kindergartenId: dto.kindergartenId,
    classId: dto.classId,
    title: dto.title,
    date: dto.date,
    time: dto.time,
    // ScheduleDTO에 작성자 칼럼이 없어 서버 재조회 후엔 알 수 없습니다. 이전 값을 유지합니다.
    createdBy: prev?.createdBy ?? "",
    createdAt: dto.createdAt,
  };
}

export async function fetchSchedule(kindergartenId: number, prevById: Map<number, ScheduleEvent>): Promise<ScheduleEvent[]> {
  const list = await apiGet<ScheduleDTO[]>("/api/kindergarten/schedule/list", { kindergartenId });
  return list.map((dto) => mapSchedule(dto, prevById.get(dto.id)));
}

export async function createScheduleOnServer(
  kindergartenId: number,
  title: string,
  date: string,
  time: string | undefined,
  classId: number | undefined,
  prevById: Map<number, ScheduleEvent>,
): Promise<ScheduleEvent[]> {
  await apiPost("/api/kindergarten/schedule/create", { kindergartenId, date, time, title, classId });
  return fetchSchedule(kindergartenId, prevById);
}

export async function updateScheduleOnServer(
  kindergartenId: number,
  eventId: number,
  title: string,
  date: string,
  time: string | undefined,
  classId: number | undefined,
  prevById: Map<number, ScheduleEvent>,
): Promise<ScheduleEvent[]> {
  await apiPost("/api/kindergarten/schedule/edit", { id: eventId, date, time, title, classId });
  return fetchSchedule(kindergartenId, prevById);
}

export async function deleteScheduleOnServer(
  kindergartenId: number,
  eventId: number,
  prevById: Map<number, ScheduleEvent>,
): Promise<ScheduleEvent[]> {
  await apiPost("/api/kindergarten/schedule/delete", { id: eventId });
  return fetchSchedule(kindergartenId, prevById);
}

// ---- Supply ----
function mapSupply(dto: SupplyDTO, comments: SupplyItem["comments"]): SupplyItem {
  return {
    id: dto.id,
    classId: dto.classId,
    title: dto.title,
    body: dto.content ?? "",
    authorName: dto.authorName ?? dto.author,
    createdAt: dto.createdAt,
    dueDate: dto.date,
    comments,
  };
}

/**
 * 준비물 목록과 각 항목의 댓글을 함께 가져옵니다. 백엔드는 댓글을 준비물별로만
 * 조회할 수 있어(`supply/comment/list?supplyId=`) 항목 수만큼 요청이 나갑니다.
 */
export async function fetchSupplies(classId: number): Promise<SupplyItem[]> {
  const list = await apiGet<SupplyDTO[]>("/api/class/supply/list", { classId });
  return Promise.all(
    list.map(async (dto) => {
      const comments = await fetchSupplyComments(dto.id).catch(() => []);
      return mapSupply(dto, comments);
    }),
  );
}

async function fetchSupplyComments(supplyId: number): Promise<SupplyItem["comments"]> {
  const list = await apiGet<SupplyCommentDTO[]>("/api/class/supply/comment/list", { supplyId });
  return list.map((c) => ({
    id: c.id,
    authorName: c.authorName ?? c.author,
    // 댓글 작성자의 대시보드 역할은 서버가 알려주지 않습니다. 표시는 이름으로만 합니다.
    authorRole: "parent" as const,
    text: c.content,
    createdAt: c.createdAt,
  }));
}

export async function createSupplyOnServer(
  classId: number,
  title: string,
  content: string,
  dueDate: string | undefined,
): Promise<SupplyItem[]> {
  await apiPost("/api/class/supply/create", { classId, date: dueDate ?? "", title, content });
  return fetchSupplies(classId);
}

export async function updateSupplyOnServer(
  classId: number,
  supplyId: number,
  title: string,
  content: string,
  dueDate: string | undefined,
): Promise<SupplyItem[]> {
  await apiPost("/api/class/supply/edit", { id: supplyId, date: dueDate ?? "", title, content });
  return fetchSupplies(classId);
}

export async function deleteSupplyOnServer(classId: number, supplyId: number): Promise<SupplyItem[]> {
  await apiPost("/api/class/supply/delete", { id: supplyId });
  return fetchSupplies(classId);
}

export async function createSupplyCommentOnServer(classId: number, supplyId: number, content: string): Promise<SupplyItem[]> {
  await apiPost("/api/class/supply/comment/create", { supplyId, content });
  return fetchSupplies(classId);
}

export async function deleteSupplyCommentOnServer(classId: number, commentId: number): Promise<SupplyItem[]> {
  await apiPost("/api/class/supply/comment/delete", { id: commentId });
  return fetchSupplies(classId);
}

// ---- Photo ----
function mapPhoto(dto: PhotoDTO): PhotoRecord {
  return {
    id: dto.id,
    classId: dto.classId,
    url: dto.url,
    // 서버는 축소본이 없을 때 원본을 대신 내려주므로 경로는 항상 유효합니다. `??`는 이 필드를
    // 아직 모르는 옛 서버를 만났을 때를 위한 것입니다.
    thumbUrl: dto.thumbUrl ?? dto.url,
    caption: dto.caption,
    uploadedBy: dto.authorName ?? dto.author,
    theme: toPhotoTheme(dto.theme),
    takenAt: dto.createdAt,
  };
}

export async function fetchPhotos(classId: number): Promise<PhotoRecord[]> {
  const list = await apiGet<PhotoDTO[]>("/api/class/photo/list", { classId });
  return list.map(mapPhoto);
}

export async function addPhotoOnServer(
  classId: number,
  file: File,
  theme: PhotoThemeId,
  caption: string | undefined,
): Promise<PhotoRecord[]> {
  // 캡션·테마·작성자 모두 업로드 시점에 서버가 저장하므로, 올린 뒤 재조회하면 그대로 돌아옵니다.
  await apiUpload("/api/class/photo/add", { classId, theme, caption }, file);
  return fetchPhotos(classId);
}

export async function updatePhotoOnServer(
  classId: number,
  photoId: number,
  patch: { theme?: PhotoThemeId; caption?: string },
): Promise<PhotoRecord[]> {
  await apiPost("/api/class/photo/edit", { id: photoId, theme: patch.theme, caption: patch.caption });
  return fetchPhotos(classId);
}

export async function deletePhotoOnServer(classId: number, photoId: number): Promise<PhotoRecord[]> {
  await apiPost("/api/class/photo/remove", { id: photoId });
  return fetchPhotos(classId);
}

// ---- Role ----
/**
 * 역할 목록과 각 역할의 권한을 함께 가져옵니다. 권한은 역할별로만 조회할 수 있어
 * (`role/permissions?id=`) 역할 수만큼 요청이 나갑니다.
 */
export async function fetchRoles(kindergartenId: number): Promise<RoleDef[]> {
  const list = await apiGet<RoleDTO[]>("/api/kindergarten/role/list", { kindergartenId });
  return Promise.all(
    list.map(async (dto) => ({
      id: dto.id,
      name: dto.name,
      color: dto.color || ROLE_COLOR_FALLBACK[0],
      permissions: await fetchRolePermissions(dto.id).catch(() => [] as PermissionKey[]),
    })),
  );
}

/** 색상 없이 만들어진 예전 역할을 위한 기본값입니다. */
const ROLE_COLOR_FALLBACK = ["#E879A0", "#60A5FA", "#86EFAC", "#F9D56E", "#C084FC"];

async function fetchRolePermissions(roleId: number): Promise<PermissionKey[]> {
  // 조회인데도 POST입니다(백엔드 `role/permissions`가 @PostMapping).
  const list = await apiPost<BackendPermission[]>("/api/kindergarten/role/permissions", { id: roleId });
  return toPermissionKeys(list ?? []);
}

export async function createRoleOnServer(kindergartenId: number, name: string, color: string): Promise<RoleDef[]> {
  await apiPost("/api/kindergarten/role/create", { id: kindergartenId, name, color });
  return fetchRoles(kindergartenId);
}

export async function renameRoleOnServer(
  kindergartenId: number,
  roleId: number,
  name: string,
  color: string,
): Promise<RoleDef[]> {
  await apiPost("/api/kindergarten/role/rename", { id: roleId, name, color });
  return fetchRoles(kindergartenId);
}

export async function deleteRoleOnServer(kindergartenId: number, roleId: number): Promise<RoleDef[]> {
  await apiPost("/api/kindergarten/role/delete", { id: roleId });
  return fetchRoles(kindergartenId);
}

/**
 * 역할의 권한 묶음을 원하는 상태로 맞춥니다. 백엔드에는 개별 추가/삭제만 있어
 * (`role/permission/add` / `remove`) 차이나는 것만 골라 호출합니다.
 *
 * ⚠️ 권한 편집은 원장(소유자)만 할 수 있습니다 — MANAGE_MEMBER 보유자에게 열어 주면
 * 스스로에게 나머지 권한을 전부 부여할 수 있기 때문입니다.
 */
export async function setRolePermissionsOnServer(
  kindergartenId: number,
  roleId: number,
  current: PermissionKey[],
  next: PermissionKey[],
): Promise<RoleDef[]> {
  const added = next.filter((p) => !current.includes(p));
  const removed = current.filter((p) => !next.includes(p));

  await Promise.all([
    ...added.map((p) => apiPost("/api/kindergarten/role/permission/add", { id: roleId, permission: toBackendPermission(p) })),
    ...removed.map((p) => apiPost("/api/kindergarten/role/permission/remove", { id: roleId, permission: toBackendPermission(p) })),
  ]);
  return fetchRoles(kindergartenId);
}

// ---- Members ----
/**
 * 유치원의 교사 멤버를 서버 관계(RelationshipDTO)에서 그대로 만들어 냅니다.
 * `userName`/`roleIds`가 응답에 들어 있으므로 목업 명단에 기대지 않습니다.
 */
export function toTeacherRecords(
  relationships: RelationshipDTO[],
  classes: ClassRecord[],
  kindergarten: KindergartenRecord,
): TeacherRecord[] {
  const classNameById = new Map(classes.map((c) => [c.id, c.name]));
  return relationships
    .filter((r) => r.type === "TEACHER")
    .map((r) => ({
      id: r.userId,
      name: r.userName ?? r.userId,
      nickname: r.nickname || undefined,
      classId: r.classId,
      className: (r.classId !== undefined ? classNameById.get(r.classId) : undefined) ?? "유치원 소속",
      kindergartenId: kindergarten.id,
      kindergartenName: kindergarten.name,
      // 레거시 단일 roleId만 내려오는 예전 데이터도 함께 받아 줍니다.
      roleIds: r.roleIds ?? (r.roleId ? [r.roleId] : []),
    }));
}

export async function fetchMembers(kindergartenId: number): Promise<RelationshipDTO[]> {
  return apiGet<RelationshipDTO[]>("/api/kindergarten/members", { id: kindergartenId });
}

/**
 * 멤버의 역할을 하나 붙이거나 뗍니다. 한 멤버가 역할을 여러 개 가질 수 있으므로
 * 단일 칼럼을 덮어쓰는 `assign` 대신 집합에 더하고 빼는 `role/assign` / `role/unassign`을 씁니다.
 */
export async function setTeacherRoleOnServer(
  kindergartenId: number,
  teacherId: string,
  roleId: number,
  assigned: boolean,
): Promise<void> {
  const path = assigned ? "/api/kindergarten/role/assign" : "/api/kindergarten/role/unassign";
  await apiPost(path, { id: kindergartenId, userId: teacherId, roleId });
}

/**
 * 유치원 안에서 통용되는 별칭을 서버에 저장합니다(T_RELATIONSHIP.NICKNAME).
 * 계정 전체가 아니라 이 유치원에서만 쓰는 이름이라, 유치원 아이디가 반드시 필요합니다.
 * 아이·교사 모두 관계 한 행이므로 같은 엔드포인트를 씁니다. 본인이면 언제나,
 * 남의 별칭을 바꾸려면 MANAGE_MEMBER가 필요합니다.
 */
export async function setMemberNicknameOnServer(kindergartenId: number, userId: string, nickname: string): Promise<void> {
  await apiPost("/api/kindergarten/setNickname", { id: kindergartenId, userId, nickname });
}

/**
 * 멤버를 반에 넣거나 뺍니다(`classId`를 주지 않으면 반 배정 해제).
 * 아이와 교사 모두 T_RELATIONSHIP의 한 행이라 같은 엔드포인트를 씁니다. MANAGE_CLASS가 필요합니다.
 */
export async function setMemberClassOnServer(
  kindergartenId: number,
  userId: string,
  classId: number | undefined,
): Promise<void> {
  await apiPost("/api/kindergarten/setClass", { id: kindergartenId, userId, classId: classId ?? "" });
}

export async function removeTeacherOnServer(kindergartenId: number, teacherId: string): Promise<void> {
  await apiPost("/api/kindergarten/remove", { id: kindergartenId, userId: teacherId });
}

// ---- Kindergarten / memberships ----
export function mapKindergarten(dto: KindergartenDTO): KindergartenRecord {
  return { id: dto.id, name: dto.name };
}

/** 로그인한 사람이 속한 유치원 관계 전체입니다. 워크스페이스 목록의 원본입니다. */
export async function fetchMemberships(): Promise<RelationshipDTO[]> {
  return apiGet<RelationshipDTO[]>("/api/kindergarten/memberships");
}

export async function fetchKindergarten(id: number): Promise<KindergartenDTO> {
  return apiGet<KindergartenDTO>("/api/kindergarten/info", { id });
}

/** 이름으로 유치원을 찾습니다. 필터는 서버가 합니다(`list?q=`). */
export async function searchKindergartensOnServer(q: string): Promise<KindergartenDTO[]> {
  return apiGet<KindergartenDTO[]>("/api/kindergarten/list", { q });
}

// ---- Invites ----
export async function fetchSentInvites(kindergartenId: number): Promise<InviteDTO[]> {
  return apiGet<InviteDTO[]>("/api/kindergarten/invite/list", { kindergartenId });
}

/** 로그인한 사람 앞으로 온 초대입니다. `kindergartenName`이 함께 와서 별도 조회가 필요 없습니다. */
export async function fetchReceivedInvites(): Promise<InviteDTO[]> {
  return apiGet<InviteDTO[]>("/api/user/invite/list");
}

export async function sendInviteOnServer(
  kindergartenId: number,
  userId: string,
  type: "TEACHER" | "CHILD",
  roleId?: number,
): Promise<void> {
  await apiPost("/api/kindergarten/invite", { id: kindergartenId, userId, type, roleId });
}

export async function cancelInviteOnServer(inviteId: number): Promise<void> {
  await apiPost("/api/kindergarten/invite/cancel", { id: inviteId });
}

export async function acceptInviteOnServer(inviteId: number): Promise<void> {
  await apiPost("/api/kindergarten/invite/accept", { id: inviteId });
}

export async function rejectInviteOnServer(inviteId: number): Promise<void> {
  await apiPost("/api/kindergarten/invite/reject", { id: inviteId });
}

export type { PermissionKey };
