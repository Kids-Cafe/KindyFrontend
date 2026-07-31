import { describe, expect, it } from "vitest";
import {
  isMockVerificationCodeValid,
  isPasswordValid,
  isValidBirthDate,
  isValidBusinessRegNo,
  isValidEmail,
  isValidLoginId,
  isValidPhone,
} from "@/app/auth/validation";

describe("isValidEmail", () => {
  it("일반적인 주소를 통과시킨다", () => {
    expect(isValidEmail("parent@kindy.co.kr")).toBe(true);
    expect(isValidEmail("  parent@kindy.co.kr  ")).toBe(true);
  });

  it("@나 도메인이 빠진 주소를 막는다", () => {
    expect(isValidEmail("parent")).toBe(false);
    expect(isValidEmail("parent@")).toBe(false);
    expect(isValidEmail("parent@kindy")).toBe(false);
    expect(isValidEmail("")).toBe(false);
  });

  it("공백이 섞인 주소를 막는다", () => {
    expect(isValidEmail("pa rent@kindy.com")).toBe(false);
  });
});

describe("isPasswordValid", () => {
  it("8자 이상이면서 2종류 이상 섞이면 통과한다", () => {
    expect(isPasswordValid("kindy1234")).toBe(true); // 영문 + 숫자
    expect(isPasswordValid("kindy!!!!")).toBe(true); // 영문 + 특수
    expect(isPasswordValid("1234!@#$")).toBe(true); // 숫자 + 특수
  });

  it("8자 미만이면 조합과 무관하게 막는다", () => {
    expect(isPasswordValid("ki1!")).toBe(false);
    expect(isPasswordValid("kindy1")).toBe(false);
  });

  it("한 종류만 쓰면 막는다", () => {
    expect(isPasswordValid("kindykindy")).toBe(false);
    expect(isPasswordValid("12345678")).toBe(false);
  });

  it("데모 계정 비밀번호 '1234'는 폼 규칙을 통과하지 못한다", () => {
    // 데모 계정은 mock 저장소에 직접 심어서 이 규칙을 우회합니다.
    // 규칙이 느슨해져 실제 가입에서도 통과하게 되면 이 테스트가 깨져야 합니다.
    expect(isPasswordValid("1234")).toBe(false);
  });
});

describe("isValidPhone", () => {
  it("하이픈이 있든 없든 통과한다", () => {
    expect(isValidPhone("010-1234-5678")).toBe(true);
    expect(isValidPhone("01012345678")).toBe(true);
    expect(isValidPhone("011-123-4567")).toBe(true);
  });

  it("휴대폰 국번이 아니거나 자릿수가 안 맞으면 막는다", () => {
    expect(isValidPhone("02-123-4567")).toBe(false);
    expect(isValidPhone("010-12-5678")).toBe(false);
    expect(isValidPhone("010-1234-567")).toBe(false);
  });
});

describe("isValidLoginId", () => {
  it("4~20자의 영문/숫자/-/_ 를 허용한다", () => {
    expect(isValidLoginId("kid1")).toBe(true);
    expect(isValidLoginId("haesal_kid-01")).toBe(true);
    expect(isValidLoginId("a".repeat(20))).toBe(true);
  });

  it("길이를 벗어나거나 허용되지 않은 문자가 섞이면 막는다", () => {
    expect(isValidLoginId("kid")).toBe(false);
    expect(isValidLoginId("a".repeat(21))).toBe(false);
    expect(isValidLoginId("김아이")).toBe(false);
    expect(isValidLoginId("kid 01")).toBe(false);
  });
});

describe("isValidBirthDate", () => {
  it("실제로 존재하는 날짜만 통과시킨다", () => {
    expect(isValidBirthDate("2020-05-15")).toBe(true);
    expect(isValidBirthDate("2020-02-29")).toBe(true); // 윤년
  });

  it("존재하지 않는 날짜를 막는다", () => {
    expect(isValidBirthDate("2021-02-29")).toBe(false); // 평년
    expect(isValidBirthDate("2020-13-01")).toBe(false);
    expect(isValidBirthDate("2020-04-31")).toBe(false);
  });

  it("형식이 어긋나면 막는다", () => {
    expect(isValidBirthDate("2020-5-15")).toBe(false);
    expect(isValidBirthDate("20200515")).toBe(false);
    expect(isValidBirthDate("")).toBe(false);
  });
});

describe("isValidBusinessRegNo", () => {
  it("000-00-00000 형식을 하이픈 유무 모두 허용한다", () => {
    expect(isValidBusinessRegNo("123-45-67890")).toBe(true);
    expect(isValidBusinessRegNo("1234567890")).toBe(true);
  });

  it("자릿수가 안 맞으면 막는다", () => {
    expect(isValidBusinessRegNo("123-45-6789")).toBe(false);
    expect(isValidBusinessRegNo("abc-de-fghij")).toBe(false);
  });
});

describe("isMockVerificationCodeValid", () => {
  it("6자리 숫자만 통과시킨다", () => {
    expect(isMockVerificationCodeValid("123456")).toBe(true);
    expect(isMockVerificationCodeValid("12345")).toBe(false);
    expect(isMockVerificationCodeValid("1234567")).toBe(false);
    expect(isMockVerificationCodeValid("12345a")).toBe(false);
  });
});
