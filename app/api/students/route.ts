import { NextRequest, NextResponse } from 'next/server'
import { SESSION_COOKIE, verifySession } from '@/lib/auth'

export async function GET(_req: NextRequest) {
  try {
    // Auth: teacher, preceptor y directivo
    const token = _req.cookies.get(SESSION_COOKIE)?.value
    if (!token) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    const session = await verifySession(token)
    if (!['preceptor', 'directivo', 'docente', 'administrador'].includes(session.role)) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
    }

    const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
    const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY
    const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
    const KEY = SUPABASE_SERVICE_ROLE_KEY || SUPABASE_ANON_KEY
    if (!SUPABASE_URL || !KEY) {
      return NextResponse.json({ error: 'Configuración de Supabase incompleta' }, { status: 500 })
    }

    const q = (_req.nextUrl.searchParams.get('q') || '').trim()
    let url = `${SUPABASE_URL}/rest/v1/perfiles?rol=eq.estudiante&select=id,nombre_completo,correo,dni,telefono,cursos_estudiantes(curso_id)`
    if (q) {
      const enc = encodeURIComponent(`nombre_completo.ilike.*${q}*,dni.ilike.*${q}*`)
      url += `&or=(${enc})`
    }
    const res = await fetch(url, {
      headers: {
        apikey: KEY,
        Authorization: `Bearer ${KEY}`,
        Accept: 'application/json',
      },
      cache: 'no-store',
    })

    if (!res.ok) {
      const msg = await res.text().catch(() => 'No se pudieron obtener estudiantes')
      return NextResponse.json({ error: msg || 'No se pudieron obtener estudiantes' }, { status: 500 })
    }

    const data = await res.json()
    return NextResponse.json({ ok: true, students: data })
  } catch (e: any) {
    const message = e?.message || 'Error interno'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
