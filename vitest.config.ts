import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./src/test/setup.ts"],
    include: ["src/**/*.{test,spec}.{ts,tsx}"],
    coverage: {
      provider: "v8",
      reporter: ["text", "html"],
      // 목업 데이터와 Figma에서 가져온 UI 프리미티브는 커버리지 대상이 아닙니다.
      exclude: ["src/app/components/ui/**", "src/app/dashboard/mock/**", "src/imports/**", "**/*.d.ts"],
    },
  },
});
