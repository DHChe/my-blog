"""Unit tests for slug generation utility."""

import pytest

from app.utils.slug import generate_slug


class TestGenerateSlug:
    """Tests for the generate_slug function."""

    def test_basic_english_title(self) -> None:
        """Test slug generation from basic English title."""
        result = generate_slug("Hello World")
        assert result == "hello-world"

    def test_korean_title(self) -> None:
        """Test slug generation from Korean title."""
        result = generate_slug("안녕하세요")
        # python-slugify transliterates Korean to romanized form
        assert result  # Should not be empty
        assert " " not in result

    def test_mixed_language_title(self) -> None:
        """Test slug generation from mixed language title."""
        result = generate_slug("Python 프로그래밍 가이드")
        assert "python" in result
        assert " " not in result

    def test_special_characters_removed(self) -> None:
        """Test that special characters are removed."""
        result = generate_slug("Hello! @World# 2024")
        assert "!" not in result
        assert "@" not in result
        assert "#" not in result

    def test_max_length_respected(self) -> None:
        """Test that slug respects max length."""
        long_title = "A" * 200
        result = generate_slug(long_title)
        assert len(result) <= 100

    def test_empty_title_returns_default(self) -> None:
        """Test that empty title returns default slug."""
        result = generate_slug("")
        assert result == "post"

    def test_whitespace_only_returns_default(self) -> None:
        """Test that whitespace-only title returns default slug."""
        result = generate_slug("   ")
        assert result == "post"

    def test_duplicate_slug_handling(self) -> None:
        """Test that duplicate slugs get numbered suffix."""
        existing = ["hello-world"]
        result = generate_slug("Hello World", existing)
        assert result == "hello-world-1"

    def test_multiple_duplicates(self) -> None:
        """Test handling of multiple duplicate slugs."""
        existing = ["hello-world", "hello-world-1", "hello-world-2"]
        result = generate_slug("Hello World", existing)
        assert result == "hello-world-3"

    def test_no_duplicates_returns_base_slug(self) -> None:
        """Test that unique slug doesn't get suffix."""
        existing = ["other-post"]
        result = generate_slug("Hello World", existing)
        assert result == "hello-world"

    def test_none_existing_slugs_list(self) -> None:
        """Test with None as existing_slugs."""
        result = generate_slug("Hello World", None)
        assert result == "hello-world"

    def test_lowercase_conversion(self) -> None:
        """Test that uppercase letters are converted to lowercase."""
        result = generate_slug("HELLO WORLD")
        assert result == "hello-world"
