import { apiGet, apiPost, apiUpload } from "@/app/lib/api";
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
 * 백엔드의 생성/수정/삭제 엔드포인트는 대부분 `Void`만 돌려주므로("생성 후 재조회" 패턴),
 * 여기 있는 함수들은 변이 호출 뒤 해당 목록을 다시 받아와 매핑된 배열을 돌려줍니다.
 * DashboardStoreContext는 이 배열로 `setData`만 하면 됩니다.
 *
 * 백엔드 DTO에 없는 필드(공지 배너, 역할 색상, 사진 테마/캡션, 준비물 댓글, 일정
 * 작성자)는 이전 로컬 값을 최대한 보존하되, 서버 재조회 시 사라질 수 있습니다.
 */

// ---- 백엔드 DTO 형태(응답에서 실제로 쓰는 필드만) ----
interface ClassDTO { id: number; kindergartenId: number; name: string }
interface NoticeDTO { id: number; kindergartenId: number; num: number; title: string; content: string; authorName?: string; pinned: boolean; createdAt: number }
interface ScheduleDTO { id: number; kindergartenId: number; date: string; time?: string; title: string; classId?: number; createdAt: number }
interface SupplyDTO { id: number; classId: number; date?: string; title: string; content: string; createdAt: number }
interface PhotoDTO { id: number; classId: number; url: string; createdAt: number }
interface RoleDTO { id: number; kindergartenId: number; name: string }
interface RelationshipDTO {
  kindergartenId: number;
  kindergartenName: string;
  userId: string;
  type: "CHILD" | "TEACHER";
  classId?: number;
  roleId?: number;
  roleName?: string;
  nickname?: string;
}

// ---- Class ----
function mapClass(dto: ClassDTO): ClassRecord {
  return { id: dto.id, name: dto.name, kindergartenId: dto.kindergartenId };
}

