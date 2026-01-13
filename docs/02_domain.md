# 도메인 모델

## 엔티티

### Memo
- id: 고유 식별자
- title: 제목
- content: 텍스트 내용
- canvas_data: 캔버스 데이터 (JSON)
- mode: 모드 ('text' | 'canvas')
- folder_id: 폴더 ID
- created_at: 생성 시간
- updated_at: 수정 시간
- window_state: 윈도우 상태 (JSON)

### Folder
- id: 고유 식별자
- name: 폴더 이름
- parent_id: 부모 폴더 ID
- created_at: 생성 시간

### Tag
- id: 고유 식별자
- name: 태그 이름
- created_at: 생성 시간
