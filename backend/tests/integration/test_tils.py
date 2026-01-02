"""Integration tests for TIL endpoints."""

import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import TIL, Tag


class TestListTILs:
    """Tests for GET /api/v1/tils endpoint."""

    @pytest.mark.asyncio
    async def test_list_tils_empty(self, client: AsyncClient) -> None:
        """Test listing TILs when database is empty."""
        response = await client.get("/api/v1/tils")
        assert response.status_code == 200
        data = response.json()
        assert data["items"] == []
        assert data["total"] == 0
        assert data["page"] == 1
        assert data["pages"] == 0

    @pytest.mark.asyncio
    async def test_list_tils_with_data(
        self, client: AsyncClient, sample_til: TIL
    ) -> None:
        """Test listing TILs with existing data."""
        response = await client.get("/api/v1/tils")
        assert response.status_code == 200
        data = response.json()
        assert len(data["items"]) == 1
        assert data["items"][0]["day_number"] == sample_til.day_number
        assert data["items"][0]["title"] == sample_til.title
        assert data["total"] == 1

    @pytest.mark.asyncio
    async def test_list_tils_pagination(
        self, client: AsyncClient, db_session: AsyncSession
    ) -> None:
        """Test TIL list pagination."""
        # Create 15 TILs
        for i in range(1, 16):
            til = TIL(
                title=f"Day {i} TIL",
                slug=f"day-{i}-til",
                day_number=i,
                excerpt=f"Excerpt for day {i}",
                content=f"Content for day {i}",
                is_published=True,
            )
            db_session.add(til)
        await db_session.commit()

        # First page (default size=10)
        response = await client.get("/api/v1/tils?page=1&size=10")
        assert response.status_code == 200
        data = response.json()
        assert len(data["items"]) == 10
        assert data["total"] == 15
        assert data["pages"] == 2
        # Ordered by day_number desc, so day 15 comes first
        assert data["items"][0]["day_number"] == 15

        # Second page
        response = await client.get("/api/v1/tils?page=2&size=10")
        assert response.status_code == 200
        data = response.json()
        assert len(data["items"]) == 5

    @pytest.mark.asyncio
    async def test_list_tils_filter_by_published(
        self, client: AsyncClient, db_session: AsyncSession
    ) -> None:
        """Test filtering TILs by published status."""
        # Create published and draft TILs
        published_til = TIL(
            title="Published TIL",
            slug="published-til",
            day_number=1,
            excerpt="Published",
            content="Published content",
            is_published=True,
        )
        draft_til = TIL(
            title="Draft TIL",
            slug="draft-til",
            day_number=2,
            excerpt="Draft",
            content="Draft content",
            is_published=False,
        )
        db_session.add_all([published_til, draft_til])
        await db_session.commit()

        # Filter published only
        response = await client.get("/api/v1/tils?published=true")
        assert response.status_code == 200
        data = response.json()
        assert len(data["items"]) == 1
        assert data["items"][0]["is_published"] is True

        # Filter drafts only
        response = await client.get("/api/v1/tils?published=false")
        assert response.status_code == 200
        data = response.json()
        assert len(data["items"]) == 1
        assert data["items"][0]["is_published"] is False

    @pytest.mark.asyncio
    async def test_list_tils_filter_by_tag(
        self, client: AsyncClient, sample_til_with_tags: TIL
    ) -> None:
        """Test filtering TILs by tag."""
        response = await client.get("/api/v1/tils?tag=python")
        assert response.status_code == 200
        data = response.json()
        assert len(data["items"]) == 1
        assert data["items"][0]["title"] == sample_til_with_tags.title


