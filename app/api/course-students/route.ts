import { NextRequest, NextResponse } from 'next/server'
import { SESSION_COOKIE, verifySession } from '@/lib/auth'

function keys() {
  return {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL,
    anon: process.env.SUPABASE_ANON_KEY,
    service: process.env.SUPABASE_SERVICE_ROLE_KEY,
  }
}

export async function POST(req: NextRequest) {
  try {
    const token = req.cookies.get(SESSION_COOKIE)?.value
    if (!token) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    const session = await verifySession(token)
    if (!['preceptor', 'directivo'].includes(session.role)) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
    }

    const { course_id, student_id } = await req.json()
    if (!course_id || !student_id) return NextResponse.json({ error: 'Faltan parámetros' }, { status: 400 })

    const { url, anon, service } = keys()
    const key = service || anon
    if (!url || !key) return NextResponse.json({ error: 'Configuración de Supabase incompleta' }, { status: 500 })

    // Validación: el estudiante no puede pertenecer a otro curso
    const checkUrl = `${url}/rest/v1/cursos_estudiantes?select=curso_id&estudiante_id=eq.${student_id}`
    const checkRes = await fetch(checkUrl, { headers: { apikey: key, Authorization: `Bearer ${key}`, Accept: 'application/json' }, cache: 'no-store' })
    if (!checkRes.ok) return NextResponse.json({ error: 'No se pudo validar estado del estudiante' }, { status: 500 })
    const current: Array<{ curso_id: string }> = await checkRes.json()
    const inOtherCourse = current.some((r) => r.curso_id && r.curso_id !== course_id)
    if (inOtherCourse) {
      return NextResponse.json({ error: 'El estudiante ya pertenece a otro curso' }, { status: 409 })
    }
    const inSameCourse = current.some((r) => r.curso_id === course_id)
    if (inSameCourse) {
      return NextResponse.json({ error: 'El estudiante ya pertenece a este curso' }, { status: 409 })
    }

    const api = `${url}/rest/v1/cursos_estudiantes`
    const res = await fetch(api, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json', apikey: key, Authorization: `Bearer ${key}`, Prefer: 'return=representation' },
      body: JSON.stringify({ curso_id: course_id, estudiante_id: student_id }),
    })
    if (!res.ok) {
      let msg = 'No se pudo asignar estudiante al curso'
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
    if (!['preceptor', 'directivo'].includes(session.role)) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
    }

    const courseId = req.nextUrl.searchParams.get('course_id')
    const studentId = req.nextUrl.searchParams.get('student_id')
    if (!courseId || !studentId) return NextResponse.json({ error: 'Faltan parámetros' }, { status: 400 })

    const { url, anon, service } = keys()
    const key = service || anon
    if (!url || !key) return NextResponse.json({ error: 'Configuración de Supabase incompleta' }, { status: 500 })

    const api = `${url}/rest/v1/cursos_estudiantes?curso_id=eq.${courseId}&estudiante_id=eq.${studentId}`
    const res = await fetch(api, { method: 'DELETE', headers: { apikey: key, Authorization: `Bearer ${key}` } })
    if (!res.ok) return NextResponse.json({ error: 'No se pudo desasignar estudiante' }, { status: 400 })
    return NextResponse.json({ ok: true })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Error interno' }, { status: 500 })
  }
}

export async function GET(req: NextRequest) {
  try {
    const token = req.cookies.get(SESSION_COOKIE)?.value
    if (!token) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    const session = await verifySession(token)
    if (!['preceptor', 'teacher', 'directivo'].includes(session.role)) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
    }

    const courseId = req.nextUrl.searchParams.get('course_id')
    if (!courseId) return NextResponse.json({ error: 'Falta course_id' }, { status: 400 })

    const { url, anon, service } = keys()
    const key = service || anon
    if (!url || !key) return NextResponse.json({ error: 'Configuración de Supabase incompleta' }, { status: 500 })

    // 1) Obtener relaciones curso-estudiantes
    const relUrl = `${url}/rest/v1/cursos_estudiantes?select=estudiante_id&curso_id=eq.${courseId}`
    const relRes = await fetch(relUrl, { headers: { apikey: key, Authorization: `Bearer ${key}`, Accept: 'application/json' }, cache: 'no-store' })
    if (!relRes.ok) return NextResponse.json({ error: 'No se pudieron obtener relaciones' }, { status: 500 })
    const relRows: Array<{ estudiante_id: string }> = await relRes.json()
    const ids = relRows.map(r => r.estudiante_id).filter(Boolean)
    if (ids.length === 0) return NextResponse.json({ ok: true, students: [] })

    // 2) Traer perfiles de estudiantes
    const inList = ids.map(id => `"${id}"`).join(',')
    const stuUrl = `${url}/rest/v1/perfiles?id=in.(${inList})&rol=eq.estudiante&select=id,nombre_completo,correo,dni,telefono`
    const stuRes = await fetch(stuUrl, { headers: { apikey: key, Authorization: `Bearer ${key}`, Accept: 'application/json' }, cache: 'no-store' })
    if (!stuRes.ok) return NextResponse.json({ error: 'No se pudieron obtener estudiantes' }, { status: 500 })
    const students = await stuRes.json()
    return NextResponse.json({ ok: true, students })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Error interno' }, { status: 500 })
  }
}
