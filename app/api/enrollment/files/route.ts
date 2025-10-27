import { NextRequest, NextResponse } from "next/server"

// Lista archivos en el bucket 'inscripciones' con prefijo = DNI/
export async function GET(req: NextRequest) {
  const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
  const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY
  const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!SUPABASE_URL || !SUPABASE_ANON_KEY || !SUPABASE_SERVICE_ROLE_KEY) {
    return NextResponse.json({ error: "Faltan variables de entorno" }, { status: 500 })
  }

  const { searchParams } = new URL(req.url)
  const dni = (searchParams.get("dni") || "").trim()
  if (!dni) return NextResponse.json({ error: "Falta parámetro dni" }, { status: 400 })

  const bucket = 'inscripciones'

  const res = await fetch(`${SUPABASE_URL}/storage/v1/object/list/${bucket}`, {
    method: 'POST',
    headers: {
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ prefix: `${dni}/`, limit: 100, offset: 0, sortBy: { column: 'name', order: 'asc' } }),
  })

  if (!res.ok) {
    const text = await res.text().catch(() => "")
    return NextResponse.json({ error: `Error listando archivos: ${text}` }, { status: 500 })
  }

  const items = await res.json().catch(() => [])

  const files = (Array.isArray(items) ? items : []).map((it: any) => {
    const path = `${dni}/${it.name}`
    const lower = String(it.name || '').toLowerCase()
    let kind: 'libreta' | 'foto' | 'partida' | 'dni' | 'otro' = 'otro'
    if (lower.includes('_libreta_')) kind = 'libreta'
    else if (lower.includes('_photo_')) kind = 'foto'
    else if (lower.includes('_birthcertificate_')) kind = 'partida'
    else if (lower.includes('_dnicopy_')) kind = 'dni'
    return {
      name: it.name,
      path,
      kind,
      size: it.metadata?.size ?? null,
      last_modified: it.updated_at ?? null,
      public_url: `${SUPABASE_URL}/storage/v1/object/public/${bucket}/${path}`,
    }
  })

  const grouped = {
    libreta: files.find(f => f.kind === 'libreta') || null,
    foto: files.find(f => f.kind === 'foto') || null,
    partida: files.find(f => f.kind === 'partida') || null,
    dni: files.find(f => f.kind === 'dni') || null,
    otros: files.filter(f => f.kind === 'otro'),
  }

  return NextResponse.json({ files, grouped })
}
