import {createContext, useCallback, useContext, useEffect, useMemo, useState} from "react";
import type { ReactNode } from "react";
import { useAuth } from "@/app/auth/AuthContext";
import { isAllRolesDemoUser } from "@/app/auth/mockSignup";
import { buildDashboardData, buildAltDashboardData } from "@/app/dashboard/retrieveData.ts";
import { revokeAcceptedInvite, updateAcceptedInviteRoles } from "@/app/dashboard/mock/membershipInvites";
import type {
  AIPartnerId,
  ChatSender,
  DashboardData,
  DataCardType,
  FeatureId,
  KindergartenRecord,
  PermissionKey,
  PhotoThemeId,
} from "@/app/dashboard/types";
import { newId } from "@/app/lib/id";

/** 지금 로그인된 사람이 오갈 수 있는 "서버"(유치원) 단위 워크스페이스입니다. */
export interface DashboardWorkspace {
  id: string;
  kindergarten: KindergartenRecord;
  /** 이 워크스페이스에서 이 사람이 어떤 역할로 보이는지 (원장 자신의 유치원 vs 타 유치원의 학부모 등). */
  role: DashboardData["role"];
  /** 서버 레일 아이콘에 쓸 이모지입니다. 없으면 유치원 이름 첫 글자를 씁니다. */
  icon?: string;
  /** 툴팁에 유치원 이름과 함께 붙일 설명입니다(예: "원장으로 보기"). */
  label?: string;
}

/**
 * 통합 데모 계정(`demo`) 전용 워크스페이스 정의입니다. 같은 유치원을 네 가지 역할로
 * 나란히 띄워, 화면 검수 때 계정을 갈아타지 않고 비교할 수 있게 합니다.
 * 워크스페이스마다 데이터가 독립적이므로 한쪽에서 쓴 글이 다른 쪽에 보이지는 않습니다.
 */
const DEMO_ROLE_WORKSPACES: { id: string; role: DashboardData["role"]; icon: string; label: string }[] = [
  { id: "demo-director", role: "director", icon: "🏫", label: "원장으로 보기" },
  { id: "demo-teacher", role: "teacher", icon: "🎒", label: "선생님으로 보기" },
  { id: "demo-parent", role: "parent", icon: "👨‍👩‍👧", label: "학부모로 보기" },
  { id: "demo-child", role: "child", icon: "🧒", label: "아이로 보기" },
];

const AI_REPLIES: Record<AIPartnerId, string[]> = {
  kio: [
    "오~ 진짜 신난다! 그다음엔 어떻게 됐어?",
    "우와 멋진데?! 잘했어, 정말 씩씩했구나!",
    "힘든 일이 있었구나. 근데 네가 잘 이겨낸 것 같아서 대견해!",
    "다음에 또 도전해보자! 내가 항상 응원할게!",
    "오늘 하루도 정말 알차게 보냈네! 최고야!",
  ],
  kina: [
    "그랬구나~ 그때 기분이 어땠어?",
    "속상했겠다... 그래도 잘 이야기해줘서 고마워.",
    "정말 잘했어! 네가 그렇게 노력한 거 다 알아.",
    "오늘도 소중한 하루였네. 우리 내일도 이야기하자!",
    "네 마음을 들려줘서 고마워. 키나가 항상 네 편이야.",
  ],
};

function pickReply(partner: AIPartnerId, userText: string): string {
  const pool = AI_REPLIES[partner];
  const lower = userText.toLowerCase();
  if (/슬프|속상|힘들|울었/.test(lower)) return pool[2];
  if (/기쁘|신나|재밌|좋았/.test(lower)) return pool[0];
  return pool[Math.floor(Math.random() * pool.length)];
}

