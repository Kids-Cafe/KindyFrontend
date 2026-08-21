import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";
import { useAuth } from "@/app/auth/AuthContext";
import {
  ageFromBirthDate,
  buildMemberSnapshot,
  emptyChildReports,
  emptyDashboardData,
  defaultHomeWidgets,
  roleFromRelationship,
} from "@/app/dashboard/retrieveData";
import type { MemberSnapshot } from "@/app/dashboard/retrieveData";
import type {
  AIPartnerId,
  ChatMessage,
  ChatSender,
  ChatThread,
  ChildRecord,
  DashboardData,
  DataCardType,
  FeatureId,
  KindergartenRecord,
  PermissionKey,
  PhotoThemeId,
  TeacherRecord,
} from "@/app/dashboard/types";
import type { ChatDTO, PlainUserDTO } from "@/app/lib/dto";
import {
  addPhotoOnServer,
  createClass,
  createNoticeOnServer,
  createRoleOnServer,
  createScheduleOnServer,
  createSupplyCommentOnServer,
  createSupplyOnServer,
  deleteClassOnServer,
  deleteNoticeOnServer,
  deletePhotoOnServer,
  deleteRoleOnServer,
  deleteScheduleOnServer,
  fetchClasses,
  fetchKindergarten,
  fetchMembers,
  fetchMemberships,
  fetchNotices,
  fetchPhotos,
  fetchRoles,
  fetchSchedule,
  fetchSupplies,
  removeTeacherOnServer,
  renameClassOnServer,
  setRolePermissionsOnServer,
  setMemberClassOnServer,
  setMemberNicknameOnServer,
  setTeacherRoleOnServer,
  updateNoticeOnServer,
  updatePhotoOnServer,
  updateScheduleOnServer,
} from "@/app/dashboard/backendSync";
import {
  createParentNoteCommentOnServer,
  createParentNoteOnServer,
  fetchChildProfiles,
  fetchChildReports,
  fetchDiaries,
  fetchFamilies,
  fetchGuardiansOf,
  fetchParentNotes,
  generateDiaries,
} from "@/app/dashboard/userSync";
import {
  ensureAiChat,
  ensureChat,
  fetchChatMessages,
  fetchChats,
  requestAiReply,
  sayToAssistant,
  selfChat,
  sendChatMessage,
} from "@/app/dashboard/chatSync";
import type { ChatParticipants } from "@/app/dashboard/chatSync";
import { loadAiPartner, saveAiPartner } from "@/app/dashboard/aiPartnerChoice";
import { newId } from "@/app/lib/id";

/** 지금 로그인된 사람이 오갈 수 있는 "서버"(유치원) 단위 워크스페이스입니다. */
export interface DashboardWorkspace {
  id: string;
  kindergarten: KindergartenRecord;
  /** 이 워크스페이스에서 이 사람이 어떤 역할로 보이는지 (원장 / 선생님 / 학부모 / 아이). */
  role: DashboardData["role"];
}

const AI_PARTNER_NAMES: Record<AIPartnerId, string> = { kio: "키오", kina: "키나" };

interface DashboardStoreValue {
  /**
   * 지금 보고 있는 워크스페이스의 데이터입니다.
   * Provider가 데이터를 받기 전에는 children을 아예 렌더하지 않으므로 항상 값이 있습니다.
   */
  data: DashboardData;
  workspaces: DashboardWorkspace[];
  activeWorkspaceId: string;
  switchWorkspace: (workspaceId: string) => void;

  /**
   * 아이가 둘 이상인 학부모가 기준으로 삼을 아이를 고릅니다.
   * `data.myChild`를 읽는 화면 전부(일기·리포트·채팅·준비물·일정)가 이 선택을 따릅니다.
   */
  selectChild: (childId: string) => void;

  /** 아이 계정이 파트너를 고를 때 사용합니다. */
  choosePartner: (childId: string, partner: AIPartnerId) => void;
  /**
   * AI 채팅에 메시지를 보내고 **답변 텍스트를 돌려줍니다.**
   * 그 답을 소리로 읽을지는 설정을 아는 화면이 정합니다(스토어는 소리를 모릅니다).
   * 답을 받지 못했으면 `null`입니다 — 아이가 한 말은 그대로 남아 있습니다.
   */
  sendAiMessage: (childId: string, text: string) => Promise<string | null>;
  /** 마지막으로 보낸 말에 대한 답변만 다시 요청합니다("다시 물어보기"). */
  retryAiReply: (childId: string) => Promise<string | null>;
  /** AI 채팅에서 답변을 받지 못한 아이 목록입니다. 화면이 재시도 버튼을 붙이는 데 씁니다. */
  aiReplyFailed: Record<string, boolean>;
  /** 부모/선생님 채팅 스레드에 텍스트 메시지를 보냅니다. 대화는 보호자별로 따로라 `parentId`가 필요합니다. */
  sendThreadMessage: (childId: string, parentId: string, text: string) => void;
  /** 채팅창에서 "정보 불러오기" 버튼을 눌렀을 때 데이터 카드를 삽입합니다. */
  insertDataCard: (childId: string, parentId: string, cardType: DataCardType) => void;
  aiTyping: Record<string, boolean>;

  /** 공지사항 CRUD (MANAGE_NOTICE 필요). */
  addNotice: (title: string, body: string, authorName: string, bannerEnabled?: boolean) => void;
  togglePinNotice: (noticeId: number) => void;
  toggleNoticeBanner: (noticeId: number) => void;
  deleteNotice: (noticeId: number) => void;

  /** 반 CRUD (MANAGE_CLASS 필요). */
  addClass: (name: string) => void;
  renameClass: (classId: number, name: string) => void;
  deleteClass: (classId: number) => void;

  /** 권한 역할 관리 (MANAGE_MEMBER 필요, 권한 편집은 원장만). */
  createRole: (name: string, color: string) => void;
  updateRolePermissions: (roleId: number, permissions: PermissionKey[]) => void;
  deleteRole: (roleId: number) => void;
  assignTeacherRole: (teacherId: string, roleId: number, assigned: boolean) => void;
  removeTeacherMembership: (teacherId: string) => void;

  /** 준비물 (MANAGE_SUPPLY 필요). 댓글은 반을 볼 수 있으면 누구나 답니다. */
  addSupplyItem: (classId: number, title: string, body: string, authorName: string, dueDate?: string) => void;
  addSupplyComment: (classId: number, supplyId: number, authorName: string, authorRole: DashboardData["role"], text: string) => void;

  /** 일정 (MANAGE_SCHEDULE 필요). */
  addScheduleEvent: (title: string, date: string, time: string | undefined, createdBy: string, classId?: number) => void;
  updateScheduleEvent: (eventId: number, title: string, date: string, time: string | undefined, classId?: number) => void;
  deleteScheduleEvent: (eventId: number) => void;

  /** 사진첩 (MANAGE_CLASS 필요, 본인이 올린 사진은 언제나 수정·삭제 가능). */
  addPhoto: (file: File, uploadedBy: string, classId: number, theme: PhotoThemeId, caption?: string) => void;
  updatePhotoTheme: (photoId: number, theme: PhotoThemeId) => void;
  deletePhoto: (photoId: number) => void;

