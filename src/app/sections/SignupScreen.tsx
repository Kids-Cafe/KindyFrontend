import { useState } from "react";
import type { CSSProperties, FocusEvent, ReactNode } from "react";
import { ChevronLeft, X, Check } from "lucide-react";
import mushroomBg from "@/imports/image_22d709cf.png";
import { MiniStar, KioSVG, KinaSVG } from "@/app/components/decorative";
import { useAuth } from "@/app/auth/AuthContext";
import {
  isValidEmail,
  isPasswordValid,
  isValidPhone,
  isValidLoginId,
  isValidBirthDate,
  isMockVerificationCodeValid,
} from "@/app/auth/validation";
import { isEmailTaken, registerMockUser } from "@/app/auth/mockSignup";
import { openAddressSearch } from "@/app/auth/addressSearch";
import type { StudentGender } from "@/app/auth/types";
import { useLeaveConfirmation } from "@/app/hooks/useLeaveConfirmation";

interface FormState {
  name: string;
  email: string;
  password: string;
  passwordConfirm: string;
  phone: string;
  zonecode: string;
  roadAddress: string;
  jibunAddress: string;
  addressDetail: string;
}

const EMPTY_FORM: FormState = {
  name: "",
  email: "",
  password: "",
  passwordConfirm: "",
  phone: "",
  zonecode: "",
  roadAddress: "",
  jibunAddress: "",
  addressDetail: "",
};

interface ChildFormState {
  loginId: string;
  password: string;
  passwordConfirm: string;
  name: string;
  phone: string;
  birthDate: string;
  gender: StudentGender | null;
}

const EMPTY_CHILD_FORM: ChildFormState = {
  loginId: "",
  password: "",
  passwordConfirm: "",
  name: "",
  phone: "",
  birthDate: "",
  gender: null,
};

/**
 * 정보 입력 전에 거치는 단계입니다: 계정 유형 선택 →
 * (아동이면) 법적대리인 동의 → 법적대리인 인증(목업) → 정보 입력 →
 * (성인이면) 정보 입력.
 */
type SignupStep = "ageSelect" | "form" | "childConsent" | "childVerify" | "childForm";

type FieldErrors = Partial<Record<"name" | "email" | "password" | "passwordConfirm" | "phone" | "address" | "addressDetail", string>>;

type ChildFieldErrors = Partial<Record<"loginId" | "password" | "passwordConfirm" | "name" | "phone" | "birthDate" | "gender", string>>;

const inputStyle: CSSProperties = { height: 54, border: "1.5px solid #E5E7EB", background: "#FAFAFA", color: "#1F0A3C" };
const focusIn = (e: FocusEvent<HTMLInputElement>) => { e.target.style.border = "1.5px solid #E879A0"; e.target.style.boxShadow = "0 0 0 3px rgba(232,121,160,0.12)"; };
const focusOut = (e: FocusEvent<HTMLInputElement>) => { e.target.style.border = "1.5px solid #E5E7EB"; e.target.style.boxShadow = "none"; };

/**
 * 회원가입 전용 화면입니다. 소셜 로그인 버튼은 넣지 않고, 성인/아동 계정 유형을
 * 먼저 나눈 뒤 그에 맞는 정보를 입력받습니다. 아직 백엔드가 없어 mock 저장소
 * (localStorage)에 계정을 만들고 바로 로그인 세션으로 반영합니다.
 */
