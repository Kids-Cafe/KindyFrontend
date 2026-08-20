import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/app/auth/AuthContext";
import { fetchMemberships } from "@/app/dashboard/backendSync";

/**
 * 로그인한 계정이 닿는 유치원 전부입니다. `GET /api/kindergarten/memberships` 하나가
 * 출처이고, 대시보드 스토어에 기대지 않습니다 — 마이페이지는 소속 유치원이 없는 화면이나
 * 온보딩 도중처럼 스토어가 없는 곳에서도 열립니다.
 *
 * 예전에는 이 목록을 `AuthUser.kindergarten`(localStorage)에서 읽었는데, 그 값은 온보딩
 * 마법사와 "유치원 직접 등록"만 채웁니다. **초대를 수락해 들어온 계정은 영영 비어 있어서**,
 * 실제로는 멀쩡히 소속된 아이 계정이 "아직 가입한 유치원이 없어요"를 보고 있었습니다.
 */
export interface MyKindergarten {
  id: number;
  name: string;
  /**
   * 이 행의 주인입니다. 학부모에게는 **아이의** 행이 내려오므로(서버가 T_FAMILY를 타고
   * 넓혀 줍니다) 로그인한 사람의 아이디와 다를 수 있습니다.
   */
  memberId: string;
  /** 내 소속인지, 아이를 통해 닿는 곳인지. */
  viaChild: boolean;
  /** 이 유치원에서 쓰는 내 별칭입니다. 아이를 통해 닿는 곳에는 없습니다. */
  nickname?: string;
}

export interface MyKindergartens {
  list: MyKindergarten[];
  isLoading: boolean;
  refresh: () => void;
}

export function useMyKindergartens(): MyKindergartens {
  const { user } = useAuth();
  const userId = user?.id;

  const [list, setList] = useState<MyKindergarten[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [reloadKey, setReloadKey] = useState(0);

  const refresh = useCallback(() => setReloadKey((n) => n + 1), []);

  useEffect(() => {
    if (!userId) return;

    let cancelled = false;

    void (async () => {
      setIsLoading(true);
      try {
        const memberships = await fetchMemberships();
        if (cancelled) return;

        // 한 유치원에 아이를 둘 보낸 학부모에게는 같은 유치원이 두 번 옵니다(아이마다 한 행).
        // 목록으로는 한 줄이면 됩니다.
        const byId = new Map<number, MyKindergarten>();
        for (const m of memberships) {
          if (byId.has(m.kindergartenId)) continue;
          byId.set(m.kindergartenId, {
            id: m.kindergartenId,
            name: m.kindergartenName ?? `유치원 #${m.kindergartenId}`,
            memberId: m.userId,
            viaChild: m.userId !== userId,
            nickname: m.userId === userId ? m.nickname : undefined,
          });
        }
        setList([...byId.values()]);
      } catch (cause) {
        if (cancelled) return;
        console.warn("[Kindy] 소속 유치원을 불러오지 못했어요.", cause);
        setList([]);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [userId, reloadKey]);

  return { list, isLoading, refresh };
}
