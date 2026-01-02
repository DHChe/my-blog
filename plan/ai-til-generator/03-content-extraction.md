# 콘텐츠 추출 설계

## 개요

다양한 소스(URL, PDF, 이미지, 코드 파일)에서 텍스트를 추출하여 LLM 입력으로 변환합니다.

---

## Extractor 추상화

### 기본 타입

```python
# backend/app/services/content/extractors/base.py

from abc import ABC, abstractmethod
from dataclasses import dataclass
from typing import Optional


@dataclass
class ExtractedContent:
    """추출된 콘텐츠"""
    text: str                           # 추출된 텍스트
    metadata: Optional[dict] = None     # 메타데이터 (제목, URL 등)
    source_type: str = "unknown"        # 소스 타입


class BaseExtractor(ABC):
    """콘텐츠 추출기 베이스 클래스"""

    @abstractmethod
    async def extract(self, source: str | bytes) -> ExtractedContent:
        """소스에서 텍스트 추출"""
        pass

    @abstractmethod
    def supports(
        self,
        source: str | bytes,
        mime_type: Optional[str] = None
    ) -> bool:
        """해당 소스 지원 여부"""
        pass
```

---

## URL Extractor

웹 페이지에서 본문 콘텐츠를 추출합니다.

### 사용 라이브러리
- `httpx`: 비동기 HTTP 클라이언트
- `readability-lxml`: 본문 추출 (Medium, 블로그 등)
- `beautifulsoup4`: HTML 파싱

```python
# backend/app/services/content/extractors/url.py

import httpx
from bs4 import BeautifulSoup
from readability import Document

from app.services.content.extractors.base import BaseExtractor, ExtractedContent


class URLExtractor(BaseExtractor):
    """URL 콘텐츠 추출기"""

    SUPPORTED_SCHEMES = ("http", "https")
    TIMEOUT = 30.0

    USER_AGENT = (
        "Mozilla/5.0 (compatible; TILBot/1.0; "
        "+https://github.com/your-repo)"
    )

    async def extract(self, url: str) -> ExtractedContent:
        async with httpx.AsyncClient(
            timeout=self.TIMEOUT,
            follow_redirects=True
        ) as client:
            response = await client.get(
                url,
                headers={"User-Agent": self.USER_AGENT}
            )
            response.raise_for_status()

        # readability로 본문 추출
        doc = Document(response.text)
        soup = BeautifulSoup(doc.summary(), "html.parser")

        # 코드 블록 보존
        for code in soup.find_all("code"):
            code.string = f"\n```\n{code.get_text()}\n```\n"

        text = soup.get_text(separator="\n", strip=True)

        return ExtractedContent(
            text=text,
            metadata={
                "title": doc.title(),
                "url": str(url),
                "content_type": response.headers.get("content-type"),
            },
            source_type="url",
        )

    def supports(
        self,
        source: str | bytes,
        mime_type: Optional[str] = None
    ) -> bool:
        if isinstance(source, str):
            return source.startswith(self.SUPPORTED_SCHEMES)
        return False
```

---

## PDF Extractor

PDF 파일에서 텍스트를 추출합니다.

### 사용 라이브러리
- `PyMuPDF (fitz)`: PDF 텍스트 추출

```python
# backend/app/services/content/extractors/pdf.py

import fitz  # PyMuPDF
from app.services.content.extractors.base import BaseExtractor, ExtractedContent


class PDFExtractor(BaseExtractor):
    """PDF 콘텐츠 추출기"""

    async def extract(self, content: bytes) -> ExtractedContent:
        doc = fitz.open(stream=content, filetype="pdf")
        text_parts = []

        for page_num, page in enumerate(doc, 1):
            page_text = page.get_text()
            if page_text.strip():
                text_parts.append(f"--- Page {page_num} ---\n{page_text}")

        doc.close()

        return ExtractedContent(
            text="\n\n".join(text_parts),
            metadata={
                "pages": len(doc),
                "format": "pdf",
            },
            source_type="pdf",
        )

    def supports(
        self,
        source: str | bytes,
        mime_type: Optional[str] = None
    ) -> bool:
        if mime_type:
            return mime_type == "application/pdf"
        if isinstance(source, bytes):
            return source[:4] == b"%PDF"
        return False
```

