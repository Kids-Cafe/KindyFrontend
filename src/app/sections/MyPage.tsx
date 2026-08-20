import { useMemo, useState } from "react";
import { X, LogOut, ChevronRight, Check, ArrowLeft } from "lucide-react";
import { useAuth } from "@/app/auth/AuthContext";
import { isChildAccount } from "@/app/auth/accountType";
import { changePassword, verifyCurrentPassword } from "@/app/auth/password";
import { requestJoinKindergarten, searchKindergartens } from "@/app/auth/kindergartenSearch";
import { registerKindergarten } from "@/app/auth/signup";
import { KindergartenRegisterForm } from "@/app/auth/KindergartenRegisterForm";
import { isPasswordValid } from "@/app/auth/validation";
import { ReceivedInvites } from "@/app/auth/ReceivedInvites";
import type { KindergartenInfo } from "@/app/auth/types";
import { PROVIDERS, PROVIDER_ORDER } from "@/app/auth/providers";
import { ProviderIcon } from "@/app/auth/ProviderIcon";
import { UserAvatar } from "@/app/auth/UserAvatar";
import { useDisplayName } from "@/app/auth/useDisplayName";
import { openAddressSearch } from "@/app/auth/addressSearch";
import { withJosa } from "@/app/lib/korean";
import { useDashboardStoreOptional } from "@/app/dashboard/DashboardStoreContext";
import { useChildVoiceSettings } from "@/app/dashboard/childVoiceSettings";
import { useMyFamily, type MyFamily } from "@/app/dashboard/useMyFamily";
import { useMyKindergartens } from "@/app/dashboard/useMyKindergartens";
import { ChildAccountsPanel } from "@/app/sections/ChildAccountsPanel";
import { visibleMenuItems, type MenuKey } from "@/app/sections/mypageMenu";
import {
  FieldLabel,
  PasswordConfirmField,
  SaveButton,
  TextField,
  Toast,
} from "@/app/sections/mypageFields";

function formatJoinedAt(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "-";
  return `${date.getFullYear()}년 ${date.getMonth() + 1}월 ${date.getDate()}일`;
}

