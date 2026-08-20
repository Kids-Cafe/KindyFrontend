import {
  Baby, Bell, KeyRound, Link2, MapPin, Phone, School, Shield, UserCircle, UserX,
} from "lucide-react";

export type MenuKey =
  | "nickname" | "password" | "address" | "kindergartenClass" | "notifications"
  | "childInfo" | "linkedAccounts" | "phone" | "personalInfo" | "withdraw";

/**
 * 항목이 보일지 정할 때 쓰는 정보입니다. 대부분은 계정 종류만 보면 되는데, 탈퇴 하나는
 * 보호자가 연결돼 있는지까지 봐야 해서 함께 넘깁니다.
 */
export type MenuContext = { isChild: boolean; hasGuardian: boolean };

export interface MyPageMenuItem {
  key: MenuKey;
  icon: typeof Baby;
  label: string;
  hint: string;
  visible: (ctx: MenuContext) => boolean;
}

const forAnyone = () => true;
const adultOnly = (ctx: MenuContext) => !ctx.isChild;

/**
 * ⚠️ 목록에서 감추는 건 보안 경계가 아닙니다. 아이 계정이 주소를 저장하려 해도 서버의
 * CHECK 제약이 거부합니다. 여기서 감추는 이유는 **할 수 없는 일을 보여 주지 않기** 위해서고,
 * 그래서 기준도 "어른스러워 보이는가"가 아니라 "서버가 어차피 거부하는가"입니다.
 *
 * 탈퇴만은 계정 종류로 자를 수 없습니다. 보호자가 연결된 아이라면 계정 삭제는 보호자의
 * 일이지만, **보호자가 없는 아이에게까지 감추면 그 아이는 탈퇴하려고 일부러 부모를 붙여야**
 * 하고, 그건 탈퇴 경로가 아예 없는 것과 같습니다.
 */
export const MENU_ITEMS: MyPageMenuItem[] = [
  { key: "nickname", icon: UserCircle, label: "별칭 변경", hint: "유치원에서 보여질 이름", visible: forAnyone },
  { key: "password", icon: KeyRound, label: "비밀번호 재설정", hint: "계정 보안 설정", visible: forAnyone },
  // 아이 계정은 T_USER_CHILD_FIELDS_CK가 주소·우편번호를 금지합니다.
  { key: "address", icon: MapPin, label: "주소 변경", hint: "우편번호 · 상세주소", visible: adultOnly },
  { key: "kindergartenClass", icon: School, label: "유치원 및 소속반 변경", hint: "소속 기관/반 정보", visible: forAnyone },
  // 아이에게는 아이가 없습니다.
  { key: "childInfo", icon: Baby, label: "우리 아이 정보", hint: "아이 계정 연결 · 프로필", visible: adultOnly },
  { key: "notifications", icon: Bell, label: "알림 설정", hint: "공지 · 일정 · 채팅 알림", visible: forAnyone },
  // 소셜 로그인은 이메일이 있어야 하는데 아이 계정의 EMAIL은 NULL이라 연동될 수 없습니다.
  { key: "linkedAccounts", icon: Link2, label: "연동된 계정 보기", hint: "소셜 로그인 연동 현황", visible: adultOnly },
  { key: "phone", icon: Phone, label: "전화번호 변경", hint: "연락처 정보", visible: forAnyone },
  { key: "personalInfo", icon: Shield, label: "개인정보 확인", hint: "이름 · 계정 정보", visible: forAnyone },
  {
    key: "withdraw",
    icon: UserX,
    label: "회원 탈퇴",
    hint: "계정 삭제 및 로그아웃",
    visible: (ctx) => !ctx.isChild || !ctx.hasGuardian,
  },
];

export function visibleMenuItems(ctx: MenuContext): MyPageMenuItem[] {
  return MENU_ITEMS.filter((item) => item.visible(ctx));
}
