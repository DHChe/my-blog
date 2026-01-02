"""TIL 생성기 - 메인 오케스트레이터"""

import json
from typing import AsyncIterator, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from fastapi import UploadFile

from app.services.ai.providers import get_llm_provider
from app.services.ai.prompts import (
    TIL_SYSTEM_PROMPT,
    build_til_prompt,
    TITLE_PROMPT,
    EXCERPT_PROMPT,
)
from app.services.content.extractors.url import ContentProcessor
from app.crud import til as til_crud


class TILGenerator:
    """TIL 생성 오케스트레이터"""

    def __init__(self, db: Optional[AsyncSession] = None):
        self.db = db
        self.provider = get_llm_provider("anthropic")
        self.content_processor = ContentProcessor()

    async def get_next_day_number(self) -> int:
        """다음 day_number 반환"""
        if not self.db:
            return 1
        max_day = await til_crud.get_max_day_number(self.db)
        return (max_day or 0) + 1

    async def stream_generate(
        self,
        input_type: str,
        content: Optional[str] = None,
        file: Optional[UploadFile] = None,
    ) -> AsyncIterator[dict]:
        """SSE 스트리밍 TIL 생성
        
        Args:
            input_type: "text", "url", 또는 "file"
            content: 텍스트 내용 또는 URL (input_type이 "file"이 아닐 때)
            file: 업로드된 파일 (input_type이 "file"일 때)
        
        Yields:
            SSE 이벤트 딕셔너리
        """
        try:
            # 1. Day Number
            day_number = await self.get_next_day_number()
            yield {"event": "day_number", "data": {"day_number": day_number}}

            # 2. 콘텐츠 처리
            processed_content = await self.content_processor.process(
                input_type=input_type,
                content=content,
                file=file,
            )

            # 3. TIL 콘텐츠 스트리밍
            prompt = build_til_prompt(processed_content)
            content_buffer = []
            
            async for chunk in self.provider.generate_stream(
                prompt, TIL_SYSTEM_PROMPT
            ):
                content_buffer.append(chunk)
                yield {"event": "content_chunk", "data": {"chunk": chunk}}

            full_content = "".join(content_buffer)

            # 4. 제목 생성
            title = await self._generate_title(full_content)
            yield {"event": "title", "data": {"title": title}}

            # 5. 요약 생성
            excerpt = await self._generate_excerpt(full_content)
            yield {"event": "excerpt", "data": {"excerpt": excerpt}}

            # 6. 완료
            yield {
                "event": "complete",
                "data": {
                    "success": True,
                    "day_number": day_number,
                    "title": title,
                    "excerpt": excerpt,
                    "content": full_content,
                }
            }

        except Exception as e:
            yield {"event": "error", "data": {"error": str(e)}}

    async def generate(
        self,
        input_type: str,
        content: Optional[str] = None,
        file: Optional[UploadFile] = None,
    ) -> dict:
        """일괄 생성 (비스트리밍)
        
        Args:
            input_type: "text", "url", 또는 "file"
            content: 텍스트 내용 또는 URL (input_type이 "file"이 아닐 때)
            file: 업로드된 파일 (input_type이 "file"일 때)
        """
        # 콘텐츠 처리
        processed_content = await self.content_processor.process(
            input_type=input_type,
            content=content,
            file=file,
        )

        # TIL 콘텐츠 생성
        prompt = build_til_prompt(processed_content)
        response = await self.provider.generate(prompt, TIL_SYSTEM_PROMPT)
        full_content = response.content

        # 제목/요약 생성
        title = await self._generate_title(full_content)
        excerpt = await self._generate_excerpt(full_content)
        day_number = await self.get_next_day_number()

        return {
            "day_number": day_number,
            "title": title,
            "excerpt": excerpt,
            "content": full_content,
        }

    async def _generate_title(self, content: str) -> str:
        """콘텐츠 기반 제목 생성"""
        prompt = TITLE_PROMPT.format(content=content[:2000])
        response = await self.provider.generate(prompt)
        return response.content.strip().strip('"').strip("'")

    async def _generate_excerpt(self, content: str) -> str:
        """콘텐츠 기반 요약 생성"""
        prompt = EXCERPT_PROMPT.format(content=content[:3000])
        response = await self.provider.generate(prompt)
        return response.content.strip()[:200]


async def generate_book_note_summary(content: str, key_takeaways: list[str]) -> str:
    """독서 노트의 짧은 AI 요약 생성
    
    Args:
        content: 노트 본문
        key_takeaways: 핵심 포인트 목록
        
    Returns:
        짧은 요약 (최대 150자)
    """
    from app.services.ai.prompts import BOOK_SUMMARY_PROMPT
    
    provider = get_llm_provider("anthropic")
    
    takeaways_text = "\n".join(f"- {t}" for t in key_takeaways) if key_takeaways else "없음"
    prompt = BOOK_SUMMARY_PROMPT.format(
        content=content[:2000],
        key_takeaways=takeaways_text,
    )
    
    response = await provider.generate(prompt)
    return response.content.strip()[:150]

