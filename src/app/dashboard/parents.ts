import type { ChildRecord, ParentRef } from "@/app/dashboard/types";

/**
 * 아이의 보호자를 화면에 적는 방법을 한곳에 모읍니다.
 *
 * `T_FAMILY`는 다대다라 보호자는 0명일 수도, 2명 이상일 수도 있습니다. 예전 화면들은
 * 단수 `parentName` 하나를 그대로 찍어서, 보호자가 없으면 "undefined"가 보이고 둘이면
 * 한쪽이 조용히 사라졌습니다.
 */

/** 보호자 이름을 한 줄로 잇습니다. 아무도 연결돼 있지 않으면 `fallback`입니다. */
export function parentNames(child: ChildRecord, fallback = "보호자 미연결"): string {
  if (child.parents.length === 0) return fallback;
  return child.parents.map((p) => p.name).join(" · ");
}

/**
 * 대화·알림장처럼 "누구 한 명"을 골라야 하는 자리에서 기본이 되는 보호자입니다.
 * 없으면 undefined이고, 그때는 상대를 특정할 수 없으니 화면이 버튼을 비활성화해야 합니다.
 */
export function primaryParent(child: ChildRecord): ParentRef | undefined {
  return child.parents[0];
}
