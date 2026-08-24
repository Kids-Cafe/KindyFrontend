import { describe, expect, it } from "vitest";
import { mapMessage, recordingFileName, selfChat, type ChatParticipants } from "@/app/dashboard/chatSync";
import type { ChatDTO, ChatMessageDTO } from "@/app/lib/dto";

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

/**
 * **누가 보냈는지**를 확인합니다.
 *
 * 사람 둘의 대화는 서버에서 전부 `role: "user"`로 돌아옵니다. 여기서 작성자를 잘못
 * 고르면 두 사람 모두 자기가 한 말을 상대 이름으로 보게 됩니다 — 틀렸다는 표시도 없이
 * 그럴듯하게 보이는 종류의 오류라, 화면을 보고 알아채기 어렵습니다.
 */
describe("mapMessage", () => {
  const thread: ChatDTO = { id: 3, kindergartenId: 7, host: "parent-1", client: "teacher-1", createdAt: 0 };
  const participants: ChatParticipants = {
    nameById: { "parent-1": "민준 어머니", "teacher-1": "김선생" },
    senderById: { "parent-1": "parent", "teacher-1": "teacher" },
  };

  function said(dto: Partial<ChatMessageDTO>): ChatMessageDTO {
    return { chatId: 3, num: 1, type: "TEXT", content: "안녕하세요", role: "user", createdAt: 1000, ...dto };
  }

  it("호스트가 아닌 쪽이 보낸 말을 그쪽 것으로 돌립니다", () => {
    const msg = mapMessage(said({ author: "teacher-1" }), thread, participants);
    expect(msg).toMatchObject({ sender: "teacher", senderName: "김선생" });
  });

  it("같은 대화의 두 사람을 서로 다르게 가립니다", () => {
    const fromParent = mapMessage(said({ num: 1, author: "parent-1" }), thread, participants);
    const fromTeacher = mapMessage(said({ num: 2, author: "teacher-1" }), thread, participants);
    expect(fromParent.sender).not.toBe(fromTeacher.sender);
  });

  it("화면이 이름을 모르면 서버가 준 작성자 이름을 씁니다", () => {
    const msg = mapMessage(said({ author: "director-1", authorName: "박원장" }), thread, {
      nameById: {},
      senderById: { "director-1": "director" },
    });
    expect(msg.senderName).toBe("박원장");
  });

  it("AUTHOR 이전에 저장된 메시지는 예전대로 호스트가 쓴 것으로 둡니다", () => {
    const msg = mapMessage(said({}), thread, participants);
    expect(msg).toMatchObject({ sender: "parent", senderName: "민준 어머니" });
  });

  it("AI가 한 말은 쓴 사람이 없어도 AI 파트너입니다", () => {
    const selfThread = selfChat(12, "child-1", 7);
    const msg = mapMessage(said({ role: "assistant", content: "반가워!" }), selfThread, {
      nameById: { "child-1": "민준" },
      senderById: { "child-1": "child" },
      assistantName: "키오",
    });
    expect(msg).toMatchObject({ sender: "ai", senderName: "키오" });
  });

  it("아이 ↔ AI 대화에서 아이가 한 말은 아이 것입니다", () => {
    const selfThread = selfChat(12, "child-1", 7);
    const msg = mapMessage(said({ author: "child-1", content: "안녕!" }), selfThread, {
      nameById: { "child-1": "민준" },
      senderById: { "child-1": "child" },
      assistantName: "키오",
    });
    expect(msg).toMatchObject({ sender: "child", senderName: "민준" });
  });
});
