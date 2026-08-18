/**
 * 백엔드(org.kidscafe.kindy)의 DTO를 그대로 옮겨 놓은 타입들입니다.
 *
 * 여기 있는 필드는 전부 서버가 실제로 내려주는 값입니다. 화면용 타입
 * (`@/app/dashboard/types`)과 분리해 두어야, 서버가 모르는 필드를 실수로
 * "서버에서 온 값"처럼 다루는 일이 생기지 않습니다.
 *
 * 모든 응답은 `ResultDTO<T>` 봉투에 담겨 오고, 껍데기는 `@/app/lib/api`가 벗깁니다.
 */

export type RelationshipType = "CHILD" | "TEACHER";

/** RoleDTO.Permission. 백엔드가 아는 권한은 이 다섯 가지가 전부입니다. */
export type BackendPermission =
  | "MANAGE_NOTICE"
  | "MANAGE_CLASS"
  | "MANAGE_MEMBER"
  | "MANAGE_SCHEDULE"
  | "MANAGE_SUPPLY";

export interface KindergartenDTO {
  id: number;
  name: string;
  /** 사업자등록번호. 소속 멤버에게만 내려옵니다(외부인은 `list`와 같은 공개 필드만). */
  brn?: string;
  /** 소유자(원장) 아이디. 소속 멤버에게만 내려옵니다. */
  owner?: string;
  address?: string;
  addressDetail?: string;
  postcode?: string;
  createdAt?: number;
  updatedAt?: number;
}

export interface ClassDTO {
  id: number;
  kindergartenId: number;
  name: string;
}

export interface RelationshipDTO {
  kindergartenId: number;
  kindergartenName?: string;
  userId: string;
  /** 표시용 실명입니다. */
  userName?: string;
  type: RelationshipType;
  classId?: number;
  /**
   * T_RELATIONSHIP의 레거시 단일 역할 칼럼입니다. `assign`이 아직 여기에 쓰지만,
   * 권한 판정의 기준은 `roleIds`입니다.
   * @deprecated `roleIds`를 쓰세요.
   */
  roleId?: number;
  roleName?: string;
  /** 이 멤버가 가진 역할 전체입니다(T_RELATIONSHIP_ROLE). */
  roleIds?: number[];
  nickname?: string;
  createdAt?: number;
  updatedAt?: number;
  /** `kindergarten/has`만 채워 줍니다. */
  exists?: boolean;
}

export interface RoleDTO {
  id: number;
  kindergartenId: number;
  name: string;
  color?: string;
}

export interface NoticeDTO {
  id: number;
  kindergartenId: number;
  /** 유치원별 일련번호입니다. `notice/edit`은 id가 아니라 이 값으로 대상을 찾습니다. */
  num: number;
  title: string;
  content: string;
  author: string;
  authorName?: string;
  pinned: boolean;
  bannerEnabled: boolean;
  createdAt: number;
  updatedAt?: number;
}

export interface ScheduleDTO {
  id: number;
  kindergartenId: number;
  /** YYYY-MM-DD */
  date: string;
  time?: string;
  title: string;
  classId?: number;
  createdAt: number;
  updatedAt?: number;
}

export interface SupplyDTO {
  id: number;
  classId: number;
  date?: string;
  title: string;
  content?: string;
  author: string;
  authorName?: string;
  createdAt: number;
  updatedAt?: number;
}

export interface SupplyCommentDTO {
  id: number;
  supplyId: number;
  author: string;
  authorName?: string;
  content: string;
  createdAt: number;
}

export interface PhotoDTO {
  id: number;
  classId: number;
  url: string;
  caption?: string;
  /** clip / polaroid / frame-wood / frame-gold */
  theme?: string;
  author: string;
  authorName?: string;
  createdAt: number;
}

export type InviteDirection = "INVITE" | "JOIN";
export type InviteStatus = "PENDING" | "ACCEPTED" | "REJECTED" | "CANCELED";

export interface InviteDTO {
  id: number;
  kindergartenId: number;
  kindergartenName?: string;
  /** 초대받은(또는 가입 요청한) 사람입니다. */
  userId: string;
  /** 초대를 보낸 사람입니다. `direction`이 JOIN이면 userId와 같습니다. */
  inviterId?: string;
  type: RelationshipType;
  roleId?: number;
  direction: InviteDirection;
  status: InviteStatus;
  createdAt: number;
  updatedAt?: number;
}

export type DiaryMood = "happy" | "excited" | "calm" | "sad" | "upset";

export interface DiaryDTO {
  id: number;
  userId: string;
  /** YYYY-MM-DD. 사용자당 날짜 하나가 곧 일기 하나입니다. */
  date: string;
  mood?: DiaryMood;
  title?: string;
  /** 카드에 보여주는 AI 요약입니다. */
  summary?: string;
  /** 일기 본문(T_DIARY.CONTENT). */
  text?: string;
  tags?: string[];
  createdAt: number;
}

export type ReportCategoryDTO = "FOOD" | "HEALTH" | "FRIENDSHIP" | "PERSONALITY" | "LEARNING";

export interface ReportDTO {
  childId: string;
  category: ReportCategoryDTO;
  /** 카테고리별 JSON 문자열입니다. 서버는 내용을 검증하지 않고 그대로 저장/반환합니다. */
  data: string;
  createdAt?: number;
  updatedAt?: number;
}

export interface ParentNoteDTO {
  id: number;
  childId: string;
  author: string;
  authorName?: string;
  content: string;
  createdAt: number;
}

export interface ParentNoteCommentDTO {
  id: number;
  noteId: number;
  author: string;
  authorName?: string;
  content: string;
  createdAt: number;
}

export interface FamilyDTO {
  parent: string;
  child: string;
  createdAt?: number;
}

export interface ChatDTO {
  id: number;
  kindergartenId: number;
  /** 대화의 두 당사자입니다. 이 둘만 읽고 쓸 수 있습니다. */
  host: string;
  client: string;
  createdAt: number;
}

export type ChatMessageType = "TEXT" | "FOOD" | "HEALTH" | "FRIEND" | "PERSONALITY" | "STUDY";
export type ChatMessageRole = "user" | "assistant" | "system" | "tool";

export interface ChatMessageDTO {
  chatId: number;
  /** 채팅 안에서의 순번입니다. DB가 매기므로 동시 전송에도 충돌하지 않습니다. */
  num: number;
  type: ChatMessageType;
  content: string;
  role: ChatMessageRole;
  createdAt: number;
}

/** `/api/user/info`가 돌려주는 복호화된 사용자 정보입니다(UserDTO.PlainUserDTO). */
export interface PlainUserDTO {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  addressDetail?: string;
  postcode?: string;
  accountType?: "ADULT" | "CHILD";
  birthDate?: string;
  gender?: "MALE" | "FEMALE";
  guardianName?: string;
  guardianPhone?: string;
  onboardingCompleted?: boolean;
  createdAt?: number;
  updatedAt?: number;
}
