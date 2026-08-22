import type { AccountType, AuthUser, KindergartenInfo, StudentGender } from "@/app/auth/types";
import { ApiError, apiGet, apiPost } from "@/app/lib/api";
import type { KindergartenDTO } from "@/app/lib/dto";

/** 회원가입 폼이 모아 서버로 보내는 값입니다. */
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

/**
 * 회원가입 후 곧바로 로그인까지 마칩니다.
 *
 * 실패는 `ApiError`로 던집니다 — 예전처럼 빈 id를 가진 사용자를 돌려주면 호출부가
 * 성공과 구분하지 못한 채 망가진 세션을 만들어 버립니다.
 * 서버가 돌려주는 코드는 DUPLICATE_ID / EMAIL_NOT_VERIFIED / INVALID_PARAMETER 등입니다.
 */
export async function registerUser(payload: SignupPayload): Promise<AuthUser> {
    const joinedAt = new Date().toISOString();

    const isChild = payload.accountType === "child";
    await apiPost("/api/user/create", {
        id: payload.loginId,
        name: payload.name,
        email: payload.email,
        password: payload.password,
        phone: payload.phone,
        accountType: isChild ? "CHILD" : "ADULT",
        // 아동 계정은 주소 대신 법정대리인 정보를 받습니다(서버도 아동에게는 주소를 요구하지 않습니다).
        birthDate: isChild ? payload.birthDate : undefined,
        gender: isChild ? (payload.gender === "male" ? "MALE" : payload.gender === "female" ? "FEMALE" : undefined) : undefined,
        guardianName: isChild ? payload.guardianName : undefined,
        guardianPhone: isChild ? payload.guardianPhone : undefined,
        postcode: isChild ? undefined : payload.zonecode ?? "",
        address: isChild ? undefined : payload.address ?? "",
        addressDetail: isChild ? undefined : payload.addressDetail ?? "",
    });

    // 가입 직후 로그인까지 해 두어야 온보딩에서 유치원 등록/가입을 바로 이어갈 수 있습니다.
    await apiPost("/api/user/login", { id: payload.loginId, password: payload.password });

    return {
        id: payload.loginId,
        name: payload.name,
        loginId: payload.loginId,
        email: payload.email,
        provider: "email",
        // 막 만든 계정이라 연동된 소셜 계정은 아직 없습니다. 마이페이지에서 붙입니다.
        linkedProviders: [],
        joinedAt,
        accountType: payload.accountType,
        birthDate: payload.birthDate,
        gender: payload.gender,
        guardianName: payload.guardianName,
        guardianPhone: payload.guardianPhone,
    };
}

export interface KindergartenRegisterPayload {
    name: string;
    zonecode: string;
    address: string;
    addressDetail: string;
    businessRegNo: string;
}

/**
 * 유치원을 새로 등록하고, 만들어진 유치원 정보를 돌려줍니다.
 * 등록한 사람이 곧 소유자(원장)가 되므로 별도의 가입 요청은 필요 없습니다.
 *
 * `create`가 생성된 행을 id까지 담아 돌려주므로 예전처럼 BRN으로 다시 조회하지 않습니다.
 * 실패는 `ApiError`로 던집니다(DUPLICATE_KEY = 이미 등록된 사업자등록번호).
 */
export async function registerKindergarten(payload: KindergartenRegisterPayload): Promise<KindergartenInfo> {
    const created = await apiPost<KindergartenDTO>("/api/kindergarten/create", {
        name: payload.name,
        brn: payload.businessRegNo,
        address: payload.address,
        addressDetail: payload.addressDetail,
        postcode: payload.zonecode,
    });

    return {
        id: created.id,
        name: created.name ?? payload.name,
        zonecode: created.postcode ?? payload.zonecode,
        address: created.address ?? payload.address,
        addressDetail: created.addressDetail ?? payload.addressDetail,
        businessRegNo: created.brn ?? payload.businessRegNo,
    };
}

/** 사업자등록번호로 이미 등록된 유치원을 찾습니다. 없으면 null입니다. */
export async function findKindergartenByBrn(brn: string): Promise<KindergartenInfo | null> {
    try {
        const dto = await apiGet<KindergartenDTO>("/api/kindergarten/info", { brn });
        return { id: dto.id, name: dto.name, zonecode: dto.postcode, address: dto.address, addressDetail: dto.addressDetail };
    } catch (cause) {
        if (cause instanceof ApiError) return null;
        throw cause;
    }
}