export function SignupScreen({
  onClose,
  onSwitchToLogin,
  onSignedUp,
}: {
  onClose: () => void;
  onSwitchToLogin: () => void;
  onSignedUp: () => void;
}) {
  const [step, setStep] = useState<SignupStep>("ageSelect");
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [addressType, setAddressType] = useState<"road" | "jibun">("road");

  // ── 아동 가입 전용 상태 ──
  const [consentChecked, setConsentChecked] = useState(false);
  const [guardianName, setGuardianName] = useState("");
  const [guardianPhone, setGuardianPhone] = useState("");
  const [guardianStepError, setGuardianStepError] = useState<string | null>(null);
  const [verificationSent, setVerificationSent] = useState(false);
  const [verificationCode, setVerificationCode] = useState("");
  const [guardianVerified, setGuardianVerified] = useState(false);
  const [childForm, setChildForm] = useState<ChildFormState>(EMPTY_CHILD_FORM);
  const [childErrors, setChildErrors] = useState<ChildFieldErrors>({});

  const { setSession } = useAuth();

  // 정보를 입력하기 시작한 뒤에는 뒤로가기/앞으로가기·새로고침 시 확인창을 띄워 입력 내용을 잃지 않게 합니다.
  useLeaveConfirmation(step !== "ageSelect", onClose);

  const address = addressType === "road" ? form.roadAddress : form.jibunAddress;

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function updateChild<K extends keyof ChildFormState>(key: K, value: ChildFormState[K]) {
    setChildForm((prev) => ({ ...prev, [key]: value }));
  }

  function validate(): FieldErrors {
    const next: FieldErrors = {};
    if (!form.name.trim()) next.name = "이름을 입력해주세요";
    if (!isValidEmail(form.email)) next.email = "올바른 이메일 주소를 입력해주세요";
    else if (isEmailTaken(form.email)) next.email = "이미 가입된 이메일이에요";
    if (!isPasswordValid(form.password)) next.password = "8자 이상, 영문/숫자/특수문자 중 2가지 이상 조합해주세요";
    else if (form.password !== form.passwordConfirm) next.passwordConfirm = "비밀번호가 일치하지 않아요";
    if (!isValidPhone(form.phone)) next.phone = "올바른 전화번호를 입력해주세요 (예: 010-1234-5678)";
    if (!form.zonecode || !address) next.address = "주소를 검색해주세요";
    if (!form.addressDetail.trim()) next.addressDetail = "상세주소를 입력해주세요";
    return next;
  }

  function validateChild(): ChildFieldErrors {
    const next: ChildFieldErrors = {};
    if (!isValidLoginId(childForm.loginId)) next.loginId = "4~20자의 영문/숫자, -, _ 만 사용할 수 있어요";
    else if (isEmailTaken(childForm.loginId)) next.loginId = "이미 사용 중인 아이디예요";
    if (!isPasswordValid(childForm.password)) next.password = "8자 이상, 영문/숫자/특수문자 중 2가지 이상 조합해주세요";
    else if (childForm.password !== childForm.passwordConfirm) next.passwordConfirm = "비밀번호가 일치하지 않아요";
    if (!childForm.name.trim()) next.name = "이름을 입력해주세요";
    if (!isValidPhone(childForm.phone)) next.phone = "올바른 전화번호를 입력해주세요 (부모님 번호도 괜찮아요)";
    if (!isValidBirthDate(childForm.birthDate)) next.birthDate = "생년월일을 정확히 입력해주세요";
    if (!childForm.gender) next.gender = "학생 성별을 선택해주세요";
    return next;
  }

  async function handleSearchAddress() {
    try {
      const result = await openAddressSearch();
      setForm((prev) => ({ ...prev, zonecode: result.zonecode, roadAddress: result.roadAddress, jibunAddress: result.jibunAddress }));
      setErrors((prev) => ({ ...prev, address: undefined }));
    } catch {
      setErrors((prev) => ({ ...prev, address: "주소 검색을 열지 못했어요. 잠시 후 다시 시도해주세요." }));
    }
  }

  function completeSignup() {
    const user = registerMockUser({
      name: form.name.trim(),
      email: form.email.trim(),
      phone: form.phone.trim(),
      zonecode: form.zonecode,
      address,
      addressDetail: form.addressDetail.trim(),
      accountType: "adult",
    });
    setSession({ user, accessToken: crypto.randomUUID(), expiresAt: Date.now() + 1000 * 60 * 60 * 24 * 7 });
    onSignedUp();
  }

  function completeChildSignup() {
    const user = registerMockUser({
      name: childForm.name.trim(),
      email: childForm.loginId.trim(),
      phone: childForm.phone.trim(),
      accountType: "child",
      birthDate: childForm.birthDate,
      gender: childForm.gender ?? undefined,
      guardianName: guardianName.trim(),
      guardianPhone: guardianPhone.trim(),
    });
    setSession({ user, accessToken: crypto.randomUUID(), expiresAt: Date.now() + 1000 * 60 * 60 * 24 * 7 });
    onSignedUp();
  }

  function handleSubmit() {
    const nextErrors = validate();
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;
    completeSignup();
  }

  function handleChildSubmit() {
    const nextErrors = validateChild();
    setChildErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;
    completeChildSignup();
  }

  function handleSendVerificationCode() {
    if (!guardianName.trim()) return setGuardianStepError("법적대리인 이름을 입력해주세요");
    if (!isValidPhone(guardianPhone)) return setGuardianStepError("법적대리인 휴대폰 번호를 정확히 입력해주세요");
    setGuardianStepError(null);
    setVerificationSent(true);
    setGuardianVerified(false);
    setVerificationCode("");
  }

  function handleConfirmVerificationCode() {
    if (!isMockVerificationCodeValid(verificationCode)) {
      setGuardianStepError("인증번호 6자리를 입력해주세요");
      return;
    }
    setGuardianStepError(null);
    setGuardianVerified(true);
  }

  function handleBack() {
    if (step === "childVerify") setStep("childConsent");
    else if (step === "childForm") setStep("childVerify");
    else setStep("ageSelect");
  }

  return (
    <div className="fixed inset-0 z-[9000] flex" role="dialog" aria-modal="true" aria-label="회원가입">

      {/* ── 왼쪽: 비주얼 패널 ── */}
      <div className="hidden md:flex relative w-[46%] flex-col overflow-hidden">
        <img src={mushroomBg} alt="" className="absolute inset-0 w-full h-full object-cover object-center" />
        <div className="absolute inset-0" style={{ background: "linear-gradient(160deg, rgba(30,10,60,0.55) 0%, rgba(120,40,160,0.25) 50%, rgba(10,30,10,0.60) 100%)" }} />

        <div className="relative z-10 p-8 flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center shadow-lg" style={{ background: "linear-gradient(135deg,#E879A0,#F472B6)" }}>
            <MiniStar size={20} color="white" />
          </div>
          <span className="text-2xl font-bold text-white" style={{ fontFamily: "'Fredoka',sans-serif" }}>Kindy</span>
        </div>

        <div className="relative z-10 flex-1 flex items-end justify-center pb-16 gap-6">
          <div style={{ filter: "drop-shadow(0 0 24px rgba(244,114,182,0.6))", animation: "float 3.8s ease-in-out infinite" }}>
            <KinaSVG className="h-52 w-auto" />
          </div>
          <div style={{ filter: "drop-shadow(0 0 24px rgba(96,165,250,0.6))", animation: "float 3.4s ease-in-out infinite", animationDelay: "0.6s" }}>
            <KioSVG className="h-52 w-auto" />
          </div>
        </div>

        <div className="relative z-10 px-10 pb-12">
          <p className="text-white text-xl font-bold leading-snug mb-2" style={{ fontFamily: "'Fredoka',sans-serif", textShadow: "0 2px 12px rgba(0,0,0,0.4)" }}>
            아이의 하루를 함께 기억하는<br />따뜻한 AI 친구
          </p>
          <p className="text-sm" style={{ color: "rgba(255,255,255,0.65)" }}>키오와 키나가 언제나 옆에 있어요</p>
        </div>
      </div>

      {/* ── 오른쪽: 폼 패널 ── */}
      <div className="flex-1 bg-white flex flex-col overflow-y-auto">
        <div className="flex items-center justify-between px-8 pt-8 pb-2">
          {step !== "ageSelect" ? (
            <button onClick={handleBack} aria-label="이전 단계로"
              className="w-9 h-9 rounded-full flex items-center justify-center transition-all hover:bg-gray-100 active:scale-95"
              style={{ color: "#6B7280" }}>
              <ChevronLeft className="w-5 h-5" />
            </button>
          ) : (
            <button onClick={onClose} aria-label="회원가입 창 닫기"
              className="w-9 h-9 rounded-full flex items-center justify-center transition-all hover:bg-gray-100 active:scale-95"
              style={{ color: "#6B7280" }}>
              <X className="w-5 h-5" />
            </button>
          )}
          <div className="md:hidden flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: "linear-gradient(135deg,#E879A0,#F472B6)" }}>
              <MiniStar size={16} color="white" />
            </div>
            <span className="text-lg font-bold" style={{ fontFamily: "'Fredoka',sans-serif", color: "#3B1355" }}>Kindy</span>
          </div>
          <div className="w-9" />
        </div>

        {step === "ageSelect" && (
          <div className="flex-1 flex flex-col justify-center px-8 md:px-12 py-8 max-w-md w-full mx-auto">
            <div className="mb-8">
              <h1 className="text-3xl font-bold mb-2" style={{ fontFamily: "'Fredoka',sans-serif", color: "#1F0A3C" }}>
                함께 시작해요!
              </h1>
              <p className="text-sm" style={{ color: "#9CA3AF" }}>가입하시는 분에 대해 먼저 알려주세요</p>
            </div>

            <div className="space-y-3">
              <button onClick={() => setStep("form")}
                className="w-full text-left rounded-2xl px-5 py-4 transition-all hover:opacity-90 active:scale-[0.98]"
                style={{ height: 76, border: "1.5px solid #E5E7EB", background: "#FAFAFA" }}>
                <p className="text-sm font-bold" style={{ color: "#1F0A3C" }}>성인 회원가입</p>
                <p className="text-xs mt-0.5" style={{ color: "#9CA3AF" }}>본인 명의로 직접 가입할게요</p>
              </button>
              <button onClick={() => setStep("childConsent")}
                className="w-full text-left rounded-2xl px-5 py-4 transition-all hover:opacity-90 active:scale-[0.98]"
                style={{ height: 76, border: "1.5px solid #E5E7EB", background: "#FAFAFA" }}>
                <p className="text-sm font-bold" style={{ color: "#1F0A3C" }}>아동 회원가입</p>
                <p className="text-xs mt-0.5" style={{ color: "#9CA3AF" }}>법적대리인 동의 후 아이 계정을 만들게요</p>
              </button>
            </div>

            <p className="text-center text-xs mt-8" style={{ color: "#9CA3AF" }}>
              이미 계정이 있으신가요? <button onClick={onSwitchToLogin} className="font-bold" style={{ color: "#E879A0" }}>로그인</button>
            </p>
          </div>
        )}

        {step === "childConsent" && (
          <div className="flex-1 flex flex-col justify-center px-8 md:px-12 py-8 max-w-md w-full mx-auto">
            <div className="flex justify-center mb-6">
              <KinaSVG className="h-28 w-auto" />
            </div>
            <h1 className="text-center text-2xl font-bold mb-2" style={{ fontFamily: "'Fredoka',sans-serif", color: "#1F0A3C" }}>
              법적대리인의 동의가 필요해요
            </h1>
            <p className="text-center text-sm mb-6" style={{ color: "#9CA3AF" }}>
              아이 계정을 만들려면 법적대리인(부모님 등)이 정보 제공에 동의하고<br />직접 본인 인증을 진행해야 해요
            </p>

            <button
              type="button"
              onClick={() => setConsentChecked((v) => !v)}
              className="w-full flex items-start gap-3 rounded-2xl px-4 py-4 mb-6 text-left transition-all"
              style={{ border: "1.5px solid #E5E7EB", background: "#FAFAFA" }}>
              <span
                className="mt-0.5 w-5 h-5 rounded-md flex items-center justify-center shrink-0"
                style={{
                  background: consentChecked ? "linear-gradient(135deg, #E879A0 0%, #F472B6 100%)" : "white",
                  border: consentChecked ? "none" : "1.5px solid #D1D5DB",
                }}>
                {consentChecked && <Check className="w-3.5 h-3.5" style={{ color: "white" }} strokeWidth={3} />}
              </span>
              <span className="text-sm" style={{ color: "#1F0A3C" }}>
                <span className="font-bold">(필수)</span> 법적대리인은 아이의 회원가입을 위해 이름, 연락처 등의 개인정보를
                제공하는 것에 동의합니다.
              </span>
            </button>

            <button
              onClick={() => setStep("childVerify")}
              disabled={!consentChecked}
              className="w-full rounded-2xl font-bold text-white text-base transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed"
              style={{
                height: 52,
                background: "linear-gradient(135deg, #E879A0 0%, #F472B6 50%, #C084FC 100%)",
                boxShadow: "0 4px 20px rgba(232,121,160,0.40)",
              }}>
              동의하고 계속하기
            </button>
          </div>
        )}

        {step === "childVerify" && (
          <div className="flex-1 flex flex-col justify-center px-8 md:px-12 py-8 max-w-md w-full mx-auto">
            <div className="mb-8">
              <h1 className="text-3xl font-bold mb-2" style={{ fontFamily: "'Fredoka',sans-serif", color: "#1F0A3C" }}>
                법적대리인 본인인증
              </h1>
              <p className="text-sm" style={{ color: "#9CA3AF" }}>휴대폰 번호로 법적대리인 본인인증을 진행해주세요 (테스트 인증)</p>
            </div>

            <div className="space-y-3 mb-2">
              <Field label="법적대리인 이름">
                <input type="text" placeholder="법적대리인 이름을 입력해주세요"
                  value={guardianName} onChange={(e) => setGuardianName(e.target.value)}
                  disabled={verificationSent}
                  className="w-full rounded-2xl px-4 outline-none transition-all text-sm disabled:opacity-60"
                  style={inputStyle} onFocus={focusIn} onBlur={focusOut} />
              </Field>

              <Field label="법적대리인 휴대폰 번호">
                <div className="flex gap-2">
                  <input type="tel" placeholder="010-1234-5678"
                    value={guardianPhone} onChange={(e) => setGuardianPhone(e.target.value)}
                    disabled={verificationSent}
                    className="flex-1 rounded-2xl px-4 outline-none transition-all text-sm disabled:opacity-60"
                    style={inputStyle} onFocus={focusIn} onBlur={focusOut} />
                  <button type="button" onClick={handleSendVerificationCode} disabled={verificationSent}
                    className="px-4 rounded-2xl text-sm font-bold whitespace-nowrap disabled:opacity-60"
                    style={{ height: 54, background: "#F3F4F6", color: "#1F0A3C" }}>
                    {verificationSent ? "전송됨" : "인증번호 받기"}
                  </button>
                </div>
              </Field>

              {verificationSent && (
                <Field label="인증번호">
                  <div className="flex gap-2">
                    <input type="text" inputMode="numeric" placeholder="6자리 숫자를 입력해주세요 (예: 123456)"
                      value={verificationCode} onChange={(e) => setVerificationCode(e.target.value)}
                      disabled={guardianVerified}
                      className="flex-1 rounded-2xl px-4 outline-none transition-all text-sm disabled:opacity-60"
                      style={inputStyle} onFocus={focusIn} onBlur={focusOut} />
                    <button type="button" onClick={handleConfirmVerificationCode} disabled={guardianVerified}
                      className="px-4 rounded-2xl text-sm font-bold whitespace-nowrap disabled:opacity-60"
                      style={{ height: 54, background: guardianVerified ? "#DCFCE7" : "#F3F4F6", color: guardianVerified ? "#16A34A" : "#1F0A3C" }}>
                      {guardianVerified ? "인증완료" : "인증 확인"}
                    </button>
                  </div>
                  <p className="text-xs mt-1.5" style={{ color: "#9CA3AF" }}>테스트 환경이라 아무 숫자 6자리나 입력하시면 돼요</p>
                </Field>
              )}

              <ErrorText message={guardianStepError ?? undefined} />
            </div>

            <button
              onClick={() => setStep("childForm")}
              disabled={!guardianVerified}
              className="w-full rounded-2xl font-bold text-white text-base transition-all hover:opacity-90 active:scale-[0.98] mt-4 disabled:opacity-40 disabled:cursor-not-allowed"
              style={{
                height: 52,
                background: "linear-gradient(135deg, #E879A0 0%, #F472B6 50%, #C084FC 100%)",
                boxShadow: "0 4px 20px rgba(232,121,160,0.40)",
              }}>
              인증 완료, 다음으로
            </button>
          </div>
        )}

        {step === "childForm" && (
          <div className="flex-1 flex flex-col justify-center px-8 md:px-12 py-8 max-w-md w-full mx-auto">
            <div className="mb-8">
              <h1 className="text-3xl font-bold mb-2" style={{ fontFamily: "'Fredoka',sans-serif", color: "#1F0A3C" }}>
                아이 계정을 만들어요
              </h1>
              <p className="text-sm" style={{ color: "#9CA3AF" }}>키오와 키나를 지금 만나보세요</p>
            </div>

            <div className="space-y-3 mb-2">
              <Field label="아이디">
                <input type="text" placeholder="4~20자의 영문/숫자"
                  value={childForm.loginId} onChange={(e) => updateChild("loginId", e.target.value)}
                  className="w-full rounded-2xl px-4 outline-none transition-all text-sm"
                  style={inputStyle} onFocus={focusIn} onBlur={focusOut} />
              </Field>
              <ErrorText message={childErrors.loginId} />

              <Field label="비밀번호">
                <input type="password" placeholder="8자 이상, 영문/숫자/특수문자 2가지 이상"
                  value={childForm.password} onChange={(e) => updateChild("password", e.target.value)}
                  className="w-full rounded-2xl px-4 outline-none transition-all text-sm"
                  style={inputStyle} onFocus={focusIn} onBlur={focusOut} />
              </Field>
              <ErrorText message={childErrors.password} />

              <Field label="비밀번호 확인">
                <input type="password" placeholder="비밀번호를 한 번 더 입력해주세요"
                  value={childForm.passwordConfirm} onChange={(e) => updateChild("passwordConfirm", e.target.value)}
                  className="w-full rounded-2xl px-4 outline-none transition-all text-sm"
                  style={inputStyle} onFocus={focusIn} onBlur={focusOut} />
              </Field>
              <ErrorText message={childErrors.passwordConfirm} />

              <Field label="이름">
                <input type="text" placeholder="아이의 이름을 입력해주세요"
                  value={childForm.name} onChange={(e) => updateChild("name", e.target.value)}
                  className="w-full rounded-2xl px-4 outline-none transition-all text-sm"
                  style={inputStyle} onFocus={focusIn} onBlur={focusOut} />
              </Field>
              <ErrorText message={childErrors.name} />

              <Field label="전화번호">
                <input type="tel" placeholder="010-1234-5678 (부모님 번호도 괜찮아요)"
                  value={childForm.phone} onChange={(e) => updateChild("phone", e.target.value)}
                  className="w-full rounded-2xl px-4 outline-none transition-all text-sm"
                  style={inputStyle} onFocus={focusIn} onBlur={focusOut} />
                <p className="text-xs mt-1.5" style={{ color: "#9CA3AF" }}>본인 인증용이 아니라 비밀번호 재발급 시에만 사용해요</p>
              </Field>
              <ErrorText message={childErrors.phone} />

              <Field label="생년월일">
                <input type="date" placeholder="YYYY-MM-DD"
                  value={childForm.birthDate} onChange={(e) => updateChild("birthDate", e.target.value)}
                  className="w-full rounded-2xl px-4 outline-none transition-all text-sm"
                  style={inputStyle} onFocus={focusIn} onBlur={focusOut} />
              </Field>
              <ErrorText message={childErrors.birthDate} />

              <Field label="학생 성별">
                <div className="grid grid-cols-2 gap-2">
                  <button type="button" onClick={() => updateChild("gender", "male")}
                    className="rounded-2xl text-sm font-bold transition-all"
                    style={{
                      height: 54,
                      background: childForm.gender === "male" ? "#EFF6FF" : "#FAFAFA",
                      border: childForm.gender === "male" ? "1.5px solid #3B82F6" : "1.5px solid #E5E7EB",
                      color: childForm.gender === "male" ? "#3B82F6" : "#1F0A3C",
                    }}>
                    남
                  </button>
                  <button type="button" onClick={() => updateChild("gender", "female")}
                    className="rounded-2xl text-sm font-bold transition-all"
                    style={{
                      height: 54,
                      background: childForm.gender === "female" ? "#FDF2F8" : "#FAFAFA",
                      border: childForm.gender === "female" ? "1.5px solid #E879A0" : "1.5px solid #E5E7EB",
                      color: childForm.gender === "female" ? "#E879A0" : "#1F0A3C",
                    }}>
                    여
                  </button>
                </div>
              </Field>
              <ErrorText message={childErrors.gender} />
            </div>

            <button onClick={handleChildSubmit}
              className="w-full rounded-2xl font-bold text-white text-base transition-all hover:opacity-90 active:scale-[0.98] mb-5 mt-2"
              style={{
                height: 52,
                background: "linear-gradient(135deg, #E879A0 0%, #F472B6 50%, #C084FC 100%)",
                boxShadow: "0 4px 20px rgba(232,121,160,0.40)",
              }}>
              가입하기
            </button>

            <p className="text-center text-xs" style={{ color: "#9CA3AF" }}>
              이미 계정이 있으신가요? <button onClick={onSwitchToLogin} className="font-bold" style={{ color: "#E879A0" }}>로그인</button>
            </p>
          </div>
        )}

        {step === "form" && (
        <div className="flex-1 flex flex-col justify-center px-8 md:px-12 py-8 max-w-md w-full mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2" style={{ fontFamily: "'Fredoka',sans-serif", color: "#1F0A3C" }}>
              함께 시작해요!
            </h1>
            <p className="text-sm" style={{ color: "#9CA3AF" }}>키오와 키나를 지금 만나보세요</p>
          </div>

          <div className="space-y-3 mb-2">
            <Field label="이름">
              <input type="text" placeholder="본명을 입력해주세요"
                value={form.name} onChange={(e) => update("name", e.target.value)}
                className="w-full rounded-2xl px-4 outline-none transition-all text-sm"
                style={inputStyle} onFocus={focusIn} onBlur={focusOut} />
            </Field>
            <ErrorText message={errors.name} />

            <Field label="이메일 (아이디)">
              <input type="email" placeholder="이메일 주소를 입력해주세요"
                value={form.email} onChange={(e) => update("email", e.target.value)}
                className="w-full rounded-2xl px-4 outline-none transition-all text-sm"
                style={inputStyle} onFocus={focusIn} onBlur={focusOut} />
            </Field>
            <ErrorText message={errors.email} />

            <Field label="비밀번호">
              <input type="password" placeholder="8자 이상, 영문/숫자/특수문자 2가지 이상"
                value={form.password} onChange={(e) => update("password", e.target.value)}
                className="w-full rounded-2xl px-4 outline-none transition-all text-sm"
                style={inputStyle} onFocus={focusIn} onBlur={focusOut} />
            </Field>
            <ErrorText message={errors.password} />

            <Field label="비밀번호 확인">
              <input type="password" placeholder="비밀번호를 한 번 더 입력해주세요"
                value={form.passwordConfirm} onChange={(e) => update("passwordConfirm", e.target.value)}
                className="w-full rounded-2xl px-4 outline-none transition-all text-sm"
                style={inputStyle} onFocus={focusIn} onBlur={focusOut} />
            </Field>
            <ErrorText message={errors.passwordConfirm} />

            <Field label="전화번호">
              <input type="tel" placeholder="010-1234-5678"
                value={form.phone} onChange={(e) => update("phone", e.target.value)}
                className="w-full rounded-2xl px-4 outline-none transition-all text-sm"
                style={inputStyle} onFocus={focusIn} onBlur={focusOut} />
            </Field>
            <ErrorText message={errors.phone} />

            <Field label="주소">
              <div className="flex gap-2">
                <input type="text" placeholder="우편번호 검색을 눌러주세요" readOnly
                  value={form.zonecode}
                  className="w-28 rounded-2xl px-4 outline-none text-sm" style={inputStyle} />
                <button type="button" onClick={handleSearchAddress}
                  className="px-4 rounded-2xl text-sm font-bold whitespace-nowrap"
                  style={{ height: 54, background: "#F3F4F6", color: "#1F0A3C" }}>
                  우편번호 검색
                </button>
              </div>
              {form.zonecode && (
                <div className="mt-2 flex items-center gap-2">
                  <input type="text" readOnly value={address}
                    className="flex-1 rounded-2xl px-4 outline-none text-sm" style={inputStyle} />
                  <button type="button"
                    onClick={() => setAddressType((t) => (t === "road" ? "jibun" : "road"))}
                    className="px-3 h-[54px] rounded-2xl text-xs font-bold whitespace-nowrap"
                    style={{ background: "#F3F4F6", color: "#6B7280" }}>
                    {addressType === "road" ? "지번으로" : "도로명으로"}
                  </button>
                </div>
              )}
            </Field>
            <ErrorText message={errors.address} />

            <Field label="상세주소">
              <input type="text" placeholder="동/호수 등 상세주소를 입력해주세요"
                value={form.addressDetail} onChange={(e) => update("addressDetail", e.target.value)}
                className="w-full rounded-2xl px-4 outline-none transition-all text-sm"
                style={inputStyle} onFocus={focusIn} onBlur={focusOut} />
            </Field>
            <ErrorText message={errors.addressDetail} />
          </div>

          <button onClick={handleSubmit}
            className="w-full rounded-2xl font-bold text-white text-base transition-all hover:opacity-90 active:scale-[0.98] mb-5 mt-2"
            style={{
              height: 52,
              background: "linear-gradient(135deg, #E879A0 0%, #F472B6 50%, #C084FC 100%)",
              boxShadow: "0 4px 20px rgba(232,121,160,0.40)",
            }}>
            가입하기
          </button>

          <p className="text-center text-xs" style={{ color: "#9CA3AF" }}>
            이미 계정이 있으신가요? <button onClick={onSwitchToLogin} className="font-bold" style={{ color: "#E879A0" }}>로그인</button>
          </p>
        </div>
        )}
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-semibold mb-1.5" style={{ color: "#6B7280" }}>{label}</label>
      {children}
    </div>
  );
}

function ErrorText({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="text-xs font-semibold -mt-2" style={{ color: "#DC2626" }}>{message}</p>;
}
