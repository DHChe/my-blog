# SSE 스트리밍 구현

## 개요

Server-Sent Events (SSE)를 사용하여 TIL 생성 과정을 실시간으로 클라이언트에 전달합니다.

---

## SSE 이벤트 구조

### 이벤트 타입

| Event | Data | 설명 |
|-------|------|------|
| `day_number` | `{ "day_number": 15 }` | 자동 계산된 day number |
| `content_chunk` | `{ "chunk": "..." }` | 콘텐츠 생성 청크 (반복) |
| `title` | `{ "title": "..." }` | 생성된 제목 |
| `excerpt` | `{ "excerpt": "..." }` | 생성된 요약 |
| `tags` | `{ "tags": [...] }` | 추천 태그 목록 |
| `complete` | `{ "success": true }` | 생성 완료 |
| `error` | `{ "error": "..." }` | 에러 발생 |

### 이벤트 순서

```
1. day_number      (auto_day_number가 true인 경우)
2. content_chunk   (반복 - 메인 콘텐츠)
3. title           (콘텐츠 기반 제목 생성)
4. excerpt         (auto_excerpt가 true인 경우)
5. tags            (auto_tags가 true인 경우)
6. complete        (성공 시)
   또는
   error           (실패 시)
```

---

## SSE 유틸리티

```python
# backend/app/services/ai/streaming.py

import json
from typing import AsyncIterator, Any
from dataclasses import dataclass


@dataclass
class SSEEvent:
    """Server-Sent Event"""
    event: str           # 이벤트 타입
    data: Any           # 데이터 (JSON 직렬화)
    id: str | None = None

    def to_sse(self) -> str:
        """SSE 형식 문자열로 변환"""
        lines = []

        if self.id:
            lines.append(f"id: {self.id}")

        lines.append(f"event: {self.event}")

        # 데이터 직렬화
        if isinstance(self.data, str):
            data_str = self.data
        else:
            data_str = json.dumps(self.data, ensure_ascii=False)

        # 멀티라인 데이터 처리
        for line in data_str.split("\n"):
            lines.append(f"data: {line}")

        lines.append("")  # 빈 줄로 이벤트 종료
        return "\n".join(lines) + "\n"


async def stream_til_generation(
    generator: "TILGenerator",
    request: "GenerateRequest",
) -> AsyncIterator[str]:
    """TIL 생성을 스트리밍합니다.

    Args:
        generator: TILGenerator 인스턴스
        request: 생성 요청

    Yields:
        SSE 형식 문자열
    """
    try:
        # 1. Day Number
        if request.auto_day_number:
            day_number = await generator.get_next_day_number()
            yield SSEEvent(
                event="day_number",
                data={"day_number": day_number}
            ).to_sse()

        # 2. 콘텐츠 스트리밍
        content_buffer = []
        async for chunk in generator.stream_content(request):
            content_buffer.append(chunk)
            yield SSEEvent(
                event="content_chunk",
                data={"chunk": chunk}
            ).to_sse()

        full_content = "".join(content_buffer)

        # 3. 제목 생성
        title = await generator.generate_title(full_content)
        yield SSEEvent(
            event="title",
            data={"title": title}
        ).to_sse()

        # 4. 요약 생성
        if request.auto_excerpt:
            excerpt = await generator.generate_excerpt(full_content)
            yield SSEEvent(
                event="excerpt",
                data={"excerpt": excerpt}
            ).to_sse()

        # 5. 태그 추천
        if request.auto_tags:
            tags = await generator.recommend_tags(full_content)
            yield SSEEvent(
                event="tags",
                data={"tags": tags}
            ).to_sse()

        # 6. 완료
        yield SSEEvent(
            event="complete",
            data={"success": True}
        ).to_sse()

    except Exception as e:
        # 에러 이벤트
        yield SSEEvent(
            event="error",
            data={"error": str(e)}
        ).to_sse()
```

---

## TIL Generator 스트리밍

