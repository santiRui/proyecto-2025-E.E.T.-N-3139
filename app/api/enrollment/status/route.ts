import { NextRequest, NextResponse } from "next/server"

// GET: devuelve { open: boolean }
export async function GET() {
  const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
  const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    return NextResponse.json({ error: "Faltan variables de entorno" }, { status: 500 })
  }

  const res = await fetch(`${SUPABASE_URL}/rest/v1/inscripcion_config?id=eq.global&select=open`, {
    headers: {
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      "Content-Type": "application/json",
    },
    cache: "no-store",
  })

  if (!res.ok) {
    const text = await res.text().catch(() => "")
    return NextResponse.json({ error: `Error consultando estado: ${text}` }, { status: 500 })
  }

  const rows = await res.json()
  const open = Array.isArray(rows) && rows[0]?.open === true
  return NextResponse.json({ open })
}

// POST: body { open: boolean } - usa service role para upsert
export async function POST(req: NextRequest) {
  const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
  const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY
  const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY || !SUPABASE_SERVICE_ROLE_KEY) {
    return NextResponse.json({ error: "Faltan variables de entorno" }, { status: 500 })
  }

  const { open } = await req.json().catch(() => ({ open: undefined }))
  if (typeof open !== "boolean") {
    return NextResponse.json({ error: "Parámetro 'open' inválido" }, { status: 400 })
  }

  const payload = [{ id: "global", open }]

  const res = await fetch(`${SUPABASE_URL}/rest/v1/inscripcion_config`, {
    method: "POST",
    headers: {
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
      "Content-Type": "application/json",
      Prefer: "resolution=merge-duplicates",
    },
    body: JSON.stringify(payload),
    cache: "no-store",
  })

  if (!res.ok) {
    const text = await res.text().catch(() => "")
    return NextResponse.json({ error: `Error actualizando estado: ${text}` }, { status: 500 })
  }

  return NextResponse.json({ ok: true, open })
}
