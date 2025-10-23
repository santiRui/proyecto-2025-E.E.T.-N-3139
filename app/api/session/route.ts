import { NextRequest, NextResponse } from 'next/server'
import { verifySession, SESSION_COOKIE } from '@/lib/auth'

export async function GET(req: NextRequest) {
  const token = req.cookies.get(SESSION_COOKIE)?.value
  if (!token) {
    return NextResponse.json({ authenticated: false }, { status: 401 })
  }
  try {
    const payload = await verifySession(token)
    return NextResponse.json({ authenticated: true, user: payload })
  } catch (e) {
    return NextResponse.json({ authenticated: false }, { status: 401 })
  }
}
