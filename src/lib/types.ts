// DB 스키마(supabase/migrations/0001_init.sql)와 1:1 대응하는 타입.

export type CardStatus = 'todo' | 'doing' | 'done'
export type CardPriority = 'low' | 'medium' | 'high'

export interface Member {
  id: string
  name: string
  color: string // 예: #4C6EF5
  initial: string // 예: 지
  created_at: string
}

export interface Card {
  id: string
  title: string
  description: string | null
  assignee_id: string | null // null = 미배정
  due_date: string | null // 'YYYY-MM-DD'
  priority: CardPriority
  status: CardStatus
  position: number
  created_at: string
  updated_at: string
}

// 컬럼 정의 — status enum 순서 고정
export const COLUMNS: { status: CardStatus; name: string }[] = [
  { status: 'todo', name: 'To Do' },
  { status: 'doing', name: 'Doing' },
  { status: 'done', name: 'Done' },
]
