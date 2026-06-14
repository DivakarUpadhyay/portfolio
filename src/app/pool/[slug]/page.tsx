import { sbGetTopic, sbGetTopics } from '@/lib/supabase'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import MermaidBlock from '@/components/MermaidBlock'
import type { Metadata } from 'next'
import type { Components } from 'react-markdown'

type Props = { params: Promise<{ slug: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const topic = await sbGetTopic(slug)
  if (!topic) return { title: 'Not Found' }
  const desc = (topic.content ?? '')
    .replace(/#{1,6}\s+[^\n]*/g, '')
    .replace(/[*_`>\-]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 160)
  return { title: topic.title, description: desc }
}

export default async function TopicDetailPage({ params }: Props) {
  const { slug } = await params
  const topic = await sbGetTopic(slug)

  if (!topic) notFound()

  return (
    <main className="topic-detail-main pool-light">
      <div className="topic-detail-container">
          <div className="topic-detail-nav">
            <Link href="/pool" className="topic-back-link">← Pool</Link>
            <span className="topic-detail-date">
              {new Date(topic.created_at).toLocaleDateString('en-US', {
                year: 'numeric', month: 'long', day: 'numeric',
              })}
            </span>
          </div>

          <h1 className="topic-detail-title">{topic.title}</h1>

          <article className="markdown-body">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                code({ node, className, children, ...props }) {
                  const match = /language-(\w+)/.exec(className || '')
                  if (match?.[1] === 'mermaid') {
                    return <MermaidBlock code={String(children).replace(/\n$/, '')} />
                  }
                  return <code className={className} {...props}>{children}</code>
                },
              } as Components}
            >
              {topic.content}
            </ReactMarkdown>
          </article>

          <div className="topic-detail-foot">
            <Link href="/pool" className="topic-back-link">← Back to Pool</Link>
          </div>
        </div>
    </main>
  )
}