---

## Image Extractor

이미지에서 텍스트/정보를 추출합니다. LLM의 Vision 기능을 활용합니다.

```python
# backend/app/services/content/extractors/image.py

import base64
from app.services.content.extractors.base import BaseExtractor, ExtractedContent
from app.services.ai.providers import LLMProviderFactory
from app.config import settings


class ImageExtractor(BaseExtractor):
    """이미지 콘텐츠 추출기 (LLM Vision 활용)"""

    SUPPORTED_TYPES = (
        "image/png",
        "image/jpeg",
        "image/gif",
        "image/webp",
    )

    EXTRACTION_PROMPT = """이 이미지에서 다음 내용을 추출해주세요:

1. 이미지에 포함된 모든 텍스트
2. 코드가 있다면 정확히 복사
3. 다이어그램이나 도표가 있다면 설명
4. 핵심 내용 요약

마크다운 형식으로 정리해주세요."""

    async def extract(
        self,
        content: bytes,
        mime_type: str = "image/png"
    ) -> ExtractedContent:
        # base64 인코딩
        base64_image = base64.b64encode(content).decode("utf-8")

        # LLM Vision API 호출
        config = settings.get_llm_config(settings.DEFAULT_LLM_PROVIDER)
        provider = LLMProviderFactory.create(config)

        response = await provider.generate_with_image(
            prompt=self.EXTRACTION_PROMPT,
            image_data=base64_image,
            image_type=mime_type,
        )

        return ExtractedContent(
            text=response.content,
            metadata={
                "mime_type": mime_type,
                "extracted_by": "llm_vision",
            },
            source_type="image",
        )

    def supports(
        self,
        source: str | bytes,
        mime_type: Optional[str] = None
    ) -> bool:
        if mime_type:
            return mime_type in self.SUPPORTED_TYPES
        return False
```

---

## Code Extractor

코드 파일의 언어를 감지하고 적절히 포맷팅합니다.

```python
# backend/app/services/content/extractors/code.py

from app.services.content.extractors.base import BaseExtractor, ExtractedContent


class CodeExtractor(BaseExtractor):
    """코드 파일 추출기"""

    EXTENSION_LANG_MAP = {
        ".py": "python",
        ".js": "javascript",
        ".ts": "typescript",
        ".jsx": "jsx",
        ".tsx": "tsx",
        ".java": "java",
        ".go": "go",
        ".rs": "rust",
        ".rb": "ruby",
        ".php": "php",
        ".c": "c",
        ".cpp": "cpp",
        ".cs": "csharp",
        ".swift": "swift",
        ".kt": "kotlin",
        ".sql": "sql",
        ".sh": "bash",
        ".yaml": "yaml",
        ".yml": "yaml",
        ".json": "json",
        ".md": "markdown",
        ".html": "html",
        ".css": "css",
    }

    async def extract(
        self,
        content: bytes,
        filename: str = ""
    ) -> ExtractedContent:
        text = content.decode("utf-8", errors="replace")

        # 파일 확장자로 언어 감지
        ext = ""
        if filename:
            ext = "." + filename.rsplit(".", 1)[-1].lower()

        lang = self.EXTENSION_LANG_MAP.get(ext, "")

        # 코드 블록으로 감싸기
        if lang:
            formatted = f"```{lang}\n{text}\n```"
        else:
            formatted = f"```\n{text}\n```"

        return ExtractedContent(
            text=formatted,
            metadata={
                "filename": filename,
                "language": lang,
                "lines": text.count("\n") + 1,
            },
            source_type="code",
        )

    def supports(
        self,
        source: str | bytes,
        mime_type: Optional[str] = None
    ) -> bool:
        if mime_type:
            return mime_type.startswith("text/") or mime_type in [
                "application/javascript",
                "application/json",
                "application/x-python",
            ]
        return False
```

---

## Content Processor (오케스트레이터)

여러 Extractor를 조합하여 콘텐츠를 처리합니다.

