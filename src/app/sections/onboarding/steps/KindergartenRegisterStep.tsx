import { KindergartenRegisterForm } from "@/app/auth/KindergartenRegisterForm";
import type { KindergartenRegisterPayload } from "@/app/auth/signup";

export function KindergartenRegisterStep({
  onSubmit,
}: {
  onSubmit: (payload: KindergartenRegisterPayload) => void | Promise<void>;
}) {
  return (
    <div>
      <h2 className="text-xl font-bold mb-1" style={{ fontFamily: "'Fredoka',sans-serif", color: "#1F0A3C" }}>
        유치원을 등록해주세요
      </h2>
      <p className="text-sm mb-6" style={{ color: "#6B7280" }}>원장님 계정으로 유치원을 새로 만들게요</p>

      <KindergartenRegisterForm onSubmit={onSubmit} />
    </div>
  );
}
