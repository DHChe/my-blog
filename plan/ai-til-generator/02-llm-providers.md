# LLM Provider 추상화 설계

## 설계 원칙

1. **Strategy Pattern**: 런타임에 provider 교체 가능
2. **Factory Pattern**: 설정 기반 provider 인스턴스 생성
3. **Async-First**: 모든 API 호출은 비동기
4. **Unified Interface**: 모든 provider가 동일한 인터페이스 구현

---

## 인터페이스 설계

### 1. 기본 타입 정의

```python
# backend/app/services/ai/providers/base.py

from abc import ABC, abstractmethod
from dataclasses import dataclass
from typing import AsyncIterator, Optional
from enum import Enum


class LLMProvider(str, Enum):
    """지원하는 LLM Provider 목록"""
    ANTHROPIC = "anthropic"
    OPENAI = "openai"
    GOOGLE = "google"


@dataclass
class LLMConfig:
    """LLM Provider 설정"""
    provider: LLMProvider
    model: str
    api_key: str
    max_tokens: int = 4096
    temperature: float = 0.7
    timeout: int = 60


@dataclass
class LLMResponse:
    """LLM 응답 통합 형식"""
    content: str
    model: str
    provider: LLMProvider
    usage: Optional[dict] = None      # 토큰 사용량
    finish_reason: Optional[str] = None
```

### 2. 추상 베이스 클래스

```python
class BaseLLMProvider(ABC):
    """LLM Provider 추상 베이스 클래스"""

    def __init__(self, config: LLMConfig):
        self.config = config

    @abstractmethod
    async def generate(
        self,
        prompt: str,
        system_prompt: Optional[str] = None,
    ) -> LLMResponse:
        """완전한 응답 생성 (비스트리밍)"""
        pass

    @abstractmethod
    async def generate_stream(
        self,
        prompt: str,
        system_prompt: Optional[str] = None,
    ) -> AsyncIterator[str]:
        """스트리밍 응답 생성"""
        pass

    @abstractmethod
    async def generate_with_image(
        self,
        prompt: str,
        image_data: str,  # base64 encoded
        image_type: str,  # mime type
        system_prompt: Optional[str] = None,
    ) -> LLMResponse:
        """이미지 포함 응답 생성 (Vision)"""
        pass

    @abstractmethod
    async def health_check(self) -> bool:
        """Provider 상태 확인"""
        pass
```

---

## Provider 구현

### 1. Anthropic (Claude)

```python
# backend/app/services/ai/providers/anthropic.py

import anthropic
from app.services.ai.providers.base import (
    BaseLLMProvider, LLMConfig, LLMResponse, LLMProvider
)


class AnthropicProvider(BaseLLMProvider):
    """Anthropic Claude Provider"""

    DEFAULT_MODEL = "claude-sonnet-4-20250514"

    def __init__(self, config: LLMConfig):
        super().__init__(config)
        self.client = anthropic.AsyncAnthropic(api_key=config.api_key)

    async def generate(
        self,
        prompt: str,
        system_prompt: Optional[str] = None,
    ) -> LLMResponse:
        response = await self.client.messages.create(
            model=self.config.model or self.DEFAULT_MODEL,
            max_tokens=self.config.max_tokens,
            temperature=self.config.temperature,
            system=system_prompt or "",
            messages=[{"role": "user", "content": prompt}],
        )

        return LLMResponse(
            content=response.content[0].text,
            model=response.model,
            provider=LLMProvider.ANTHROPIC,
            usage={
                "input_tokens": response.usage.input_tokens,
                "output_tokens": response.usage.output_tokens,
            },
            finish_reason=response.stop_reason,
        )

    async def generate_stream(
        self,
        prompt: str,
        system_prompt: Optional[str] = None,
    ) -> AsyncIterator[str]:
        async with self.client.messages.stream(
            model=self.config.model or self.DEFAULT_MODEL,
            max_tokens=self.config.max_tokens,
            temperature=self.config.temperature,
            system=system_prompt or "",
            messages=[{"role": "user", "content": prompt}],
        ) as stream:
            async for text in stream.text_stream:
                yield text

    async def generate_with_image(
        self,
        prompt: str,
        image_data: str,
        image_type: str,
        system_prompt: Optional[str] = None,
    ) -> LLMResponse:
        response = await self.client.messages.create(
            model=self.config.model or self.DEFAULT_MODEL,
            max_tokens=self.config.max_tokens,
            system=system_prompt or "",
            messages=[{
                "role": "user",
                "content": [
                    {
                        "type": "image",
                        "source": {
                            "type": "base64",
                            "media_type": image_type,
                            "data": image_data,
                        },
                    },
                    {"type": "text", "text": prompt},
                ],
            }],
        )

        return LLMResponse(
            content=response.content[0].text,
            model=response.model,
            provider=LLMProvider.ANTHROPIC,
        )

    async def health_check(self) -> bool:
        try:
            await self.client.messages.create(
                model="claude-sonnet-4-20250514",
                max_tokens=10,
                messages=[{"role": "user", "content": "hi"}],
            )
            return True
        except Exception:
            return False
```

