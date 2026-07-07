import { createClient } from '@/lib/supabase/server'
import { LogoutButton } from '@/components/LogoutButton'

// M1 최소본: 로그인 게이트가 동작함을 보여주는 플레이스홀더.
// (실제 3컬럼 보드 UI는 M2에서 구현)
export default async function Home() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  return (
    <main style={{ padding: 32, fontFamily: 'var(--font-geist-sans, sans-serif)' }}>
      <header
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 24,
        }}
      >
        <h1 style={{ fontSize: 22 }}>Kanban Board</h1>
        <LogoutButton />
      </header>

      <p style={{ color: '#555' }}>
        환영합니다, <strong>{user?.email ?? '알 수 없는 사용자'}</strong> 님.
      </p>
      <p style={{ color: '#888', marginTop: 8 }}>
        빈 보드입니다. (To Do / Doing / Done 3컬럼 보드는 M2에서 구현됩니다.)
      </p>
    </main>
  )
}
