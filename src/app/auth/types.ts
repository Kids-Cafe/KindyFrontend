/**
 * 소셜 로그인 도메인 타입 정의입니다.
 * 백엔드가 붙기 전까지는 이 타입들이 프론트 내부 계약 역할을 합니다.
 */

/** 지원하는 소셜 로그인 제공자 식별자입니다. */
export type SocialProviderId = "kakao" | "naver" | "google" | "apple";

/** 학부모/선생님 역할 구분입니다. 온보딩 첫 단계에서 선택합니다. */
export type UserRole = "parent" | "teacher";

/** 선생님 계정의 세부 역할입니다. */
export type TeacherRole = "director" | "teacher";

/** 회원가입 시 구분하는 계정 유형입니다. 성인은 본인이 직접, 아동은 법정대리인 동의를 거쳐 가입합니다. */
export type AccountType = "adult" | "child";

/** 아동 계정의 학생 성별입니다. */
export type StudentGender = "male" | "female";

/** 유치원 정보입니다. 원장은 직접 등록하고, 일반 교사는 검색해서 선택합니다. */
export interface KindergartenInfo {
  id: number;
  name: string;
  zonecode?: string;
  address?: string;
  addressDetail?: string;
  /** 원장이 등록할 때만 있습니다. */
  businessRegNo?: string;
}

/** 로그인한 사용자 정보입니다. 실제 서비스에서는 백엔드 응답으로 채워집니다. */
export interface AuthUser {
  id: string;
  name: string;
  email: string;
  /** 로그인에 사용하는 아이디. 이메일 직접 가입 계정만 있습니다. */
  loginId?: string;
  /** 프로필 이미지 URL. 없으면 이름 첫 글자로 아바타를 그립니다. */
  avatarUrl?: string;
  /** 이 계정이 어떤 소셜 제공자로 로그인했는지. 이메일 직접 가입은 "email"입니다. */
  provider: SocialProviderId | "email";
  /** ISO 8601 문자열 */
  joinedAt: string;
  /** 온보딩에서 정한 별칭/애칭 */
  nickname?: string;
  role?: UserRole;
  teacherRole?: TeacherRole;
  kindergarten?: KindergartenInfo;
  /** 온보딩 위저드를 끝까지 마쳤는지 */
  onboardingCompleted?: boolean;
  /** 성인 회원가입인지 법정대리인 동의를 거친 아동 회원가입인지 */
  accountType?: AccountType;
  /** 아동 계정의 생년월일 (YYYY-MM-DD) */
  birthDate?: string;
  /** 아동 계정의 학생 성별 */
  gender?: StudentGender;
  /** 아동 계정 가입 시 인증한 법정대리인 이름 */
  guardianName?: string;
  /** 아동 계정 가입 시 등록한 법정대리인 연락처 (비밀번호 재발급용) */
  guardianPhone?: string;
  /** 마이페이지에서 등록/수정하는 연락처 */
  phone?: string;
  /** 마이페이지에서 등록/수정하는 자택 주소 */
  address?: string;
  addressDetail?: string;
  zonecode?: string;
}

/** localStorage에 저장되는 세션 형태입니다. */
export interface AuthSession {
  user: AuthUser;
  accessToken: string;
  /** epoch milliseconds. 지나면 만료로 간주하고 세션을 버립니다. */
  expiresAt: number;
}

/** 인가 서버에서 돌아왔을 때 URL에 실려 오는 값들입니다. */
export interface OAuthCallbackParams {
  code: string | null;
  state: string | null;
  error: string | null;
  errorDescription: string | null;
}

/** 리다이렉트 직전에 sessionStorage에 저장해 두는 진행 중 요청 정보입니다. */
export interface PendingAuthRequest {
  provider: SocialProviderId;
  state: string;
  /** PKCE를 쓰는 제공자만 값이 있습니다. */
  codeVerifier?: string;
  /** 로그인 후 돌아갈 경로 */
  returnTo: string;
  /** 요청 시각(epoch ms). 너무 오래된 요청은 무효 처리합니다. */
  createdAt: number;
}