### 2. OpenAI

```python
# backend/app/services/ai/providers/openai.py

from openai import AsyncOpenAI
from app.services.ai.providers.base import (
    BaseLLMProvider, LLMConfig, LLMResponse, LLMProvider
)


class OpenAIProvider(BaseLLMProvider):
    """OpenAI GPT Provider"""

    DEFAULT_MODEL = "gpt-4o"

    def __init__(self, config: LLMConfig):
        super().__init__(config)
        self.client = AsyncOpenAI(api_key=config.api_key)

    async def generate(
        self,
        prompt: str,
        system_prompt: Optional[str] = None,
    ) -> LLMResponse:
        messages = []
        if system_prompt:
            messages.append({"role": "system", "content": system_prompt})
        messages.append({"role": "user", "content": prompt})

        response = await self.client.chat.completions.create(
            model=self.config.model or self.DEFAULT_MODEL,
            max_tokens=self.config.max_tokens,
            temperature=self.config.temperature,
            messages=messages,
        )

        return LLMResponse(
            content=response.choices[0].message.content,
            model=response.model,
            provider=LLMProvider.OPENAI,
            usage={
                "prompt_tokens": response.usage.prompt_tokens,
                "completion_tokens": response.usage.completion_tokens,
            },
            finish_reason=response.choices[0].finish_reason,
        )

    async def generate_stream(
        self,
        prompt: str,
        system_prompt: Optional[str] = None,
    ) -> AsyncIterator[str]:
        messages = []
        if system_prompt:
            messages.append({"role": "system", "content": system_prompt})
        messages.append({"role": "user", "content": prompt})

        stream = await self.client.chat.completions.create(
            model=self.config.model or self.DEFAULT_MODEL,
            max_tokens=self.config.max_tokens,
            temperature=self.config.temperature,
            messages=messages,
            stream=True,
        )

        async for chunk in stream:
            if chunk.choices[0].delta.content:
                yield chunk.choices[0].delta.content

    async def generate_with_image(
        self,
        prompt: str,
        image_data: str,
        image_type: str,
        system_prompt: Optional[str] = None,
    ) -> LLMResponse:
        messages = []
        if system_prompt:
            messages.append({"role": "system", "content": system_prompt})

        messages.append({
            "role": "user",
            "content": [
                {
                    "type": "image_url",
                    "image_url": {
                        "url": f"data:{image_type};base64,{image_data}"
                    },
                },
                {"type": "text", "text": prompt},
            ],
        })

        response = await self.client.chat.completions.create(
            model=self.config.model or "gpt-4o",
            max_tokens=self.config.max_tokens,
            messages=messages,
        )

        return LLMResponse(
            content=response.choices[0].message.content,
            model=response.model,
            provider=LLMProvider.OPENAI,
        )

    async def health_check(self) -> bool:
        try:
            await self.client.chat.completions.create(
                model="gpt-4o-mini",
                max_tokens=10,
                messages=[{"role": "user", "content": "hi"}],
            )
            return True
        except Exception:
            return False
```

### 3. Google (Gemini)

```python
# backend/app/services/ai/providers/google.py

import google.generativeai as genai
from app.services.ai.providers.base import (
    BaseLLMProvider, LLMConfig, LLMResponse, LLMProvider
)


class GoogleProvider(BaseLLMProvider):
    """Google Gemini Provider"""

    DEFAULT_MODEL = "gemini-1.5-pro"

    def __init__(self, config: LLMConfig):
        super().__init__(config)
        genai.configure(api_key=config.api_key)
        self.model = genai.GenerativeModel(
            model_name=config.model or self.DEFAULT_MODEL,
            generation_config={
                "max_output_tokens": config.max_tokens,
                "temperature": config.temperature,
            },
        )

    async def generate(
        self,
        prompt: str,
        system_prompt: Optional[str] = None,
    ) -> LLMResponse:
        full_prompt = prompt
        if system_prompt:
            full_prompt = f"{system_prompt}\n\n{prompt}"

        response = await self.model.generate_content_async(full_prompt)

        return LLMResponse(
            content=response.text,
            model=self.config.model or self.DEFAULT_MODEL,
            provider=LLMProvider.GOOGLE,
        )

    async def generate_stream(
        self,
        prompt: str,
        system_prompt: Optional[str] = None,
    ) -> AsyncIterator[str]:
        full_prompt = prompt
        if system_prompt:
            full_prompt = f"{system_prompt}\n\n{prompt}"

        response = await self.model.generate_content_async(
            full_prompt,
            stream=True,
        )

        async for chunk in response:
            if chunk.text:
                yield chunk.text

    async def generate_with_image(
        self,
        prompt: str,
        image_data: str,
        image_type: str,
        system_prompt: Optional[str] = None,
    ) -> LLMResponse:
        import base64
        image_bytes = base64.b64decode(image_data)

        image_part = {
            "mime_type": image_type,
            "data": image_bytes,
        }

        full_prompt = prompt
        if system_prompt:
            full_prompt = f"{system_prompt}\n\n{prompt}"

        response = await self.model.generate_content_async([full_prompt, image_part])

        return LLMResponse(
            content=response.text,
            model=self.config.model or self.DEFAULT_MODEL,
            provider=LLMProvider.GOOGLE,
        )

    async def health_check(self) -> bool:
        try:
            await self.model.generate_content_async("hi")
            return True
        except Exception:
            return False
```

