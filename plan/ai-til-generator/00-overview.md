# AI Agent TIL 자동 작성 기능 - 개요

## 프로젝트 목표

TIL(Today I Learned) 작성 시 수동 작성 외에 AI Agent를 통한 자동 작성 모드를 구현합니다.
사용자가 학습 자료(URL, 텍스트)를 입력하면 AI(Claude)가 자동으로 TIL 포스트를 생성합니다.

---

## 핵심 요구사항

### 1. LLM Provider
- **Claude API** (Anthropic) 단독 사용
  - 한국어 작문 능력이 가장 우수
  - 코드 이해 및 설명 능력 탁월

### 2. 입력 형태 (Phase 1)
| 입력 타입 | 설명 | 예시 |
|-----------|------|------|
| 텍스트 | 메모, 학습 노트, 코드 스니펫 | 직접 입력한 학습 내용 |
| URL | 웹 페이지 주소 | 블로그, 문서, 튜토리얼 링크 |

*(파일 업로드는 Phase 2 이후 고려)*

### 3. RAG (Retrieval Augmented Generation) 지원
- **Vector DB**: PostgreSQL `pgvector` 활용
- **Embeddings**: 로컬 경량 모델 (`fastembed` 등) 또는 API 활용
- **목적**: 과거 내가 쓴 TIL 스타일 참조 및 중복 내용 방지 (Phase 2)

### 4. 출력 방식
- **SSE 스트리밍**: 실시간으로 생성되는 내용을 보여줌 (UX)
- 생성 완료 후 Markdown 에디터에 자동 입력

### 5. 자동화 기능
| 기능 | 설명 |
|------|------|
| 태그 자동 추천 | 콘텐츠 분석 후 기존 태그 중 적합한 것 추천 |
| Day Number 자동 설정 | 기존 최대 day_number + 1 자동 계산 |
| 요약/제목 자동 생성 | 콘텐츠 기반 생성 |

---

## 사용자 플로우

```
1. /admin/tils/new (또는 에디터 내 "AI 작성")
2. 입력 방식 선택 (URL / 텍스트)
3. 콘텐츠 입력
4. "초안 생성" 클릭
5. 실시간 스트리밍으로 에디터에 내용 채워짐
6. 사용자 검토 및 수정
7. 저장/발행
```

---

## 기술 스택

### Backend
- Python 3.11+, FastAPI
- SQLAlchemy 2.0 (async) + **pgvector**
- **anthropic** (LLM Client)
- **fastembed** (Embeddings)

### 콘텐츠 처리
- httpx, beautifulsoup4, readability-lxml (URL 분석)

### 스트리밍
- sse-starlette

---

## 관련 문서

- [01-architecture.md](./01-architecture.md) - 전체 아키텍처
- [02-llm-providers.md](./02-llm-providers.md) - LLM Provider 설계
- [03-content-extraction.md](./03-content-extraction.md) - 콘텐츠 추출
- [07-implementation.md](./07-implementation.md) - 구현 계획
