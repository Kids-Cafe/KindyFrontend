import js from "@eslint/js";
import globals from "globals";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import tseslint from "typescript-eslint";

export default tseslint.config(
  {
    // 빌드 산출물, 워크트리 사본, shadcn/ui에서 그대로 가져온 컴포넌트는 검사 대상이 아닙니다.
    ignores: ["dist/**", "node_modules/**", ".claude/**", "coverage/**", "src/app/components/ui/**"],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      ecmaVersion: 2022,
      globals: globals.browser,
    },
    plugins: {
      "react-hooks": reactHooks,
      "react-refresh": reactRefresh,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      "react-refresh/only-export-components": ["warn", { allowConstantExport: true }],

      // `_`로 시작하는 이름은 "일부러 안 쓰는 값"이라는 표시로 허용합니다.
      // (구조 분해로 필드를 떼어낼 때 필요합니다.)
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_", caughtErrors: "none" },
      ],

      // 백엔드가 붙기 전 목업 코드에 any가 남아 있어 경고로만 둡니다.
      "@typescript-eslint/no-explicit-any": "warn",

      // 디버깅 흔적이 배포에 섞이지 않게 막습니다. 사용자에게 보고할 오류는 console.error를 쓰세요.
      "no-console": ["warn", { allow: ["warn", "error"] }],

      // 이 저장소는 린트를 처음 붙였습니다. 아래 둘은 "즉시 깨진 코드"가 아니라
      // 정리해 나가야 할 패턴(주로 prop이 바뀔 때 로컬 state를 되돌리는 useEffect)이라
      // 경고로 두고 점진적으로 없앱니다. 새 코드에서는 만들지 마세요.
      "react-hooks/set-state-in-effect": "warn",
      "react-hooks/exhaustive-deps": "warn",
    },
  },
  {
    // 설정 파일들은 Node 환경에서 돕니다.
    files: ["*.config.{js,ts}", "vite.config.ts", "vitest.config.ts"],
    languageOptions: { globals: globals.node },
  },
);
