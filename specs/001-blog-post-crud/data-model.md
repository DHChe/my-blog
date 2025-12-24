# Data Model: Blog Post CRUD

**Feature**: 001-blog-post-crud
**Date**: 2025-12-21
**Database**: PostgreSQL 15+

## Entity Relationship Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                          posts                               │
├─────────────────────────────────────────────────────────────┤
│ id              : UUID (PK)                                  │
│ title           : VARCHAR(200) NOT NULL                      │
│ slug            : VARCHAR(250) NOT NULL UNIQUE               │
│ content         : TEXT (max 50,000 chars)                    │
│ status          : ENUM('draft', 'published') DEFAULT 'draft' │
│ created_at      : TIMESTAMP WITH TIME ZONE NOT NULL          │
│ updated_at      : TIMESTAMP WITH TIME ZONE                   │
│ published_at    : TIMESTAMP WITH TIME ZONE                   │
└─────────────────────────────────────────────────────────────┘
         │
         │ M:N
         ▼
┌─────────────────────────────────────────────────────────────┐
│                        post_tags                             │
├─────────────────────────────────────────────────────────────┤
│ post_id         : UUID (FK → posts.id) PK                    │
│ tag_id          : UUID (FK → tags.id) PK                     │
└─────────────────────────────────────────────────────────────┘
         │
         │
         ▼
┌─────────────────────────────────────────────────────────────┐
│                          tags                                │
├─────────────────────────────────────────────────────────────┤
│ id              : UUID (PK)                                  │
│ name            : VARCHAR(50) NOT NULL UNIQUE                │
│ slug            : VARCHAR(60) NOT NULL UNIQUE                │
│ created_at      : TIMESTAMP WITH TIME ZONE NOT NULL          │
└─────────────────────────────────────────────────────────────┘
```

## Entities

### Post

블로그 포스트를 나타내는 핵심 엔티티입니다.

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `id` | UUID | PK, auto-generated | 고유 식별자 |
| `title` | VARCHAR(200) | NOT NULL | 포스트 제목 |
| `slug` | VARCHAR(250) | NOT NULL, UNIQUE | URL 식별자 |
| `content` | TEXT | max 50,000 chars | 포스트 본문 (Markdown) |
| `status` | ENUM | DEFAULT 'draft' | 상태: draft, published |
| `created_at` | TIMESTAMPTZ | NOT NULL, auto | 생성 일시 |
| `updated_at` | TIMESTAMPTZ | nullable, auto | 수정 일시 |
| `published_at` | TIMESTAMPTZ | nullable | 최초 공개 일시 |

**Indexes**:
- `idx_posts_slug` ON `slug` (UNIQUE)
- `idx_posts_status_created` ON `status`, `created_at DESC` (목록 조회 최적화)
- `idx_posts_created_at` ON `created_at DESC` (정렬)

**Validation Rules**:
- `title`: 1-200자, 공백만으로 구성 불가
- `content`: 최대 50,000자
- `slug`: 자동 생성, 영문 소문자/숫자/하이픈만 허용

**State Transitions**:
```
draft ──(publish)──▶ published
  ▲                      │
  └───(unpublish)────────┘
```

---

### Tag

포스트 분류를 위한 태그 엔티티입니다.

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `id` | UUID | PK, auto-generated | 고유 식별자 |
| `name` | VARCHAR(50) | NOT NULL, UNIQUE | 태그 이름 (표시용) |
| `slug` | VARCHAR(60) | NOT NULL, UNIQUE | URL용 태그 식별자 |
| `created_at` | TIMESTAMPTZ | NOT NULL, auto | 생성 일시 |

**Indexes**:
- `idx_tags_name` ON `name` (UNIQUE)
- `idx_tags_slug` ON `slug` (UNIQUE)

**Validation Rules**:
- `name`: 1-50자, 공백 허용, 중복 불가
- `slug`: 자동 생성, 영문 소문자/숫자/하이픈만 허용

---

### PostTag (Association Table)

Post와 Tag의 다대다 관계를 나타내는 연결 테이블입니다.

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `post_id` | UUID | FK, PK | Post 참조 |
| `tag_id` | UUID | FK, PK | Tag 참조 |

**Constraints**:
- `PRIMARY KEY (post_id, tag_id)`
- `ON DELETE CASCADE` for both FKs

---

## SQLAlchemy Models

### Post Model

```python
from sqlalchemy import Column, String, Text, Enum, DateTime, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
import uuid
import enum

class PostStatus(str, enum.Enum):
    DRAFT = "draft"
    PUBLISHED = "published"

