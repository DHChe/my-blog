import { getPostBySlug } from "@/lib/api"
import { Container } from "@/components/layout/Container"
import { Badge } from "@/components/ui/badge"
import { notFound } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ChevronLeft } from "lucide-react"

export const dynamic = 'force-dynamic'

interface PageProps {
    params: Promise<{
        slug: string
    }>
}

export default async function PostPage({ params }: PageProps) {
    const { slug } = await params
    const post = await getPostBySlug(slug)

    if (!post) {
        notFound()
    }

    return (
        <Container className="py-10">
            <Link href="/til">
                <Button variant="ghost" className="mb-8 pl-0 hover:bg-transparent hover:text-primary">
                    <ChevronLeft className="mr-2 h-4 w-4" />
                    목록으로 돌아가기
                </Button>
            </Link>

            <article className="prose prose-zinc mx-auto dark:prose-invert lg:prose-xl">
                <div className="mb-8 text-center">
                    <div className="mb-4 flex justify-center gap-2">
                        {post.tags.map((tag) => (
                            <Badge key={tag.slug} variant="secondary">
                                {tag.name}
                            </Badge>
                        ))}
                    </div>
                    <h1 className="mb-2 text-3xl font-bold leading-tight tracking-tighter md:text-4xl lg:text-5xl">
                        {post.title}
                    </h1>
                    <time dateTime={post.published_at || post.created_at} className="text-muted-foreground">
                        {new Date(post.published_at || post.created_at).toLocaleDateString("ko-KR", {
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                        })}
                    </time>
                </div>

                <div className="mt-8">
                    {/* 참고: 현재는 텍스트로 표시됩니다. 추후 마크다운 파서를 적용할 예정입니다. */}
                    <div className="whitespace-pre-wrap font-sans">
                        {post.content}
                    </div>
                </div>
            </article>
        </Container>
    )
}
