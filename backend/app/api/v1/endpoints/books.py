"""Book and BookNote API endpoints."""

from typing import Optional
from uuid import UUID

from fastapi import APIRouter, HTTPException, Query, status

from app.api.deps import AdminAuth, DbSession
from app.crud import book_crud
from app.schemas import (
    BookCreate,
    BookListResponse,
    BookNoteCreate,
    BookNoteListResponse,
    BookNoteResponse,
    BookNoteUpdate,
    BookResponse,
    BookUpdate,
    BookWithNotesResponse,
    ReadingStatsResponse,
)

router = APIRouter(prefix="/books", tags=["books"])


# ============ Book Endpoints ============


@router.get("", response_model=BookListResponse)
async def list_books(
    db: DbSession,
    page: int = Query(1, ge=1, description="Page number"),
    size: int = Query(10, ge=1, le=100, description="Page size"),
    status_filter: Optional[str] = Query(
        None, alias="status", description="Filter by status: reading, completed, on_hold"
    ),
) -> BookListResponse:
    """Get paginated book list.

    - Supports pagination with page and size parameters
    - Filter by status (reading, completed, on_hold)
    - Ordered by updated_at descending
    """
    skip = (page - 1) * size
    books, total = await book_crud.get_books(
        db,
        skip=skip,
        limit=size,
        status=status_filter,
    )

    pages = (total + size - 1) // size if total > 0 else 0

    # Add computed fields
    items = []
    for book in books:
        book_dict = BookResponse.model_validate(book).model_dump()
        notes_count = len(book.notes) if book.notes else 0
        # Count published notes for progress
        published_notes = len([n for n in (book.notes or []) if n.is_published])
        progress = (
            (published_notes / book.total_chapters * 100)
            if book.total_chapters > 0
            else 0.0
        )
        book_dict["notes_count"] = notes_count
        book_dict["progress"] = min(progress, 100.0)
        items.append(BookResponse(**book_dict))

    return BookListResponse(
        items=items,
        total=total,
        page=page,
        size=size,
        pages=pages,
    )


@router.get("/stats", response_model=ReadingStatsResponse)
async def get_reading_stats(db: DbSession) -> ReadingStatsResponse:
    """Get reading statistics."""
    return await book_crud.get_reading_stats(db)


@router.get("/{slug}", response_model=BookWithNotesResponse)
async def get_book(db: DbSession, slug: str) -> BookWithNotesResponse:
    """Get book by slug with notes."""
    book = await book_crud.get_book_by_slug(db, slug)
    if not book:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Book not found",
        )

    # Build response with computed fields
    book_dict = BookWithNotesResponse.model_validate(book).model_dump()
    notes_count = len(book.notes) if book.notes else 0
    published_notes = len([n for n in (book.notes or []) if n.is_published])
    progress = (
        (published_notes / book.total_chapters * 100)
        if book.total_chapters > 0
        else 0.0
    )
    book_dict["notes_count"] = notes_count
    book_dict["progress"] = min(progress, 100.0)

    return BookWithNotesResponse(**book_dict)


@router.post("", response_model=BookResponse, status_code=status.HTTP_201_CREATED)
async def create_book(
    db: DbSession,
    _: AdminAuth,
    book_in: BookCreate,
) -> BookResponse:
    """Create a new book (admin only)."""
    book = await book_crud.create_book(db, book_in)
    book_dict = BookResponse.model_validate(book).model_dump()
    book_dict["notes_count"] = 0
    book_dict["progress"] = 0.0
    return BookResponse(**book_dict)


@router.put("/{book_id}", response_model=BookResponse)
async def update_book(
    db: DbSession,
    _: AdminAuth,
    book_id: UUID,
    book_in: BookUpdate,
) -> BookResponse:
    """Update a book (admin only)."""
    book = await book_crud.get_book_by_id(db, book_id)
    if not book:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Book not found",
        )
    book = await book_crud.update_book(db, book, book_in)

    book_dict = BookResponse.model_validate(book).model_dump()
    notes_count = len(book.notes) if book.notes else 0
    published_notes = len([n for n in (book.notes or []) if n.is_published])
    progress = (
        (published_notes / book.total_chapters * 100)
        if book.total_chapters > 0
        else 0.0
    )
    book_dict["notes_count"] = notes_count
    book_dict["progress"] = min(progress, 100.0)
    return BookResponse(**book_dict)


