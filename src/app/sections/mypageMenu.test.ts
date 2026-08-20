import { describe, expect, it } from "vitest";
import { MENU_ITEMS, visibleMenuItems } from "@/app/sections/mypageMenu";

const keysFor = (ctx: { isChild: boolean; hasGuardian: boolean }) =>
  visibleMenuItems(ctx).map((i) => i.key);

describe("마이페이지 메뉴 노출", () => {
  it("어른에게는 모든 항목이 보인다", () => {
    expect(keysFor({ isChild: false, hasGuardian: false })).toEqual(MENU_ITEMS.map((i) => i.key));
    expect(keysFor({ isChild: false, hasGuardian: true })).toEqual(MENU_ITEMS.map((i) => i.key));
  });

  it("아이에게는 서버가 어차피 거부하는 항목만 감춘다", () => {
    const hidden = MENU_ITEMS.map((i) => i.key).filter(
      (k) => !keysFor({ isChild: true, hasGuardian: true }).includes(k),
    );
    // 주소: CHILD CHECK 제약이 금지 / 우리 아이 정보: 아이에게 아이가 없음
    // 연동된 계정: 아이 계정은 EMAIL이 NULL이라 소셜 연동이 불가능
    // 탈퇴: 보호자가 있을 때만 — 아래 케이스에서 따로 확인합니다.
    expect(hidden).toEqual(["address", "childInfo", "linkedAccounts", "withdraw"]);
  });

  it("보호자가 없는 아이는 스스로 탈퇴할 수 있어야 한다", () => {
    // 이 항목까지 감추면 그 아이는 탈퇴하려고 일부러 보호자를 연결해야 하고,
    // 그건 탈퇴 경로가 아예 없는 것과 같습니다.
    expect(keysFor({ isChild: true, hasGuardian: false })).toContain("withdraw");
  });

  it("보호자가 연결된 아이의 탈퇴는 보호자의 몫이다", () => {
    expect(keysFor({ isChild: true, hasGuardian: true })).not.toContain("withdraw");
  });

  it("탈퇴 말고는 보호자 유무가 목록을 바꾸지 않는다", () => {
    const withGuardian = keysFor({ isChild: true, hasGuardian: true });
    const without = keysFor({ isChild: true, hasGuardian: false });
    expect(without.filter((k) => k !== "withdraw")).toEqual(withGuardian);
  });
});
