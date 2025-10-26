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
    if (!['preceptor', 'directivo', 'administrador'].includes(session.role)) {
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
    if (!['preceptor', 'directivo', 'administrador'].includes(session.role)) {
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
    if (!['preceptor', 'docente', 'teacher', 'directivo', 'administrador'].includes(session.role)) {
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

    const attendanceSelect = encodeURIComponent('estudiante_id,curso_id,total_registros,presentes,llegadas_tarde,ausentes,faltas_justificadas,faltas_equivalentes')
    const attendanceUrl = `${url}/rest/v1/v_asistencias_resumen?select=${attendanceSelect}&curso_id=eq.${courseId}`
    let attendanceSummaries: Record<string, any> = {}
    try {
      const attendanceRes = await fetch(attendanceUrl, { headers: { apikey: key, Authorization: `Bearer ${key}`, Accept: 'application/json' }, cache: 'no-store' })
      if (attendanceRes.ok) {
        const summaryData = await attendanceRes.json().catch(() => [])
        if (Array.isArray(summaryData)) {
          summaryData.forEach((summary: any) => {
            const studentId = summary?.estudiante_id
            if (!studentId) return
            const faltasEquivalentes = Number.parseFloat(summary?.faltas_equivalentes ?? '0')
            attendanceSummaries[studentId] = {
              estudiante_id: studentId,
              curso_id: summary?.curso_id ?? courseId,
              total_registros: Number(summary?.total_registros ?? 0),
              presentes: Number(summary?.presentes ?? 0),
              llegadas_tarde: Number(summary?.llegadas_tarde ?? 0),
              ausentes: Number(summary?.ausentes ?? 0),
              faltas_justificadas: Number(summary?.faltas_justificadas ?? 0),
              faltas_equivalentes: Number.isNaN(faltasEquivalentes) ? 0 : faltasEquivalentes,
            }
          })
        }
      }
    } catch {}

    const enriched = Array.isArray(students)
      ? students.map((student: any) => ({
          ...student,
          attendance_summary: attendanceSummaries[student.id] || null,
        }))
      : students

    return NextResponse.json({ ok: true, students: enriched })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Error interno' }, { status: 500 })
  }
}
