"""Integration tests for post read endpoints."""

from datetime import datetime, timezone

import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import Post, Tag


class TestListPosts:
    """Tests for GET /api/v1/posts endpoint."""

    @pytest.mark.asyncio
    async def test_list_posts_empty(self, client: AsyncClient) -> None:
        """Test listing posts when database is empty."""
        response = await client.get("/api/v1/posts")
        assert response.status_code == 200
        data = response.json()
        assert data["items"] == []
        assert data["total"] == 0
        assert data["page"] == 1
        assert data["page_size"] == 10
        assert data["total_pages"] == 0

    @pytest.mark.asyncio
    async def test_list_posts_with_data(
        self, client: AsyncClient, sample_post: Post
    ) -> None:
        """Test listing posts with existing data."""
        response = await client.get("/api/v1/posts")
        assert response.status_code == 200
        data = response.json()
        assert len(data["items"]) == 1
        assert data["total"] == 1
        assert data["items"][0]["title"] == "Test Post"
        assert data["items"][0]["slug"] == "test-post"

    @pytest.mark.asyncio
    async def test_list_posts_pagination(
        self, client: AsyncClient, db_session: AsyncSession
    ) -> None:
        """Test pagination of posts list."""
        # Create 15 published posts
        for i in range(15):
            post = Post(
                title=f"Post {i}",
                slug=f"post-{i}",
                content=f"Content {i}",
                status="published",
                published_at=datetime.now(timezone.utc),
            )
            db_session.add(post)
        await db_session.commit()

        # Test first page
        response = await client.get("/api/v1/posts?page=1&page_size=10")
        assert response.status_code == 200
        data = response.json()
        assert len(data["items"]) == 10
        assert data["total"] == 15
        assert data["page"] == 1
        assert data["total_pages"] == 2

        # Test second page
        response = await client.get("/api/v1/posts?page=2&page_size=10")
        assert response.status_code == 200
        data = response.json()
        assert len(data["items"]) == 5
        assert data["page"] == 2

    @pytest.mark.asyncio
    async def test_list_posts_only_published(
        self, client: AsyncClient, sample_post: Post, sample_draft_post: Post
    ) -> None:
        """Test that only published posts are listed by default."""
        response = await client.get("/api/v1/posts")
        assert response.status_code == 200
        data = response.json()
        # Only published post should be returned
        assert len(data["items"]) == 1
        assert data["items"][0]["slug"] == "test-post"

    @pytest.mark.asyncio
    async def test_list_posts_with_tags(
        self, client: AsyncClient, db_session: AsyncSession, sample_tag: Tag
    ) -> None:
        """Test listing posts with tag filter."""
        # Create a post with tag
        post = Post(
            title="Tagged Post",
            slug="tagged-post",
            content="Content with tag",
            status="published",
            published_at=datetime.now(timezone.utc),
        )
        post.tags.append(sample_tag)
        db_session.add(post)
        await db_session.commit()

        response = await client.get(f"/api/v1/posts?tag={sample_tag.slug}")
        assert response.status_code == 200
        data = response.json()
        assert len(data["items"]) == 1
        assert data["items"][0]["slug"] == "tagged-post"

    @pytest.mark.asyncio
    async def test_list_posts_sorted_by_created_at_desc(
        self, client: AsyncClient, db_session: AsyncSession
    ) -> None:
        """Test that posts are sorted by creation date descending."""
        # Create posts with different timestamps
        post1 = Post(
            title="First Post",
            slug="first-post",
            content="First",
            status="published",
            published_at=datetime.now(timezone.utc),
        )
        post2 = Post(
            title="Second Post",
            slug="second-post",
            content="Second",
            status="published",
            published_at=datetime.now(timezone.utc),
        )
        db_session.add(post1)
        await db_session.flush()
        db_session.add(post2)
        await db_session.commit()

        response = await client.get("/api/v1/posts")
        assert response.status_code == 200
        data = response.json()
        # Newest post should be first
        assert data["items"][0]["slug"] == "second-post"
        assert data["items"][1]["slug"] == "first-post"


class TestGetPost:
    """Tests for GET /api/v1/posts/{slug} endpoint."""

    @pytest.mark.asyncio
    async def test_get_post_by_slug(
        self, client: AsyncClient, sample_post: Post
    ) -> None:
        """Test getting a post by its slug."""
        response = await client.get("/api/v1/posts/test-post")
        assert response.status_code == 200
        data = response.json()
        assert data["title"] == "Test Post"
        assert data["slug"] == "test-post"
        assert data["content"] == "This is test content."
        assert data["status"] == "published"
        assert "id" in data
        assert "created_at" in data
        assert "tags" in data

    @pytest.mark.asyncio
    async def test_get_post_not_found(self, client: AsyncClient) -> None:
        """Test getting a non-existent post."""
        response = await client.get("/api/v1/posts/non-existent-slug")
        assert response.status_code == 404
        data = response.json()
        assert "detail" in data

    @pytest.mark.asyncio
    async def test_get_draft_post_not_found(
        self, client: AsyncClient, sample_draft_post: Post
    ) -> None:
        """Test that draft posts are not accessible to public."""
        response = await client.get("/api/v1/posts/draft-post")
        assert response.status_code == 404

    @pytest.mark.asyncio
    async def test_get_post_with_tags(
        self, client: AsyncClient, db_session: AsyncSession, sample_tag: Tag
    ) -> None:
        """Test getting a post with associated tags."""
        post = Post(
            title="Tagged Post",
            slug="tagged-post",
            content="Content with tag",
            status="published",
            published_at=datetime.now(timezone.utc),
        )
        post.tags.append(sample_tag)
        db_session.add(post)
        await db_session.commit()

        response = await client.get("/api/v1/posts/tagged-post")
        assert response.status_code == 200
        data = response.json()
        assert len(data["tags"]) == 1
        assert data["tags"][0]["name"] == "Python"
        assert data["tags"][0]["slug"] == "python"
