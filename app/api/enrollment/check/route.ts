import { NextRequest, NextResponse } from "next/server"

export async function GET(req: NextRequest) {
  const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
  const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY
  const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!SUPABASE_URL || !SUPABASE_ANON_KEY || !SUPABASE_SERVICE_ROLE_KEY) {
    return NextResponse.json({ error: "Faltan variables de entorno" }, { status: 500 })
  }

  const { searchParams } = new URL(req.url)
  const dni = (searchParams.get("dni") || "").trim()
  const email = (searchParams.get("email") || "").trim().toLowerCase()
  const tutorOnly = (searchParams.get("tutor_only") || "").toLowerCase() === 'true'

  if (!dni && !email) {
    return NextResponse.json({ error: "Debe enviar dni o email" }, { status: 400 })
  }

  // Construir query
  const params = new URLSearchParams()
  params.set('select', 'id,nombres,apellidos,dni,email,curso,estado,notas,created_at,updated_at,tutor_nombres,tutor_apellidos,tutor_email,tutor_dni')
  params.set('order', 'created_at.desc')
  if (tutorOnly) {
    // Restringir estrictamente al email del tutor
    if (!email) {
      return NextResponse.json({ error: "Se requiere email cuando tutor_only=true" }, { status: 400 })
    }
    if (dni) {
      // tutor_email debe coincidir Y dni puede coincidir con alumno o tutor
      params.set('and', `(${encodeURIComponent(`tutor_email.ilike.*${email}*`)},${encodeURIComponent(`or(dni.eq.${dni},tutor_dni.eq.${dni})`)})`)
    } else {
      params.set('tutor_email', `ilike.*${email}*`)
    }
  } else {
    // Por defecto: buscar por dni/email en alumno O tutor
    if (dni && email) {
      params.set('and', `(${encodeURIComponent(`or(dni.eq.${dni},tutor_dni.eq.${dni})`)},${encodeURIComponent(`or(email.ilike.*${email}*,tutor_email.ilike.*${email}*)`)})`)
    } else if (dni) {
      params.set('or', `dni.eq.${dni},tutor_dni.eq.${dni}`)
    } else if (email) {
      params.set('or', `email.ilike.*${email}*,tutor_email.ilike.*${email}*`)
    }
  }

  const res = await fetch(`${SUPABASE_URL}/rest/v1/inscripciones?${params.toString()}`, {
    headers: {
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
    },
    cache: "no-store",
  })

  if (!res.ok) {
    const text = await res.text().catch(() => "")
    return NextResponse.json({ error: `Error consultando inscripciones: ${text}` }, { status: 500 })
  }

  const rows = await res.json()
  return NextResponse.json({ items: Array.isArray(rows) ? rows : [] })
}
