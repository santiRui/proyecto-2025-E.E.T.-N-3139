import { NextRequest, NextResponse } from 'next/server'
import { SESSION_COOKIE, verifySession } from '@/lib/auth'

function keys() {
  return {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL,
    anon: process.env.SUPABASE_ANON_KEY,
  }
}

export async function GET(req: NextRequest) {
  try {
    const token = req.cookies.get(SESSION_COOKIE)?.value
    if (!token) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    const session = await verifySession(token)

    if (!['estudiante', 'student', 'preceptor', 'directivo', 'administrador'].includes(session.role)) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
    }

    const { url, anon } = keys()
    if (!url || !anon) return NextResponse.json({ error: 'Configuración de Supabase incompleta' }, { status: 500 })

    const targetStudentId = (session.role === 'estudiante' || session.role === 'student')
      ? session.id
      : (req.nextUrl.searchParams.get('student_id') || null)

    if (!targetStudentId) return NextResponse.json({ error: 'Parámetros insuficientes' }, { status: 400 })

    const api = `${url}/rest/v1/cursos_estudiantes?estudiante_id=eq.${targetStudentId}&select=cursos(id,nombre,descripcion,anio_lectivo)&limit=1`
    const res = await fetch(api, { headers: { apikey: anon, Authorization: `Bearer ${anon}`, Accept: 'application/json' }, cache: 'no-store' })
    if (!res.ok) return NextResponse.json({ error: 'No se pudo obtener curso del estudiante' }, { status: 500 })
    const rows = await res.json()
    const course = rows?.[0]?.cursos || null
    return NextResponse.json({ ok: true, course })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Error interno' }, { status: 500 })
  }
}
