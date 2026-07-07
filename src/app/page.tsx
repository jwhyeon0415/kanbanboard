import { createClient } from '@/lib/supabase/server'
import { LogoutButton } from '@/components/LogoutButton'
import { Board } from '@/components/Board'
import type { Card, Member } from '@/lib/types'

// M2: 정적 3컬럼 보드 + 카드 조회 (서버 컴포넌트에서 fetch).
// CRUD/드래그/실시간은 M3~.
export default async function Home() {
  const supabase = await createClient()

  const [{ data: { user } }, membersRes, cardsRes] = await Promise.all([
    supabase.auth.getUser(),
    supabase.from('members').select('*').order('created_at', { ascending: true }),
    supabase.from('cards').select('*').order('position', { ascending: true }),
  ])

  const members = (membersRes.data ?? []) as Member[]
  const cards = (cardsRes.data ?? []) as Card[]
  const loadError = membersRes.error ?? cardsRes.error

  return (
    <>
      <header className="appbar">
        <div className="brand">
          <span className="logo">K</span>KanFlow
        </div>
        <div className="appbar-right">
          {user?.email && <span className="user-email">{user.email}</span>}
          <LogoutButton />
        </div>
      </header>

      <div className="toolbar">
        <div className="title-row">
          <h1 className="board-title">
            <span className="star">★</span> 코어 프로덕트 보드
          </h1>
          {members.length > 0 && (
            <div className="avatars" title="보드 멤버">
              {members.map((m) => (
                <span key={m.id} className="av" style={{ background: m.color }} title={m.name}>
                  {m.initial}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {loadError ? (
        <div style={{ padding: '18px 20px', color: 'var(--warn-fg)' }}>
          데이터를 불러오지 못했습니다: {loadError.message}
        </div>
      ) : (
        <Board cards={cards} members={members} />
      )}
    </>
  )
}
