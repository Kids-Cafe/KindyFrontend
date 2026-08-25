import { useEffect, useMemo, useState } from "react";
import { ChevronRight, PanelLeftOpen, PanelRightClose, PanelRightOpen } from "lucide-react";
import { useAuth } from "@/app/auth/AuthContext";
import { MyPage } from "@/app/sections/MyPage";
import { ReceivedInvites } from "@/app/auth/ReceivedInvites";
import { MiniStar } from "@/app/components/decorative";
import { Sheet, SheetContent, SheetTitle } from "@/app/components/ui/sheet";
import { cn } from "@/app/components/ui/utils";
import { useMediaQuery } from "@/app/hooks/useMediaQuery";
import { usePersistedFlag } from "@/app/hooks/usePersistedFlag";
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

/*
  사이드바를 화면 옆에 "붙여 둘" 수 있는 폭입니다. 레일 + 사이드바를 뺀 나머지가
  가운데 칸인데, 이 값들에서 딱 440px이 남습니다(768-56-256, 1024-72-256-256).
  그보다 좁아지면 붙이지 않고 서랍(오버레이)으로 띄웁니다 — 예전에는 폭이 모자라도
  계속 붙여 두는 바람에 가운데 칸이 글자 한 자 너비까지 짓눌렸습니다.
  Tailwind의 `md`/`lg`와 같은 값이라, 클래스 쪽 분기와 어긋나지 않습니다.
*/
const MEDIA_DOCK_FEATURE = "(min-width: 768px)";
const MEDIA_DOCK_MEMBER = "(min-width: 1024px)";

