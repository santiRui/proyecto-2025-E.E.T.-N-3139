import { NextRequest, NextResponse } from 'next/server'
import { SESSION_COOKIE, verifySession } from '@/lib/auth'

function keys() {
  return {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL,
    anon: process.env.SUPABASE_ANON_KEY,
    service: process.env.SUPABASE_SERVICE_ROLE_KEY,
  }
}

export async function GET(req: NextRequest) {
  try {
    const token = req.cookies.get(SESSION_COOKIE)?.value
    if (!token) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    const session = await verifySession(token)
    if (!['preceptor', 'teacher', 'directivo', 'administrador', 'admin'].includes(session.role)) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
    }

    const courseId = req.nextUrl.searchParams.get('course_id')
    if (!courseId) return NextResponse.json({ error: 'Falta course_id' }, { status: 400 })

    const { url, anon, service } = keys()
    const key = service || anon
    if (!url || !key) return NextResponse.json({ error: 'Configuración de Supabase incompleta' }, { status: 500 })

    // 1) Obtener relaciones curso-docentes desde cursos_docentes
    const relUrl = `${url}/rest/v1/cursos_docentes?select=docente_id&curso_id=eq.${courseId}`
    const relRes = await fetch(relUrl, { headers: { apikey: key, Authorization: `Bearer ${key}`, Accept: 'application/json' }, cache: 'no-store' })
    if (!relRes.ok) return NextResponse.json({ error: 'No se pudieron obtener relaciones' }, { status: 500 })
    const relRows: Array<{ docente_id: string }> = await relRes.json()

    // 1b) Obtener docentes asignados vía materias_docentes (curso_id + materia)
    const mdUrl = `${url}/rest/v1/materias_docentes?select=docente_id&curso_id=eq.${courseId}`
    const mdRes = await fetch(mdUrl, { headers: { apikey: key, Authorization: `Bearer ${key}`, Accept: 'application/json' }, cache: 'no-store' })
    if (!mdRes.ok) return NextResponse.json({ error: 'No se pudieron obtener relaciones de materias' }, { status: 500 })
    const mdRows: Array<{ docente_id: string }> = await mdRes.json()

    const seen = new Set<string>()
    const ids: string[] = []
    ;[...relRows, ...mdRows].forEach((r) => {
      const id = r?.docente_id
      if (id && !seen.has(id)) { seen.add(id); ids.push(id) }
    })
    if (ids.length === 0) return NextResponse.json({ ok: true, teachers: [] })

    // 2) Traer perfiles de docentes
    const inList = ids.map(id => `"${id}"`).join(',')
    const pUrl = `${url}/rest/v1/perfiles?id=in.(${inList})&rol=eq.docente&select=id,nombre_completo,correo,dni,telefono`
    const pRes = await fetch(pUrl, { headers: { apikey: key, Authorization: `Bearer ${key}`, Accept: 'application/json' }, cache: 'no-store' })
    if (!pRes.ok) return NextResponse.json({ error: 'No se pudieron obtener docentes' }, { status: 500 })
    const teachers = await pRes.json()
    return NextResponse.json({ ok: true, teachers })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Error interno' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const token = req.cookies.get(SESSION_COOKIE)?.value
    if (!token) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    const session = await verifySession(token)
    if (!['preceptor', 'directivo', 'administrador', 'admin'].includes(session.role)) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
    }

    const { course_id, teacher_id } = await req.json()
    if (!course_id || !teacher_id) return NextResponse.json({ error: 'Faltan parámetros' }, { status: 400 })

    const { url, anon, service } = keys()
    const key = service || anon
    if (!url || !key) return NextResponse.json({ error: 'Configuración de Supabase incompleta' }, { status: 500 })

    // Evitar duplicado en el mismo curso
    const checkUrl = `${url}/rest/v1/cursos_docentes?select=docente_id&curso_id=eq.${course_id}&docente_id=eq.${teacher_id}`
    const check = await fetch(checkUrl, { headers: { apikey: key, Authorization: `Bearer ${key}`, Accept: 'application/json' }, cache: 'no-store' })
    if (!check.ok) return NextResponse.json({ error: 'No se pudo validar' }, { status: 500 })
    const exists: Array<any> = await check.json()
    if (exists.length > 0) return NextResponse.json({ error: 'El docente ya está asignado a este curso' }, { status: 409 })

    const api = `${url}/rest/v1/cursos_docentes`
    const res = await fetch(api, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json', apikey: key, Authorization: `Bearer ${key}`, Prefer: 'return=representation' },
      body: JSON.stringify({ curso_id: course_id, docente_id: teacher_id }),
    })
    if (!res.ok) {
      let msg = 'No se pudo asignar docente'
      try { const d = await res.json(); msg = d?.message || d?.error || msg } catch {}
      return NextResponse.json({ error: msg }, { status: 400 })
    }
    const data = await res.json()
    return NextResponse.json({ ok: true, relation: data?.[0] || null })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Error interno' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const token = req.cookies.get(SESSION_COOKIE)?.value
    if (!token) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    const session = await verifySession(token)
    if (!['preceptor', 'directivo', 'administrador', 'admin'].includes(session.role)) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
    }

    const courseId = req.nextUrl.searchParams.get('course_id')
    const teacherId = req.nextUrl.searchParams.get('teacher_id')
    if (!courseId || !teacherId) return NextResponse.json({ error: 'Faltan parámetros' }, { status: 400 })

    const { url, anon, service } = keys()
    const key = service || anon
    if (!url || !key) return NextResponse.json({ error: 'Configuración de Supabase incompleta' }, { status: 500 })

    const api = `${url}/rest/v1/cursos_docentes?curso_id=eq.${courseId}&docente_id=eq.${teacherId}`
    const res = await fetch(api, { method: 'DELETE', headers: { apikey: key, Authorization: `Bearer ${key}` } })
    if (!res.ok) return NextResponse.json({ error: 'No se pudo desasignar docente' }, { status: 400 })
    return NextResponse.json({ ok: true })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Error interno' }, { status: 500 })
  }
}
