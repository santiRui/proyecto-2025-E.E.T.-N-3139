import { NextRequest, NextResponse } from 'next/server'
import { SESSION_COOKIE, verifySession } from '@/lib/auth'

function keys() {
  return {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL,
    anon: process.env.SUPABASE_ANON_KEY,
  }
}

// GET /api/subject-teachers?subject_id=...
export async function GET(req: NextRequest) {
  try {
    const token = req.cookies.get(SESSION_COOKIE)?.value
    if (!token) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    const session = await verifySession(token)
    if (!['preceptor', 'directivo', 'administrador', 'docente'].includes(session.role)) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
    }

    const { url, anon } = keys()
    if (!url || !anon) return NextResponse.json({ error: 'Configuración de Supabase incompleta' }, { status: 500 })

    const subjectId = req.nextUrl.searchParams.get('subject_id')
    const teacherMe = req.nextUrl.searchParams.get('teacher') === 'me'
    const teacherId = req.nextUrl.searchParams.get('teacher_id')

    // Mode 1: list assignments for a subject
    if (subjectId) {
      const api = `${url}/rest/v1/materias_responsables?materia_id=eq.${subjectId}&select=id,docente_id,perfiles!materias_responsables_docente_id_fkey(id,nombre_completo,correo,dni)`
      const res = await fetch(api, { headers: { apikey: anon, Authorization: `Bearer ${anon}`, Accept: 'application/json' }, cache: 'no-store' })
      if (!res.ok) return NextResponse.json({ error: 'No se pudieron obtener docentes de la materia' }, { status: 500 })
      const rows = await res.json()
      const assignments = rows.map((r: any) => ({ id: r.id, teacher_id: r.docente_id, teacher_name: r.perfiles?.nombre_completo, correo: r.perfiles?.correo, dni: r.perfiles?.dni }))
      return NextResponse.json({ ok: true, assignments })
    }

    // Mode 2: list subjects assigned to a teacher
    let targetTeacherId: string | null = null
    if (teacherMe) {
      if (session.role !== 'docente' && session.role !== 'teacher' && session.role !== 'administrador' && session.role !== 'preceptor' && session.role !== 'directivo') {
        return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
      }
      targetTeacherId = session.id
    } else if (teacherId) {
      if (!['preceptor', 'directivo', 'administrador'].includes(session.role)) {
        return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
      }
      targetTeacherId = teacherId
    }

    if (!targetTeacherId) return NextResponse.json({ error: 'Parámetros insuficientes' }, { status: 400 })

    const api2 = `${url}/rest/v1/materias_responsables?docente_id=eq.${targetTeacherId}&select=materias(id,nombre)`
    const res2 = await fetch(api2, { headers: { apikey: anon, Authorization: `Bearer ${anon}`, Accept: 'application/json' }, cache: 'no-store' })
    if (!res2.ok) return NextResponse.json({ error: 'No se pudieron obtener materias del docente' }, { status: 500 })
    const rows2 = await res2.json()
    const subjects = rows2.map((r: any) => ({ id: r.materias?.id, nombre: r.materias?.nombre })).filter((x: any) => x.id)
    return NextResponse.json({ ok: true, subjects })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Error interno' }, { status: 500 })
  }
}

// POST /api/subject-teachers { subject_id, teacher_id }
export async function POST(req: NextRequest) {
  try {
    const token = req.cookies.get(SESSION_COOKIE)?.value
    if (!token) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    const session = await verifySession(token)
    if (!['preceptor', 'directivo', 'administrador'].includes(session.role)) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
    }

    const { subject_id, teacher_id } = await req.json()
    if (!subject_id || !teacher_id) return NextResponse.json({ error: 'Faltan parámetros' }, { status: 400 })

    const { url, anon } = keys()
    if (!url || !anon) return NextResponse.json({ error: 'Configuración de Supabase incompleta' }, { status: 500 })

    const api = `${url}/rest/v1/materias_responsables`
    const res = await fetch(api, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json', apikey: anon, Authorization: `Bearer ${anon}`, Prefer: 'return=representation' },
      body: JSON.stringify({ materia_id: subject_id, docente_id: teacher_id }),
    })
    if (!res.ok) {
      let msg = 'No se pudo asignar el docente a la materia'
      try { const d = await res.json(); msg = d?.message || d?.error || msg } catch {}
      return NextResponse.json({ error: msg }, { status: 400 })
    }
    const data = await res.json()
    return NextResponse.json({ ok: true, assignment: data?.[0] || null })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Error interno' }, { status: 500 })
  }
}

// DELETE /api/subject-teachers?id=...
export async function DELETE(req: NextRequest) {
  try {
    const token = req.cookies.get(SESSION_COOKIE)?.value
    if (!token) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    const session = await verifySession(token)
    if (!['preceptor', 'directivo', 'administrador'].includes(session.role)) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
    }

    const id = req.nextUrl.searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'Falta id' }, { status: 400 })

    const { url, anon } = keys()
    if (!url || !anon) return NextResponse.json({ error: 'Configuración de Supabase incompleta' }, { status: 500 })

    const api = `${url}/rest/v1/materias_responsables?id=eq.${id}`
    const res = await fetch(api, { method: 'DELETE', headers: { apikey: anon, Authorization: `Bearer ${anon}` } })
    if (!res.ok) return NextResponse.json({ error: 'No se pudo quitar el docente de la materia' }, { status: 400 })
    return NextResponse.json({ ok: true })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Error interno' }, { status: 500 })
  }
}
