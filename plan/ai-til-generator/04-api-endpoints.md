# API 엔드포인트 설계

## 엔드포인트 개요

| Endpoint | Method | 설명 | 인증 |
|----------|--------|------|------|
| `/api/v1/generate/stream` | POST | SSE 스트리밍 TIL 생성 | Admin |
| `/api/v1/generate/preview` | POST | 일괄 생성 (비스트리밍) | Admin |
| `/api/v1/generate/upload` | POST | 파일 업로드 후 생성 | Admin |
| `/api/v1/generate/save` | POST | 생성된 TIL 저장 | Admin |
| `/api/v1/generate/next-day` | GET | 다음 day_number 조회 | Admin |
| `/api/v1/generate/providers` | GET | 사용 가능한 provider 목록 | Admin |

---

## 스키마 정의

```python
# backend/app/schemas/generate.py

from enum import Enum
from typing import Optional
from uuid import UUID
from pydantic import BaseModel, Field, HttpUrl


class InputType(str, Enum):
    """입력 타입"""
    TEXT = "text"
    URL = "url"
    FILE = "file"


class LLMProviderType(str, Enum):
    """LLM Provider 타입"""
    ANTHROPIC = "anthropic"
    OPENAI = "openai"
    GOOGLE = "google"


class GenerateRequest(BaseModel):
    """TIL 생성 요청"""
    input_type: InputType
    content: Optional[str] = Field(
        None,
        description="텍스트 내용 또는 URL"
    )
    provider: LLMProviderType = LLMProviderType.ANTHROPIC
    model: Optional[str] = Field(
        None,
        description="사용할 모델 (없으면 기본값)"
    )

    # 옵션
    auto_day_number: bool = True
    auto_tags: bool = True
    auto_excerpt: bool = True


class GeneratePreviewResponse(BaseModel):
    """생성 미리보기 응답"""
    title: str
    slug: str
    day_number: int
    excerpt: str
    content: str
    suggested_tag_ids: list[UUID]
    suggested_tags: list[str]  # 태그 이름 (표시용)


class GenerateSaveRequest(BaseModel):
    """생성된 TIL 저장 요청"""
    title: str
    day_number: int
    excerpt: str = Field(..., max_length=500)
    content: str
    tag_ids: list[UUID] = Field(default_factory=list)
    is_published: bool = False


class ProviderInfo(BaseModel):
    """Provider 정보"""
    name: str
    available: bool
    default_model: str
    models: list[str]


class ProvidersResponse(BaseModel):
    """사용 가능한 Provider 목록"""
    default: str
    providers: list[ProviderInfo]


class NextDayResponse(BaseModel):
    """다음 Day Number"""
    next_day_number: int
```

---

## 엔드포인트 구현