```python
# backend/app/services/ai/generator.py

from typing import AsyncIterator
from sqlalchemy.ext.asyncio import AsyncSession

from app.schemas.generate import GenerateRequest, GeneratePreviewResponse
from app.services.ai.providers import LLMProviderFactory
from app.services.ai.prompts.til_generator import (
    TIL_SYSTEM_PROMPT,
    build_til_prompt,
    TITLE_PROMPT,
    EXCERPT_PROMPT,
)
from app.services.ai.streaming import stream_til_generation, SSEEvent
from app.services.content.processor import ContentProcessor
from app.crud import til as til_crud, tag as tag_crud
from app.utils.slug import generate_slug
from app.config import settings


class TILGenerator:
    """TIL 생성 오케스트레이터"""

    def __init__(self, db: AsyncSession, provider_type: str):
        self.db = db
        self.provider_type = provider_type
        config = settings.get_llm_config(provider_type)
        self.provider = LLMProviderFactory.create(config)
        self.content_processor = ContentProcessor()

    async def get_next_day_number(self) -> int:
        """다음 day_number 반환"""
        max_day = await til_crud.get_max_day_number(self.db)
        return (max_day or 0) + 1

    def generate_stream(
        self,
        request: GenerateRequest
    ) -> AsyncIterator[str]:
        """스트리밍 생성"""
        return stream_til_generation(self, request)

    async def stream_content(
        self,
        request: GenerateRequest
    ) -> AsyncIterator[str]:
        """메인 콘텐츠 스트리밍"""
        # 입력 처리
        input_content = await self.content_processor.process(
            input_type=request.input_type.value,
            content=request.content,
        )

        # 프롬프트 구성
        prompt = build_til_prompt(input_content)

        # LLM 스트리밍
        async for chunk in self.provider.generate_stream(
            prompt,
            TIL_SYSTEM_PROMPT
        ):
            yield chunk

    async def generate_title(self, content: str) -> str:
        """콘텐츠 기반 제목 생성"""
        prompt = TITLE_PROMPT.format(content=content[:2000])
        response = await self.provider.generate(prompt)
        return response.content.strip().strip('"').strip("'")

    async def generate_excerpt(self, content: str) -> str:
        """콘텐츠 기반 요약 생성"""
        prompt = EXCERPT_PROMPT.format(content=content[:3000])
        response = await self.provider.generate(prompt)
        return response.content.strip()[:500]

    async def recommend_tags(
        self,
        content: str
    ) -> list[dict]:
        """태그 추천"""
        # 기존 태그 조회
        existing_tags = await tag_crud.get_all_tags(self.db)
        tag_names = [t.name for t in existing_tags]

        prompt = f"""다음 TIL 콘텐츠에 맞는 태그를 추천해주세요.

기존 태그 목록: {', '.join(tag_names) if tag_names else '없음'}

콘텐츠:
{content[:3000]}

규칙:
1. 기존 태그 중 적합한 것을 우선 사용
2. 새 태그가 필요하면 소문자-하이픈 형식으로
3. 최대 5개까지만
4. 태그 이름만 한 줄에 하나씩 출력"""

        response = await self.provider.generate(prompt)
        recommended = [
            t.strip()
            for t in response.content.strip().split("\n")
            if t.strip()
        ][:5]

        # 기존 태그와 매칭
        result = []
        tag_map = {t.name.lower(): t for t in existing_tags}

        for name in recommended:
            if name.lower() in tag_map:
                tag = tag_map[name.lower()]
                result.append({
                    "id": str(tag.id),
                    "name": tag.name,
                    "slug": tag.slug,
                    "is_new": False,
                })
            else:
                result.append({
                    "id": None,
                    "name": name,
                    "slug": generate_slug(name),
                    "is_new": True,
                })

        return result

    async def generate_preview(
        self,
        request: GenerateRequest
    ) -> GeneratePreviewResponse:
        """일괄 생성 (비스트리밍)"""
        # 입력 처리
        input_content = await self.content_processor.process(
            input_type=request.input_type.value,
            content=request.content,
        )

        # 콘텐츠 생성
        prompt = build_til_prompt(input_content)
        response = await self.provider.generate(prompt, TIL_SYSTEM_PROMPT)
        content = response.content

        # Day number
        day_number = 1
        if request.auto_day_number:
            day_number = await self.get_next_day_number()

        # 제목 생성
        title = await self.generate_title(content)

        # 요약 생성
        excerpt = ""
        if request.auto_excerpt:
            excerpt = await self.generate_excerpt(content)

        # 태그 추천
        suggested_tags = []
        suggested_tag_ids = []
        if request.auto_tags:
            tags = await self.recommend_tags(content)
            for tag in tags:
                suggested_tags.append(tag["name"])
                if tag["id"]:
                    suggested_tag_ids.append(tag["id"])

        return GeneratePreviewResponse(
            title=title,
            slug=generate_slug(title),
            day_number=day_number,
            excerpt=excerpt,
            content=content,
            suggested_tag_ids=suggested_tag_ids,
            suggested_tags=suggested_tags,
        )
```

