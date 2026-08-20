import { useState } from "react";
import { Baby, Plus, Link2, Trash2, Search } from "lucide-react";
import { useAuth } from "@/app/auth/AuthContext";
import { isPasswordValid, isValidBirthDate, isValidLoginId, isValidPhone } from "@/app/auth/validation";
import { apiGet, ApiError } from "@/app/lib/api";
import { avatarFor } from "@/app/dashboard/retrieveData";
import {
  createChildAccount,
  removeFamilyOnServer,
  searchUsers,
  sendFamilyInvite,
  updateChildProfileOnServer,
} from "@/app/dashboard/userSync";
import type { MyFamily } from "@/app/dashboard/useMyFamily";
import type { PlainUserDTO } from "@/app/lib/dto";
import { FieldLabel, SaveButton, TextField } from "@/app/sections/mypageFields";

/**
 * "우리 아이" 패널입니다. 연결된 아이를 보고 고치고, 새 아이 계정을 만들거나 이미 있는
 * 계정을 연결 요청합니다.
 *
 * 가족 목록은 대시보드 스토어가 아니라 `useMyFamily`에서 옵니다 — 이 화면은 소속 유치원이
 * 없을 때도 열리고, 연결은 유치원과 무관한 계정 단위 사실이기 때문입니다. 예전에는 스토어의
 * `myChild`만 봐서, 지금 보는 유치원에 아이가 멤버로 없으면 늘 "등록된 자녀 정보가 없어요"로
 * 끝났습니다.
 */
const GENDERS: { value: "MALE" | "FEMALE" | "UNSPECIFIED"; label: string }[] = [
  { value: "MALE", label: "남자" },
  { value: "FEMALE", label: "여자" },
  { value: "UNSPECIFIED", label: "선택 안 함" },
];

function ageFrom(birthDate?: string): number | undefined {
  if (!birthDate) return undefined;
  const born = new Date(birthDate);
  if (Number.isNaN(born.getTime())) return undefined;
  const now = new Date();
  let age = now.getFullYear() - born.getFullYear();
  const beforeBirthday =
    now.getMonth() < born.getMonth() ||
    (now.getMonth() === born.getMonth() && now.getDate() < born.getDate());
  if (beforeBirthday) age -= 1;
  return age >= 0 ? age : undefined;
}

function SectionButton({
  icon: Icon,
  label,
  onClick,
}: {
  icon: typeof Baby;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-2.5 rounded-2xl px-4 py-3 text-sm font-bold transition-colors hover:bg-gray-50"
      style={{ border: "1.5px dashed #E5E7EB", color: "#6B7280" }}
    >
      <Icon className="w-4 h-4" />
      {label}
    </button>
  );
}

