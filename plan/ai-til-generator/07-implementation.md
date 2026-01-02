# 구현 계획 (Refined)

## 구현 순서

### Phase 1: MVP (Claude + URL/Text Coverage)

#### 1.1 기본 설정 & 의존성
**파일**: `backend/requirements.txt`
```txt
anthropic>=0.40.0       # LLM Client (Main)
httpx>=0.27.0           # URL Fetching
beautifulsoup4>=4.12.0  # HTML Parsing
readability-lxml>=0.8.1 # Main Content Extraction
sse-starlette>=2.0.0    # Streaming
# RAG Prep (Future)
pgvector>=0.2.0
```

#### 1.2 LLM Provider (Claude Only)
**파일**: `backend/app/services/ai/providers/anthropic.py`
- `AnthropicProvider` 단일 구현
- (추상화 계층은 최소화하되, 추후 테스트 용이성을 위해 유지)

#### 1.3 콘텐츠 추출 (URL/Text)
**파일**: `backend/app/services/content/extractors/url.py`
- `URLExtractor` 구현 (readability-lxml 활용)
- 파일 업로드 및 이미지 분석은 Phase 1에서 제외

#### 1.4 API 및 스트리밍
**파일**: `backend/app/api/v1/endpoints/generate.py`
- `/stream` 엔드포인트 구현 (SSE)
- 텍스트/URL 입력 처리

---

### Phase 2: Advanced & RAG

#### 2.1 RAG 인프라
**파일**: `backend/app/db/migrations/`
- `pgvector` 확장을 위한 Alembic 마이그레이션
- `embeddings` 테이블 생성

#### 2.2 Embedding Service
**파일**: `backend/app/services/ai/embedding.py`
- 로컬 모델(`fastembed` 등) 또는 API 연동

#### 2.3 Context Retrieval
- TIL 생성 시 유사한 과거 TIL 검색 후 프롬프트에 주입

---

## 파일 목록 (Phase 1)

| 순서 | 파일 경로 | 설명 |
|------|----------|------|
| 1 | `backend/app/services/ai/providers/base.py` | Provider 인터페이스 |
| 2 | `backend/app/services/ai/providers/anthropic.py` | Claude 구현 |
| 3 | `backend/app/services/content/extractors/url.py` | URL 추출 |
| 4 | `backend/app/services/ai/generator.py` | 생성 로직 (Prompt + Call) |
| 5 | `backend/app/services/ai/streaming.py` | SSE Helper |
| 6 | `backend/api/v1/endpoints/generate.py` | API Endpoint |

## 환경 변수 (Phase 1)

```bash
ANTHROPIC_API_KEY=sk-ant-...  # 필수
ANTHROPIC_MODEL=claude-3-5-sonnet-20240620
```
