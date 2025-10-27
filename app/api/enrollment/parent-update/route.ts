export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
    const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY
    const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (!SUPABASE_URL || !SUPABASE_ANON_KEY || !SUPABASE_SERVICE_ROLE_KEY) {
      return NextResponse.json({ error: 'Faltan variables de entorno' }, { status: 500 })
    }

    const form = await req.formData()
    const id = String(form.get('id') || '')
    const tutorEmail = String(form.get('tutor_email') || '').toLowerCase()
    const message = String(form.get('message') || '')

    const libreta = form.get('libreta') as File | null
    const photo = form.get('photo') as File | null
    const birthCertificate = form.get('birthCertificate') as File | null
    const dniCopy = form.get('dniCopy') as File | null

    if (!id || !tutorEmail) {
      return NextResponse.json({ error: 'Faltan parámetros' }, { status: 400 })
    }

    // Obtener inscripción
    const getRes = await fetch(`${SUPABASE_URL}/rest/v1/inscripciones?id=eq.${encodeURIComponent(id)}&select=id,dni,estado,tutor_email`, {
      headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}` },
      cache: 'no-store',
    })
    if (!getRes.ok) {
      const text = await getRes.text().catch(() => '')
      return NextResponse.json({ error: `Error obteniendo inscripción: ${text}` }, { status: 500 })
    }
    const rows = await getRes.json()
    const item = Array.isArray(rows) ? rows[0] : rows
    if (!item) return NextResponse.json({ error: 'Inscripción no encontrada' }, { status: 404 })

    if (String(item.tutor_email || '').toLowerCase() !== tutorEmail) {
      return NextResponse.json({ error: 'No autorizado para editar esta inscripción' }, { status: 403 })
    }
    if (String(item.estado) !== 'pendiente') {
      return NextResponse.json({ error: 'Solo puede editar inscripciones en estado pendiente' }, { status: 400 })
    }

    // Subir archivos opcionales al mismo prefijo DNI/
    const bucket = 'inscripciones'
    const prefix = `${item.dni}/`
    const ts = Date.now()
    const uploadOne = async (key: string, f: File | null, tag: string) => {
      if (!f) return null
      const ext = f.name.split('.').pop() || 'bin'
      const objectPath = `${prefix}${id}_${tag}_${ts}.${ext}`
      const arrayBuffer = await f.arrayBuffer()
      const putRes = await fetch(`${SUPABASE_URL}/storage/v1/object/${bucket}/${objectPath}`, {
        method: 'POST',
        headers: {
          apikey: SUPABASE_ANON_KEY,
          Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
          'x-upsert': 'true',
          'Content-Type': f.type || 'application/octet-stream',
        },
        body: Buffer.from(arrayBuffer),
      })
      if (!putRes.ok) {
        const text = await putRes.text().catch(() => '')
        throw new Error(`Error subiendo ${key}: ${text}`)
      }
      return `${SUPABASE_URL}/storage/v1/object/public/${bucket}/${objectPath}`
    }

    try {
      await uploadOne('libreta', libreta, 'libreta')
      await uploadOne('photo', photo, 'photo')
      await uploadOne('birthCertificate', birthCertificate, 'birthcertificate')
      await uploadOne('dniCopy', dniCopy, 'dnicopy')
    } catch (e: any) {
      return NextResponse.json({ error: e?.message || 'Error subiendo archivos' }, { status: 500 })
    }

    // Actualizar notas y estado -> vuelve a revision
    const payload: any = { estado: 'sin_revisar' }
    if (typeof message === 'string') payload.notas = message

    const patch = await fetch(`${SUPABASE_URL}/rest/v1/inscripciones?id=eq.${encodeURIComponent(id)}`, {
      method: 'PATCH',
      headers: {
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
        'Content-Type': 'application/json',
        Prefer: 'return=representation',
      },
      body: JSON.stringify(payload),
    })
    if (!patch.ok) {
      const text = await patch.text().catch(() => '')
      return NextResponse.json({ error: `Error actualizando inscripción: ${text}` }, { status: 500 })
    }

    const updated = await patch.json()
    return NextResponse.json({ ok: true, item: Array.isArray(updated) ? updated[0] : updated })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Error inesperado' }, { status: 500 })
  }
}
