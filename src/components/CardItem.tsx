import type { Card, CardPriority, Member } from '@/lib/types'

const PRIORITY_META: Record<CardPriority, { cls: string; arrow: string; label: string }> = {
  high: { cls: 'p-high', arrow: '▲', label: 'High' },
  medium: { cls: 'p-med', arrow: '■', label: 'Medium' },
  low: { cls: 'p-low', arrow: '▼', label: 'Low' },
}

// 'YYYY-MM-DD' 문자열을 로컬 자정 Date로 (타임존 밀림 방지)
function parseDueDate(s: string): Date {
  const [y, m, d] = s.split('-').map(Number)
  return new Date(y, m - 1, d)
}

function startOfToday(): Date {
  const now = new Date()
  return new Date(now.getFullYear(), now.getMonth(), now.getDate())
}

function dueMeta(due: string) {
  const dueDate = parseDueDate(due)
  const today = startOfToday()
  const diffDays = Math.round((dueDate.getTime() - today.getTime()) / 86_400_000)
  const label = `${String(dueDate.getMonth() + 1).padStart(2, '0')}-${String(dueDate.getDate()).padStart(2, '0')}`
  if (diffDays < 0) return { soon: true, text: `⏰ ${label} 지남` }
  if (diffDays === 0) return { soon: true, text: '🔥 오늘 마감' }
  if (diffDays <= 2) return { soon: true, text: `⏰ ${label} 임박` }
  return { soon: false, text: `📅 ${label}` }
}

export function CardItem({ card, assignee }: { card: Card; assignee: Member | null }) {
  const isDone = card.status === 'done'
  const prio = PRIORITY_META[card.priority]
  const due = card.due_date ? dueMeta(card.due_date) : null

  return (
    <article
      className={`card${isDone ? ' done' : ''}${assignee ? '' : ' unassigned-card'}`}
      tabIndex={0}
    >
      <div className="card-top">
        {isDone ? (
          <span className="prio p-low done-badge">✓ 완료</span>
        ) : (
          <span className={`prio ${prio.cls}`}>
            <span className="arrow">{prio.arrow}</span>
            {prio.label}
          </span>
        )}
      </div>

      <p className="card-title">{card.title}</p>

      <div className="card-foot">
        {isDone ? (
          <span className="due">✔ 완료됨</span>
        ) : due ? (
          <span className={`due${due.soon ? ' soon' : ''}`}>{due.text}</span>
        ) : (
          <span className="no-due">마감 없음</span>
        )}

        <span className="foot-right">
          {assignee ? (
            <span className="av-sm" style={{ background: assignee.color }} title={assignee.name}>
              {assignee.initial}
            </span>
          ) : (
            <>
              <span className="unassigned-tag">미배정</span>
              <span className="av-unassigned" aria-label="미배정">
                ?
              </span>
            </>
          )}
        </span>
      </div>
    </article>
  )
}
