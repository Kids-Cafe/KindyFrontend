import { useState } from "react";
import {
  X, LogOut, Bell, Shield, Baby, ChevronRight, Check,
  ArrowLeft, UserCircle, KeyRound, MapPin, School, UserX, Phone, Link2,
} from "lucide-react";
import { useAuth } from "@/app/auth/AuthContext";
import { changePassword, verifyCurrentPassword } from "@/app/auth/password";
import { requestJoinKindergarten, searchKindergartens } from "@/app/auth/kindergartenSearch";
import { isPasswordValid } from "@/app/auth/validation";
import { ReceivedInvites } from "@/app/auth/ReceivedInvites";
import type { InviteTargetRole } from "@/app/auth/ReceivedInvites";
import type { KindergartenInfo } from "@/app/auth/types";
import { PROVIDERS, PROVIDER_ORDER } from "@/app/auth/providers";
import { ProviderIcon } from "@/app/auth/ProviderIcon";
import { UserAvatar } from "@/app/auth/UserAvatar";
import { getDisplayName } from "@/app/auth/getDisplayName";
import { openAddressSearch } from "@/app/auth/addressSearch";
import { useDashboardStoreOptional } from "@/app/dashboard/DashboardStoreContext";
import { useChildVoiceSettings } from "@/app/dashboard/childVoiceSettings";

type MenuKey =
  | "nickname" | "password" | "address" | "kindergartenClass" | "notifications"
  | "childInfo" | "linkedAccounts" | "phone" | "personalInfo" | "withdraw";

const MENU_ITEMS: { key: MenuKey; icon: typeof Baby; label: string; hint: string }[] = [
  { key: "nickname", icon: UserCircle, label: "별칭 변경", hint: "다른 사람에게 보여질 이름" },
  { key: "password", icon: KeyRound, label: "비밀번호 재설정", hint: "계정 보안 설정" },
  { key: "address", icon: MapPin, label: "주소 변경", hint: "우편번호 · 상세주소" },
  { key: "kindergartenClass", icon: School, label: "유치원 및 소속반 변경", hint: "소속 기관/반 정보" },
  { key: "childInfo", icon: Baby, label: "우리 아이 정보", hint: "이름 · 생년월일 · 관심사" },
  { key: "notifications", icon: Bell, label: "알림 설정", hint: "공지 · 일정 · 채팅 알림" },
  { key: "linkedAccounts", icon: Link2, label: "연동된 계정 보기", hint: "소셜 로그인 연동 현황" },
  { key: "phone", icon: Phone, label: "전화번호 변경", hint: "연락처 정보" },
  { key: "personalInfo", icon: Shield, label: "개인정보 변경", hint: "이름 · 이메일 확인" },
  { key: "withdraw", icon: UserX, label: "회원 탈퇴", hint: "계정 삭제 및 로그아웃" },
];

function formatJoinedAt(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "-";
  return `${date.getFullYear()}년 ${date.getMonth() + 1}월 ${date.getDate()}일`;
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return <p className="text-xs font-bold mb-1.5" style={{ color: "#6B7280" }}>{children}</p>;
}

function TextField({ value, onChange, placeholder, readOnly }: { value: string; onChange?: (v: string) => void; placeholder?: string; readOnly?: boolean }) {
  return (
    <input
      value={value}
      readOnly={readOnly}
      onChange={(e) => onChange?.(e.target.value)}
      placeholder={placeholder}
      className="w-full rounded-2xl px-4 py-3 text-sm outline-none"
      style={{ background: readOnly ? "#F9FAFB" : "var(--input-background)", border: "1.5px solid #F3F4F6", color: "#1F0A3C" }}
    />
  );
}

