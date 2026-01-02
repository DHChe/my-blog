# 전체 아키텍처

## 시스템 아키텍처

```
┌─────────────────────────────────────────────────────────────────┐
│                         Frontend (Next.js)                       │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │  AI Assistant (Sidebar / Editor)                            │ │
│  │  ┌─────────────┐  ┌─────────────────────┐                   │ │
│  │  │ Input       │  │ Streaming Content   │                   │ │
│  │  │ (Text/URL)  │→ │ Display             │                   │ │
│  │  └─────────────┘  └─────────────────────┘                   │ │
│  └─────────────────────────────────────────────────────────────┘ │
└────────────────────────────────┬────────────────────────────────┘
                                 │ HTTP/SSE
                                 ▼
┌─────────────────────────────────────────────────────────────────┐
│                         Backend (FastAPI)                        │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │  /api/v1/generate/*                                         │ │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐  │ │
│  │  │ Content     │→ │ TIL         │→ │ SSE                 │  │ │
│  │  │ Processor   │  │ Generator   │  │ Streamer            │  │ │
│  │  └─────────────┘  └──────┬──────┘  └─────────────────────┘  │ │
│  │                          │                                   │ │
│  │         ┌────────────────┴─────────────────┐                 │ │
│  │         ▼                                  ▼                 │ │
│  │  ┌─────────────┐                    ┌─────────────┐          │ │
│  │  │ Anthropic   │                    │ Embedding   │          │ │
│  │  │ (Claude)    │                    │ Service     │          │ │
│  │  └─────────────┘                    └──────┬──────┘          │ │
│  │                                            │                 │ │
│  │                                            ▼                 │ │
│  │                                     ┌─────────────┐          │ │
│  │                                     │ Vector Store│          │ │
│  │                                     │ (pgvector)  │          │ │
│  │                                     └─────────────┘          │ │
│  └─────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

---

## 디렉토리 구조

```
backend/app/
├── services/                          # 비즈니스 로직 레이어
│   ├── __init__.py
│   ├── ai/                            # AI 관련 서비스
│   │   ├── __init__.py
│   │   ├── providers/                 # LLM Provider 구현체들
│   │   │   ├── __init__.py            # Provider Factory
│   │   │   ├── base.py                # 추상 베이스 클래스
│   │   │   ├── anthropic.py           # Claude 구현
│   │   │   ├── openai.py              # OpenAI 구현
│   │   │   └── google.py              # Gemini 구현
│   │   ├── prompts/                   # 프롬프트 템플릿
│   │   │   ├── __init__.py
│   │   │   └── til_generator.py       # TIL 생성 프롬프트
│   │   ├── generator.py               # TIL 생성 오케스트레이터
│   │   ├── streaming.py               # SSE 유틸리티
│   │   ├── exceptions.py              # 커스텀 예외
│   │   └── retry.py                   # 재시도 로직
│   └── content/                       # 콘텐츠 처리 서비스
│       ├── __init__.py
│       ├── extractors/                # 콘텐츠 추출기
│       │   ├── __init__.py
│       │   ├── base.py                # 추상 베이스 클래스
│       │   ├── url.py                 # URL 콘텐츠 추출
│       │   ├── pdf.py                 # PDF 추출
│       │   └── image.py               # 이미지 Vision
│       └── processor.py               # 콘텐츠 전처리 오케스트레이터
├── api/v1/endpoints/
│   ├── tils.py                        # 기존 TIL CRUD
│   └── generate.py                    # NEW: AI 생성 엔드포인트
├── schemas/
│   ├── til.py                         # 기존 TIL 스키마
│   └── generate.py                    # NEW: 생성 관련 스키마
├── crud/
│   └── til.py                         # get_max_day_number() 추가
└── config.py                          # LLM 설정 추가
```

---

## 핵심 컴포넌트 관계

```
┌──────────────────────────────────────────────────────────────┐
│                        TILGenerator                          │
│  (Orchestrator - 전체 생성 플로우 조율)                        │
├──────────────────────────────────────────────────────────────┤
│  - get_next_day_number()                                     │
│  - generate_preview(request) → GeneratePreviewResponse       │
│  - generate_stream(request) → AsyncIterator[SSEEvent]        │
│  - generate_title(content) → str                             │
│  - generate_excerpt(content) → str                           │
│  - recommend_tags(content) → list[Tag]                       │
└──────────────────────────────────────────────────────────────┘
                              │
           ┌──────────────────┼──────────────────┐
           ▼                  ▼                  ▼
┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐
│ ContentProcessor│  │ LLMProvider     │  │ TagCRUD         │
│                 │  │ (Abstract)      │  │                 │
├─────────────────┤  ├─────────────────┤  ├─────────────────┤
│ - extract_url() │  │ - generate()    │  │ - get_all()     │
│ - extract_file()│  │ - stream()      │  │ - get_by_id()   │
│ - preprocess()  │  │ - health_check()│  │                 │
└─────────────────┘  └─────────────────┘  └─────────────────┘
        │                    │
        ▼                    ▼
┌─────────────────┐  ┌─────────────────────────────────────────┐
│ Extractors      │  │ Concrete Providers                      │
├─────────────────┤  ├─────────────────────────────────────────┤
│ - URLExtractor  │  │ - AnthropicProvider (Claude)            │
│ - PDFExtractor  │  │ - OpenAIProvider (GPT-4)                │
│ - ImageExtractor│  │ - GoogleProvider (Gemini)               │
└─────────────────┘  └─────────────────────────────────────────┘
```

---

## 데이터 흐름

### 스트리밍 생성 플로우

```
1. 입력 수신
   ┌────────────────────────────────────────────────┐
   │ POST /api/v1/generate/stream                   │
   │ { input_type, content, provider, options }     │
   └────────────────────────────────────────────────┘
                         │
                         ▼
2. 콘텐츠 추출 (URL/파일인 경우)
   ┌────────────────────────────────────────────────┐
   │ ContentProcessor.extract()                     │
   │ → 텍스트 변환                                    │
   └────────────────────────────────────────────────┘
                         │
                         ▼
3. SSE 연결 설정
   ┌────────────────────────────────────────────────┐
   │ EventSourceResponse 생성                       │
   │ Content-Type: text/event-stream               │
   └────────────────────────────────────────────────┘
                         │
                         ▼
4. 스트리밍 이벤트 전송
   ┌────────────────────────────────────────────────┐
   │ event: day_number                             │
   │ event: content_chunk (반복)                    │
   │ event: title                                  │
   │ event: excerpt                                │
   │ event: tags                                   │
   │ event: complete                               │
   └────────────────────────────────────────────────┘
                         │
                         ▼
5. 저장 (선택)
   ┌────────────────────────────────────────────────┐
   │ POST /api/v1/generate/save                    │
   │ → TIL 레코드 생성                               │
   └────────────────────────────────────────────────┘
```

---

## 환경 변수

```bash
# 기본 설정
DEFAULT_LLM_PROVIDER=anthropic    # anthropic | openai | google

# Anthropic (Claude)
ANTHROPIC_API_KEY=sk-ant-...
ANTHROPIC_MODEL=claude-sonnet-4-20250514
ANTHROPIC_MAX_TOKENS=4096

# OpenAI
OPENAI_API_KEY=sk-...
OPENAI_MODEL=gpt-4o
OPENAI_MAX_TOKENS=4096

# Google (Gemini)
GOOGLE_API_KEY=...
GOOGLE_MODEL=gemini-1.5-pro
GOOGLE_MAX_TOKENS=4096

# 생성 설정
LLM_TEMPERATURE=0.7
LLM_TIMEOUT=60
MAX_CONTENT_LENGTH=50000
MAX_RETRIES=3

# 콘텐츠 추출
URL_FETCH_TIMEOUT=30
MAX_FILE_SIZE=10485760  # 10MB
```
