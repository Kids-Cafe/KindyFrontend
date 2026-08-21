import type { AIPartnerId } from "@/app/dashboard/types";

/**
 * 아이가 고른 AI 파트너(키오/키나)입니다. 백엔드에 저장할 칼럼이 없어 계정별로
 * localStorage에 둡니다 — `childVoiceSettings`와 같은 자리, 같은 이유입니다.
 *
 * 이 값은 화면의 캐릭터(그림·이름·인사말)뿐 아니라 **서버가 모델에게 주는 성격 지시문**도
 * 정합니다. 서버에는 저장되지 않으므로 대화를 청할 때마다 함께 보냅니다
 * (`chatSync`의 `sayToAssistant`·`requestAiReply` 참고).
 *
 * 저장해 두지 않으면 새로고침할 때마다 파트너 고르는 화면으로 되돌아가고, 어제 키나와
 * 나눈 대화를 오늘은 키오가 이어받게 됩니다.
 */
const PARTNER_IDS: readonly AIPartnerId[] = ["kio", "kina"];

function keyFor(childId: string): string {
  return `kindy.aiPartner.${childId}`;
}

/** 아직 고르지 않았거나 읽을 수 없으면 null입니다(파트너 선택 화면이 뜹니다). */
export function loadAiPartner(childId: string): AIPartnerId | null {
  try {
    const raw = localStorage.getItem(keyFor(childId));
    // 저장된 값이 지금의 캐릭터 목록에 없으면(예전 이름, 손으로 고친 값) 못 고른 것으로 봅니다.
    return PARTNER_IDS.find((id) => id === raw) ?? null;
  } catch {
    // localStorage를 쓸 수 없는 환경입니다. 이번 세션 동안만 화면 상태로 남습니다.
    return null;
  }
}

export function saveAiPartner(childId: string, partner: AIPartnerId): void {
  try {
    localStorage.setItem(keyFor(childId), partner);
  } catch {
    // 저장 실패는 조용히 넘깁니다. 고른 것 자체는 화면 상태에 이미 반영돼 있습니다.
  }
}
