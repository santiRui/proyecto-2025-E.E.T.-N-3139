import { NextRequest, NextResponse } from 'next/server'
import { SESSION_COOKIE, verifySession } from '@/lib/auth'

function keys() {
  return {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL,
    anon: process.env.SUPABASE_ANON_KEY,
    service: process.env.SUPABASE_SERVICE_ROLE_KEY,
  }
}

const STAFF_ROLES = ['docente', 'preceptor', 'directivo', 'administrador']

export async function POST(req: NextRequest) {
  try {
    const token = req.cookies.get(SESSION_COOKIE)?.value
    if (!token) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

    const session = await verifySession(token)
    if (!STAFF_ROLES.includes(session.role)) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
    }

    const { courseId, subject, type, date, weight, observations, grades } = await req.json()

    if (!courseId || !subject || !type || !date || !weight || !grades || Object.keys(grades).length === 0) {
      return NextResponse.json({ error: 'Faltan campos obligatorios o no hay calificaciones' }, { status: 400 })
    }

    const { url, anon, service } = keys()
    const key = service || anon
    if (!url || !key) {
      return NextResponse.json({ error: 'Configuración de Supabase incompleta' }, { status: 500 })
    }

    const gradesToInsert = Object.entries(grades)
      .map(([studentId, gradeValue]) => {
        const calificacion = parseFloat(String(gradeValue))
        if (Number.isNaN(calificacion)) return null
        return {
          curso_id: courseId,
          estudiante_id: studentId,
          materia_nombre: subject,
          tipo_evaluacion: type,
          fecha: date,
          peso: parseFloat(String(weight)) || 0,
          observaciones: observations || null,
          calificacion,
          creado_por: session.id,
        }
      })
      .filter(Boolean)

    if (!gradesToInsert.length) {
      return NextResponse.json({ error: 'Las calificaciones no son válidas' }, { status: 400 })
    }

    const api = `${url}/rest/v1/calificaciones`
    const res = await fetch(api, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        apikey: key,
        Authorization: `Bearer ${key}`,
        Prefer: 'return=representation',
      },
      body: JSON.stringify(gradesToInsert),
    })

    if (!res.ok) {
      let msg = 'No se pudieron guardar las calificaciones'
      try {
        const errorData = await res.json()
        msg = errorData?.message || errorData?.error || msg
      } catch {}
      return NextResponse.json({ error: msg }, { status: 400 })
    }

    const data = await res.json()
    return NextResponse.json({ ok: true, grades: data })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Error interno' }, { status: 500 })
  }
}

export async function GET(req: NextRequest) {
  try {
    const token = req.cookies.get(SESSION_COOKIE)?.value
    if (!token) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

    const session = await verifySession(token)
    const isStaff = STAFF_ROLES.includes(session.role)

    const params = req.nextUrl.searchParams
    const { url, anon, service } = keys()
    const key = service || anon
    if (!url || !key) {
      return NextResponse.json({ error: 'Configuración de Supabase incompleta' }, { status: 500 })
    }

    const query = new URLSearchParams()

    if (isStaff) {
      const courseId = params.get('course_id')
      if (!courseId) {
        return NextResponse.json({ error: 'Falta course_id' }, { status: 400 })
      }
      query.set('curso_id', `eq.${courseId}`)
      const studentId = params.get('student_id')
      if (studentId) query.set('estudiante_id', `eq.${studentId}`)
    } else {
      if (session.role === 'estudiante') {
        query.set('estudiante_id', `eq.${session.id}`)
      } else if (session.role === 'tutor') {
        const studentId = params.get('student_id')
        if (!studentId) {
          return NextResponse.json({ error: 'Falta student_id' }, { status: 400 })
        }
        query.set('estudiante_id', `eq.${studentId}`)
      } else {
        return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
      }
    }

    const subject = params.get('subject')
    if (subject) query.set('materia_nombre', `eq.${subject}`)

    query.set('order', 'fecha.desc')

    const apiUrl = `${url}/rest/v1/v_calificaciones_detalle?${query.toString()}`
    const res = await fetch(apiUrl, {
      headers: {
        apikey: key,
        Authorization: `Bearer ${key}`,
        Accept: 'application/json',
      },
      cache: 'no-store',
    })

    if (!res.ok) {
      let msg = 'No se pudieron obtener las calificaciones'
      try {
        const errorData = await res.json()
        msg = errorData?.message || errorData?.error || msg
      } catch {}
      return NextResponse.json({ error: msg }, { status: 400 })
    }

    const data = await res.json()
    return NextResponse.json({ ok: true, grades: Array.isArray(data) ? data : [] })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Error interno' }, { status: 500 })
  }
}