  /**
   * AI 파트너와의 대화를 일기로 옮기고, 이번에 정리된 편수를 답합니다.
   *
   * 아직 일기가 없는 날뿐 아니라 **일기를 쓴 뒤로 대화가 이어진 날도 다시 씁니다** — 오늘의
   * 일기는 하루가 끝나기 전에 쓰이므로, 이게 없으면 아침까지의 이야기에서 멈춥니다.
   * 사람이 직접 쓰거나 고친 일기는 절대 덮지 않습니다(서버의 `SOURCE_AT`).
   *
   * 0은 오류가 아니라 "정리할 것이 없었다"입니다 — 대화가 없었거나, 있었어도 한두 마디뿐이라
   * 지어내지 않고는 일기가 되지 않는 날들입니다. 모델이 죽어 있으면 던집니다.
   */
  generateDiary: (childId: string) => Promise<number>;

  /** 선생님이 특정 아이에 대해 남기는, 그 아이의 부모만 볼 수 있는 글입니다. */
  addParentNote: (childId: string, authorName: string, text: string) => void;
  addParentNoteComment: (childId: string, noteId: number, authorName: string, authorRole: DashboardData["role"], text: string) => void;

  /** 유치원 안에서 통용되는 별칭을 바꿉니다. 계정이 아니라 이 유치원에서만 쓰는 이름입니다. */
  updateChildNickname: (childId: string, nickname: string) => Promise<void>;
  updateTeacherNickname: (teacherId: string, nickname: string) => Promise<void>;
  /** 로그인한 본인이 이 유치원에서 쓸 별칭을 바꿉니다. 서버 저장에 실패하면 던집니다. */
  setMyNickname: (nickname: string) => Promise<void>;
  /** 멤버(아이·교사)를 반에 배정하거나 해제합니다(MANAGE_CLASS 필요). */
  /** 서버 저장에 실패하면 던집니다 — 부르는 쪽이 "반을 바꾸지 못했어요"를 띄울 수 있게. */
  assignMemberClass: (userId: string, classId: number | undefined) => Promise<void>;
  sendMemberMessage: (teacherId: string, senderRole: ChatSender, senderName: string, text: string) => void;

  /** 메인페이지(홈)에 기능 위젯을 추가/제거합니다. */
  addHomeWidget: (id: FeatureId) => void;
  removeHomeWidget: (id: FeatureId) => void;

  /**
   * 지금 보고 있는 유치원의 데이터를 서버에서 다시 받습니다.
   * 이 스토어를 거치지 않는 변경(예: 가입 신청 수락으로 멤버가 늘어남) 뒤에 씁니다.
   */
  refreshWorkspace: () => void;
}

const DashboardStoreContext = createContext<DashboardStoreValue | null>(null);

/**
 * @param loading 워크스페이스를 받아오는 동안 보여줄 화면입니다.
 * @param empty 소속된 유치원이 하나도 없을 때 보여줄 화면입니다. children 대신 렌더되므로,
 *   여기에는 대시보드 바깥에서도 쓸 수 있는 화면(마이페이지·로그아웃 등)을 넣어야 합니다.
 * @param membershipNonce 값이 바뀌면 소속 유치원 목록을 다시 받아옵니다. `empty` 화면에서
 *   초대를 수락하거나 유치원에 가입한 뒤, 새로고침 없이 대시보드로 넘어가기 위한 것입니다.
 */
