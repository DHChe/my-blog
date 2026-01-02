"""CRUD operations for Book and BookNote models."""

from datetime import date, datetime, timezone
from typing import Optional
from uuid import UUID

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models import Tag
from app.models.book import Book, BookNote
from app.schemas.book import (
    BookCreate,
    BookNoteCreate,
    BookNoteUpdate,
    BookUpdate,
    ReadingStatsResponse,
)
from app.utils.slug import generate_slug

# ============ Book CRUD ============


async def get_existing_book_slugs(db: AsyncSession) -> list[str]:
    """Get all existing Book slugs."""
    result = await db.execute(select(Book.slug))
    return list(result.scalars().all())


async def get_books(
    db: AsyncSession,
    *,
    skip: int = 0,
    limit: int = 10,
    status: Optional[str] = None,
) -> tuple[list[Book], int]:
    """Get Book list with pagination and filtering."""
    query = select(Book).options(selectinload(Book.notes))
    count_query = select(func.count(Book.id))

    if status:
        query = query.where(Book.status == status)
        count_query = count_query.where(Book.status == status)

    query = query.order_by(Book.updated_at.desc())
    query = query.offset(skip).limit(limit)

    result = await db.execute(query)
    count_result = await db.execute(count_query)

    return list(result.scalars().unique().all()), count_result.scalar() or 0


async def get_book_by_id(db: AsyncSession, book_id: UUID) -> Optional[Book]:
    """Get Book by ID."""
    result = await db.execute(
        select(Book).options(selectinload(Book.notes)).where(Book.id == book_id)
    )
    return result.scalar_one_or_none()


async def get_book_by_slug(db: AsyncSession, slug: str) -> Optional[Book]:
    """Get Book by slug."""
    result = await db.execute(
        select(Book).options(selectinload(Book.notes)).where(Book.slug == slug)
    )
    return result.scalar_one_or_none()


async def create_book(db: AsyncSession, book_in: BookCreate) -> Book:
    """Create a new Book."""
    existing_slugs = await get_existing_book_slugs(db)
    slug = generate_slug(book_in.title, existing_slugs)

    book = Book(
        title=book_in.title,
        author=book_in.author,
        cover_image=book_in.cover_image,
        total_chapters=book_in.total_chapters,
        status=book_in.status,
        start_date=book_in.start_date or date.today(),
        slug=slug,
    )

    db.add(book)
    await db.flush()
    await db.refresh(book, ["notes"])
    return book


async def update_book(db: AsyncSession, book: Book, book_in: BookUpdate) -> Book:
    """Update an existing Book."""
    update_data = book_in.model_dump(exclude_unset=True)

    # Auto-set end_date when completing
    if update_data.get("status") == "completed" and not book.end_date:
        update_data["end_date"] = date.today()

    for field, value in update_data.items():
        setattr(book, field, value)

    await db.flush()
    await db.refresh(book, ["notes"])
    return book


async def delete_book(db: AsyncSession, book: Book) -> None:
    """Delete a Book (cascades to notes)."""
    await db.delete(book)
    await db.flush()


# ============ BookNote CRUD ============


async def get_existing_book_note_slugs(db: AsyncSession) -> list[str]:
    """Get all existing BookNote slugs."""
    result = await db.execute(select(BookNote.slug))
    return list(result.scalars().all())


async def get_book_notes(
    db: AsyncSession,
    *,
    book_id: Optional[UUID] = None,
    skip: int = 0,
    limit: int = 10,
    is_published: Optional[bool] = None,
    tag_slug: Optional[str] = None,
    search_query: Optional[str] = None,
) -> tuple[list[BookNote], int]:
    """Get BookNote list with pagination and filtering."""
    query = select(BookNote).options(selectinload(BookNote.tags))
    count_query = select(func.count(BookNote.id))

    if book_id:
        query = query.where(BookNote.book_id == book_id)
        count_query = count_query.where(BookNote.book_id == book_id)

    if is_published is not None:
        query = query.where(BookNote.is_published == is_published)
        count_query = count_query.where(BookNote.is_published == is_published)

    if tag_slug:
        query = query.join(BookNote.tags).where(Tag.slug == tag_slug)
        count_query = count_query.join(BookNote.tags).where(Tag.slug == tag_slug)

    if search_query:
        search_pattern = f"%{search_query}%"
        query = query.where(
            BookNote.chapter_title.ilike(search_pattern)
            | BookNote.content.ilike(search_pattern)
        )
        count_query = count_query.where(
            BookNote.chapter_title.ilike(search_pattern)
            | BookNote.content.ilike(search_pattern)
        )

    query = query.order_by(BookNote.reading_date.desc(), BookNote.created_at.desc())
    query = query.offset(skip).limit(limit)

    result = await db.execute(query)
    count_result = await db.execute(count_query)

    return list(result.scalars().unique().all()), count_result.scalar() or 0