const STORAGE_FEATURE_OPEN = "kindy.sidebar.feature";
const STORAGE_MEMBER_OPEN = "kindy.sidebar.member";

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
  /*
    한쪽에 두 개씩 상태를 둡니다. `...DockOpen`은 **붙여 둔 상태에서의 선택**이라
    새로고침 뒤에도 남고, 화면 크기가 바뀌어도 아무도 건드리지 않습니다. 그래서
    넓은 화면에서 접어 둔 사람이 창을 줄였다 늘려도 접힌 채로 돌아옵니다.
    `...DrawerOpen`은 좁은 화면에서만 쓰는 일회성 서랍이라 기본값이 닫힘이고,
    화면이 좁아졌다고 저절로 열리는 일이 없습니다.
  */
  const canDockFeature = useMediaQuery(MEDIA_DOCK_FEATURE);
  const canDockMember = useMediaQuery(MEDIA_DOCK_MEMBER);
  const [featureDockOpen, setFeatureDockOpen] = usePersistedFlag(STORAGE_FEATURE_OPEN, true);
  const [memberDockOpen, setMemberDockOpen] = usePersistedFlag(STORAGE_MEMBER_OPEN, true);
  const [featureDrawerOpen, setFeatureDrawerOpen] = useState(false);
  const [memberDrawerOpen, setMemberDrawerOpen] = useState(false);

  /*
    붙이기 <-> 서랍이 바뀌는 순간 열어 뒀던 서랍 상태를 털어 냅니다. 이게 없으면
    좁은 화면에서 서랍을 열어 둔 채 창을 넓혔다가 다시 줄일 때, 아무도 누르지 않은
    서랍이 저절로 펼쳐집니다. (렌더 도중 상태를 맞추는 React 권장 방식입니다.)
  */
  const dockMode = `${canDockFeature}:${canDockMember}`;
  const [lastDockMode, setLastDockMode] = useState(dockMode);
  if (lastDockMode !== dockMode) {
    setLastDockMode(dockMode);
    setFeatureDrawerOpen(false);
    setMemberDrawerOpen(false);
  }

  const featureDrawer = !canDockFeature && featureDrawerOpen;
  const memberDrawer = !canDockMember && memberDrawerOpen;
  const featureVisible = canDockFeature ? featureDockOpen : featureDrawer;
  const memberVisible = canDockMember ? memberDockOpen : memberDrawer;

  const toggleFeature = () =>
    canDockFeature ? setFeatureDockOpen((v) => !v) : setFeatureDrawerOpen((v) => !v);
  const closeFeature = () =>
    canDockFeature ? setFeatureDockOpen(false) : setFeatureDrawerOpen(false);
  const toggleMember = () =>
    canDockMember ? setMemberDockOpen((v) => !v) : setMemberDrawerOpen((v) => !v);
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
    setFeatureDrawerOpen(false);
    setMemberDrawerOpen(false);
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
    // 서랍으로 띄운 목록에서 골랐다면, 고른 화면이 가려지지 않게 서랍을 닫아 줍니다.
    setFeatureDrawerOpen(false);
  }

  const activeDef = features.find((f) => f.id === activeFeature) ?? features[0];

  // 붙여 둘 때와 서랍으로 띄울 때가 같은 엘리먼트를 쓰도록 여기서 한 번만 만듭니다.
  const featureSidebar = (
    <FeatureSidebar
      kindergartenName={data.kindergarten.name}
      contextLabel={contextLabel}
      features={features}
      activeFeature={activeFeature}
      onSelectFeature={handleSelectFeature}
      onOpenMyPage={() => setShowMyPage(true)}
      onCollapse={closeFeature}
    />
  );
  const memberSidebar = (
    <MemberSidebar
      data={data}
      onOpenStudent={setOpenStudentId}
      onSelectFeature={handleSelectFeature}
      onOpenTeacher={setOpenTeacherId}
      onSelectChild={selectChild}
    />
  );

  return (
    <div className="fixed inset-0 z-[100] flex bg-background text-foreground">
      <ServerRail
        workspaces={workspaces}
        activeWorkspaceId={activeWorkspaceId}
        onSwitchWorkspace={switchWorkspace}
        onGoMain={() => setActiveFeature(getDefaultFeature(data.role, Boolean(data.me?.aiPartner)))}
      />
      {canDockFeature && (
        <div
          className={cn(
            "shrink-0 overflow-hidden transition-[width] duration-300 ease-in-out",
            featureDockOpen ? "w-64" : "w-0",
          )}
        >
          <div className="w-64 h-full">{featureSidebar}</div>
        </div>
      )}

      {/* 세로로 세운 이 열기 탭은 폭에 여유가 있을 때만 씁니다. 좁은 화면에서는
          자리만 차지하고 읽히지도 않아, 헤더의 아이콘 버튼이 대신합니다. */}
      {canDockFeature && !featureDockOpen && (
        <div className="shrink-0 flex items-start pt-6 pl-0">
          <button
            onClick={toggleFeature}
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
        <div className="h-14 shrink-0 flex items-center justify-between gap-2 px-3 md:px-5 border-b" style={{ borderColor: "rgba(232,121,160,0.15)" }}>
          {!canDockFeature && (
            <button
              onClick={toggleFeature}
              aria-label="기능 목록 열기"
              aria-expanded={featureVisible}
              className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-colors hover:bg-black/[0.04]"
            >
              <PanelLeftOpen className="w-4 h-4" style={{ color: "#A06080" }} />
            </button>
          )}
          <div className="flex flex-1 items-center gap-2 min-w-0">
            {activeDef && <activeDef.icon className="w-4 h-4 shrink-0" style={{ color: "#E879A0" }} />}
            <span className="font-bold text-sm truncate" style={{ color: "#3B1355" }}>{activeDef?.label}</span>
          </div>
          {/*
            아이를 둘 이상 이 유치원에 보낸 학부모용 전환기입니다. 일기·리포트·알림장·채팅이
            모두 `data.myChild` 하나를 기준으로 도는데, 그동안 그 값이 첫째로 고정돼 있어
            둘째의 화면에는 들어갈 방법이 아예 없었습니다.
          */}
          {data.role === "parent" && (data.myChildren?.length ?? 0) > 1 && (
            <div className="flex items-center gap-1 shrink-0">
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
                    {/* 좁은 화면에서는 이름을 접어 두고 얼굴만 남깁니다 — 아이가 둘 이상인
                        학부모 계정에서 이 칩들이 헤더를 통째로 밀어내던 문제입니다. */}
                    <span className="hidden sm:block truncate max-w-[6rem]">{child.nickname}</span>
                  </button>
                );
              })}
            </div>
          )}
          <button
            onClick={toggleMember}
            aria-label={memberVisible ? "멤버 목록 닫기" : "멤버 목록 열기"}
            aria-expanded={memberVisible}
            className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-colors hover:bg-black/[0.04]"
          >
            {memberVisible ? <PanelRightClose className="w-4 h-4" style={{ color: "#A06080" }} /> : <PanelRightOpen className="w-4 h-4" style={{ color: "#A06080" }} />}
          </button>
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto">
          {/*
            배너와 화면 본문이 **같은 폭**을 나눠 쓰도록 감싸는 칸입니다. 예전에는
            배너만 끝에서 끝까지 늘어나고 본문은 각자 `max-w-*`로 왼쪽에 붙어 있어서,
            넓은 모니터에서는 오른쪽이 통째로 빈 채로 남았습니다. 폭은 여기서만 정하고
            개별 화면은 더 이상 자기 폭을 정하지 않습니다.

            `h-full`은 채팅 화면(`AiChatFeature`·`ParentChatFeature`)이 화면 높이를
            꽉 채우고 입력창을 아래에 붙여 두는 데 필요합니다. 빼면 입력창이 떠오릅니다.

            `@container`는 안쪽 그리드가 **창 너비가 아니라 이 칸의 너비**를 보게 합니다.
            사이드바를 둘 다 펼치면 창이 넓어도 이 칸은 좁은데, 예전 `sm:` 분기는 그걸
            모른 채 3열로 펼쳐져 카드가 짓눌렸습니다.
          */}
          <div className="@container mx-auto h-full w-full max-w-3xl px-4 py-5 md:px-6 md:py-6">
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
                {/* 임시로 닫아 둔 화면입니다(`TEMPORARILY_HIDDEN`). 사이드바에서 사라진 뒤에도
                    예전 상태가 남아 열리는 일이 없도록 여기서 한 번 더 막습니다. */}
                {activeFeature === "recommendations" && canOpenFeature(data, "recommendations") && (
                  <RecommendationsFeature />
                )}
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
      </div>

      {canDockMember && (
        <div
          className={cn(
            "shrink-0 overflow-hidden transition-[width] duration-300 ease-in-out",
            memberDockOpen ? "w-64" : "w-0",
          )}
        >
          <div className="w-64 h-full">{memberSidebar}</div>
        </div>
      )}

      {/*
        폭이 모자랄 때의 사이드바입니다. 흐름에서 빠진 오버레이라 가운데 칸을 밀지
        않고, 뒷배경·Esc·바깥 클릭·포커스 가둠은 이미 쓰고 있는 `Sheet`가 맡습니다.
      */}
      <Sheet open={featureDrawer} onOpenChange={setFeatureDrawerOpen}>
        <SheetContent side="left" className="w-64 p-0 gap-0 [&>button]:hidden">
          <SheetTitle className="sr-only">기능 목록</SheetTitle>
          {featureSidebar}
        </SheetContent>
      </Sheet>

      <Sheet open={memberDrawer} onOpenChange={setMemberDrawerOpen}>
        <SheetContent side="right" className="w-64 p-0 gap-0 [&>button]:hidden">
          <SheetTitle className="sr-only">멤버 목록</SheetTitle>
          <div className="flex h-full min-h-0 flex-col">
            {/* `MemberSidebar`에는 닫기 버튼이 없어서, 서랍으로 띄울 때만 머리말을 붙입니다. */}
            <div className="h-14 shrink-0 flex items-center justify-between px-3 border-b" style={{ borderColor: "rgba(232,121,160,0.15)" }}>
              <span className="text-sm font-bold" style={{ color: "#3B1355" }}>멤버</span>
              <button
                onClick={() => setMemberDrawerOpen(false)}
                aria-label="멤버 목록 닫기"
                className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors hover:bg-black/[0.04]"
              >
                <PanelRightClose className="w-4 h-4" style={{ color: "#A06080" }} />
              </button>
            </div>
            <div className="flex-1 min-h-0">{memberSidebar}</div>
          </div>
        </SheetContent>
      </Sheet>

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
