import { NoticesFeature } from "@/app/dashboard/features/NoticesFeature";

/** 원장 전용 공지사항 관리 화면입니다. 작성/고정/삭제 컨트롤이 켜진 `NoticesFeature`를 그대로 씁니다. */
export function NoticeManageFeature() {
  return <NoticesFeature canManage />;
}
