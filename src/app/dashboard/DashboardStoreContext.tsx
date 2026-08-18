import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";
import { useAuth } from "@/app/auth/AuthContext";
import {
  buildMemberSnapshot,
  emptyChildReports,
  emptyDashboardData,
  defaultHomeWidgets,
  roleFromRelationship,
} from "@/app/dashboard/retrieveData";
import type {
  AIPartnerId,
  ChatSender,
  ChildRecord,
  DashboardData,
  DataCardType,
  FeatureId,
  KindergartenRecord,
  PermissionKey,
  PhotoThemeId,
  TeacherRecord,
} from "@/app/dashboard/types";
import type { ChatDTO } from "@/app/lib/dto";
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
  setTeacherNicknameOnServer,
  setTeacherRoleOnServer,
  updateNoticeOnServer,
  updatePhotoOnServer,
  updateScheduleOnServer,
} from "@/app/dashboard/backendSync";
import {
  createParentNoteCommentOnServer,
  createParentNoteOnServer,
  fetchChildReports,
  fetchFamilies,
  fetchMyDiaries,
  fetchParentNotes,
} from "@/app/dashboard/userSync";
import { ensureAiChat, ensureChat, fetchChatMessages, fetchChats, sendChatMessage } from "@/app/dashboard/chatSync";
import type { ChatParticipants } from "@/app/dashboard/chatSync";

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

  /** 아이 계정이 파트너를 고를 때 사용합니다. */
  choosePartner: (childId: string, partner: AIPartnerId) => void;
  /** AI 채팅에 메시지를 보냅니다. 서버가 답을 채우면 재조회로 반영됩니다. */
  sendAiMessage: (childId: string, text: string) => void;
  /** 부모/선생님 채팅 스레드에 텍스트 메시지를 보냅니다. */
  sendThreadMessage: (childId: string, sender: ChatSender, senderName: string, text: string) => void;
  /** 채팅창에서 "정보 불러오기" 버튼을 눌렀을 때 데이터 카드를 삽입합니다. */
  insertDataCard: (childId: string, sender: ChatSender, senderName: string, cardType: DataCardType) => void;
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

  /** 선생님이 특정 아이에 대해 남기는, 그 아이의 부모만 볼 수 있는 글입니다. */
  addParentNote: (childId: string, authorName: string, text: string) => void;
  addParentNoteComment: (childId: string, noteId: number, authorName: string, authorRole: DashboardData["role"], text: string) => void;

  /** 유치원 안에서 통용되는 별칭을 바꿉니다. */
  updateChildNickname: (childId: string, nickname: string) => void;
  updateTeacherNickname: (teacherId: string, nickname: string) => void;
  sendMemberMessage: (teacherId: string, senderRole: ChatSender, senderName: string, text: string) => void;

  /** 메인페이지(홈)에 기능 위젯을 추가/제거합니다. */
  addHomeWidget: (id: FeatureId) => void;
  removeHomeWidget: (id: FeatureId) => void;
}

const DashboardStoreContext = createContext<DashboardStoreValue | null>(null);

