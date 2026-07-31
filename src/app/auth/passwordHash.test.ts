import { describe, expect, it } from "vitest";
import { hashPassword, needsRehash, verifyPassword } from "@/app/auth/passwordHash";

describe("hashPassword", () => {
  it("평문을 그대로 남기지 않는다", async () => {
    const stored = await hashPassword("kindy1234");
    expect(stored).not.toContain("kindy1234");
  });

  it("알고리즘과 반복 횟수를 문자열에 함께 담는다", async () => {
    const stored = await hashPassword("kindy1234");
    const [algorithm, iterations, salt, hash] = stored.split("$");

    expect(algorithm).toBe("pbkdf2-sha256");
    expect(Number(iterations)).toBeGreaterThanOrEqual(100_000);
    expect(salt).toBeTruthy();
    expect(hash).toBeTruthy();
  });

  it("같은 비밀번호라도 솔트가 달라 매번 다른 해시가 나온다", async () => {
    const a = await hashPassword("kindy1234");
    const b = await hashPassword("kindy1234");
    expect(a).not.toBe(b);
  });
});

describe("verifyPassword", () => {
  it("맞는 비밀번호를 통과시킨다", async () => {
    const stored = await hashPassword("kindy1234");
    await expect(verifyPassword("kindy1234", stored)).resolves.toBe(true);
  });

  it("틀린 비밀번호를 막는다", async () => {
    const stored = await hashPassword("kindy1234");
    await expect(verifyPassword("kindy12345", stored)).resolves.toBe(false);
    await expect(verifyPassword("", stored)).resolves.toBe(false);
  });

  it("한글/이모지가 섞여도 왕복이 깨지지 않는다", async () => {
    const password = "우리아이💛2020";
    const stored = await hashPassword(password);
    await expect(verifyPassword(password, stored)).resolves.toBe(true);
  });

  it("형식이 깨진 저장값을 통과시키지 않는다", async () => {
    await expect(verifyPassword("kindy1234", "kindy1234")).resolves.toBe(false);
    await expect(verifyPassword("kindy1234", "")).resolves.toBe(false);
    await expect(verifyPassword("kindy1234", "md5$1$abc$def")).resolves.toBe(false);
    await expect(verifyPassword("kindy1234", "pbkdy-sha256$0$abc$def")).resolves.toBe(false);
  });

  it("반복 횟수가 숫자가 아니면 통과시키지 않는다", async () => {
    await expect(verifyPassword("kindy1234", "pbkdf2-sha256$many$abc$def")).resolves.toBe(false);
  });
});

describe("needsRehash", () => {
  it("지금 파라미터로 만든 해시는 다시 만들 필요가 없다", async () => {
    const stored = await hashPassword("kindy1234");
    expect(needsRehash(stored)).toBe(false);
  });

  it("반복 횟수가 낮거나 형식이 다르면 다시 만들라고 한다", () => {
    expect(needsRehash("pbkdf2-sha256$1000$abc$def")).toBe(true);
    expect(needsRehash("평문비밀번호")).toBe(true);
    expect(needsRehash("")).toBe(true);
  });
});
