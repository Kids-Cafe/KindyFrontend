import { defineConfig } from 'vite'
import path from 'path'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'


function figmaAssetResolver() {
  return {
    name: 'figma-asset-resolver',
    resolveId(id: string) {
      if (id.startsWith('figma:asset/')) {
        const filename = id.replace('figma:asset/', '')
        return path.resolve(__dirname, 'src/assets', filename)
      }
    },
  }
}

export default defineConfig({
  plugins: [
    figmaAssetResolver(),
    // Tailwind를 적극적으로 사용하지 않더라도 Make에는 React와 Tailwind 플러그인이
    // 모두 필요하므로 제거하지 마세요.
    react(),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      // @ 별칭을 src 디렉터리에 연결합니다.
      '@': path.resolve(__dirname, './src'),
    },
  },

  // 원시 import를 지원할 파일 형식입니다. 여기에 .css, .tsx, .ts 파일은 절대 추가하지 마세요.
  assetsInclude: ['**/*.svg', '**/*.csv'],

  build: {
    // Tailwind v4가 @property / color-mix() / oklch()를 쓰기 때문에 CSS 쪽 하한이
    // Safari 16.4 · Chrome 111 · Firefox 128입니다. 이걸 명시하지 않으면 Vite 기본값
    // (Safari 16 등)으로 JS만 낮춰 내보내서, 실제로는 못 쓰는 브라우저를 지원하는 것처럼
    // 보이게 됩니다. 둘의 기준을 맞춰 둡니다.
    target: ["chrome111", "edge111", "firefox128", "safari16.4"],
    rollupOptions: {
      output: {
        // 자주 안 바뀌는 라이브러리를 앱 코드와 분리해 두면, 앱을 배포해도
        // 방문자 브라우저에 캐시된 vendor 청크를 그대로 재사용할 수 있습니다.
        manualChunks(id) {
          if (!id.includes('node_modules')) return
          if (id.includes('recharts') || id.includes('d3-')) return 'vendor-charts'
          if (id.includes('@radix-ui')) return 'vendor-radix'
          if (id.includes('motion') || id.includes('framer-motion')) return 'vendor-motion'
          if (id.includes('react-dom') || id.includes('/react/') || id.includes('scheduler')) return 'vendor-react'
          return 'vendor'
        },
      },
    },
  },
})
