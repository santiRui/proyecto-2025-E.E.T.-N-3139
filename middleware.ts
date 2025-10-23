import { NextResponse, NextRequest } from 'next/server'
import { verifySession, SESSION_COOKIE } from '@/lib/auth'

const PUBLIC_PATHS = [
  '/',
  '/login',
]

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  // Allow public paths and static/assets/api
  if (
    PUBLIC_PATHS.includes(pathname) ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon') ||
    pathname.startsWith('/images') ||
    pathname.startsWith('/api') // API is handled by its own handlers
  ) {
    return NextResponse.next()
  }

  const token = req.cookies.get(SESSION_COOKIE)?.value
  if (!token) {
    const url = new URL('/login', req.url)
    url.searchParams.set('next', pathname)
    return NextResponse.redirect(url)
  }

  try {
    const payload = await verifySession(token)

    // Protección de rutas de administrador
    if (pathname.startsWith('/admin')) {
      if (payload.role !== 'administrador') {
        const url = new URL('/dashboard', req.url)
        return NextResponse.redirect(url)
      }
    }

    return NextResponse.next()
  } catch {
    const url = new URL('/login', req.url)
    url.searchParams.set('next', pathname)
    return NextResponse.redirect(url)
  }
}

export const config = {
  matcher: [
    '/admin/:path*',
    '/dashboard/:path*',
    '/enrollment/:path*',
    '/grades/:path*',
    '/materials/:path*',
    '/news/:path*',
    '/profile/:path*',
    '/reports/:path*',
    '/students/:path*',
  ],
}