```python
# backend/app/services/content/processor.py

from fastapi import UploadFile
from typing import Optional

from app.services.content.extractors.base import ExtractedContent
from app.services.content.extractors.url import URLExtractor
from app.services.content.extractors.pdf import PDFExtractor
from app.services.content.extractors.image import ImageExtractor
from app.services.content.extractors.code import CodeExtractor
from app.services.ai.exceptions import ContentExtractionError


class ContentProcessor:
    """콘텐츠 처리 오케스트레이터"""

    MAX_CONTENT_LENGTH = 50000

    def __init__(self):
        self.url_extractor = URLExtractor()
        self.pdf_extractor = PDFExtractor()
        self.image_extractor = ImageExtractor()
        self.code_extractor = CodeExtractor()

    async def extract_from_url(self, url: str) -> ExtractedContent:
        """URL에서 콘텐츠 추출"""
        try:
            return await self.url_extractor.extract(url)
        except Exception as e:
            raise ContentExtractionError(f"URL 추출 실패: {e}")

    async def extract_from_file(self, file: UploadFile) -> ExtractedContent:
        """업로드된 파일에서 콘텐츠 추출"""
        content = await file.read()
        mime_type = file.content_type or ""
        filename = file.filename or ""

        try:
            # PDF
            if self.pdf_extractor.supports(content, mime_type):
                return await self.pdf_extractor.extract(content)

            # 이미지
            if self.image_extractor.supports(content, mime_type):
                return await self.image_extractor.extract(content, mime_type)

            # 코드/텍스트
            if self.code_extractor.supports(content, mime_type):
                return await self.code_extractor.extract(content, filename)

            # 기본: 텍스트로 처리
            return ExtractedContent(
                text=content.decode("utf-8", errors="replace"),
                source_type="text",
            )

        except Exception as e:
            raise ContentExtractionError(f"파일 추출 실패: {e}")

    def preprocess(self, text: str) -> str:
        """텍스트 전처리"""
        # 과도한 공백 제거
        lines = text.split("\n")
        cleaned_lines = []
        empty_count = 0

        for line in lines:
            stripped = line.strip()
            if not stripped:
                empty_count += 1
                if empty_count <= 2:  # 최대 2개 빈 줄만 유지
                    cleaned_lines.append("")
            else:
                empty_count = 0
                cleaned_lines.append(line)

        text = "\n".join(cleaned_lines)

        # 길이 제한
        if len(text) > self.MAX_CONTENT_LENGTH:
            text = text[:self.MAX_CONTENT_LENGTH]
            text += "\n\n[콘텐츠가 너무 길어 잘렸습니다...]"

        return text

    async def process(
        self,
        input_type: str,
        content: Optional[str] = None,
        file: Optional[UploadFile] = None,
    ) -> str:
        """입력 타입에 따라 콘텐츠 처리"""
        if input_type == "url" and content:
            extracted = await self.extract_from_url(content)
        elif input_type == "file" and file:
            extracted = await self.extract_from_file(file)
        elif input_type == "text" and content:
            extracted = ExtractedContent(text=content, source_type="text")
        else:
            raise ContentExtractionError("유효하지 않은 입력")

        return self.preprocess(extracted.text)
```

---

## 에러 처리

```python
# backend/app/services/ai/exceptions.py

class ContentExtractionError(Exception):
    """콘텐츠 추출 실패"""
    pass


class URLFetchError(ContentExtractionError):
    """URL 가져오기 실패"""
    def __init__(self, url: str, message: str, status_code: int = None):
        self.url = url
        self.status_code = status_code
        super().__init__(f"[{url}] {message}")


class FileTooLargeError(ContentExtractionError):
    """파일 크기 초과"""
    def __init__(self, size: int, max_size: int):
        self.size = size
        self.max_size = max_size
        super().__init__(
            f"파일 크기({size:,} bytes)가 제한({max_size:,} bytes)을 초과합니다"
        )


class UnsupportedFileTypeError(ContentExtractionError):
    """지원하지 않는 파일 형식"""
    def __init__(self, mime_type: str):
        self.mime_type = mime_type
        super().__init__(f"지원하지 않는 파일 형식: {mime_type}")
```
