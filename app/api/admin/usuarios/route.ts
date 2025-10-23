import { NextRequest, NextResponse } from 'next/server'
import { SESSION_COOKIE, verifySession } from '@/lib/auth'

// Crea usuario en Supabase public.perfiles (contraseña en texto plano, según requisito actual)
export async function POST(req: NextRequest) {
  try {
    const token = req.cookies.get(SESSION_COOKIE)?.value
    if (!token) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

    const session = await verifySession(token)
    if (session.role !== 'administrador') {
      return NextResponse.json({ error: 'Solo administradores' }, { status: 403 })
    }

    const { nombre_completo, correo, dni, telefono, contrasena, rol } = await req.json()
    if (!nombre_completo || !correo || !dni || !contrasena || !rol) {
      return NextResponse.json({ error: 'Faltan campos requeridos' }, { status: 400 })
    }

    const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
    const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY
    const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (!SUPABASE_URL || (!SUPABASE_ANON_KEY && !SUPABASE_SERVICE_ROLE_KEY)) {
      return NextResponse.json({ error: 'Configuración de Supabase incompleta' }, { status: 500 })
    }

    // Inserción vía REST a public.perfiles
    const url = `${SUPABASE_URL}/rest/v1/perfiles`
    const body = {
      nombre_completo,
      correo,
      dni,
      telefono: telefono || null,
      contrasena,
      rol,
    }

    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        apikey: (SUPABASE_SERVICE_ROLE_KEY || SUPABASE_ANON_KEY) as string,
        Authorization: `Bearer ${(SUPABASE_SERVICE_ROLE_KEY || SUPABASE_ANON_KEY) as string}`,
        Prefer: 'return=representation',
      },
      body: JSON.stringify(body),
    })

    if (!res.ok) {
      let msg = 'No se pudo crear el usuario'
      try {
        const data = await res.json()
        msg = data?.message || data?.error || msg
        if (typeof msg === 'string' && msg.toLowerCase().includes('duplicate key')) {
          msg = 'Correo o DNI ya existen'
        }
      } catch {}
      return NextResponse.json({ error: msg }, { status: 400 })
    }

    const data = await res.json()
    return NextResponse.json({ ok: true, user: data?.[0] || null })
  } catch (e: any) {
    const message = e?.message || 'Error interno'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
