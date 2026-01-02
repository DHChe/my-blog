"""Integration tests for tags endpoints."""

from datetime import datetime, timezone

import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import Tag


class TestListTags:
    """Tests for GET /api/v1/tags endpoint."""

    @pytest.mark.asyncio
    async def test_list_tags_empty(self, client: AsyncClient) -> None:
        """Test listing tags when database is empty."""
        response = await client.get("/api/v1/tags")
        assert response.status_code == 200
        data = response.json()
        assert data == []

    @pytest.mark.asyncio
    async def test_list_tags_with_data(
        self, client: AsyncClient, sample_tag: Tag
    ) -> None:
        """Test listing tags with existing data."""
        response = await client.get("/api/v1/tags")
        assert response.status_code == 200
        data = response.json()
        assert len(data) == 1
        assert data[0]["name"] == "Python"
        assert data[0]["slug"] == "python"
        assert "id" in data[0]

    @pytest.mark.asyncio
    async def test_list_tags_multiple(
        self, client: AsyncClient, db_session: AsyncSession
    ) -> None:
        """Test listing multiple tags."""
        tags = [
            Tag(name="Python", slug="python"),
            Tag(name="FastAPI", slug="fastapi"),
            Tag(name="SQLAlchemy", slug="sqlalchemy"),
        ]
        for tag in tags:
            db_session.add(tag)
        await db_session.commit()

        response = await client.get("/api/v1/tags")
        assert response.status_code == 200
        data = response.json()
        assert len(data) == 3

    @pytest.mark.asyncio
    async def test_list_tags_sorted_by_name(
        self, client: AsyncClient, db_session: AsyncSession
    ) -> None:
        """Test that tags are sorted alphabetically by name."""
        tags = [
            Tag(name="Zython", slug="zython"),
            Tag(name="Aython", slug="aython"),
            Tag(name="Mython", slug="mython"),
        ]
        for tag in tags:
            db_session.add(tag)
        await db_session.commit()

        response = await client.get("/api/v1/tags")
        assert response.status_code == 200
        data = response.json()
        names = [tag["name"] for tag in data]
        assert names == sorted(names)
