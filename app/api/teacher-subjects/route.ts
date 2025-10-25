import { NextRequest, NextResponse } from 'next/server'
import { SESSION_COOKIE, verifySession } from '@/lib/auth'

function keys() {
  return {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL,
    anon: process.env.SUPABASE_ANON_KEY,
    service: process.env.SUPABASE_SERVICE_ROLE_KEY,
  }
}

// GET /api/teacher-subjects?course_id=... [&teacher_id=...]
export async function GET(req: NextRequest) {
  try {
    const token = req.cookies.get(SESSION_COOKIE)?.value
    if (!token) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    const session = await verifySession(token)

    const courseId = req.nextUrl.searchParams.get('course_id')
    const teacherId = req.nextUrl.searchParams.get('teacher_id')
    if (!courseId) return NextResponse.json({ error: 'Falta course_id' }, { status: 400 })

    // Docente solo puede ver sus asignaciones
    if (session.role === 'docente') {
      if (teacherId && teacherId !== session.id) {
        return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
      }
    } else if (!['preceptor', 'directivo', 'administrador'].includes(session.role)) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
    }

    const { url, anon } = keys()
    if (!url || !anon) return NextResponse.json({ error: 'Configuración de Supabase incompleta' }, { status: 500 })

    let filter = `curso_id=eq.${courseId}`
    if (session.role === 'docente') {
      filter += `&docente_id=eq.${session.id}`
    } else if (teacherId) {
      filter += `&docente_id=eq.${teacherId}`
    }

    const api = `${url}/rest/v1/materias_docentes?select=id,docente_id,curso_id,materia_id,materias(id,nombre),perfiles!materias_docentes_docente_id_fkey(id,nombre_completo)&${filter}`
    const res = await fetch(api, { headers: { apikey: anon, Authorization: `Bearer ${anon}`, Accept: 'application/json' }, cache: 'no-store' })
    if (!res.ok) return NextResponse.json({ error: 'No se pudieron obtener asignaciones' }, { status: 500 })
    const rows = await res.json()
    const assignments = rows.map((r: any) => ({
      id: r.id,
      teacher_id: r.docente_id,
      teacher_name: r.perfiles?.nombre_completo,
      subject_id: r.materias?.id,
      subject_name: r.materias?.nombre,
    }))
    return NextResponse.json({ ok: true, assignments })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Error interno' }, { status: 500 })
  }
}

// POST /api/teacher-subjects { teacher_id, course_id, subject_id }
export async function POST(req: NextRequest) {
  try {
    const token = req.cookies.get(SESSION_COOKIE)?.value
    if (!token) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    const session = await verifySession(token)
    if (!['preceptor', 'directivo', 'administrador'].includes(session.role)) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
    }

    const { teacher_id, course_id, subject_id } = await req.json()
    if (!teacher_id || !course_id || !subject_id) return NextResponse.json({ error: 'Faltan parámetros' }, { status: 400 })

    const { url, anon, service } = keys()
    const key = service || anon
    if (!url || !key) return NextResponse.json({ error: 'Configuración de Supabase incompleta' }, { status: 500 })

    // Validar que la materia esté en el curso
    const checkCourseSubj = `${url}/rest/v1/materias_cursos?curso_id=eq.${course_id}&materia_id=eq.${subject_id}&select=id`
    const chk = await fetch(checkCourseSubj, { headers: { apikey: key, Authorization: `Bearer ${key}`, Accept: 'application/json' }, cache: 'no-store' })
    if (!chk.ok) return NextResponse.json({ error: 'No se pudo validar materia del curso' }, { status: 500 })
    const exists = await chk.json()
    if (!Array.isArray(exists) || exists.length === 0) {
      return NextResponse.json({ error: 'La materia no pertenece al curso' }, { status: 400 })
    }

    const api = `${url}/rest/v1/materias_docentes`
    const res = await fetch(api, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json', apikey: key, Authorization: `Bearer ${key}`, Prefer: 'return=representation' },
      body: JSON.stringify({ docente_id: teacher_id, curso_id: course_id, materia_id: subject_id })
    })
    if (!res.ok) {
      let msg = 'No se pudo asignar la materia al docente'
      try { const d = await res.json(); msg = d?.message || d?.error || msg } catch {}
      return NextResponse.json({ error: msg }, { status: 400 })
    }
    const data = await res.json()
    return NextResponse.json({ ok: true, assignment: data?.[0] || null })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Error interno' }, { status: 500 })
  }
}

// DELETE /api/teacher-subjects?id=...  (or ?teacher_id=...&course_id=...&subject_id=...)
export async function DELETE(req: NextRequest) {
  try {
    const token = req.cookies.get(SESSION_COOKIE)?.value
    if (!token) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    const session = await verifySession(token)
    if (!['preceptor', 'directivo', 'administrador'].includes(session.role)) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
    }

    const id = req.nextUrl.searchParams.get('id')
    const teacherId = req.nextUrl.searchParams.get('teacher_id')
    const courseId = req.nextUrl.searchParams.get('course_id')
    const subjectId = req.nextUrl.searchParams.get('subject_id')

    const { url, anon, service } = keys()
    const key = service || anon
    if (!url || !key) return NextResponse.json({ error: 'Configuración de Supabase incompleta' }, { status: 500 })

    let api: string
    if (id) {
      api = `${url}/rest/v1/materias_docentes?id=eq.${id}`
    } else if (teacherId && courseId && subjectId) {
      api = `${url}/rest/v1/materias_docentes?docente_id=eq.${teacherId}&curso_id=eq.${courseId}&materia_id=eq.${subjectId}`
    } else {
      return NextResponse.json({ error: 'Faltan parámetros' }, { status: 400 })
    }

    const res = await fetch(api, { method: 'DELETE', headers: { apikey: key, Authorization: `Bearer ${key}` } })
    if (!res.ok) return NextResponse.json({ error: 'No se pudo quitar la asignación' }, { status: 400 })
    return NextResponse.json({ ok: true })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Error interno' }, { status: 500 })
  }
}
