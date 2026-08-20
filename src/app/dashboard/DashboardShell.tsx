import { useEffect, useMemo, useState } from "react";
import { ChevronRight, PanelRightClose, PanelRightOpen } from "lucide-react";
import { useAuth } from "@/app/auth/AuthContext";
import { MyPage } from "@/app/sections/MyPage";
import { ReceivedInvites } from "@/app/auth/ReceivedInvites";
import { MiniStar } from "@/app/components/decorative";
import { DashboardStoreProvider, useDashboardStore } from "@/app/dashboard/DashboardStoreContext";
import { ServerRail } from "@/app/dashboard/ServerRail";
import { FeatureSidebar } from "@/app/dashboard/FeatureSidebar";
import { MemberSidebar } from "@/app/dashboard/MemberSidebar";
import { StudentInfoDialog } from "@/app/dashboard/StudentInfoDialog";
import { DirectorStudentPanel } from "@/app/dashboard/DirectorStudentPanel";
import { MemberProfilePanel } from "@/app/dashboard/MemberProfilePanel";
import { canOpenFeature, featuresFor, getDefaultFeature } from "@/app/dashboard/featureDefs";
import { canManageRoster } from "@/app/dashboard/classAccess";
import type { FeatureId } from "@/app/dashboard/types";
import type { ChatTarget } from "@/app/dashboard/features/TeacherChatFeature";
import { PartnerSelect } from "@/app/dashboard/features/PartnerSelect";
import { AiChatFeature } from "@/app/dashboard/features/AiChatFeature";
import { DiaryFeature } from "@/app/dashboard/features/DiaryFeature";
import { ReportsFeature } from "@/app/dashboard/features/ReportsFeature";
import { DashboardHomeFeature } from "@/app/dashboard/features/DashboardHomeFeature";
import { ParentChatFeature } from "@/app/dashboard/features/ParentChatFeature";
import { TeacherChatFeature } from "@/app/dashboard/features/TeacherChatFeature";
import { NoticeManageFeature } from "@/app/dashboard/features/NoticeManageFeature";
import { NoticeBanner } from "@/app/dashboard/features/NoticeBanner";
import { ClassManageFeature } from "@/app/dashboard/features/ClassManageFeature";
import { MemberManageFeature } from "@/app/dashboard/features/MemberManageFeature";
import { SuppliesFeature } from "@/app/dashboard/features/SuppliesFeature";
import { ScheduleFeature, UpcomingScheduleBanner } from "@/app/dashboard/features/ScheduleFeature";
import { PhotoAlbumFeature } from "@/app/dashboard/features/PhotoAlbumFeature";
import { ChildScheduleAnnouncer } from "@/app/dashboard/features/ChildScheduleAnnouncer";
import { RecommendationsFeature } from "@/app/dashboard/features/RecommendationsFeature";

