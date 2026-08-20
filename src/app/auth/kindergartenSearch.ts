import { searchKindergartensOnServer } from "@/app/dashboard/backendSync";
import { apiPost } from "@/app/lib/api";
import type { KindergartenInfo } from "@/app/auth/types";

/**
 * 이름으로 유치원을 찾습니다. 필터링은 서버가 합니다(`/api/kindergarten/list?q=`) —
 * 전체 목록을 받아 와 브라우저에서 거르던 예전 방식은 유치원이 늘수록 감당이 안 됩니다.
 *
 * 로그인 전에도 부를 수 있고, 소속되지 않은 유치원은 공개 필드(이름·주소)만 내려옵니다.
 */
export async function searchKindergartens(query: string): Promise<KindergartenInfo[]> {
  const normalized = query.trim();
  if (!normalized) return [];

  const list = await searchKindergartensOnServer(normalized).catch(() => []);
  return list.map((kg) => ({
    id: kg.id,
    name: kg.name,
    zonecode: kg.postcode,
    address: kg.address,
    addressDetail: kg.addressDetail,
    businessRegNo: kg.brn,
  }));
}

/**
 * 고른 유치원에 가입을 신청합니다.
 *
 * 곧바로 멤버가 되는 게 아니라 대기 중인 가입 요청이 생기고, 원장이 수락해야
 * 관계가 만들어집니다. 그래서 성공했더라도 대시보드에 유치원이 바로 뜨지는 않습니다.
 *
 * `forUserId`는 **보호자가 아이를 대신해** 신청할 때 아이의 아이디입니다. 유치원에 다니는
 * 건 아이지 보호자가 아니라서, 학부모는 반드시 이 경로로 신청해야 합니다. 비워 두면
 * 본인 신청이고(선생님이 그렇습니다), 서버가 T_FAMILY로 보호자 여부를 확인합니다.
 */
export async function requestJoinKindergarten(
  kindergartenId: number,
  type: "CHILD" | "TEACHER",
  forUserId?: string,
): Promise<void> {
  await apiPost("/api/kindergarten/join", {
    id: kindergartenId,
    type,
    ...(forUserId ? { userId: forUserId } : {}),
  });
}