interface DashboardStoreValue {
  data: DashboardData;
  /** 좌측 서버 레일에서 오갈 수 있는 워크스페이스 목록입니다(원장은 자기 유치원 + 데모용 타 유치원). */
  workspaces: DashboardWorkspace[];
  activeWorkspaceId: string;
  switchWorkspace: (workspaceId: string) => void;
  /** 아이 계정이 파트너를 고를 때 사용합니다. */
  choosePartner: (childId: string, partner: AIPartnerId) => void;
  /** AI 채팅에 메시지를 보내고, 잠시 후 AI 응답을 자동으로 추가합니다. */
  sendAiMessage: (childId: string, text: string) => void;
  /** 부모/선생님 채팅 스레드에 텍스트 메시지를 보냅니다. */
  sendThreadMessage: (childId: string, sender: ChatSender, senderName: string, text: string) => void;
  /** 채팅창에서 "정보 불러오기" 버튼을 눌렀을 때 데이터 카드를 삽입합니다. */
  insertDataCard: (childId: string, sender: ChatSender, senderName: string, cardType: DataCardType) => void;
  /** AI와 채팅 중인 아이가 "말풍선 타이핑 중" 여부를 확인할 때 씁니다. */
  aiTyping: Record<string, boolean>;

  /** 원장 전용: 공지사항 CRUD. */
  addNotice: (title: string, body: string, authorName: string, bannerEnabled?: boolean) => void;
  togglePinNotice: (noticeId: number) => void;
  toggleNoticeBanner: (noticeId: number) => void;
  deleteNotice: (noticeId: number) => void;

  /** 원장 전용: 반 CRUD. */
  addClass: (name: string) => void;
  renameClass: (classId: number, name: string) => void;
  deleteClass: (classId: number) => void;

  /** 원장 전용: 권한 역할 관리. */
  createRole: (name: string, color: string) => void;
  updateRolePermissions: (roleId: number, permissions: PermissionKey[]) => void;
  deleteRole: (roleId: number) => void;
  assignTeacherRole: (teacherId: string, roleId: number, assigned: boolean) => void;
  /** 원장 전용: 초대를 수락한 교사를 유치원 멤버에서 내보냅니다. */
  removeTeacherMembership: (teacherId: string) => void;

  /** 선생님/원장: 준비물 작성. 학부모: 댓글. */
  addSupplyItem: (classId: number, title: string, body: string, authorName: string, dueDate?: string) => void;
  addSupplyComment: (classId: number, supplyId: number, authorName: string, authorRole: DashboardData["role"], text: string) => void;

  /** 선생님/원장: 일정 등록. */
  addScheduleEvent: (title: string, date: string, time: string | undefined, createdBy: string, classId?: number) => void;
  updateScheduleEvent: (eventId: number, title: string, date: string, time: string | undefined, classId?: number) => void;
  deleteScheduleEvent: (eventId: number) => void;

  /** 사진첩: 반 단위로 나뉩니다. 등록·수정·삭제 권한은 화면(PhotoAlbumFeature)에서 판단합니다. */
  addPhoto: (url: string, uploadedBy: string, classId: number, theme: PhotoThemeId, caption?: string) => void;
  /** 사진 카드를 감싸는 장식 테마를 바꿉니다. */
  updatePhotoTheme: (photoId: number, theme: PhotoThemeId) => void;
  deletePhoto: (photoId: number) => void;

  /** 선생님 전용: 특정 아이의 "부모 전용" 게시글 작성. */
  addParentNote: (childId: string, authorName: string, text: string) => void;
  /** 학부모/원장: 선생님이 남긴 글에 답글을 답니다. */
  addParentNoteComment: (childId: string, noteId: number, authorName: string, authorRole: DashboardData["role"], text: string) => void;

  /** 마이페이지 "아이 정보 변경"에서 씁니다. */
  updateChildNickname: (childId: string, nickname: string) => void;

  /** 원장 전용: 멤버 프로필 패널에서 교사 별칭을 바꿉니다. */
  updateTeacherNickname: (teacherId: string, nickname: string) => void;
  /** 멤버 프로필 패널의 원장 ↔ 교사 1:1 대화에 메시지를 보냅니다. */
  sendMemberMessage: (teacherId: string, senderRole: ChatSender, senderName: string, text: string) => void;

  /** 메인페이지(홈)에 기능 위젯을 추가/제거합니다. */
  addHomeWidget: (id: FeatureId) => void;
  removeHomeWidget: (id: FeatureId) => void;
}

const DashboardStoreContext = createContext<DashboardStoreValue | null>(null);

