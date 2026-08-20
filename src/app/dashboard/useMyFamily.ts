import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/app/auth/AuthContext";
import { fetchFamilies, fetchUserInfo } from "@/app/dashboard/userSync";
import type { PlainUserDTO } from "@/app/lib/dto";

/**
 * 로그인한 계정의 가족 관계입니다. **어느 유치원을 보고 있는지와 무관합니다.**
 *
 * 대시보드 스토어를 쓰지 않는 게 핵심입니다. 마이페이지는 소속 유치원이 하나도 없는
 * 화면에서도 열리고(그때 `useDashboardStoreOptional()`은 null), 스토어의 `myChild`는
 * "지금 보는 유치원에 멤버로 등록된 아이"만 잡습니다. 아이가 아직 유치원에 없거나 부모가
 * 워크스페이스 밖에 있으면 비어 버리는데, 연결 자체는 계정 단위 사실이라 그게 맞지
 * 않습니다.
 *
 * `user/family/list`는 `PARENT = ? OR CHILD = ?`라 양방향을 한 번에 돌려주므로,
 * "내 아이"와 "내 보호자"를 요청 한 번으로 함께 얻습니다.
 */
export interface MyFamily {
  /** 연결된 아이들. 프로필까지 채워 옵니다. */
  children: PlainUserDTO[];
  /** 나를 아이로 두고 있는 보호자들의 계정 id. 개수만 쓰이므로 프로필은 받지 않습니다. */
  guardianIds: string[];
  isLoading: boolean;
  refresh: () => void;
}

export function useMyFamily(): MyFamily {
  const { user } = useAuth();
  const userId = user?.id;

  const [children, setChildren] = useState<PlainUserDTO[]>([]);
  const [guardianIds, setGuardianIds] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [reloadKey, setReloadKey] = useState(0);

  const refresh = useCallback(() => setReloadKey((n) => n + 1), []);

  useEffect(() => {
    // 로그아웃 상태에서는 아무것도 부르지 않고 초기값 그대로 둡니다. 여기서 상태를 되돌리면
    // 이펙트 본문에서 동기 setState를 하게 되는데, 이 훅을 쓰는 화면은 사용자가 없으면
    // 애초에 렌더되지 않으므로 되돌릴 것도 없습니다.
    if (!userId) return;

    let cancelled = false;

    void (async () => {
      setIsLoading(true);
      try {
        const families = await fetchFamilies();
        if (cancelled) return;

        setGuardianIds(families.filter((f) => f.child === userId).map((f) => f.parent));

        const childIds = families.filter((f) => f.parent === userId).map((f) => f.child);
        // 서버에 묶음 조회가 없어 아이 수만큼 나갑니다. 한 명이 실패해도 나머지는 보여줍니다.
        const profiles = await Promise.all(childIds.map((id) => fetchUserInfo(id).catch(() => null)));
        if (cancelled) return;

        setChildren(profiles.filter((p): p is PlainUserDTO => p !== null));
      } catch (cause) {
        if (cancelled) return;
        console.warn("[Kindy] 가족 관계를 불러오지 못했어요.", cause);
        setChildren([]);
        setGuardianIds([]);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [userId, reloadKey]);

  return { children, guardianIds, isLoading, refresh };
}
