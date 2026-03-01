import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const AUTH_COOKIE = 'bullpay_token'
const USER_COOKIE = 'bullpay_user'

// Public paths that don't require authentication
const PUBLIC_PATHS = [
  '/landing',
  '/login',
  '/register',
  '/forgot',
  '/verify',
  '/pay/',
  '/pay-select/',
  '/api-docs',
]

// Admin-only path prefix
const ADMIN_PREFIX = '/admin'

function isPublicPath(pathname: string): boolean {
  return PUBLIC_PATHS.some(
    (p) => pathname === p || pathname.startsWith(p)
  )
}

function isAdminRole(userCookie: string | undefined): boolean {
  if (!userCookie) return false
  try {
    const user = JSON.parse(decodeURIComponent(userCookie))
    return ['super_admin', 'admin', 'support_agent'].includes(user.role)
  } catch {
    return false
  }
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl
  const token = request.cookies.get(AUTH_COOKIE)?.value
  const userCookie = request.cookies.get(USER_COOKIE)?.value

  // ── Root redirect ──
  if (pathname === '/') {
    if (token) {
      const dest = isAdminRole(userCookie) ? '/admin/dashboard' : '/dashboard'
      return NextResponse.redirect(new URL(dest, request.url))
    }
    return NextResponse.redirect(new URL('/landing', request.url))
  }

  // ── Public paths: allow ──
  if (isPublicPath(pathname)) {
    // If logged in and trying to access login/register, redirect to dashboard
    if (token && (pathname === '/login' || pathname === '/register')) {
      const dest = isAdminRole(userCookie) ? '/admin/dashboard' : '/dashboard'
      return NextResponse.redirect(new URL(dest, request.url))
    }
    return NextResponse.next()
  }

  // ── Protected paths: require auth ──
  if (!token) {
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('redirect', pathname)
    return NextResponse.redirect(loginUrl)
  }

  // ── Admin paths: require admin role ──
  if (pathname.startsWith(ADMIN_PREFIX) && !isAdminRole(userCookie)) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  return NextResponse.next()
}

export const config = {
  // Match all paths except static files and Next.js internals
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|assets/|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)',
  ],
}
