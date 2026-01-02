import { getBookList, getReadingStats } from '@/lib/api'
import { BookCard } from '@/components/books/BookCard'
import { ReadingStats } from '@/components/books/ReadingStats'
import { Metadata } from 'next'

export const metadata: Metadata = {
    title: '독서 노트 | My Blog',
    description: '읽고 있는 책들과 그 과정에서 배운 것들을 정리한 독서 노트입니다.',
}

export default async function BooksPage() {
    const [booksData, stats] = await Promise.all([
        getBookList(1, 100),
        getReadingStats(),
    ])

    return (
        <div className="max-w-7xl mx-auto px-6 py-12">
            <header className="mb-16">
                <h1 className="text-4xl md:text-5xl font-black text-slate-100 mb-4 italic tracking-tight">
                    BOOK <span className="text-emerald-500 underline decoration-4 underline-offset-8">NOTES</span>
                </h1>
                <p className="text-slate-400 max-w-2xl leading-relaxed">
                    책을 읽으며 중요하다고 생각한 내용, 새롭게 알게 된 것, 그리고 스스로에게 던진 질문들을 기록합니다.
                    단순한 요약을 넘어 저의 언어로 소화한 지식들을 담고 있습니다.
                </p>
            </header>

            <section className="mb-20">
                <ReadingStats stats={stats} />
            </section>

            <section>
                <div className="flex items-center justify-between mb-8">
                    <h2 className="text-xl font-bold text-slate-200 flex items-center gap-3">
                        <span className="w-1.5 h-6 bg-emerald-500 rounded-full" />
                        최근 읽은 도서
                    </h2>
                </div>

                {booksData.items.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {booksData.items.map((book) => (
                            <BookCard key={book.id} book={book} />
                        ))}
                    </div>
                ) : (
                    <div className="py-20 text-center bg-slate-900/30 border border-dashed border-slate-800 rounded-3xl">
                        <p className="text-slate-500 italic">아직 등록된 도서가 없습니다.</p>
                    </div>
                )}
            </section>
        </div>
    )
}
