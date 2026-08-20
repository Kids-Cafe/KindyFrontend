import { describe, expect, it } from "vitest";
import { finalConsonant, hasFinalConsonant, josa, withJosa } from "@/app/lib/korean";

describe("한국어 조사 고르기", () => {
  it("받침 있는 이름에는 이/을/은/과가 붙는다", () => {
    expect(withJosa("민준", "이/가")).toBe("민준이");
    expect(withJosa("민준", "을/를")).toBe("민준을");
    expect(withJosa("민준", "은/는")).toBe("민준은");
    expect(withJosa("민준", "과/와")).toBe("민준과");
  });

  it("받침 없는 이름에는 가/를/는/와가 붙는다", () => {
    expect(withJosa("서아", "이/가")).toBe("서아가");
    expect(withJosa("서아", "을/를")).toBe("서아를");
    expect(withJosa("서아", "은/는")).toBe("서아는");
    expect(withJosa("서아", "과/와")).toBe("서아와");
  });

  it("(으)로는 ㄹ 받침을 받침 없는 것처럼 다룬다", () => {
    expect(withJosa("선생님", "으로/로")).toBe("선생님으로"); // ㅁ 받침
    expect(withJosa("학부모", "으로/로")).toBe("학부모로"); // 받침 없음
    expect(withJosa("서울", "으로/로")).toBe("서울로"); // ㄹ 받침
    expect(withJosa("연필", "으로써/로써")).toBe("연필로써");
    expect(withJosa("원장", "으로서/로서")).toBe("원장으로서");
  });

  it("숫자로 끝나면 읽는 소리로 판정한다", () => {
    expect(withJosa("3반", "이/가")).toBe("3반이");
    expect(withJosa("아이 3", "이/가")).toBe("아이 3이"); // 삼
    expect(withJosa("아이 2", "이/가")).toBe("아이 2가"); // 이
    expect(withJosa("user1", "으로/로")).toBe("user1로"); // 일 → ㄹ
  });

  it("영문으로 끝나면 한 글자씩 읽는 소리를 따른다", () => {
    expect(withJosa("Kim", "이/가")).toBe("Kim이"); // 엠
    expect(withJosa("Lee", "이/가")).toBe("Lee가"); // 이
    expect(withJosa("SEOUL", "으로/로")).toBe("SEOUL로"); // 엘 → ㄹ
  });

  it("판단할 수 없는 글자는 받침 없음으로 본다", () => {
    expect(withJosa("아이 🐣", "이/가")).toBe("아이 🐣가");
    expect(withJosa("", "이/가")).toBe("가");
  });

  it("끝의 공백은 무시하고 그 앞 글자를 본다", () => {
    expect(josa("민준 ", "이/가")).toBe("이");
  });

  it("받침 판정은 ㄹ만 따로 알려준다", () => {
    expect(finalConsonant("서울")).toBe("ㄹ");
    expect(finalConsonant("서아")).toBeNull();
    expect(hasFinalConsonant("민준")).toBe(true);
    expect(hasFinalConsonant("서아")).toBe(false);
  });
});
