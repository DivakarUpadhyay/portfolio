import { sbGetInterviewPrep } from '@/lib/supabase'
import InterviewPrepPage from '@/components/InterviewPrepPage'

export const metadata = {
  title: 'Interview Preparation',
  description: 'My curated set of interview questions and prepared answers across .NET, JavaScript, System Design, Database, and more.',
}

export interface InterviewItem {
  id: string
  question: string
  category: string
  answer?: string
  difficulty: 'Easy' | 'Medium' | 'Hard'
  status: 'Todo' | 'In Progress' | 'Done'
  tags?: string[]
}

export default async function Page() {
  const items = await sbGetInterviewPrep<InterviewItem[]>([])
  return <InterviewPrepPage items={items} />
}
