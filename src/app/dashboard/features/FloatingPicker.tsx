import { useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import { createPortal } from "react-dom";

/**
 * Dialog(z-[150]) 안에서도 항상 위에 뜨는 버튼식 선택기 패널입니다. Radix Popover는 z-50이라
 * Dialog 오버레이에 가려지는 문제가 있어서, body에 직접 포탈하고 z-index를 더 높게 고정합니다.
 */
export function FloatingPicker({
  open,
  onOpenChange,
  trigger,
  children,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  trigger: (props: { ref: React.RefObject<HTMLButtonElement>; onClick: () => void }) => ReactNode;
  children: ReactNode;
}) {
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);

  useEffect(() => {
    if (!open) return;
    function updatePos() {
      const rect = triggerRef.current?.getBoundingClientRect();
      if (!rect) return;
      const panelWidth = 288;
      let left = rect.left;
      if (left + panelWidth > window.innerWidth - 8) left = Math.max(8, window.innerWidth - panelWidth - 8);
      let top = rect.bottom + 6;
      if (top + 360 > window.innerHeight) top = Math.max(8, rect.top - 366);
      setPos({ top, left });
    }
    updatePos();
    window.addEventListener("resize", updatePos);
    window.addEventListener("scroll", updatePos, true);
    return () => {
      window.removeEventListener("resize", updatePos);
      window.removeEventListener("scroll", updatePos, true);
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    function handlePointerDown(e: PointerEvent) {
      const target = e.target as Node;
      if (panelRef.current?.contains(target) || triggerRef.current?.contains(target)) return;
      onOpenChange(false);
    }
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") onOpenChange(false);
    }
    document.addEventListener("pointerdown", handlePointerDown, true);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown, true);
      document.removeEventListener("keydown", handleKey);
    };
  }, [open, onOpenChange]);

  return (
    <>
      {trigger({ ref: triggerRef, onClick: () => onOpenChange(!open) })}
      {open && pos &&
        createPortal(
          <div
            ref={panelRef}
            className="fixed rounded-2xl border bg-card p-3 shadow-xl"
            style={{ top: pos.top, left: pos.left, width: 288, zIndex: 9999, borderColor: "rgba(232,121,160,0.2)" }}
          >
            {children}
          </div>,
          document.body,
        )}
    </>
  );
}