async def get_book_note_by_id(db: AsyncSession, note_id: UUID) -> Optional[BookNote]:
    """Get BookNote by ID."""
    result = await db.execute(
        select(BookNote)
        .options(selectinload(BookNote.tags))
        .where(BookNote.id == note_id)
    )
    return result.scalar_one_or_none()


async def get_book_note_by_slug(db: AsyncSession, slug: str) -> Optional[BookNote]:
    """Get BookNote by slug."""
    result = await db.execute(
        select(BookNote)
        .options(selectinload(BookNote.tags))
        .where(BookNote.slug == slug)
    )
    return result.scalar_one_or_none()


async def create_book_note(
    db: AsyncSession, book: Book, note_in: BookNoteCreate
) -> BookNote:
    """Create a new BookNote."""
    existing_slugs = await get_existing_book_note_slugs(db)
    slug = generate_slug(note_in.chapter_title, existing_slugs)

    # Get tags
    tags: list[Tag] = []
    if note_in.tag_ids:
        result = await db.execute(select(Tag).where(Tag.id.in_(note_in.tag_ids)))
        tags = list(result.scalars().all())

    note = BookNote(
        book_id=book.id,
        chapter_number=note_in.chapter_number,
        chapter_title=note_in.chapter_title,
        pages=note_in.pages,
        content=note_in.content,
        key_takeaways=note_in.key_takeaways,
        questions=note_in.questions,
        reading_date=note_in.reading_date or date.today(),
        is_published=note_in.is_published,
        published_at=datetime.now(timezone.utc) if note_in.is_published else None,
        slug=slug,
        tags=tags,
    )

    db.add(note)
    await db.flush()
    await db.refresh(note, ["tags"])
    return note


async def update_book_note(
    db: AsyncSession, note: BookNote, note_in: BookNoteUpdate
) -> BookNote:
    """Update an existing BookNote."""
    update_data = note_in.model_dump(exclude_unset=True)

    # Handle tag update
    if "tag_ids" in update_data:
        tag_ids = update_data.pop("tag_ids")
        if tag_ids is not None:
            result = await db.execute(select(Tag).where(Tag.id.in_(tag_ids)))
            note.tags = list(result.scalars().all())

    # Handle publish status change
    if "is_published" in update_data:
        if update_data["is_published"] and not note.is_published:
            note.published_at = datetime.now(timezone.utc)
        elif not update_data["is_published"]:
            note.published_at = None

    for field, value in update_data.items():
        setattr(note, field, value)

    await db.flush()
    await db.refresh(note, ["tags"])
    return note


async def delete_book_note(db: AsyncSession, note: BookNote) -> None:
    """Delete a BookNote."""
    await db.delete(note)
    await db.flush()


# ============ Statistics ============


async def get_reading_stats(db: AsyncSession) -> ReadingStatsResponse:
    """Get reading statistics."""
    # Total books count
    total_result = await db.execute(select(func.count(Book.id)))
    total_books = total_result.scalar() or 0

    # Reading books count
    reading_result = await db.execute(
        select(func.count(Book.id)).where(Book.status == "reading")
    )
    reading_books = reading_result.scalar() or 0

    # Completed books count
    completed_result = await db.execute(
        select(func.count(Book.id)).where(Book.status == "completed")
    )
    completed_books = completed_result.scalar() or 0

    # Total notes count
    notes_result = await db.execute(select(func.count(BookNote.id)))
    total_notes = notes_result.scalar() or 0

    # Notes this month
    today = date.today()
    first_of_month = today.replace(day=1)
    month_notes_result = await db.execute(
        select(func.count(BookNote.id)).where(BookNote.reading_date >= first_of_month)
    )
    notes_this_month = month_notes_result.scalar() or 0

    return ReadingStatsResponse(
        total_books=total_books,
        reading_books=reading_books,
        completed_books=completed_books,
        total_notes=total_notes,
        notes_this_month=notes_this_month,
    )
