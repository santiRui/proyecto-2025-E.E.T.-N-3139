import { NextRequest, NextResponse } from 'next/server'
import { SESSION_COOKIE, verifySession } from '@/lib/auth'

function getKeys() {
  const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
  const ANON = process.env.SUPABASE_ANON_KEY
  const SERVICE = process.env.SUPABASE_SERVICE_ROLE_KEY
  return { SUPABASE_URL, KEY: SERVICE || ANON }
}

export async function GET(req: NextRequest) {
  try {
    const token = req.cookies.get(SESSION_COOKIE)?.value
    if (!token) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    const session = await verifySession(token)
    if (!['preceptor', 'directivo', 'tutor'].includes(session.role)) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
    }

    const studentId = req.nextUrl.searchParams.get('student_id')
    const tutorId = req.nextUrl.searchParams.get('tutor_id')

    if (!studentId && session.role !== 'tutor') {
      return NextResponse.json({ error: 'Falta student_id' }, { status: 400 })
    }

    if (session.role === 'tutor' && !studentId) {
      const { SUPABASE_URL, KEY } = getKeys()
      if (!SUPABASE_URL || !KEY) return NextResponse.json({ error: 'Faltan claves de Supabase' }, { status: 500 })

      const relUrl = `${SUPABASE_URL}/rest/v1/tutores_estudiantes?select=estudiante_id&tutor_id=eq.${session.id}`
      const relRes = await fetch(relUrl, { headers: { apikey: KEY, Authorization: `Bearer ${KEY}`, Accept: 'application/json' }, cache: 'no-store' })
      if (!relRes.ok) return NextResponse.json({ error: 'No se pudieron obtener relaciones' }, { status: 500 })
      const relRows: Array<{ estudiante_id: string }> = await relRes.json()
      const studentIds = relRows.map((r) => r.estudiante_id).filter(Boolean)
      return NextResponse.json({ ok: true, students: studentIds })
    }

    const { SUPABASE_URL, KEY } = getKeys()
    if (!SUPABASE_URL || !KEY) return NextResponse.json({ error: 'Faltan claves de Supabase' }, { status: 500 })

    // 1) Obtener relaciones
    let relUrl = `${SUPABASE_URL}/rest/v1/tutores_estudiantes?select=tutor_id,estudiante_id`
    const filters: string[] = []
    if (studentId) filters.push(`estudiante_id=eq.${studentId}`)
    if (tutorId) filters.push(`tutor_id=eq.${tutorId}`)
    if (filters.length) relUrl += `&${filters.join('&')}`
    const relRes = await fetch(relUrl, { headers: { apikey: KEY, Authorization: `Bearer ${KEY}`, Accept: 'application/json' }, cache: 'no-store' })
    if (!relRes.ok) return NextResponse.json({ error: 'No se pudieron obtener relaciones' }, { status: 500 })
    const relRows: Array<{ tutor_id: string }> = await relRes.json()
    const tutorIds = relRows.map(r => r.tutor_id).filter(Boolean)
    if (tutorIds.length === 0) return NextResponse.json({ ok: true, tutors: [] })

    // 2) Traer perfiles de tutores (sin comillas en los UUIDs)
    const inList = tutorIds.join(',')
    const tutUrl = `${SUPABASE_URL}/rest/v1/perfiles?id=in.(${inList})&select=id,nombre_completo,correo,telefono`
    const tutRes = await fetch(tutUrl, { headers: { apikey: KEY, Authorization: `Bearer ${KEY}`, Accept: 'application/json' }, cache: 'no-store' })
    if (!tutRes.ok) return NextResponse.json({ error: 'No se pudieron obtener tutores' }, { status: 500 })
    const tutors = await tutRes.json()
    return NextResponse.json({ ok: true, tutors })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Error interno' }, { status: 500 })
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

    const { student_id, tutor_id } = await req.json()
    if (!student_id || !tutor_id) return NextResponse.json({ error: 'Faltan parámetros' }, { status: 400 })

    const { SUPABASE_URL, KEY } = getKeys()
    if (!SUPABASE_URL || !KEY) return NextResponse.json({ error: 'Faltan claves de Supabase' }, { status: 500 })

    const url = `${SUPABASE_URL}/rest/v1/tutores_estudiantes`
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json', apikey: KEY, Authorization: `Bearer ${KEY}`, Prefer: 'return=representation' },
      body: JSON.stringify({ estudiante_id: student_id, tutor_id }),
    })
    if (!res.ok) {
      let msg = 'No se pudo asociar tutor'
      try { const data = await res.json(); msg = data?.message || data?.error || msg } catch {}
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

    const studentId = req.nextUrl.searchParams.get('student_id')
    const tutorId = req.nextUrl.searchParams.get('tutor_id')
    if (!studentId || !tutorId) return NextResponse.json({ error: 'Faltan parámetros' }, { status: 400 })

    const { SUPABASE_URL, KEY } = getKeys()
    if (!SUPABASE_URL || !KEY) return NextResponse.json({ error: 'Faltan claves de Supabase' }, { status: 500 })

    const url = `${SUPABASE_URL}/rest/v1/tutores_estudiantes?estudiante_id=eq.${studentId}&tutor_id=eq.${tutorId}`
    const res = await fetch(url, { method: 'DELETE', headers: { apikey: KEY, Authorization: `Bearer ${KEY}` } })
    if (!res.ok) return NextResponse.json({ error: 'No se pudo desasociar' }, { status: 400 })
    return NextResponse.json({ ok: true })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Error interno' }, { status: 500 })
  }
}
