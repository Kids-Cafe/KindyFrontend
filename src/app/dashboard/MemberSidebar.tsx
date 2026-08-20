import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { KioSVG, KinaSVG } from "@/app/components/decorative";
import { CHAR_DATA } from "@/app/data/characterData";
import type { DashboardData, FeatureId } from "@/app/dashboard/types";

function GroupLabel({ children }: { children: React.ReactNode }) {
  return <p className="px-1 mb-2 text-xs font-bold uppercase tracking-wide" style={{ color: "#C0A0B5" }}>{children}</p>;
}

/**
 * 원장 화면 전용: 반 하나를 카테고리처럼 접고 펼칠 수 있는 섹션입니다.
 * 담임 교사(클릭 시 교사 프로필) + 학생 목록(클릭 시 학생 프로필)을 함께 보여줍니다.
 */
function ClassGroup({
  data,
  classId,
  className,
  onOpenStudent,
  onOpenTeacher,
}: {
  data: DashboardData;
  classId: number;
  className: string;
  onOpenStudent: (childId: string) => void;
  onOpenTeacher: (teacherId: string) => void;
}) {
  const [expanded, setExpanded] = useState(true);
  const classTeacher = data.teachers.find((t) => t.classId === classId);
  const children = data.classChildren.filter((c) => c.classId === classId);
  const memberCount = (classTeacher ? 1 : 0) + children.length;

  return (
    <div className="mb-3">
      <button
        onClick={() => setExpanded((v) => !v)}
        className="w-full flex items-center justify-between px-1 py-1.5 rounded-lg transition-colors hover:bg-black/[0.03]"
      >
        <span className="text-xs font-bold uppercase tracking-wide truncate" style={{ color: "#C0A0B5" }}>
          {className} — {memberCount}
        </span>
        <ChevronDown className="w-3.5 h-3.5 shrink-0 transition-transform" style={{ color: "#C0A0B5", transform: expanded ? "rotate(0deg)" : "rotate(-90deg)" }} />
      </button>

      {expanded && (
        <div className="space-y-1 mt-1">
          {classTeacher ? (
            <button
              key={classTeacher.id}
              onClick={() => onOpenTeacher(classTeacher.id)}
              className="w-full flex items-center gap-2.5 px-2 py-2 rounded-xl text-left transition-colors hover:bg-black/[0.03]"
            >
              <span
                className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0"
                style={{ background: "linear-gradient(135deg,#60A5FA,#3B82F6)" }}
              >
                {(classTeacher.nickname || classTeacher.name).charAt(0)}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-bold truncate" style={{ color: "#3B1355" }}>{classTeacher.nickname || classTeacher.name}</span>
                <span className="block text-xs truncate" style={{ color: "#A06080" }}>담임 교사</span>
              </span>
            </button>
          ) : (
            <p className="px-2 py-1.5 text-xs" style={{ color: "#C0A0B5" }}>담임 미배정</p>
          )}

          {children.map((child) => (
            <button
              key={child.id}
              onClick={() => onOpenStudent(child.id)}
              className="w-full flex items-center gap-2.5 px-2 py-2 rounded-xl text-left transition-colors hover:bg-black/[0.03]"
            >
              <span className="w-8 h-8 rounded-full flex items-center justify-center text-sm shrink-0" style={{ background: child.avatarColor }}>{child.avatarEmoji}</span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-bold truncate" style={{ color: "#3B1355" }}>{child.nickname}</span>
                <span className="block text-xs truncate" style={{ color: "#A06080" }}>{child.parentName}</span>
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * 디스코드의 "멤버 목록" 자리를 대체하는 우측 접이식 사이드바입니다.
 * 역할별로 보여주는 대상이 다릅니다:
 * - 원장: 반마다 접고 펼칠 수 있는 카테고리 (담임 교사 + 학생 목록, 클릭 시 각각의 프로필)
 * - 선생님: 학급 학생 전체 (클릭 시 학생 정보창)
 * - 부모: 담임 선생님(클릭 시 채팅) + 우리 아이 전부(고른 아이는 리포트로, 나머지는 전환)
 * - 아이: 함께 하는 AI 파트너 상태 + 반 친구들(참고용)
 */
export function MemberSidebar({
  data,
  onOpenStudent,
  onSelectFeature,
  onOpenTeacher,
  onSelectChild,
}: {
  data: DashboardData;
  onOpenStudent: (childId: string) => void;
  onSelectFeature: (id: FeatureId) => void;
  onOpenTeacher: (teacherId: string) => void;
  onSelectChild: (childId: string) => void;
}) {
  return (
    <div className="w-64 h-full shrink-0 border-l bg-card overflow-y-auto px-3 py-4" style={{ borderColor: "rgba(232,121,160,0.15)" }}>
      {data.role === "director" && (
        <>
          {data.classes.map((cls) => (
            <ClassGroup
              key={cls.id}
              data={data}
              classId={cls.id}
              className={cls.name}
              onOpenStudent={onOpenStudent}
              onOpenTeacher={onOpenTeacher}
            />
          ))}
        </>
      )}

      {data.role === "teacher" && (
        <>
          <GroupLabel>학생 — {(data.myClassChildren ?? []).length}</GroupLabel>
          <div className="space-y-1">
            {(data.myClassChildren ?? []).map((child) => (
              <button
                key={child.id}
                onClick={() => onOpenStudent(child.id)}
                className="w-full flex items-center gap-2.5 px-2 py-2 rounded-xl text-left transition-colors hover:bg-black/[0.03]"
              >
                <span className="w-8 h-8 rounded-full flex items-center justify-center text-sm shrink-0" style={{ background: child.avatarColor }}>{child.avatarEmoji}</span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-bold truncate" style={{ color: "#3B1355" }}>{child.nickname}</span>
                  <span className="block text-xs truncate" style={{ color: "#A06080" }}>{child.parentName}</span>
                </span>
              </button>
            ))}
          </div>
        </>
      )}

      {data.role === "parent" && data.myChild && (
        <>
          <GroupLabel>담임 선생님</GroupLabel>
          {/*
            담임은 `homeroomTeacher`로만 표시합니다. `data.teacher`는 아무 자리도 없을 때
            로그인한 본인으로 되돌아가는 자리채움이라, 그걸 쓰면 반이 없거나 담임이 아직
            정해지지 않은 아이의 학부모가 자기 이름을 "담임 선생님"으로 보게 됩니다.
          */}
          {data.homeroomTeacher ? (
            <button
              onClick={() => onSelectFeature("parent-chat")}
              className="w-full flex items-center gap-2.5 px-2 py-2 rounded-xl text-left mb-4 transition-colors hover:bg-black/[0.03]"
            >
              <span className="w-8 h-8 rounded-full flex items-center justify-center text-sm shrink-0 font-bold text-white" style={{ background: "linear-gradient(135deg,#60A5FA,#3B82F6)" }}>
                {data.homeroomTeacher.name.charAt(0)}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-bold truncate" style={{ color: "#3B1355" }}>{data.homeroomTeacher.name}</span>
                <span className="block text-xs truncate" style={{ color: "#A06080" }}>{data.homeroomTeacher.className} 담임</span>
              </span>
            </button>
          ) : (
            <p className="px-2 mb-4 text-xs" style={{ color: "#A06080" }}>
              아직 담임 선생님이 정해지지 않았어요.
            </p>
          )}

          <GroupLabel>우리 아이{(data.myChildren?.length ?? 0) > 1 ? ` — ${data.myChildren?.length}` : ""}</GroupLabel>
          {/* 아이가 여럿이면 전부 보여 주고, 누르면 그 아이를 기준으로 화면이 바뀝니다. */}
          <div className="space-y-1">
            {(data.myChildren ?? [data.myChild]).map((child) => {
              const selected = child.id === data.myChild?.id;
              return (
                <button
                  key={child.id}
                  onClick={() => (selected ? onSelectFeature("reports") : onSelectChild(child.id))}
                  className="w-full flex items-center gap-2.5 px-2 py-2 rounded-xl text-left transition-colors hover:bg-black/[0.03]"
                  style={selected ? { background: "rgba(232,121,160,0.10)" } : undefined}
                >
                  <span className="w-8 h-8 rounded-full flex items-center justify-center text-sm shrink-0" style={{ background: child.avatarColor }}>{child.avatarEmoji}</span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-bold truncate" style={{ color: "#3B1355" }}>{child.nickname}</span>
                    <span className="block text-xs truncate" style={{ color: "#A06080" }}>
                      {selected ? "성장 리포트 보기" : `${child.className} · 이 아이 보기`}
                    </span>
                  </span>
                </button>
              );
            })}
          </div>
        </>
      )}

      {data.role === "child" && data.me && (
        <>
          <GroupLabel>나의 AI 파트너</GroupLabel>
          {data.me.aiPartner ? (
            <div className="flex items-center gap-2.5 px-2 py-2 mb-4">
              <span className="w-8 h-8 rounded-full flex items-center justify-center overflow-hidden shrink-0" style={{ background: `${CHAR_DATA[data.me.aiPartner].color}22` }}>
                {data.me.aiPartner === "kio" ? <KioSVG className="h-7 w-auto" /> : <KinaSVG className="h-7 w-auto" />}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-bold truncate" style={{ color: "#3B1355" }}>{CHAR_DATA[data.me.aiPartner].name}</span>
                <span className="flex items-center gap-1 text-xs" style={{ color: "#22C55E" }}>
                  <span className="w-1.5 h-1.5 rounded-full bg-current" /> 온라인
                </span>
              </span>
            </div>
          ) : (
            <p className="px-2 text-xs mb-4" style={{ color: "#A06080" }}>아직 파트너를 고르지 않았어요.</p>
          )}

          <GroupLabel>같은 반 친구들</GroupLabel>
          <div className="space-y-1">
            {data.classChildren.filter((c) => c.classId === data.me?.classId && c.id !== data.me?.id).map((child) => (
              <div key={child.id} className="flex items-center gap-2.5 px-2 py-2">
                <span className="w-8 h-8 rounded-full flex items-center justify-center text-sm shrink-0" style={{ background: child.avatarColor }}>{child.avatarEmoji}</span>
                <span className="text-sm font-bold truncate" style={{ color: "#3B1355" }}>{child.nickname}</span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