/** @param onMembershipsChanged 마이페이지에서 유치원을 새로 등록/가입했을 때 워크스페이스 목록을 다시 받게 합니다. */
function DashboardBody({ onMembershipsChanged }: { onMembershipsChanged: () => void }) {
  const { user } = useAuth();
  const { data, workspaces, activeWorkspaceId, switchWorkspace, selectChild } = useDashboardStore();
  // 역할뿐 아니라 배정된 권한까지 반영합니다 — 원장이 반/멤버 관리 권한을 준 선생님은
  // 그 항목이 사이드바에 함께 뜹니다.
  const features = useMemo(() => featuresFor(data), [data]);

  const [activeFeature, setActiveFeature] = useState<FeatureId>(() =>
    getDefaultFeature(data.role, Boolean(data.me?.aiPartner)),
  );
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [memberOpen, setMemberOpen] = useState(true);
  const [showMyPage, setShowMyPage] = useState(false);
  const [openStudentId, setOpenStudentId] = useState<string | null>(null);
  const [openTeacherId, setOpenTeacherId] = useState<string | null>(null);
  // 대화 상대는 아이가 아니라 그 아이의 보호자 한 명입니다(보호자가 둘일 수 있습니다).
  const [chatTarget, setChatTarget] = useState<ChatTarget | null>(null);

  // 좌측 서버 레일에서 다른 유치원 워크스페이스로 옮겨가면, 그 유치원 역할에 맞는
  // 기본 화면으로 돌아가고 이전 워크스페이스에서 열려 있던 패널들은 닫아 둡니다.
  useEffect(() => {
    setActiveFeature(getDefaultFeature(data.role, Boolean(data.me?.aiPartner)));
    setOpenStudentId(null);
    setOpenTeacherId(null);
    setChatTarget(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeWorkspaceId]);

  const contextLabel = useMemo(() => {
    if (data.role === "child") return data.me?.aiPartner ? `${data.me.nickname}의 공간` : "환영해요!";
    if (data.role === "parent") return `${data.myChild?.nickname ?? ""} 학부모`;
    if (data.role === "director") return `${data.kindergarten.name} 원장`;
    return `${data.teacher.className} 담임`;
  }, [data]);

  function openStudentChat(target: ChatTarget) {
    setOpenStudentId(null);
    setChatTarget(target);
    setActiveFeature("teacher-chat");
  }

  function handleSelectFeature(id: FeatureId) {
    setActiveFeature(id);
  }

  const activeDef = features.find((f) => f.id === activeFeature) ?? features[0];

  return (
    <div className="fixed inset-0 z-[100] flex bg-background text-foreground">
      <ServerRail
        workspaces={workspaces}
        activeWorkspaceId={activeWorkspaceId}
        onSwitchWorkspace={switchWorkspace}
        onGoMain={() => setActiveFeature(getDefaultFeature(data.role, Boolean(data.me?.aiPartner)))}
      />
      <div
        className="shrink-0 overflow-hidden transition-[width] duration-300 ease-in-out"
        style={{ width: sidebarOpen ? 256 : 0 }}
      >
        <div className="w-64 h-full">
          <FeatureSidebar
            kindergartenName={data.kindergarten.name}
            contextLabel={contextLabel}
            features={features}
            activeFeature={activeFeature}
            onSelectFeature={handleSelectFeature}
            onOpenMyPage={() => setShowMyPage(true)}
            onCollapse={() => setSidebarOpen(false)}
          />
        </div>
      </div>

      {!sidebarOpen && (
        <div className="shrink-0 flex items-start pt-6 pl-0">
          <button
            onClick={() => setSidebarOpen(true)}
            aria-label="기능 목록 열기"
            className="group relative flex flex-col items-center gap-1.5 pl-2.5 pr-2 py-3 rounded-r-2xl border border-l-0 shadow-sm transition-all duration-200 hover:pr-3.5 hover:-translate-y-0.5"
            style={{
              background: "linear-gradient(180deg,#FFE8F1,#FFD9EA)",
              borderColor: "rgba(232,121,160,0.3)",
              boxShadow: "2px 3px 0 rgba(232,121,160,0.18)",
            }}
          >
            <span
              className="w-2 h-2 rounded-full shrink-0"
              style={{ background: "#FFFFFF", boxShadow: "inset 0 0 0 1px rgba(232,121,160,0.35)" }}
            />
            <span
              className="text-[11px] font-bold tracking-wide"
              style={{
                color: "#C0568A",
                writingMode: "vertical-rl",
                fontFamily: "'Fredoka',sans-serif",
              }}
            >
              {data.kindergarten.name}
            </span>
            <ChevronRight className="w-3 h-3 shrink-0 transition-transform group-hover:translate-x-0.5" style={{ color: "#E879A0" }} />
          </button>
        </div>
      )}

      <div className="flex-1 min-w-0 flex flex-col">
        <div className="h-14 shrink-0 flex items-center justify-between px-5 border-b" style={{ borderColor: "rgba(232,121,160,0.15)" }}>
          <div className="flex items-center gap-2 min-w-0">
            {activeDef && <activeDef.icon className="w-4 h-4 shrink-0" style={{ color: "#E879A0" }} />}
            <span className="font-bold text-sm truncate" style={{ color: "#3B1355" }}>{activeDef?.label}</span>
          </div>
          {/*
            아이를 둘 이상 이 유치원에 보낸 학부모용 전환기입니다. 일기·리포트·알림장·채팅이
            모두 `data.myChild` 하나를 기준으로 도는데, 그동안 그 값이 첫째로 고정돼 있어
            둘째의 화면에는 들어갈 방법이 아예 없었습니다.
          */}
          {data.role === "parent" && (data.myChildren?.length ?? 0) > 1 && (
            <div className="flex items-center gap-1 shrink-0 mr-2">
              {data.myChildren?.map((child) => {
                const selected = child.id === data.myChild?.id;
                return (
                  <button
                    key={child.id}
                    onClick={() => selectChild(child.id)}
                    aria-pressed={selected}
                    className="flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-bold transition-colors"
                    style={{
                      background: selected ? "rgba(232,121,160,0.14)" : "transparent",
                      color: selected ? "#C0568A" : "#A06080",
                    }}
                  >
                    <span className="w-5 h-5 rounded-full flex items-center justify-center text-[11px] shrink-0" style={{ background: child.avatarColor }}>
                      {child.avatarEmoji}
                    </span>
                    <span className="truncate max-w-[6rem]">{child.nickname}</span>
                  </button>
                );
              })}
            </div>
          )}
          <button
            onClick={() => setMemberOpen((v) => !v)}
            aria-label={memberOpen ? "멤버 목록 닫기" : "멤버 목록 열기"}
            className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-colors hover:bg-black/[0.04]"
          >
            {memberOpen ? <PanelRightClose className="w-4 h-4" style={{ color: "#A06080" }} /> : <PanelRightOpen className="w-4 h-4" style={{ color: "#A06080" }} />}
          </button>
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto p-6">
          {/*
            이미 어느 유치원에 소속돼 있어도 다른 유치원의 초대는 계속 올 수 있습니다.
            초대가 대기 중일 때만 나타나며(없으면 아무것도 렌더하지 않습니다), 수락하면
            워크스페이스 목록을 다시 받아 좌측 레일에 새 유치원이 생깁니다.
          */}
          <ReceivedInvites onAccepted={onMembershipsChanged} />
          <NoticeBanner />
          {data.role !== "child" && <UpcomingScheduleBanner />}
          {data.role === "child" && data.me && (
            <ChildScheduleAnnouncer childId={data.me.id} userId={user?.id ?? data.me.id} partner={data.me.aiPartner} />
          )}

          {data.role === "child" && data.me && (
            <>
              {activeFeature === "partner-select" && (
                <PartnerSelect
                  childId={data.me.id}
                  currentPartner={data.me.aiPartner}
                  onSelected={() => setActiveFeature("ai-text-chat")}
                />
              )}
              {activeFeature === "ai-text-chat" && !data.me.aiPartner && (
                <button
                  onClick={() => setActiveFeature("partner-select")}
                  className="text-sm font-bold px-5 py-3 rounded-2xl text-white transition-transform active:scale-95"
                  style={{ background: "linear-gradient(135deg,#E879A0,#F472B6)" }}
                >
                  먼저 AI 파트너를 골라주세요 →
                </button>
              )}
              {activeFeature === "ai-text-chat" && data.me.aiPartner && (
                <AiChatFeature childId={data.me.id} partner={data.me.aiPartner} />
              )}
              {activeFeature === "diary" && <DiaryFeature childId={data.me.id} />}
            </>
          )}

          {data.role !== "child" && activeFeature === "home" && (
            <DashboardHomeFeature role={data.role} onOpenStudent={setOpenStudentId} onNavigate={handleSelectFeature} />
          )}

          {data.role === "parent" && data.myChild && (
            <>
              {activeFeature === "diary" && <DiaryFeature childId={data.myChild.id} />}
              {activeFeature === "reports" && <ReportsFeature />}
              {activeFeature === "parent-chat" && <ParentChatFeature />}
              {activeFeature === "recommendations" && <RecommendationsFeature />}
            </>
          )}

          {data.role === "teacher" && (
            <>
              {activeFeature === "reports" && <ReportsFeature />}
              {activeFeature === "teacher-chat" && (
                <TeacherChatFeature target={chatTarget} onSelectTarget={setChatTarget} />
              )}
            </>
          )}

          {/*
            원장 전용이 아니라 **권한이 있는 사람 전용**입니다. `canOpenFeature`가 사이드바를
            만드는 것과 같은 판정을 쓰므로, 목록에 없는 화면은 여기서도 열리지 않습니다.
          */}
          {activeFeature === "notices" && canOpenFeature(data, "notices") && <NoticeManageFeature />}
          {activeFeature === "classes" && canOpenFeature(data, "classes") && <ClassManageFeature />}
          {activeFeature === "members" && canOpenFeature(data, "members") && <MemberManageFeature />}

          {activeFeature === "supplies" && <SuppliesFeature />}
          {activeFeature === "schedule" && <ScheduleFeature />}
          {activeFeature === "photos" && <PhotoAlbumFeature />}
        </div>
      </div>

      <div
        className="shrink-0 overflow-hidden transition-[width] duration-300 ease-in-out"
        style={{ width: memberOpen ? 256 : 0 }}
      >
        <div className="w-64 h-full">
          <MemberSidebar data={data} onOpenStudent={setOpenStudentId} onSelectFeature={handleSelectFeature} onOpenTeacher={setOpenTeacherId} onSelectChild={selectChild} />
        </div>
      </div>

      {/*
        반 배정이 들어 있는 패널이라 원장뿐 아니라 명단을 관리하는 선생님도 이쪽을 씁니다 —
        사이드바에서 "반 미배정" 아이를 눌러 놓고 반을 정해 줄 수 없으면 반쪽짜리입니다.
      */}
      {canManageRoster(data) ? (
        <DirectorStudentPanel childId={openStudentId} onClose={() => setOpenStudentId(null)} />
      ) : (
        <StudentInfoDialog childId={openStudentId} onClose={() => setOpenStudentId(null)} onStartChat={openStudentChat} />
      )}
      <MemberProfilePanel teacherId={openTeacherId} onClose={() => setOpenTeacherId(null)} />
      {showMyPage && <MyPage onClose={() => setShowMyPage(false)} onMembershipsChanged={onMembershipsChanged} />}
    </div>
  );
}

/** 대시보드 바깥에서도 쓰는 최소 껍데기입니다. 워크스페이스가 없을 때의 화면이 여기 얹힙니다. */
function BareScreen({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="fixed inset-0 z-[100] flex flex-col items-center justify-center px-6 text-center bg-background"
      style={{ background: "linear-gradient(160deg,#FFF7FA 0%,#FDF2F8 100%)" }}
    >
      <div className="flex items-center gap-2.5 mb-6">
        <div className="w-9 h-9 rounded-xl flex items-center justify-center shadow-lg" style={{ background: "linear-gradient(135deg,#E879A0,#F472B6)" }}>
          <MiniStar size={18} color="white" />
        </div>
        <span className="text-xl font-bold" style={{ fontFamily: "'Fredoka',sans-serif", color: "#3B1355" }}>kindy</span>
      </div>
      {children}
    </div>
  );
}

/**
 * 소속된 유치원이 하나도 없을 때의 화면입니다.
 *
 * 대시보드 본체(`DashboardBody`)가 렌더되지 않는 상태이므로, 여기서 마이페이지와
 * 로그아웃을 직접 띄워 줍니다. 이게 없으면 유치원에 가입할 방법 자체가 사라집니다.
 * 받은 초대는 이 자리에서 바로 수락할 수 있게 함께 보여줍니다.
 */
function EmptyWorkspaceScreen({ onJoined }: { onJoined: () => void }) {
  const { logout } = useAuth();
  const [showMyPage, setShowMyPage] = useState(false);

  return (
    <BareScreen>
      <p className="text-base font-bold mb-1.5" style={{ color: "#3B1355" }}>아직 소속된 유치원이 없어요</p>
      <p className="text-sm mb-6" style={{ color: "#A06080" }}>
        받은 초대를 수락하거나, 마이페이지에서 유치원을 찾아 가입해주세요.
      </p>

      <div className="w-full max-w-sm">
        <ReceivedInvites onAccepted={onJoined} />
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={() => setShowMyPage(true)}
          className="text-sm font-bold px-5 py-2.5 rounded-full text-white transition-transform active:scale-95"
          style={{ background: "linear-gradient(135deg,#E879A0,#F472B6)" }}
        >
          마이페이지 열기
        </button>
        <button
          onClick={logout}
          className="text-sm font-bold px-5 py-2.5 rounded-full transition-colors hover:bg-black/[0.04]"
          style={{ color: "#A06080", border: "1.5px solid rgba(232,121,160,0.3)" }}
        >
          로그아웃
        </button>
      </div>

      {/* 마이페이지에서 유치원에 가입했을 수도 있으니 닫을 때 한 번 더 확인합니다. */}
      {showMyPage && (
        <MyPage onClose={() => { setShowMyPage(false); onJoined(); }} onMembershipsChanged={onJoined} />
      )}
    </BareScreen>
  );
}

function LoadingWorkspaceScreen() {
  return (
    <BareScreen>
      <p className="text-sm font-bold" style={{ color: "#A06080" }} role="status" aria-live="polite">
        유치원 정보를 불러오는 중이에요…
      </p>
    </BareScreen>
  );
}

/** 로그인 + 온보딩을 마친 사용자가 보게 되는 디스코드형 대시보드 진입점입니다. */
export function DashboardShell() {
  const { user } = useAuth();
  // 소속 유치원이 생겼을 수 있는 시점마다 이 값을 올려 워크스페이스 목록을 다시 받습니다.
  const [membershipNonce, setMembershipNonce] = useState(0);

  if (!user) return null;

  return (
    <DashboardStoreProvider
      membershipNonce={membershipNonce}
      loading={<LoadingWorkspaceScreen />}
      empty={<EmptyWorkspaceScreen onJoined={() => setMembershipNonce((n) => n + 1)} />}
    >
      <DashboardBody onMembershipsChanged={() => setMembershipNonce((n) => n + 1)} />
    </DashboardStoreProvider>
  );
}
