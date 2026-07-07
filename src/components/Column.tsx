import type { Card, CardStatus, Member } from '@/lib/types'
import { CardItem } from './CardItem'

export function Column({
  status,
  name,
  cards,
  membersById,
}: {
  status: CardStatus
  name: string
  cards: Card[]
  membersById: Map<string, Member>
}) {
  return (
    <div className={`col col-${status}`}>
      <div className="col-head">
        <span className="col-accent" />
        <span className="col-name">{name}</span>
        <span className="count">{cards.length}</span>
      </div>
      <div className="cards">
        {cards.length === 0 ? (
          <div className="empty-col">카드 없음</div>
        ) : (
          cards.map((card) => (
            <CardItem
              key={card.id}
              card={card}
              assignee={card.assignee_id ? membersById.get(card.assignee_id) ?? null : null}
            />
          ))
        )}
      </div>
    </div>
  )
}
