import { useMemo, useState } from "react";
import { ChevronRight, PanelRightClose, PanelRightOpen } from "lucide-react";
import { useAuth } from "@/app/auth/AuthContext";
import { MyPage } from "@/app/sections/MyPage";
import { DashboardStoreProvider, useDashboardStore } from "@/app/dashboard/DashboardStoreContext";
import { ServerRail } from "@/app/dashboard/ServerRail";
import { FeatureSidebar } from "@/app/dashboard/FeatureSidebar";
import { MemberSidebar } from "@/app/dashboard/MemberSidebar";
import { StudentInfoDialog } from "@/app/dashboard/StudentInfoDialog";
import { FEATURES_BY_ROLE, getDefaultFeature } from "@/app/dashboard/featureDefs";
import type { FeatureId } from "@/app/dashboard/types";
import { PartnerSelect } from "@/app/dashboard/features/PartnerSelect";
import { AiChatFeature } from "@/app/dashboard/features/AiChatFeature";
import { VoiceChatFeature } from "@/app/dashboard/features/VoiceChatFeature";
import { DiaryFeature } from "@/app/dashboard/features/DiaryFeature";
import { ReportsFeature } from "@/app/dashboard/features/ReportsFeature";
import { DashboardHomeFeature } from "@/app/dashboard/features/DashboardHomeFeature";
import { ParentChatFeature } from "@/app/dashboard/features/ParentChatFeature";
import { TeacherChatFeature } from "@/app/dashboard/features/TeacherChatFeature";
import { NoticeManageFeature } from "@/app/dashboard/features/NoticeManageFeature";
import { ClassManageFeature } from "@/app/dashboard/features/ClassManageFeature";
import { MemberManageFeature } from "@/app/dashboard/features/MemberManageFeature";
import { SuppliesFeature } from "@/app/dashboard/features/SuppliesFeature";
import { ScheduleFeature, UpcomingScheduleBanner } from "@/app/dashboard/features/ScheduleFeature";
import { PhotoAlbumFeature } from "@/app/dashboard/features/PhotoAlbumFeature";
import { ChildScheduleAnnouncer } from "@/app/dashboard/features/ChildScheduleAnnouncer";
import { RecommendationsFeature } from "@/app/dashboard/features/RecommendationsFeature";

function DashboardBody() {
  const { user } = useAuth();
  const { data } = useDashboardStore();
  const features = FEATURES_BY_ROLE[data.role];

  const [activeFeature, setActiveFeature] = useState<FeatureId>(() =>
    getDefaultFeature(data.role, Boolean(data.me?.aiPartner)),
  );
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [memberOpen, setMemberOpen] = useState(true);
  const [showMyPage, setShowMyPage] = useState(false);
  const [openStudentId, setOpenStudentId] = useState<string | null>(null);
  const [chatTargetChildId, setChatTargetChildId] = useState<string | null>(null);

  const contextLabel = useMemo(() => {
    if (data.role === "child") return data.me?.aiPartner ? `${data.me.nickname}의 공간` : "환영해요!";
    if (data.role === "parent") return `${data.myChild?.nickname ?? ""} 학부모`;
    if (data.role === "director") return `${data.kindergarten.name} 원장`;
    return `${data.teacher.className} 담임`;
  }, [data]);

  function openStudentChat(childId: string) {
    setOpenStudentId(null);
    setChatTargetChildId(childId);
    setActiveFeature("teacher-chat");
  }

  function handleSelectFeature(id: FeatureId) {
    setActiveFeature(id);
  }

  const activeDef = features.find((f) => f.id === activeFeature) ?? features[0];

  return (
    <div className="fixed inset-0 z-[100] flex bg-background text-foreground">
      <ServerRail
        kindergarten={data.kindergarten}
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
          <button
            onClick={() => setMemberOpen((v) => !v)}
            aria-label={memberOpen ? "멤버 목록 닫기" : "멤버 목록 열기"}
            className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-colors hover:bg-black/[0.04]"
          >
            {memberOpen ? <PanelRightClose className="w-4 h-4" style={{ color: "#A06080" }} /> : <PanelRightOpen className="w-4 h-4" style={{ color: "#A06080" }} />}
          </button>
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto p-6">
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
              {(activeFeature === "ai-text-chat" || activeFeature === "ai-voice-chat") && !data.me.aiPartner && (
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
              {activeFeature === "ai-voice-chat" && data.me.aiPartner && (
                <VoiceChatFeature partner={data.me.aiPartner} />
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
                <TeacherChatFeature targetChildId={chatTargetChildId} onSelectChild={setChatTargetChildId} />
              )}
            </>
          )}

          {data.role === "director" && (
            <>
              {activeFeature === "notices" && <NoticeManageFeature />}
              {activeFeature === "classes" && <ClassManageFeature />}
              {activeFeature === "members" && <MemberManageFeature />}
            </>
          )}

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
          <MemberSidebar data={data} onOpenStudent={setOpenStudentId} onSelectFeature={handleSelectFeature} />
        </div>
      </div>

      <StudentInfoDialog childId={openStudentId} onClose={() => setOpenStudentId(null)} onStartChat={openStudentChat} />
      {showMyPage && <MyPage onClose={() => setShowMyPage(false)} />}
    </div>
  );
}

/** 로그인 + 온보딩을 마친 사용자가 보게 되는 디스코드형 대시보드 진입점입니다. */
export function DashboardShell() {
  const { user } = useAuth();
  if (!user) return null;

  return (
    <DashboardStoreProvider>
      <DashboardBody />
    </DashboardStoreProvider>
  );
}