export function DashboardStoreProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();

  const [dataByWorkspace, setDataByWorkspace] = useState<Record<string, DashboardData>>({});
  const [activeWorkspaceId, setActiveWorkspaceId] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [aiTyping, setAiTyping] = useState<Record<string, boolean>>({});

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
            return [String(membership.kindergartenId), emptyDashboardData(user, kindergarten, role)] as const;
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
  }, [user?.id]);

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

        const snapshot = buildMemberSnapshot(user, target.role, kindergarten, classes, members, families);

        const [suppliesEntries, photosByClass] = await Promise.all([
          Promise.all(classes.map(async (c) => [c.id, await fetchSupplies(c.id).catch(() => [])] as const)),
          Promise.all(classes.map((c) => fetchPhotos(c.id).catch(() => []))),
        ]);

        // 리포트와 알림장은 아이 단위라 볼 수 있는 아이만 골라 받습니다.
        const visibleChildren = childrenVisibleTo(target.role, snapshot);
        const [reportsByChild, parentNotesByChild, diaryByChild] = await Promise.all([
          loadReports(visibleChildren),
          loadParentNotes(visibleChildren),
          loadOwnDiary(target.role, user.id),
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
  const updateChildNickname = useCallback(
    async (childId: string, nickname: string) => {
      const trimmed = nickname.trim();
      if (!trimmed) return;
      await setTeacherNicknameOnServer(kindergartenId, childId, trimmed);
      setData((prev) => ({
        ...prev,
        me: prev.me?.id === childId ? { ...prev.me, nickname: trimmed } : prev.me,
        myChild: prev.myChild?.id === childId ? { ...prev.myChild, nickname: trimmed } : prev.myChild,
        classChildren: prev.classChildren.map((c) => (c.id === childId ? { ...c, nickname: trimmed } : c)),
        myClassChildren: prev.myClassChildren?.map((c) => (c.id === childId ? { ...c, nickname: trimmed } : c)),
      }));
    },
    [kindergartenId, setData],
  );

  const updateTeacherNickname = useCallback(
    async (teacherId: string, nickname: string) => {
      const trimmed = nickname.trim();
      await setTeacherNicknameOnServer(kindergartenId, teacherId, trimmed);
      setData((prev) => ({
        ...prev,
        teacher: prev.teacher.id === teacherId ? { ...prev.teacher, nickname: trimmed || undefined } : prev.teacher,
        teachers: prev.teachers.map((t) => (t.id === teacherId ? { ...t, nickname: trimmed || undefined } : t)),
      }));
    },
    [kindergartenId, setData],
  );

  // ---- 채팅 ----
  const choosePartner = useCallback(
    (childId: string, partner: AIPartnerId) => {
      // AI 파트너 선택은 백엔드에 저장할 칼럼이 없어 화면 상태로만 남습니다.
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

  const sendAiMessage = useCallback(
    async (childId: string, text: string) => {
      const trimmed = text.trim();
      if (!trimmed || !data) return;
      const partner = data.classChildren.find((c) => c.id === childId)?.aiPartner ?? data.me?.aiPartner ?? "kio";

      setAiTyping((prev) => ({ ...prev, [childId]: true }));
      try {
        const chat = await ensureAiChat(data.kindergarten.id, childId);
        await sendChatMessage(chat.id, trimmed, { role: "user" });
        const messages = await fetchChatMessages(chat, {
          nameById: { [childId]: data.me?.nickname ?? "나" },
          senderById: { [childId]: "child" },
          assistantName: AI_PARTNER_NAMES[partner],
        });
        setData((prev) => ({ ...prev, aiThreadsByChild: { ...prev.aiThreadsByChild, [childId]: { childId, messages } } }));
      } catch (cause) {
        console.warn("[Kindy] AI 메시지를 보내지 못했어요.", cause);
      } finally {
        setAiTyping((prev) => ({ ...prev, [childId]: false }));
      }
    },
    [data, setData],
  );

  const sendThreadMessage = useCallback(
    async (childId: string, _sender: ChatSender, _senderName: string, text: string) => {
      const trimmed = text.trim();
      if (!trimmed || !data) return;
      const thread = data.threadsByChild[childId];
      if (!thread) return;
      try {
        const chat = await ensureChat(data.kindergarten.id, thread.parentId, thread.teacherId);
        await sendChatMessage(chat.id, trimmed);
        refresh();
      } catch (cause) {
        console.warn("[Kindy] 메시지를 보내지 못했어요.", cause);
      }
    },
    [data, refresh],
  );

  const insertDataCard = useCallback(
    async (childId: string, _sender: ChatSender, _senderName: string, cardType: DataCardType) => {
      if (!data) return;
      const thread = data.threadsByChild[childId];
      if (!thread) return;
      try {
        const chat = await ensureChat(data.kindergarten.id, thread.parentId, thread.teacherId);
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
      choosePartner,
      sendAiMessage,
      sendThreadMessage,
      insertDataCard,
      aiTyping,
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
      addParentNote,
      addParentNoteComment,
      updateChildNickname,
      updateTeacherNickname,
      sendMemberMessage,
      addHomeWidget,
      removeHomeWidget,
    }),
    [
      data,
      workspaces,
      activeWorkspaceId,
      switchWorkspace,
      choosePartner,
      sendAiMessage,
      sendThreadMessage,
      insertDataCard,
      aiTyping,
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
      addParentNote,
      addParentNoteComment,
      updateChildNickname,
      updateTeacherNickname,
      sendMemberMessage,
      addHomeWidget,
      removeHomeWidget,
    ],
  );

  // 데이터가 준비되기 전에 children을 렌더하면 모든 화면이 빈 값을 방어해야 합니다.
  // 여기서 한 번 막아 두면 아래 화면들은 `data`가 항상 있다고 가정할 수 있습니다.
  if (!data) return <DashboardPlaceholder isLoading={isLoading} />;

  return <DashboardStoreContext.Provider value={value}>{children}</DashboardStoreContext.Provider>;
}

/** 워크스페이스를 받아오는 중이거나, 소속된 유치원이 하나도 없을 때 보여줍니다. */
function DashboardPlaceholder({ isLoading }: { isLoading: boolean }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 h-full min-h-[60vh] px-6 text-center">
      <p className="text-sm font-bold" style={{ color: "#3B1355" }}>
        {isLoading ? "유치원 정보를 불러오는 중이에요…" : "아직 소속된 유치원이 없어요"}
      </p>
      {!isLoading && (
        <p className="text-xs" style={{ color: "#A06080" }}>
          받은 초대를 수락하거나, 마이페이지에서 유치원을 찾아 가입해주세요.
        </p>
      )}
    </div>
  );
}

// ---- 로딩 헬퍼 ----

/** 이 역할이 리포트·알림장을 볼 수 있는 아이 목록입니다. 서버도 같은 기준으로 한 번 더 검사합니다. */
function childrenVisibleTo(role: DashboardData["role"], snapshot: ReturnType<typeof buildMemberSnapshot>): ChildRecord[] {
  if (role === "child") return snapshot.me ? [snapshot.me] : [];
  if (role === "parent") return snapshot.myChild ? [snapshot.myChild] : [];
  if (role === "teacher") return snapshot.myClassChildren ?? [];
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
 * 일기는 본인 것만 목록으로 받을 수 있습니다(`diary/list`가 세션 사용자 고정).
 * 부모·교사 화면에서 아이의 일기를 통째로 보여주려면 백엔드에 목록 엔드포인트가 필요합니다.
 */
async function loadOwnDiary(role: DashboardData["role"], userId: string): Promise<DashboardData["diaryByChild"]> {
  if (role !== "child") return {};
  const entries = await fetchMyDiaries(userId).catch(() => []);
  return { [userId]: entries };
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
    if (c.parentId) {
      nameById[c.parentId] = c.parentName ?? "학부모";
      senderById[c.parentId] = "parent";
    }
  }
  const participants: ChatParticipants = { nameById, senderById };

  const between = (a: string, b: string) =>
    chats.find((c) => (c.host === a && c.client === b) || (c.host === b && c.client === a));

  const threadsByChild: DashboardData["threadsByChild"] = {};
  const aiThreadsByChild: DashboardData["aiThreadsByChild"] = {};
  const memberThreadsByTeacher: DashboardData["memberThreadsByTeacher"] = {};

  await Promise.all([
    // 학부모 ↔ 담임: 아이 한 명당 하나입니다.
    ...snapshot.classChildren.map(async (child) => {
      const teacherId = child.teacherId ?? snapshot.teacher.id;
      if (!child.parentId) return;
      const chat = between(child.parentId, teacherId);
      if (!chat) return;
      threadsByChild[child.id] = {
        id: chat.id,
        childId: child.id,
        childNickname: child.nickname,
        parentId: child.parentId,
        parentName: child.parentName ?? "학부모",
        teacherId,
        teacherName: nameById[teacherId] ?? teacherId,
        messages: await fetchChatMessages(chat, participants).catch(() => []),
      };
    }),

    // 아이 ↔ AI 파트너: host와 client가 모두 아이 본인인 자기 대화입니다.
    ...(snapshot.me ? [snapshot.me] : []).map(async (child) => {
      const chat = chats.find((c) => c.host === child.id && c.client === child.id);
      if (!chat) return;
      aiThreadsByChild[child.id] = {
        childId: child.id,
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
