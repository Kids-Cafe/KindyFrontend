import { Component, type ErrorInfo, type ReactNode } from "react";

interface Props {
  children: ReactNode;
  /**
   * 폴백 UI 대신 쓸 노드입니다. 대시보드 같은 하위 영역을 감쌀 때
   * "이 영역만 문제가 생겼어요" 식의 좁은 안내를 넣기 위해 씁니다.
   */
  fallback?: (error: Error, reset: () => void) => ReactNode;
  /** 감싼 영역 이름입니다. 로그에 어디서 터졌는지 남기려고 받습니다. */
  label?: string;
}

interface State {
  error: Error | null;
}

/**
 * 렌더링 중 던져진 예외를 잡아 흰 화면 대신 복구 안내를 보여줍니다.
 * 리액트의 에러 경계는 클래스 컴포넌트로만 만들 수 있어 여기만 클래스입니다.
 *
 * 이벤트 핸들러/비동기 콜백에서 난 예외는 경계가 잡지 못하므로,
 * 그런 곳은 각자 try/catch로 처리해야 합니다.
 */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    // 모니터링 도구(Sentry 등)를 붙이면 이 자리에서 함께 전송하세요.
    console.error(`[Kindy] ${this.props.label ?? "app"} 렌더링 오류`, error, info.componentStack);
  }

  reset = (): void => {
    this.setState({ error: null });
  };

  render(): ReactNode {
    const { error } = this.state;
    if (!error) return this.props.children;

    if (this.props.fallback) return this.props.fallback(error, this.reset);

    return (
      <div
        role="alert"
        className="min-h-dvh flex flex-col items-center justify-center gap-4 px-6 text-center"
        style={{ background: "#FFF7FA", color: "#7A3B57" }}
      >
        <div
          className="w-16 h-16 rounded-full flex items-center justify-center text-3xl"
          style={{ background: "linear-gradient(135deg,#F9A8D4,#E879A0)" }}
          aria-hidden="true"
        >
          😢
        </div>
        <h1 className="text-lg font-bold">잠시 문제가 생겼어요</h1>
        <p className="text-sm max-w-sm" style={{ color: "#A06080" }}>
          화면을 그리는 중에 예상치 못한 오류가 났습니다. 다시 시도해도 같은 화면이 나오면
          잠시 후에 접속해 주세요.
        </p>

        <div className="flex gap-2">
          <button
            onClick={this.reset}
            className="text-sm font-bold px-5 py-2.5 rounded-full text-white transition-transform active:scale-95"
            style={{ background: "linear-gradient(135deg,#E879A0,#F472B6)" }}
          >
            다시 시도
          </button>
          <button
            onClick={() => window.location.reload()}
            className="text-sm font-bold px-5 py-2.5 rounded-full border transition-colors hover:bg-black/[0.03]"
            style={{ borderColor: "rgba(232,121,160,0.3)", color: "#A06080" }}
          >
            새로고침
          </button>
        </div>

        {import.meta.env.DEV && (
          <pre
            className="mt-2 max-w-xl w-full overflow-auto text-left text-xs p-3 rounded-xl"
            style={{ background: "rgba(232,121,160,0.08)", color: "#A06080" }}
          >
            {error.stack ?? error.message}
          </pre>
        )}
      </div>
    );
  }
}
