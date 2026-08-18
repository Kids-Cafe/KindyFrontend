import { useState } from "react";
import { MiniStar, KioSVG, KinaSVG } from "@/app/components/decorative";
import { useAuth } from "@/app/auth/AuthContext";
import type { AuthUser, TeacherRole, UserRole } from "@/app/auth/types";
import { registerKindergarten } from "@/app/auth/signup";
import { ReceivedInvites } from "@/app/auth/ReceivedInvites";
import { RoleStep } from "@/app/sections/onboarding/steps/RoleStep";
import { NicknameStep } from "@/app/sections/onboarding/steps/NicknameStep";
import { TeacherRoleStep } from "@/app/sections/onboarding/steps/TeacherRoleStep";
import { KindergartenRegisterStep } from "@/app/sections/onboarding/steps/KindergartenRegisterStep";
import { KindergartenSearchStep } from "@/app/sections/onboarding/steps/KindergartenSearchStep";
import { useLeaveConfirmation } from "@/app/hooks/useLeaveConfirmation";

type Step = "role" | "nickname" | "teacherRole" | "kinder" | "kinderParent";

/** 단계별로 키오/키나가 건네는 말풍선 문구입니다. */
const STEP_MESSAGES: Partial<Record<Step, string>> = {
  kinder: "유치원 정보를 알려주시면 우리 서비스의 다양한 기능을 사용할 수 있어요! 아직 등록할 유치원이 없다면 나중에 입력해도 괜찮아요.",
  kinderParent: "우리 아이가 다니는 유치원을 알려주시면 알림장, 사진첩 같은 기능을 바로 쓸 수 있어요! 아직 정해지지 않았다면 나중에 입력해도 괜찮아요.",
};

/**
 * 가입 직후 첫 화면입니다. 윈도우 최초 설정처럼 키오/키나가 등장해
 * 학부모/선생님 여부, 별칭, 유치원 정보를 순서대로 물어봅니다.
 * 아동 계정으로 가입했다면 "학부모/선생님" 질문이 의미가 없으므로 역할 선택
 * 단계를 건너뛰고 바로 별칭 설정 단계로 시작합니다.
 * 유치원 정보는 서비스 이용에 필요하지만 아직 정해지지 않았을 수 있어
 * 건너뛰기 버튼으로 나중에 입력할 수 있게 합니다.
 */
