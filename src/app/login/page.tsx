'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function LoginPage() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function signInWithGoogle() {
    setLoading(true)
    setError(null)
    const supabase = createClient()
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${location.origin}/auth/callback`,
      },
    })
    if (error) {
      setError(error.message)
      setLoading(false)
    }
    // 성공 시 브라우저가 Google 동의 화면으로 이동한다.
  }

  return (
    <main
      style={{
        minHeight: '100dvh',
        display: 'grid',
        placeItems: 'center',
        padding: 24,
      }}
    >
      <div style={{ textAlign: 'center', maxWidth: 360 }}>
        <h1 style={{ fontSize: 24, marginBottom: 8 }}>Kanban Board</h1>
        <p style={{ color: '#666', marginBottom: 24 }}>
          로그인해야 보드에 접근할 수 있습니다.
        </p>
        <button
          onClick={signInWithGoogle}
          disabled={loading}
          style={{
            padding: '12px 20px',
            fontSize: 15,
            borderRadius: 8,
            border: '1px solid #ddd',
            background: '#fff',
            cursor: loading ? 'default' : 'pointer',
            width: '100%',
          }}
        >
          {loading ? '이동 중…' : 'Google로 로그인'}
        </button>
        {error && (
          <p style={{ color: '#c0392b', marginTop: 16, fontSize: 14 }}>
            {error}
          </p>
        )}
      </div>
    </main>
  )
}
