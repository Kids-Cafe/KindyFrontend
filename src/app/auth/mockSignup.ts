import { hashPassword, needsRehash, verifyPassword } from "@/app/auth/passwordHash";
import type {
  AccountType,
  AuthUser,
  KindergartenInfo,
  StudentGender,
  TeacherRole,
  UserRole,
} from "@/app/auth/types";
import { newId } from "@/app/lib/id";

/**
 * 백엔드가 붙기 전까지 회원가입/유치원 등록을 흉내 내는 mock 저장소입니다.
 * localStorage에 저장해 새로고침해도 이메일 중복 체크와 유치원 목록이 유지됩니다.
 *
 * 비밀번호는 PBKDF2 해시로만 보관합니다(`passwordHash.ts`). 브라우저 안에서 도는
 * 검증이라 보안 경계가 되지는 못하지만, 최소한 남의 기기 localStorage에 평문
 * 비밀번호가 남지는 않습니다. 실제 검증은 백엔드가 맡아야 합니다.
 */

const USERS_KEY = "kindy.mock.users";
const KINDERGARTENS_KEY = "kindy.mock.kindergartens";

interface MockUserRecord {
  id: string;
  name: string;
  /** 로그인에 쓰는 아이디입니다. 성인은 이메일과 별개로 정하고, 아동은 이 값이 곧 아이디입니다. */
  loginId: string;
  email: string;
  /** `pbkdf2-sha256$...` 형식의 해시입니다. 소셜 가입 계정은 없습니다. */
  passwordHash: string;
  /**
   * 해싱 도입 이전에 평문으로 저장됐던 값입니다. 읽기 전용이며, 해당 계정이
   * 한 번 로그인에 성공하면 해시로 옮기고 지웁니다. 새로 쓰지 마세요.
   * @deprecated
   */
  password?: string;
  phone: string;
  zonecode: string;
  address: string;
  addressDetail: string;
  joinedAt: string;
  accountType: AccountType;
  birthDate?: string;
  gender?: StudentGender;
  guardianName?: string;
  guardianPhone?: string;
  /** 온보딩에서 정한 별칭/애칭. 온보딩을 마치기 전에는 없습니다. */
  nickname?: string;
  role?: UserRole;
  teacherRole?: TeacherRole;
  kindergarten?: KindergartenInfo;
  onboardingCompleted?: boolean;
}

const SEED_KINDERGARTENS: KindergartenInfo[] = [
  { id: -1, name: "햇살유치원", zonecode: "06234", address: "서울특별시 강남구 테헤란로 123" },
  { id: -2, name: "햇살유치원", zonecode: "48058", address: "부산광역시 해운대구 centum중앙로 45" },
  { id: -3, name: "무지개유치원", zonecode: "13529", address: "경기도 성남시 분당구 판교역로 231" },
  { id: -4, name: "꿈나무유치원", zonecode: "35240", address: "대전광역시 유성구 대학로 99" },
];

function readUsers(): MockUserRecord[] {
  try {
    const raw = localStorage.getItem(USERS_KEY);
    return raw ? (JSON.parse(raw) as MockUserRecord[]) : [];
  } catch {
    return [];
  }
}

function writeUsers(users: MockUserRecord[]): void {
  try {
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
  } catch {
    /* noop */
  }
}

function readKindergartens(): KindergartenInfo[] {
  try {
    const raw = localStorage.getItem(KINDERGARTENS_KEY);
    if (!raw) {
      writeKindergartens(SEED_KINDERGARTENS);
      return SEED_KINDERGARTENS;
    }
    return JSON.parse(raw) as KindergartenInfo[];
  } catch {
    return SEED_KINDERGARTENS;
  }
}

function writeKindergartens(list: KindergartenInfo[]): void {
  try {
    localStorage.setItem(KINDERGARTENS_KEY, JSON.stringify(list));
  } catch {
    /* noop */
  }
}

/** 비밀번호는 이 경로로 못 바꾸게 막습니다. 반드시 `changeMockPassword`를 쓰세요. */
type MockUserProfilePatch = Partial<Omit<MockUserRecord, "id" | "passwordHash" | "password">>;

/**
 * 온보딩 등에서 갱신된 사용자 정보를 mock 저장소에 반영합니다.
 * 이걸 빼먹으면 로그아웃 후 다시 로그인했을 때 별칭 같은 값이 사라집니다.
 */
export function updateMockUser(id: string, partial: MockUserProfilePatch): void {
  const users = readUsers();
  const index = users.findIndex((u) => u.id === id);
  if (index === -1) return; // 소셜 로그인 등 mock 저장소에 없는 계정입니다.

  users[index] = { ...users[index], ...partial };
  writeUsers(users);
}

