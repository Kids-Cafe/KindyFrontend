import { useCallback, useState } from "react";
import type { ReactNode } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/app/components/ui/alert-dialog";

export interface ConfirmRequest {
  title: string;
  /** 무엇이 사라지는지, 되돌릴 수 있는지를 구체적으로 적어주세요. */
  description: ReactNode;
  /** 확인 버튼 문구. 기본값은 "삭제"입니다. */
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
}

/**
 * 되돌릴 수 없는 동작 앞에 한 번 물어보는 다이얼로그를 붙여주는 훅입니다.
 *
 * 반/역할/일정처럼 지우면 끝인 데이터가 클릭 한 번에 날아가지 않게 하는 게 목적이라,
 * 확인 버튼에 기본 포커스를 두지 않습니다(Radix가 취소에 포커스를 줍니다).
 *
 *   const { ask, dialog } = useConfirm();
 *   <button onClick={() => ask({ title: "...", description: "...", onConfirm: () => remove(id) })} />
 *   {dialog}
 */
export function useConfirm() {
  const [request, setRequest] = useState<ConfirmRequest | null>(null);

  const ask = useCallback((next: ConfirmRequest) => setRequest(next), []);

  const dialog = (
    <AlertDialog open={request !== null} onOpenChange={(open) => !open && setRequest(null)}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{request?.title}</AlertDialogTitle>
          <AlertDialogDescription>{request?.description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>{request?.cancelLabel ?? "취소"}</AlertDialogCancel>
          <AlertDialogAction
            onClick={() => {
              request?.onConfirm();
              setRequest(null);
            }}
            className="bg-[#EF4444] text-white hover:bg-[#DC2626] focus-visible:ring-[#EF4444]/30"
          >
            {request?.confirmLabel ?? "삭제"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );

  return { ask, dialog };
}
