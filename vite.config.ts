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

// Radix 프리미티브가 런타임에 함께 끌고 오는 패키지들입니다. vendor-radix가
// vendor를 되import하지 않도록 같은 청크에 넣습니다.
const RADIX_RUNTIME_DEPS = new Set([
  'aria-hidden',
  'react-remove-scroll',
  'react-remove-scroll-bar',
  'react-style-singleton',
  'use-callback-ref',
  'use-sidecar',
  'get-nonce',
  'detect-node-es',
  'tslib',
  '@floating-ui/react-dom',
  '@floating-ui/dom',
  '@floating-ui/core',
  '@floating-ui/utils',
])

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
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
      }
    }
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
        //
        // 주의: 여기서는 반드시 "패키지 이름"으로 나눠야 합니다. 예전처럼 경로
        // 문자열(id.includes('react-dom') 등)로 나누면 @floating-ui/react-dom 같은
        // 무관한 패키지까지 vendor-react로 딸려 들어가고, 그 패키지가 vendor를
        // 다시 import하면서 청크끼리 순환 참조(vendor <-> vendor-react)가 생깁니다.
        // 순환이 생기면 ESM 평가 순서가 꼬여서, 모듈 최상단에서 React를 읽는
        // @radix-ui/react-use-layout-effect 같은 코드가 아직 초기화되지 않은
        // 네임스페이스를 만나 `undefined is not an object (evaluating
        // 'a.useLayoutEffect')`로 죽습니다. dev 서버는 청크를 만들지 않으므로
        // 이 문제가 드러나지 않습니다.
        //
        // 규칙: vendor-react는 아무것도 import하지 않는 leaf 청크로 유지하고,
        // vendor-radix는 Radix가 의존하는 패키지까지 같은 청크에 넣어
        // vendor -> vendor-radix 한 방향만 남도록 합니다.
        manualChunks(id) {
          const pkg = id.match(
            /node_modules\/(?:\.pnpm\/[^/]+\/node_modules\/)?((?:@[^/]+\/)?[^/]+)/,
          )?.[1]
          if (!pkg) return

          // leaf: 다른 어떤 청크도 import하지 않아야 합니다.
          if (pkg === 'react' || pkg === 'react-dom' || pkg === 'scheduler') {
            return 'vendor-react'
          }
          if (pkg === 'recharts' || pkg === 'victory-vendor' || pkg.startsWith('d3-')) {
            return 'vendor-charts'
          }
          // Radix 본체 + Radix가 끌고 오는 런타임 의존성을 함께 묶습니다.
          if (pkg.startsWith('@radix-ui/') || RADIX_RUNTIME_DEPS.has(pkg)) {
            return 'vendor-radix'
          }
          return 'vendor'
        },
      },
    },
  },
})
