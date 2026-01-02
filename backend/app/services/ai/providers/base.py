"""LLM Provider 추상화 인터페이스"""

from abc import ABC, abstractmethod
from dataclasses import dataclass
from typing import AsyncIterator, Optional


@dataclass
class LLMResponse:
    """LLM 응답 통합 형식"""
    content: str
    model: str
    usage: Optional[dict] = None
    finish_reason: Optional[str] = None


class BaseLLMProvider(ABC):
    """LLM Provider 추상 베이스 클래스"""

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
    async def health_check(self) -> bool:
        """Provider 상태 확인"""
        pass
