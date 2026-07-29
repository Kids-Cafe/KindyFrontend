import { useState } from "react";
import { isValidBusinessRegNo } from "@/app/auth/validation";
import { openAddressSearch } from "@/app/auth/addressSearch";
import type { KindergartenRegisterPayload } from "@/app/auth/mockSignup";

const inputStyle = { height: 54, border: "1.5px solid #E5E7EB", background: "#FAFAFA", color: "#1F0A3C" } as const;

export function KindergartenRegisterStep({
  onSubmit,
}: {
  onSubmit: (payload: KindergartenRegisterPayload) => void;
}) {
  const [name, setName] = useState("");
  const [businessRegNo, setBusinessRegNo] = useState("");
  const [zonecode, setZonecode] = useState("");
  const [address, setAddress] = useState("");
  const [addressDetail, setAddressDetail] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function handleSearchAddress() {
    try {
      const result = await openAddressSearch();
      setZonecode(result.zonecode);
      setAddress(result.roadAddress);
    } catch {
      setError("주소 검색을 열지 못했어요. 잠시 후 다시 시도해주세요.");
    }
  }

  function handleSubmit() {
    if (!name.trim()) return setError("유치원 이름을 입력해주세요");
    if (!isValidBusinessRegNo(businessRegNo)) return setError("사업자등록번호 형식을 확인해주세요 (예: 123-45-67890)");
    if (!zonecode || !address) return setError("주소를 검색해주세요");
    if (!addressDetail.trim()) return setError("상세주소를 입력해주세요");
    setError(null);
    onSubmit({ name: name.trim(), zonecode, address, addressDetail: addressDetail.trim(), businessRegNo: businessRegNo.trim() });
  }

  return (
    <div>
      <h2 className="text-xl font-bold mb-1" style={{ fontFamily: "'Fredoka',sans-serif", color: "#1F0A3C" }}>
        유치원을 등록해주세요
      </h2>
      <p className="text-sm mb-6" style={{ color: "#6B7280" }}>원장님 계정으로 유치원을 새로 만들게요</p>

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
            style={{ height: 54, background: "#F3F4F6", color: "#1F0A3C" }}>
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

      <button onClick={handleSubmit}
        className="w-full rounded-2xl font-bold text-white text-base transition-all hover:opacity-90 active:scale-[0.98]"
        style={{ height: 52, background: "linear-gradient(135deg, #E879A0 0%, #F472B6 50%, #C084FC 100%)" }}>
        등록하고 시작하기
      </button>
    </div>
  );
}
