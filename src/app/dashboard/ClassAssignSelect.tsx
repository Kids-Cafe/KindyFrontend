import { useMemo, useState } from "react";
import { Check, ChevronsUpDown, Loader2, School, X } from "lucide-react";
import { useDashboardStore } from "@/app/dashboard/DashboardStoreContext";
import { canManageKindergartenWide } from "@/app/dashboard/classAccess";
import { Popover, PopoverContent, PopoverTrigger } from "@/app/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/app/components/ui/command";

/**
 * 멤버(아이·교사)를 반에 배정하거나 해제하는 선택기입니다.
 *
 * 누가 어느 반에 앉는지는 **멤버**에 관한 결정이라 서버가 MANAGE_CLASS가 아니라
 * MANAGE_MEMBER로 검사합니다(MANAGE_CLASS는 반 자체를 만들고 이름을 바꾸고 지우는 권한).
 * 여기서도 같은 기준으로 판단해, 권한이 없으면 선택기 대신 지금 반 이름만 보여줍니다
 * (화면을 감추는 건 편의일 뿐이고, 실제 차단은 서버가 합니다).
 *
 * 예전에는 브라우저 기본 `<select>`였습니다. 반이 스무 개쯤 되는 유치원에서는 이름을
 * 눈으로 훑어 찾아야 했고, 지금 어느 반인지도 접힌 채로는 알기 어려웠습니다. 지금은
 * 검색되는 목록에서 고르고, 선택된 반에는 체크가 붙습니다.
 */
export function ClassAssignSelect({ userId, classId }: { userId: string; classId: number | undefined }) {
  const { data, assignMemberClass } = useDashboardStore();
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canAssign = canManageKindergartenWide(data, "manageMembers");
  const current = useMemo(() => data.classes.find((c) => c.id === classId), [data.classes, classId]);

  if (!canAssign) {
    return (
      <p className="text-xs" style={{ color: "#A06080" }}>
        {current ? `${current.name} 소속` : "반 미배정"}
      </p>
    );
  }

  async function choose(next: number | undefined) {
    setOpen(false);
    if (next === classId) return;
    setSaving(true);
    setError(null);
    try {
      await assignMemberClass(userId, next);
    } catch {
      setError("반을 바꾸지 못했어요. 권한을 확인해주세요.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button
            type="button"
            role="combobox"
            aria-expanded={open}
            aria-label="소속 반"
            disabled={saving}
            className="w-full flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-bold text-left transition-colors disabled:opacity-60 hover:bg-black/[0.02]"
            style={{ background: "var(--input-background)", border: "1px solid rgba(232,121,160,0.2)", color: "#6B3580" }}
          >
            {saving ? (
              <Loader2 className="w-3.5 h-3.5 shrink-0 animate-spin" style={{ color: "#E879A0" }} />
            ) : (
              <School className="w-3.5 h-3.5 shrink-0" style={{ color: current ? "#E879A0" : "#C0A0B5" }} />
            )}
            <span className="min-w-0 flex-1 truncate" style={{ color: current ? "#6B3580" : "#A06080" }}>
              {current ? current.name : "반 미배정"}
            </span>
            <ChevronsUpDown className="w-3.5 h-3.5 shrink-0" style={{ color: "#C0A0B5" }} />
          </button>
        </PopoverTrigger>

        <PopoverContent className="w-[--radix-popover-trigger-width] min-w-56 p-0" align="start">
          <Command>
            <CommandInput placeholder="반 이름으로 찾기" className="text-xs" />
            <CommandList>
              <CommandEmpty className="py-4 text-xs" style={{ color: "#A06080" }}>
                그런 이름의 반이 없어요.
              </CommandEmpty>
              <CommandGroup>
                {data.classes.map((cls) => (
                  <CommandItem key={cls.id} value={cls.name} onSelect={() => void choose(cls.id)} className="text-xs">
                    <Check className="w-3.5 h-3.5 shrink-0" style={{ opacity: cls.id === classId ? 1 : 0, color: "#E879A0" }} />
                    <span className="truncate">{cls.name}</span>
                  </CommandItem>
                ))}
                {/* 배정 해제는 반 목록과 성격이 다르므로 아래에 따로 둡니다. */}
                <CommandItem value="반 미배정" onSelect={() => void choose(undefined)} className="text-xs">
                  <X className="w-3.5 h-3.5 shrink-0" style={{ color: "#A06080" }} />
                  <span style={{ color: "#A06080" }}>반 미배정</span>
                  {classId === undefined && <Check className="w-3.5 h-3.5 ml-auto shrink-0" style={{ color: "#E879A0" }} />}
                </CommandItem>
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      {error && <p className="text-[11px] mt-1" style={{ color: "#DC2626" }}>{error}</p>}
    </div>
  );
}
