"""Integration tests for post create endpoint."""

import pytest
from httpx import AsyncClient
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import Post


class TestCreatePost:
    """Tests for POST /api/v1/posts endpoint."""

    @pytest.mark.asyncio
    async def test_create_post_success(
        self, client: AsyncClient, admin_headers: dict[str, str]
    ) -> None:
        """Test successful post creation."""
        post_data = {
            "title": "My New Post",
            "content": "This is the content of my new post.",
            "status": "published",
        }

        response = await client.post(
            "/api/v1/posts",
            json=post_data,
            headers=admin_headers,
        )

        assert response.status_code == 201
        data = response.json()
        assert data["title"] == "My New Post"
        assert data["content"] == "This is the content of my new post."
        assert data["status"] == "published"
        assert data["slug"] == "my-new-post"
        assert "id" in data
        assert "created_at" in data
        assert data["published_at"] is not None

    @pytest.mark.asyncio
    async def test_create_post_with_tags(
        self, client: AsyncClient, admin_headers: dict[str, str]
    ) -> None:
        """Test post creation with tags."""
        post_data = {
            "title": "Tagged Post",
            "content": "Content with tags",
            "status": "published",
            "tags": ["Python", "FastAPI"],
        }

        response = await client.post(
            "/api/v1/posts",
            json=post_data,
            headers=admin_headers,
        )

        assert response.status_code == 201
        data = response.json()
        assert len(data["tags"]) == 2
        tag_names = [tag["name"] for tag in data["tags"]]
        assert "Python" in tag_names
        assert "FastAPI" in tag_names

    @pytest.mark.asyncio
    async def test_create_post_draft(
        self, client: AsyncClient, admin_headers: dict[str, str]
    ) -> None:
        """Test creating a draft post."""
        post_data = {
            "title": "Draft Post",
            "content": "Draft content",
            "status": "draft",
        }

        response = await client.post(
            "/api/v1/posts",
            json=post_data,
            headers=admin_headers,
        )

        assert response.status_code == 201
        data = response.json()
        assert data["status"] == "draft"
        assert data["published_at"] is None

    @pytest.mark.asyncio
    async def test_create_post_auto_slug(
        self, client: AsyncClient, admin_headers: dict[str, str]
    ) -> None:
        """Test that slug is automatically generated from title."""
        post_data = {
            "title": "This Is My Title",
            "content": "Content",
        }

        response = await client.post(
            "/api/v1/posts",
            json=post_data,
            headers=admin_headers,
        )

        assert response.status_code == 201
        data = response.json()
        assert data["slug"] == "this-is-my-title"

    @pytest.mark.asyncio
    async def test_create_post_duplicate_slug(
        self, client: AsyncClient, admin_headers: dict[str, str], db_session: AsyncSession
    ) -> None:
        """Test that duplicate slugs get numbered suffix."""
        # Create first post
        post1 = Post(
            title="My Post",
            slug="my-post",
            content="First post",
            status="published",
        )
        db_session.add(post1)
        await db_session.commit()

        # Create second post with same title
        post_data = {
            "title": "My Post",
            "content": "Second post",
        }

        response = await client.post(
            "/api/v1/posts",
            json=post_data,
            headers=admin_headers,
        )

        assert response.status_code == 201
        data = response.json()
        assert data["slug"] == "my-post-1"

    @pytest.mark.asyncio
    async def test_create_post_validation_error_empty_title(
        self, client: AsyncClient, admin_headers: dict[str, str]
    ) -> None:
        """Test validation error for empty title."""
        post_data = {
            "title": "",
            "content": "Content",
        }

        response = await client.post(
            "/api/v1/posts",
            json=post_data,
            headers=admin_headers,
        )

        assert response.status_code == 422

    @pytest.mark.asyncio
    async def test_create_post_validation_error_whitespace_title(
        self, client: AsyncClient, admin_headers: dict[str, str]
    ) -> None:
        """Test validation error for whitespace-only title."""
        post_data = {
            "title": "   ",
            "content": "Content",
        }

        response = await client.post(
            "/api/v1/posts",
            json=post_data,
            headers=admin_headers,
        )

        assert response.status_code == 422

    @pytest.mark.asyncio
    async def test_create_post_validation_error_title_too_long(
        self, client: AsyncClient, admin_headers: dict[str, str]
    ) -> None:
        """Test validation error for title exceeding max length."""
        post_data = {
            "title": "A" * 201,
            "content": "Content",
        }

        response = await client.post(
            "/api/v1/posts",
            json=post_data,
            headers=admin_headers,
        )

        assert response.status_code == 422

    @pytest.mark.asyncio
    async def test_create_post_validation_error_content_too_long(
        self, client: AsyncClient, admin_headers: dict[str, str]
    ) -> None:
        """Test validation error for content exceeding max length."""
        post_data = {
            "title": "Valid Title",
            "content": "A" * 50001,
        }

        response = await client.post(
            "/api/v1/posts",
            json=post_data,
            headers=admin_headers,
        )

        assert response.status_code == 422

    @pytest.mark.asyncio
    async def test_create_post_unauthorized_no_key(
        self, client: AsyncClient
    ) -> None:
        """Test that creating post without API key returns 401."""
        post_data = {
            "title": "Unauthorized Post",
            "content": "Content",
        }

        response = await client.post("/api/v1/posts", json=post_data)

        assert response.status_code == 401

    @pytest.mark.asyncio
    async def test_create_post_unauthorized_invalid_key(
        self, client: AsyncClient, invalid_headers: dict[str, str]
    ) -> None:
        """Test that creating post with invalid API key returns 401."""
        post_data = {
            "title": "Unauthorized Post",
            "content": "Content",
        }

        response = await client.post(
            "/api/v1/posts",
            json=post_data,
            headers=invalid_headers,
        )

        assert response.status_code == 401

    @pytest.mark.asyncio
    async def test_create_post_default_status_is_draft(
        self, client: AsyncClient, admin_headers: dict[str, str]
    ) -> None:
        """Test that default post status is draft."""
        post_data = {
            "title": "Default Status Post",
        }

        response = await client.post(
            "/api/v1/posts",
            json=post_data,
            headers=admin_headers,
        )

        assert response.status_code == 201
        data = response.json()
        assert data["status"] == "draft"
