import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/app/components/ui/alert-dialog";

/**
 * 서버 세션이 만료돼 자동 로그아웃됐을 때 알려주는 안내입니다.
 *
 * 백엔드는 1시간 동안 요청이 없으면 세션을 버리는데, 그때 화면만 로그인된 것처럼
 * 남아 있으면 사용자는 이유도 모른 채 모든 동작이 실패하는 걸 보게 됩니다.
 * 이 안내가 "왜 로그인 화면으로 돌아왔는지"를 설명해 줍니다.
 *
 * 취소 버튼은 두지 않습니다 — 이미 로그아웃된 상태라 되돌릴 선택지가 없고,
 * 확인을 눌러 안내를 닫으면 로그인하지 않은 랜딩 화면이 남습니다.
 */
export function SessionExpiredDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <AlertDialog open={open} onOpenChange={(next) => !next && onClose()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>로그인이 만료됐어요</AlertDialogTitle>
          <AlertDialogDescription>
            한동안 사용하지 않아 안전을 위해 자동으로 로그아웃했어요. 이어서 하시려면 다시 로그인해주세요.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogAction onClick={onClose}>다시 로그인하기</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
