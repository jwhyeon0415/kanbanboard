import { COLUMNS, type Card, type Member } from '@/lib/types'
import { Column } from './Column'

export function Board({ cards, members }: { cards: Card[]; members: Member[] }) {
  const membersById = new Map(members.map((m) => [m.id, m]))

  // status별 그룹핑 + position 오름차순 정렬
  const byStatus = COLUMNS.map((col) => ({
    ...col,
    cards: cards
      .filter((c) => c.status === col.status)
      .sort((a, b) => a.position - b.position),
  }))

  return (
    <section className="board">
      {byStatus.map((col) => (
        <Column
          key={col.status}
          status={col.status}
          name={col.name}
          cards={col.cards}
          membersById={membersById}
        />
      ))}
    </section>
  )
}
