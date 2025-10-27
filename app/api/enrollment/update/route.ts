import { NextRequest, NextResponse } from "next/server"

// Actualiza el estado de una inscripción y/o notas
// Body: { id: string, estado?: 'aprobada'|'rechazada'|'pendiente'|'documentacion_extra', notas?: string }
export async function POST(req: NextRequest) {
  const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
  const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY
  const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!SUPABASE_URL || !SUPABASE_ANON_KEY || !SUPABASE_SERVICE_ROLE_KEY) {
    return NextResponse.json({ error: "Faltan variables de entorno" }, { status: 500 })
  }

  const body = await req.json().catch(() => null)
  if (!body || !body.id) {
    return NextResponse.json({ error: "Falta 'id'" }, { status: 400 })
  }

  const payload: any = {}
  if (body.estado) {
    const estado = String(body.estado)
    const allowed = new Set(['completada', 'rechazada', 'pendiente'])
    if (!allowed.has(estado)) {
      return NextResponse.json({ error: "Estado inválido. Use: completada, rechazada o pendiente" }, { status: 400 })
    }
    payload.estado = estado
  }
  if (typeof body.notas === 'string') payload.notas = body.notas

  const res = await fetch(`${SUPABASE_URL}/rest/v1/inscripciones?id=eq.${encodeURIComponent(body.id)}`, {
    method: "PATCH",
    headers: {
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
      "Content-Type": "application/json",
      Prefer: "return=representation",
    },
    body: JSON.stringify(payload),
    cache: "no-store",
  })

  if (!res.ok) {
    const text = await res.text().catch(() => "")
    return NextResponse.json({ error: `Error actualizando inscripción: ${text}` }, { status: 500 })
  }

  const rows = await res.json()
  return NextResponse.json({ ok: true, item: Array.isArray(rows) ? rows[0] : rows })
}
