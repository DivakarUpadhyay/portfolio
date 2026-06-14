import { sbGetTopics } from '@/lib/supabase'
import PoolTable from '@/components/PoolTable'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Pool — Notes & Write-ups',
  description: 'Technical write-ups, guides, and notes by Divakar R. Upadhyay',
}

export default async function PoolPage() {
  const topics = await sbGetTopics()

  return (
    <main className="pool-main pool-light">
      <div className="pool-container">
        <div className="pool-page-head">
          <div className="pool-page-title-row">
            <h1 className="pool-page-title">Pool</h1>
            <p className="pool-page-sub">Technical write-ups, guides, and notes on software engineering, .NET, Web3, and more.</p>
          </div>
        </div>
        {topics.length === 0 ? (
          <div className="pool-empty">No articles published yet — check back soon.</div>
        ) : (
          <PoolTable topics={topics} />
        )}
      </div>
    </main>
  )
}
