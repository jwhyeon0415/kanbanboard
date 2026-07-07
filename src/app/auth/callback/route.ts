import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// Google OAuth 코드 교환 → 세션 쿠키 설정 후 홈으로 리다이렉트
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/'

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  // 코드가 없거나 교환 실패 → 로그인 페이지로
  return NextResponse.redirect(`${origin}/login?error=auth`)
}
