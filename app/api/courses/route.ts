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
    if (!['preceptor', 'docente', 'directivo'].includes(session.role)) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
    }

    const { url, anon } = keys()
    if (!url || !anon) return NextResponse.json({ error: 'Configuración de Supabase incompleta' }, { status: 500 })

    // Si es docente, devolver solo sus cursos
    if (session.role === 'docente') {
      const relUrl = `${url}/rest/v1/cursos_docentes?select=curso_id&docente_id=eq.${session.id}`
      const relRes = await fetch(relUrl, { headers: { apikey: anon, Authorization: `Bearer ${anon}`, Accept: 'application/json' }, cache: 'no-store' })
      if (!relRes.ok) return NextResponse.json({ error: 'No se pudieron obtener cursos' }, { status: 500 })
      const rels: Array<{ curso_id: string }> = await relRes.json()
      const ids = rels.map(r => r.curso_id).filter(Boolean)
      if (ids.length === 0) return NextResponse.json({ ok: true, courses: [] })
      const inList = ids.map(id => `"${id}"`).join(',')
      const api = `${url}/rest/v1/cursos?id=in.(${inList})&select=id,nombre,descripcion,anio_lectivo,creado_en`
      const res = await fetch(api, { headers: { apikey: anon, Authorization: `Bearer ${anon}`, Accept: 'application/json' }, cache: 'no-store' })
      if (!res.ok) return NextResponse.json({ error: 'No se pudieron obtener cursos' }, { status: 500 })
      const data = await res.json()
      return NextResponse.json({ ok: true, courses: data })
    }

    // Preceptor/Directivo: todos los cursos
    const api = `${url}/rest/v1/cursos?select=id,nombre,descripcion,anio_lectivo,creado_en`
    const res = await fetch(api, { headers: { apikey: anon, Authorization: `Bearer ${anon}`, Accept: 'application/json' }, cache: 'no-store' })
    if (!res.ok) return NextResponse.json({ error: 'No se pudieron obtener cursos' }, { status: 500 })
    const data = await res.json()
    return NextResponse.json({ ok: true, courses: data })
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

    const { nombre, descripcion, anio_lectivo } = await req.json()
    if (!nombre || !anio_lectivo) return NextResponse.json({ error: 'Faltan campos' }, { status: 400 })

    const { url, anon, service } = keys()
    const key = service || anon
    if (!url || !key) return NextResponse.json({ error: 'Configuración de Supabase incompleta' }, { status: 500 })

    const api = `${url}/rest/v1/cursos`
    const body = { nombre, descripcion: descripcion || null, anio_lectivo, creado_por: session.id }
    const res = await fetch(api, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json', apikey: key, Authorization: `Bearer ${key}`, Prefer: 'return=representation' },
      body: JSON.stringify(body),
    })
    if (!res.ok) {
      let msg = 'No se pudo crear el curso'
      try { const d = await res.json(); msg = d?.message || d?.error || msg } catch {}
      return NextResponse.json({ error: msg }, { status: 400 })
    }
    const data = await res.json()
    return NextResponse.json({ ok: true, course: data?.[0] || null })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Error interno' }, { status: 500 })
  }
}
