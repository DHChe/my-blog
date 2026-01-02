"""파일 콘텐츠 추출기"""

from dataclasses import dataclass
from typing import Optional
from fastapi import UploadFile


@dataclass
class ExtractedContent:
    """추출된 콘텐츠"""
    text: str
    title: Optional[str] = None
    filename: Optional[str] = None


class FileExtractor:
    """파일에서 콘텐츠를 추출합니다."""

    MAX_FILE_SIZE = 10 * 1024 * 1024  # 10MB
    SUPPORTED_EXTENSIONS = {".md", ".markdown", ".txt", ".mdx"}

    def supports(self, filename: str, content_type: Optional[str] = None) -> bool:
        """파일이 지원되는 형식인지 확인
        
        Args:
            filename: 파일명
            content_type: MIME 타입 (선택사항)
            
        Returns:
            지원 여부
        """
        if not filename:
            return False
        
        ext = "." + filename.rsplit(".", 1)[-1].lower()
        return ext in self.SUPPORTED_EXTENSIONS

    async def extract(self, file: UploadFile) -> ExtractedContent:
        """파일에서 콘텐츠 추출
        
        Args:
            file: 업로드된 파일
            
        Returns:
            추출된 콘텐츠
        """
        if not file.filename:
            raise ValueError("파일명이 없습니다.")
        
        # 파일 크기 확인
        content = await file.read()
        if len(content) > self.MAX_FILE_SIZE:
            raise ValueError(
                f"파일 크기는 {self.MAX_FILE_SIZE // 1024 // 1024}MB를 초과할 수 없습니다"
            )
        
        # UTF-8로 디코딩
        try:
            text = content.decode("utf-8")
        except UnicodeDecodeError:
            # UTF-8 실패 시 다른 인코딩 시도
            try:
                text = content.decode("latin-1")
            except Exception as e:
                raise ValueError(f"파일을 읽을 수 없습니다: {e}")
        
        return ExtractedContent(
            text=text,
            filename=file.filename,
        )





