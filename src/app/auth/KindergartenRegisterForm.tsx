import { useState } from "react";
import { isValidBusinessRegNo } from "@/app/auth/validation";
import { openAddressSearch } from "@/app/auth/addressSearch";
import { ApiError } from "@/app/lib/api";
import type { KindergartenRegisterPayload } from "@/app/auth/signup";

/**
 * 유치원 등록 입력란입니다. 온보딩(원장 가입)과 마이페이지(가입 후 등록) 두 곳에서
 * 같은 항목을 받으므로 폼만 따로 떼어 두 화면이 함께 씁니다.
 *
 * @param dense 마이페이지 패널처럼 좁은 자리에서 쓸 때 입력란 높이를 줄입니다.
 */
export function KindergartenRegisterForm({
  onSubmit,
  submitLabel = "등록하고 시작하기",
  dense = false,
}: {
  /** 등록 요청입니다. 실패는 던져 주세요 — 폼이 안내 문구로 보여줍니다. */
  onSubmit: (payload: KindergartenRegisterPayload) => void | Promise<void>;
  submitLabel?: string;
  dense?: boolean;
}) {
  const [name, setName] = useState("");
  const [businessRegNo, setBusinessRegNo] = useState("");
  const [zonecode, setZonecode] = useState("");
  const [address, setAddress] = useState("");
  const [addressDetail, setAddressDetail] = useState("");
  const [error, setError] = useState<string | null>(null);
  /** 등록 요청이 도는 동안 중복 제출을 막습니다. */
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fieldHeight = dense ? 46 : 54;
  const inputStyle = { height: fieldHeight, border: "1.5px solid #E5E7EB", background: "#FAFAFA", color: "#1F0A3C" } as const;

  async function handleSearchAddress() {
    try {
      const result = await openAddressSearch();
      setZonecode(result.zonecode);
      setAddress(result.roadAddress);
    } catch {
      setError("주소 검색을 열지 못했어요. 잠시 후 다시 시도해주세요.");
    }
  }

  async function handleSubmit() {
    if (isSubmitting) return;
    if (!name.trim()) return setError("유치원 이름을 입력해주세요");
    if (!isValidBusinessRegNo(businessRegNo)) return setError("사업자등록번호 형식을 확인해주세요 (예: 123-45-67890)");
    if (!zonecode || !address) return setError("주소를 검색해주세요");
    if (!addressDetail.trim()) return setError("상세주소를 입력해주세요");

    setError(null);
    setIsSubmitting(true);
    try {
      await onSubmit({
        name: name.trim(),
        zonecode,
        address,
        addressDetail: addressDetail.trim(),
        businessRegNo: businessRegNo.trim(),
      });
    } catch (cause) {
      console.error("[Kindy] 유치원 등록 실패", cause);
      setError(
        cause instanceof ApiError && cause.code === "DUPLICATE_KEY"
          ? "이미 등록된 사업자등록번호예요. 번호를 확인해주세요."
          : "유치원을 등록하지 못했어요. 잠시 후 다시 시도해주세요.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={(e) => { e.preventDefault(); void handleSubmit(); }}>
      <div className="space-y-3 mb-4">
        <input type="text" placeholder="유치원 이름" value={name} onChange={(e) => setName(e.target.value)}
          className="w-full rounded-2xl px-4 outline-none text-sm" style={inputStyle} />
        <input type="text" placeholder="사업자등록번호 (예: 123-45-67890)" value={businessRegNo} onChange={(e) => setBusinessRegNo(e.target.value)}
          className="w-full rounded-2xl px-4 outline-none text-sm" style={inputStyle} />
        <div className="flex gap-2">
          <input type="text" placeholder="우편번호" readOnly value={zonecode}
            className="w-28 rounded-2xl px-4 outline-none text-sm" style={inputStyle} />
          <button type="button" onClick={handleSearchAddress}
            className="px-4 rounded-2xl text-sm font-bold whitespace-nowrap"
            style={{ height: fieldHeight, background: "#F3F4F6", color: "#1F0A3C" }}>
            주소 검색
          </button>
        </div>
        {zonecode && (
          <input type="text" readOnly value={address}
            className="w-full rounded-2xl px-4 outline-none text-sm" style={inputStyle} />
        )}
        <input type="text" placeholder="상세주소" value={addressDetail} onChange={(e) => setAddressDetail(e.target.value)}
          className="w-full rounded-2xl px-4 outline-none text-sm" style={inputStyle} />
      </div>

      {error && <p className="text-xs font-semibold mb-4" style={{ color: "#DC2626" }}>{error}</p>}

      <button type="submit" disabled={isSubmitting} aria-busy={isSubmitting}
        className="w-full rounded-2xl font-bold text-white text-base transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-60 disabled:active:scale-100"
        style={{ height: dense ? 48 : 52, background: "linear-gradient(135deg, #E879A0 0%, #F472B6 50%, #C084FC 100%)" }}>
        {isSubmitting ? "등록 중…" : submitLabel}
      </button>
    </form>
  );
}