---

## Provider Factory

```python
# backend/app/services/ai/providers/__init__.py

from typing import Optional
from app.services.ai.providers.base import BaseLLMProvider, LLMConfig, LLMProvider
from app.services.ai.providers.anthropic import AnthropicProvider
from app.services.ai.providers.openai import OpenAIProvider
from app.services.ai.providers.google import GoogleProvider


class LLMProviderFactory:
    """LLM Provider 팩토리"""

    _providers: dict[LLMProvider, type[BaseLLMProvider]] = {
        LLMProvider.ANTHROPIC: AnthropicProvider,
        LLMProvider.OPENAI: OpenAIProvider,
        LLMProvider.GOOGLE: GoogleProvider,
    }

    @classmethod
    def create(cls, config: LLMConfig) -> BaseLLMProvider:
        """설정 기반 provider 인스턴스 생성"""
        provider_class = cls._providers.get(config.provider)
        if not provider_class:
            raise ValueError(f"Unknown provider: {config.provider}")
        return provider_class(config)

    @classmethod
    def register(
        cls,
        provider: LLMProvider,
        provider_class: type[BaseLLMProvider]
    ) -> None:
        """새로운 provider 등록 (확장용)"""
        cls._providers[provider] = provider_class

    @classmethod
    def available_providers(cls) -> list[LLMProvider]:
        """등록된 provider 목록"""
        return list(cls._providers.keys())
```

---

## 설정 통합

```python
# backend/app/config.py (추가)

from app.services.ai.providers.base import LLMConfig, LLMProvider

class Settings(BaseSettings):
    # ... 기존 설정 ...

    # LLM Provider 설정
    DEFAULT_LLM_PROVIDER: str = "anthropic"

    ANTHROPIC_API_KEY: Optional[str] = None
    ANTHROPIC_MODEL: str = "claude-sonnet-4-20250514"
    ANTHROPIC_MAX_TOKENS: int = 4096

    OPENAI_API_KEY: Optional[str] = None
    OPENAI_MODEL: str = "gpt-4o"
    OPENAI_MAX_TOKENS: int = 4096

    GOOGLE_API_KEY: Optional[str] = None
    GOOGLE_MODEL: str = "gemini-1.5-pro"
    GOOGLE_MAX_TOKENS: int = 4096

    LLM_TEMPERATURE: float = 0.7
    LLM_TIMEOUT: int = 60

    def get_llm_config(self, provider: str) -> LLMConfig:
        """특정 provider의 LLM 설정 반환"""
        provider_enum = LLMProvider(provider)

        configs = {
            "anthropic": LLMConfig(
                provider=LLMProvider.ANTHROPIC,
                model=self.ANTHROPIC_MODEL,
                api_key=self.ANTHROPIC_API_KEY or "",
                max_tokens=self.ANTHROPIC_MAX_TOKENS,
                temperature=self.LLM_TEMPERATURE,
                timeout=self.LLM_TIMEOUT,
            ),
            "openai": LLMConfig(
                provider=LLMProvider.OPENAI,
                model=self.OPENAI_MODEL,
                api_key=self.OPENAI_API_KEY or "",
                max_tokens=self.OPENAI_MAX_TOKENS,
                temperature=self.LLM_TEMPERATURE,
                timeout=self.LLM_TIMEOUT,
            ),
            "google": LLMConfig(
                provider=LLMProvider.GOOGLE,
                model=self.GOOGLE_MODEL,
                api_key=self.GOOGLE_API_KEY or "",
                max_tokens=self.GOOGLE_MAX_TOKENS,
                temperature=self.LLM_TEMPERATURE,
                timeout=self.LLM_TIMEOUT,
            ),
        }

        config = configs.get(provider)
        if not config:
            raise ValueError(f"Unknown provider: {provider}")
        if not config.api_key:
            raise ValueError(f"API key not configured: {provider}")

        return config

    def get_available_providers(self) -> list[str]:
        """API 키가 설정된 provider 목록"""
        providers = []
        if self.ANTHROPIC_API_KEY:
            providers.append("anthropic")
        if self.OPENAI_API_KEY:
            providers.append("openai")
        if self.GOOGLE_API_KEY:
            providers.append("google")
        return providers
```