export function OnboardingWizard({ onComplete }: { onComplete: () => void }) {
  const { user, updateProfile } = useAuth();
  const isChildAccount = user?.accountType === "child";
  const [step, setStep] = useState<Step>(isChildAccount ? "nickname" : "role");
  const [role, setRole] = useState<UserRole | null>(isChildAccount ? "parent" : null);
  const [teacherRole, setTeacherRole] = useState<TeacherRole | null>(null);
  const [nickname, setNickname] = useState<string | null>(null);

  // 온보딩(초기 설정) 도중에는 뒤로가기/앞으로가기·새로고침 시 확인창을 띄웁니다.
  useLeaveConfirmation(true, onComplete);

  const totalSteps = isChildAccount ? 2 : role === "teacher" ? 4 : 3;
  const stepIndex = isChildAccount
    ? { nickname: 1, kinderParent: 2 }[step as "nickname" | "kinderParent"]
    : { role: 1, nickname: 2, teacherRole: 3, kinder: 4, kinderParent: 3 }[step];

  /**
   * @param join 방금 고른 유치원에 실제로 합류(가입) 요청까지 보낼지. 원장이 막
   * 만든 유치원은 `registerKindergarten`의 create 호출이 곧 소유자 등록이라 false로 넘깁니다.
   */
  async function finish(partial: Partial<AuthUser>, join?: { type: "CHILD" | "TEACHER" }) {
    updateProfile({ ...partial, onboardingCompleted: true });

    const kindergartenId = partial.kindergarten?.id;
    if (join && kindergartenId && kindergartenId > 0) {
      await fetch("/api/kindergarten/join", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        credentials: "include",
        body: new URLSearchParams({ id: String(kindergartenId), type: join.type }),
      }).catch(() => {});
    }
    if (partial.nickname && kindergartenId && kindergartenId > 0) {
      await fetch("/api/kindergarten/setNickname", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        credentials: "include",
        body: new URLSearchParams({ id: String(kindergartenId), userId: user!.id, nickname: partial.nickname }),
      }).catch(() => {});
    }

    await fetch("/api/user/onboarding/complete", {
        method: "POST",
        credentials: "include"
    });
    onComplete();
  }

  return (
    <div className="fixed inset-0 z-[9600] flex flex-col items-center justify-center px-4 py-8 overflow-y-auto"
      style={{ background: "linear-gradient(160deg, #3B1355 0%, #6B2D8C 50%, #1F0A3C 100%)" }}
      role="dialog" aria-modal="true" aria-label="시작하기 설정">

      <div className="flex items-center gap-2.5 mb-6">
        <div className="w-9 h-9 rounded-xl flex items-center justify-center shadow-lg" style={{ background: "linear-gradient(135deg,#E879A0,#F472B6)" }}>
          <MiniStar size={18} color="white" />
        </div>
        <span className="text-xl font-bold text-white" style={{ fontFamily: "'Fredoka',sans-serif" }}>Kindy에 오신 걸 환영해요!</span>
      </div>

      <div className="flex items-end gap-4 mb-6">
        <div style={{ filter: "drop-shadow(0 0 20px rgba(244,114,182,0.6))", animation: "float 3.8s ease-in-out infinite" }}>
          <KinaSVG className="h-28 w-auto" />
        </div>
        <div style={{ filter: "drop-shadow(0 0 20px rgba(96,165,250,0.6))", animation: "float 3.4s ease-in-out infinite", animationDelay: "0.6s" }}>
          <KioSVG className="h-28 w-auto" />
        </div>
      </div>

      <div className="flex gap-2 mb-4">
        {Array.from({ length: totalSteps }).map((_, i) => (
          <div key={i} className="h-2 rounded-full transition-all"
            style={{ width: i + 1 === stepIndex ? 24 : 8, background: i + 1 <= stepIndex ? "#F472B6" : "rgba(255,255,255,0.3)" }} />
        ))}
      </div>

      {STEP_MESSAGES[step] && (
        <div className="w-full max-w-md rounded-2xl px-5 py-3 mb-4" style={{ background: "rgba(255,255,255,0.12)" }}>
          <p className="text-sm text-center text-white leading-snug">{STEP_MESSAGES[step]}</p>
        </div>
      )}

      <div className="w-full max-w-md bg-white rounded-3xl p-8 shadow-2xl">
        {step === "role" && (
          <RoleStep onSelect={(r) => { setRole(r); setStep("nickname"); }} />
        )}

        {step === "nickname" && (
          <NicknameStep
            greetingName={user?.name ?? ""}
            onConfirm={(name) => {
              setNickname(name);
              updateProfile({ nickname: name });
              if (role === "teacher") {
                setStep("teacherRole");
              } else {
                setStep("kinderParent");
              }
            }}
          />
        )}

        {step === "teacherRole" && (
          <TeacherRoleStep onSelect={(tr) => { setTeacherRole(tr); setStep("kinder"); }} />
        )}

        {step === "kinder" && teacherRole === "director" && (
          <KindergartenRegisterStep
            onSubmit={async (payload) => {
              const kindergarten = await registerKindergarten(payload);
              finish({ role: "teacher", teacherRole: "director", kindergarten });
            }}
          />
        )}

        {step === "kinder" && teacherRole === "teacher" && (
          <>
            <ReceivedInvites role="teacher" onAccepted={() => finish({})} />
            <KindergartenSearchStep
              onSelect={(kindergarten) => finish({ role: "teacher", teacherRole: "teacher", kindergarten }, { type: "TEACHER" })}
              onSkip={() => finish({ role: "teacher", teacherRole: "teacher" })}
            />
          </>
        )}

        {step === "kinderParent" && (
          <>
            <ReceivedInvites role={isChildAccount ? "child" : "parent"} onAccepted={() => finish({})} />
            <KindergartenSearchStep
              onSelect={(kindergarten) => finish({ role: "parent", nickname: nickname ?? undefined, kindergarten }, { type: "CHILD" })}
              onSkip={() => finish({ role: "parent", nickname: nickname ?? undefined })}
            />
          </>
        )}
      </div>
    </div>
  );
}
