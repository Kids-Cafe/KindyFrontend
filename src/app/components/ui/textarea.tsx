import * as React from "react";

import { cn } from "./utils";

/**
 * `field-sizing: content`는 2026년 현재 Chromium에만 있습니다(Safari·Firefox 미지원).
 * 지원하지 않는 브라우저에서는 textarea가 `min-h-16`에 갇혀 내용이 길어져도
 * 늘어나지 않으므로, 그럴 때만 높이를 직접 맞춰 줍니다.
 */
const SUPPORTS_FIELD_SIZING =
  typeof CSS !== "undefined" && typeof CSS.supports === "function" && CSS.supports("field-sizing", "content");

function Textarea({ className, onChange, ...props }: React.ComponentProps<"textarea">) {
  const ref = React.useRef<HTMLTextAreaElement | null>(null);

  const autoGrow = React.useCallback((el: HTMLTextAreaElement | null) => {
    if (!el || SUPPORTS_FIELD_SIZING) return;
    el.style.height = "auto"; // 줄어들 때도 따라오도록 먼저 초기화합니다.
    el.style.height = `${el.scrollHeight}px`;
  }, []);

  // 처음 붙을 때와, 값이 밖에서 바뀔 때(제출 후 초기화 등)도 높이를 맞춥니다.
  React.useLayoutEffect(() => {
    autoGrow(ref.current);
  }, [autoGrow, props.value, props.defaultValue]);

  return (
    <textarea
      ref={ref}
      data-slot="textarea"
      onChange={(e) => {
        autoGrow(e.currentTarget);
        onChange?.(e);
      }}
      className={cn(
        "resize-none border-input placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive dark:bg-input/30 flex field-sizing-content min-h-16 w-full rounded-md border bg-input-background px-3 py-2 text-base transition-[color,box-shadow] outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
        className,
      )}
      {...props}
    />
  );
}

export { Textarea };
