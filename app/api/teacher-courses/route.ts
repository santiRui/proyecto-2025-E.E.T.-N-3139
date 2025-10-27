import { NextRequest, NextResponse } from 'next/server'
import { SESSION_COOKIE, verifySession } from '@/lib/auth'

function keys() {
  return {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL,
    anon: process.env.SUPABASE_ANON_KEY,
  }
}

// GET /api/teacher-courses?teacher=me or ?teacher_id=...
export async function GET(req: NextRequest) {
  try {
    const token = req.cookies.get(SESSION_COOKIE)?.value
    if (!token) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    const session = await verifySession(token)

    const teacherMe = req.nextUrl.searchParams.get('teacher') === 'me'
    const teacherId = req.nextUrl.searchParams.get('teacher_id')

    let targetTeacherId: string | null = null
    if (teacherMe) {
      // docente (self) o staff/admin que consulta su propio id
      targetTeacherId = session.id
    } else if (teacherId) {
      if (!['preceptor', 'directivo', 'administrador'].includes(session.role)) {
        return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
      }
      targetTeacherId = teacherId
    } else {
      return NextResponse.json({ error: 'Parámetros insuficientes' }, { status: 400 })
    }

    const { url, anon } = keys()
    if (!url || !anon) return NextResponse.json({ error: 'Configuración de Supabase incompleta' }, { status: 500 })

    // cursos_docentes join cursos para obtener cursos del docente
    const api = `${url}/rest/v1/cursos_docentes?docente_id=eq.${targetTeacherId}&select=cursos(id,nombre,descripcion,anio_lectivo)`
    const res = await fetch(api, { headers: { apikey: anon, Authorization: `Bearer ${anon}`, Accept: 'application/json' }, cache: 'no-store' })
    if (!res.ok) return NextResponse.json({ error: 'No se pudieron obtener cursos del docente' }, { status: 500 })
    const rows = await res.json()
    const courses = rows.map((r: any) => ({ id: r.cursos?.id, nombre: r.cursos?.nombre, descripcion: r.cursos?.descripcion, anio_lectivo: r.cursos?.anio_lectivo })).filter((c: any) => c.id)
    return NextResponse.json({ ok: true, courses })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Error interno' }, { status: 500 })
  }
}
