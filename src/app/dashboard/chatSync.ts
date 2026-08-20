import { apiGet, apiPost, apiPostBinary, apiUpload } from "@/app/lib/api";
import type { ChatDTO, ChatMessageDTO, ChatMessageType } from "@/app/lib/dto";
import type { ChatMessage, ChatSender, DataCardType } from "@/app/dashboard/types";

/**
 * 백엔드 채팅(`/api/chat/*`)과 화면의 대화창을 잇습니다.
 *
 * 서버의 채팅은 "호스트 ↔ 클라이언트" 2인 대화 하나가 전부이고, 그 위에 세 종류의
 * 화면이 얹혀 있습니다:
 *
 * - 학부모 ↔ 선생님, 원장 ↔ 선생님: 서로 다른 두 사람의 대화
 * - 아이 ↔ AI 파트너: host와 client가 **모두 아이 본인**인 자기 자신과의 대화입니다.
 *   AI가 한 말은 `role=assistant`로 구분합니다(서버가 `create`에서 양쪽을 세션
 *   사용자로 기본 설정해 주기 때문에 이 모양이 됩니다).
 *
 * 메시지의 `type`은 본문이 일반 텍스트인지, 리포트 카드인지를 나타냅니다.
 */

/** ChatMessageDTO.Type ↔ 화면의 데이터 카드 종류. TEXT는 카드가 아닌 일반 메시지입니다. */
const TYPE_TO_CARD: Record<Exclude<ChatMessageType, "TEXT">, DataCardType> = {
  FOOD: "food",
  HEALTH: "health",
  FRIEND: "friendship",
  PERSONALITY: "personality",
  STUDY: "learning",
};

const CARD_TO_TYPE = Object.fromEntries(
  Object.entries(TYPE_TO_CARD).map(([type, card]) => [card, type as ChatMessageType]),
) as Record<DataCardType, ChatMessageType>;

export interface ChatParticipants {
  /** userId → 화면에 쓸 이름 */
  nameById: Record<string, string>;
  /** userId → 대화창에서의 역할(말풍선 좌/우, 색상 결정) */
  senderById: Record<string, ChatSender>;
  /** AI 자기대화에서 assistant 역할이 말할 때 쓸 이름입니다(키오/키나). */
  assistantName?: string;
}

/**
 * 서버 메시지를 화면 메시지로 옮깁니다.
 *
 * ⚠️ 알려진 한계: `T_CHAT_MESSAGE`에는 작성자 칼럼이 없습니다. 남는 건 `ROLE`
 * (user/assistant/system/tool)뿐이라, **사람 둘이 나눈 대화에서는 어느 쪽이 보낸
 * 메시지인지 알 수 없습니다.** 그래서 아래는 user 역할을 전부 호스트로 돌립니다 —
 * AI 대화(host == client)는 user/assistant로 갈리므로 정확하지만, 학부모↔선생님이나
 * 원장↔선생님 대화는 말풍선의 좌우와 이름이 실제와 다를 수 있습니다.
 *
 * 백엔드에 `T_CHAT_MESSAGE.AUTHOR`가 추가되면 이 함수는 그 값을 그대로 쓰면 됩니다.
 */
function mapMessage(dto: ChatMessageDTO, chat: ChatDTO, participants: ChatParticipants): ChatMessage {
  const isAssistant = dto.role === "assistant";
  const speakerId = isAssistant ? chat.client : chat.host;

  const card = dto.type !== "TEXT" ? TYPE_TO_CARD[dto.type] : undefined;

  return {
    id: dto.num,
    sender: isAssistant && chat.host === chat.client ? "ai" : participants.senderById[speakerId] ?? "teacher",
    senderName:
      isAssistant && chat.host === chat.client
        ? participants.assistantName ?? "AI 파트너"
        : participants.nameById[speakerId] ?? speakerId,
    kind: card ? "data-card" : "text",
    text: card ? undefined : dto.content,
    cardType: card,
    time: dto.createdAt,
  };
}

