"""Integration tests for post delete endpoint."""

import pytest
from httpx import AsyncClient

from app.models import Post


class TestDeletePost:
    """Tests for DELETE /api/v1/posts/{slug} endpoint."""

    @pytest.mark.asyncio
    async def test_delete_post_success(
        self,
        client: AsyncClient,
        admin_headers: dict[str, str],
        sample_post: Post,
    ) -> None:
        """Test successful post deletion."""
        response = await client.delete(
            f"/api/v1/posts/{sample_post.slug}",
            headers=admin_headers,
        )

        assert response.status_code == 204

        # Verify post is deleted
        get_response = await client.get(f"/api/v1/posts/{sample_post.slug}")
        assert get_response.status_code == 404

    @pytest.mark.asyncio
    async def test_delete_post_not_found(
        self,
        client: AsyncClient,
        admin_headers: dict[str, str],
    ) -> None:
        """Test deleting non-existent post."""
        response = await client.delete(
            "/api/v1/posts/non-existent-slug",
            headers=admin_headers,
        )

        assert response.status_code == 404

    @pytest.mark.asyncio
    async def test_delete_post_unauthorized_no_key(
        self,
        client: AsyncClient,
        sample_post: Post,
    ) -> None:
        """Test that deleting without API key returns 401."""
        response = await client.delete(f"/api/v1/posts/{sample_post.slug}")

        assert response.status_code == 401

    @pytest.mark.asyncio
    async def test_delete_post_unauthorized_invalid_key(
        self,
        client: AsyncClient,
        invalid_headers: dict[str, str],
        sample_post: Post,
    ) -> None:
        """Test that deleting with invalid API key returns 401."""
        response = await client.delete(
            f"/api/v1/posts/{sample_post.slug}",
            headers=invalid_headers,
        )

        assert response.status_code == 401

    @pytest.mark.asyncio
    async def test_deleted_post_not_in_list(
        self,
        client: AsyncClient,
        admin_headers: dict[str, str],
        sample_post: Post,
    ) -> None:
        """Test that deleted post is removed from list."""
        # Verify post is in list before deletion
        list_response = await client.get("/api/v1/posts")
        data = list_response.json()
        slugs = [item["slug"] for item in data["items"]]
        assert sample_post.slug in slugs

        # Delete the post
        delete_response = await client.delete(
            f"/api/v1/posts/{sample_post.slug}",
            headers=admin_headers,
        )
        assert delete_response.status_code == 204

        # Verify post is not in list after deletion
        list_response = await client.get("/api/v1/posts")
        data = list_response.json()
        slugs = [item["slug"] for item in data["items"]]
        assert sample_post.slug not in slugs

    @pytest.mark.asyncio
    async def test_delete_draft_post(
        self,
        client: AsyncClient,
        admin_headers: dict[str, str],
        sample_draft_post: Post,
    ) -> None:
        """Test deleting a draft post."""
        response = await client.delete(
            f"/api/v1/posts/{sample_draft_post.slug}",
            headers=admin_headers,
        )

        assert response.status_code == 204

        # Verify draft is also deleted (admin can access drafts)
        get_response = await client.get(f"/api/v1/posts/{sample_draft_post.slug}")
        assert get_response.status_code == 404
