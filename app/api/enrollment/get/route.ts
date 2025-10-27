import { NextRequest, NextResponse } from "next/server"

export async function GET(req: NextRequest) {
  const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
  const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY
  const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!SUPABASE_URL || !SUPABASE_ANON_KEY || !SUPABASE_SERVICE_ROLE_KEY) {
    return NextResponse.json({ error: "Faltan variables de entorno" }, { status: 500 })
  }

  const { searchParams } = new URL(req.url)
  const id = (searchParams.get("id") || "").trim()
  if (!id) return NextResponse.json({ error: "Falta parámetro id" }, { status: 400 })

  const res = await fetch(`${SUPABASE_URL}/rest/v1/inscripciones?id=eq.${encodeURIComponent(id)}&select=*`, {
    headers: {
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
    },
    cache: "no-store",
  })

  if (!res.ok) {
    const text = await res.text().catch(() => "")
    return NextResponse.json({ error: `Error obteniendo inscripción: ${text}` }, { status: 500 })
  }
  const rows = await res.json()
  const item = Array.isArray(rows) ? rows[0] : rows
  if (!item) return NextResponse.json({ error: "No encontrada" }, { status: 404 })

  return NextResponse.json({ item })
}
