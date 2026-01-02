# 프롬프트 엔지니어링

## 개요

TIL 생성에 사용되는 프롬프트 템플릿과 설계 원칙을 정의합니다.

---

## TIL 생성 프롬프트

### System Prompt

```python
# backend/app/services/ai/prompts/til_generator.py

TIL_SYSTEM_PROMPT = """당신은 개발자의 학습 저널인 "Today I Learned" (TIL) 항목을 작성하는 전문 기술 작가입니다.

## 역할
주어진 학습 자료나 내용을 바탕으로 잘 구성된, 읽기 쉬운 TIL 항목을 작성합니다.

## 작성 가이드라인

### 스타일
1. 명확하고 간결한 언어 사용
2. 실용적인 코드 예제 포함 (관련 있을 때)
3. "무엇"뿐만 아니라 "왜"도 설명
4. 대화체지만 전문적인 톤 유지
5. 한국어로 작성

### 구조
1. 간략한 소개로 시작
2. ## 헤딩으로 주요 섹션 구분
3. 언어 지정이 있는 코드 블록 사용
4. "핵심 정리" 또는 "정리" 섹션으로 마무리

### 마크다운 형식
- 섹션 제목: ## 사용
- 코드: ```언어 형식 사용
- 강조: **굵게**, *기울임*
- 목록: - 또는 1. 사용

### 분량
- 적절한 길이 유지 (500-2000 단어)
- 핵심에 집중
- 불필요한 내용 제외
"""
```

### User Prompt Template

```python
def build_til_prompt(
    content: str,
    context: dict | None = None
) -> str:
    """TIL 생성 프롬프트 구성"""

    prompt = f"""다음 학습 내용을 바탕으로 TIL 항목을 작성해주세요.

---
입력 내용:
{content}
---

다음을 포함한 TIL을 작성해주세요:
1. 핵심 학습 포인트 정리
2. 필요한 경우 배경 설명 추가
3. 실용적인 예제 (해당되는 경우)
4. 명확한 섹션 구분

마크다운 형식으로 작성해주세요."""

    # 추가 컨텍스트
    if context:
        if context.get("source_url"):
            prompt += f"\n\n원본 출처: {context['source_url']}"
        if context.get("source_title"):
            prompt += f"\n원본 제목: {context['source_title']}"

    return prompt
```

---

## 제목 생성 프롬프트

```python
TITLE_PROMPT = """다음 TIL 콘텐츠에 맞는 간결하고 매력적인 제목을 생성해주세요.

제목 규칙:
- 100자 이내
- 동사 또는 핵심 개념으로 시작
- 구체적이고 설명적
- 클릭베이트 지양

콘텐츠:
{content}

제목만 출력해주세요 (따옴표 없이):"""


def build_title_prompt(content: str) -> str:
    return TITLE_PROMPT.format(content=content[:2000])
```

---

## 요약 생성 프롬프트

```python
EXCERPT_PROMPT = """다음 TIL 콘텐츠의 핵심을 요약해주세요.

요약 규칙:
- 1-2문장
- 최대 500자
- 핵심 학습 포인트 포함
- 흥미를 유발

콘텐츠:
{content}

요약만 출력해주세요:"""


def build_excerpt_prompt(content: str) -> str:
    return EXCERPT_PROMPT.format(content=content[:3000])
```

---

## 태그 추천 프롬프트

```python
TAG_SYSTEM_PROMPT = """당신은 개발 콘텐츠 분류 전문가입니다.

기술 콘텐츠에 적절한 태그를 추천합니다.

태그 규칙:
1. 기존 태그가 있으면 우선 사용
2. 새 태그는 소문자-하이픈 형식 (예: type-script, react-hooks)
3. 기술 스택 + 개념 레벨 태그 조합
4. 최대 5개"""


def build_tag_prompt(content: str, existing_tags: list[str]) -> str:
    return f"""다음 TIL 콘텐츠에 맞는 태그를 추천해주세요.

기존 태그: {', '.join(existing_tags) if existing_tags else '없음'}

콘텐츠:
{content[:3000]}

규칙:
1. 기존 태그 중 적합한 것 우선
2. 필요시 새 태그 추가 (소문자-하이픈)
3. 최대 5개
4. 한 줄에 태그 하나씩

태그 목록:"""
```

---

## 이미지 분석 프롬프트

```python
IMAGE_EXTRACTION_PROMPT = """이 이미지에서 다음 내용을 추출해주세요:

1. **텍스트**: 이미지에 포함된 모든 텍스트
2. **코드**: 코드가 있다면 정확히 복사 (언어 지정 포함)
3. **다이어그램**: 다이어그램/도표가 있다면 텍스트로 설명
4. **핵심 내용**: 이미지가 전달하려는 주요 정보

마크다운 형식으로 정리해주세요.
코드는 ```언어 블록을 사용해주세요."""
```

---

## 프롬프트 모듈

```python
# backend/app/services/ai/prompts/__init__.py

from app.services.ai.prompts.til_generator import (
    TIL_SYSTEM_PROMPT,
    build_til_prompt,
    TITLE_PROMPT,
    build_title_prompt,
    EXCERPT_PROMPT,
    build_excerpt_prompt,
    TAG_SYSTEM_PROMPT,
    build_tag_prompt,
    IMAGE_EXTRACTION_PROMPT,
)

__all__ = [
    "TIL_SYSTEM_PROMPT",
    "build_til_prompt",
    "TITLE_PROMPT",
    "build_title_prompt",
    "EXCERPT_PROMPT",
    "build_excerpt_prompt",
    "TAG_SYSTEM_PROMPT",
    "build_tag_prompt",
    "IMAGE_EXTRACTION_PROMPT",
]
```

---

## 프롬프트 설계 원칙

### 1. 명확한 역할 정의
- System prompt에서 AI의 역할을 명확히 정의
- 기대하는 출력 형식 명시

### 2. 구조화된 지시
- 번호 매긴 단계별 지시
- 규칙/가이드라인 명시

### 3. 예시 포함
- 좋은 출력의 예시 제공
- 피해야 할 패턴 명시

### 4. 길이 제한
- 입력 콘텐츠 길이 제한 (토큰 절약)
- 출력 길이 가이드라인 제공

### 5. 한국어 최적화
- 한국어 작성 명시
- 한국어 표현에 맞는 가이드라인

---

## 프롬프트 테스트

프롬프트 품질을 테스트하기 위한 체크리스트:

### TIL 콘텐츠
- [ ] 마크다운 형식 준수
- [ ] 적절한 섹션 구분
- [ ] 코드 블록 언어 지정
- [ ] 핵심 내용 포함
- [ ] 읽기 쉬운 길이

### 제목
- [ ] 100자 이내
- [ ] 구체적이고 설명적
- [ ] 클릭베이트 아님

### 요약
- [ ] 500자 이내
- [ ] 핵심 포인트 요약
- [ ] 1-2문장

### 태그
- [ ] 5개 이하
- [ ] 소문자-하이픈 형식
- [ ] 콘텐츠와 관련성
