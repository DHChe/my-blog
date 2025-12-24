import { Container } from "@/components/layout/Container"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Github, Mail } from "lucide-react"

export default function AboutPage() {
    return (
        <Container className="py-10">
            <div className="mx-auto max-w-3xl space-y-8">
                <div className="space-y-2">
                    <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">함께 성장하는 개발자, [이름]입니다.</h1>
                    <p className="text-gray-500 dark:text-gray-400">
                        새로운 기술을 배우고 적용하는 것을 즐깁니다.
                    </p>
                </div>

                <div className="space-y-4">
                    <h2 className="text-2xl font-bold">소개</h2>
                    <p className="text-muted-foreground leading-relaxed">
                        안녕하세요! 저는 백엔드 개발에 깊은 관심을 가지고 있는 주니어 개발자입니다.<br />
                        현재 [부트캠프 과정명] 과정을 수료 중이며, Python, FastAPI, Next.js 등을 주로 다루고 있습니다.<br />
                        문제 해결 과정에서 얻은 배움을 블로그에 기록하며 지식을 공유하는 것을 좋아합니다.
                    </p>
                </div>

                <div className="space-y-4">
                    <h2 className="text-2xl font-bold">기술 스택</h2>
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <div>
                            <h3 className="mb-2 font-semibold">Backend</h3>
                            <ul className="list-inside list-disc text-muted-foreground">
                                <li>Python</li>
                                <li>FastAPI / Flask</li>
                                <li>PostgreSQL / MySQL</li>
                                <li>Docker</li>
                            </ul>
                        </div>
                        <div>
                            <h3 className="mb-2 font-semibold">Frontend</h3>
                            <ul className="list-inside list-disc text-muted-foreground">
                                <li>JavaScript / TypeScript</li>
                                <li>React / Next.js</li>
                                <li>Tailwind CSS</li>
                            </ul>
                        </div>
                    </div>
                </div>

                <div className="space-y-4">
                    <h2 className="text-2xl font-bold">연락처</h2>
                    <div className="flex flex-col gap-2 sm:flex-row">
                        <Link href="https://github.com/midiummin" target="_blank">
                            <Button variant="outline" className="w-full sm:w-auto">
                                <Github className="mr-2 h-4 w-4" />
                                GitHub
                            </Button>
                        </Link>
                        <Link href="mailto:your.email@example.com">
                            <Button variant="outline" className="w-full sm:w-auto">
                                <Mail className="mr-2 h-4 w-4" />
                                Email
                            </Button>
                        </Link>
                    </div>
                </div>
            </div>
        </Container>
    )
}
