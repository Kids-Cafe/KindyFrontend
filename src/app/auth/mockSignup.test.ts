import { beforeEach, describe, expect, it } from "vitest";
import {
  changeMockPassword,
  isEmailTaken,
  isLoginIdTaken,
  loginMockUser,
  registerMockUser,
  updateMockUser,
} from "@/app/auth/mockSignup";

const USERS_KEY = "kindy.mock.users";

const SIGNUP = {
  name: "김하늘",
  loginId: "haneul",
  email: "haneul@kindy.test",
  password: "kindy1234",
  phone: "010-1234-5678",
  zonecode: "06234",
  address: "서울특별시 강남구 테헤란로 123",
  addressDetail: "101동 101호",
  accountType: "adult" as const,
};

/** 저장소를 직접 들여다봐 평문이 남았는지 확인할 때 씁니다. */
function readRawUsers(): Record<string, unknown>[] {
  return JSON.parse(localStorage.getItem(USERS_KEY) ?? "[]");
}

beforeEach(() => {
  localStorage.clear();
});

describe("registerMockUser", () => {
  it("가입한 계정으로 로그인할 수 있다", async () => {
    await registerMockUser(SIGNUP);

    const result = await loginMockUser("haneul", "kindy1234");
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.user.name).toBe("김하늘");
  });

  it("비밀번호를 평문으로 저장하지 않는다", async () => {
    await registerMockUser(SIGNUP);

    const [record] = readRawUsers();
    expect(record.password).toBeUndefined();
    expect(record.passwordHash).toMatch(/^pbkdf2-sha256\$/);
    expect(JSON.stringify(record)).not.toContain("kindy1234");
  });

  it("아이디는 대소문자를 구분하지 않고 중복으로 본다", async () => {
    await registerMockUser(SIGNUP);

    expect(isLoginIdTaken("HANEUL")).toBe(true);
    expect(isEmailTaken("HANEUL@KINDY.TEST")).toBe(true);
    expect(isLoginIdTaken("haneul2")).toBe(false);
  });
});

describe("loginMockUser", () => {
  beforeEach(async () => {
    await registerMockUser(SIGNUP);
  });

  it("아이디 대소문자와 앞뒤 공백을 무시한다", async () => {
    await expect(loginMockUser("  HANEUL  ", "kindy1234")).resolves.toMatchObject({ ok: true });
  });

  it("비밀번호가 틀리면 실패한다", async () => {
    await expect(loginMockUser("haneul", "wrong-password")).resolves.toEqual({
      ok: false,
      reason: "wrong-password",
    });
  });

  it("없는 아이디는 not-found로 구분한다", async () => {
    await expect(loginMockUser("nobody", "kindy1234")).resolves.toEqual({ ok: false, reason: "not-found" });
  });
});

describe("평문 비밀번호 마이그레이션", () => {
  /** 해싱을 도입하기 전 형식(평문 password)으로 저장된 계정을 흉내 냅니다. */
  function seedLegacyUser() {
    localStorage.setItem(
      USERS_KEY,
      JSON.stringify([
        {
          id: "legacy-1",
          name: "이전계정",
          loginId: "legacy",
          email: "legacy@kindy.test",
          password: "plain-text-1234",
          phone: "010-0000-0000",
          zonecode: "",
          address: "",
          addressDetail: "",
          joinedAt: "2026-01-01T00:00:00.000Z",
          accountType: "adult",
        },
      ]),
    );
  }

  it("예전 평문 계정도 로그인할 수 있다", async () => {
    seedLegacyUser();
    await expect(loginMockUser("legacy", "plain-text-1234")).resolves.toMatchObject({ ok: true });
  });

  it("로그인에 성공하면 해시로 옮기고 평문을 지운다", async () => {
    seedLegacyUser();
    await loginMockUser("legacy", "plain-text-1234");

    const [record] = readRawUsers();
    expect(record.password).toBeUndefined();
    expect(record.passwordHash).toMatch(/^pbkdf2-sha256\$/);

    // 옮긴 뒤에도 같은 비밀번호로 계속 로그인돼야 합니다.
    await expect(loginMockUser("legacy", "plain-text-1234")).resolves.toMatchObject({ ok: true });
  });

  it("평문 계정이라도 틀린 비밀번호는 막는다", async () => {
    seedLegacyUser();
    await expect(loginMockUser("legacy", "nope")).resolves.toEqual({ ok: false, reason: "wrong-password" });
  });
});

describe("changeMockPassword", () => {
  it("새 비밀번호로만 로그인되게 바꾼다", async () => {
    const user = await registerMockUser(SIGNUP);
    await changeMockPassword(user.id, "newpass!234");

    await expect(loginMockUser("haneul", "newpass!234")).resolves.toMatchObject({ ok: true });
    await expect(loginMockUser("haneul", "kindy1234")).resolves.toEqual({
      ok: false,
      reason: "wrong-password",
    });
  });
});

describe("updateMockUser", () => {
  it("프로필을 바꿔도 비밀번호는 그대로 유지된다", async () => {
    const user = await registerMockUser(SIGNUP);
    updateMockUser(user.id, { nickname: "하늘이" });

    const result = await loginMockUser("haneul", "kindy1234");
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.user.nickname).toBe("하늘이");
  });

  it("저장소에 없는 계정이면 아무 것도 하지 않는다", async () => {
    await registerMockUser(SIGNUP);
    updateMockUser("does-not-exist", { nickname: "무시됨" });

    expect(readRawUsers()).toHaveLength(1);
  });
});
