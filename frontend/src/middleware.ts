import { NextResponse } from 'next/server'

export function middleware(request) {
  const isAdmin = request.cookies.get('admin_access')?.value === 'true'

  if (request.nextUrl.pathname.startsWith('/admin') && !isAdmin) {
    return NextResponse.redirect(new URL('/auth/login', request.url))
  }

  return NextResponse.next()
}

export const config = { matcher: '/admin/:path*' }