```python
# backend/app/api/v1/endpoints/generate.py

from typing import Optional
from uuid import UUID

from fastapi import APIRouter, HTTPException, UploadFile, File, Form, status
from sse_starlette.sse import EventSourceResponse

from app.api.deps import AdminAuth, DbSession
from app.schemas.generate import (
    GenerateRequest,
    GeneratePreviewResponse,
    GenerateSaveRequest,
    InputType,
    LLMProviderType,
    ProvidersResponse,
    ProviderInfo,
    NextDayResponse,
)
from app.schemas.til import TILResponse, TILCreate
from app.services.ai.generator import TILGenerator
from app.services.content.processor import ContentProcessor
from app.crud import til as til_crud
from app.config import settings


router = APIRouter(prefix="/generate", tags=["generate"])


# ============================================================
# GET /generate/providers - 사용 가능한 Provider 목록
# ============================================================

@router.get("/providers", response_model=ProvidersResponse)
async def list_providers(_: AdminAuth) -> ProvidersResponse:
    """사용 가능한 LLM Provider 목록을 반환합니다."""

    providers = []

    # Anthropic
    providers.append(ProviderInfo(
        name="anthropic",
        available=bool(settings.ANTHROPIC_API_KEY),
        default_model=settings.ANTHROPIC_MODEL,
        models=["claude-sonnet-4-20250514", "claude-3-5-haiku-20241022"],
    ))

    # OpenAI
    providers.append(ProviderInfo(
        name="openai",
        available=bool(settings.OPENAI_API_KEY),
        default_model=settings.OPENAI_MODEL,
        models=["gpt-4o", "gpt-4o-mini", "gpt-4-turbo"],
    ))

    # Google
    providers.append(ProviderInfo(
        name="google",
        available=bool(settings.GOOGLE_API_KEY),
        default_model=settings.GOOGLE_MODEL,
        models=["gemini-1.5-pro", "gemini-1.5-flash"],
    ))

    return ProvidersResponse(
        default=settings.DEFAULT_LLM_PROVIDER,
        providers=providers,
    )


# ============================================================
# GET /generate/next-day - 다음 Day Number 조회
# ============================================================

@router.get("/next-day", response_model=NextDayResponse)
async def get_next_day_number(
    db: DbSession,
    _: AdminAuth
) -> NextDayResponse:
    """다음 사용 가능한 day_number를 반환합니다."""
    max_day = await til_crud.get_max_day_number(db)
    return NextDayResponse(next_day_number=(max_day or 0) + 1)


# ============================================================
# POST /generate/stream - SSE 스트리밍 TIL 생성
# ============================================================

@router.post("/stream")
async def generate_stream(
    db: DbSession,
    _: AdminAuth,
    request: GenerateRequest,
) -> EventSourceResponse:
    """SSE를 통해 실시간으로 TIL을 생성합니다.

    ## SSE 이벤트
    - `day_number`: { "day_number": 15 }
    - `content_chunk`: { "chunk": "..." } (반복)
    - `title`: { "title": "생성된 제목" }
    - `excerpt`: { "excerpt": "생성된 요약" }
    - `tags`: { "tags": [{"id": "...", "name": "..."}] }
    - `complete`: { "success": true }
    - `error`: { "error": "에러 메시지" }
    """
    generator = TILGenerator(db, request.provider)
    return EventSourceResponse(generator.generate_stream(request))


# ============================================================
# POST /generate/preview - 일괄 생성 (비스트리밍)
# ============================================================

@router.post("/preview", response_model=GeneratePreviewResponse)
async def generate_preview(
    db: DbSession,
    _: AdminAuth,
    request: GenerateRequest,
) -> GeneratePreviewResponse:
    """TIL을 생성하고 미리보기를 반환합니다 (비스트리밍)."""
    generator = TILGenerator(db, request.provider)
    return await generator.generate_preview(request)


# ============================================================
# POST /generate/upload - 파일 업로드 후 생성
# ============================================================

@router.post("/upload")
async def generate_from_file(
    db: DbSession,
    _: AdminAuth,
    file: UploadFile = File(...),
    provider: LLMProviderType = Form(LLMProviderType.ANTHROPIC),
    auto_day_number: bool = Form(True),
    auto_tags: bool = Form(True),
    auto_excerpt: bool = Form(True),
    stream: bool = Form(False),
):
    """업로드된 파일로부터 TIL을 생성합니다.

    지원 형식: PDF, 이미지 (PNG, JPEG, GIF, WebP), 코드 파일
    """
    # 파일 크기 검증
    MAX_SIZE = 10 * 1024 * 1024  # 10MB
    content = await file.read()
    if len(content) > MAX_SIZE:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"파일 크기는 {MAX_SIZE // 1024 // 1024}MB를 초과할 수 없습니다",
        )

    # 파일 포인터 되감기 (processor에서 다시 읽을 수 있도록)
    await file.seek(0)

    # 콘텐츠 추출
    processor = ContentProcessor()
    extracted_text = await processor.process(
        input_type="file",
        file=file,
    )

    # 생성 요청 구성
    request = GenerateRequest(
        input_type=InputType.TEXT,
        content=extracted_text,
        provider=provider,
        auto_day_number=auto_day_number,
        auto_tags=auto_tags,
        auto_excerpt=auto_excerpt,
    )

    generator = TILGenerator(db, provider)

    if stream:
        return EventSourceResponse(generator.generate_stream(request))
    return await generator.generate_preview(request)


# ============================================================
# POST /generate/save - 생성된 TIL 저장
# ============================================================

@router.post(
    "/save",
    response_model=TILResponse,
    status_code=status.HTTP_201_CREATED
)
async def save_generated(
    db: DbSession,
    _: AdminAuth,
    request: GenerateSaveRequest,
) -> TILResponse:
    """생성된 TIL을 데이터베이스에 저장합니다."""

    # day_number 중복 검사
    existing = await til_crud.get_til_by_day_number(db, request.day_number)
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Day {request.day_number}의 TIL이 이미 존재합니다",
        )

    # TIL 생성
    til_create = TILCreate(
        title=request.title,
        day_number=request.day_number,
        excerpt=request.excerpt,
        content=request.content,
        tag_ids=request.tag_ids,
        is_published=request.is_published,
    )

    til = await til_crud.create_til(db, til_create)
    return TILResponse.model_validate(til)
```

---

## 라우터 등록

```python
# backend/app/api/v1/router.py

from fastapi import APIRouter

from app.api.v1.endpoints import tags, tils, generate  # generate 추가

api_router = APIRouter()

api_router.include_router(tags.router)
api_router.include_router(tils.router)
api_router.include_router(generate.router)  # NEW
```

---

## CRUD 확장

```python
# backend/app/crud/til.py (추가)

from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.til import TIL


async def get_max_day_number(db: AsyncSession) -> int | None:
    """기존 TIL 중 최대 day_number를 반환합니다.

    Returns:
        최대 day_number 또는 TIL이 없으면 None
    """
    result = await db.execute(
        select(func.max(TIL.day_number))
    )
    return result.scalar()
```

---

## 에러 응답

| 상태 코드 | 상황 |
|-----------|------|
| 400 | 잘못된 입력, day_number 중복 |
| 401 | 인증 필요 |
| 413 | 파일 크기 초과 |
| 422 | 유효성 검증 실패 |
| 500 | LLM API 오류, 콘텐츠 추출 실패 |

### 에러 응답 형식

```json
{
    "detail": "에러 메시지"
}
```

### SSE 에러 이벤트

```
event: error
data: {"error": "LLM API 호출 실패: Rate limit exceeded"}
```
