import { NextRequest, NextResponse } from 'next/server'
import { SESSION_COOKIE, verifySession } from '@/lib/auth'

function keys() {
  return {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL,
    anon: process.env.SUPABASE_ANON_KEY,
    service: process.env.SUPABASE_SERVICE_ROLE_KEY,
  }
}

// GET /api/course-subjects?course_id=...
export async function GET(req: NextRequest) {
  try {
    const courseId = req.nextUrl.searchParams.get('course_id')
    const mode = req.nextUrl.searchParams.get('mode') // 'assigned' -> materias_docentes
    if (!courseId) return NextResponse.json({ error: 'Falta course_id' }, { status: 400 })

    const { url, anon } = keys()
    if (!url || !anon) return NextResponse.json({ error: 'Configuración de Supabase incompleta' }, { status: 500 })

    let subjects: Array<{ id: string | null, nombre: string | null }> = []
    if (mode === 'assigned') {
      // subjects that have an assignment with a teacher for this course
      const api = `${url}/rest/v1/materias_docentes?curso_id=eq.${courseId}&select=materias(id,nombre)`
      const res = await fetch(api, { headers: { apikey: anon, Authorization: `Bearer ${anon}`, Accept: 'application/json' }, cache: 'no-store' })
      if (!res.ok) return NextResponse.json({ error: 'No se pudieron obtener materias asignadas del curso' }, { status: 500 })
      const rows = await res.json()
      const list = rows.map((r: any) => ({ id: (r as any).materias?.id as string | null, nombre: (r as any).materias?.nombre as string | null }))
      // dedupe by id
      const seen = new Set<string>()
      subjects = list.filter((s: { id: string | null, nombre: string | null }) => {
        const id = s.id || ''
        if (seen.has(id)) return false
        seen.add(id)
        return true
      })
    } else {
      const api = `${url}/rest/v1/materias_cursos?curso_id=eq.${courseId}&select=id,curso_id,materia_id,materias(id,nombre)`
      const res = await fetch(api, { headers: { apikey: anon, Authorization: `Bearer ${anon}`, Accept: 'application/json' }, cache: 'no-store' })
      if (!res.ok) return NextResponse.json({ error: 'No se pudieron obtener materias del curso' }, { status: 500 })
      const rows = await res.json()
      subjects = rows.map((r: any) => ({ id: r.materias?.id, nombre: r.materias?.nombre }))
    }
    return NextResponse.json({ ok: true, subjects })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Error interno' }, { status: 500 })
  }
}

// POST /api/course-subjects { course_id, subject_id }
export async function POST(req: NextRequest) {
  try {
    const token = req.cookies.get(SESSION_COOKIE)?.value
    if (!token) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    const session = await verifySession(token)
    if (!['preceptor', 'directivo', 'administrador'].includes(session.role)) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
    }

    const { course_id, subject_id } = await req.json()
    if (!course_id || !subject_id) return NextResponse.json({ error: 'Faltan parámetros' }, { status: 400 })

    const { url, anon, service } = keys()
    const key = service || anon
    if (!url || !key) return NextResponse.json({ error: 'Configuración de Supabase incompleta' }, { status: 500 })

    const api = `${url}/rest/v1/materias_cursos`
    const res = await fetch(api, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json', apikey: key, Authorization: `Bearer ${key}`, Prefer: 'return=representation' },
      body: JSON.stringify({ curso_id: course_id, materia_id: subject_id })
    })
    if (!res.ok) {
      let msg = 'No se pudo agregar la materia al curso'
      try { const d = await res.json(); msg = d?.message || d?.error || msg } catch {}
      return NextResponse.json({ error: msg }, { status: 400 })
    }
    const data = await res.json()
    return NextResponse.json({ ok: true, relation: data?.[0] || null })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Error interno' }, { status: 500 })
  }
}

// DELETE /api/course-subjects?course_id=...&subject_id=...
export async function DELETE(req: NextRequest) {
  try {
    const token = req.cookies.get(SESSION_COOKIE)?.value
    if (!token) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    const session = await verifySession(token)
    if (!['preceptor', 'directivo', 'administrador'].includes(session.role)) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
    }

    const courseId = req.nextUrl.searchParams.get('course_id')
    const subjectId = req.nextUrl.searchParams.get('subject_id')
    if (!courseId || !subjectId) return NextResponse.json({ error: 'Faltan parámetros' }, { status: 400 })

    const { url, anon, service } = keys()
    const key = service || anon
    if (!url || !key) return NextResponse.json({ error: 'Configuración de Supabase incompleta' }, { status: 500 })

    const api = `${url}/rest/v1/materias_cursos?curso_id=eq.${courseId}&materia_id=eq.${subjectId}`
    const res = await fetch(api, { method: 'DELETE', headers: { apikey: key, Authorization: `Bearer ${key}` } })
    if (!res.ok) return NextResponse.json({ error: 'No se pudo quitar la materia del curso' }, { status: 400 })
    return NextResponse.json({ ok: true })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Error interno' }, { status: 500 })
  }
}
