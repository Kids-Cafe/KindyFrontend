import { describe, expect, it } from "vitest";
import { parentNames, primaryParent } from "@/app/dashboard/parents";
import type { ChildRecord, ParentRef } from "@/app/dashboard/types";

function child(parents: ParentRef[]): ChildRecord {
  return {
    id: "child-1",
    name: "김하늘",
    nickname: "하늘이",
    classId: 1,
    className: "해바라기반",
    kindergartenId: 7,
    kindergartenName: "햇살유치원",
    parents,
    aiPartner: null,
    avatarEmoji: "🌻",
    avatarColor: "#F472B6",
  };
}

describe("parentNames", () => {
  it("보호자가 둘이면 둘 다 적는다", () => {
    // 예전 단수 필드에서는 한쪽이 조용히 사라졌습니다.
    expect(parentNames(child([{ id: "p1", name: "김아빠" }, { id: "p2", name: "이엄마" }]))).toBe("김아빠 · 이엄마");
  });

  it("보호자가 없으면 undefined가 아니라 안내 문구가 나온다", () => {
    expect(parentNames(child([]))).toBe("보호자 미연결");
    expect(parentNames(child([]), "")).toBe("");
  });
});

describe("primaryParent", () => {
  it("고르지 않았을 때 기준이 되는 보호자는 첫 번째다", () => {
    expect(primaryParent(child([{ id: "p1", name: "김아빠" }]))?.id).toBe("p1");
    expect(primaryParent(child([]))).toBeUndefined();
  });
});
