import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError, apiGet, onSessionExpired } from "@/app/lib/api";

/** ResultDTO 봉투를 흉내 내는 응답입니다. */
function envelope(body: unknown): Response {
  return { json: async () => body } as Response;
}

describe("apiGet의 세션 만료 감지", () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    fetchMock.mockReset();
    vi.stubGlobal("fetch", fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  /** 만료 확인은 응답과 별개로 돌기 때문에, 알림이 오거나 확인이 끝날 때까지 기다립니다. */
  async function flush() {
    for (let i = 0; i < 5; i += 1) await Promise.resolve();
  }

  it("로그인이 풀린 상태의 INVALID_ACCESS는 만료로 알린다", async () => {
    fetchMock.mockImplementation((url: string) =>
      Promise.resolve(
        url.startsWith("/api/user/session")
          ? envelope({ status: "success", code: "NOT_SIGNED_IN", data: null })
          : envelope({ status: "error", code: "INVALID_ACCESS", data: null }),
      ),
    );

    const onExpired = vi.fn();
    const unsubscribe = onSessionExpired(onExpired);

    await expect(apiGet("/api/class/list")).rejects.toBeInstanceOf(ApiError);
    await flush();

    expect(onExpired).toHaveBeenCalledTimes(1);
    unsubscribe();
  });

  it("로그인은 살아있는데 권한이 없어 INVALID_ACCESS면 만료로 보지 않는다", async () => {
    fetchMock.mockImplementation((url: string) =>
      Promise.resolve(
        url.startsWith("/api/user/session")
          ? envelope({ status: "success", code: "SIGNED_IN", data: { id: "kim" } })
          : envelope({ status: "error", code: "INVALID_ACCESS", data: null }),
      ),
    );

    const onExpired = vi.fn();
    const unsubscribe = onSessionExpired(onExpired);

    await expect(apiGet("/api/class/list")).rejects.toBeInstanceOf(ApiError);
    await flush();

    expect(onExpired).not.toHaveBeenCalled();
    unsubscribe();
  });

  it("세션 확인이 네트워크 오류로 실패하면 로그아웃시키지 않는다", async () => {
    fetchMock.mockImplementation((url: string) =>
      url.startsWith("/api/user/session")
        ? Promise.reject(new TypeError("Failed to fetch"))
        : Promise.resolve(envelope({ status: "error", code: "INVALID_ACCESS", data: null })),
    );

    const onExpired = vi.fn();
    const unsubscribe = onSessionExpired(onExpired);

    await expect(apiGet("/api/class/list")).rejects.toBeInstanceOf(ApiError);
    await flush();

    expect(onExpired).not.toHaveBeenCalled();
    unsubscribe();
  });

  it("다른 오류 코드는 세션을 확인하지 않는다", async () => {
    fetchMock.mockResolvedValue(envelope({ status: "error", code: "MISSING_PARAMETER", data: null }));

    const onExpired = vi.fn();
    const unsubscribe = onSessionExpired(onExpired);

    await expect(apiGet("/api/class/list")).rejects.toBeInstanceOf(ApiError);
    await flush();

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(onExpired).not.toHaveBeenCalled();
    unsubscribe();
  });
});
