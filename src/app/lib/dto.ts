/**
 * 백엔드(org.kidscafe.kindy)의 DTO를 그대로 옮겨 놓은 타입들입니다.
 *
 * 여기 있는 필드는 전부 서버가 실제로 내려주는 값입니다. 화면용 타입
 * (`@/app/dashboard/types`)과 분리해 두어야, 서버가 모르는 필드를 실수로
 * "서버에서 온 값"처럼 다루는 일이 생기지 않습니다.
 *
 * 모든 응답은 `ResultDTO<T>` 봉투에 담겨 오고, 껍데기는 `@/app/lib/api`가 벗깁니다.
 */

/**
 * 유치원 멤버십의 종류입니다. **학부모는 여기 없습니다** — 학부모는 유치원의 멤버가
 * 아니라 T_FAMILY로 아이와 이어진 사람이고, 서버가 그 연결을 타고 아이의 유치원을
 * 함께 내려줍니다. 서버는 `TYPE='CHILD'`는 CHILD 계정, `TYPE='TEACHER'`는 ADULT 계정만
 * 갖도록 강제하므로, 이 값과 `AccountType`은 언제나 짝이 맞습니다.
 */
export type RelationshipType = "CHILD" | "TEACHER";

/** `T_USER.ACCOUNT_TYPE`입니다. 화면 쪽 소문자 표기(`@/app/auth/types`)와는 다릅니다. */
export type AccountType = "ADULT" | "CHILD";

/** RoleDTO.Permission. 백엔드가 아는 권한은 이 여섯 가지가 전부입니다. */
export type BackendPermission =
  | "MANAGE_NOTICE"
  | "MANAGE_CLASS"
  | "MANAGE_MEMBER"
  | "MANAGE_SCHEDULE"
  | "MANAGE_SUPPLY"
  | "MANAGE_PHOTO";

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
  /** 조회용 경로(`/api/class/photo/raw?id=…`)입니다. 서버가 매 요청마다 열람 권한을 다시 봅니다. */
  url: string;
  /** 같은 사진의 축소본입니다. 축소본이 없는 형식(WebP)이면 서버가 원본을 그대로 돌려줍니다. */
  thumbUrl?: string;
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
  /** `userId`의 실명입니다. */
  userName?: string;
  /**
   * `userId`의 계정 유형입니다. `type`만으로는 아이 본인의 신청과 어른의 신청을 구별할 수
   * 없어서(둘 다 CHILD), 목록이 "아이 · 학부모"라고 뭉뚱그릴 수밖에 없었습니다.
   */
  accountType?: AccountType;
  /**
   * 티켓을 낸 사람입니다. JOIN이면 보통 신청자 본인이지만, 보호자가 아이를 대신해
   * 신청했으면 보호자입니다.
   */
  inviterId?: string;
  /** `inviterId`의 실명입니다. */
  inviterName?: string;
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

export type FamilyInviteStatus = "PENDING" | "ACCEPTED" | "REJECTED" | "CANCELED";

/**
 * 부모↔아이 연결 요청입니다(T_FAMILY_INVITE). 수락되면 그때 `FamilyDTO` 행이 생깁니다.
 *
 * `InviteDTO`와 달리 방향(direction) 필드가 없습니다. 요청을 만드는 경우가 셋이고
 * (부모가 될 사람 / 아이 본인 / 기존 보호자의 공동 양육자 제안) 두 값짜리 enum으로는
 * 셋째를 담을 수 없어서, `requesterId`를 `parent`·`child`와 비교해 판별합니다.
 */
export interface FamilyInviteDTO {
  id: number;
  parent: string;
  child: string;
  requesterId: string;
  parentName?: string;
  childName?: string;
  requesterName?: string;
  status: FamilyInviteStatus;
  /**
   * 이 목록을 받은 계정이 이 건을 수락/거절할 수 있는지. 승인 규칙은 아이의 현재 보호자
   * 목록을 봐야 정해지는데 클라이언트에는 그 정보가 없으므로, 서버가 계산해 내려줍니다.
   */
  canRespond?: boolean;
  createdAt: number;
  updatedAt?: number;
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
  /**
   * 이 메시지를 쓴 사람의 userId입니다.
   *
   * `role`만으로는 알 수 없습니다 — 아이 ↔ AI 대화는 host와 client가 같은 사람이라
   * user/assistant로 갈리지만, **사람 둘의 대화는 전부 `user`**라 누가 썼는지 역할이
   * 말해 주지 않습니다. 서버가 세션에서 찍으므로 위조할 수 없습니다.
   *
   * 없을 수 있습니다: AI가 한 말(`assistant`)에는 쓴 사람이 없고, 이 칼럼이 생기기 전에
   * 저장된 메시지는 작성자를 되살릴 수 없어 비워 둡니다.
   */
  author?: string;
  /** 화면에 쓸 작성자 이름입니다(원별 별명 우선, 없으면 실명). 서버가 채워 줍니다. */
  authorName?: string;
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
  accountType?: AccountType;
  birthDate?: string;
  /** 서버 칼럼은 세 값입니다. 화면의 `StudentGender`는 둘뿐이라 UNSPECIFIED는 undefined로 옮깁니다. */
  gender?: "MALE" | "FEMALE" | "UNSPECIFIED";
  guardianName?: string;
  guardianPhone?: string;
  onboardingCompleted?: boolean;
  createdAt?: number;
  updatedAt?: number;
  /**
   * 이 계정에 연동된 소셜 제공자들(소문자). 본인 프로필을 조회할 때만 옵니다 —
   * `userId`를 넘겨 아이 정보를 볼 때는 서버가 이 값을 빼고 보냅니다.
   */
  linkedProviders?: string[];
}
