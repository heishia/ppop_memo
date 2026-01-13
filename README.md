# PPOP Memo

로컬에서 작동하는 데스크탑 메모 프로그램입니다. 스티키 메모 기능, 파일 연결, 판서 기능(handwriting recognition)을 포함한 종합 메모 앱입니다.

## 주요 기능

- **메모 관리**: 제목과 내용을 가진 메모 생성, 수정, 삭제
- **스티키 메모**: 여러 메모 창을 동시에 열고 최상단 고정 가능
- **모드 전환**: 텍스트 모드와 캔버스 모드 전환 (Ctrl+T)
- **파일 연결**: txt/md 파일을 더블클릭하여 앱에서 열기
- **폴더 분류**: 메모를 폴더로 분류하여 관리
- **검색**: 제목과 내용으로 메모 검색
- **판서 기능**: Canvas에 그린 낙서를 텍스트로 변환 (iinkTS 또는 Tesseract.js)

## 기술 스택

- Electron + React + TypeScript
- SQLite (better-sqlite3)
- Tailwind CSS
- Fabric.js (Canvas 그리기)
- iinkTS / Tesseract.js (Handwriting Recognition)

## 시작하기

### 설치

```bash
npm install
```

### 개발 모드 실행

```bash
npm run dev
```

### 빌드

```bash
npm run build
```

### 배포 패키지 생성

```bash
npm run dist
```

## 환경 변수

`.env` 파일을 생성하고 다음 변수를 설정하세요:

```
NODE_ENV=development
MYSCRIPT_API_KEY=your_api_key
MYSCRIPT_APPLICATION_KEY=your_application_key
MYSCRIPT_HMAC_KEY=your_hmac_key
```

## Handwriting Recognition 설정

`apps/desktop/renderer/src/config/handwriting.ts` 파일에서 텍스트 변환 기준값을 조정할 수 있습니다:

```typescript
export const HANDWRITING_CONFIG = {
  TEXT_CONVERSION_THRESHOLD: 0.7,  // 텍스트 변환 기준 신뢰도 (0.0 ~ 1.0)
  MIN_CONFIDENCE_FOR_TEXT: 0.6,    // 최소 신뢰도
  AUTO_CONVERT_ENABLED: true,      // 자동 변환 활성화
};
```

## 문서

자세한 내용은 [docs/](docs/) 폴더를 참조하세요.