class TestGetTIL:
    """Tests for GET /api/v1/tils/{slug} endpoint."""

    @pytest.mark.asyncio
    async def test_get_til_by_slug(
        self, client: AsyncClient, sample_til: TIL
    ) -> None:
        """Test getting TIL by slug."""
        response = await client.get(f"/api/v1/tils/{sample_til.slug}")
        assert response.status_code == 200
        data = response.json()
        assert data["slug"] == sample_til.slug
        assert data["title"] == sample_til.title
        assert data["content"] == sample_til.content

    @pytest.mark.asyncio
    async def test_get_til_not_found(self, client: AsyncClient) -> None:
        """Test getting non-existent TIL."""
        response = await client.get("/api/v1/tils/non-existent")
        assert response.status_code == 404


class TestGetTILByDay:
    """Tests for GET /api/v1/tils/day/{day_number} endpoint."""

    @pytest.mark.asyncio
    async def test_get_til_by_day(
        self, client: AsyncClient, sample_til: TIL
    ) -> None:
        """Test getting TIL by day number."""
        response = await client.get(f"/api/v1/tils/day/{sample_til.day_number}")
        assert response.status_code == 200
        data = response.json()
        assert data["day_number"] == sample_til.day_number

    @pytest.mark.asyncio
    async def test_get_til_by_day_not_found(self, client: AsyncClient) -> None:
        """Test getting TIL with non-existent day number."""
        response = await client.get("/api/v1/tils/day/999")
        assert response.status_code == 404


class TestCreateTIL:
    """Tests for POST /api/v1/tils endpoint."""

    @pytest.mark.asyncio
    async def test_create_til_success(
        self, client: AsyncClient, admin_headers: dict
    ) -> None:
        """Test creating a TIL."""
        til_data = {
            "title": "Day 1 Learning",
            "day_number": 1,
            "excerpt": "Today I learned about Python basics",
            "content": "# Python Basics\n\nPython is awesome!",
            "is_published": True,
        }
        response = await client.post(
            "/api/v1/tils", json=til_data, headers=admin_headers
        )
        assert response.status_code == 201
        data = response.json()
        assert data["title"] == til_data["title"]
        assert data["day_number"] == til_data["day_number"]
        assert "slug" in data
        assert data["is_published"] is True
        assert data["published_at"] is not None

    @pytest.mark.asyncio
    async def test_create_til_with_tags(
        self, client: AsyncClient, admin_headers: dict, sample_tag: Tag
    ) -> None:
        """Test creating a TIL with tags."""
        til_data = {
            "title": "Day 3 Learning",
            "day_number": 3,
            "excerpt": "Learning with tags",
            "content": "Content here",
            "tag_ids": [str(sample_tag.id)],
        }
        response = await client.post(
            "/api/v1/tils", json=til_data, headers=admin_headers
        )
        assert response.status_code == 201
        data = response.json()
        assert len(data["tags"]) == 1
        assert data["tags"][0]["name"] == sample_tag.name

    @pytest.mark.asyncio
    async def test_create_til_unauthorized(self, client: AsyncClient) -> None:
        """Test creating TIL without auth."""
        til_data = {
            "title": "Test",
            "day_number": 1,
            "excerpt": "Test",
            "content": "Test",
        }
        response = await client.post("/api/v1/tils", json=til_data)
        assert response.status_code == 401

    @pytest.mark.asyncio
    async def test_create_til_invalid_auth(
        self, client: AsyncClient, invalid_headers: dict
    ) -> None:
        """Test creating TIL with invalid auth."""
        til_data = {
            "title": "Test",
            "day_number": 1,
            "excerpt": "Test",
            "content": "Test",
        }
        response = await client.post(
            "/api/v1/tils", json=til_data, headers=invalid_headers
        )
        assert response.status_code == 401

    @pytest.mark.asyncio
    async def test_create_til_duplicate_day(
        self, client: AsyncClient, admin_headers: dict, sample_til: TIL
    ) -> None:
        """Test creating TIL with duplicate day number."""
        til_data = {
            "title": "Another Day TIL",
            "day_number": sample_til.day_number,
            "excerpt": "Excerpt",
            "content": "Content",
        }
        response = await client.post(
            "/api/v1/tils", json=til_data, headers=admin_headers
        )
        assert response.status_code == 400
        assert "already exists" in response.json()["detail"]


