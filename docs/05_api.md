# API 명세

## IPC API

### memo
- `memo:create()`: 새 메모 생성
- `memo:get(id)`: 메모 조회
- `memo:update(id, data)`: 메모 수정
- `memo:delete(id)`: 메모 삭제
- `memo:list()`: 메모 목록 조회
- `memo:search(query)`: 메모 검색
- `memo:moveToFolder(memoId, folderId)`: 메모를 폴더로 이동

### folder
- `folder:create(name, parentId)`: 폴더 생성
- `folder:list()`: 폴더 목록 조회
- `folder:delete(id)`: 폴더 삭제

### window
- `window:setAlwaysOnTop(windowId, alwaysOnTop)`: 최상단 고정 설정
- `window:saveState(windowId, state)`: 윈도우 상태 저장
- `window:getId()`: 현재 윈도우 ID 조회
