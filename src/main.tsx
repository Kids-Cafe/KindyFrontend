import { createRoot } from "react-dom/client";
import App from "./app/App.tsx";
import { AuthProvider } from "./app/auth/AuthContext.tsx";
import { ErrorBoundary } from "./app/components/ErrorBoundary.tsx";
import { seedDemoAccounts } from "./app/auth/mockSignup.ts";
import "./styles/index.css";

const container = document.getElementById("root");
if (!container) throw new Error("#root 엘리먼트를 찾지 못했어요. index.html을 확인해주세요.");

const root = createRoot(container);

function render() {
  root.render(
    <ErrorBoundary label="root">
      <AuthProvider>
        <App />
      </AuthProvider>
    </ErrorBoundary>,
  );
}

if (import.meta.env.DEV) {
  // 백엔드가 없는 mock 환경이라 햇살유치원 데모 계정(학부모/교사/원장/아이)을 심어둡니다.
  // 비밀번호가 공개된 원장 계정이 생기므로 개발 빌드에서만 돕니다.
  // 비밀번호 해싱이 비동기라, 로그인 폼이 뜨기 전에 끝나도록 먼저 기다립니다.
  seedDemoAccounts()
    .catch((cause) => console.error("[Kindy] 데모 계정 시딩 실패", cause))
    .finally(render);
} else {
  render();
}
