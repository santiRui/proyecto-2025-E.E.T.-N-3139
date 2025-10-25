import { NextRequest, NextResponse } from 'next/server'
import { SESSION_COOKIE, verifySession } from '@/lib/auth'

function keys() {
  return {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL,
    anon: process.env.SUPABASE_ANON_KEY,
    service: process.env.SUPABASE_SERVICE_ROLE_KEY,
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const token = req.cookies.get(SESSION_COOKIE)?.value
    if (!token) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    const session = await verifySession(token)
    if (!['preceptor', 'directivo', 'administrador'].includes(session.role)) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
    }

    const { id, nombre } = await req.json()
    if (!id || (!nombre && nombre !== '')) return NextResponse.json({ error: 'Faltan campos' }, { status: 400 })

    const { url, anon } = keys()
    if (!url || !anon) return NextResponse.json({ error: 'Configuración de Supabase incompleta' }, { status: 500 })

    const api = `${url}/rest/v1/materias?id=eq.${id}`
    const res = await fetch(api, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json', apikey: anon, Authorization: `Bearer ${anon}`, Prefer: 'return=representation' },
      body: JSON.stringify({ nombre }),
    })
    if (!res.ok) {
      let msg = 'No se pudo actualizar la materia'
      try { const d = await res.json(); msg = d?.message || d?.error || msg } catch {}
      return NextResponse.json({ error: msg }, { status: 400 })
    }
    const data = await res.json()
    return NextResponse.json({ ok: true, subject: data?.[0] || null })
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

    const id = req.nextUrl.searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'Falta id' }, { status: 400 })

    const { url, anon } = keys()
    if (!url || !anon) return NextResponse.json({ error: 'Configuración de Supabase incompleta' }, { status: 500 })

    const api = `${url}/rest/v1/materias?id=eq.${id}`
    const res = await fetch(api, { method: 'DELETE', headers: { apikey: anon, Authorization: `Bearer ${anon}` } })
    if (!res.ok) return NextResponse.json({ error: 'No se pudo eliminar la materia' }, { status: 400 })
    return NextResponse.json({ ok: true })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Error interno' }, { status: 500 })
  }
}

export async function GET(_req: NextRequest) {
  try {
    const { url, anon } = keys()
    if (!url || !anon) return NextResponse.json({ error: 'Configuración de Supabase incompleta' }, { status: 500 })
    const api = `${url}/rest/v1/materias?select=id,nombre,created_at`
    const res = await fetch(api, { headers: { apikey: anon, Authorization: `Bearer ${anon}`, Accept: 'application/json' }, cache: 'no-store' })
    if (!res.ok) return NextResponse.json({ error: 'No se pudieron obtener materias' }, { status: 500 })
    const data = await res.json()
    return NextResponse.json({ ok: true, subjects: data })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Error interno' }, { status: 500 })
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

    const { nombre } = await req.json()
    if (!nombre) return NextResponse.json({ error: 'Falta nombre' }, { status: 400 })

    const { url, anon } = keys()
    if (!url || !anon) return NextResponse.json({ error: 'Configuración de Supabase incompleta' }, { status: 500 })

    const api = `${url}/rest/v1/materias`
    const res = await fetch(api, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json', apikey: anon, Authorization: `Bearer ${anon}`, Prefer: 'return=representation' },
      body: JSON.stringify({ nombre }),
    })
    if (!res.ok) {
      let msg = 'No se pudo crear la materia'
      try { const d = await res.json(); msg = d?.message || d?.error || msg } catch {}
      return NextResponse.json({ error: msg }, { status: 400 })
    }
    const data = await res.json()
    return NextResponse.json({ ok: true, subject: data?.[0] || null })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Error interno' }, { status: 500 })
  }
}
