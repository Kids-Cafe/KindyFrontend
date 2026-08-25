import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { KioSVG, KinaSVG } from "@/app/components/decorative";
import { CHAR_DATA } from "@/app/data/characterData";
import { canManageRoster } from "@/app/dashboard/classAccess";
import { parentNames } from "@/app/dashboard/parents";
import type { ChildRecord, DashboardData, FeatureId, TeacherRecord } from "@/app/dashboard/types";

function GroupLabel({ children }: { children: React.ReactNode }) {
  return <p className="px-1 mb-2 text-xs font-bold uppercase tracking-wide" style={{ color: "#C0A0B5" }}>{children}</p>;
}

function TeacherRow({ teacher, subtitle, onOpen }: { teacher: TeacherRecord; subtitle: string; onOpen: (teacherId: string) => void }) {
  return (
    <button
      onClick={() => onOpen(teacher.id)}
      className="w-full flex items-center gap-2.5 px-2 py-2 rounded-xl text-left transition-colors hover:bg-black/[0.03]"
    >
      <span
        className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0"
        style={{ background: "linear-gradient(135deg,#60A5FA,#3B82F6)" }}
      >
        {(teacher.nickname || teacher.name).charAt(0)}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-bold truncate" style={{ color: "#3B1355" }}>{teacher.nickname || teacher.name}</span>
        <span className="block text-xs truncate" style={{ color: "#A06080" }}>{subtitle}</span>
      </span>
    </button>
  );
}

function ChildRow({ child, onOpen }: { child: ChildRecord; onOpen: (childId: string) => void }) {
  return (
    <button
      onClick={() => onOpen(child.id)}
      className="w-full flex items-center gap-2.5 px-2 py-2 rounded-xl text-left transition-colors hover:bg-black/[0.03]"
    >
      <span className="w-8 h-8 rounded-full flex items-center justify-center text-sm shrink-0" style={{ background: child.avatarColor }}>{child.avatarEmoji}</span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-bold truncate" style={{ color: "#3B1355" }}>{child.nickname}</span>
        <span className="block text-xs truncate" style={{ color: "#A06080" }}>{parentNames(child)}</span>
      </span>
    </button>
  );
}

/**
 * 접고 펼칠 수 있는 멤버 묶음 하나입니다(반 하나, 또는 "반 미배정").
 * 교사(클릭 시 교사 프로필) + 학생(클릭 시 학생 프로필)을 함께 보여줍니다.
 *
 * 교사는 `find`가 아니라 **전부** 그립니다. 예전에는 반마다 첫 교사 한 명만 그려서,
 * 부담임처럼 같은 반에 배정된 두 번째 교사가 목록에서 사라졌습니다.
 */
