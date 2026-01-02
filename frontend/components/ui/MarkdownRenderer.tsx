'use client'

import ReactMarkdown from 'react-markdown'

interface MarkdownRendererProps {
    content: string
    className?: string
}

export function MarkdownRenderer({ content, className = '' }: MarkdownRendererProps) {
    return (
        <div className={`prose prose-invert max-w-none ${className}`}>
            <ReactMarkdown
                components={{
                    h1: ({ node, ...props }) => <h1 className="text-3xl font-bold mb-4 text-lightest-slate" {...props} />,
                    h2: ({ node, ...props }) => <h2 className="text-2xl font-bold mt-8 mb-4 text-lightest-slate" {...props} />,
                    h3: ({ node, ...props }) => <h3 className="text-xl font-semibold mt-6 mb-3 text-lightest-slate" {...props} />,
                    p: ({ node, ...props }) => <p className="mb-4 text-slate leading-relaxed" {...props} />,
                    code: ({ node, inline, ...props }: any) => {
                        if (inline) {
                            return (
                                <code className="bg-gray-800 px-1.5 py-0.5 rounded text-sm text-green font-mono" {...props} />
                            )
                        }
                        return (
                            <code className="block bg-gray-900 p-4 rounded-lg overflow-x-auto text-sm text-slate font-mono" {...props} />
                        )
                    },
                    pre: ({ node, ...props }) => (
                        <pre className="bg-gray-900 p-4 rounded-lg overflow-x-auto mb-4" {...props} />
                    ),
                    ul: ({ node, ...props }) => <ul className="list-disc list-inside mb-4 text-slate space-y-2" {...props} />,
                    ol: ({ node, ...props }) => <ol className="list-decimal list-inside mb-4 text-slate space-y-2" {...props} />,
                    li: ({ node, ...props }) => <li className="text-slate" {...props} />,
                    blockquote: ({ node, ...props }) => (
                        <blockquote className="border-l-4 border-green pl-4 italic text-light-slate mb-4" {...props} />
                    ),
                    a: ({ node, ...props }) => (
                        <a className="text-green hover:underline" {...props} />
                    ),
                    strong: ({ node, ...props }) => (
                        <strong className="font-semibold text-lightest-slate" {...props} />
                    ),
                    em: ({ node, ...props }) => (
                        <em className="italic text-light-slate" {...props} />
                    ),
                }}
            >
                {content}
            </ReactMarkdown>
        </div>
    )
}