class TestUpdateTIL:
    """Tests for PUT /api/v1/tils/{til_id} endpoint."""

    @pytest.mark.asyncio
    async def test_update_til_success(
        self, client: AsyncClient, admin_headers: dict, sample_til: TIL
    ) -> None:
        """Test updating a TIL."""
        update_data = {"title": "Updated Title"}
        response = await client.put(
            f"/api/v1/tils/{sample_til.id}",
            json=update_data,
            headers=admin_headers,
        )
        assert response.status_code == 200
        data = response.json()
        assert data["title"] == "Updated Title"

    @pytest.mark.asyncio
    async def test_update_til_publish(
        self, client: AsyncClient, admin_headers: dict, db_session: AsyncSession
    ) -> None:
        """Test publishing a draft TIL."""
        # Create draft TIL
        draft_til = TIL(
            title="Draft",
            slug="draft",
            day_number=99,
            excerpt="Draft",
            content="Draft",
            is_published=False,
        )
        db_session.add(draft_til)
        await db_session.commit()
        await db_session.refresh(draft_til)

        # Publish it
        response = await client.put(
            f"/api/v1/tils/{draft_til.id}",
            json={"is_published": True},
            headers=admin_headers,
        )
        assert response.status_code == 200
        data = response.json()
        assert data["is_published"] is True
        assert data["published_at"] is not None

    @pytest.mark.asyncio
    async def test_update_til_not_found(
        self, client: AsyncClient, admin_headers: dict
    ) -> None:
        """Test updating non-existent TIL."""
        import uuid

        response = await client.put(
            f"/api/v1/tils/{uuid.uuid4()}",
            json={"title": "Test"},
            headers=admin_headers,
        )
        assert response.status_code == 404

    @pytest.mark.asyncio
    async def test_update_til_duplicate_day(
        self, client: AsyncClient, admin_headers: dict, db_session: AsyncSession
    ) -> None:
        """Test updating TIL with duplicate day number."""
        # Create two TILs
        til1 = TIL(
            title="TIL 1",
            slug="til-1",
            day_number=10,
            excerpt="Excerpt",
            content="Content",
        )
        til2 = TIL(
            title="TIL 2",
            slug="til-2",
            day_number=11,
            excerpt="Excerpt",
            content="Content",
        )
        db_session.add_all([til1, til2])
        await db_session.commit()
        await db_session.refresh(til2)

        # Try to update til2's day_number to til1's
        response = await client.put(
            f"/api/v1/tils/{til2.id}",
            json={"day_number": 10},
            headers=admin_headers,
        )
        assert response.status_code == 400


class TestDeleteTIL:
    """Tests for DELETE /api/v1/tils/{til_id} endpoint."""

    @pytest.mark.asyncio
    async def test_delete_til_success(
        self, client: AsyncClient, admin_headers: dict, sample_til: TIL
    ) -> None:
        """Test deleting a TIL."""
        response = await client.delete(
            f"/api/v1/tils/{sample_til.id}", headers=admin_headers
        )
        assert response.status_code == 204

        # Verify deletion
        response = await client.get(f"/api/v1/tils/{sample_til.slug}")
        assert response.status_code == 404

    @pytest.mark.asyncio
    async def test_delete_til_not_found(
        self, client: AsyncClient, admin_headers: dict
    ) -> None:
        """Test deleting non-existent TIL."""
        import uuid

        response = await client.delete(
            f"/api/v1/tils/{uuid.uuid4()}", headers=admin_headers
        )
        assert response.status_code == 404

    @pytest.mark.asyncio
    async def test_delete_til_unauthorized(
        self, client: AsyncClient, sample_til: TIL
    ) -> None:
        """Test deleting TIL without auth."""
        response = await client.delete(f"/api/v1/tils/{sample_til.id}")
        assert response.status_code == 401
