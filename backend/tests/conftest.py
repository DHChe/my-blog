import asyncio
from collections.abc import AsyncGenerator, Generator
from typing import Any

import pytest
from httpx import ASGITransport, AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.pool import StaticPool

from app.api.deps import get_db
from app.config import settings
from app.db.base import Base
from app.main import app
from app.models import Tag, TIL  # noqa: F401


# Test database URL (SQLite for testing)
TEST_DATABASE_URL = "sqlite+aiosqlite:///:memory:"

# Create test engine
test_engine = create_async_engine(
    TEST_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)

# Create test session maker
test_async_session_maker = async_sessionmaker(
    test_engine,
    class_=AsyncSession,
    expire_on_commit=False,
)


@pytest.fixture(scope="session")
def event_loop() -> Generator[asyncio.AbstractEventLoop, None, None]:
    """Create event loop for async tests."""
    loop = asyncio.get_event_loop_policy().new_event_loop()
    yield loop
    loop.close()


@pytest.fixture(autouse=True)
async def setup_database() -> AsyncGenerator[None, None]:
    """Set up test database before each test."""
    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield
    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)


async def override_get_db() -> AsyncGenerator[AsyncSession, None]:
    """Override database dependency for testing."""
    async with test_async_session_maker() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise


@pytest.fixture
async def db_session() -> AsyncGenerator[AsyncSession, None]:
    """Provide a test database session."""
    async with test_async_session_maker() as session:
        yield session


@pytest.fixture
async def client() -> AsyncGenerator[AsyncClient, None]:
    """Provide an async HTTP client for testing."""
    app.dependency_overrides[get_db] = override_get_db
    async with AsyncClient(
        transport=ASGITransport(app=app),
        base_url="http://test",
    ) as ac:
        yield ac
    app.dependency_overrides.clear()


@pytest.fixture
def admin_headers() -> dict[str, str]:
    """Provide admin authentication headers."""
    return {"X-API-Key": settings.ADMIN_API_KEY}


@pytest.fixture
def invalid_headers() -> dict[str, str]:
    """Provide invalid authentication headers."""
    return {"X-API-Key": "invalid-key"}


@pytest.fixture
async def sample_tag(db_session: AsyncSession) -> Tag:
    """Create a sample tag for testing."""
    tag = Tag(
        name="Python",
        slug="python",
    )
    db_session.add(tag)
    await db_session.commit()
    await db_session.refresh(tag)
    return tag


@pytest.fixture
async def sample_til(db_session: AsyncSession) -> TIL:
    """Create a sample TIL for testing."""
    til = TIL(
        title="Day 1 Learning",
        slug="day-1-learning",
        day_number=1,
        excerpt="Today I learned about Python",
        content="# Python\n\nPython is great!",
        is_published=True,
    )
    db_session.add(til)
    await db_session.commit()
    await db_session.refresh(til)
    return til


@pytest.fixture
async def sample_til_with_tags(db_session: AsyncSession, sample_tag: Tag) -> TIL:
    """Create a sample TIL with tags for testing."""
    til = TIL(
        title="Day 2 Learning",
        slug="day-2-learning",
        day_number=2,
        excerpt="Today I learned more Python",
        content="# More Python\n\nAdvanced topics!",
        is_published=True,
        tags=[sample_tag],
    )
    db_session.add(til)
    await db_session.commit()
    await db_session.refresh(til, ["tags"])
    return til