/** 해시를 새로 계산해 저장합니다. 남아 있던 평문(legacy `password`)도 함께 지웁니다. */
async function writePasswordHash(id: string, password: string): Promise<void> {
  const hash = await hashPassword(password);
  const users = readUsers();
  const index = users.findIndex((u) => u.id === id);
  if (index === -1) return;

  const { password: _legacy, ...rest } = users[index];
  users[index] = { ...rest, passwordHash: hash };
  writeUsers(users);
}

/** 마이페이지의 비밀번호 변경입니다. 현재 비밀번호 확인은 호출부에서 먼저 해야 합니다. */
export async function changeMockPassword(id: string, newPassword: string): Promise<void> {
  await writePasswordHash(id, newPassword);
}

export function isEmailTaken(email: string): boolean {
  const normalized = email.trim().toLowerCase();
  return readUsers().some((u) => u.email.toLowerCase() === normalized);
}

/** 로그인 아이디 중복 여부입니다. 예전 데이터(loginId 없이 email만 있던 계정)도 함께 확인합니다. */
export function isLoginIdTaken(loginId: string): boolean {
  const normalized = loginId.trim().toLowerCase();
  return readUsers().some((u) => (u.loginId ?? u.email).toLowerCase() === normalized);
}

export interface SignupPayload {
  name: string;
  /** 로그인에 쓰는 아이디입니다. */
  loginId: string;
  /** 성인은 실제 이메일, 아동은 아이디와 동일한 값을 넣습니다. */
  email: string;
  password: string;
  phone: string;
  /** 성인 가입에서만 씁니다. */
  zonecode?: string;
  address?: string;
  addressDetail?: string;
  accountType: AccountType;
  /** 아동 가입에서만 씁니다. */
  birthDate?: string;
  gender?: StudentGender;
  guardianName?: string;
  guardianPhone?: string;
}

/** mock 계정을 만들어 AuthUser로 돌려줍니다. 세션 반영은 호출부(AuthContext.setSession)에서 합니다. */
export async function registerMockUser(payload: SignupPayload): Promise<AuthUser> {
  const id = newId();
  const joinedAt = new Date().toISOString();

  const record: MockUserRecord = {
    id,
    name: payload.name,
    loginId: payload.loginId,
    email: payload.email,
    passwordHash: await hashPassword(payload.password),
    phone: payload.phone,
    zonecode: payload.zonecode ?? "",
    address: payload.address ?? "",
    addressDetail: payload.addressDetail ?? "",
    joinedAt,
    accountType: payload.accountType,
    birthDate: payload.birthDate,
    gender: payload.gender,
    guardianName: payload.guardianName,
    guardianPhone: payload.guardianPhone,
  };
  writeUsers([...readUsers(), record]);

  return {
    id,
    name: payload.name,
    loginId: payload.loginId,
    email: payload.email,
    provider: "email",
    joinedAt,
    accountType: payload.accountType,
    birthDate: payload.birthDate,
    gender: payload.gender,
    guardianName: payload.guardianName,
    guardianPhone: payload.guardianPhone,
  };
}

export type MockLoginResult =
  | { ok: true; user: AuthUser }
  | { ok: false; reason: "not-found" | "wrong-password" | "crypto-unavailable" };

/** 저장된 자격증명과 대조합니다. 평문으로 남아 있던 예전 계정도 여기서 받아줍니다. */
async function matchesPassword(record: MockUserRecord, password: string): Promise<boolean> {
  if (record.passwordHash) return verifyPassword(password, record.passwordHash);
  // 해싱 도입 이전에 만들어진 계정입니다. 아래에서 해시로 옮깁니다.
  return record.password !== undefined && record.password === password;
}

/** 아이디/비밀번호로 mock 저장소를 조회합니다. 백엔드가 붙기 전까지 로그인 검증을 흉내 냅니다. */
export async function loginMockUser(loginId: string, password: string): Promise<MockLoginResult> {
  const normalized = loginId.trim().toLowerCase();
  const record = readUsers().find((u) => (u.loginId ?? u.email).toLowerCase() === normalized);
  if (!record) return { ok: false, reason: "not-found" };

  let matched: boolean;
  try {
    matched = await matchesPassword(record, password);
  } catch {
    // 보안 컨텍스트가 아니라 WebCrypto를 못 쓰는 경우입니다. 실패와 구분해서 알려줍니다.
    return { ok: false, reason: "crypto-unavailable" };
  }
  if (!matched) return { ok: false, reason: "wrong-password" };

  // 평문으로 저장돼 있었거나 반복 횟수가 낮은 계정을 지금 기준으로 다시 해싱합니다.
  if (!record.passwordHash || needsRehash(record.passwordHash)) {
    await writePasswordHash(record.id, password).catch(() => {
      /* 마이그레이션 실패는 로그인 자체를 막을 이유가 아닙니다. */
    });
  }

  return {
    ok: true,
    user: {
      id: record.id,
      name: record.name,
      loginId: record.loginId ?? record.email,
      email: record.email,
      provider: "email",
      joinedAt: record.joinedAt,
      accountType: record.accountType,
      birthDate: record.birthDate,
      gender: record.gender,
      guardianName: record.guardianName,
      guardianPhone: record.guardianPhone,
      nickname: record.nickname,
      role: record.role,
      teacherRole: record.teacherRole,
      kindergarten: record.kindergarten,
      onboardingCompleted: record.onboardingCompleted,
    },
  };
}

