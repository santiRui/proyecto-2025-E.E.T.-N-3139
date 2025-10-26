import { NextRequest, NextResponse } from 'next/server'
import { SESSION_COOKIE, verifySession } from '@/lib/auth'

export async function GET(_req: NextRequest) {
  try {
    // Auth: teacher, preceptor y directivo
    const token = _req.cookies.get(SESSION_COOKIE)?.value
    if (!token) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    const session = await verifySession(token)
    if (!['preceptor', 'directivo', 'docente', 'administrador'].includes(session.role)) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
    }

    const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
    const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY
    const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
    const KEY = SUPABASE_SERVICE_ROLE_KEY || SUPABASE_ANON_KEY
    if (!SUPABASE_URL || !KEY) {
      return NextResponse.json({ error: 'Configuración de Supabase incompleta' }, { status: 500 })
    }

    const q = (_req.nextUrl.searchParams.get('q') || '').trim()
    let url = `${SUPABASE_URL}/rest/v1/perfiles?rol=eq.estudiante&select=id,nombre_completo,correo,dni,telefono,cursos_estudiantes(curso_id)`
    if (q) {
      const enc = encodeURIComponent(`nombre_completo.ilike.*${q}*,dni.ilike.*${q}*`)
      url += `&or=(${enc})`
    }
    const res = await fetch(url, {
      headers: {
        apikey: KEY,
        Authorization: `Bearer ${KEY}`,
        Accept: 'application/json',
      },
      cache: 'no-store',
    })

    if (!res.ok) {
      const msg = await res.text().catch(() => 'No se pudieron obtener estudiantes')
      return NextResponse.json({ error: msg || 'No se pudieron obtener estudiantes' }, { status: 500 })
    }

    const data = await res.json()
    const students = Array.isArray(data) ? data : []
    const studentIds = students.map((student: any) => student?.id).filter(Boolean)

    let attendanceSummaries: Record<string, any> = {}

    if (studentIds.length > 0) {
      const select = encodeURIComponent('estudiante_id,curso_id,total_registros,presentes,llegadas_tarde,ausentes,faltas_justificadas,faltas_equivalentes')
      const filter = encodeURIComponent(`in.(${studentIds.join(',')})`)
      const summaryUrl = `${SUPABASE_URL}/rest/v1/v_asistencias_resumen?select=${select}&estudiante_id=${filter}`

      try {
        const summaryRes = await fetch(summaryUrl, {
          headers: {
            apikey: KEY,
            Authorization: `Bearer ${KEY}`,
            Accept: 'application/json',
          },
          cache: 'no-store',
        })

        if (summaryRes.ok) {
          const summaryData = await summaryRes.json().catch(() => [])
          if (Array.isArray(summaryData)) {
            summaryData.forEach((summary: any) => {
              const studentId = summary?.estudiante_id
              if (!studentId) return
              const faltasEquivalentes = Number.parseFloat(summary?.faltas_equivalentes ?? '0')
              attendanceSummaries[studentId] = {
                estudiante_id: studentId,
                curso_id: summary?.curso_id ?? null,
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
      } catch {
        // Ignore attendance fetch failures; students will fallback to null summaries
      }
    }

    const enriched = students.map((student: any) => ({
      ...student,
      attendance_summary: attendanceSummaries[student.id] || null,
    }))

    return NextResponse.json({ ok: true, students: enriched })
  } catch (e: any) {
    const message = e?.message || 'Error interno'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