@router.delete("/{book_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_book(
    db: DbSession,
    _: AdminAuth,
    book_id: UUID,
) -> None:
    """Delete a book (admin only). Cascades to notes."""
    book = await book_crud.get_book_by_id(db, book_id)
    if not book:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Book not found",
        )
    await book_crud.delete_book(db, book)


# ============ BookNote Endpoints ============


@router.get("/{book_slug}/notes", response_model=BookNoteListResponse)
async def list_book_notes(
    db: DbSession,
    book_slug: str,
    page: int = Query(1, ge=1, description="Page number"),
    size: int = Query(10, ge=1, le=100, description="Page size"),
    published: Optional[bool] = Query(None, description="Filter by published status"),
    tag: Optional[str] = Query(None, description="Filter by tag slug"),
    q: Optional[str] = Query(None, description="Search query"),
) -> BookNoteListResponse:
    """Get paginated notes for a book with search/filter."""
    book = await book_crud.get_book_by_slug(db, book_slug)
    if not book:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Book not found",
        )

    skip = (page - 1) * size
    notes, total = await book_crud.get_book_notes(
        db,
        book_id=book.id,
        skip=skip,
        limit=size,
        is_published=published,
        tag_slug=tag,
        search_query=q,
    )

    pages = (total + size - 1) // size if total > 0 else 0

    return BookNoteListResponse(
        items=[BookNoteResponse.model_validate(note) for note in notes],
        total=total,
        page=page,
        size=size,
        pages=pages,
    )


@router.get("/{book_slug}/notes/{note_slug}", response_model=BookNoteResponse)
async def get_book_note(
    db: DbSession,
    book_slug: str,
    note_slug: str,
) -> BookNoteResponse:
    """Get a specific note by slug."""
    book = await book_crud.get_book_by_slug(db, book_slug)
    if not book:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Book not found",
        )

    note = await book_crud.get_book_note_by_slug(db, note_slug)
    if not note or note.book_id != book.id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Note not found",
        )

    return BookNoteResponse.model_validate(note)


@router.post(
    "/{book_slug}/notes",
    response_model=BookNoteResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create_book_note(
    db: DbSession,
    _: AdminAuth,
    book_slug: str,
    note_in: BookNoteCreate,
) -> BookNoteResponse:
    """Create a new note for a book (admin only)."""
    book = await book_crud.get_book_by_slug(db, book_slug)
    if not book:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Book not found",
        )

    note = await book_crud.create_book_note(db, book, note_in)
    return BookNoteResponse.model_validate(note)


@router.put("/{book_slug}/notes/{note_id}", response_model=BookNoteResponse)
async def update_book_note(
    db: DbSession,
    _: AdminAuth,
    book_slug: str,
    note_id: UUID,
    note_in: BookNoteUpdate,
) -> BookNoteResponse:
    """Update a note (admin only)."""
    book = await book_crud.get_book_by_slug(db, book_slug)
    if not book:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Book not found",
        )

    note = await book_crud.get_book_note_by_id(db, note_id)
    if not note or note.book_id != book.id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Note not found",
        )

    note = await book_crud.update_book_note(db, note, note_in)
    return BookNoteResponse.model_validate(note)


@router.delete("/{book_slug}/notes/{note_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_book_note(
    db: DbSession,
    _: AdminAuth,
    book_slug: str,
    note_id: UUID,
) -> None:
    """Delete a note (admin only)."""
    book = await book_crud.get_book_by_slug(db, book_slug)
    if not book:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Book not found",
        )

    note = await book_crud.get_book_note_by_id(db, note_id)
    if not note or note.book_id != book.id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Note not found",
        )

    await book_crud.delete_book_note(db, note)


# ============ AI Summary Endpoint ============


@router.post("/{book_slug}/notes/{note_id}/summarize", response_model=BookNoteResponse)
async def generate_ai_summary(
    db: DbSession,
    _: AdminAuth,
    book_slug: str,
    note_id: UUID,
) -> BookNoteResponse:
    """Generate AI summary for a book note (admin only)."""
    from app.schemas.book import BookNoteUpdate
    from app.services.ai.generator import generate_book_note_summary

    book = await book_crud.get_book_by_slug(db, book_slug)
    if not book:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Book not found",
        )

    note = await book_crud.get_book_note_by_id(db, note_id)
    if not note or note.book_id != book.id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Note not found",
        )

    # Generate AI summary
    summary = await generate_book_note_summary(
        content=note.content,
        key_takeaways=note.key_takeaways or [],
    )

    # Update the note with the summary
    note = await book_crud.update_book_note(
        db, note, BookNoteUpdate(ai_summary=summary)
    )

    return BookNoteResponse.model_validate(note)

