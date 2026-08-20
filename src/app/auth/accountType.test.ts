import { describe, expect, it } from "vitest";
import { accountTypeOf, isAdultAccount, isChildAccount } from "@/app/auth/accountType";

describe("accountType", () => {
  it("계정 종류를 그대로 읽는다", () => {
    expect(isChildAccount({ accountType: "child" })).toBe(true);
    expect(isAdultAccount({ accountType: "child" })).toBe(false);
    expect(isChildAccount({ accountType: "adult" })).toBe(false);
    expect(isAdultAccount({ accountType: "adult" })).toBe(true);
  });

  it("종류를 모르면 어른으로 본다", () => {
    // 서버 프로필이 오기 전이거나 이 필드가 생기기 전의 세션이 복원된 경우입니다.
    // 서버 칼럼의 기본값도 ADULT이고, 아이용으로 감추는 항목이 어른에게서 사라지는 쪽보다 낫습니다.
    expect(isChildAccount({ accountType: undefined })).toBe(false);
    expect(isAdultAccount({ accountType: undefined })).toBe(true);
    expect(accountTypeOf({ accountType: undefined })).toBe("adult");
  });

  it("사용자가 없으면 어느 쪽도 아니다", () => {
    expect(isChildAccount(null)).toBe(false);
    // 로그인하지 않은 상태를 "어른"으로 취급하면 어른 전용 화면이 열립니다.
    expect(isAdultAccount(null)).toBe(false);
    expect(isAdultAccount(undefined)).toBe(false);
  });
});