/** 로그인한 사람이 참여 중인 대화 목록입니다. `kindergartenId`를 0 이하로 주면 전부 가져옵니다. */
export async function fetchChats(kindergartenId: number): Promise<ChatDTO[]> {
  return apiGet<ChatDTO[]>("/api/chat/list", { kindergartenId });
}

export async function fetchChatMessages(chat: ChatDTO, participants: ChatParticipants): Promise<ChatMessage[]> {
  const list = await apiGet<ChatMessageDTO[]>("/api/chat/messages", { id: chat.id });
  return list.map((dto) => mapMessage(dto, chat, participants));
}

/**
 * 두 사람 사이의 대화를 찾고, 없으면 만듭니다.
 *
 * `chat/create`가 곧 find-or-create입니다(서버가 기존 대화를 그대로 돌려줍니다). 그래서
 * 목록을 먼저 받아 볼 필요가 없고, "읽고 나서 만들기" 사이에 다른 요청이 끼어들어 **같은
 * 두 사람의 대화가 둘 생기는** 일도 없습니다.
 *
 * 그래도 진행 중인 요청은 한데 묶습니다. 화면 여러 곳이 동시에 같은 대화를 필요로 할 때
 * 왕복을 아끼고, 서버가 돌려주는 같은 `ChatDTO`를 함께 쓰게 됩니다.
 */
const pendingChats = new Map<string, Promise<ChatDTO>>();

export async function ensureChat(kindergartenId: number, host: string, client: string): Promise<ChatDTO> {
  const key = `${kindergartenId}:${host}:${client}`;
  const pending = pendingChats.get(key);
  if (pending) return pending;

  const request = apiPost<ChatDTO>("/api/chat/create", { kindergartenId, host, client }).finally(() => {
    pendingChats.delete(key);
  });
  pendingChats.set(key, request);
  return request;
}

/**
 * 아이 ↔ AI 대화는 `host === client === 아이 본인`입니다. 메시지를 화면에 옮기는
 * `mapMessage`가 `ChatDTO` 전체(host·client)를 보므로, id만 들고 있을 때 이걸로 복원합니다.
 */
export function selfChat(chatId: number, childId: string, kindergartenId: number): ChatDTO {
  return { id: chatId, kindergartenId, host: childId, client: childId, createdAt: 0 };
}

/** 아이 ↔ AI 파트너 대화입니다. 양쪽 모두 아이 본인인 자기 자신과의 대화로 만듭니다. */
export async function ensureAiChat(kindergartenId: number, childId: string): Promise<ChatDTO> {
  return ensureChat(kindergartenId, childId, childId);
}

/**
 * 메시지를 보냅니다. 서버가 저장한 행을 그대로 돌려주므로 `num`·`createdAt`이 채워져 있습니다.
 *
 * `role`은 보내지 않습니다 — 서버가 사람이 보낸 것을 전부 `user`로 못박습니다.
 * `assistant`는 `requestAiReply`(모델이 실제로 답한 것)만 만듭니다.
 */
export async function sendChatMessage(
  chatId: number,
  content: string,
  options: { cardType?: DataCardType } = {},
): Promise<ChatMessageDTO> {
  return apiPost<ChatMessageDTO>("/api/chat/send", {
    chatId,
    content,
    type: options.cardType ? CARD_TO_TYPE[options.cardType] : "TEXT",
  });
}

/**
 * 아이가 한 말을 보내고 AI의 답까지 한 번에 받아 옵니다(`chat/say` = send + request).
 *
 * 답변 생성이 실패해도 **아이가 한 말은 이미 저장돼 있습니다.** 그때 서버는
 * `GENERATION_FAILED`를 던지면서 `sent`만 채운 데이터를 함께 주는데, `apiPost`는 봉투가
 * error면 데이터를 버리고 던지므로 여기서는 `reply`가 없는 것으로만 구분합니다 —
 * 호출부는 "말은 남았고 답만 못 받았다"로 다루면 됩니다.
 */
