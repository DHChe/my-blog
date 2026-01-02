'use client'

import { useState, useRef, useEffect } from 'react'
import { flushSync } from 'react-dom'
import { Sparkles, Link as LinkIcon, FileText, Upload, X, Loader2 } from 'lucide-react'
import { getApiKey } from '@/lib/admin-auth'

interface AIGeneratorModalProps {
    isOpen: boolean
    onClose: () => void
    onGenerated: (data: {
        title: string
        excerpt: string
        content: string
        dayNumber: number
    }) => void
    onStreamStart?: (inputType: 'text' | 'url' | 'file', content: string, file?: File) => void
}

interface SSEEvent {
    event: string
    data: Record<string, unknown>
}

export function AIGeneratorModal({ isOpen, onClose, onGenerated, onStreamStart }: AIGeneratorModalProps) {
    const [inputType, setInputType] = useState<'text' | 'url' | 'file'>('text')
    const [inputContent, setInputContent] = useState('')
    const [selectedFile, setSelectedFile] = useState<File | null>(null)
    const [isGenerating, setIsGenerating] = useState(false)
    const [streamedContent, setStreamedContent] = useState('')
    const [error, setError] = useState<string | null>(null)
    const [progress, setProgress] = useState<string>('')
    
    // 콘텐츠 버퍼를 useRef로 관리하여 즉시 업데이트 보장
    const contentBufferRef = useRef('')
    const textareaRef = useRef<HTMLTextAreaElement>(null)
    const inputRef = useRef<HTMLInputElement>(null)
    const fileInputRef = useRef<HTMLInputElement>(null)

    // 모달이 열릴 때 입력 필드에 자동 포커스
    useEffect(() => {
        if (isOpen) {
            // 약간의 지연 후 포커스 (모달 애니메이션 완료 후)
            const timer = setTimeout(() => {
                if (inputType === 'text' && textareaRef.current) {
                    textareaRef.current.focus()
                } else if (inputType === 'url' && inputRef.current) {
                    inputRef.current.focus()
                }
            }, 100)
            return () => clearTimeout(timer)
        }
    }, [isOpen, inputType])

    // 입력 타입 변경 시 상태 초기화
    useEffect(() => {
        if (inputType !== 'file') {
            setSelectedFile(null)
        }
        if (inputType !== 'text') {
            setInputContent('')
        }
        if (inputType !== 'url') {
            setInputContent('')
        }
    }, [inputType])

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (file) {
            // 파일 확장자 검증
            const ext = '.' + file.name.split('.').pop()?.toLowerCase()
            const supportedExtensions = ['.md', '.markdown', '.txt', '.mdx']
            
            if (!supportedExtensions.includes(ext)) {
                setError(`지원하지 않는 파일 형식입니다. 지원 형식: ${supportedExtensions.join(', ')}`)
                return
            }
            
            // 파일 크기 검증 (10MB)
            const MAX_SIZE = 10 * 1024 * 1024
            if (file.size > MAX_SIZE) {
                setError(`파일 크기는 ${MAX_SIZE / 1024 / 1024}MB를 초과할 수 없습니다`)
                return
            }
            
            setSelectedFile(file)
            setError(null)
        }
    }

    const handleGenerate = async () => {
        // 입력 타입별 검증
        if (inputType === 'file' && !selectedFile) {
            setError('파일을 선택해주세요.')
            return
        }
        if ((inputType === 'text' || inputType === 'url') && !inputContent.trim()) {
            setError('내용을 입력해주세요.')
            return
        }

        // 스트리밍 시작 콜백 호출 및 모달 닫기
        if (onStreamStart) {
            onStreamStart(inputType, inputContent, selectedFile || undefined)
            onClose()
            return
        }

        // 파일 업로드 처리
        if (inputType === 'file' && selectedFile) {
            await handleFileUpload(selectedFile)
            return
        }

        // 기존 로직 (fallback)
        setIsGenerating(true)
        setError(null)
        setStreamedContent('')
        contentBufferRef.current = ''
        setProgress('생성 시작...')

        const apiKey = getApiKey()
        if (!apiKey) {
            setError('인증이 필요합니다. 다시 로그인해주세요.')
            setIsGenerating(false)
            return
        }

        try {
            const response = await fetch('/api/v1/generate/stream', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-api-key': apiKey,
                },
                body: JSON.stringify({
                    input_type: inputType,
                    content: inputContent,
                }),
            })

            if (!response.ok) {
                const errorData = await response.json()
                throw new Error(errorData.detail || '생성 요청 실패')
            }

            const reader = response.body?.getReader()
            if (!reader) throw new Error('스트림을 읽을 수 없습니다')

            console.log('[Stream] 스트리밍 시작')
            const decoder = new TextDecoder()
            let buffer = ''
            let dayNumber = 1
            let title = ''
            let excerpt = ''

            while (true) {
                const { done, value } = await reader.read()
                if (done) {
                    console.log('[Stream] 스트리밍 완료')
                    break
                }

                const chunk = decoder.decode(value, { stream: true })
                buffer += chunk
                
                // 디버깅: 받은 청크 로그 (처음 100자만)
                if (chunk.length > 0) {
                    console.log('[Stream Chunk]', chunk.substring(0, 100))
                }

                const lines = buffer.split('\n')
                buffer = lines.pop() || ''

                let currentEvent = ''
                let currentData = ''

                for (const line of lines) {
                    if (line.startsWith('event: ')) {
                        currentEvent = line.slice(7)
                    } else if (line.startsWith('data: ')) {
                        currentData = line.slice(6)
                    } else if (line === '' && currentEvent && currentData) {
                        try {
                            const data = JSON.parse(currentData)
                            
                            // 디버깅: 이벤트 로그
                            console.log('[SSE Event]', currentEvent, data)

                            switch (currentEvent) {
                                case 'day_number':
                                    dayNumber = data.day_number
                                    setProgress(`Day ${dayNumber} 생성 중...`)
                                    break
                                case 'content_chunk':
                                    // useRef로 버퍼 관리하고 flushSync로 즉시 렌더링
                                    contentBufferRef.current += data.chunk
                                    flushSync(() => {
                                        setStreamedContent(contentBufferRef.current)
                                    })
                                    break
                                case 'title':
                                    title = data.title
                                    setProgress('제목 생성 완료')
                                    break
                                case 'excerpt':
                                    excerpt = data.excerpt
                                    setProgress('요약 생성 완료')
                                    break
                                case 'complete':
                                    setProgress('생성 완료!')
                                    onGenerated({
                                        title,
                                        excerpt,
                                        content: contentBufferRef.current,
                                        dayNumber,
                                    })
                                    onClose()
                                    break
                                case 'error':
                                    throw new Error(data.error)
                            }
                        } catch (e) {
                            if (e instanceof SyntaxError) {
                                console.error('JSON parse error:', currentData)
                            } else {
                                throw e
                            }
                        }
                        currentEvent = ''
                        currentData = ''
                    }
                }
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : '생성 중 오류가 발생했습니다')
        } finally {
            setIsGenerating(false)
        }
    }

    const handleFileUpload = async (file: File) => {
        setIsGenerating(true)
        setError(null)
        setStreamedContent('')
        contentBufferRef.current = ''
        setProgress('파일 업로드 중...')

        const apiKey = getApiKey()
        if (!apiKey) {
            setError('인증이 필요합니다. 다시 로그인해주세요.')
            setIsGenerating(false)
            return
        }

        try {
            const formData = new FormData()
            formData.append('file', file)

            const response = await fetch('/api/v1/generate/upload', {
                method: 'POST',
                headers: {
                    'x-api-key': apiKey,
                },
                body: formData,
            })

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ detail: '파일 업로드 실패' }))
                throw new Error(errorData.detail || '파일 업로드 실패')
            }

            const reader = response.body?.getReader()
            if (!reader) throw new Error('스트림을 읽을 수 없습니다')

            console.log('[Stream] 파일 업로드 스트리밍 시작')
            const decoder = new TextDecoder()
            let buffer = ''
            let dayNumber = 1
            let title = ''
            let excerpt = ''

            while (true) {
                const { done, value } = await reader.read()
                if (done) {
                    console.log('[Stream] 스트리밍 완료')
                    break
                }

                const chunk = decoder.decode(value, { stream: true })
                buffer += chunk

                const lines = buffer.split('\n')
                buffer = lines.pop() || ''

                let currentEvent = ''
                let currentData = ''

                for (const line of lines) {
                    if (line.startsWith('event: ')) {
                        currentEvent = line.slice(7)
                    } else if (line.startsWith('data: ')) {
                        currentData = line.slice(6)
                    } else if (line === '' && currentEvent && currentData) {
                        try {
                            const data = JSON.parse(currentData)

                            switch (currentEvent) {
                                case 'day_number':
                                    dayNumber = data.day_number
                                    setProgress(`Day ${dayNumber} 생성 중...`)
                                    break
                                case 'content_chunk':
                                    contentBufferRef.current += data.chunk
                                    flushSync(() => {
                                        setStreamedContent(contentBufferRef.current)
                                    })
                                    break
                                case 'title':
                                    title = data.title
                                    setProgress('제목 생성 완료')
                                    break
                                case 'excerpt':
                                    excerpt = data.excerpt
                                    setProgress('요약 생성 완료')
                                    break
                                case 'complete':
                                    setProgress('생성 완료!')
                                    onGenerated({
                                        title,
                                        excerpt,
                                        content: contentBufferRef.current,
                                        dayNumber,
                                    })
                                    onClose()
                                    break
                                case 'error':
                                    throw new Error(data.error)
                            }
                        } catch (e) {
                            if (e instanceof SyntaxError) {
                                console.error('JSON parse error:', currentData)
                            } else {
                                throw e
                            }
                        }
                        currentEvent = ''
                        currentData = ''
                    }
                }
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : '파일 업로드 중 오류가 발생했습니다')
        } finally {
            setIsGenerating(false)
        }
    }

    if (!isOpen) return null

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/70 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="relative w-full max-w-2xl max-h-[90vh] bg-gray-800 rounded-xl border border-gray-700 shadow-2xl overflow-hidden flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-700">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-teal-500/20 rounded-lg">
                            <Sparkles className="w-5 h-5 text-teal-400" />
                        </div>
                        <div>
                            <h2 className="text-lg font-semibold text-white">AI 초안 생성</h2>
                            <p className="text-sm text-gray-400">URL, 텍스트 또는 마크다운 파일로 TIL 초안을 자동 생성합니다</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        disabled={isGenerating}
                        className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors disabled:opacity-50"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Body */}
                <div className="flex-1 overflow-y-auto p-6">
                    {/* Input Type Selector */}
                    <div className="flex gap-2 mb-4">
                        <button
                            onClick={() => setInputType('text')}
                            disabled={isGenerating}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${inputType === 'text'
                                    ? 'bg-teal-600 text-white'
                                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                                }`}
                        >
                            <FileText className="w-4 h-4" />
                            텍스트 입력
                        </button>
                        <button
                            onClick={() => setInputType('url')}
                            disabled={isGenerating}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${inputType === 'url'
                                    ? 'bg-teal-600 text-white'
                                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                                }`}
                        >
                            <LinkIcon className="w-4 h-4" />
                            URL 입력
                        </button>
                        <button
                            onClick={() => setInputType('file')}
                            disabled={isGenerating}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${inputType === 'file'
                                    ? 'bg-teal-600 text-white'
                                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                                }`}
                        >
                            <Upload className="w-4 h-4" />
                            파일 업로드
                        </button>
                    </div>

                    {/* Input Field */}
                    {inputType === 'text' ? (
                        <textarea
                            ref={textareaRef}
                            value={inputContent}
                            onChange={(e) => setInputContent(e.target.value)}
                            placeholder="오늘 배운 학습 내용을 간단하게 메모해주세요...&#10;&#10;예: React의 useEffect 훅에서 클린업 함수가 필요한 이유와 사용법에 대해 배웠다. 구독(subscription)이나 타이머를 설정한 경우 컴포넌트가 언마운트될 때 정리해야 메모리 누수를 방지할 수 있다."
                            disabled={isGenerating}
                            className="w-full h-40 bg-gray-900 border border-gray-700 rounded-lg p-4 text-white placeholder-gray-500 focus:outline-none focus:border-teal-500 transition-colors resize-none disabled:opacity-50"
                        />
                    ) : inputType === 'url' ? (
                        <input
                            ref={inputRef}
                            type="url"
                            value={inputContent}
                            onChange={(e) => setInputContent(e.target.value)}
                            placeholder="https://example.com/article"
                            disabled={isGenerating}
                            className="w-full bg-gray-900 border border-gray-700 rounded-lg p-4 text-white placeholder-gray-500 focus:outline-none focus:border-teal-500 transition-colors disabled:opacity-50"
                        />
                    ) : (
                        <div className="space-y-4">
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept=".md,.markdown,.txt,.mdx"
                                onChange={handleFileSelect}
                                disabled={isGenerating}
                                className="hidden"
                            />
                            <button
                                type="button"
                                onClick={() => fileInputRef.current?.click()}
                                disabled={isGenerating}
                                className="w-full bg-gray-900 border-2 border-dashed border-gray-700 rounded-lg p-8 text-center hover:border-teal-500 transition-colors disabled:opacity-50"
                            >
                                <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                                <p className="text-white font-medium mb-1">
                                    {selectedFile ? selectedFile.name : '마크다운 파일 선택'}
                                </p>
                                <p className="text-sm text-gray-400">
                                    .md, .markdown, .txt, .mdx (최대 10MB)
                                </p>
                            </button>
                            {selectedFile && (
                                <div className="bg-gray-900 border border-gray-700 rounded-lg p-4">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <FileText className="w-4 h-4 text-teal-400" />
                                            <span className="text-sm text-white">{selectedFile.name}</span>
                                            <span className="text-xs text-gray-400">
                                                ({(selectedFile.size / 1024).toFixed(1)} KB)
                                            </span>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setSelectedFile(null)
                                                if (fileInputRef.current) {
                                                    fileInputRef.current.value = ''
                                                }
                                            }}
                                            className="text-gray-400 hover:text-white"
                                        >
                                            <X className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Error Display */}
                    {error && (
                        <div className="mt-4 p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
                            {error}
                        </div>
                    )}

                    {/* Streaming Preview */}
                    {isGenerating && (
                        <div className="mt-4">
                            <div className="flex items-center gap-2 mb-2">
                                <Loader2 className="w-4 h-4 text-teal-400 animate-spin" />
                                <span className="text-sm text-teal-400">{progress || '생성 중...'}</span>
                            </div>
                            {streamedContent ? (
                                <div className="max-h-60 overflow-y-auto bg-gray-900 border border-gray-700 rounded-lg p-4">
                                    <pre className="text-sm text-gray-300 whitespace-pre-wrap font-mono">
                                        {streamedContent}
                                    </pre>
                                </div>
                            ) : (
                                <div className="max-h-60 overflow-y-auto bg-gray-900 border border-gray-700 rounded-lg p-4">
                                    <p className="text-sm text-gray-500 italic">콘텐츠 생성 대기 중...</p>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="px-6 py-4 border-t border-gray-700 flex justify-end gap-3">
                    <button
                        onClick={onClose}
                        disabled={isGenerating}
                        className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors disabled:opacity-50"
                    >
                        취소
                    </button>
                    <button
                        onClick={handleGenerate}
                        disabled={isGenerating || (inputType === 'file' ? !selectedFile : !inputContent.trim())}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-teal-600 hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
                    >
                        {isGenerating ? (
                            <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                생성 중...
                            </>
                        ) : (
                            <>
                                <Sparkles className="w-4 h-4" />
                                초안 생성
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    )
}
