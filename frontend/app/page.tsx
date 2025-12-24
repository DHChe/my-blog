import { Container } from "@/components/layout/Container"
import { PostCard } from "@/components/blog/PostCard"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import Link from "next/link"
import { getPosts } from "@/lib/api"
import { ArrowRight, Github } from "lucide-react"

export const dynamic = 'force-dynamic'

export default async function Home() {
  // Fetch latest 3 TIL posts
  const { items: latestPosts } = await getPosts(1, 3).catch(() => ({ items: [] }));

  return (
    <Container className="py-10">
      {/* 1. Hero Section */}
      <section className="mx-auto flex max-w-[980px] flex-col items-center gap-4 py-8 md:py-12 md:pb-8 lg:py-24 lg:pb-20 text-center">
        <h1 className="text-3xl font-bold leading-tight tracking-tighter md:text-5xl lg:text-6xl lg:leading-[1.1]">
          안녕하세요, <span className="text-primary">Astral Pig</span>입니다.
        </h1>
        <p className="max-w-[750px] text-lg text-muted-foreground sm:text-xl">
          현재 백엔드 과정중이며 풀스택 개발자로 성장하고 있습니다.<br />
          배운 것을 기록하고, 만든 것을 공유합니다.
        </p>
        <div className="flex gap-4 mt-4">
          <Link href="/about">
            <Button size="lg">더 알아보기</Button>
          </Link>
          <Link href="https://github.com/midiummin" target="_blank">
            <Button variant="outline" size="lg">
              <Github className="mr-2 h-4 w-4" />
              GitHub
            </Button>
          </Link>
        </div>
      </section>

      {/* 2. Recent TILs */}
      <section className="py-12">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-3xl font-bold tracking-tight">최신 학습 기록 (TIL)</h2>
          <Link href="/til" className="text-sm font-medium text-primary hover:underline flex items-center">
            전체 보기 <ArrowRight className="ml-1 h-4 w-4" />
          </Link>
        </div>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {latestPosts.length > 0 ? (
            latestPosts.map((post) => (
              <PostCard
                key={post.id}
                title={post.title}
                description={post.excerpt || post.content.substring(0, 100) + "..."}
                date={post.published_at || post.created_at}
                tags={post.tags}
                slug={post.slug}
              />
            ))
          ) : (
            <p className="text-muted-foreground col-span-full text-center py-10">
              아직 작성된 TIL이 없습니다.
            </p>
          )}
        </div>
      </section>

      {/* 3. Featured Projects */}
      <section className="py-12 border-t">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-3xl font-bold tracking-tight">주요 프로젝트</h2>
          <Link href="/projects" className="text-sm font-medium text-primary hover:underline flex items-center">
            전체 보기 <ArrowRight className="ml-1 h-4 w-4" />
          </Link>
        </div>
        <div className="grid gap-6 sm:grid-cols-2">
          {/* Placeholder Project 1 */}
          <Card className="flex flex-col">
            <CardHeader>
              <CardTitle>My Blog</CardTitle>
              <CardDescription>Next.js & FastAPI 기반 기술 블로그</CardDescription>
            </CardHeader>
            <CardContent className="flex-1">
              <p className="text-muted-foreground mb-4">
                개인 학습 기록과 포트폴리오 관리를 위해 직접 구축한 블로그 서비스입니다.
                Markdown 렌더링, 태그 관리, 관리자 기능을 포함합니다.
              </p>
              <div className="flex flex-wrap gap-2">
                <Badge variant="secondary">Next.js</Badge>
                <Badge variant="secondary">FastAPI</Badge>
                <Badge variant="secondary">PostgreSQL</Badge>
              </div>
            </CardContent>
            <CardFooter>
              <Link href="https://github.com/midiummin/my-blog" target="_blank" className="w-full">
                <Button variant="outline" className="w-full">GitHub 보기</Button>
              </Link>
            </CardFooter>
          </Card>

          {/* Placeholder Project 2 */}
          <Card className="flex flex-col">
            <CardHeader>
              <CardTitle>쇼핑몰 프로젝트 (예시)</CardTitle>
              <CardDescription>MSA 아키텍처 기반 이커머스 플랫폼</CardDescription>
            </CardHeader>
            <CardContent className="flex-1">
              <p className="text-muted-foreground mb-4">
                대규모 트래픽 처리를 고려한 쇼핑몰 백엔드 API 서버입니다.
                주문, 결제, 재고 관리 로직을 마이크로서비스로 분리하여 구현했습니다.
              </p>
              <div className="flex flex-wrap gap-2">
                <Badge variant="secondary">Spring Boot</Badge>
                <Badge variant="secondary">Kafka</Badge>
                <Badge variant="secondary">Redis</Badge>
              </div>
            </CardContent>
            <CardFooter>
              <Link href="#" className="w-full">
                <Button variant="outline" className="w-full">자세히 보기</Button>
              </Link>
            </CardFooter>
          </Card>
        </div>
      </section>

      {/* 4. Tech Stack */}
      <section className="py-12 border-t text-center">
        <h2 className="text-3xl font-bold tracking-tight mb-8">기술 스택</h2>
        <div className="flex flex-wrap justify-center gap-4 max-w-3xl mx-auto">
          {["Python", "FastAPI", "Django", "JavaScript", "TypeScript", "React", "Next.js", "PostgreSQL", "Docker", "AWS", "Git"].map((tech) => (
            <Badge key={tech} variant="outline" className="text-lg py-2 px-4">
              {tech}
            </Badge>
          ))}
        </div>
      </section>
    </Container>
  )
}
