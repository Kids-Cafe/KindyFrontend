# Kindy 플랫폼

유치원·학부모·아이를 잇는 소통 플랫폼의 프론트엔드입니다.
원본 디자인: [Figma](https://www.figma.com/design/kqnIiZyvD9lv5UrbpJdlVw/Kindy-%ED%94%8C%EB%9E%AB%ED%8F%BC-%EA%B5%AC%EC%B6%95)

## 시작하기

```bash
npm i        # 의존성 설치
npm run dev  # 개발 서버 (http://localhost:5173)
```

소셜 로그인을 실제 인가 서버에 붙이려면 `.env.local`의 `VITE_*_CLIENT_ID` 값을 채우세요.
비워 두면 목업 모드로 리다이렉트 흐름만 재현합니다.

## 스크립트

| 명령 | 설명 |
| --- | --- |
| `npm run dev` | 개발 서버 |
| `npm run build` | 프로덕션 빌드 (`dist/`) |
| `npm run preview` | 빌드 결과 미리보기 |
| `npm run typecheck` | 타입 검사 |
| `npm run lint` | ESLint |
| `npm run lint:fix` | 자동 수정 가능한 ESLint 문제 정리 |
| `npm run format` | Prettier 포매팅 |
| `npm test` | 테스트 1회 실행 |
| `npm run test:watch` | 테스트 감시 모드 |
| `npm run test:coverage` | 커버리지 리포트 |
| `npm run verify` | 타입 + 린트 + 테스트 (커밋/배포 전 확인용) |

## 개발용 데모 계정

개발 서버에서만 햇살유치원(강남) 데모 계정이 자동으로 심어집니다. 비밀번호는 모두 `1234`입니다.

| 아이디 | 역할 |
| --- | --- |
| `demo` | **원장 + 교사 + 학부모 + 아이** (좌측 서버 레일에서 전환) |
| `parent` | 학부모 |
| `teacher1` | 원장 (+ 타 유치원 학부모 워크스페이스) |
| `teacher2` | 교사 |
| `kid` | 아이 |

`demo`는 화면 검수용 통합 계정입니다. 같은 유치원을 네 역할로 나란히 띄워 계정을 갈아타지 않고
비교할 수 있습니다(🏫 원장 / 🎒 선생님 / 👨‍👩‍👧 학부모 / 🧒 아이). 워크스페이스마다 데이터가
독립적이라 한쪽에서 쓴 글이 다른 쪽에 보이지는 않습니다
(`DashboardStoreContext.tsx`의 `DEMO_ROLE_WORKSPACES`).

프로덕션 빌드에서는 시딩도, 통합 데모 계정의 다중 워크스페이스도 동작하지 않습니다
(`src/main.tsx`, `isAllRolesDemoUser()`).

## 백엔드 연동 전 알아둘 것

현재 인증과 대시보드 데이터는 **전부 목업**입니다. 실제 서비스 전에 반드시 처리해야 합니다.

- **인증**: `src/app/auth/oauth.ts`의 `exchangeCodeForSession()`이 주석 처리된 상태입니다.
  세션 토큰도 클라이언트가 만든 UUID라 위조 가능합니다. 서버가 발급·검증해야 합니다.
- **비밀번호**: `src/app/auth/passwordHash.ts`가 평문 저장만 막고 있을 뿐,
  브라우저 안 검증이라 보안 경계가 아닙니다. 서버가 해싱·대조를 맡아야 합니다.
- **검증**: `src/app/auth/validation.ts`의 규칙은 클라이언트 편의용입니다. 서버에도 같은 규칙이 필요합니다.
- **대시보드 데이터**: 일정·공지·채팅·멤버는 메모리에만 있어 새로고침하면 사라집니다
  (`src/app/dashboard/DashboardStoreContext.tsx`).
- **검색 노출**: `index.html`의 `robots noindex` 는 정식 오픈 시 제거하세요.

## 구조

```
src/
  app/
    auth/         인증(세션, OAuth, 목업 계정 저장소)
    components/   공용 컴포넌트 · shadcn/ui 프리미티브(ui/)
    dashboard/    로그인 후 기능 대시보드
    data/         랜딩 문구·샘플 데이터
    sections/     마케팅 랜딩 및 로그인/가입/온보딩 화면
  imports/        Figma에서 내보낸 이미지 에셋
  test/           테스트 셋업
```
