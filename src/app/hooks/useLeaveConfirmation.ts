import { useEffect, useRef } from "react";

const DEFAULT_MESSAGE = "정말로 이 페이지를 벗어나시겠습니까? 입력하신 내용이 저장되지 않아요.";

/**
 * 회원가입/온보딩처럼 입력 중인 내용을 잃을 수 있는 화면에서, 브라우저 뒤로가기·
 * 앞으로가기(popstate)나 탭 닫기·새로고침(beforeunload) 시 확인창을 띄웁니다.
 * `active`가 true가 되는 순간 히스토리에 가드용 엔트리를 하나 쌓아 두었다가,
 * 뒤로가기가 눌리면 그 엔트리에서 확인창을 띄우고, 취소하면 다시 쌓아 이 화면에
 * 머무르게 합니다. 확인을 누르면 `onLeave`를 호출해 화면을 정리합니다.
 */
export function useLeaveConfirmation(active: boolean, onLeave?: () => void, message: string = DEFAULT_MESSAGE) {
  // 리스너를 다시 붙이지 않고도 최신 콜백을 부르기 위한 ref입니다.
  // 렌더 중에 쓰면 안 되므로(동시성 렌더에서 커밋되지 않은 값이 남을 수 있습니다)
  // 커밋 이후에 갱신합니다. 읽는 쪽이 이벤트 핸들러뿐이라 이 타이밍이면 충분합니다.
  const onLeaveRef = useRef(onLeave);
  useEffect(() => {
    onLeaveRef.current = onLeave;
  }, [onLeave]);

  useEffect(() => {
    if (!active) return;

    let blocking = true;
    window.history.pushState({ kindyLeaveGuard: true }, "");

    function handlePopState() {
      if (!blocking) return;
      if (window.confirm(message)) {
        blocking = false;
        onLeaveRef.current?.();
      } else {
        window.history.pushState({ kindyLeaveGuard: true }, "");
      }
    }

    function handleBeforeUnload(event: BeforeUnloadEvent) {
      event.preventDefault();
      event.returnValue = "";
    }

    window.addEventListener("popstate", handlePopState);
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => {
      window.removeEventListener("popstate", handlePopState);
      window.removeEventListener("beforeunload", handleBeforeUnload);
      // 쌓아 둔 가드 엔트리는 일부러 되돌리지 않습니다. history.back()은 비동기로
      // popstate를 발생시키는데, 그 사이 다음 화면(예: 온보딩)이 이미 마운트되어
      // 자신의 popstate 리스너로 이 정리 동작을 "사용자가 뒤로가기를 눌렀다"고
      // 오인할 수 있기 때문입니다. 엔트리 하나가 남아도 화면은 React 상태로만
      // 그려지므로 사용자에게는 아무 영향이 없습니다.
    };
  }, [active, message]);
}
