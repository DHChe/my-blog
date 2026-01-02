"""Test script for Phase 1 verification."""

import asyncio
from datetime import date
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy.orm import sessionmaker

from app.crud.book import (
    create_book,
    create_book_note,
    get_books,
    get_book_notes,
    get_reading_stats,
    update_book,
)
from app.db.base import Base
from app.schemas.book import BookCreate, BookNoteCreate, BookUpdate
from app.config import settings

# Database setup for testing
SQLALCHEMY_DATABASE_URL = settings.DATABASE_URL
engine = create_async_engine(SQLALCHEMY_DATABASE_URL)
AsyncSessionLocal = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)


async def test_book_flow():
    async with AsyncSessionLocal() as db:
        print("1. Creating a book...")
        book_in = BookCreate(
            title="테스트 서적: 네트워크 구조와 원리",
            author="테스트 저자",
            total_chapters=10,
            status="reading",
        )
        book = await create_book(db, book_in)
        print(f"Created book: {book.title} (Slug: {book.slug})")

        print("\n2. Creating a book note...")
        note_in = BookNoteCreate(
            chapter_number=1,
            chapter_title="계층 구조 모델",
            pages="10-25",
            content="이것은 네트워크 계층 구조에 대한 테스트 노트입니다.",
            key_takeaways=["OSI 7계층", "TCP/IP 4계층"],
            is_published=True,
        )
        note = await create_book_note(db, book, note_in)
        print(f"Created note: {note.chapter_title} (ID: {note.id})")

        print("\n3. Verifying reading stats...")
        stats = await get_reading_stats(db)
        print(f"Stats: {stats.model_dump()}")

        print("\n4. Listing books...")
        books, total = await get_books(db)
        print(f"Total books: {total}")
        for b in books:
            print(f"- {b.title} (Status: {b.status})")

        print("\n5. Listing notes for the book...")
        notes, total_notes = await get_book_notes(db, book_id=book.id)
        print(f"Total notes for book: {total_notes}")
        for n in notes:
            print(f"- {n.chapter_title} (Date: {n.reading_date})")

        print("\n6. Updating book status to completed...")
        updated_book = await update_book(db, book, BookUpdate(status="completed"))
        print(f"Updated status: {updated_book.status}, End date: {updated_book.end_date}")

        print("\n7. Final stats check...")
        final_stats = await get_reading_stats(db)
        print(f"Final Stats: {final_stats.model_dump()}")
        
        # Cleanup (optional, but keep for now to see in DB)
        print("\nVerification successful!")


if __name__ == "__main__":
    asyncio.run(test_book_flow())
