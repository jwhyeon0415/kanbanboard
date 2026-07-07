import { type NextRequest } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'

export async function middleware(request: NextRequest) {
  return await updateSession(request)
}

export const config = {
  matcher: [
    /*
     * 아래를 제외한 모든 경로에서 세션 검사:
     * - _next/static, _next/image (정적 자산)
     * - favicon.ico, 이미지 파일
     * - mockups (public/mockups 정적 시안)
     */
    '/((?!_next/static|_next/image|favicon.ico|mockups|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
