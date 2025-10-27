import { NextRequest, NextResponse } from 'next/server'
import { SESSION_COOKIE, verifySession } from '@/lib/auth'

function keys() {
  return {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL,
    anon: process.env.SUPABASE_ANON_KEY,
  }
}

// POST multipart/form-data with field 'file'. Optional query param folder.
export async function POST(req: NextRequest) {
  try {
    const token = req.cookies.get(SESSION_COOKIE)?.value
    if (!token) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    const session = await verifySession(token)
    if (!['teacher', 'docente', 'preceptor', 'directivo', 'administrador', 'admin'].includes(session.role)) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
    }

    const form = await req.formData()
    const file = form.get('file') as File | null
    if (!file) return NextResponse.json({ error: 'Falta archivo' }, { status: 400 })

    const folder = (req.nextUrl.searchParams.get('folder') || 'uploads').replace(/[^a-zA-Z0-9_\/-]/g, '')
    const ext = file.name.split('.').pop() || 'bin'
    const safeName = `${crypto.randomUUID()}.${ext}`
    const path = `${folder}/${safeName}`

    const { url, anon } = keys()
    const key = anon
    if (!url) return NextResponse.json({ error: 'Falta NEXT_PUBLIC_SUPABASE_URL' }, { status: 500 })
    if (!key) return NextResponse.json({ error: 'Falta SUPABASE_ANON_KEY' }, { status: 500 })

    const storageUrl = `${url}/storage/v1/object/materiales/${encodeURIComponent(path)}`
    let res = await fetch(storageUrl, {
      method: 'POST',
      headers: {
        apikey: key,
        Authorization: `Bearer ${key}`,
        'x-upsert': 'true',
        'Content-Type': file.type || 'application/octet-stream',
      },
      body: Buffer.from(await file.arrayBuffer()),
      cache: 'no-store',
    })
    if (!res.ok) {
      let msg = 'No se pudo subir el archivo'
      try {
        const d = await res.json();
        msg = d?.message || d?.error || msg
      } catch {
        try { msg = await res.text() } catch {}
      }
      if (/Not\s+Found|bucket/i.test(msg)) {
        msg = 'Bucket "materiales" no encontrado o sin permisos de escritura para ANON. Crea el bucket y habilita políticas de insert.'
      } else if (/Unauthorized|permission/i.test(msg)) {
        msg = 'Permisos insuficientes en Storage. Habilita una política de INSERT para el bucket "materiales" para usuarios autenticados o anon.'
      }
      return NextResponse.json({ error: msg }, { status: 400 })
    }

    const publicUrl = `${url}/storage/v1/object/public/materiales/${path}`
    return NextResponse.json({ ok: true, url: publicUrl, path, type: file.type, size: file.size, name: file.name })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Error interno' }, { status: 500 })
  }
}
