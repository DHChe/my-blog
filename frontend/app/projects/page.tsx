import { Container } from "@/components/layout/Container"
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import Link from "next/link"

const projects = [
    {
        title: "My Blog",
        description: "Next.js와 FastAPI로 구축한 개인 기술 블로그입니다. 마크다운 포스팅 작성, 태그 관리 기능을 제공하며 모던한 디자인을 적용했습니다.",
        tags: ["Next.js", "FastAPI", "PostgreSQL", "Tailwind CSS"],
        link: "https://github.com/midiummin/my-blog",
    },
    {
        title: "Project Alpha",
        description: "팀 프로젝트로 진행한 웹 애플리케이션입니다. 실시간 데이터 처리와 대시보드 기능을 중점으로 개발했습니다.",
        tags: ["React", "Node.js", "Socket.io"],
        link: "#",
    },
    // Add more projects here
]

export default function ProjectsPage() {
    return (
        <Container className="py-10">
            <div className="flex flex-col items-start gap-4 md:flex-row md:justify-between md:gap-8">
                <div className="flex-1 space-y-4">
                    <h1 className="inline-block font-bold tracking-tight text-4xl lg:text-5xl">
                        프로젝트
                    </h1>
                    <p className="text-xl text-muted-foreground">
                        진행한 개인 및 팀 프로젝트들을 소개합니다.
                    </p>
                </div>
            </div>
            <hr className="my-8" />
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {projects.map((project, index) => (
                    <Card key={index} className="flex flex-col overflow-hidden">
                        <CardHeader>
                            <CardTitle>{project.title}</CardTitle>
                            <CardDescription className="mt-2 line-clamp-3">
                                {project.description}
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="flex-1">
                            <div className="flex flex-wrap gap-2">
                                {project.tags.map((tag) => (
                                    <Badge key={tag} variant="secondary">
                                        {tag}
                                    </Badge>
                                ))}
                            </div>
                        </CardContent>
                        <CardFooter>
                            <Link href={project.link} target="_blank" className="w-full">
                                <Button className="w-full">자세히 보기</Button>
                            </Link>
                        </CardFooter>
                    </Card>
                ))}
            </div>
        </Container>
    )
}
