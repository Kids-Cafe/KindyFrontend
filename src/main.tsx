import { createRoot } from "react-dom/client";
import App from "./app/App.tsx";
import { AuthProvider } from "./app/auth/AuthContext.tsx";
import { seedDemoAccounts } from "./app/auth/mockSignup.ts";
import "./styles/index.css";

// 백엔드가 없는 mock 환경이라 첫 로드 시 햇살유치원 데모 계정(학부모/교사/원장/아이)을 심어둡니다.
seedDemoAccounts();

createRoot(document.getElementById("root")!).render(
  <AuthProvider>
    <App />
  </AuthProvider>,
);