---

## 프론트엔드 통합 예시

### EventSource 사용

```typescript
// Frontend SSE 클라이언트 예시

interface GenerateRequest {
  input_type: 'text' | 'url' | 'file';
  content: string;
  provider: 'anthropic' | 'openai' | 'google';
  auto_day_number: boolean;
  auto_tags: boolean;
  auto_excerpt: boolean;
}

async function* streamGenerate(request: GenerateRequest) {
  const response = await fetch('/api/v1/generate/stream', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify(request),
  });

  const reader = response.body?.getReader();
  const decoder = new TextDecoder();

  let buffer = '';

  while (true) {
    const { done, value } = await reader!.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });

    const lines = buffer.split('\n');
    buffer = lines.pop() || '';

    let currentEvent = '';
    let currentData = '';

    for (const line of lines) {
      if (line.startsWith('event: ')) {
        currentEvent = line.slice(7);
      } else if (line.startsWith('data: ')) {
        currentData = line.slice(6);
      } else if (line === '') {
        if (currentEvent && currentData) {
          yield {
            event: currentEvent,
            data: JSON.parse(currentData),
          };
        }
        currentEvent = '';
        currentData = '';
      }
    }
  }
}

// 사용 예시
async function handleGenerate() {
  const request: GenerateRequest = {
    input_type: 'text',
    content: '오늘 배운 TypeScript 제네릭...',
    provider: 'anthropic',
    auto_day_number: true,
    auto_tags: true,
    auto_excerpt: true,
  };

  for await (const { event, data } of streamGenerate(request)) {
    switch (event) {
      case 'day_number':
        setDayNumber(data.day_number);
        break;
      case 'content_chunk':
        appendContent(data.chunk);
        break;
      case 'title':
        setTitle(data.title);
        break;
      case 'excerpt':
        setExcerpt(data.excerpt);
        break;
      case 'tags':
        setSuggestedTags(data.tags);
        break;
      case 'complete':
        setIsComplete(true);
        break;
      case 'error':
        setError(data.error);
        break;
    }
  }
}
```

---

## 에러 처리

### 재시도 로직

```python
# backend/app/services/ai/retry.py

import asyncio
from functools import wraps
from typing import Callable, TypeVar
import logging

logger = logging.getLogger(__name__)

T = TypeVar("T")


def with_retry(
    max_retries: int = 3,
    base_delay: float = 1.0,
    max_delay: float = 60.0,
    retryable_exceptions: tuple = (Exception,),
):
    """재시도 데코레이터 (지수 백오프)"""

    def decorator(func: Callable) -> Callable:
        @wraps(func)
        async def wrapper(*args, **kwargs) -> T:
            last_error = None

            for attempt in range(max_retries + 1):
                try:
                    return await func(*args, **kwargs)
                except retryable_exceptions as e:
                    last_error = e

                    if attempt == max_retries:
                        logger.error(
                            f"최대 재시도 횟수 초과: {func.__name__}"
                        )
                        raise

                    delay = min(
                        base_delay * (2 ** attempt),
                        max_delay
                    )

                    logger.warning(
                        f"재시도 {attempt + 1}/{max_retries}: "
                        f"{func.__name__} ({delay:.1f}s 후)"
                    )

                    await asyncio.sleep(delay)

            raise last_error

        return wrapper
    return decorator
```

### 스트리밍 에러 처리

스트리밍 중 에러가 발생하면 `error` 이벤트를 전송하고 스트림을 종료합니다:

```python
try:
    # ... 생성 로직 ...
except Exception as e:
    yield SSEEvent(
        event="error",
        data={"error": str(e)}
    ).to_sse()
    return  # 스트림 종료
```