export function DashboardStoreProvider({
  children,
  loading,
  empty,
  membershipNonce = 0,
}: {
  children: ReactNode;
  loading?: ReactNode;
  empty?: ReactNode;
  membershipNonce?: number;
}) {
  const { user } = useAuth();

  const [dataByWorkspace, setDataByWorkspace] = useState<Record<string, DashboardData>>({});
  const [activeWorkspaceId, setActiveWorkspaceId] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [aiTyping, setAiTyping] = useState<Record<string, boolean>>({});
  const [aiReplyFailed, setAiReplyFailed] = useState<Record<string, boolean>>({});

  const data = dataByWorkspace[activeWorkspaceId] ?? null;

  const setData = useCallback(
    (updater: (prev: DashboardData) => DashboardData) => {
      setDataByWorkspace((prev) => {
        const target = prev[activeWorkspaceId];
        if (!target) return prev;
        return { ...prev, [activeWorkspaceId]: updater(target) };
      });
    },
    [activeWorkspaceId],
  );

  // ---- 워크스페이스 목록 ----
  // 소속된 유치원마다 워크스페이스를 하나씩 만듭니다. 역할은 유치원마다 다를 수 있으므로
  // 계정 전체의 역할이 아니라 그 유치원과의 관계(RelationshipDTO.type + 소유 여부)로 정합니다.
  useEffect(() => {
    if (!user) return;
    let cancelled = false;

    (async () => {
      try {
        const memberships = await fetchMemberships();
        if (cancelled) return;

        const entries = await Promise.all(
          memberships.map(async (membership) => {
            const kindergarten: KindergartenRecord = {
              id: membership.kindergartenId,
              name: membership.kindergartenName ?? "",
            };
            // 원장인지 알려면 소유자를 봐야 하는데, 소유자는 소속 멤버에게만 내려옵니다.
            let isOwner = false;
            try {
              const info = await fetchKindergarten(membership.kindergartenId);
              if (!kindergarten.name) kindergarten.name = info.name;
              isOwner = info.owner === user.id;
            } catch {
              /* 이름만으로도 워크스페이스는 띄울 수 있습니다. */
            }
            const role = roleFromRelationship(membership, isOwner, user);
            // 별칭은 유치원마다 다릅니다. 멤버 목록을 받기 전에도 제 이름으로 불리도록
            // 관계에 붙어 온 별칭을 그대로 넘깁니다. 단 학부모에게 내려온 행은 *아이의* 행이라
            // 거기 붙은 별칭은 아이의 것입니다 — 그걸 쓰면 학부모가 아이 별칭으로 불립니다.
            const myNickname = membership.userId === user.id ? membership.nickname : undefined;
            return [
              String(membership.kindergartenId),
              emptyDashboardData(user, kindergarten, role, myNickname),
            ] as const;
          }),
        );
        if (cancelled) return;

        setDataByWorkspace(Object.fromEntries(entries));
        setActiveWorkspaceId((prev) => (prev && entries.some(([id]) => id === prev) ? prev : entries[0]?.[0] ?? ""));
      } catch {
        // 비로그인이거나 백엔드가 없는 환경입니다. 빈 화면을 그대로 둡니다.
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [user?.id, membershipNonce]);

  // ---- 지금 보고 있는 유치원의 실데이터 ----
  // 워크스페이스를 바꿀 때마다 그 유치원의 반·공지·일정·역할·멤버·준비물·사진을 새로 받습니다.
  const reloadToken = useRef(0);

  const reloadWorkspace = useCallback(
    async (workspaceId: string) => {
      if (!user) return;
      const target = dataByWorkspace[workspaceId];
      if (!target) return;

      const token = ++reloadToken.current;
      const kindergarten = target.kindergarten;
      const kindergartenId = kindergarten.id;
      const prevScheduleById = new Map(target.scheduleEvents.map((e) => [e.id, e]));

      try {
        const [classes, notices, scheduleEvents, roles, members, families] = await Promise.all([
          fetchClasses(kindergartenId),
          fetchNotices(kindergartenId),
          fetchSchedule(kindergartenId, prevScheduleById),
          fetchRoles(kindergartenId).catch(() => target.roles),
          fetchMembers(kindergartenId),
          fetchFamilies().catch(() => []),
        ]);

        const baseSnapshot = buildMemberSnapshot(
          user,
          target.role,
          kindergarten,
          classes,
          members,
          families,
          target.selectedChildId,
        );

        // 나이·성별은 관계 응답에 없고 아이 계정 프로필에만 있습니다. user/info가 childId를
        // 받게 되면서 볼 수 있는 아이에 한해 채울 수 있게 됐습니다. 권한이 없는 아이는
        // 개별적으로 실패하고 나머지는 그대로 옵니다.
        const snapshot = await applyGuardians(target.role, await applyChildProfiles(target.role, baseSnapshot));

        const [suppliesEntries, photosByClass] = await Promise.all([
          Promise.all(classes.map(async (c) => [c.id, await fetchSupplies(c.id).catch(() => [])] as const)),
          Promise.all(classes.map((c) => fetchPhotos(c.id).catch(() => []))),
        ]);

        // 리포트와 알림장은 아이 단위라 볼 수 있는 아이만 골라 받습니다.
        const visibleChildren = childrenVisibleTo(target.role, snapshot);
        const [reportsByChild, parentNotesByChild, diaryByChild] = await Promise.all([
          loadReports(visibleChildren),
          loadParentNotes(visibleChildren),
          loadDiaries(target.role, visibleChildren),
        ]);

        const { threadsByChild, aiThreadsByChild, memberThreadsByTeacher } = await loadChatThreads(
          user.id,
          kindergartenId,
          snapshot,
          target.role,
        );

        if (token !== reloadToken.current) return; // 그 사이 다른 워크스페이스로 옮겼습니다.

        setDataByWorkspace((prev) => {
          const current = prev[workspaceId];
          if (!current) return prev;
          return {
            ...prev,
            [workspaceId]: {
              ...current,
              ...snapshot,
              notices,
              scheduleEvents,
              roles,
              suppliesByClass: Object.fromEntries(suppliesEntries),
              photos: photosByClass.flat(),
              reportsByChild,
              parentNotesByChild,
              diaryByChild,
              threadsByChild,
              aiThreadsByChild,
              memberThreadsByTeacher,
            },
          };
        });
      } catch (cause) {
        console.warn("[Kindy] 유치원 데이터를 불러오지 못했어요.", cause);
      }
    },
    [user, dataByWorkspace],
  );

  useEffect(() => {
    if (!activeWorkspaceId) return;
    void reloadWorkspace(activeWorkspaceId);
    // dataByWorkspace 전체를 의존성에 넣으면 갱신할 때마다 다시 부릅니다. 워크스페이스 전환에만 반응합니다.
  }, [activeWorkspaceId, user?.id]);

  /** 변이 후 목록을 다시 받는 대신, 바뀐 조각만 지금 워크스페이스에 반영합니다. */
  const refresh = useCallback(() => {
    if (activeWorkspaceId) void reloadWorkspace(activeWorkspaceId);
  }, [activeWorkspaceId, reloadWorkspace]);

  const workspaces = useMemo<DashboardWorkspace[]>(
    () => Object.entries(dataByWorkspace).map(([id, d]) => ({ id, kindergarten: d.kindergarten, role: d.role })),
    [dataByWorkspace],
  );

  const switchWorkspace = useCallback(
    (workspaceId: string) => {
      setActiveWorkspaceId((prev) => {
        if (workspaceId === prev) return prev;
        if (!(workspaceId in dataByWorkspace)) {
          console.warn(`[Kindy] 알 수 없는 워크스페이스입니다: ${workspaceId}`);
          return prev;
        }
        return workspaceId;
      });
    },
    [dataByWorkspace],
  );

  /**
   * 기준 아이를 바꿉니다. 리포트·알림장·일기는 이미 `myChildren` 전부를 받아 두므로
   * 서버를 다시 부를 필요 없이 가리키는 곳만 옮기면 됩니다. `myChild`를 함께 갱신해서
   * 그 필드를 읽는 화면들이 그대로 따라오게 합니다.
   */
  const selectChild = useCallback(
    (childId: string) => {
      setData((prev) => {
        const target = prev.myChildren?.find((c) => c.id === childId);
        if (!target) return prev;

        // 아이가 바뀌면 담임도 바뀝니다.
        const homeroomTeacher = prev.teachers.find((t) => t.classId === target.classId);
        return { ...prev, selectedChildId: childId, myChild: target, homeroomTeacher };
      });
    },
    [setData],
  );

  const kindergartenId = data?.kindergarten.id ?? 0;

  // ---- 공지 ----
  const addNotice = useCallback(
    async (title: string, body: string, _authorName: string, bannerEnabled = false) => {
      // 작성자는 서버가 세션에서 가져가므로 넘기지 않습니다.
      const notices = await createNoticeOnServer(kindergartenId, title, body, bannerEnabled);
      setData((prev) => ({ ...prev, notices }));
    },
    [kindergartenId, setData],
  );

  const togglePinNotice = useCallback(
    async (noticeId: number) => {
      const target = data?.notices.find((n) => n.id === noticeId);
      if (!target) return;
      const notices = await updateNoticeOnServer(kindergartenId, target, { pinned: !target.pinned });
      setData((prev) => ({ ...prev, notices }));
    },
    [data?.notices, kindergartenId, setData],
  );

  const toggleNoticeBanner = useCallback(
    async (noticeId: number) => {
      const target = data?.notices.find((n) => n.id === noticeId);
      if (!target) return;
      const notices = await updateNoticeOnServer(kindergartenId, target, { bannerEnabled: !target.bannerEnabled });
      setData((prev) => ({ ...prev, notices }));
    },
    [data?.notices, kindergartenId, setData],
  );

  const deleteNotice = useCallback(
    async (noticeId: number) => {
      const notices = await deleteNoticeOnServer(kindergartenId, noticeId);
      setData((prev) => ({ ...prev, notices }));
    },
    [kindergartenId, setData],
  );

  // ---- 반 ----
  const addClass = useCallback(
    async (name: string) => {
      const classes = await createClass(kindergartenId, name);
      setData((prev) => ({ ...prev, classes }));
    },
    [kindergartenId, setData],
  );

  const renameClass = useCallback(
    async (classId: number, name: string) => {
      const classes = await renameClassOnServer(kindergartenId, classId, name);
      setData((prev) => ({ ...prev, classes }));
    },
    [kindergartenId, setData],
  );

  const deleteClass = useCallback(
    async (classId: number) => {
      const classes = await deleteClassOnServer(kindergartenId, classId);
      setData((prev) => ({ ...prev, classes }));
    },
    [kindergartenId, setData],
  );

  // ---- 역할 ----
  const createRole = useCallback(
    async (name: string, color: string) => {
      const roles = await createRoleOnServer(kindergartenId, name, color);
      setData((prev) => ({ ...prev, roles }));
    },
    [kindergartenId, setData],
  );

  const updateRolePermissions = useCallback(
    async (roleId: number, permissions: PermissionKey[]) => {
      const current = data?.roles.find((r) => r.id === roleId)?.permissions ?? [];
      const roles = await setRolePermissionsOnServer(kindergartenId, roleId, current, permissions);
      setData((prev) => ({ ...prev, roles }));
    },
    [data?.roles, kindergartenId, setData],
  );

  const deleteRole = useCallback(
    async (roleId: number) => {
      const roles = await deleteRoleOnServer(kindergartenId, roleId);
      setData((prev) => ({
        ...prev,
        roles,
        teachers: prev.teachers.map((t) => ({ ...t, roleIds: t.roleIds.filter((id) => id !== roleId) })),
      }));
    },
    [kindergartenId, setData],
  );

  const assignTeacherRole = useCallback(
    async (teacherId: string, roleId: number, assigned: boolean) => {
      // 한 멤버가 역할을 여러 개 가질 수 있으므로 배정/해제 모두 서버에 반영됩니다.
      await setTeacherRoleOnServer(kindergartenId, teacherId, roleId, assigned);
      setData((prev) => ({
        ...prev,
        teachers: prev.teachers.map((t) =>
          t.id !== teacherId
            ? t
            : { ...t, roleIds: assigned ? [...new Set([...t.roleIds, roleId])] : t.roleIds.filter((id) => id !== roleId) },
        ),
      }));
    },
    [kindergartenId, setData],
  );

  const removeTeacherMembership = useCallback(
    async (teacherId: string) => {
      await removeTeacherOnServer(kindergartenId, teacherId);
      setData((prev) => ({ ...prev, teachers: prev.teachers.filter((t) => t.id !== teacherId) }));
    },
    [kindergartenId, setData],
  );

  // ---- 준비물 ----
  const addSupplyItem = useCallback(
    async (classId: number, title: string, body: string, _authorName: string, dueDate?: string) => {
      const list = await createSupplyOnServer(classId, title, body, dueDate);
      setData((prev) => ({ ...prev, suppliesByClass: { ...prev.suppliesByClass, [classId]: list } }));
    },
    [setData],
  );

  const addSupplyComment = useCallback(
    async (classId: number, supplyId: number, _authorName: string, _authorRole: DashboardData["role"], text: string) => {
      const trimmed = text.trim();
      if (!trimmed) return;
      const list = await createSupplyCommentOnServer(classId, supplyId, trimmed);
      setData((prev) => ({ ...prev, suppliesByClass: { ...prev.suppliesByClass, [classId]: list } }));
    },
    [setData],
  );

  // ---- 일정 ----
  const addScheduleEvent = useCallback(
    async (title: string, date: string, time: string | undefined, createdBy: string, classId?: number) => {
      const prevById = new Map((data?.scheduleEvents ?? []).map((e) => [e.id, e]));
      const list = await createScheduleOnServer(kindergartenId, title, date, time, classId, prevById);
      // 작성자는 ScheduleDTO에 없는 필드라, 방금 만든 일정에 한해 로컬로 붙여줍니다.
      const latest = list.length ? list.reduce((a, b) => (a.createdAt >= b.createdAt ? a : b)) : undefined;
      setData((prev) => ({
        ...prev,
        scheduleEvents: latest ? list.map((e) => (e.id === latest.id ? { ...e, createdBy } : e)) : list,
      }));
    },
    [data?.scheduleEvents, kindergartenId, setData],
  );

  const updateScheduleEvent = useCallback(
    async (eventId: number, title: string, date: string, time: string | undefined, classId?: number) => {
      const prevById = new Map((data?.scheduleEvents ?? []).map((e) => [e.id, e]));
      const scheduleEvents = await updateScheduleOnServer(kindergartenId, eventId, title, date, time, classId, prevById);
      setData((prev) => ({ ...prev, scheduleEvents }));
    },
    [data?.scheduleEvents, kindergartenId, setData],
  );

  const deleteScheduleEvent = useCallback(
    async (eventId: number) => {
      const prevById = new Map((data?.scheduleEvents ?? []).map((e) => [e.id, e]));
      const scheduleEvents = await deleteScheduleOnServer(kindergartenId, eventId, prevById);
      setData((prev) => ({ ...prev, scheduleEvents }));
    },
    [data?.scheduleEvents, kindergartenId, setData],
  );

  // ---- 사진첩 ----
  const replacePhotosOfClass = useCallback(
    (classId: number, forClass: Awaited<ReturnType<typeof fetchPhotos>>) => {
      setData((prev) => ({ ...prev, photos: [...forClass, ...prev.photos.filter((p) => p.classId !== classId)] }));
    },
    [setData],
  );

  const addPhoto = useCallback(
    async (file: File, _uploadedBy: string, classId: number, theme: PhotoThemeId, caption?: string) => {
      // 캡션·테마·작성자를 서버가 저장하므로 업로드 후 재조회하면 그대로 돌아옵니다.
      replacePhotosOfClass(classId, await addPhotoOnServer(classId, file, theme, caption));
    },
    [replacePhotosOfClass],
  );

  const updatePhotoTheme = useCallback(
    async (photoId: number, theme: PhotoThemeId) => {
      const target = data?.photos.find((p) => p.id === photoId);
      if (!target) return;
      replacePhotosOfClass(target.classId, await updatePhotoOnServer(target.classId, photoId, { theme }));
    },
    [data?.photos, replacePhotosOfClass],
  );

  const deletePhoto = useCallback(
    async (photoId: number) => {
      const target = data?.photos.find((p) => p.id === photoId);
      if (!target) return;
      replacePhotosOfClass(target.classId, await deletePhotoOnServer(target.classId, photoId));
    },
    [data?.photos, replacePhotosOfClass],
  );

  // ---- 부모 알림장 ----
  // ---- 일기 ----
  // 서버가 쓴 일기만 화면에 얹지 않고 목록을 통째로 다시 받습니다. 한 번에 최대 7일까지만
  // 쓰기 때문에, 이미 있던 일기까지 함께 있어야 화면이 그날들을 잃지 않습니다.
  const generateDiary = useCallback(
    async (childId: string) => {
      const written = await generateDiaries(childId);
      if (written.length === 0) return 0;

      const entries = await fetchDiaries(childId).catch(() => written);
      setData((prev) => ({ ...prev, diaryByChild: { ...prev.diaryByChild, [childId]: entries } }));

      return written.length;
    },
    [setData],
  );

  const addParentNote = useCallback(
    async (childId: string, _authorName: string, text: string) => {
      const trimmed = text.trim();
      if (!trimmed) return;
      const notes = await createParentNoteOnServer(childId, trimmed);
      setData((prev) => ({ ...prev, parentNotesByChild: { ...prev.parentNotesByChild, [childId]: notes } }));
    },
    [setData],
  );

  const addParentNoteComment = useCallback(
    async (childId: string, noteId: number, _authorName: string, _authorRole: DashboardData["role"], text: string) => {
      const trimmed = text.trim();
      if (!trimmed) return;
      const notes = await createParentNoteCommentOnServer(childId, noteId, trimmed);
      setData((prev) => ({ ...prev, parentNotesByChild: { ...prev.parentNotesByChild, [childId]: notes } }));
    },
    [setData],
  );

  // ---- 별칭 ----
  // 별칭은 계정이 아니라 이 유치원과의 관계에 붙습니다. 서버에 먼저 저장하고,
  // 성공했을 때만 화면의 모든 사본(멤버 목록·내 자리·내 별칭)을 함께 고칩니다.
  const applyNickname = useCallback(
    (userId: string, nickname: string) => {
      setData((prev) => ({
        ...prev,
        myNickname: userId === user?.id ? nickname || undefined : prev.myNickname,
        me: prev.me?.id === userId ? { ...prev.me, nickname: nickname || prev.me.name } : prev.me,
        myChild: prev.myChild?.id === userId ? { ...prev.myChild, nickname: nickname || prev.myChild.name } : prev.myChild,
        myChildren: prev.myChildren?.map((c) => (c.id === userId ? { ...c, nickname: nickname || c.name } : c)),
        classChildren: prev.classChildren.map((c) => (c.id === userId ? { ...c, nickname: nickname || c.name } : c)),
        myClassChildren: prev.myClassChildren?.map((c) => (c.id === userId ? { ...c, nickname: nickname || c.name } : c)),
        teacher: prev.teacher.id === userId ? { ...prev.teacher, nickname: nickname || undefined } : prev.teacher,
        teachers: prev.teachers.map((t) => (t.id === userId ? { ...t, nickname: nickname || undefined } : t)),
      }));
    },
    [setData, user?.id],
  );

  const updateChildNickname = useCallback(
    async (childId: string, nickname: string) => {
      const trimmed = nickname.trim();
      if (!trimmed) return;
      await setMemberNicknameOnServer(kindergartenId, childId, trimmed);
      applyNickname(childId, trimmed);
    },
    [kindergartenId, applyNickname],
  );

  const updateTeacherNickname = useCallback(
    async (teacherId: string, nickname: string) => {
      const trimmed = nickname.trim();
      await setMemberNicknameOnServer(kindergartenId, teacherId, trimmed);
      applyNickname(teacherId, trimmed);
    },
    [kindergartenId, applyNickname],
  );

  /** 로그인한 본인이 이 유치원에서 쓸 별칭을 바꿉니다(마이페이지 "별칭 변경"). */
  const setMyNickname = useCallback(
    async (nickname: string) => {
      if (!user) return;
      const trimmed = nickname.trim();
      await setMemberNicknameOnServer(kindergartenId, user.id, trimmed);
      applyNickname(user.id, trimmed);
    },
    [kindergartenId, applyNickname, user],
  );

  const assignMemberClass = useCallback(
    async (userId: string, classId: number | undefined) => {
      await setMemberClassOnServer(kindergartenId, userId, classId);
      setData((prev) => {
        const className = prev.classes.find((c) => c.id === classId)?.name ?? "반 미배정";
        // 아이는 classId가 없을 때 0(어떤 반과도 일치하지 않는 값), 교사는 undefined로 둡니다.
        const applyChild = <T extends ChildRecord>(c: T): T =>
          c.id === userId ? { ...c, classId: classId ?? 0, className } : c;
        const applyTeacher = (t: TeacherRecord): TeacherRecord =>
          t.id === userId ? { ...t, classId, className: classId === undefined ? "유치원 소속" : className } : t;

        return {
          ...prev,
          me: prev.me && applyChild(prev.me),
          myChild: prev.myChild && applyChild(prev.myChild),
          myChildren: prev.myChildren?.map(applyChild),
          classChildren: prev.classChildren.map(applyChild),
          myClassChildren: prev.myClassChildren?.map(applyChild),
          teacher: applyTeacher(prev.teacher),
          teachers: prev.teachers.map(applyTeacher),
        };
      });
    },
    [kindergartenId, setData],
  );

  // ---- 채팅 ----
  const choosePartner = useCallback(
    (childId: string, partner: AIPartnerId) => {
      // AI 파트너 선택은 백엔드에 저장할 칼럼이 없어 이 기기에 남깁니다. 저장해 두지
      // 않으면 새로고침마다 고르는 화면으로 되돌아갑니다.
      saveAiPartner(childId, partner);
      setData((prev) => {
        const updateChild = (c: ChildRecord) => (c.id === childId ? { ...c, aiPartner: partner } : c);
        return {
          ...prev,
          me: prev.me?.id === childId ? { ...prev.me, aiPartner: partner } : prev.me,
          classChildren: prev.classChildren.map(updateChild),
          aiThreadsByChild: {
            ...prev.aiThreadsByChild,
            [childId]: prev.aiThreadsByChild[childId] ?? { childId, messages: [] },
          },
        };
      });
    },
    [setData],
  );

  /**
   * 아이별로 AI 대화 요청을 **한 줄로 세웁니다.**
   *
   * 전송이 겹치면 대화가 갈라집니다. 첫 메시지가 두 번 겹치면 `chat/create`가 두 번 불리고
   * (서버가 find-or-create가 된 지금은 대화 자체는 하나지만), 두 요청의 재조회 결과가 서로
   * 다른 시점을 담아 나중에 끝난 쪽이 먼저 끝난 쪽의 말풍선을 지웁니다. 답변을 기다리는
   * 시간이 최대 1분이라 겹칠 틈은 충분히 넓습니다.
   */
  const aiQueue = useRef(new Map<string, Promise<unknown>>());

  const runQueued = useCallback(<T,>(childId: string, task: () => Promise<T>): Promise<T> => {
    const previous = aiQueue.current.get(childId) ?? Promise.resolve();
    const next = previous.catch(() => undefined).then(task);
    aiQueue.current.set(
      childId,
      next.catch(() => undefined),
    );
    return next;
  }, []);

  /**
   * 이 아이가 고른 파트너입니다. 이름표(말풍선)와 서버에 보낼 성격 지시문이 같은 값을
   * 쓰도록 한곳에서 정합니다.
   *
   * 화면 상태가 아직 없을 수 있어(새로고침 직후 등) 저장된 값을 마지막으로 한 번 더
   * 들여다보고, 그래도 없으면 기본 캐릭터로 답하게 둡니다.
   */
  const partnerFor = useCallback(
    (childId: string): AIPartnerId =>
      data?.classChildren.find((c) => c.id === childId)?.aiPartner ??
      data?.me?.aiPartner ??
      loadAiPartner(childId) ??
      "kio",
    [data],
  );

  /** 서버가 준 대화 기록으로 화면을 통째로 맞춥니다(임시 말풍선은 이때 사라집니다). */
  const reconcileAiThread = useCallback(
    async (childId: string, chatId: number) => {
      if (!data) return;
      const partner = partnerFor(childId);
      const messages = await fetchChatMessages(selfChat(chatId, childId, data.kindergarten.id), {
        nameById: { [childId]: data.me?.nickname ?? "나" },
        senderById: { [childId]: "child" },
        assistantName: AI_PARTNER_NAMES[partner],
      });
      setData((prev) => ({
        ...prev,
        aiThreadsByChild: { ...prev.aiThreadsByChild, [childId]: { childId, chatId, messages } },
      }));
    },
    [data, partnerFor, setData],
  );

  const sendAiMessage = useCallback(
    (childId: string, text: string): Promise<string | null> => {
      const trimmed = text.trim();
      if (!trimmed || !data) return Promise.resolve(null);
      const kindergartenId = data.kindergarten.id;
      const myName = data.me?.nickname ?? "나";

      return runQueued(childId, async () => {
        // 아이의 말풍선을 먼저 붙입니다. 답변까지는 서버 타임아웃 기준 최대 1분이라,
        // 다 끝난 뒤에 그리면 아이는 자기가 보낸 말조차 한참 못 봅니다.
        const pending: ChatMessage = {
          id: newId(),
          sender: "child",
          senderName: myName,
          kind: "text",
          text: trimmed,
          time: Date.now(),
        };
        setData((prev) => {
          const thread = prev.aiThreadsByChild[childId] ?? { childId, messages: [] };
          return {
            ...prev,
            aiThreadsByChild: {
              ...prev.aiThreadsByChild,
              [childId]: { ...thread, messages: [...thread.messages, pending] },
            },
          };
        });

        setAiTyping((prev) => ({ ...prev, [childId]: true }));
        setAiReplyFailed((prev) => ({ ...prev, [childId]: false }));

        // 실패했을 때 무엇을 되돌릴지 알려면 대화 id가 필요한데, 이번 전송에서 막 알아낸
        // 값은 아직 `data`에 없습니다(상태 갱신은 재조회 뒤입니다). 그래서 여기 들고 갑니다.
        let chatId = data.aiThreadsByChild[childId]?.chatId;
        try {
          const chat = await ensureAiChat(kindergartenId, childId);
          chatId = chat.id;
          const turn = await sayToAssistant(chat.id, trimmed, partnerFor(childId));
          await reconcileAiThread(childId, chat.id);
          return turn.reply?.content ?? null;
        } catch (cause) {
          console.warn("[Kindy] AI 메시지를 보내지 못했어요.", cause);
          // 아이가 한 말은 이미 서버에 있을 수도, 없을 수도 있습니다(`say`는 저장에 성공한
          // 뒤 답변에서 실패할 수 있습니다). 재조회가 실제 상태를 그대로 비춰 주므로
          // 저장된 말은 남고 임시 말풍선은 정리됩니다.
          if (chatId) await reconcileAiThread(childId, chatId).catch(() => undefined);
          setAiReplyFailed((prev) => ({ ...prev, [childId]: true }));
          return null;
        } finally {
          setAiTyping((prev) => ({ ...prev, [childId]: false }));
        }
      });
    },
    [data, setData, runQueued, reconcileAiThread, partnerFor],
  );

  const retryAiReply = useCallback(
    (childId: string): Promise<string | null> => {
      if (!data) return Promise.resolve(null);
      const chatId = data.aiThreadsByChild[childId]?.chatId;
      if (!chatId) return Promise.resolve(null);

      return runQueued(childId, async () => {
        setAiTyping((prev) => ({ ...prev, [childId]: true }));
        try {
          const reply = await requestAiReply(chatId, partnerFor(childId));
          await reconcileAiThread(childId, chatId);
          setAiReplyFailed((prev) => ({ ...prev, [childId]: false }));
          return reply?.content ?? null;
        } catch (cause) {
          console.warn("[Kindy] 답변을 다시 받지 못했어요.", cause);
          setAiReplyFailed((prev) => ({ ...prev, [childId]: true }));
          return null;
        } finally {
          setAiTyping((prev) => ({ ...prev, [childId]: false }));
        }
      });
    },
    [data, runQueued, reconcileAiThread, partnerFor],
  );

  const sendThreadMessage = useCallback(
    async (childId: string, parentId: string, text: string) => {
      const trimmed = text.trim();
      if (!trimmed || !data) return;
      const target = threadEndpoints(data, childId, parentId);
      if (!target) return;
      try {
        const chat = await ensureChat(data.kindergarten.id, target.parentId, target.teacherId);
        await sendChatMessage(chat.id, trimmed);
        refresh();
      } catch (cause) {
        console.warn("[Kindy] 메시지를 보내지 못했어요.", cause);
      }
    },
    [data, refresh],
  );

  const insertDataCard = useCallback(
    async (childId: string, parentId: string, cardType: DataCardType) => {
      if (!data) return;
      const target = threadEndpoints(data, childId, parentId);
      if (!target) return;
      try {
        const chat = await ensureChat(data.kindergarten.id, target.parentId, target.teacherId);
        await sendChatMessage(chat.id, cardType, { cardType });
        refresh();
      } catch (cause) {
        console.warn("[Kindy] 데이터 카드를 보내지 못했어요.", cause);
      }
    },
    [data, refresh],
  );

  const sendMemberMessage = useCallback(
    async (teacherId: string, _senderRole: ChatSender, _senderName: string, text: string) => {
      const trimmed = text.trim();
      if (!trimmed || !user || !data) return;
      try {
        const chat = await ensureChat(data.kindergarten.id, user.id, teacherId);
        await sendChatMessage(chat.id, trimmed);
        refresh();
      } catch (cause) {
        console.warn("[Kindy] 메시지를 보내지 못했어요.", cause);
      }
    },
    [data, refresh, user],
  );

  // ---- 홈 위젯 ----
  const addHomeWidget = useCallback(
    (id: FeatureId) => {
      setData((prev) => (prev.homeWidgets.includes(id) ? prev : { ...prev, homeWidgets: [...prev.homeWidgets, id] }));
    },
    [setData],
  );

  const removeHomeWidget = useCallback(
    (id: FeatureId) => {
      setData((prev) => ({ ...prev, homeWidgets: prev.homeWidgets.filter((w) => w !== id) }));
    },
    [setData],
  );

  // `data`가 null인 동안에는 아래 early return이 children을 막으므로, 이 값은 소비되지 않습니다.
  // 훅은 조건부로 부를 수 없어 memo 자체는 항상 계산합니다.
  const value = useMemo<DashboardStoreValue>(
    () => ({
      data: data as DashboardData,
      workspaces,
      activeWorkspaceId,
      switchWorkspace,
      selectChild,
      choosePartner,
      sendAiMessage,
      retryAiReply,
      sendThreadMessage,
      insertDataCard,
      aiTyping,
      aiReplyFailed,
      addNotice,
      togglePinNotice,
      toggleNoticeBanner,
      deleteNotice,
      addClass,
      renameClass,
      deleteClass,
      createRole,
      updateRolePermissions,
      deleteRole,
      assignTeacherRole,
      removeTeacherMembership,
      addSupplyItem,
      addSupplyComment,
      addScheduleEvent,
      updateScheduleEvent,
      deleteScheduleEvent,
      addPhoto,
      updatePhotoTheme,
      deletePhoto,
      generateDiary,
      addParentNote,
      addParentNoteComment,
      updateChildNickname,
      updateTeacherNickname,
      setMyNickname,
      assignMemberClass,
      sendMemberMessage,
      addHomeWidget,
      removeHomeWidget,
      refreshWorkspace: refresh,
    }),
    [
      data,
      workspaces,
      activeWorkspaceId,
      switchWorkspace,
      selectChild,
      choosePartner,
      sendAiMessage,
      retryAiReply,
      sendThreadMessage,
      insertDataCard,
      aiTyping,
      aiReplyFailed,
      addNotice,
      togglePinNotice,
      toggleNoticeBanner,
      deleteNotice,
      addClass,
      renameClass,
      deleteClass,
      createRole,
      updateRolePermissions,
      deleteRole,
      assignTeacherRole,
      removeTeacherMembership,
      addSupplyItem,
      addSupplyComment,
      addScheduleEvent,
      updateScheduleEvent,
      deleteScheduleEvent,
      addPhoto,
      updatePhotoTheme,
      deletePhoto,
      generateDiary,
      addParentNote,
      addParentNoteComment,
      updateChildNickname,
      updateTeacherNickname,
      setMyNickname,
      assignMemberClass,
      sendMemberMessage,
      addHomeWidget,
      removeHomeWidget,
      refresh,
    ],
  );

  // 데이터가 준비되기 전에 children을 렌더하면 모든 화면이 빈 값을 방어해야 합니다.
  // 여기서 한 번 막아 두면 아래 화면들은 `data`가 항상 있다고 가정할 수 있습니다.
  if (!data) return <>{isLoading ? loading : empty}</>;

  return <DashboardStoreContext.Provider value={value}>{children}</DashboardStoreContext.Provider>;
}

// ---- 로딩 헬퍼 ----

/**
 * 이 아이-보호자 대화의 두 당사자입니다.
 *
 * 이미 오간 대화가 있으면 그 스레드를 그대로 쓰고, 없으면 아이의 담임과 보호자로 새로
 * 정합니다 — 예전에는 스레드가 없으면 그냥 돌아가서 **첫 메시지를 보낼 방법이 없었습니다**
 * (대화는 `ensureChat`이 첫 전송 때 만듭니다).
 */
function threadEndpoints(
  data: DashboardData,
  childId: string,
  parentId: string,
): { parentId: string; teacherId: string } | undefined {
  const existing = (data.threadsByChild[childId] ?? []).find((t) => t.parentId === parentId);
  if (existing) return { parentId: existing.parentId, teacherId: existing.teacherId };

  if (!parentId) return undefined;
  const child = data.classChildren.find((c) => c.id === childId);
  const teacherId = child?.teacherId ?? data.teacher.id;
  if (!teacherId || teacherId === parentId) return undefined;
  return { parentId, teacherId };
}

/** 이 역할이 리포트·알림장을 볼 수 있는 아이 목록입니다. 서버도 같은 기준으로 한 번 더 검사합니다. */
/**
 * 볼 수 있는 아이들의 나이·성별을 프로필에서 채워 넣습니다.
 *
 * 관계(RelationshipDTO)에는 이 값들이 없어서 `ChildRecord.age`/`gender`가 오래 비어
 * 있었습니다. `user/info?userId=`가 열리면서 채울 수 있게 됐지만, 한 명당 요청 하나라
 * 아이 수만큼 나갑니다. 실패는 삼킵니다 — 선택 필드이고, 교사 시점에서는 볼 권한이 없는
 * 아이가 섞일 수 있어 한 명 때문에 워크스페이스 전체가 비면 안 됩니다.
 */
async function applyChildProfiles(
  role: DashboardData["role"],
  snapshot: MemberSnapshot,
): Promise<MemberSnapshot> {
  const targets = childrenVisibleTo(role, snapshot);
  if (targets.length === 0) return snapshot;

  const profiles = await fetchChildProfiles(targets.map((c) => c.id)).catch(
    (): Record<string, PlainUserDTO> => ({}),
  );
  if (Object.keys(profiles).length === 0) return snapshot;

  const enrich = <T extends ChildRecord>(child: T): T => {
    const profile = profiles[child.id];
    if (!profile) return child;
    return {
      ...child,
      age: ageFromBirthDate(profile.birthDate) ?? child.age,
      // 서버는 UNSPECIFIED도 돌려주는데 화면 타입은 남/여뿐이라 그건 비워 둡니다.
      gender: profile.gender === "MALE" ? "male" : profile.gender === "FEMALE" ? "female" : child.gender,
    };
  };

  return {
    ...snapshot,
    me: snapshot.me && enrich(snapshot.me),
    myChild: snapshot.myChild && enrich(snapshot.myChild),
    myChildren: snapshot.myChildren?.map(enrich),
    myClassChildren: snapshot.myClassChildren?.map(enrich),
    classChildren: snapshot.classChildren.map(enrich),
  };
}

/**
 * 아이별 보호자를 채워 넣습니다.
 *
 * `user/family/list`는 로그인한 본인의 가족 행만 돌려주므로, 교사·원장 화면에서는
 * 아이의 보호자 이름이 **언제나 비어 있었습니다**("undefined님과 채팅하기"). 아이를
 * 기준으로 조회하는 `user/family/parents`로 받아 오고, 한 아이에 보호자가 여럿이면
 * 여럿 다 채웁니다. 한 명당 요청 하나라 아이 수만큼 나가고, 개별 실패는 삼킵니다.
 */
async function applyGuardians(
  role: DashboardData["role"],
  snapshot: MemberSnapshot,
): Promise<MemberSnapshot> {
  const targets = childrenVisibleTo(role, snapshot);
  if (targets.length === 0) return snapshot;

  const guardians = await fetchGuardiansOf(targets.map((c) => c.id)).catch(
    (): Record<string, PlainUserDTO[]> => ({}),
  );

  const enrich = <T extends ChildRecord>(child: T): T => {
    const found = guardians[child.id];
    // 조회에 실패한 아이는 이미 알고 있는 값(=본인이 보호자인 경우)을 지우지 않습니다.
    if (!found) return child;
    return { ...child, parents: found.map((g) => ({ id: g.id, name: g.name, phone: g.phone })) };
  };

  return {
    ...snapshot,
    me: snapshot.me && enrich(snapshot.me),
    myChild: snapshot.myChild && enrich(snapshot.myChild),
    myChildren: snapshot.myChildren?.map(enrich),
    myClassChildren: snapshot.myClassChildren?.map(enrich),
    classChildren: snapshot.classChildren.map(enrich),
  };
}

/**
 * 이 역할이 리포트·알림장·보호자 정보를 볼 수 있는 아이 목록입니다. 서버도 같은 기준으로
 * 한 번 더 검사합니다.
 *
 * 선생님은 **담당 반이 아니라 유치원 전체**입니다. 서버의 `canViewChild`가 그렇게 판정하고
 * (그 아이가 다니는 유치원의 교사면 통과), 자기 반만 훑으면 아직 반이 정해지지 않은 아이가
 * 어느 목록에도 걸리지 않아 화면에서 통째로 사라집니다.
 */
function childrenVisibleTo(role: DashboardData["role"], snapshot: MemberSnapshot): ChildRecord[] {
  if (role === "child") return snapshot.me ? [snapshot.me] : [];
  // 아이가 둘 이상인 부모도 있습니다. myChild(첫째)만 보면 둘째의 리포트·알림장이 로드되지 않습니다.
  if (role === "parent") return snapshot.myChildren ?? [];
  return snapshot.classChildren;
}

async function loadReports(children: ChildRecord[]): Promise<DashboardData["reportsByChild"]> {
  const entries = await Promise.all(
    children.map(async (child) => {
      const partial = await fetchChildReports(child.id).catch(() => ({}));
      // 아직 저장되지 않은 카테고리는 빈 뼈대로 채워 화면이 "아직 없음"을 그릴 수 있게 합니다.
      return [child.id, { ...emptyChildReports(), ...partial }] as const;
    }),
  );
  return Object.fromEntries(entries);
}

async function loadParentNotes(children: ChildRecord[]): Promise<DashboardData["parentNotesByChild"]> {
  const entries = await Promise.all(
    children.map(async (child) => [child.id, await fetchParentNotes(child.id).catch(() => [])] as const),
  );
  return Object.fromEntries(entries);
}

/**
 * 볼 수 있는 아이 전부의 일기입니다. 리포트·알림장과 같은 방식으로, 아이 수만큼 나갑니다.
 *
 * 일기장은 아이 본인과 보호자에게만 있는 화면이라(`FEATURES_BY_ROLE`) 교사·원장은 건너뜁니다.
 * 서버는 교사에게도 열어 주지만, 아무도 열지 않을 화면 때문에 반 인원수만큼 요청을 낼 이유가
 * 없습니다.
 *
 * 일기를 **쓰는** 것은 여기가 아닙니다. AI가 대화를 일기로 옮기는 데는 모델 호출이 필요해
 * 워크스페이스를 여는 시간에 얹을 수 없고, 일기장 화면이 열릴 때 `generateDiary`가 합니다.
 */
async function loadDiaries(
  role: DashboardData["role"],
  children: ChildRecord[],
): Promise<DashboardData["diaryByChild"]> {
  if (role !== "child" && role !== "parent") return {};

  const entries = await Promise.all(
    children.map(async (child) => [child.id, await fetchDiaries(child.id).catch(() => [])] as const),
  );
  return Object.fromEntries(entries);
}

/**
 * 화면의 세 종류 대화창을 서버 채팅에서 만들어 냅니다.
 * `chat/list`는 로그인한 사람이 참여한 대화만 돌려주므로, 남의 대화가 섞일 일은 없습니다.
 */
async function loadChatThreads(
  userId: string,
  kindergartenId: number,
  snapshot: ReturnType<typeof buildMemberSnapshot>,
  role: DashboardData["role"],
): Promise<Pick<DashboardData, "threadsByChild" | "aiThreadsByChild" | "memberThreadsByTeacher">> {
  const empty = { threadsByChild: {}, aiThreadsByChild: {}, memberThreadsByTeacher: {} };

  const chats = await fetchChats(kindergartenId).catch(() => [] as ChatDTO[]);
  if (chats.length === 0) return empty;

  const nameById: Record<string, string> = {};
  const senderById: Record<string, ChatSender> = {};
  for (const t of snapshot.teachers) {
    nameById[t.id] = t.nickname || t.name;
    senderById[t.id] = t.id === snapshot.teacher.id && role === "director" ? "director" : "teacher";
  }
  for (const c of snapshot.classChildren) {
    nameById[c.id] = c.nickname;
    senderById[c.id] = "child";
    for (const parent of c.parents) {
      nameById[parent.id] = parent.name;
      senderById[parent.id] = "parent";
    }
  }
  const participants: ChatParticipants = { nameById, senderById };

  const between = (a: string, b: string) =>
    chats.find((c) => (c.host === a && c.client === b) || (c.host === b && c.client === a));

  const threadsByChild: DashboardData["threadsByChild"] = {};
  const aiThreadsByChild: DashboardData["aiThreadsByChild"] = {};
  const memberThreadsByTeacher: DashboardData["memberThreadsByTeacher"] = {};

  await Promise.all([
    // 학부모 ↔ 담임: 보호자 한 명당 하나입니다. 아이에게 보호자가 둘이면 대화도 둘이고,
    // 예전처럼 하나만 남기면 나머지 보호자의 대화는 아무 화면에도 뜨지 않습니다.
    ...snapshot.classChildren.map(async (child) => {
      const teacherId = child.teacherId ?? snapshot.teacher.id;
      const threads = await Promise.all(
        child.parents.map(async (parent) => {
          const chat = between(parent.id, teacherId);
          if (!chat) return null;
          return {
            id: chat.id,
            childId: child.id,
            childNickname: child.nickname,
            parentId: parent.id,
            parentName: parent.name,
            teacherId,
            teacherName: nameById[teacherId] ?? teacherId,
            messages: await fetchChatMessages(chat, participants).catch(() => []),
          };
        }),
      );
      const found = threads.filter((t): t is ChatThread => t !== null);
      if (found.length > 0) threadsByChild[child.id] = found;
    }),

    // 아이 ↔ AI 파트너: host와 client가 모두 아이 본인인 자기 대화입니다.
    ...(snapshot.me ? [snapshot.me] : []).map(async (child) => {
      const chat = chats.find((c) => c.host === child.id && c.client === child.id);
      if (!chat) return;
      aiThreadsByChild[child.id] = {
        childId: child.id,
        chatId: chat.id,
        messages: await fetchChatMessages(chat, {
          ...participants,
          assistantName: AI_PARTNER_NAMES[child.aiPartner ?? "kio"],
        }).catch(() => []),
      };
    }),

    // 원장 ↔ 교사: 멤버 프로필 패널의 1:1 대화입니다.
    ...snapshot.teachers
      .filter((t) => t.id !== userId)
      .map(async (teacher: TeacherRecord) => {
        const chat = between(userId, teacher.id);
        if (!chat) return;
        memberThreadsByTeacher[teacher.id] = {
          id: chat.id,
          teacherId: teacher.id,
          teacherName: teacher.nickname || teacher.name,
          directorName: nameById[userId] ?? "원장",
          messages: await fetchChatMessages(chat, participants).catch(() => []),
        };
      }),
  ]);

  return { threadsByChild, aiThreadsByChild, memberThreadsByTeacher };
}

export function useDashboardStore(): DashboardStoreValue {
  const ctx = useContext(DashboardStoreContext);
  if (!ctx) throw new Error("useDashboardStore는 <DashboardStoreProvider> 안에서만 사용할 수 있어요.");
  return ctx;
}

/**
 * `useDashboardStore`와 달리 Provider 밖에서 호출해도 던지지 않고 null을 돌려줍니다.
 * 마이페이지처럼 대시보드 안/밖 양쪽에서 열릴 수 있는 화면에서 씁니다.
 */
export function useDashboardStoreOptional(): DashboardStoreValue | null {
  return useContext(DashboardStoreContext);
}

export { defaultHomeWidgets };