class Post(Base):
    __tablename__ = "posts"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    title = Column(String(200), nullable=False)
    slug = Column(String(250), nullable=False, unique=True, index=True)
    content = Column(Text, nullable=True)
    status = Column(
        Enum(PostStatus, name="post_status"),
        nullable=False,
        default=PostStatus.DRAFT
    )
    created_at = Column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now()
    )
    updated_at = Column(
        DateTime(timezone=True),
        onupdate=func.now()
    )
    published_at = Column(DateTime(timezone=True), nullable=True)

    # Relationships
    tags = relationship(
        "Tag",
        secondary="post_tags",
        back_populates="posts",
        lazy="selectin"
    )

    __table_args__ = (
        Index("idx_posts_status_created", "status", "created_at", postgresql_using="btree"),
    )
```

### Tag Model

```python
class Tag(Base):
    __tablename__ = "tags"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(50), nullable=False, unique=True)
    slug = Column(String(60), nullable=False, unique=True, index=True)
    created_at = Column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now()
    )

    # Relationships
    posts = relationship(
        "Post",
        secondary="post_tags",
        back_populates="tags",
        lazy="selectin"
    )
```

### Association Table

```python
from sqlalchemy import Table, Column, ForeignKey

post_tags = Table(
    "post_tags",
    Base.metadata,
    Column(
        "post_id",
        UUID(as_uuid=True),
        ForeignKey("posts.id", ondelete="CASCADE"),
        primary_key=True
    ),
    Column(
        "tag_id",
        UUID(as_uuid=True),
        ForeignKey("tags.id", ondelete="CASCADE"),
        primary_key=True
    ),
)
```

---

## Pydantic Schemas

### Request Schemas

```python
from pydantic import BaseModel, Field, field_validator
from datetime import datetime
from uuid import UUID

class PostCreate(BaseModel):
    title: str = Field(..., min_length=1, max_length=200)
    content: str | None = Field(None, max_length=50000)
    status: PostStatus = PostStatus.DRAFT
    tags: list[str] = Field(default_factory=list)

    @field_validator("title")
    @classmethod
    def title_not_empty(cls, v: str) -> str:
        if not v.strip():
            raise ValueError("Title cannot be empty or whitespace only")
        return v.strip()

class PostUpdate(BaseModel):
    title: str | None = Field(None, min_length=1, max_length=200)
    content: str | None = Field(None, max_length=50000)
    status: PostStatus | None = None
    tags: list[str] | None = None
```

### Response Schemas

```python
class TagResponse(BaseModel):
    id: UUID
    name: str
    slug: str

    model_config = {"from_attributes": True}

class PostResponse(BaseModel):
    id: UUID
    title: str
    slug: str
    content: str | None
    status: PostStatus
    created_at: datetime
    updated_at: datetime | None
    published_at: datetime | None
    tags: list[TagResponse]

    model_config = {"from_attributes": True}

class PostListItem(BaseModel):
    id: UUID
    title: str
    slug: str
    status: PostStatus
    created_at: datetime
    tags: list[TagResponse]
    excerpt: str | None  # content의 처음 200자

    model_config = {"from_attributes": True}

class PostListResponse(BaseModel):
    items: list[PostListItem]
    total: int
    page: int
    page_size: int
    total_pages: int
```

---

## Migration Strategy

### Initial Migration

```sql
-- 001_create_posts_table.sql
CREATE TYPE post_status AS ENUM ('draft', 'published');

CREATE TABLE posts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(200) NOT NULL,
    slug VARCHAR(250) NOT NULL UNIQUE,
    content TEXT,
    status post_status NOT NULL DEFAULT 'draft',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE,
    published_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_posts_slug ON posts(slug);
CREATE INDEX idx_posts_status_created ON posts(status, created_at DESC);
CREATE INDEX idx_posts_created_at ON posts(created_at DESC);

CREATE TABLE tags (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(50) NOT NULL UNIQUE,
    slug VARCHAR(60) NOT NULL UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_tags_name ON tags(name);
CREATE INDEX idx_tags_slug ON tags(slug);

CREATE TABLE post_tags (
    post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
    tag_id UUID REFERENCES tags(id) ON DELETE CASCADE,
    PRIMARY KEY (post_id, tag_id)
);
```

---

## Data Constraints Summary

| Entity | Field | Constraint |
|--------|-------|------------|
| Post | title | 1-200 chars, not blank |
| Post | content | max 50,000 chars |
| Post | slug | unique, auto-generated |
| Post | status | enum: draft, published |
| Tag | name | 1-50 chars, unique |
| Tag | slug | unique, auto-generated |
