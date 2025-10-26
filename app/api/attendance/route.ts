import { NextRequest, NextResponse } from 'next/server'
import { SESSION_COOKIE, verifySession } from '@/lib/auth'

const STAFF_ROLES = ['docente', 'preceptor', 'directivo', 'administrador']
const VALID_STATUSES = new Set(['presente', 'llegada_tarde', 'ausente', 'falta_justificada'])

function keys() {
  return {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL,
    anon: process.env.SUPABASE_ANON_KEY,
    service: process.env.SUPABASE_SERVICE_ROLE_KEY,
  }
}

function todayISO() {
  return new Date().toISOString().slice(0, 10)
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

    const summaryType = params.get('summary')
    if (summaryType) {
      const summaryQuery = new URLSearchParams()

      if (summaryType === 'course') {
        const courseId = params.get('course_id')
        if (!courseId) {
          return NextResponse.json({ error: 'Falta course_id' }, { status: 400 })
        }
        summaryQuery.set('curso_id', `eq.${courseId}`)
      } else if (summaryType === 'student') {
        const studentId = params.get('student_id')
        if (!studentId) {
          return NextResponse.json({ error: 'Falta student_id' }, { status: 400 })
        }
        summaryQuery.set('estudiante_id', `eq.${studentId}`)
        const courseId = params.get('course_id')
        if (courseId) summaryQuery.append('curso_id', `eq.${courseId}`)
      } else {
        return NextResponse.json({ error: 'summary inválido' }, { status: 400 })
      }

      summaryQuery.append('order', 'faltas_equivalentes.asc')
      summaryQuery.append('order', 'estudiante_id.asc')

      const summaryUrl = `${url}/rest/v1/v_asistencias_resumen?${summaryQuery.toString()}`
      const res = await fetch(summaryUrl, {
        headers: {
          apikey: key,
          Authorization: `Bearer ${key}`,
          Accept: 'application/json',
        },
        cache: 'no-store',
      })

      if (!res.ok) {
        let msg = 'No se pudo obtener el resumen de asistencias'
        try {
          const errorData = await res.json()
          msg = errorData?.message || errorData?.error || msg
        } catch {}
        return NextResponse.json({ error: msg }, { status: 400 })
      }

      const data = await res.json()
      return NextResponse.json({ ok: true, summaries: Array.isArray(data) ? data : [] })
    }

    const query = new URLSearchParams()

    if (isStaff) {
      const courseId = params.get('course_id')
      if (!courseId) {
        return NextResponse.json({ error: 'Falta course_id' }, { status: 400 })
      }
      query.set('curso_id', `eq.${courseId}`)
      const studentId = params.get('student_id')
      if (studentId) query.append('estudiante_id', `eq.${studentId}`)
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

    const date = params.get('date')
    const from = params.get('from')
    const to = params.get('to')

    if (date) {
      query.set('fecha', `eq.${date}`)
    } else {
      if (from) query.append('fecha', `gte.${from}`)
      if (to) query.append('fecha', `lte.${to}`)
    }

    const limit = params.get('limit')
    if (limit) query.set('limit', limit)

    query.append('order', 'fecha.desc')
    query.append('order', 'estudiante_id.asc')

    const apiUrl = `${url}/rest/v1/asistencias?${query.toString()}`
    const res = await fetch(apiUrl, {
      headers: {
        apikey: key,
        Authorization: `Bearer ${key}`,
        Accept: 'application/json',
      },
      cache: 'no-store',
    })

    if (!res.ok) {
      let msg = 'No se pudieron obtener asistencias'
      try {
        const errorData = await res.json()
        msg = errorData?.message || errorData?.error || msg
      } catch {}
      return NextResponse.json({ error: msg }, { status: 400 })
    }

    const data = await res.json()
    return NextResponse.json({ ok: true, records: Array.isArray(data) ? data : [] })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Error interno' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const token = req.cookies.get(SESSION_COOKIE)?.value
    if (!token) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

    const session = await verifySession(token)
    if (!STAFF_ROLES.includes(session.role)) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
    }

    const { courseId, date, records } = await req.json()

    if (!courseId || !records || typeof records !== 'object') {
      return NextResponse.json({ error: 'Faltan datos de curso o asistencias' }, { status: 400 })
    }

    const targetDate = typeof date === 'string' && date.trim() ? date : todayISO()

    const payload = Object.entries(records)
      .map(([studentId, value]) => {
        if (!studentId) return null
        if (!value) return null
        let status: string | undefined
        let observations: string | undefined

        if (typeof value === 'string') {
          status = value
        } else if (typeof value === 'object') {
          status = typeof value.status === 'string' ? value.status : undefined
          observations = typeof value.observations === 'string' && value.observations.trim().length > 0 ? value.observations.trim() : undefined
        }

        if (!status || !VALID_STATUSES.has(status)) return null

        return {
          curso_id: courseId,
          estudiante_id: studentId,
          fecha: targetDate,
          estado: status,
          observaciones: observations ?? null,
          registrada_por: session.id,
        }
      })
      .filter(Boolean) as Array<{
        curso_id: string
        estudiante_id: string
        fecha: string
        estado: string
        observaciones: string | null
        registrada_por: string
      }>

    if (!payload.length) {
      return NextResponse.json({ error: 'No hay asistencias válidas para guardar' }, { status: 400 })
    }

    const { url, anon, service } = keys()
    const key = service || anon
    if (!url || !key) {
      return NextResponse.json({ error: 'Configuración de Supabase incompleta' }, { status: 500 })
    }

    const apiUrl = `${url}/rest/v1/asistencias?on_conflict=curso_id,estudiante_id,fecha`
    const res = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        apikey: key,
        Authorization: `Bearer ${key}`,
        Prefer: 'return=representation,resolution=merge-duplicates',
      },
      body: JSON.stringify(payload),
    })

    if (!res.ok) {
      let msg = 'No se pudieron guardar las asistencias'
      try {
        const errorData = await res.json()
        msg = errorData?.message || errorData?.error || msg
      } catch {}
      return NextResponse.json({ error: msg }, { status: 400 })
    }

    const data = await res.json()
    return NextResponse.json({ ok: true, records: data })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Error interno' }, { status: 500 })
  }
}
