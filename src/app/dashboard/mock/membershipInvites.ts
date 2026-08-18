/**
 * 원장이 아이디로 검색해 찾은 "실제 가입된 계정"에게 보내는 유치원 초대입니다.
 * 대시보드 데이터는 로그인마다 새로 만들어지는 세션 상태([[DashboardStoreContext]])라
 * 새로고침하면 사라지므로, 초대 자체는 이 파일처럼 localStorage에 별도로 영속화해야
 * 초대받은 사람이 실제로 로그인했을 때(다른 브라우저 세션)도 찾을 수 있습니다.
 */

import { newId } from "@/app/lib/id";

export type InviteTargetRole = "teacher" | "parent" | "child";
export type InviteStatus = "pending" | "accepted" | "rejected";

export interface MembershipInvite {
  id: number;
  kindergartenId: number;
  kindergartenName: string;
  targetUserId: string;
  targetLoginId: string;
  targetName: string;
  role: InviteTargetRole;
  /** 선생님 초대에서만 씁니다. */
  classId?: number;
  className?: string;
  roleIds?: number[];
  status: InviteStatus;
  invitedByName: string;
  createdAt: number;
  respondedAt?: number;
}

const KEY = "kindy.mock.membershipInvites";

function readInvites(): MembershipInvite[] {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as MembershipInvite[]) : [];
  } catch {
    return [];
  }
}

function writeInvites(list: MembershipInvite[]): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(list));
  } catch {
    /* noop */
  }
}

/** 원장이 이 유치원에서 보낸 초대 전체(대기/수락/거절 모두)입니다. "초대 목록" 화면에 씁니다. */
export function listInvitesSentByKindergarten(kindergartenId: number): MembershipInvite[] {
  return readInvites()
    .filter((i) => i.kindergartenId === kindergartenId)
    .sort((a, b) => b.createdAt - a.createdAt);
}

/** 특정 계정 앞으로 온 초대입니다. "받은 초대" 화면에 씁니다. */
export function listInvitesForTarget(userId: string): MembershipInvite[] {
  return readInvites()
    .filter((i) => i.targetUserId === userId)
    .sort((a, b) => b.createdAt - a.createdAt);
}

export interface CreateInvitePayload {
  kindergartenId: number;
  kindergartenName: string;
  targetUserId: string;
  targetLoginId: string;
  targetName: string;
  role: InviteTargetRole;
  classId?: number;
  className?: string;
  roleIds?: number[];
  invitedByName: string;
}

/** 이미 보낸 대기 중인 초대가 있으면 그걸 그대로 돌려주고(중복 방지), 없으면 새로 만듭니다. */
export function createInvite(payload: CreateInvitePayload): MembershipInvite {
  const existing = readInvites().find(
    (i) => i.kindergartenId === payload.kindergartenId && i.targetUserId === payload.targetUserId && i.status === "pending",
  );
  if (existing) return existing;

  const invite: MembershipInvite = { id: newId(), status: "pending", createdAt: Date.now(), ...payload };
  writeInvites([...readInvites(), invite]);
  return invite;
}

export function cancelInvite(inviteId: number): void {
  writeInvites(readInvites().filter((i) => i.id !== inviteId));
}

export function updateInviteRoles(inviteId: number, roleIds: number[]): void {
  writeInvites(readInvites().map((i) => (i.id === inviteId ? { ...i, roleIds } : i)));
}

/** 대상의 id/유치원만 알고 있을 때(예: 멤버 목록 화면) 수락된 초대의 권한을 갱신합니다. */
export function updateAcceptedInviteRoles(kindergartenId: number, targetUserId: string, roleIds: number[]): void {
  writeInvites(
    readInvites().map((i) =>
      i.kindergartenId === kindergartenId && i.targetUserId === targetUserId && i.status === "accepted" ? { ...i, roleIds } : i,
    ),
  );
}

/** 원장이 이미 수락된 멤버를 내보낼 때 씁니다. 초대 기록 자체를 지워, 다시 초대하면 새로 시작됩니다. */
export function revokeAcceptedInvite(kindergartenId: number, targetUserId: string): void {
  writeInvites(
    readInvites().filter((i) => !(i.kindergartenId === kindergartenId && i.targetUserId === targetUserId && i.status === "accepted")),
  );
}

/** 초대받은 사람이 수락/거절합니다. */
export function respondToInvite(inviteId: number, accept: boolean): void {
  writeInvites(
    readInvites().map((i) => (i.id === inviteId ? { ...i, status: accept ? "accepted" : "rejected", respondedAt: Date.now() } : i)),
  );
}

/** 이 계정이 이 유치원의 초대를 수락해 뒀는지 확인합니다. 배정받은 반/권한을 이어받는 데 씁니다. */
export function findAcceptedInvite(kindergartenId: number, userId: string): MembershipInvite | undefined {
  return readInvites().find((i) => i.kindergartenId === kindergartenId && i.targetUserId === userId && i.status === "accepted");
}
