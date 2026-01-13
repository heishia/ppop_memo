# 아키텍처

## 구조

```
Electron Main Process (Node.js)
  ├── WindowManager: 윈도우 관리
  ├── Database: SQLite 접근
  ├── IPC Handlers: IPC 통신 처리
  └── File Handler: 파일 연결 처리

Electron Renderer Process (React)
  ├── Components: UI 컴포넌트
  ├── Services: 비즈니스 로직
  ├── Hooks: React Hooks
  └── Config: 설정 파일
```

## 데이터 흐름

1. 사용자 입력 → React Component
2. Component → Service Layer
3. Service → IPC → Main Process
4. Main Process → Database
5. Database → Main Process → IPC → Renderer
6. Renderer → Component 업데이트