function SaveButton({
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
function PasswordConfirmField({
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

function Toast({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <div className="fixed left-1/2 bottom-6 -translate-x-1/2 z-[9999] px-4 py-2.5 rounded-full text-xs font-bold text-white" style={{ background: "#1F0A3C" }}>
      {message}
    </div>
  );
}

/** 마이페이지 서브패널 콘텐츠입니다. 실제 계정 설정 화면처럼 각 항목을 별도 화면으로 분리했습니다. */
function MyPagePanel({ panel, onDone }: { panel: MenuKey; onDone: (message?: string) => void }) {
  const { user, updateProfile, logout } = useAuth();
  const store = useDashboardStoreOptional();
  const voice = useChildVoiceSettings(user?.id ?? "unknown");

  const [nickname, setNickname] = useState(user?.nickname ?? user?.name ?? "");
  const [currentPw, setCurrentPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [pwConfirm, setPwConfirm] = useState("");
  const [pwError, setPwError] = useState<string | null>(null);
  /** 비밀번호 해싱 대조가 도는 동안 저장 버튼을 잠급니다. */
  const [isVerifying, setIsVerifying] = useState(false);
  const [zonecode, setZonecode] = useState(user?.zonecode ?? "");
  const [address, setAddress] = useState(user?.address ?? "");
  const [addressDetail, setAddressDetail] = useState(user?.addressDetail ?? "");
  const [phone, setPhone] = useState(user?.phone ?? "");
  const [name, setName] = useState(user?.name ?? "");
  const [childNickname, setChildNickname] = useState(store?.data.myChild?.nickname ?? "");
  const [kinderQuery, setKinderQuery] = useState("");
  const [kinderResults, setKinderResults] = useState<KindergartenInfo[]>([]);
  const [confirmWithdraw, setConfirmWithdraw] = useState(false);
  const [notifyNotices, setNotifyNotices] = useState(true);
  const [notifySchedule, setNotifySchedule] = useState(true);
  const [notifyChat, setNotifyChat] = useState(true);

  if (!user) return null;

  /** 이메일 계정은 저장 전에 현재 비밀번호를 확인합니다. 소셜 계정은 비밀번호가 없어 바로 저장합니다. */
  async function requirePassword(action: () => void) {
    if (user!.provider !== "email") {
      action();
      return;
    }
    if (isVerifying) return;

    setIsVerifying(true);
    try {
      if (!(await verifyCurrentPassword(user!.loginId ?? user!.id, pwConfirm))) {
        setPwError("비밀번호가 올바르지 않아요");
        return;
      }
      setPwError(null);
      setPwConfirm("");
      action();
    } catch (cause) {
      console.error("[Kindy] 비밀번호 확인 실패", cause);
      setPwError("확인 중 문제가 생겼어요. 잠시 후 다시 시도해주세요");
    } finally {
      setIsVerifying(false);
    }
  }

  /**
   * 비밀번호 변경입니다. 새 비밀번호에도 가입 때와 같은 규칙을 적용해야
   * 변경 경로로 약한 비밀번호가 들어오는 걸 막을 수 있습니다.
   */
  async function handleChangePassword() {
    if (isVerifying) return;

    if (!isPasswordValid(newPw)) {
      setPwError("새 비밀번호는 8자 이상, 영문/숫자/특수문자 중 2가지 이상 조합해주세요");
      return;
    }
    if (newPw === currentPw) {
      setPwError("현재 비밀번호와 다른 비밀번호를 입력해주세요");
      return;
    }

    setIsVerifying(true);
    try {
      const result = await changePassword({
        loginId: user!.loginId ?? user!.id,
        name: user!.name,
        email: user!.email,
        currentPassword: currentPw,
        newPassword: newPw,
      });
      if (result !== "ok") {
        setPwError(
          result === "wrong-password"
            ? "현재 비밀번호가 올바르지 않아요"
            : "비밀번호를 바꾸지 못했어요. 잠시 후 다시 시도해주세요",
        );
        return;
      }
      setPwError(null);
      setCurrentPw("");
      setNewPw("");
      onDone("비밀번호가 변경되었어요");
    } catch (cause) {
      console.error("[Kindy] 비밀번호 변경 실패", cause);
      setPwError("변경 중 문제가 생겼어요. 잠시 후 다시 시도해주세요");
    } finally {
      setIsVerifying(false);
    }
  }

  async function handleAddressSearch() {
    try {
      const result = await openAddressSearch();
      setZonecode(result.zonecode);
      setAddress(result.roadAddress);
    } catch {
      onDone("우편번호 서비스를 불러오지 못했어요");
    }
  }

  switch (panel) {
    case "nickname":
      return (
        <div className="space-y-4">
          <FieldLabel>별칭</FieldLabel>
          <TextField value={nickname} onChange={setNickname} placeholder="별칭을 입력하세요" />
          <PasswordConfirmField show={user.provider === "email"} value={pwConfirm} onChange={(v) => { setPwConfirm(v); setPwError(null); }} error={pwError} />
          <SaveButton disabled={isVerifying} onClick={() => void requirePassword(() => { updateProfile({ nickname }); onDone("별칭이 변경되었어요"); })} />
        </div>
      );

    case "password":
      if (user.provider !== "email") {
        return <p className="text-sm leading-relaxed" style={{ color: "#6B7280" }}>{PROVIDERS[user.provider].label} 계정으로 로그인 중이라 비밀번호가 없어요. 해당 서비스에서 비밀번호를 관리해주세요.</p>;
      }
      return (
        <div className="space-y-4">
          <div>
            <FieldLabel>현재 비밀번호</FieldLabel>
            <input type="password" value={currentPw} onChange={(e) => { setCurrentPw(e.target.value); setPwError(null); }}
              className="w-full rounded-2xl px-4 py-3 text-sm outline-none" style={{ background: "var(--input-background)", border: "1.5px solid #F3F4F6" }} />
            {pwError && <p className="text-xs mt-1.5 font-bold" style={{ color: "#EF4444" }}>{pwError}</p>}
          </div>
          <div>
            <FieldLabel>새 비밀번호</FieldLabel>
            <input type="password" value={newPw} onChange={(e) => setNewPw(e.target.value)}
              className="w-full rounded-2xl px-4 py-3 text-sm outline-none" style={{ background: "var(--input-background)", border: "1.5px solid #F3F4F6" }} />
          </div>
          <SaveButton
            disabled={isVerifying}
            onClick={() => void handleChangePassword()}
            label="비밀번호 변경"
          />
        </div>
      );

    case "address":
      return (
        <div className="space-y-4">
          <FieldLabel>우편번호</FieldLabel>
          <div className="flex gap-2">
            <TextField value={zonecode} readOnly placeholder="우편번호" />
            <button onClick={handleAddressSearch} className="shrink-0 px-4 rounded-2xl text-xs font-bold" style={{ background: "rgba(232,121,160,0.1)", color: "#E879A0", border: "1.5px solid #FBCFE8" }}>
              검색
            </button>
          </div>
          <FieldLabel>주소</FieldLabel>
          <TextField value={address} readOnly />
          <FieldLabel>상세주소</FieldLabel>
          <TextField value={addressDetail} onChange={setAddressDetail} placeholder="동/호수 등" />
          <PasswordConfirmField show={user.provider === "email"} value={pwConfirm} onChange={(v) => { setPwConfirm(v); setPwError(null); }} error={pwError} />
          <SaveButton disabled={isVerifying} onClick={() => void requirePassword(() => { updateProfile({ zonecode, address, addressDetail }); onDone("주소가 변경되었어요"); })} />
        </div>
      );

    case "kindergartenClass": {
      const inviteRole: InviteTargetRole = user.accountType === "child" ? "child" : user.role === "teacher" ? "teacher" : "parent";
      return (
        <div className="space-y-4">
          <ReceivedInvites role={inviteRole} onAccepted={() => onDone("유치원 초대를 수락했어요")} />

          {user.kindergarten ? (
            <>
              <FieldLabel>소속 유치원</FieldLabel>
              <TextField value={user.kindergarten.name} readOnly />
              {store && user.role === "teacher" && (
                <>
                  <FieldLabel>소속 반</FieldLabel>
                  <TextField value={store.data.teacher.className} readOnly />
                </>
              )}
            </>
          ) : (
            <p className="text-sm" style={{ color: "#6B7280" }}>아직 가입한 유치원이 없어요. 아래에서 검색해서 가입하거나, 원장님의 초대를 기다려주세요.</p>
          )}

          <div className="pt-2" style={{ borderTop: "1px solid #F3F4F6" }}>
            <FieldLabel>유치원 검색해서 가입하기</FieldLabel>
            <div className="flex gap-2 mb-3">
              <TextField value={kinderQuery} onChange={setKinderQuery} placeholder="유치원 이름" />
              <button
                onClick={() => searchKindergartens(kinderQuery).then(setKinderResults)}
                className="shrink-0 px-4 rounded-2xl text-xs font-bold"
                style={{ background: "rgba(232,121,160,0.1)", color: "#E879A0", border: "1.5px solid #FBCFE8" }}
              >
                검색
              </button>
            </div>
            <div className="space-y-2">
              {kinderResults.map((kg) => (
                <button
                  key={kg.id}
                  // 가입은 곧바로 확정되지 않고 원장의 수락을 기다리는 요청으로 남습니다.
                  onClick={() =>
                    void requestJoinKindergarten(kg.id, user.accountType === "child" ? "CHILD" : "TEACHER")
                      .then(() => onDone(`${kg.name}에 가입을 신청했어요. 원장님이 수락하면 소속돼요.`))
                      .catch(() => onDone("가입 신청에 실패했어요. 잠시 후 다시 시도해주세요."))
                  }
                  className="w-full text-left rounded-2xl px-4 py-3 transition-all hover:scale-[1.01] active:scale-95"
                  style={{ background: "#FAFAFA", border: "1.5px solid #E5E7EB" }}
                >
                  <p className="text-sm font-bold" style={{ color: "#1F0A3C" }}>{kg.name}</p>
                  <p className="text-xs" style={{ color: "#9CA3AF" }}>{kg.address}</p>
                </button>
              ))}
            </div>
          </div>
        </div>
      );
    }

    case "notifications":
      return (
        <div className="space-y-5">
          {[
            { label: "공지사항 알림", value: notifyNotices, set: setNotifyNotices },
            { label: "일정 알림", value: notifySchedule, set: setNotifySchedule },
            { label: "채팅 알림", value: notifyChat, set: setNotifyChat },
          ].map((row) => (
            <label key={row.label} className="flex items-center justify-between">
              <span className="text-sm font-bold" style={{ color: "#1F0A3C" }}>{row.label}</span>
              <input type="checkbox" checked={row.value} onChange={(e) => row.set(e.target.checked)} className="w-5 h-5" />
            </label>
          ))}

          {user.accountType === "child" && (
            <div className="pt-4 border-t" style={{ borderColor: "#F3F4F6" }}>
              <label className="flex items-center justify-between mb-3">
                <span className="text-sm font-bold" style={{ color: "#1F0A3C" }}>캐릭터 음성 알림</span>
                <input type="checkbox" checked={voice.settings.enabled} onChange={(e) => voice.update({ enabled: e.target.checked })} className="w-5 h-5" />
              </label>
              <FieldLabel>음성 볼륨</FieldLabel>
              <input type="range" min={0} max={1} step={0.05} value={voice.settings.volume}
                onChange={(e) => voice.update({ volume: Number(e.target.value) })} className="w-full" disabled={!voice.settings.enabled} />
            </div>
          )}
          <SaveButton onClick={() => onDone("알림 설정이 저장되었어요")} />
        </div>
      );

    case "childInfo":
      if (!store?.data.myChild) {
        return <p className="text-sm" style={{ color: "#6B7280" }}>등록된 자녀 정보가 없어요.</p>;
      }
      return (
        <div className="space-y-4">
          <FieldLabel>아이 별칭</FieldLabel>
          <TextField value={childNickname} onChange={setChildNickname} />
          <FieldLabel>나이</FieldLabel>
          <TextField value={`${store.data.myChild.age}세`} readOnly />
          <FieldLabel>소속 반</FieldLabel>
          <TextField value={store.data.myChild.className} readOnly />
          <PasswordConfirmField show={user.provider === "email"} value={pwConfirm} onChange={(v) => { setPwConfirm(v); setPwError(null); }} error={pwError} />
          <SaveButton disabled={isVerifying} onClick={() => void requirePassword(() => { store.updateChildNickname(store.data.myChild!.id, childNickname); onDone("아이 정보가 변경되었어요"); })} />
        </div>
      );

    case "linkedAccounts":
      return (
        <div className="flex gap-2.5 flex-wrap">
          {PROVIDER_ORDER.map((id) => {
            const isLinked = id === user.provider;
            return (
              <div key={id} title={isLinked ? `${PROVIDERS[id].label} 연동됨` : `${PROVIDERS[id].label} 미연동`}
                className="relative w-14 h-14 rounded-2xl flex items-center justify-center"
                style={{ background: PROVIDERS[id].brand.background, border: PROVIDERS[id].brand.border ?? "none", opacity: isLinked ? 1 : 0.28, filter: isLinked ? "none" : "grayscale(1)" }}>
                <ProviderIcon provider={id} size={22} />
                {isLinked && (
                  <span className="absolute -top-1 -right-1 rounded-full flex items-center justify-center" style={{ width: 20, height: 20, background: "#22C55E", border: "1.5px solid white" }}>
                    <Check className="w-3 h-3" style={{ color: "white" }} strokeWidth={3.5} />
                  </span>
                )}
              </div>
            );
          })}
        </div>
      );

    case "phone":
      return (
        <div className="space-y-4">
          <FieldLabel>전화번호</FieldLabel>
          <TextField value={phone} onChange={setPhone} placeholder="010-0000-0000" />
          <PasswordConfirmField show={user.provider === "email"} value={pwConfirm} onChange={(v) => { setPwConfirm(v); setPwError(null); }} error={pwError} />
          <SaveButton disabled={isVerifying} onClick={() => void requirePassword(() => { updateProfile({ phone }); onDone("전화번호가 변경되었어요"); })} />
        </div>
      );

    case "personalInfo":
      return (
        <div className="space-y-4">
          <FieldLabel>이름</FieldLabel>
          <TextField value={name} onChange={setName} />
          <FieldLabel>이메일</FieldLabel>
          <TextField value={user.email} readOnly />
          <PasswordConfirmField show={user.provider === "email"} value={pwConfirm} onChange={(v) => { setPwConfirm(v); setPwError(null); }} error={pwError} />
          <SaveButton disabled={isVerifying} onClick={() => void requirePassword(() => { updateProfile({ name }); onDone("개인정보가 변경되었어요"); })} />
        </div>
      );

    case "withdraw":
      return (
        <div className="space-y-4">
          <p className="text-sm leading-relaxed" style={{ color: "#6B7280" }}>
            회원 탈퇴 시 모든 계정 정보와 기록이 삭제되며 복구할 수 없어요.
          </p>
          <label className="flex items-center gap-2 text-xs font-bold" style={{ color: "#EF4444" }}>
            <input type="checkbox" checked={confirmWithdraw} onChange={(e) => setConfirmWithdraw(e.target.checked)} />
            내용을 확인했으며 탈퇴에 동의합니다
          </label>
          <button
            disabled={!confirmWithdraw}
            onClick={() => logout()}
            className="w-full rounded-2xl font-bold text-sm transition-all active:scale-[0.98] disabled:opacity-40"
            style={{ height: 48, color: "white", background: "#EF4444" }}
          >
            회원 탈퇴하기
          </button>
        </div>
      );
  }
}

/**
 * 로그인한 사용자의 마이페이지 모달입니다.
 * 목록 화면에서 항목을 고르면 실제 서비스처럼 세부 설정 화면으로 전환됩니다.
 */
export function MyPage({ onClose }: { onClose: () => void }) {
  const { user, logout } = useAuth();
  const [activePanel, setActivePanel] = useState<MenuKey | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  if (!user) return null;

  const provider = user.provider === "email" ? null : PROVIDERS[user.provider];

  function showToast(message?: string) {
    setActivePanel(null);
    if (!message) return;
    setToast(message);
    window.setTimeout(() => setToast(null), 2200);
  }

  const handleLogout = () => {
    logout();
    onClose();
  };

  const activeMeta = MENU_ITEMS.find((m) => m.key === activePanel);

  return (
    <div className="fixed inset-0 z-[9000] flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-label="마이페이지">
      <div className="absolute inset-0" style={{ background: "rgba(31,10,60,0.45)", backdropFilter: "blur(4px)" }} onClick={onClose} />

      <div className="relative w-full max-w-md rounded-3xl bg-white overflow-hidden shadow-2xl max-h-[90vh] overflow-y-auto" style={{ boxShadow: "0 24px 64px rgba(31,10,60,0.28)" }}>
        {activePanel ? (
          <>
            <div className="flex items-center gap-3 px-6 pt-6 pb-4" style={{ borderBottom: "1px solid #F3F4F6" }}>
              <button onClick={() => setActivePanel(null)} aria-label="뒤로가기" className="w-9 h-9 rounded-full flex items-center justify-center transition-colors hover:bg-gray-50">
                <ArrowLeft className="w-4.5 h-4.5" style={{ color: "#1F0A3C" }} />
              </button>
              <p className="font-bold text-base" style={{ color: "#1F0A3C" }}>{activeMeta?.label}</p>
            </div>
            <div className="px-6 py-6">
              <MyPagePanel panel={activePanel} onDone={showToast} />
            </div>
          </>
        ) : (
          <>
            <div className="relative px-7 pt-7 pb-8" style={{ background: "linear-gradient(135deg, #E879A0 0%, #F472B6 50%, #C084FC 100%)" }}>
              <button onClick={onClose} aria-label="마이페이지 닫기" className="absolute top-5 right-5 w-9 h-9 rounded-full flex items-center justify-center transition-all hover:bg-white/20 active:scale-95" style={{ color: "white" }}>
                <X className="w-5 h-5" />
              </button>
              <div className="flex items-center gap-4">
                <UserAvatar user={user} size={64} />
                <div className="min-w-0">
                  <p className="text-xl font-bold text-white truncate" style={{ fontFamily: "'Fredoka',sans-serif" }}>{getDisplayName(user)}</p>
                  <p className="text-sm truncate" style={{ color: "rgba(255,255,255,0.8)" }}>{user.email}</p>
                  <p className="text-xs mt-1" style={{ color: "rgba(255,255,255,0.65)" }}>{formatJoinedAt(user.joinedAt)}부터 함께하는 중</p>
                </div>
              </div>
            </div>

            <div className="px-7 pt-6">
              <p className="text-xs font-bold mb-2" style={{ color: "#6B7280" }}>설정</p>
              <div className="rounded-2xl overflow-hidden" style={{ border: "1.5px solid #F3F4F6" }}>
                {MENU_ITEMS.map((item, index) => (
                  <button
                    key={item.key}
                    onClick={() => setActivePanel(item.key)}
                    className="w-full flex items-center gap-3 px-4 py-3.5 transition-colors hover:bg-gray-50 text-left"
                    style={{ borderTop: index === 0 ? "none" : "1px solid #F3F4F6" }}
                  >
                    <span className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: "rgba(232,121,160,0.1)" }}>
                      <item.icon className="w-4 h-4" style={{ color: "#E879A0" }} />
                    </span>
                    <span className="flex-1 min-w-0">
                      <span className="block text-sm font-bold" style={{ color: "#1F0A3C" }}>{item.label}</span>
                      <span className="block text-xs truncate" style={{ color: "#9CA3AF" }}>{item.hint}</span>
                    </span>
                    <ChevronRight className="w-4 h-4 shrink-0" style={{ color: "#D1D5DB" }} />
                  </button>
                ))}
              </div>
            </div>

            <div className="px-7 pt-6">
              <p className="text-xs font-bold mb-3" style={{ color: "#6B7280" }}>연동된 계정</p>
              <div className="flex gap-2.5">
                {PROVIDER_ORDER.map((id) => {
                  const isLinked = id === user.provider;
                  return (
                    <div key={id} title={isLinked ? `${PROVIDERS[id].label} 연동됨` : `${PROVIDERS[id].label} 미연동`}
                      className="relative w-11 h-11 rounded-2xl flex items-center justify-center"
                      style={{ background: PROVIDERS[id].brand.background, border: PROVIDERS[id].brand.border ?? "none", opacity: isLinked ? 1 : 0.28, filter: isLinked ? "none" : "grayscale(1)" }}>
                      <ProviderIcon provider={id} size={18} />
                      {isLinked && (
                        <span className="absolute -top-1 -right-1 rounded-full flex items-center justify-center" style={{ width: 18, height: 18, background: "#22C55E", border: "1.5px solid white" }}>
                          <Check className="w-2.5 h-2.5" style={{ color: "white" }} strokeWidth={3.5} />
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
              <p className="text-xs mt-2.5" style={{ color: "#9CA3AF" }}>
                {provider ? `현재 ${provider.label} 계정으로 로그인되어 있어요` : "이메일 계정으로 로그인되어 있어요"}
              </p>
            </div>

            <div className="px-7 py-6">
              <button
                onClick={handleLogout}
                className="w-full flex items-center justify-center gap-2 rounded-2xl font-bold text-sm transition-all hover:bg-red-50 active:scale-[0.98]"
                style={{ height: 50, color: "#EF4444", border: "1.5px solid #FECACA" }}
              >
                <LogOut className="w-4 h-4" />
                로그아웃
              </button>
            </div>
          </>
        )}
      </div>
      <Toast message={toast} />
    </div>
  );
}