export async function fetchClasses(kindergartenId: number): Promise<ClassRecord[]> {
  const list = await apiGet<ClassDTO[]>("/api/class/list", { kindergartenId: kindergartenId });
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
function mapNotice(dto: NoticeDTO, prev: NoticeRecord | undefined): NoticeRecord {
  return {
    id: dto.id,
    num: dto.num,
    kindergartenId: dto.kindergartenId,
    title: dto.title,
    body: dto.content,
    authorName: dto.authorName ?? prev?.authorName ?? "",
    createdAt: dto.createdAt,
    pinned: dto.pinned,
    // 배너 노출 여부는 서버에 저장되는 필드가 아니라, 이전에 로컬에서 켜둔 값을 그대로 이어갑니다.
    bannerEnabled: prev?.bannerEnabled ?? false,
  };
}

export async function fetchNotices(kindergartenId: number, prevById: Map<number, NoticeRecord>): Promise<NoticeRecord[]> {
  const list = await apiGet<NoticeDTO[]>("/api/kindergarten/notice/list", { kindergartenId });
  return list.map((dto) => mapNotice(dto, prevById.get(dto.id)));
}

export async function createNoticeOnServer(
  kindergartenId: number,
  title: string,
  content: string,
  prevById: Map<number, NoticeRecord>,
): Promise<NoticeRecord[]> {
  await apiPost("/api/kindergarten/notice/create", { kindergartenId, title, content, pinned: false });
  return fetchNotices(kindergartenId, prevById);
}

export async function setNoticePinnedOnServer(
  kindergartenId: number,
  notice: NoticeRecord,
  pinned: boolean,
  prevById: Map<number, NoticeRecord>,
): Promise<NoticeRecord[]> {
  // notice/edit은 id가 아니라 유치원별 일련번호(num)로 대상을 찾습니다.
  await apiPost("/api/kindergarten/notice/edit", {
    kindergartenId,
    num: notice.num ?? notice.id,
    title: notice.title,
    content: notice.body,
    pinned,
  });
  return fetchNotices(kindergartenId, prevById);
}

export async function deleteNoticeOnServer(
  kindergartenId: number,
  noticeId: number,
  prevById: Map<number, NoticeRecord>,
): Promise<NoticeRecord[]> {
  await apiPost("/api/kindergarten/notice/delete", { id: noticeId });
  return fetchNotices(kindergartenId, prevById);
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
    // 작성자는 ScheduleDTO에 없는 필드라 서버 재조회 후엔 알 수 없습니다. 이전 값을 유지합니다.
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
function mapSupply(dto: SupplyDTO, prev: SupplyItem | undefined): SupplyItem {
  return {
    id: dto.id,
    classId: dto.classId,
    title: dto.title,
    body: dto.content,
    // 작성자는 SupplyDTO에 없는 필드입니다. 이전 값을 유지합니다.
    authorName: prev?.authorName ?? "",
    createdAt: dto.createdAt,
    dueDate: dto.date,
    // 댓글은 백엔드에 아직 없는 기능이라 로컬에서만 이어갑니다.
    comments: prev?.comments ?? [],
  };
}

export async function fetchSupplies(classId: number, prevById: Map<number, SupplyItem>): Promise<SupplyItem[]> {
  const list = await apiGet<SupplyDTO[]>("/api/class/supply/list", { classId });
  return list.map((dto) => mapSupply(dto, prevById.get(dto.id)));
}

export async function createSupplyOnServer(
  classId: number,
  title: string,
  content: string,
  dueDate: string | undefined,
  prevById: Map<number, SupplyItem>,
): Promise<SupplyItem[]> {
  await apiPost("/api/class/supply/create", { classId, date: dueDate ?? "", title, content });
  return fetchSupplies(classId, prevById);
}

// ---- Photo ----
function mapPhoto(dto: PhotoDTO, prev: PhotoRecord | undefined): PhotoRecord {
  return {
    id: dto.id,
    classId: dto.classId,
    url: dto.url,
    caption: prev?.caption,
    // 업로더/테마는 PhotoDTO에 없는 필드라 로컬에서만 이어갑니다(백엔드 개선 필요).
    uploadedBy: prev?.uploadedBy ?? "",
    theme: prev?.theme ?? "clip",
    takenAt: dto.createdAt,
  };
}

export async function fetchPhotos(classId: number, prevById: Map<number, PhotoRecord>): Promise<PhotoRecord[]> {
  const list = await apiGet<PhotoDTO[]>("/api/class/photo/list", { classId });
  return list.map((dto) => mapPhoto(dto, prevById.get(dto.id)));
}

export async function addPhotoOnServer(
  classId: number,
  file: File,
  uploadedBy: string,
  theme: PhotoThemeId,
  caption: string | undefined,
  prevById: Map<number, PhotoRecord>,
): Promise<PhotoRecord[]> {
  await apiUpload("/api/class/photo/add", { classId }, file);
  const fresh = await fetchPhotos(classId, prevById);
  // 방금 올린 사진(가장 최근 createdAt)에 한해 이번에 고른 테마/작성자/캡션을 로컬로 붙여줍니다.
  if (fresh.length === 0) return fresh;
  const latest = fresh.reduce((a, b) => (a.takenAt >= b.takenAt ? a : b));
  return fresh.map((p) => (p.id === latest.id ? { ...p, uploadedBy, theme, caption } : p));
}

export async function deletePhotoOnServer(classId: number, photoId: number, prevById: Map<number, PhotoRecord>): Promise<PhotoRecord[]> {
  await apiPost("/api/class/photo/remove", { id: photoId });
  return fetchPhotos(classId, prevById);
}

// ---- Role ----
function mapRole(dto: RoleDTO, prev: RoleDef | undefined, colorForIndex: (index: number) => string, index: number): RoleDef {
  return {
    id: dto.id,
    name: dto.name,
    // 색상은 RoleDTO에 없는 필드라 이전 값을 유지하고, 처음 보는 역할이면 순번대로 배정합니다.
    color: prev?.color ?? colorForIndex(index),
    // 권한을 켜고 끄는 백엔드 엔드포인트가 없어(조회용 role/permissions만 존재) 완전히 로컬 상태입니다.
    permissions: prev?.permissions ?? [],
  };
}

const ROLE_COLOR_FALLBACK = ["#E879A0", "#60A5FA", "#86EFAC", "#F9D56E", "#C084FC"];

export async function fetchRoles(kindergartenId: number, prevById: Map<number, RoleDef>): Promise<RoleDef[]> {
  const list = await apiGet<RoleDTO[]>("/api/kindergarten/role/list", { kindergartenId });
  return list.map((dto, i) => mapRole(dto, prevById.get(dto.id), (idx) => ROLE_COLOR_FALLBACK[idx % ROLE_COLOR_FALLBACK.length], i));
}

export async function createRoleOnServer(kindergartenId: number, name: string, prevById: Map<number, RoleDef>): Promise<RoleDef[]> {
  await apiPost("/api/kindergarten/role/create", { id: kindergartenId, name });
  return fetchRoles(kindergartenId, prevById);
}

export async function deleteRoleOnServer(kindergartenId: number, roleId: number, prevById: Map<number, RoleDef>): Promise<RoleDef[]> {
  await apiPost("/api/kindergarten/role/delete", { id: roleId });
  return fetchRoles(kindergartenId, prevById);
}

// ---- Members (kindergarten/members) ----
/**
 * 서버가 아는 교사 멤버십(반/역할/별칭)을 기존 목업 교사 목록에 병합합니다.
 * RelationshipDTO에는 이름이 없어서, 이미 알고 있는(id가 일치하는) 교사에게만
 * 반영합니다 — 목업에 없던 새 멤버는 이름을 알 길이 없어 추가하지 않습니다
 * (members 응답에 표시용 이름을 포함하도록 백엔드 개선이 필요합니다).
 */
export function mergeTeacherMemberships(teachers: TeacherRecord[], relationships: RelationshipDTO[]): TeacherRecord[] {
  const byUserId = new Map(relationships.filter((r) => r.type === "TEACHER").map((r) => [r.userId, r]));
  return teachers.map((t) => {
    const rel = byUserId.get(t.id);
    if (!rel) return t;
    return {
      ...t,
      classId: rel.classId,
      nickname: rel.nickname || t.nickname,
      roleIds: rel.roleId ? [rel.roleId] : [],
    };
  });
}

export async function fetchMembers(kindergartenId: number): Promise<RelationshipDTO[]> {
  return apiGet<RelationshipDTO[]>("/api/kindergarten/members", { id: kindergartenId });
}

export async function assignTeacherRoleOnServer(kindergartenId: number, teacherId: string, roleId: number): Promise<void> {
  await apiPost("/api/kindergarten/assign", { id: kindergartenId, userId: teacherId, roleId });
}

export async function setTeacherNicknameOnServer(kindergartenId: number, teacherId: string, nickname: string): Promise<void> {
  await apiPost("/api/kindergarten/setNickname", { id: kindergartenId, userId: teacherId, nickname });
}

export async function removeTeacherOnServer(kindergartenId: number, teacherId: string): Promise<void> {
  await apiPost("/api/kindergarten/remove", { id: kindergartenId, userId: teacherId });
}

export interface KindergartenDTO {
  id: number;
  name: string;
  brn: string;
  address: string;
  addressDetail: string;
  postcode: string;
}

export async function fetchMemberships(): Promise<{ kindergartenId: number; kindergartenName: string }[]> {
  const list = await apiGet<RelationshipDTO[]>("/api/kindergarten/memberships");
  return list.map((r) => ({ kindergartenId: r.kindergartenId, kindergartenName: r.kindergartenName }));
}

export function mapKindergarten(dto: KindergartenDTO): KindergartenRecord {
  return { id: dto.id, name: dto.name };
}

// re-exported so callers only need to import from this module for role/permission labels
export type { PermissionKey };
