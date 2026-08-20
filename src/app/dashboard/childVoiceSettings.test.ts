import { beforeEach, describe, expect, it } from "vitest";
import { loadChildVoiceSettings, saveChildVoiceSettings } from "@/app/dashboard/childVoiceSettings";

/**
 * 이 설정은 화면 두 곳(마이페이지의 알림설정, 채팅 헤더의 스피커)이 동시에 보고 있을 수
 * 있습니다. 값이 한 곳에만 있어야 한쪽에서 끈 것이 다른 쪽에서 되살아나지 않습니다.
 */
describe("childVoiceSettings", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("저장한 값을 그 자리에서 다시 읽습니다", () => {
    const before = loadChildVoiceSettings("child-1");
    saveChildVoiceSettings("child-1", { ...before, readReplies: false });

    expect(loadChildVoiceSettings("child-1").readReplies).toBe(false);
  });

  it("아이마다 따로입니다", () => {
    saveChildVoiceSettings("child-1", { enabled: false, readReplies: false, volume: 0.2 });

    expect(loadChildVoiceSettings("child-2").enabled).toBe(true);
  });

  it("일정 안내와 답장 읽어주기는 서로를 끄지 않습니다", () => {
    const before = loadChildVoiceSettings("child-3");
    saveChildVoiceSettings("child-3", { ...before, enabled: false });

    expect(loadChildVoiceSettings("child-3").readReplies).toBe(true);
  });

  it("예전에 저장된 값에 없는 항목은 기본값으로 채웁니다", () => {
    // readReplies가 생기기 전에 저장된 모양입니다.
    localStorage.setItem("kindy.childVoice.child-4", JSON.stringify({ enabled: false, volume: 0.5 }));

    expect(loadChildVoiceSettings("child-4")).toEqual({ enabled: false, readReplies: true, volume: 0.5 });
  });
});
