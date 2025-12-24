import { getPosts } from "@/lib/api"
import { PostCard } from "@/components/blog/PostCard"
import { Container } from "@/components/layout/Container"

export const dynamic = 'force-dynamic'

export default async function BlogPage() {
    const { items: posts } = await getPosts()

    return (
        <Container className="py-10">
            <div className="flex flex-col items-start gap-4 md:flex-row md:justify-between md:gap-8">
                <div className="flex-1 space-y-4">
                    <h1 className="inline-block font-bold tracking-tight text-4xl lg:text-5xl">
                        TIL
                    </h1>
                    <p className="text-xl text-muted-foreground">
                        매일 배운 내용을 기록하는 공간입니다.
                    </p>
                </div>
            </div>
            <hr className="my-8" />
            {posts.length > 0 ? (
                <div className="grid gap-10 sm:grid-cols-2">
                    {posts.map((post) => (
                        <PostCard
                            key={post.id}
                            title={post.title}
                            description={post.excerpt}
                            date={post.published_at || post.created_at}
                            tags={post.tags}
                            slug={post.slug}
                        />
                    ))}
                </div>
            ) : (
                <p>게시글이 없습니다.</p>
            )}
        </Container>
    )
}