export interface UserSearchResult {
  id: string;
  name: string;
  loginId: string;
  accountType: AccountType;
  role?: UserRole;
  teacherRole?: TeacherRole;
  kindergartenId?: number;
  kindergartenName?: string;
}

/**
 * 아이디로 가입된 계정을 찾습니다. 원장이 "초대"할 대상을 특정할 때 씁니다.
 * 비밀번호 등 민감 정보는 결과에 포함하지 않습니다.
 */
export function searchUsersByLoginId(query: string): UserSearchResult[] {
  const normalized = query.trim().toLowerCase();
  if (!normalized) return [];
  return readUsers()
    .filter((u) => (u.loginId ?? u.email).toLowerCase().includes(normalized))
    .map((u) => ({
      id: u.id,
      name: u.name,
      loginId: u.loginId ?? u.email,
      accountType: u.accountType,
      role: u.role,
      teacherRole: u.teacherRole,
      kindergartenId: u.kindergarten?.id,
      kindergartenName: u.kindergarten?.name,
    }));
}

interface KindergartenListDTO {
  id: number;
  name: string;
  brn: string;
  address: string;
  addressDetail: string;
  postcode: string;
}

/**
 * 유치원 이름으로 검색합니다. 백엔드 `/api/kindergarten/list`에는 필터 파라미터가 없어
 * 전체 목록을 받아 이름으로 걸러냅니다(유치원 수가 많아지면 서버에 검색 파라미터를
 * 추가하는 게 낫습니다). 실패하면(백엔드가 없는 환경 등) 목업 목록으로 대신합니다.
 */
export async function searchKindergartens(query: string): Promise<KindergartenInfo[]> {
  const normalized = query.trim();
  if (!normalized) return [];
  try {
    const res = await fetch("/api/kindergarten/list", { method: "GET", credentials: "include" });
    const body = await res.json();
    if (body.status !== "success") throw new Error(body.code);
    const list = body.data as KindergartenListDTO[];
    return list
      .filter((kg) => kg.name.includes(normalized))
      .map((kg) => ({ id: kg.id, name: kg.name, zonecode: kg.postcode, address: kg.address, addressDetail: kg.addressDetail, businessRegNo: kg.brn }));
  } catch {
    return readKindergartens().filter((kg) => kg.name.includes(normalized));
  }
}

export function getKindergartenById(id: number): KindergartenInfo | undefined {
  return readKindergartens().find((kg) => kg.id === id);
}

/**
 * 원장/교사/학부모/아이 화면을 한 계정에서 전부 둘러보기 위한 통합 데모 계정입니다.
 * 이 아이디로 로그인하면 좌측 서버 레일에 역할별 워크스페이스 4개가 나란히 뜹니다
 * (`DashboardStoreContext`의 `DEMO_ROLE_WORKSPACES`).
 */
export const DEMO_ALL_ROLES_LOGIN_ID = "demo";

/** 통합 데모 계정으로 로그인한 상태인지 확인합니다. */
export function isAllRolesDemoUser(user: Pick<AuthUser, "loginId" | "provider">): boolean {
  // 개발 빌드에서만 심는 계정이므로 프로덕션에서는 항상 false여야 합니다.
  if (!import.meta.env.DEV) return false;
  return user.provider === "email" && user.loginId === DEMO_ALL_ROLES_LOGIN_ID;
}

/** 햇살유치원(강남) 데모 계정들의 아이디입니다. 이미 심어져 있는지 확인할 때도 이 값을 씁니다. */
export const DEMO_ACCOUNT_LOGIN_IDS = ["parent", "teacher2", "teacher1", "kid", DEMO_ALL_ROLES_LOGIN_ID] as const;

