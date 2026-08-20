import { describe, expect, it } from "vitest";
import { recordingFileName, selfChat } from "@/app/dashboard/chatSync";

/**
 * 녹음 파일의 **이름**을 확인합니다.
 *
 * 서버는 우리가 준 이름을 그대로 STT 서비스에 넘기고, 그쪽은 확장자로 형식을 판별합니다.
 * 이름이 틀리면 녹음은 멀쩡한데 인식만 조용히 실패합니다.
 */
describe("recordingFileName", () => {
  it("코덱이 붙은 Chrome의 mime을 webm으로 봅니다", () => {
    expect(recordingFileName("audio/webm;codecs=opus")).toBe("recording.webm");
  });

  it("Safari의 mp4 녹음에 m4a를 씁니다", () => {
    expect(recordingFileName("audio/mp4")).toBe("recording.m4a");
  });

  it("ogg·wav·mp3를 각각 알아봅니다", () => {
    expect(recordingFileName("audio/ogg;codecs=opus")).toBe("recording.ogg");
    expect(recordingFileName("audio/wav")).toBe("recording.wav");
    expect(recordingFileName("audio/mpeg")).toBe("recording.mp3");
  });

  it("대소문자와 공백에 흔들리지 않습니다", () => {
    expect(recordingFileName(" AUDIO/MP4 ; codecs=mp4a.40.2")).toBe("recording.m4a");
  });

  it("모르는 형식은 webm으로 둡니다 — 이름 없는 파일보다는 낫습니다", () => {
    expect(recordingFileName("")).toBe("recording.webm");
    expect(recordingFileName("audio/x-strange")).toBe("recording.webm");
  });
});

describe("selfChat", () => {
  it("아이 ↔ AI 대화는 host와 client가 모두 아이 본인입니다", () => {
    const chat = selfChat(12, "child-1", 7);
    expect(chat).toMatchObject({ id: 12, kindergartenId: 7, host: "child-1", client: "child-1" });
  });
});
