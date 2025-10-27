import { NextResponse } from "next/server"

export async function GET() {
  const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
  const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY
  const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

  const env = {
    NEXT_PUBLIC_SUPABASE_URL: Boolean(SUPABASE_URL),
    SUPABASE_ANON_KEY: Boolean(SUPABASE_ANON_KEY),
    SUPABASE_SERVICE_ROLE_KEY: Boolean(SUPABASE_SERVICE_ROLE_KEY),
  }

  const result: any = { env, columns: {}, storage: {}, notes: [] }

  if (!SUPABASE_URL || !SUPABASE_ANON_KEY || !SUPABASE_SERVICE_ROLE_KEY) {
    result.notes.push("Faltan variables de entorno")
    return NextResponse.json(result, { status: 200 })
  }

  // Verificar columnas tutor_* en public.inscripciones probando un SELECT por columna
  const expected = [
    "tutor_nombres",
    "tutor_apellidos",
    "tutor_dni",
    "tutor_parentesco",
    "tutor_direccion",
    "tutor_email",
    "tutor_telefono",
    "tutor_ocupacion",
  ]
  for (const col of expected) {
    try {
      const url = `${SUPABASE_URL}/rest/v1/inscripciones?select=${encodeURIComponent(col)}&limit=1`
      const r = await fetch(url, {
        headers: {
          apikey: SUPABASE_ANON_KEY,
          Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
        },
        cache: 'no-store',
      })
      result.columns[col] = r.ok
    } catch {
      result.columns[col] = false
    }
  }
  if (Object.values(result.columns).some((v: any) => v === false)) {
    result.notes.push("Faltan columnas tutor_* en public.inscripciones")
  }

  // Verificar bucket de Storage "inscripciones"
  try {
    const listRes = await fetch(`${SUPABASE_URL}/storage/v1/object/list/inscripciones`, {
      method: "POST",
      headers: {
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ prefix: "", limit: 1, offset: 0 }),
    })
    result.storage.ok = listRes.ok
    result.storage.status = listRes.status
    if (!listRes.ok) {
      result.notes.push(`Problema con bucket 'inscripciones': HTTP ${listRes.status}`)
    }
  } catch (e: any) {
    result.notes.push(`Error consultando Storage: ${e?.message || e}`)
  }

  return NextResponse.json(result, { status: 200 })
}