/**
 * 개발/데모용으로 햇살유치원(강남) 소속 학부모·교사·원장·아이 계정을 한 번에 심어줍니다.
 * 이미 심어져 있으면(로그인 아이디가 겹치면) 아무 것도 하지 않는 멱등 함수입니다.
 * 비밀번호는 전부 "1234"이며, 회원가입 폼의 비밀번호 규칙(8자 이상 등)은 mock 저장소에는
 * 적용되지 않으므로 그대로 로그인할 수 있습니다.
 *
 * ⚠️ 누구나 아는 비밀번호를 가진 원장 계정이 생기므로 개발 빌드에서만 호출해야 합니다.
 * 호출부(main.tsx)가 `import.meta.env.DEV`로 감싸고, 여기서도 한 번 더 막습니다.
 */
export async function seedDemoAccounts(): Promise<void> {
  if (!import.meta.env.DEV) return;

  const existing = readUsers();
  const already = new Set(existing.map((u) => (u.loginId ?? u.email).toLowerCase()));
  if (DEMO_ACCOUNT_LOGIN_IDS.every((id) => already.has(id))) return;

  const kindergarten: KindergartenInfo = { id: -1, name: "햇살유치원", zonecode: "06234", address: "서울특별시 강남구 테헤란로 123" };
  const joinedAt = new Date().toISOString();
  // 계정들이 같은 비밀번호를 쓰더라도 솔트가 달라 해시는 각각 달라집니다.
  const [parentPw, teacherPw, directorPw, kidPw, allRolesPw] = await Promise.all(
    Array.from({ length: 5 }, () => hashPassword("1234")),
  );

  const demoUsers: MockUserRecord[] = [
    {
      id: "demo-haesal-parent",
      name: "이학부모",
      loginId: "parent",
      email: "haesal.parent@kindy.demo",
      passwordHash: parentPw,
      phone: "010-1111-1111",
      zonecode: kindergarten.zonecode,
      address: kindergarten.address,
      addressDetail: "101동 101호",
      joinedAt,
      accountType: "adult",
      nickname: "학부모",
      role: "parent",
      kindergarten,
      onboardingCompleted: true,
    },
    {
      id: "demo-haesal-teacher",
      name: "박선생",
      loginId: "teacher2",
      email: "haesal.teacher@kindy.demo",
      passwordHash: teacherPw,
      phone: "010-2222-2222",
      zonecode: kindergarten.zonecode,
      address: kindergarten.address,
      addressDetail: "",
      joinedAt,
      accountType: "adult",
      nickname: "박선생님",
      role: "teacher",
      teacherRole: "teacher",
      kindergarten,
      onboardingCompleted: true,
    },
    {
      id: "demo-haesal-director",
      name: "최원장",
      loginId: "teacher1",
      email: "haesal.director@kindy.demo",
      passwordHash: directorPw,
      phone: "010-3333-3333",
      zonecode: kindergarten.zonecode,
      address: kindergarten.address,
      addressDetail: "",
      joinedAt,
      accountType: "adult",
      nickname: "최원장님",
      role: "teacher",
      teacherRole: "director",
      kindergarten: { ...kindergarten, businessRegNo: "123-45-67890" },
      onboardingCompleted: true,
    },
    {
      id: "demo-haesal-kid",
      name: "김아이",
      loginId: "kid",
      email: "haesal_kid",
      passwordHash: kidPw,
      phone: "010-1111-1111",
      zonecode: "",
      address: "",
      addressDetail: "",
      joinedAt,
      accountType: "child",
      birthDate: "2020-05-15",
      gender: "male",
      guardianName: "이학부모",
      guardianPhone: "010-1111-1111",
      nickname: "하늘이",
      kindergarten,
      onboardingCompleted: true,
    },
    {
      // 역할 4종을 한 계정에서 오가며 보기 위한 검수용 계정입니다.
      // 계정 자체는 원장으로 두고, 나머지 역할은 워크스페이스로 붙입니다.
      id: "demo-haesal-all-roles",
      name: "김데모",
      loginId: DEMO_ALL_ROLES_LOGIN_ID,
      email: "haesal.demo@kindy.demo",
      passwordHash: allRolesPw,
      phone: "010-0000-0000",
      zonecode: kindergarten.zonecode,
      address: kindergarten.address,
      addressDetail: "",
      joinedAt,
      accountType: "adult",
      nickname: "데모",
      role: "teacher",
      teacherRole: "director",
      kindergarten: { ...kindergarten, businessRegNo: "123-45-67890" },
      onboardingCompleted: true,
    },
  ];

  const withoutDemoDuplicates = existing.filter((u) => !DEMO_ACCOUNT_LOGIN_IDS.includes((u.loginId ?? u.email) as (typeof DEMO_ACCOUNT_LOGIN_IDS)[number]));
  writeUsers([...withoutDemoDuplicates, ...demoUsers]);

  if (!readKindergartens().some((kg) => kg.id === kindergarten.id)) {
    writeKindergartens([...readKindergartens(), kindergarten]);
  }
}