function ChildRow({
  child,
  onEdit,
  onUnlink,
}: {
  child: PlainUserDTO;
  onEdit: () => void;
  onUnlink: () => void;
}) {
  const { avatarEmoji, avatarColor } = avatarFor(child.id);
  const age = ageFrom(child.birthDate);
  return (
    <div className="flex items-center gap-3 rounded-2xl px-3 py-3" style={{ border: "1.5px solid #F3F4F6" }}>
      <span
        className="w-10 h-10 rounded-full flex items-center justify-center text-lg shrink-0"
        style={{ background: avatarColor }}
      >
        {avatarEmoji}
      </span>
      <button onClick={onEdit} className="flex-1 min-w-0 text-left">
        <span className="block text-sm font-bold" style={{ color: "#1F0A3C" }}>{child.name}</span>
        <span className="block text-xs" style={{ color: "#9CA3AF" }}>
          {child.id}
          {age !== undefined ? ` · ${age}세` : ""}
        </span>
      </button>
      <button
        onClick={onUnlink}
        aria-label={`${child.name} 연결 해제`}
        title="연결 해제"
        className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition-transform active:scale-95"
        style={{ background: "#FEF2F2", color: "#EF4444" }}
      >
        <Trash2 className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}

export function ChildAccountsPanel({
  family,
  onDone,
}: {
  family: MyFamily;
  /** 저장이 끝나면 패널을 닫고 토스트를 띄웁니다. `MyPage`의 다른 패널과 같은 방식입니다. */
  onDone: (message?: string) => void;
}) {
  const { user } = useAuth();
  const { children, isLoading, refresh } = family;

  const [mode, setMode] = useState<"list" | "create" | "link" | "edit">("list");
  const [editing, setEditing] = useState<PlainUserDTO | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isBusy, setIsBusy] = useState(false);

  // 프로필 편집
  const [name, setName] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [gender, setGender] = useState<"MALE" | "FEMALE" | "UNSPECIFIED">("UNSPECIFIED");
  const [guardianName, setGuardianName] = useState("");
  const [guardianPhone, setGuardianPhone] = useState("");
  const [phone, setPhone] = useState("");

  // 아이 계정 만들기
  const [newId, setNewId] = useState("");
  const [newPassword, setNewPassword] = useState("");

  // 이미 있는 계정 연결
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<PlainUserDTO[]>([]);
  const [searched, setSearched] = useState(false);

  if (!user) return null;

  function openEdit(child: PlainUserDTO) {
    setEditing(child);
    setName(child.name);
    setBirthDate(child.birthDate ?? "");
    setGender(child.gender ?? "UNSPECIFIED");
    setGuardianName(child.guardianName ?? "");
    setGuardianPhone(child.guardianPhone ?? "");
    setPhone(child.phone ?? "");
    setError(null);
    setMode("edit");
  }

  function resetCreate() {
    setNewId("");
    setNewPassword("");
    setName("");
    setPhone("");
    setBirthDate("");
    setGender("UNSPECIFIED");
    setGuardianName(user!.name);
    setGuardianPhone(user!.phone ?? "");
    setError(null);
    setMode("create");
  }

  /** 서버 오류 코드를 사람 말로 옮깁니다. 모르는 코드는 일반 문구로 흘립니다. */
  function messageFor(cause: unknown): string {
    const code = cause instanceof ApiError ? cause.code : "";
    switch (code) {
      case "DUPLICATE_ID": return "이미 쓰이고 있는 아이디예요";
      case "ALREADY_LINKED": return "이미 연결된 아이예요";
      case "DUPLICATE_REQUEST": return "이미 보낸 요청이 처리를 기다리고 있어요";
      case "INVALID_ACCESS": return "권한이 없어요";
      case "INVALID_PARAMETER": return "입력한 내용을 다시 확인해주세요";
      default: return "처리하지 못했어요. 잠시 후 다시 시도해주세요";
    }
  }

  async function run(action: () => Promise<void>) {
    if (isBusy) return;
    setIsBusy(true);
    setError(null);
    try {
      await action();
    } catch (cause) {
      console.warn("[Kindy] 아이 정보 처리 실패", cause);
      setError(messageFor(cause));
    } finally {
      setIsBusy(false);
    }
  }

  async function handleSaveProfile() {
    if (!editing) return;
    if (!name.trim()) return setError("이름을 입력해주세요");
    if (birthDate && !isValidBirthDate(birthDate)) return setError("생년월일을 YYYY-MM-DD로 입력해주세요");
    if (phone && !isValidPhone(phone)) return setError("전화번호 형식을 확인해주세요");
    if (guardianPhone && !isValidPhone(guardianPhone)) return setError("보호자 연락처 형식을 확인해주세요");

    await run(async () => {
      await updateChildProfileOnServer(editing.id, {
        name: name.trim(),
        birthDate: birthDate || undefined,
        gender,
        guardianName: guardianName.trim() || undefined,
        guardianPhone: guardianPhone.trim() || undefined,
        phone: phone.trim() || undefined,
      });
      refresh();
      onDone("아이 정보가 저장되었어요");
    });
  }

  async function handleCreate() {
    if (!isValidLoginId(newId)) return setError("아이디는 영문/숫자 4~20자로 입력해주세요");
    if (!isPasswordValid(newPassword)) return setError("비밀번호는 8자 이상, 영문/숫자/특수문자 중 2가지 이상 조합해주세요");
    if (!name.trim()) return setError("이름을 입력해주세요");
    if (!isValidBirthDate(birthDate)) return setError("생년월일을 YYYY-MM-DD로 입력해주세요");
    if (!isValidPhone(phone)) return setError("전화번호 형식을 확인해주세요");

    await run(async () => {
      // 서버도 중복이면 DUPLICATE_ID로 막지만, 폼을 다 채우고 나서 알게 되는 것보다 먼저 봅니다.
      const taken = await apiGet<{ exists?: boolean }>("/api/user/getIdExists", { id: newId.trim() })
        .then((r) => r.exists === true)
        .catch(() => false);
      if (taken) {
        setError("이미 쓰이고 있는 아이디예요");
        return;
      }

      await createChildAccount({
        loginId: newId.trim(),
        password: newPassword,
        name: name.trim(),
        phone: phone.trim(),
        birthDate,
        gender: gender === "UNSPECIFIED" ? undefined : gender,
        guardianName: guardianName.trim() || undefined,
        guardianPhone: guardianPhone.trim() || undefined,
      });
      refresh();
      onDone("아이 계정을 만들었어요");
    });
  }

  async function handleSearch() {
    setSearched(false);
    await run(async () => {
      const found = await searchUsers(query);
      // 연결 대상은 아이 계정뿐이고, 이미 연결된 아이는 다시 보낼 이유가 없습니다.
      const linked = new Set(children.map((c) => c.id));
      setResults(found.filter((r) => r.accountType === "CHILD" && !linked.has(r.id)));
      setSearched(true);
    });
  }

  async function handleInvite(childId: string) {
    await run(async () => {
      await sendFamilyInvite(user!.id, childId);
      setResults((prev) => prev.filter((r) => r.id !== childId));
      onDone("요청을 보냈어요. 아이(또는 다른 보호자)가 수락하면 연결돼요");
    });
  }

  async function handleUnlink(child: PlainUserDTO) {
    const warning =
      `${child.name}와의 연결을 해제할까요?\n\n` +
      "해제하면 이 아이의 일기 · 알림장 · 성장 리포트를 더 이상 볼 수 없어요.";
    if (!window.confirm(warning)) return;

    await run(async () => {
      await removeFamilyOnServer(user!.id, child.id);
      refresh();
      onDone("연결을 해제했어요");
    });
  }

  const errorLine = error && (
    <p className="text-xs font-bold" style={{ color: "#EF4444" }}>{error}</p>
  );

  const genderPicker = (
    <div>
      <FieldLabel>성별</FieldLabel>
      <div className="flex gap-2">
        {GENDERS.map((g) => (
          <button
            key={g.value}
            onClick={() => setGender(g.value)}
            className="flex-1 rounded-2xl py-2.5 text-xs font-bold transition-colors"
            style={
              gender === g.value
                ? { background: "linear-gradient(135deg,#E879A0,#F472B6)", color: "white" }
                : { background: "#F9FAFB", color: "#6B7280", border: "1.5px solid #F3F4F6" }
            }
          >
            {g.label}
          </button>
        ))}
      </div>
    </div>
  );

  if (mode === "edit" && editing) {
    return (
      <div className="space-y-4">
        <button onClick={() => setMode("list")} className="text-xs font-bold" style={{ color: "#9CA3AF" }}>
          ← 목록으로
        </button>
        <div>
          <FieldLabel>이름</FieldLabel>
          <TextField value={name} onChange={setName} />
        </div>
        <div>
          <FieldLabel>생년월일</FieldLabel>
          <TextField value={birthDate} onChange={setBirthDate} placeholder="2020-03-14" />
        </div>
        {genderPicker}
        <div>
          <FieldLabel>아이 전화번호</FieldLabel>
          <TextField value={phone} onChange={setPhone} placeholder="010-0000-0000" />
        </div>
        <div>
          <FieldLabel>보호자 이름</FieldLabel>
          <TextField value={guardianName} onChange={setGuardianName} />
        </div>
        <div>
          <FieldLabel>보호자 연락처</FieldLabel>
          <TextField value={guardianPhone} onChange={setGuardianPhone} placeholder="010-0000-0000" />
        </div>
        <p className="text-xs leading-relaxed" style={{ color: "#9CA3AF" }}>
          아이 계정에는 주소와 이메일이 없어요. 유치원에서 불리는 이름은 유치원마다 따로 정하는
          별칭이라 여기서 바꾸지 않아요.
        </p>
        {errorLine}
        <SaveButton disabled={isBusy} onClick={() => void handleSaveProfile()} />
      </div>
    );
  }

  if (mode === "create") {
    return (
      <div className="space-y-4">
        <button onClick={() => setMode("list")} className="text-xs font-bold" style={{ color: "#9CA3AF" }}>
          ← 목록으로
        </button>
        <div>
          <FieldLabel>아이디</FieldLabel>
          <TextField value={newId} onChange={setNewId} placeholder="영문/숫자 4~20자" />
        </div>
        <div>
          <FieldLabel>비밀번호</FieldLabel>
          <TextField value={newPassword} onChange={setNewPassword} type="password" placeholder="8자 이상" />
        </div>
        <div>
          <FieldLabel>이름</FieldLabel>
          <TextField value={name} onChange={setName} />
        </div>
        <div>
          <FieldLabel>생년월일</FieldLabel>
          <TextField value={birthDate} onChange={setBirthDate} placeholder="2020-03-14" />
        </div>
        {genderPicker}
        <div>
          <FieldLabel>아이 전화번호</FieldLabel>
          <TextField value={phone} onChange={setPhone} placeholder="010-0000-0000" />
        </div>
        <div>
          <FieldLabel>보호자 이름</FieldLabel>
          <TextField value={guardianName} onChange={setGuardianName} />
        </div>
        <div>
          <FieldLabel>보호자 연락처</FieldLabel>
          <TextField value={guardianPhone} onChange={setGuardianPhone} placeholder="010-0000-0000" />
        </div>
        {errorLine}
        <SaveButton disabled={isBusy} label="아이 계정 만들기" onClick={() => void handleCreate()} />
      </div>
    );
  }

  if (mode === "link") {
    return (
      <div className="space-y-4">
        <button onClick={() => setMode("list")} className="text-xs font-bold" style={{ color: "#9CA3AF" }}>
          ← 목록으로
        </button>
        <p className="text-xs leading-relaxed" style={{ color: "#6B7280" }}>
          아이의 아이디로 찾아 연결을 요청해요. 요청은 아이 본인(보호자가 아직 없을 때) 또는
          이미 연결된 다른 보호자가 수락해야 연결됩니다.
        </p>
        <div className="flex gap-2">
          <div className="flex-1">
            <TextField value={query} onChange={setQuery} placeholder="아이디 2자 이상" />
          </div>
          <button
            onClick={() => void handleSearch()}
            disabled={isBusy}
            aria-label="검색"
            className="w-12 rounded-2xl flex items-center justify-center shrink-0 disabled:opacity-50"
            style={{ background: "#F3F4F6", color: "#6B7280" }}
          >
            <Search className="w-4 h-4" />
          </button>
        </div>
        {errorLine}
        {searched && results.length === 0 && (
          <p className="text-sm" style={{ color: "#9CA3AF" }}>찾는 아이 계정이 없어요.</p>
        )}
        <div className="space-y-2">
          {results.map((r) => (
            <div key={r.id} className="flex items-center gap-3 rounded-2xl px-3 py-3" style={{ border: "1.5px solid #F3F4F6" }}>
              <span className="flex-1 min-w-0">
                <span className="block text-sm font-bold" style={{ color: "#1F0A3C" }}>{r.name}</span>
                <span className="block text-xs" style={{ color: "#9CA3AF" }}>{r.id}</span>
              </span>
              <button
                onClick={() => void handleInvite(r.id)}
                disabled={isBusy}
                className="rounded-full px-3 py-1.5 text-xs font-bold text-white shrink-0 disabled:opacity-50"
                style={{ background: "linear-gradient(135deg,#E879A0,#F472B6)" }}
              >
                요청 보내기
              </button>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {isLoading && <p className="text-sm" style={{ color: "#9CA3AF" }}>불러오는 중…</p>}
      {!isLoading && children.length === 0 && (
        <p className="text-sm leading-relaxed" style={{ color: "#6B7280" }}>
          아직 연결된 아이가 없어요. 아이 계정을 새로 만들거나, 이미 있는 계정을 연결해보세요.
        </p>
      )}
      <div className="space-y-2">
        {children.map((child) => (
          <ChildRow
            key={child.id}
            child={child}
            onEdit={() => openEdit(child)}
            onUnlink={() => void handleUnlink(child)}
          />
        ))}
      </div>
      {errorLine}
      <div className="space-y-2 pt-1">
        <SectionButton icon={Plus} label="아이 계정 만들기" onClick={resetCreate} />
        <SectionButton
          icon={Link2}
          label="이미 있는 아이 계정 연결하기"
          onClick={() => {
            setQuery("");
            setResults([]);
            setSearched(false);
            setError(null);
            setMode("link");
          }}
        />
      </div>
    </div>
  );
}
