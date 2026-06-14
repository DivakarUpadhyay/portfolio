import { sbGetLearnings } from '@/lib/supabase'
import LearningPage from '@/components/LearningPage'

export const metadata = {
  title: 'My Learning Journey',
  description: 'A curated log of technologies, concepts, and skills I am actively studying and mastering.',
}

export interface LearningItem {
  id: string
  title: string
  category: string
  description?: string
  notes?: string
  files?: { name: string; url: string; type: string }[]
  priority: 'High' | 'Medium' | 'Low'
  status: 'Todo' | 'In Progress' | 'Done'
  tags?: string[]
}

export default async function Page() {
  const learnings = await sbGetLearnings<LearningItem[]>([])
  return <LearningPage items={learnings} />
}
