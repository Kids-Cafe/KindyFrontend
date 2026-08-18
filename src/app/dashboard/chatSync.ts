import { apiGet, apiPost } from "@/app/lib/api";
import type { ChatDTO, ChatMessageDTO, ChatMessageRole, ChatMessageType } from "@/app/lib/dto";
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
 * 서버가 만든 대화를 그대로 돌려주므로 곧바로 메시지를 보낼 수 있습니다.
 */
export async function ensureChat(kindergartenId: number, host: string, client: string): Promise<ChatDTO> {
  const existing = await fetchChats(kindergartenId).catch(() => [] as ChatDTO[]);
  const match = existing.find(
    (c) => (c.host === host && c.client === client) || (c.host === client && c.client === host),
  );
  if (match) return match;

  return apiPost<ChatDTO>("/api/chat/create", { kindergartenId, host, client });
}

/** 아이 ↔ AI 파트너 대화입니다. 양쪽 모두 아이 본인인 자기 자신과의 대화로 만듭니다. */
export async function ensureAiChat(kindergartenId: number, childId: string): Promise<ChatDTO> {
  return ensureChat(kindergartenId, childId, childId);
}

export async function sendChatMessage(
  chatId: number,
  content: string,
  options: { role?: ChatMessageRole; cardType?: DataCardType } = {},
): Promise<void> {
  await apiPost("/api/chat/send", {
    chatId,
    content,
    type: options.cardType ? CARD_TO_TYPE[options.cardType] : "TEXT",
    role: options.role ?? "user",
  });
}

/**
 * 녹음한 음성을 텍스트로 바꿉니다. 다른 엔드포인트와 달리 `ResultDTO` 봉투가 아니라
 * 평문(text/plain)을 돌려주므로 `apiPost`를 쓰지 않고 직접 호출합니다.
 * 로그인하지 않았거나 인식에 실패하면 빈 문자열입니다.
 */
export async function transcribeAudio(file: Blob): Promise<string> {
  const form = new FormData();
  form.set("file", file);
  const res = await fetch("/api/chat/transcribe", { method: "POST", credentials: "include", body: form });
  if (!res.ok) return "";
  return res.text();
}
