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
  /**
   * 지금 이 세션에 **어떤 방법으로 로그인했는지**입니다. 아이디/비밀번호로 들어왔으면
   * "email"이고, 소셜 로그인으로 들어왔으면 그 제공자입니다. 아바타 배지 표시용이며,
   * 계정에 무엇이 연동돼 있는지는 아래 `linkedProviders`가 따로 답합니다.
   */
  provider: SocialProviderId | "email";
  /**
   * 이 계정에 연동된 소셜 제공자 목록입니다. 서버(`user/info`)가 내려줍니다.
   *
   * 가입은 언제나 이메일과 비밀번호로 하고 소셜은 나중에 덧붙이는 로그인 수단이라,
   * 이 배열은 비어 있을 수 있고 여러 개일 수도 있습니다. "로그인한 방법"(`provider`)과
   * 헷갈리지 마세요 — 카카오로 로그인했더라도 구글이 함께 연동돼 있을 수 있습니다.
   */
  linkedProviders: SocialProviderId[];
  /** ISO 8601 문자열 */
  joinedAt: string;
  /**
   * 별칭은 계정이 아니라 유치원마다 따로 정합니다(T_RELATIONSHIP.NICKNAME).
   * 그래서 여기에는 없습니다 — 지금 보고 있는 유치원에서 불리는 이름은
   * `useDisplayName()`(대시보드 스토어의 `myNickname`)에서 가져옵니다.
   */
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

/**
 * localStorage에 저장되는 세션 형태입니다.
 *
 * 토큰이 없다는 점에 주의하세요. 진짜 인증은 서버가 준 세션 쿠키가 쥐고 있고, 여기 있는
 * 것은 화면을 그리기 위한 사본입니다. 예전에는 `accessToken` 자리가 있었지만 서버가
 * 토큰을 발급하지 않아서 클라이언트가 가짜 값을 지어 넣고 아무 데도 보내지 않았습니다.
 */
export interface AuthSession {
  user: AuthUser;
  /** epoch milliseconds. 지나면 만료로 간주하고 세션을 버립니다. */
  expiresAt: number;
}
