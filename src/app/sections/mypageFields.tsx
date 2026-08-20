/**
 * 마이페이지 패널들이 공유하는 입력 조각들입니다.
 *
 * `MyPage.tsx` 안에 있던 것을 그대로 옮겼습니다. "우리 아이" 패널이 별 파일로 나가면서
 * 양쪽에서 같은 모양을 써야 했고, 이미 길어진 `MyPage.tsx`에 화면을 더 얹지 않기 위해서입니다.
 */

export function FieldLabel({ children }: { children: React.ReactNode }) {
  return <p className="text-xs font-bold mb-1.5" style={{ color: "#6B7280" }}>{children}</p>;
}

export function TextField({
  value,
  onChange,
  placeholder,
  readOnly,
  type = "text",
}: {
  value: string;
  onChange?: (v: string) => void;
  placeholder?: string;
  readOnly?: boolean;
  type?: string;
}) {
  return (
    <input
      value={value}
      type={type}
      readOnly={readOnly}
      onChange={(e) => onChange?.(e.target.value)}
      placeholder={placeholder}
      className="w-full rounded-2xl px-4 py-3 text-sm outline-none"
      style={{ background: readOnly ? "#F9FAFB" : "var(--input-background)", border: "1.5px solid #F3F4F6", color: "#1F0A3C" }}
    />
  );
}

export function SaveButton({
  onClick,
  label = "저장하기",
  disabled = false,
}: {
  onClick: () => void;
  label?: string;
  /** 비밀번호 확인처럼 시간이 걸리는 처리 중에 중복 클릭을 막습니다. */
  disabled?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      aria-busy={disabled}
      className="w-full rounded-2xl font-bold text-sm text-white transition-all active:scale-[0.98] disabled:opacity-60 disabled:active:scale-100"
      style={{ height: 48, background: "linear-gradient(135deg,#E879A0,#F472B6)" }}
    >
      {disabled ? "확인 중…" : label}
    </button>
  );
}

/** 정보 변경 전에 본인 확인용 현재 비밀번호를 받는 공용 입력란입니다. 이메일 계정에서만 표시됩니다. */
export function PasswordConfirmField({
  show,
  value,
  onChange,
  error,
}: {
  show: boolean;
  value: string;
  onChange: (v: string) => void;
  error: string | null;
}) {
  if (!show) return null;
  return (
    <div>
      <FieldLabel>현재 비밀번호 확인</FieldLabel>
      <input
        type="password"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="변경하려면 비밀번호를 입력하세요"
        className="w-full rounded-2xl px-4 py-3 text-sm outline-none"
        style={{ background: "var(--input-background)", border: "1.5px solid #F3F4F6", color: "#1F0A3C" }}
      />
      {error && <p className="text-xs mt-1.5 font-bold" style={{ color: "#EF4444" }}>{error}</p>}
    </div>
  );
}

export function Toast({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <div className="fixed left-1/2 bottom-6 -translate-x-1/2 z-[9999] px-4 py-2.5 rounded-full text-xs font-bold text-white" style={{ background: "#1F0A3C" }}>
      {message}
    </div>
  );
}
