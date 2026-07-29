import { createContext, useCallback, useContext, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { useAuth } from "@/app/auth/AuthContext";
import { buildDashboardData } from "@/app/dashboard/mockData";
import type {
  AIPartnerId,
  ChatSender,
  DashboardData,
  DataCardType,
} from "@/app/dashboard/types";

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
}

const DashboardStoreContext = createContext<DashboardStoreValue | null>(null);

export function DashboardStoreProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [data, setData] = useState<DashboardData>(() => buildDashboardData(user!));
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
                id: `${childId}-ai-welcome`,
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
  }, []);

  const sendAiMessage = useCallback((childId: string, text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;

    setData((prev) => {
      const child = prev.classChildren.find((c) => c.id === childId) ?? prev.me;
      const partner = child?.aiPartner ?? "kio";
      const thread = prev.aiThreadsByChild[childId] ?? { childId, messages: [] };
      return {
        ...prev,
        aiThreadsByChild: {
          ...prev.aiThreadsByChild,
          [childId]: {
            childId,
            messages: [
              ...thread.messages,
              { id: crypto.randomUUID(), sender: "child", senderName: child?.nickname ?? "나", kind: "text", text: trimmed, time: Date.now() },
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
                { id: crypto.randomUUID(), sender: "ai", senderName: partnerName, kind: "text", text: pickReply(partner, trimmed), time: Date.now() },
              ],
            },
          },
        };
      });
      setAiTyping((prev) => ({ ...prev, [childId]: false }));
    }, 900 + Math.random() * 700);
  }, []);

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
            messages: [...thread.messages, { id: crypto.randomUUID(), sender, senderName, kind: "text", text: trimmed, time: Date.now() }],
          },
        },
      };
    });
  }, []);

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
            messages: [...thread.messages, { id: crypto.randomUUID(), sender, senderName, kind: "data-card", cardType, time: Date.now() }],
          },
        },
      };
    });
  }, []);

  const value = useMemo<DashboardStoreValue>(
    () => ({ data, choosePartner, sendAiMessage, sendThreadMessage, insertDataCard, aiTyping }),
    [data, choosePartner, sendAiMessage, sendThreadMessage, insertDataCard, aiTyping],
  );

  return <DashboardStoreContext.Provider value={value}>{children}</DashboardStoreContext.Provider>;
}

export function useDashboardStore(): DashboardStoreValue {
  const ctx = useContext(DashboardStoreContext);
  if (!ctx) throw new Error("useDashboardStore는 <DashboardStoreProvider> 안에서만 사용할 수 있어요.");
  return ctx;
}
