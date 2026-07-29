import type {
  AccountType,
  AuthUser,
  KindergartenInfo,
  StudentGender,
  TeacherRole,
  UserRole,
} from "@/app/auth/types";

/**
 * 백엔드가 붙기 전까지 회원가입/유치원 등록을 흉내 내는 mock 저장소입니다.
 * localStorage에 저장해 새로고침해도 이메일 중복 체크와 유치원 목록이 유지됩니다.
 */

const USERS_KEY = "kindy.mock.users";
const KINDERGARTENS_KEY = "kindy.mock.kindergartens";

interface MockUserRecord {
  id: string;
  name: string;
  email: string;
  /** 성인은 가입 시 입력한 비밀번호, 아동은 아이디 비밀번호입니다. 소셜 가입 계정은 없습니다. */
  password: string;
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
  { id: "kg-seed-1", name: "햇살유치원", zonecode: "06234", address: "서울특별시 강남구 테헤란로 123" },
  { id: "kg-seed-2", name: "햇살유치원", zonecode: "48058", address: "부산광역시 해운대구 centum중앙로 45" },
  { id: "kg-seed-3", name: "무지개유치원", zonecode: "13529", address: "경기도 성남시 분당구 판교역로 231" },
  { id: "kg-seed-4", name: "꿈나무유치원", zonecode: "35240", address: "대전광역시 유성구 대학로 99" },
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

/**
 * 온보딩 등에서 갱신된 사용자 정보를 mock 저장소에 반영합니다.
 * 이걸 빼먹으면 로그아웃 후 다시 로그인했을 때 별칭 같은 값이 사라집니다.
 */
export function updateMockUser(id: string, partial: Partial<MockUserRecord>): void {
  const users = readUsers();
  const index = users.findIndex((u) => u.id === id);
  if (index === -1) return; // 소셜 로그인 등 mock 저장소에 없는 계정입니다.

  users[index] = { ...users[index], ...partial };
  writeUsers(users);
}

export function isEmailTaken(email: string): boolean {
  const normalized = email.trim().toLowerCase();
  return readUsers().some((u) => u.email.toLowerCase() === normalized);
}

export interface SignupPayload {
  name: string;
  /** 성인은 이메일, 아동은 아이디입니다. */
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
export function registerMockUser(payload: SignupPayload): AuthUser {
  const id = crypto.randomUUID();
  const joinedAt = new Date().toISOString();

  const record: MockUserRecord = {
    id,
    name: payload.name,
    email: payload.email,
    password: payload.password,
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
  | { ok: false; reason: "not-found" | "wrong-password" };

/** 아이디/비밀번호로 mock 저장소를 조회합니다. 백엔드가 붙기 전까지 로그인 검증을 흉내 냅니다. */
export function loginMockUser(loginId: string, password: string): MockLoginResult {
  const normalized = loginId.trim().toLowerCase();
  const record = readUsers().find((u) => u.email.toLowerCase() === normalized);
  if (!record) return { ok: false, reason: "not-found" };
  if (record.password !== password) return { ok: false, reason: "wrong-password" };

  return {
    ok: true,
    user: {
      id: record.id,
      name: record.name,
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

/** 유치원 이름으로 검색합니다. 동명 유치원을 구분할 수 있도록 주소도 함께 반환됩니다. */
export function searchKindergartens(query: string): KindergartenInfo[] {
  const normalized = query.trim();
  if (!normalized) return [];
  return readKindergartens().filter((kg) => kg.name.includes(normalized));
}

export interface KindergartenRegisterPayload {
  name: string;
  zonecode: string;
  address: string;
  addressDetail: string;
  businessRegNo: string;
}

export function registerKindergarten(payload: KindergartenRegisterPayload): KindergartenInfo {
  const info: KindergartenInfo = {
    id: crypto.randomUUID(),
    name: payload.name,
    zonecode: payload.zonecode,
    address: payload.address,
    addressDetail: payload.addressDetail,
    businessRegNo: payload.businessRegNo,
  };
  writeKindergartens([...readKindergartens(), info]);
  return info;
}
