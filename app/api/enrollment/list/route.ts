import { NextRequest, NextResponse } from "next/server"

export async function GET(req: NextRequest) {
  const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
  const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY
  const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!SUPABASE_URL || !SUPABASE_ANON_KEY || !SUPABASE_SERVICE_ROLE_KEY) {
    return NextResponse.json({ error: "Faltan variables de entorno" }, { status: 500 })
  }

  const { searchParams } = new URL(req.url)
  const q = (searchParams.get("q") || "").trim()
  const estado = (searchParams.get("estado") || "").trim()
  const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10))
  const limit = Math.min(50, Math.max(5, parseInt(searchParams.get("limit") || "10", 10)))
  const offset = (page - 1) * limit

  const params = new URLSearchParams()
  params.set("select", "id,nombres,apellidos,dni,email,curso,estado,notas,created_at,updated_at")
  params.set("order", "created_at.desc")
  if (estado) params.set("estado", `eq.${estado}`)
  if (q) {
    // Buscar por DNI exacto o nombre/apellido ilike
    const safe = q.replace(/\s+/g, " ").trim()
    params.set(
      "or",
      `dni.eq.${encodeURIComponent(safe)},nombres.ilike.*${encodeURIComponent(safe)}*,apellidos.ilike.*${encodeURIComponent(safe)}*`
    )
  }
  params.set("limit", String(limit))
  params.set("offset", String(offset))

  const res = await fetch(`${SUPABASE_URL}/rest/v1/inscripciones?${params.toString()}`, {
    headers: {
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
      "Content-Type": "application/json",
      Prefer: "count=exact",
    },
    cache: "no-store",
  })

  const total = parseInt(res.headers.get("content-range")?.split("/")[1] || "0", 10)

  if (!res.ok) {
    const text = await res.text().catch(() => "")
    return NextResponse.json({ error: `Error listando inscripciones: ${text}` }, { status: 500 })
  }

  const rows = await res.json()
  return NextResponse.json({ items: Array.isArray(rows) ? rows : [], page, limit, total })
}
