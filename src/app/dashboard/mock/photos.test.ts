import { describe, expect, it } from "vitest";
import { buildPhotos } from "@/app/dashboard/mock/photos";

const CLASS_IDS = ["class-1", "class-2", "class-3"];

describe("buildPhotos", () => {
  it("모든 사진이 넘겨받은 반 중 하나에 배정된다", () => {
    const photos = buildPhotos(CLASS_IDS);

    expect(photos.length).toBeGreaterThan(0);
    for (const photo of photos) {
      expect(photo.scope).toBe("class");
      expect(CLASS_IDS).toContain(photo.scopeId);
    }
  });

  it("반마다 최소 한 장씩은 돌아간다", () => {
    const photos = buildPhotos(CLASS_IDS);

    for (const classId of CLASS_IDS) {
      expect(photos.some((p) => p.scopeId === classId)).toBe(true);
    }
  });

  it("테마가 한 종류로 몰리지 않는다", () => {
    const themes = new Set(buildPhotos(CLASS_IDS).map((p) => p.theme));
    expect(themes.size).toBeGreaterThan(1);
  });

  it("id가 중복되지 않는다", () => {
    const photos = buildPhotos(CLASS_IDS);
    expect(new Set(photos.map((p) => p.id)).size).toBe(photos.length);
  });

  it("반이 하나뿐이면 전부 그 반에 들어간다", () => {
    const photos = buildPhotos(["only-class"]);
    expect(photos.every((p) => p.scopeId === "only-class")).toBe(true);
  });

  it("반이 없으면 빈 배열을 돌려준다", () => {
    // 반이 하나도 없는 유치원에서 `classIds[i % 0]`이 undefined가 되는 걸 막습니다.
    expect(buildPhotos([])).toEqual([]);
  });
});
