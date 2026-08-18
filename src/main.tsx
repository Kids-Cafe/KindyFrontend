import { createRoot } from "react-dom/client";
import App from "./app/App.tsx";
import { AuthProvider } from "./app/auth/AuthContext.tsx";
import { ErrorBoundary } from "./app/components/ErrorBoundary.tsx";
import "./styles/index.css";

const container = document.getElementById("root");
if (!container) throw new Error("#root 엘리먼트를 찾지 못했어요. index.html을 확인해주세요.");

createRoot(container).render(
  <ErrorBoundary label="root">
    <AuthProvider>
      <App />
    </AuthProvider>
  </ErrorBoundary>,
);
