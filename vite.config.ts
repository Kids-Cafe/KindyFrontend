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
})
