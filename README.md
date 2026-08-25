# Kindy 플랫폼

유치원·학부모·아이를 잇는 소통 플랫폼의 프론트엔드입니다.
원본 디자인: [Figma](https://www.figma.com/design/kqnIiZyvD9lv5UrbpJdlVw/Kindy-%ED%94%8C%EB%9E%AB%ED%8F%BC-%EA%B5%AC%EC%B6%95)

## 시작하기

```bash
npm i        # 의존성 설치
npm run dev  # 개발 서버 (http://localhost:5173)
```

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
