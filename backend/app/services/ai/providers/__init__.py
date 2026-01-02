"""LLM Provider Factory"""

from app.services.ai.providers.base import BaseLLMProvider
from app.services.ai.providers.anthropic import AnthropicProvider


def get_llm_provider(provider_type: str = "anthropic") -> BaseLLMProvider:
    """LLM Provider 인스턴스 반환
    
    현재는 Claude만 지원합니다. 추후 다른 Provider 추가 시 확장.
    """
    if provider_type == "anthropic":
        return AnthropicProvider()
    else:
        raise ValueError(f"지원하지 않는 Provider: {provider_type}")


__all__ = ["get_llm_provider", "BaseLLMProvider", "AnthropicProvider"]
