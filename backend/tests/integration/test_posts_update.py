"""Integration tests for post update endpoint."""

from datetime import datetime, timezone

import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import Post, Tag


class TestUpdatePost:
    """Tests for PUT /api/v1/posts/{slug} endpoint."""

    @pytest.mark.asyncio
    async def test_update_post_title(
        self,
        client: AsyncClient,
        admin_headers: dict[str, str],
        sample_post: Post,
    ) -> None:
        """Test updating post title."""
        update_data = {"title": "Updated Title"}

        response = await client.put(
            f"/api/v1/posts/{sample_post.slug}",
            json=update_data,
            headers=admin_headers,
        )

        assert response.status_code == 200
        data = response.json()
        assert data["title"] == "Updated Title"
        # Slug should remain unchanged
        assert data["slug"] == sample_post.slug

    @pytest.mark.asyncio
    async def test_update_post_content(
        self,
        client: AsyncClient,
        admin_headers: dict[str, str],
        sample_post: Post,
    ) -> None:
        """Test updating post content."""
        update_data = {"content": "# New Content\n\nUpdated content here."}

        response = await client.put(
            f"/api/v1/posts/{sample_post.slug}",
            json=update_data,
            headers=admin_headers,
        )

        assert response.status_code == 200
        data = response.json()
        assert data["content"] == "# New Content\n\nUpdated content here."

    @pytest.mark.asyncio
    async def test_update_post_status_to_published(
        self,
        client: AsyncClient,
        admin_headers: dict[str, str],
        sample_draft_post: Post,
    ) -> None:
        """Test changing post status from draft to published."""
        update_data = {"status": "published"}

        response = await client.put(
            f"/api/v1/posts/{sample_draft_post.slug}",
            json=update_data,
            headers=admin_headers,
        )

        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "published"
        assert data["published_at"] is not None

    @pytest.mark.asyncio
    async def test_update_post_status_to_draft(
        self,
        client: AsyncClient,
        admin_headers: dict[str, str],
        sample_post: Post,
    ) -> None:
        """Test changing post status from published to draft."""
        update_data = {"status": "draft"}

        response = await client.put(
            f"/api/v1/posts/{sample_post.slug}",
            json=update_data,
            headers=admin_headers,
        )

        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "draft"
        # published_at should remain (was published before)
        assert data["published_at"] is not None

    @pytest.mark.asyncio
    async def test_update_post_tags(
        self,
        client: AsyncClient,
        admin_headers: dict[str, str],
        sample_post: Post,
    ) -> None:
        """Test updating post tags."""
        update_data = {"tags": ["NewTag1", "NewTag2"]}

        response = await client.put(
            f"/api/v1/posts/{sample_post.slug}",
            json=update_data,
            headers=admin_headers,
        )

        assert response.status_code == 200
        data = response.json()
        assert len(data["tags"]) == 2
        tag_names = [tag["name"] for tag in data["tags"]]
        assert "NewTag1" in tag_names
        assert "NewTag2" in tag_names

    @pytest.mark.asyncio
    async def test_update_post_clear_tags(
        self,
        client: AsyncClient,
        admin_headers: dict[str, str],
        db_session: AsyncSession,
        sample_tag: Tag,
    ) -> None:
        """Test clearing all tags from a post."""
        # Create post with tag
        post = Post(
            title="Post with Tag",
            slug="post-with-tag",
            content="Content",
            status="published",
            published_at=datetime.now(timezone.utc),
        )
        post.tags.append(sample_tag)
        db_session.add(post)
        await db_session.commit()

        update_data = {"tags": []}

        response = await client.put(
            "/api/v1/posts/post-with-tag",
            json=update_data,
            headers=admin_headers,
        )

        assert response.status_code == 200
        data = response.json()
        assert len(data["tags"]) == 0

    @pytest.mark.asyncio
    async def test_update_post_multiple_fields(
        self,
        client: AsyncClient,
        admin_headers: dict[str, str],
        sample_draft_post: Post,
    ) -> None:
        """Test updating multiple fields at once."""
        update_data = {
            "title": "New Title",
            "content": "New content",
            "status": "published",
            "tags": ["Tag1"],
        }

        response = await client.put(
            f"/api/v1/posts/{sample_draft_post.slug}",
            json=update_data,
            headers=admin_headers,
        )

        assert response.status_code == 200
        data = response.json()
        assert data["title"] == "New Title"
        assert data["content"] == "New content"
        assert data["status"] == "published"
        assert len(data["tags"]) == 1

    @pytest.mark.asyncio
    async def test_update_post_not_found(
        self,
        client: AsyncClient,
        admin_headers: dict[str, str],
    ) -> None:
        """Test updating non-existent post."""
        update_data = {"title": "Updated Title"}

        response = await client.put(
            "/api/v1/posts/non-existent-slug",
            json=update_data,
            headers=admin_headers,
        )

        assert response.status_code == 404

    @pytest.mark.asyncio
    async def test_update_post_unauthorized_no_key(
        self,
        client: AsyncClient,
        sample_post: Post,
    ) -> None:
        """Test that updating without API key returns 401."""
        update_data = {"title": "Updated Title"}

        response = await client.put(
            f"/api/v1/posts/{sample_post.slug}",
            json=update_data,
        )

        assert response.status_code == 401

    @pytest.mark.asyncio
    async def test_update_post_unauthorized_invalid_key(
        self,
        client: AsyncClient,
        invalid_headers: dict[str, str],
        sample_post: Post,
    ) -> None:
        """Test that updating with invalid API key returns 401."""
        update_data = {"title": "Updated Title"}

        response = await client.put(
            f"/api/v1/posts/{sample_post.slug}",
            json=update_data,
            headers=invalid_headers,
        )

        assert response.status_code == 401

    @pytest.mark.asyncio
    async def test_update_post_validation_error_empty_title(
        self,
        client: AsyncClient,
        admin_headers: dict[str, str],
        sample_post: Post,
    ) -> None:
        """Test validation error for empty title."""
        update_data = {"title": ""}

        response = await client.put(
            f"/api/v1/posts/{sample_post.slug}",
            json=update_data,
            headers=admin_headers,
        )

        assert response.status_code == 422

    @pytest.mark.asyncio
    async def test_update_draft_post(
        self,
        client: AsyncClient,
        admin_headers: dict[str, str],
        sample_draft_post: Post,
    ) -> None:
        """Test updating a draft post."""
        update_data = {"content": "Updated draft content"}

        response = await client.put(
            f"/api/v1/posts/{sample_draft_post.slug}",
            json=update_data,
            headers=admin_headers,
        )

        assert response.status_code == 200
        data = response.json()
        assert data["content"] == "Updated draft content"
        assert data["status"] == "draft"
