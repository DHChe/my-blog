import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import {
    Card,
    CardContent,
    CardFooter,
    CardHeader,
} from "@/components/ui/card"

interface PostCardProps {
    title: string
    description?: string
    date: string
    tags: { name: string; slug: string }[]
    slug: string
}

export function PostCard({ title, description, date, tags, slug }: PostCardProps) {
    return (
        <Link href={`/til/${slug}`}>
            <Card className="h-full overflow-hidden transition-all hover:scale-[1.02] hover:shadow-lg">
                <CardHeader>
                    <div className="flex flex-wrap gap-2 text-sm text-muted-foreground">
                        <time dateTime={date}>
                            {new Date(date).toLocaleDateString("ko-KR", {
                                year: "numeric",
                                month: "long",
                                day: "numeric",
                            })}
                        </time>
                    </div>
                    <h3 className="line-clamp-2 text-2xl font-bold leading-tight tracking-tight">
                        {title}
                    </h3>
                </CardHeader>
                <CardContent>
                    <p className="line-clamp-3 text-muted-foreground">
                        {description}
                    </p>
                </CardContent>
                <CardFooter className="flex flex-wrap gap-2">
                    {tags.map((tag) => (
                        <Badge key={tag.slug} variant="secondary">
                            {tag.name}
                        </Badge>
                    ))}
                </CardFooter>
            </Card>
        </Link>
    )
}