export function DashboardStoreProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();

  const isAllRolesDemo = isAllRolesDemoUser(user!);

  const [dataByWorkspace, setDataByWorkspace] = useState<Record<string, DashboardData>>(() => {
    // 통합 데모 계정은 같은 유치원을 역할별로 하나씩, 총 네 개의 워크스페이스로 봅니다.
    if (isAllRolesDemo) {
      return Object.fromEntries(DEMO_ROLE_WORKSPACES.map((w) => [w.id, buildDashboardData(user!, w.role)]));
    }

    const home = buildDashboardData(user!);
    // 원장은 자기 유치원을 운영하는 동시에, 다른 유치원에는 학부모로 등록되어 있을 수 있습니다.
    // 데모 목적으로 이 두 번째 워크스페이스는 원장 계정에서만 제공합니다.
    const initial: Record<string, DashboardData> = { home };
    if (home.role === "director") initial.alt = buildAltDashboardData(user!);
    return initial;
  });

  useEffect(() => {
    fetch("/api/kindergarten/memberships", {
      method: "GET",
      credentials: "include"
    }).then(r => r.json()).then(r => {
      if (r.status != "success") return;
      const t = r.data.map((d: any) => [newId(), buildDashboardData({...user!, kindergarten: {id: d.kindergartenId, name: d.kindergartenName}}, "director")])
      if (!t.length) return;
      setDataByWorkspace(Object.fromEntries(t));
      setActiveWorkspaceId(t[0][0]);
    })
  }, [])

  const [activeWorkspaceId, setActiveWorkspaceId] = useState(() =>
    isAllRolesDemo ? DEMO_ROLE_WORKSPACES[0].id : "home",
  );

  const data = dataByWorkspace[activeWorkspaceId];

  // 지금 보고 있는 워크스페이스만 갱신합니다. 렌더 중에 값을 써 넣는 ref 대신
  // 의존성으로 받아야, 워크스페이스를 바꾼 직후에도 항상 맞는 대상에 반영됩니다.
  const setData = useCallback(
    (updater: (prev: DashboardData) => DashboardData) => {
      setDataByWorkspace((prev) => ({
        ...prev,
        [activeWorkspaceId]: updater(prev[activeWorkspaceId]),
      }));
    },
    [activeWorkspaceId],
  );

  const workspaces = useMemo<DashboardWorkspace[]>(
    () =>
      Object.entries(dataByWorkspace).map(([id, d]) => {
        // 통합 데모 계정은 네 워크스페이스의 유치원이 모두 같으므로,
        // 이름 첫 글자 대신 역할 아이콘으로 구분해야 알아볼 수 있습니다.
        const demo = DEMO_ROLE_WORKSPACES.find((w) => w.id === id);
        return { id, kindergarten: d.kindergarten, role: d.role, icon: demo?.icon, label: demo?.label };
      }),
    [dataByWorkspace],
  );

  const switchWorkspace = useCallback((workspaceId: string) => {
    setActiveWorkspaceId((prev) => {
      if (workspaceId === prev) return prev;
      // 없는 워크스페이스로 옮기면 `data`가 undefined가 되어 대시보드가 통째로 멈춥니다.
      if (!(workspaceId in dataByWorkspace)) {
        console.warn(`[Kindy] 알 수 없는 워크스페이스입니다: ${workspaceId}`);
        return prev;
      }
      return workspaceId;
    });
  }, [dataByWorkspace]);

  const [aiTyping, setAiTyping] = useState<Record<string, boolean>>({});

  const choosePartner = useCallback((childId: string, partner: AIPartnerId) => {
    setData((prev) => {
      const child = prev.classChildren.find((c) => c.id === childId);
      if (!child) return prev;
      const updatedChild = { ...child, aiPartner: partner };
      const partnerName = partner === "kio" ? "키오" : "키나";
      return {
        ...prev,
        me: prev.me?.id === childId ? updatedChild : prev.me,
        classChildren: prev.classChildren.map((c) => (c.id === childId ? updatedChild : c)),
        aiThreadsByChild: {
          ...prev.aiThreadsByChild,
          [childId]: {
            childId,
            messages: [
              {
                id: -1,
                sender: "ai",
                senderName: partnerName,
                kind: "text",
                text: `안녕! 나는 ${partnerName}야, 이제부터 우리 매일매일 이야기 나누자! 오늘은 어떤 일이 있었어?`,
                time: Date.now(),
              },
            ],
          },
        },
      };
    });
  }, [setData]);

  const sendAiMessage = useCallback((childId: string, text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;

    setData((prev) => {
      const child = prev.classChildren.find((c) => c.id === childId) ?? prev.me;
      const thread = prev.aiThreadsByChild[childId] ?? { childId, messages: [] };
      return {
        ...prev,
        aiThreadsByChild: {
          ...prev.aiThreadsByChild,
          [childId]: {
            childId,
            messages: [
              ...thread.messages,
              { id: newId(), sender: "child", senderName: child?.nickname ?? "나", kind: "text", text: trimmed, time: Date.now() },
            ],
          },
        },
      };
    });

    setAiTyping((prev) => ({ ...prev, [childId]: true }));

    window.setTimeout(() => {
      setData((prev) => {
        const child = prev.classChildren.find((c) => c.id === childId) ?? prev.me;
        const partner: AIPartnerId = child?.aiPartner ?? "kio";
        const partnerName = partner === "kio" ? "키오" : "키나";
        const thread = prev.aiThreadsByChild[childId] ?? { childId, messages: [] };
        return {
          ...prev,
          aiThreadsByChild: {
            ...prev.aiThreadsByChild,
            [childId]: {
              childId,
              messages: [
                ...thread.messages,
                { id: newId(), sender: "ai", senderName: partnerName, kind: "text", text: pickReply(partner, trimmed), time: Date.now() },
              ],
            },
          },
        };
      });
      setAiTyping((prev) => ({ ...prev, [childId]: false }));
    }, 900 + Math.random() * 700);
  }, [setData]);

  const sendThreadMessage = useCallback((childId: string, sender: ChatSender, senderName: string, text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;
    setData((prev) => {
      const thread = prev.threadsByChild[childId];
      if (!thread) return prev;
      return {
        ...prev,
        threadsByChild: {
          ...prev.threadsByChild,
          [childId]: {
            ...thread,
            messages: [...thread.messages, { id: newId(), sender, senderName, kind: "text", text: trimmed, time: Date.now() }],
          },
        },
      };
    });
  }, [setData]);

  const insertDataCard = useCallback((childId: string, sender: ChatSender, senderName: string, cardType: DataCardType) => {
    setData((prev) => {
      const thread = prev.threadsByChild[childId];
      if (!thread) return prev;
      return {
        ...prev,
        threadsByChild: {
          ...prev.threadsByChild,
          [childId]: {
            ...thread,
            messages: [...thread.messages, { id: newId(), sender, senderName, kind: "data-card", cardType, time: Date.now() }],
          },
        },
      };
    });
  }, [setData]);

  const addNotice = useCallback(async (title: string, body: string, authorName: string, bannerEnabled = false) => {
    const p = new URLSearchParams();
    p.set("kindergartenId", String(data.kindergarten.id))
    p.set("title", title);
    p.set("content", body);
    p.set("pinned", "false");
    const f = await fetch('/api/kindergarten/notice/create', {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded"
      },
      credentials: 'include',
      body: p
    });
    setData((prev) => ({
      ...prev,
      notices: [
        { id: Math.random(), kindergartenId: prev.kindergarten.id, title, body, authorName, createdAt: Date.now(), pinned: false, bannerEnabled },
        ...prev.notices,
      ],
    }));
  }, [setData]);

  const togglePinNotice = useCallback((noticeId: number) => {
    setData((prev) => ({
      ...prev,
      notices: prev.notices.map((n) => (n.id === noticeId ? { ...n, pinned: !n.pinned } : n)),
    }));
  }, [setData]);

  const toggleNoticeBanner = useCallback((noticeId: number) => {
    setData((prev) => ({
      ...prev,
      notices: prev.notices.map((n) => (n.id === noticeId ? { ...n, bannerEnabled: !n.bannerEnabled } : n)),
    }));
  }, [setData]);

  const deleteNotice = useCallback((noticeId: number) => {
    setData((prev) => ({ ...prev, notices: prev.notices.filter((n) => n.id !== noticeId) }));
  }, [setData]);

  const addClass = useCallback((name: string) => {
    setData((prev) => ({
      ...prev,
      classes: [...prev.classes, { id: newId(), name, kindergartenId: prev.kindergarten.id }],
    }));
  }, [setData]);

  const renameClass = useCallback((classId: number, name: string) => {
    setData((prev) => ({
      ...prev,
      classes: prev.classes.map((c) => (c.id === classId ? { ...c, name } : c)),
    }));
  }, [setData]);

  const deleteClass = useCallback((classId: number) => {
    setData((prev) => ({ ...prev, classes: prev.classes.filter((c) => c.id !== classId) }));
  }, [setData]);

  const createRole = useCallback((name: string, color: string) => {
    setData((prev) => ({
      ...prev,
      roles: [...prev.roles, { id: newId(), name, color, permissions: [] }],
    }));
  }, [setData]);

  const updateRolePermissions = useCallback((roleId: number, permissions: PermissionKey[]) => {
    setData((prev) => ({
      ...prev,
      roles: prev.roles.map((r) => (r.id === roleId ? { ...r, permissions } : r)),
    }));
  }, [setData]);

  const deleteRole = useCallback((roleId: number) => {
    setData((prev) => ({
      ...prev,
      roles: prev.roles.filter((r) => r.id !== roleId),
      teachers: prev.teachers.map((t) => ({ ...t, roleIds: t.roleIds.filter((id) => id !== roleId) })),
    }));
  }, [setData]);

  const assignTeacherRole = useCallback((teacherId: string, roleId: number, assigned: boolean) => {
    setData((prev) => {
      const nextTeachers = prev.teachers.map((t) =>
        t.id !== teacherId
          ? t
          : { ...t, roleIds: assigned ? [...new Set([...t.roleIds, roleId])] : t.roleIds.filter((id) => id !== roleId) },
      );
      // 초대를 수락해 합류한 교사라면, 다음 로그인 때도 배정한 권한이 이어지도록
      // localStorage의 초대 레코드에도 함께 반영합니다. 초대 출신이 아닌 id면 조용히 무시됩니다.
      const updated = nextTeachers.find((t) => t.id === teacherId);
      if (updated) updateAcceptedInviteRoles(prev.kindergarten.id, teacherId, updated.roleIds);
      return { ...prev, teachers: nextTeachers };
    });
  }, [setData]);

  const removeTeacherMembership = useCallback((teacherId: string) => {
    setData((prev) => {
      revokeAcceptedInvite(prev.kindergarten.id, teacherId);
      return { ...prev, teachers: prev.teachers.filter((t) => t.id !== teacherId) };
    });
  }, [setData]);

  const addSupplyItem = useCallback((classId: number, title: string, body: string, authorName: string, dueDate?: string) => {
    setData((prev) => {
      const list = prev.suppliesByClass[classId] ?? [];
      const item = { id: newId(), classId, title, body, authorName, createdAt: Date.now(), dueDate, comments: [] };
      return { ...prev, suppliesByClass: { ...prev.suppliesByClass, [classId]: [item, ...list] } };
    });
  }, [setData]);

  const addSupplyComment = useCallback((classId: number, supplyId: number, authorName: string, authorRole: DashboardData["role"], text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;
    setData((prev) => {
      const list = prev.suppliesByClass[classId] ?? [];
      return {
        ...prev,
        suppliesByClass: {
          ...prev.suppliesByClass,
          [classId]: list.map((item) =>
            item.id !== supplyId
              ? item
              : { ...item, comments: [...item.comments, { id: newId(), authorName, authorRole, text: trimmed, createdAt: Date.now() }] },
          ),
        },
      };
    });
  }, [setData]);

  const addScheduleEvent = useCallback((title: string, date: string, time: string | undefined, createdBy: string, classId?: number) => {
    setData((prev) => ({
      ...prev,
      scheduleEvents: [
        { id: newId(), kindergartenId: prev.kindergarten.id, classId, title, date, time, createdBy, createdAt: Date.now() },
        ...prev.scheduleEvents,
      ],
    }));
  }, [setData]);

  const updateScheduleEvent = useCallback((eventId: number, title: string, date: string, time: string | undefined, classId?: number) => {
    setData((prev) => ({
      ...prev,
      scheduleEvents: prev.scheduleEvents.map((e) => (e.id === eventId ? { ...e, title, date, time, classId } : e)),
    }));
  }, [setData]);

  const deleteScheduleEvent = useCallback((eventId: number) => {
    setData((prev) => ({ ...prev, scheduleEvents: prev.scheduleEvents.filter((e) => e.id !== eventId) }));
  }, [setData]);

  const addPhoto = useCallback((url: string, uploadedBy: string, classId: number, theme: PhotoThemeId, caption?: string) => {
    setData((prev) => ({
      ...prev,
      photos: [{ id: newId(), classId: classId, url, caption, uploadedBy, theme, takenAt: Date.now() }, ...prev.photos],
    }));
  }, [setData]);

  const updatePhotoTheme = useCallback((photoId: number, theme: PhotoThemeId) => {
    setData((prev) => ({
      ...prev,
      photos: prev.photos.map((p) => (p.id === photoId ? { ...p, theme } : p)),
    }));
  }, [setData]);

  const deletePhoto = useCallback((photoId: number) => {
    setData((prev) => ({ ...prev, photos: prev.photos.filter((p) => p.id !== photoId) }));
  }, [setData]);

  const addParentNote = useCallback((childId: string, authorName: string, text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;
    setData((prev) => {
      const list = prev.parentNotesByChild[childId] ?? [];
      return {
        ...prev,
        parentNotesByChild: {
          ...prev.parentNotesByChild,
          [childId]: [{ id: newId(), childId, authorName, text: trimmed, createdAt: Date.now(), comments: [] }, ...list],
        },
      };
    });
  }, [setData]);

  const addParentNoteComment = useCallback(
    (childId: string, noteId: number, authorName: string, authorRole: DashboardData["role"], text: string) => {
      const trimmed = text.trim();
      if (!trimmed) return;
      setData((prev) => {
        const list = prev.parentNotesByChild[childId] ?? [];
        return {
          ...prev,
          parentNotesByChild: {
            ...prev.parentNotesByChild,
            [childId]: list.map((note) =>
              note.id !== noteId
                ? note
                : { ...note, comments: [...note.comments, { id: newId(), authorName, authorRole, text: trimmed, createdAt: Date.now() }] },
            ),
          },
        };
      });
    },
    [setData],
  );

  const updateChildNickname = useCallback((childId: string, nickname: string) => {
    const trimmed = nickname.trim();
    if (!trimmed) return;
    setData((prev) => ({
      ...prev,
      me: prev.me?.id === childId ? { ...prev.me, nickname: trimmed } : prev.me,
      myChild: prev.myChild?.id === childId ? { ...prev.myChild, nickname: trimmed } : prev.myChild,
      classChildren: prev.classChildren.map((c) => (c.id === childId ? { ...c, nickname: trimmed } : c)),
      myClassChildren: prev.myClassChildren?.map((c) => (c.id === childId ? { ...c, nickname: trimmed } : c)),
    }));
  }, [setData]);

  const updateTeacherNickname = useCallback((teacherId: string, nickname: string) => {
    const trimmed = nickname.trim();
    setData((prev) => ({
      ...prev,
      teacher: prev.teacher.id === teacherId ? { ...prev.teacher, nickname: trimmed || undefined } : prev.teacher,
      teachers: prev.teachers.map((t) => (t.id === teacherId ? { ...t, nickname: trimmed || undefined } : t)),
    }));
  }, [setData]);

  const sendMemberMessage = useCallback((teacherId: string, senderRole: ChatSender, senderName: string, text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;
    setData((prev) => {
      const thread = prev.memberThreadsByTeacher[teacherId];
      if (!thread) return prev;
      return {
        ...prev,
        memberThreadsByTeacher: {
          ...prev.memberThreadsByTeacher,
          [teacherId]: {
            ...thread,
            messages: [...thread.messages, { id: newId(), sender: senderRole, senderName, kind: "text", text: trimmed, time: Date.now() }],
          },
        },
      };
    });
  }, [setData]);

  const addHomeWidget = useCallback((id: FeatureId) => {
    setData((prev) => (prev.homeWidgets.includes(id) ? prev : { ...prev, homeWidgets: [...prev.homeWidgets, id] }));
  }, [setData]);

  const removeHomeWidget = useCallback((id: FeatureId) => {
    setData((prev) => ({ ...prev, homeWidgets: prev.homeWidgets.filter((w) => w !== id) }));
  }, [setData]);

  const value = useMemo<DashboardStoreValue>(
    () => ({
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

  return <DashboardStoreContext.Provider value={value}>{children}</DashboardStoreContext.Provider>;
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
