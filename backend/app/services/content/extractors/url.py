"""URL 콘텐츠 추출기"""

from dataclasses import dataclass
from typing import Optional

import httpx
from bs4 import BeautifulSoup
from readability import Document
from fastapi import UploadFile


@dataclass
class ExtractedContent:
    """추출된 콘텐츠"""
    text: str
    title: Optional[str] = None
    url: Optional[str] = None


class URLExtractor:
    """URL에서 본문 콘텐츠를 추출합니다."""

    TIMEOUT = 30.0
    USER_AGENT = (
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
        "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
    )

    async def extract(self, url: str) -> ExtractedContent:
        """URL에서 콘텐츠 추출
        
        Args:
            url: 추출할 웹 페이지 URL
            
        Returns:
            추출된 콘텐츠 (텍스트, 제목, URL)
        """
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
        for pre in soup.find_all("pre"):
            code = pre.find("code")
            if code:
                lang = ""
                if code.get("class"):
                    for cls in code.get("class", []):
                        if cls.startswith("language-"):
                            lang = cls.replace("language-", "")
                            break
                code_text = code.get_text()
                pre.replace_with(f"\n```{lang}\n{code_text}\n```\n")

        # 인라인 코드 보존
        for code in soup.find_all("code"):
            code.replace_with(f"`{code.get_text()}`")

        # 링크 텍스트 보존
        for a in soup.find_all("a"):
            href = a.get("href", "")
            text = a.get_text()
            if href and text:
                a.replace_with(f"[{text}]({href})")

        text = soup.get_text(separator="\n", strip=True)
        
        # 과도한 빈 줄 정리
        lines = text.split("\n")
        cleaned_lines = []
        empty_count = 0
        for line in lines:
            if not line.strip():
                empty_count += 1
                if empty_count <= 2:
                    cleaned_lines.append("")
            else:
                empty_count = 0
                cleaned_lines.append(line)
        
        text = "\n".join(cleaned_lines)

        return ExtractedContent(
            text=text,
            title=doc.title(),
            url=url,
        )


class ContentProcessor:
    """콘텐츠 처리 오케스트레이터"""
    
    MAX_CONTENT_LENGTH = 50000

    def __init__(self):
        self.url_extractor = URLExtractor()
        # 파일 추출기는 동적 임포트로 지연 로딩
        self._file_extractor = None

    @property
    def file_extractor(self):
        """파일 추출기 지연 로딩"""
        if self._file_extractor is None:
            from app.services.content.extractors.file import FileExtractor
            self._file_extractor = FileExtractor()
        return self._file_extractor

    async def process(
        self,
        input_type: str,
        content: Optional[str] = None,
        file: Optional[UploadFile] = None,
    ) -> str:
        """입력 타입에 따라 콘텐츠 처리
        
        Args:
            input_type: "text", "url", 또는 "file"
            content: 텍스트 내용 또는 URL (input_type이 "file"이 아닐 때)
            file: 업로드된 파일 (input_type이 "file"일 때)
            
        Returns:
            처리된 텍스트
        """
        if input_type == "url" and content:
            extracted = await self.url_extractor.extract(content)
            text = extracted.text
            # 원본 출처 정보 추가
            if extracted.title:
                text = f"원본 제목: {extracted.title}\n원본 URL: {extracted.url}\n\n{text}"
        elif input_type == "text" and content:
            text = content
        elif input_type == "file" and file:
            extracted = await self.file_extractor.extract(file)
            text = extracted.text
            # 원본 파일 정보 추가
            if extracted.filename:
                text = f"원본 파일: {extracted.filename}\n\n{text}"
        else:
            raise ValueError("유효하지 않은 입력입니다.")

        # 길이 제한
        if len(text) > self.MAX_CONTENT_LENGTH:
            text = text[:self.MAX_CONTENT_LENGTH]
            text += "\n\n[콘텐츠가 너무 길어 잘렸습니다...]"

        return text
