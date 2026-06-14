const SB_URL = 'https://rvyqwprkfzusjqblggvh.supabase.co'
const SB_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ2eXF3cHJrZnp1c2pxYmxnZ3ZoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE0MTIzODIsImV4cCI6MjA5Njk4ODM4Mn0.EcZ9UvjW_dlCASav1sNuclS4bPX8fRpDjrEhPLINQpg'
const SB_HDR = { apikey: SB_KEY, Authorization: `Bearer ${SB_KEY}` }

// Fetches a key from portfolio_data table; returns fallback silently on any error
export async function sbGetPortfolio<T>(key: string, fallback: T): Promise<T> {
  try {
    const res = await fetch(
      `${SB_URL}/rest/v1/portfolio_data?key=eq.${key}&select=value`,
      { headers: SB_HDR, next: { revalidate: 300 } }
    )
    if (!res.ok) return fallback
    const rows = await res.json()
    return (rows[0]?.value ?? fallback) as T
  } catch {
    return fallback
  }
}

// Fetches all demo projects — no-store so admin adds/deletes are live immediately
export async function sbGetDemoProjects<T>(fallback: T): Promise<T> {
  try {
    const res = await fetch(
      `${SB_URL}/rest/v1/demo_projects?select=*&order=id`,
      { headers: SB_HDR, cache: 'no-store' }
    )
    if (!res.ok) return fallback
    const rows = await res.json() as T[]
    return (rows.length > 0 ? rows : fallback) as T
  } catch {
    return fallback
  }
}

// Fetches learnings — no source field (admin-only), no-store for live updates
export async function sbGetLearnings<T>(fallback: T): Promise<T> {
  try {
    const res = await fetch(
      `${SB_URL}/rest/v1/learnings?select=id,title,category,description,notes,files,priority,status,tags&order=created_at.desc`,
      { headers: SB_HDR, cache: 'no-store' }
    )
    if (!res.ok) return fallback
    const rows = await res.json() as T[]
    return (rows.length > 0 ? rows : fallback) as T
  } catch {
    return fallback
  }
}

export interface TopicMeta {
  title: string
  slug: string
  content: string
  active: boolean
  created_at: string
  updated_at?: string
}

// Fetches all active topics (stored in portfolio_data with key prefix "topic_")
export async function sbGetTopics(): Promise<TopicMeta[]> {
  try {
    const res = await fetch(
      `${SB_URL}/rest/v1/portfolio_data?key=like.topic_%25&select=value`,
      { headers: SB_HDR, cache: 'no-store' }
    )
    if (!res.ok) return []
    const rows = await res.json() as { value: TopicMeta }[]
    return rows
      .map(r => r.value)
      .filter(v => v && v.active)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
  } catch { return [] }
}

// Fetches a single topic by slug
export async function sbGetTopic(slug: string): Promise<TopicMeta | null> {
  try {
    const res = await fetch(
      `${SB_URL}/rest/v1/portfolio_data?key=eq.topic_${slug}&select=value`,
      { headers: SB_HDR, cache: 'no-store' }
    )
    if (!res.ok) return null
    const rows = await res.json() as { value: TopicMeta }[]
    const v = rows[0]?.value
    return v && v.active ? v : null
  } catch { return null }
}

// Fetches interview prep items — no-store for live updates
export async function sbGetInterviewPrep<T>(fallback: T): Promise<T> {
  try {
    const res = await fetch(
      `${SB_URL}/rest/v1/interview_prep?select=id,question,category,answer,difficulty,status,tags&order=created_at.desc`,
      { headers: SB_HDR, cache: 'no-store' }
    )
    if (!res.ok) return fallback
    const rows = await res.json() as T[]
    return (rows.length > 0 ? rows : fallback) as T
  } catch {
    return fallback
  }
}
