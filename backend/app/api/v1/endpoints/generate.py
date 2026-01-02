"""AI TIL 생성 API 엔드포인트"""

import json
from typing import Optional

from fastapi import APIRouter, HTTPException, status, UploadFile, File
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import AdminAuth, DbSession
from app.services.ai.generator import TILGenerator
from app.crud import til as til_crud


router = APIRouter(prefix="/generate", tags=["generate"])


# ============================================================
# Schemas
# ============================================================

class GenerateRequest(BaseModel):
    """TIL 생성 요청"""
    input_type: str = Field(
        ...,
        description="입력 타입: 'text', 'url', 또는 'file'",
        pattern="^(text|url|file)$"
    )
    content: Optional[str] = Field(
        None,
        description="텍스트 내용 또는 URL (input_type이 'file'이 아닐 때 필수)",
        min_length=1
    )


class GeneratePreviewResponse(BaseModel):
    """생성 미리보기 응답"""
    day_number: int
    title: str
    excerpt: str
    content: str


class NextDayResponse(BaseModel):
    """다음 Day Number"""
    next_day_number: int


# ============================================================
# Endpoints
# ============================================================

@router.get("/next-day", response_model=NextDayResponse)
async def get_next_day_number(
    db: DbSession,
    _: AdminAuth
) -> NextDayResponse:
    """다음 사용 가능한 day_number를 반환합니다."""
    max_day = await til_crud.get_max_day_number(db)
    return NextDayResponse(next_day_number=(max_day or 0) + 1)


@router.post("/stream")
async def generate_stream(
    db: DbSession,
    _: AdminAuth,
    request: GenerateRequest,
):
    """SSE를 통해 실시간으로 TIL을 생성합니다.

    ## SSE 이벤트
    - `day_number`: { "day_number": 15 }
    - `content_chunk`: { "chunk": "..." } (반복)
    - `title`: { "title": "생성된 제목" }
    - `excerpt`: { "excerpt": "생성된 요약" }
    - `complete`: { "success": true, "day_number": 15, "title": "...", "excerpt": "...", "content": "..." }
    - `error`: { "error": "에러 메시지" }
    """
    generator = TILGenerator(db)

    async def event_generator():
        async for event in generator.stream_generate(
            input_type=request.input_type,
            content=request.content,
        ):
            event_type = event["event"]
            event_data = json.dumps(event["data"], ensure_ascii=False)
            yield f"event: {event_type}\ndata: {event_data}\n\n"

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",  # Nginx 프록시 버퍼링 비활성화
        }
    )


@router.post("/preview", response_model=GeneratePreviewResponse)
async def generate_preview(
    db: DbSession,
    _: AdminAuth,
    request: GenerateRequest,
) -> GeneratePreviewResponse:
    """TIL을 생성하고 미리보기를 반환합니다 (비스트리밍)."""
    generator = TILGenerator(db)
    
    try:
        result = await generator.generate(
            input_type=request.input_type,
            content=request.content,
        )
        return GeneratePreviewResponse(**result)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"TIL 생성 실패: {str(e)}"
        )


@router.post("/upload")
async def generate_from_file(
    db: DbSession,
    _: AdminAuth,
    file: UploadFile = File(...),
):
    """업로드된 마크다운 파일로부터 TIL을 생성합니다.
    
    지원 형식: .md, .markdown, .txt, .mdx
    최대 파일 크기: 10MB
    """
    # 파일 확장자 검증
    if not file.filename:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="파일명이 없습니다."
        )
    
    ext = "." + file.filename.rsplit(".", 1)[-1].lower()
    supported_extensions = {".md", ".markdown", ".txt", ".mdx"}
    
    if ext not in supported_extensions:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"지원하지 않는 파일 형식입니다. 지원 형식: {', '.join(supported_extensions)}"
        )
    
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
    
    generator = TILGenerator(db)
    
    async def event_generator():
        async for event in generator.stream_generate(
            input_type="file",
            file=file,
        ):
            event_type = event["event"]
            event_data = json.dumps(event["data"], ensure_ascii=False)
            yield f"event: {event_type}\ndata: {event_data}\n\n"
    
    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",  # Nginx 프록시 버퍼링 비활성화
        }
    )