export interface ChatTurn {
  sent: ChatMessageDTO;
  reply?: ChatMessageDTO;
}

export async function sayToAssistant(chatId: number, content: string): Promise<ChatTurn> {
  return apiPost<ChatTurn>("/api/chat/say", { chatId, content });
}

/** 이미 보낸 말에 대해 답변만 다시 요청합니다("다시 물어보기"). */
export async function requestAiReply(chatId: number): Promise<ChatMessageDTO> {
  return apiPost<ChatMessageDTO>("/api/chat/request", { chatId });
}

/**
 * 녹음 컨테이너 → 파일 이름.
 *
 * 서버는 우리가 준 파일 이름을 그대로 STT 서비스에 넘기고, 그쪽은 **확장자로 형식을
 * 판별**합니다. 이름 없는 `Blob`은 `blob`으로 전송돼 거부당하므로 반드시 붙여야 합니다.
 * 브라우저마다 컨테이너가 다릅니다 — Chrome은 webm/opus, Safari는 mp4/aac입니다.
 */
export function recordingFileName(mimeType: string): string {
  const base = mimeType.split(";")[0].trim().toLowerCase();
  if (base === "audio/mp4" || base === "audio/aac" || base === "audio/x-m4a") return "recording.m4a";
  if (base === "audio/ogg") return "recording.ogg";
  if (base === "audio/wav" || base === "audio/wave" || base === "audio/x-wav") return "recording.wav";
  if (base === "audio/mpeg") return "recording.mp3";
  return "recording.webm";
}

/**
 * 녹음한 음성을 텍스트로 바꿉니다.
 *
 * `apiUpload`는 `Blob`이 아니라 `File`을 받고, 그 이름이 STT 서버까지 그대로 전달됩니다
 * (위 `recordingFileName` 참고). 실패는 던지지 않고 빈 문자열로 돌려줍니다 — 말이 잘 안
 * 들린 것과 서버가 아픈 것을 아이에게 구분해 보여줄 방법이 없고, 어느 쪽이든 화면이
 * 할 일은 "다시 말해 볼래?" 하나뿐입니다.
 */
export async function transcribeAudio(blob: Blob, mimeType = blob.type): Promise<string> {
  const file = new File([blob], recordingFileName(mimeType), { type: mimeType || "audio/webm" });
  try {
    const text = await apiUpload<string>("/api/chat/transcribe", {}, file);
    return (text ?? "").trim();
  } catch (cause) {
    console.warn("[Kindy] 음성을 알아듣지 못했어요.", cause);
    return "";
  }
}

/**
 * AI의 답을 소리로 받아 옵니다. `chat/speak`는 TTS 뒤에 음성 변환을 한 번 더 태워
 * 캐릭터 목소리를 냅니다(서버가 변환에 실패하면 알아서 평범한 TTS로 물러섭니다).
 *
 * 소리가 나지 않는다고 대화가 막히면 안 되므로 실패는 `null`입니다.
 *
 * `partner`는 지금 서버가 쓰지 않습니다 — 목소리 모델이 하나뿐이라 키오와 키나가 같은
 * 소리로 들립니다. 나중에 갈라질 때 이 화면을 다시 고치지 않으려고 미리 넘겨 둡니다.
 */
export async function speakAssistant(
  text: string,
  options: { partner?: string; signal?: AbortSignal } = {},
): Promise<Blob | null> {
  if (!text.trim()) return null;
  try {
    return await apiPostBinary("/api/chat/speak", { text, partner: options.partner }, options.signal);
  } catch (cause) {
    if (cause instanceof DOMException && cause.name === "AbortError") return null;
    console.warn("[Kindy] 목소리를 만들지 못했어요.", cause);
    return null;
  }
}