/** 마이페이지 서브패널 콘텐츠입니다. 실제 계정 설정 화면처럼 각 항목을 별도 화면으로 분리했습니다. */
function MyPagePanel({
  panel,
  onDone,
  onMembershipsChanged,
  family,
  visible,
}: {
  panel: MenuKey;
  onDone: (message?: string) => void;
  /** 소속 유치원 목록이 달라졌을 때(직접 등록 등) 대시보드가 다시 받아오도록 알립니다. */
  onMembershipsChanged?: () => void;
  family: MyFamily;
  /** 이 계정에서 이 패널이 열려도 되는지. 목록 필터와 같은 술어입니다. */
  visible: boolean;
}) {
  const { user, updateProfile, logout } = useAuth();
  const store = useDashboardStoreOptional();
  const voice = useChildVoiceSettings(user?.id ?? "unknown");
  const kindergartens = useMyKindergartens();
  const isChild = isChildAccount(user);
  const childNameById = useMemo(
    () => new Map(family.children.map((c) => [c.id, c.name])),
    [family.children],
  );

  // 별칭은 계정이 아니라 유치원마다 붙습니다. 지금 보고 있는 유치원의 값을 고칩니다.
  const [nickname, setNickname] = useState(store?.data.myNickname ?? "");
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
  const [kinderQuery, setKinderQuery] = useState("");
  const [kinderResults, setKinderResults] = useState<KindergartenInfo[]>([]);
  /** 보호자가 가입을 신청해 줄 아이입니다. 아이가 하나뿐이면 아래에서 자동으로 잡힙니다. */
  const [joinChildId, setJoinChildId] = useState<string | undefined>(undefined);
  /** 유치원 검색 아래의 "직접 등록" 폼을 펼쳤는지. 기본은 접어 두고 검색을 먼저 권합니다. */
  const [showRegister, setShowRegister] = useState(false);
  const [confirmWithdraw, setConfirmWithdraw] = useState(false);
  const [notifyNotices, setNotifyNotices] = useState(true);
  const [notifySchedule, setNotifySchedule] = useState(true);
  const [notifyChat, setNotifyChat] = useState(true);

  if (!user) return null;

  // 목록에서 이미 걸렀지만, 열려 있던 패널이 남아 있거나 나중에 딥링크가 생겨도 새지 않도록
  // 한 번 더 봅니다. 어차피 서버가 거절할 요청이라 보안 경계는 아니고, 아무것도 못 하는
  // 화면을 보여 주지 않기 위한 것입니다.
  if (!visible) {
    return <p className="text-sm" style={{ color: "#6B7280" }}>이 계정에서는 쓸 수 없는 설정이에요.</p>;
  }

  /**
   * 이메일 계정은 저장 전에 현재 비밀번호를 확인합니다. 소셜 계정은 비밀번호가 없어 바로 저장합니다.
   * 저장 자체가 서버 요청이므로 실패하면 안내만 남기고 화면은 바꾸지 않습니다.
   */
  async function requirePassword(action: () => Promise<void> | void) {
    if (isVerifying) return;

    setIsVerifying(true);
    try {
      if (user!.provider === "email") {
        if (!(await verifyCurrentPassword(user!.loginId ?? user!.id, pwConfirm))) {
          setPwError("비밀번호가 올바르지 않아요");
          return;
        }
        setPwError(null);
        setPwConfirm("");
      }
      await action();
    } catch (cause) {
      console.error("[Kindy] 저장 실패", cause);
      setPwError("저장하지 못했어요. 잠시 후 다시 시도해주세요");
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
      // 별칭은 유치원마다 따로 저장됩니다(T_RELATIONSHIP.NICKNAME). 소속이 없으면 저장할 곳도 없습니다.
      if (!store) {
        return (
          <p className="text-sm leading-relaxed" style={{ color: "#6B7280" }}>
            별칭은 유치원마다 따로 정해요. 유치원에 소속된 뒤에 정할 수 있어요.
          </p>
        );
      }
      // 학부모는 유치원의 멤버가 아니라 아이를 통해 닿는 사람이라 별칭을 걸어 둘 관계 행이
      // 없습니다. 저장을 시도하면 서버가 거절하므로 화면에서 먼저 이유를 말합니다.
      if (store.data.role === "parent") {
        return (
          <p className="text-sm leading-relaxed" style={{ color: "#6B7280" }}>
            별칭은 유치원에 다니는 사람이 그 안에서 불리는 이름이에요. 보호자 계정에는 따로
            정하지 않고, 아이의 별칭은 아이 계정에서 정할 수 있어요.
          </p>
        );
      }
      return (
        <div className="space-y-4">
          <FieldLabel>{store.data.kindergarten.name}에서 쓸 별칭</FieldLabel>
          <TextField value={nickname} onChange={setNickname} placeholder={user.name} />
          <p className="text-xs" style={{ color: "#9CA3AF" }}>
            이 유치원에서만 쓰는 이름이에요. 비워 두면 실명({user.name})으로 보여요.
          </p>
          <PasswordConfirmField show={user.provider === "email"} value={pwConfirm} onChange={(v) => { setPwConfirm(v); setPwError(null); }} error={pwError} />
          <SaveButton
            disabled={isVerifying}
            onClick={() => void requirePassword(async () => {
              await store.setMyNickname(nickname);
              onDone("별칭이 변경되었어요");
            })}
          />
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
          <SaveButton
            disabled={isVerifying}
            onClick={() => void requirePassword(async () => {
              await updateProfile({ zonecode, address, addressDetail });
              onDone("주소가 변경되었어요");
            })}
          />
        </div>
      );

    case "kindergartenClass": {
      // 유치원 등록은 사업자등록번호가 필요한 원장의 일이라 성인 계정에서만 열어 둡니다.
      const canRegisterKindergarten = user.accountType !== "child";
      // 유치원에 다니는 건 아이지 보호자가 아닙니다. 그래서 어른 계정이 "선생님이 아닌"
      // 경우 신청은 반드시 아이 이름으로 나갑니다 — 아이를 고르지 않으면 보낼 수 없습니다.
      const joinsForChild = !isChild && user.role !== "teacher";
      // 아이가 한 명뿐이면 고를 것이 없습니다. 굳이 한 번 더 누르게 하지 않고 그 아이를 봅니다.
      const defaultChildId = family.children.length === 1 ? family.children[0].id : undefined;
      const selectedChildId = joinChildId ?? defaultChildId;
      const joinTarget = joinsForChild ? selectedChildId : undefined;
      const canJoin = !joinsForChild || Boolean(joinTarget);

      return (
        <div className="space-y-4">
          <ReceivedInvites onAccepted={() => onDone("유치원 초대를 수락했어요")} />

          <FieldLabel>소속 유치원</FieldLabel>
          {kindergartens.isLoading ? (
            <p className="text-sm" style={{ color: "#9CA3AF" }}>불러오는 중이에요…</p>
          ) : kindergartens.list.length > 0 ? (
            <div className="space-y-2">
              {kindergartens.list.map((kg) => (
                <div key={kg.id} className="rounded-2xl px-4 py-3" style={{ background: "#FAFAFA", border: "1.5px solid #E5E7EB" }}>
                  <p className="text-sm font-bold" style={{ color: "#1F0A3C" }}>{kg.name}</p>
                  <p className="text-xs" style={{ color: "#9CA3AF" }}>
                    {/* 학부모에게 내려오는 건 아이의 소속입니다. 그걸 "내 소속"으로 적으면
                        학부모가 유치원의 멤버인 것처럼 읽힙니다. */}
                    {kg.viaChild
                      ? `${withJosa(childNameById.get(kg.memberId) ?? kg.memberId, "이/가")} 다니고 있어요`
                      : kg.nickname
                        ? `별칭 ${kg.nickname}`
                        : "내 소속"}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm" style={{ color: "#6B7280" }}>아직 가입한 유치원이 없어요. 아래에서 검색해서 가입하거나, 원장님의 초대를 기다려주세요.</p>
          )}

          <div className="pt-2" style={{ borderTop: "1px solid #F3F4F6" }}>
            <FieldLabel>유치원 검색해서 가입하기</FieldLabel>

            {joinsForChild && (
              <div className="mb-3">
                {family.children.length === 0 ? (
                  <p className="text-xs" style={{ color: "#9CA3AF" }}>
                    유치원에 다니는 건 아이라서, 먼저 &ldquo;우리 아이&rdquo;에서 아이 계정을 만들거나 연결해주세요.
                  </p>
                ) : (
                  <>
                    <p className="text-xs mb-2" style={{ color: "#9CA3AF" }}>어느 아이의 가입을 신청할까요?</p>
                    <div className="flex flex-wrap gap-1.5">
                      {family.children.map((child) => {
                        const selected = child.id === selectedChildId;
                        return (
                          <button
                            key={child.id}
                            onClick={() => setJoinChildId(child.id)}
                            aria-pressed={selected}
                            className="px-3 py-1.5 rounded-full text-xs font-bold transition-colors"
                            style={{
                              background: selected ? "rgba(232,121,160,0.14)" : "#F3F4F6",
                              color: selected ? "#C0568A" : "#6B7280",
                            }}
                          >
                            {child.name}
                          </button>
                        );
                      })}
                    </div>
                  </>
                )}
              </div>
            )}

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
                  disabled={!canJoin}
                  // 가입은 곧바로 확정되지 않고 원장의 수락을 기다리는 요청으로 남습니다.
                  // 선생님만 자기 이름으로 TEACHER 신청을 냅니다. 학부모는 아이를 지목한
                  // CHILD 신청을 내고(서버가 T_FAMILY로 보호자인지 확인합니다), 아이 계정은
                  // 자기 이름으로 CHILD 신청을 냅니다.
                  onClick={() =>
                    void requestJoinKindergarten(kg.id, user.role === "teacher" ? "TEACHER" : "CHILD", joinTarget)
                      .then(() =>
                        onDone(
                          joinTarget
                            ? `${kg.name}에 ${childNameById.get(joinTarget) ?? joinTarget}의 가입을 신청했어요. 원장님이 수락하면 소속돼요.`
                            : `${kg.name}에 가입을 신청했어요. 원장님이 수락하면 소속돼요.`,
                        ),
                      )
                      .catch(() => onDone("가입 신청에 실패했어요. 잠시 후 다시 시도해주세요."))
                  }
                  className="w-full text-left rounded-2xl px-4 py-3 transition-all hover:scale-[1.01] active:scale-95 disabled:opacity-50 disabled:hover:scale-100"
                  style={{ background: "#FAFAFA", border: "1.5px solid #E5E7EB" }}
                >
                  <p className="text-sm font-bold" style={{ color: "#1F0A3C" }}>{kg.name}</p>
                  <p className="text-xs" style={{ color: "#9CA3AF" }}>{kg.address}</p>
                </button>
              ))}
            </div>
          </div>

          {canRegisterKindergarten && (
            <div className="pt-4" style={{ borderTop: "1px solid #F3F4F6" }}>
              {showRegister ? (
                <>
                  <FieldLabel>새 유치원 등록</FieldLabel>
                  <p className="text-xs mb-3" style={{ color: "#9CA3AF" }}>
                    등록한 계정이 곧 원장이 돼요. 사업자등록번호가 필요해요.
                  </p>
                  <KindergartenRegisterForm
                    dense
                    submitLabel="유치원 등록하기"
                    onSubmit={async (payload) => {
                      const kindergarten = await registerKindergarten(payload);
                      // 만든 사람이 곧 소유자라 가입 요청 없이 바로 원장이 됩니다.
                      await updateProfile({ role: "teacher", teacherRole: "director", kindergarten });
                      onMembershipsChanged?.();
                      onDone(`${withJosa(kindergarten.name, "을/를")} 등록했어요. 이제 원장으로 관리할 수 있어요.`);
                    }}
                  />
                  <button
                    onClick={() => setShowRegister(false)}
                    className="w-full mt-2 text-xs font-bold py-2"
                    style={{ color: "#9CA3AF" }}
                  >
                    취소
                  </button>
                </>
              ) : (
                <button
                  onClick={() => setShowRegister(true)}
                  className="w-full rounded-2xl text-xs font-bold py-3 transition-transform active:scale-[0.98]"
                  style={{ background: "rgba(232,121,160,0.1)", color: "#E879A0", border: "1.5px solid #FBCFE8" }}
                >
                  찾는 유치원이 없나요? 유치원 직접 등록하기
                </button>
              )}
            </div>
          )}
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
      // 별칭 편집은 여기 있지 않습니다 — 별칭은 가족이 아니라 유치원 관계에 붙는 값이라
      // 원장·교사 화면(DirectorStudentPanel, MemberProfilePanel)의 몫입니다.
      return <ChildAccountsPanel family={family} onDone={onDone} />;

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
          <SaveButton
            disabled={isVerifying}
            onClick={() => void requirePassword(async () => {
              await updateProfile({ phone });
              onDone("전화번호가 변경되었어요");
            })}
          />
        </div>
      );

    case "personalInfo": {
      // 실명과 이메일은 가입할 때 확정됩니다. 유치원에서 불리는 이름을 바꾸려면 "별칭 변경"으로 갑니다.
      // 아이 계정은 이메일이 없어(서버 CHECK 제약) 빈 칸이 나오므로, 대신 아이 계정에만 있는
      // 값들을 보여줍니다. 이 값들을 고치는 건 아이 자신이 아니라 보호자의 "우리 아이 정보"입니다.
      return (
        <div className="space-y-4">
          <FieldLabel>이름</FieldLabel>
          <TextField value={user.name} readOnly />
          {isChild ? (
            <>
              <FieldLabel>아이디</FieldLabel>
              <TextField value={user.loginId ?? user.id} readOnly />
              <FieldLabel>생년월일</FieldLabel>
              <TextField value={user.birthDate ?? "-"} readOnly />
              <FieldLabel>보호자</FieldLabel>
              <TextField value={user.guardianName ?? "-"} readOnly />
              <FieldLabel>보호자 연락처</FieldLabel>
              <TextField value={user.guardianPhone ?? "-"} readOnly />
              <p className="text-xs leading-relaxed" style={{ color: "#9CA3AF" }}>
                여기 있는 정보는 보호자가 고칠 수 있어요.
                다른 사람에게 보여질 이름은 "별칭 변경"에서 유치원마다 따로 정할 수 있어요.
              </p>
            </>
          ) : (
            <>
              <FieldLabel>이메일</FieldLabel>
              <TextField value={user.email} readOnly />
              <p className="text-xs leading-relaxed" style={{ color: "#9CA3AF" }}>
                이름과 이메일은 가입할 때 확인한 정보라 바꿀 수 없어요.
                다른 사람에게 보여질 이름은 "별칭 변경"에서 유치원마다 따로 정할 수 있어요.
              </p>
            </>
          )}
        </div>
      );
    }

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
export function MyPage({
  onClose,
  onMembershipsChanged,
}: {
  onClose: () => void;
  /** 마이페이지에서 유치원을 새로 등록/가입해 소속이 달라졌을 때 호출됩니다. */
  onMembershipsChanged?: () => void;
}) {
  const { user, logout } = useAuth();
  const displayName = useDisplayName();
  const family = useMyFamily();
  const [activePanel, setActivePanel] = useState<MenuKey | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const isChild = isChildAccount(user);
  const hasGuardian = family.guardianIds.length > 0;

  /**
   * 아직 불러오는 중이면 보호자가 있다고 봅니다. 탈퇴 항목이 보였다가 사라지는 것보다
   * 한 박자 늦게 나타나는 편이 낫습니다 — 사라지는 쪽은 눌러도 되는 걸 눌렀다가 빼앗긴
   * 것처럼 보입니다.
   */
  const menuItems = useMemo(
    () => visibleMenuItems({ isChild, hasGuardian: family.isLoading || hasGuardian }),
    [isChild, hasGuardian, family.isLoading],
  );

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

  // 헤더 라벨은 렌더에 쓴 것과 같은 배열에서 찾아야 합니다. 원본 MENU_ITEMS에서 찾으면
  // 숨긴 패널이 열렸을 때 제목만 멀쩡해 보입니다.
  const activeMeta = menuItems.find((m) => m.key === activePanel);

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
              <MyPagePanel
                panel={activePanel}
                onDone={showToast}
                onMembershipsChanged={onMembershipsChanged}
                family={family}
                visible={activeMeta !== undefined}
              />
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
                  <p className="text-xl font-bold text-white truncate" style={{ fontFamily: "'Fredoka',sans-serif" }}>{displayName}</p>
                  {/* 아이 계정은 이메일이 없어 이 줄이 비어 버립니다. 그때는 아이디를 보여줍니다. */}
                  <p className="text-sm truncate" style={{ color: "rgba(255,255,255,0.8)" }}>{user.email || user.loginId || user.id}</p>
                  <p className="text-xs mt-1" style={{ color: "rgba(255,255,255,0.65)" }}>{formatJoinedAt(user.joinedAt)}부터 함께하는 중</p>
                </div>
              </div>
            </div>

            <div className="px-7 pt-6">
              <p className="text-xs font-bold mb-2" style={{ color: "#6B7280" }}>설정</p>
              <div className="rounded-2xl overflow-hidden" style={{ border: "1.5px solid #F3F4F6" }}>
                {menuItems.map((item, index) => (
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
