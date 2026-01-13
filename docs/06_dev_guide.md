# 개발 가이드

## 개발 환경 설정

1. Node.js 설치
2. `npm install` 실행
3. `.env` 파일 생성 및 환경 변수 설정

## 개발 모드 실행

```bash
npm run dev
```

## 빌드

```bash
npm run build
```

## 코드 구조

- `apps/desktop/main/`: Electron Main Process
- `apps/desktop/renderer/`: Electron Renderer Process (React)
- `apps/desktop/preload/`: Preload Scripts
- `packages/`: 공통 코드

## Handwriting Recognition 설정

`apps/desktop/renderer/src/config/handwriting.ts`에서 기준값 조정 가능

## 데이터베이스

SQLite 데이터베이스는 `%APPDATA%/ppop-memo/memos.db`에 저장됩니다.
