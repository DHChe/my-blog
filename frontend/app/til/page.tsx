import { getPosts, type TILResponse } from "@/lib/api";
import { TILPageWrapper } from "@/components/layout/TILPageWrapper";
import { TILCard } from "@/components/til/TILCard";
import { Pagination } from "@/components/til/Pagination";

export const dynamic = "force-dynamic";

interface PageProps {
    searchParams: Promise<{
        page?: string;
    }>;
}

export default async function TILListPage({ searchParams }: PageProps) {
    const params = await searchParams;
    const currentPage = parseInt(params.page || "1", 10);
    const pageSize = 9; // 3x3 grid

    // 발행된 TIL만 표시
    const { items: posts, total, page, pages } = await getPosts(
        currentPage,
        pageSize,
        undefined,
        true // published=true: 발행된 TIL만 가져오기
    );

    return (
        <TILPageWrapper showBackLink={true} backLinkHref="/" backLinkText="홈으로">
            <section aria-label="TIL 목록">
                {posts.length > 0 ? (
                    <>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {posts.map((post: TILResponse) => (
                                <div key={post.id}>
                                    <TILCard
                                        title={post.title}
                                        date={post.published_at || post.created_at}
                                        excerpt={post.excerpt}
                                        tags={post.tags}
                                        slug={post.slug}
                                        dayNumber={post.day_number}
                                    />
                                </div>
                            ))}
                        </div>
                        <Pagination
                            currentPage={page}
                            totalPages={pages}
                            basePath="/til"
                        />
                    </>
                ) : (
                    <div className="text-center py-12">
                        <p className="text-lg text-slate">
                            아직 작성된 TIL이 없습니다.
                        </p>
                        <p className="mt-2 text-sm text-slate/70">
                            곧 새로운 내용으로 찾아뵙겠습니다.
                        </p>
                    </div>
                )}
            </section>
        </TILPageWrapper>
    );
}