function MemberGroup({
  label,
  teachers,
  children,
  teacherSubtitle,
  emptyNote,
  onOpenStudent,
  onOpenTeacher,
}: {
  label: string;
  teachers: TeacherRecord[];
  children: ChildRecord[];
  teacherSubtitle: string;
  emptyNote?: string;
  onOpenStudent: (childId: string) => void;
  onOpenTeacher: (teacherId: string) => void;
}) {
  const [expanded, setExpanded] = useState(true);
  const memberCount = teachers.length + children.length;

  return (
    <div className="mb-3">
      <button
        onClick={() => setExpanded((v) => !v)}
        className="w-full flex items-center justify-between px-1 py-1.5 rounded-lg transition-colors hover:bg-black/[0.03]"
      >
        <span className="text-xs font-bold uppercase tracking-wide truncate" style={{ color: "#C0A0B5" }}>
          {label} — {memberCount}
        </span>
        <ChevronDown className="w-3.5 h-3.5 shrink-0 transition-transform" style={{ color: "#C0A0B5", transform: expanded ? "rotate(0deg)" : "rotate(-90deg)" }} />
      </button>

      {expanded && (
        <div className="space-y-1 mt-1">
          {teachers.length === 0 && emptyNote && (
            <p className="px-2 py-1.5 text-xs" style={{ color: "#C0A0B5" }}>{emptyNote}</p>
          )}
          {teachers.map((teacher) => (
            <TeacherRow key={teacher.id} teacher={teacher} subtitle={teacherSubtitle} onOpen={onOpenTeacher} />
          ))}
          {children.map((child) => (
            <ChildRow key={child.id} child={child} onOpen={onOpenStudent} />
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * 유치원 전체를 반별로 묶어 보여줍니다. 원장과, 멤버·반을 관리할 권한을 받은 선생님이 봅니다.
 *
 * 마지막의 "반 미배정" 묶음이 핵심입니다. 예전에는 `data.classes`만 훑어서, **어느 반에도
 * 속하지 않은 사람은 원장에게조차 보이지 않았습니다** — 갓 초대를 수락한 선생님도, 아직
 * 반이 정해지지 않은 아이도 사이드바에 나타나지 않아 반을 배정해 줄 방법이 없었습니다.
 */
function KindergartenRoster({
  data,
  onOpenStudent,
  onOpenTeacher,
}: {
  data: DashboardData;
  onOpenStudent: (childId: string) => void;
  onOpenTeacher: (teacherId: string) => void;
}) {
  const classIds = new Set(data.classes.map((c) => c.id));
  // 사라진 반을 가리키는 낡은 배정도 "미배정"으로 봅니다. 그러지 않으면 또 숨습니다.
  const inNoClass = (classId: number | undefined) => classId === undefined || !classIds.has(classId);
  const looseTeachers = data.teachers.filter((t) => inNoClass(t.classId));
  const looseChildren = data.classChildren.filter((c) => inNoClass(c.classId || undefined));

  return (
    <>
      {data.classes.map((cls) => (
        <MemberGroup
          key={cls.id}
          label={cls.name}
          teachers={data.teachers.filter((t) => t.classId === cls.id)}
          children={data.classChildren.filter((c) => c.classId === cls.id)}
          teacherSubtitle="담임 교사"
          emptyNote="담임 미배정"
          onOpenStudent={onOpenStudent}
          onOpenTeacher={onOpenTeacher}
        />
      ))}

      {(looseTeachers.length > 0 || looseChildren.length > 0) && (
        <MemberGroup
          label="반 미배정"
          teachers={looseTeachers}
          children={looseChildren}
          teacherSubtitle="유치원 소속"
          onOpenStudent={onOpenStudent}
          onOpenTeacher={onOpenTeacher}
        />
      )}
    </>
  );
}

/**
 * 디스코드의 "멤버 목록" 자리를 대체하는 우측 접이식 사이드바입니다.
 * 역할별로 보여주는 대상이 다릅니다:
 * - 원장 · 멤버/반 관리 권한을 받은 선생님: 반마다 접고 펼칠 수 있는 카테고리
 *   (교사 + 학생, 클릭 시 각각의 프로필) + 어느 반에도 속하지 않은 사람들
 * - 그 밖의 선생님: 학급 학생 전체 (클릭 시 학생 정보창)
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
    <div className="w-full h-full shrink-0 border-l bg-card overflow-y-auto px-3 py-4" style={{ borderColor: "rgba(232,121,160,0.15)" }}>
      {/*
        원장과 "멤버/반 관리" 권한을 받은 선생님은 유치원 전체를 반별로 봅니다. 권한이 없는
        선생님은 예전처럼 자기 반 학생만 봅니다.
      */}
      {canManageRoster(data) && (
        <KindergartenRoster data={data} onOpenStudent={onOpenStudent} onOpenTeacher={onOpenTeacher} />
      )}

      {data.role === "teacher" && !canManageRoster(data) && (
        <>
          <GroupLabel>학생 — {(data.myClassChildren ?? []).length}</GroupLabel>
          <div className="space-y-1">
            {(data.myClassChildren ?? []).map((child) => (
              <ChildRow key={child.id} child={child} onOpen={onOpenStudent} />
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
