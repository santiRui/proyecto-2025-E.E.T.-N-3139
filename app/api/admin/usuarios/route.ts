import { NextRequest, NextResponse } from 'next/server'
import { SESSION_COOKIE, verifySession } from '@/lib/auth'

class HttpError extends Error {
  status: number

  constructor(status: number, message: string) {
    super(message)
    this.status = status
  }
}

async function requireAdmin(req: NextRequest) {
  const token = req.cookies.get(SESSION_COOKIE)?.value
  if (!token) {
    throw new HttpError(401, 'No autenticado')
  }

  const session = await verifySession(token)
  if (session.role !== 'administrador') {
    throw new HttpError(403, 'Solo administradores')
  }

  return session
}

function getSupabaseConfig() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY

  if (!url || !key) {
    throw new HttpError(500, 'Configuración de Supabase incompleta')
  }

  return { url, key }
}

export async function GET(req: NextRequest) {
  try {
    await requireAdmin(req)
    const { url: supabaseUrl, key } = getSupabaseConfig()

    const searchParams = req.nextUrl.searchParams
    const search = (searchParams.get('search') || '').trim()
    const roleFilter = (searchParams.get('rol') || '').trim()

    let url = `${supabaseUrl}/rest/v1/perfiles?select=id,nombre_completo,correo,dni,telefono,rol&order=nombre_completo.asc`

    if (search) {
      const encoded = encodeURIComponent(`nombre_completo.ilike.*${search}*,correo.ilike.*${search}*,dni.ilike.*${search}*`)
      url += `&or=(${encoded})`
    }

    if (roleFilter) {
      url += `&rol=eq.${encodeURIComponent(roleFilter)}`
    }

    const res = await fetch(url, {
      headers: {
        apikey: key,
        Authorization: `Bearer ${key}`,
        Accept: 'application/json',
      },
      cache: 'no-store',
    })

    if (!res.ok) {
      let msg = 'No se pudieron obtener los usuarios'
      try {
        const data = await res.json()
        msg = data?.message || data?.error || msg
      } catch {}
      throw new HttpError(res.status || 500, msg)
    }

    const data = await res.json()
    return NextResponse.json({ ok: true, users: data })
  } catch (e: any) {
    if (e instanceof HttpError) {
      return NextResponse.json({ error: e.message }, { status: e.status })
    }
    const message = e?.message || 'Error interno'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

// Crea usuario en Supabase public.perfiles (contraseña en texto plano, según requisito actual)
export async function POST(req: NextRequest) {
  try {
    await requireAdmin(req)
    const { url: supabaseUrl, key } = getSupabaseConfig()

    const { nombre_completo, correo, dni, telefono, contrasena, rol } = await req.json()
    if (!nombre_completo || !correo || !dni || !contrasena || !rol) {
      throw new HttpError(400, 'Faltan campos requeridos')
    }

    const body = {
      nombre_completo,
      correo,
      dni,
      telefono: telefono || null,
      contrasena,
      rol,
    }

    const res = await fetch(`${supabaseUrl}/rest/v1/perfiles`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        apikey: key,
        Authorization: `Bearer ${key}`,
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
      throw new HttpError(400, msg)
    }

    const data = await res.json().catch(() => null)
    return NextResponse.json({ ok: true, user: data?.[0] || null })
  } catch (e: any) {
    if (e instanceof HttpError) {
      return NextResponse.json({ error: e.message }, { status: e.status })
    }
    const message = e?.message || 'Error interno'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  try {
    await requireAdmin(req)
    const { url: supabaseUrl, key } = getSupabaseConfig()

    const payload = await req.json()
    const { id, ...updates } = payload || {}

    if (!id) {
      throw new HttpError(400, 'Falta id del usuario')
    }

    const allowedFields = ['nombre_completo', 'correo', 'dni', 'telefono', 'contrasena', 'rol'] as const
    const body: Record<string, any> = {}

    for (const field of allowedFields) {
      if (Object.prototype.hasOwnProperty.call(updates, field)) {
        const value = updates[field]

        if (field === 'telefono') {
          body[field] = value ? value : null
          continue
        }

        if (field === 'contrasena') {
          if (!value) {
            continue
          }
          body[field] = value
          continue
        }

        if (value !== undefined) {
          body[field] = value
        }
      }
    }

    if (!Object.keys(body).length) {
      throw new HttpError(400, 'No hay cambios para actualizar')
    }

    const res = await fetch(`${supabaseUrl}/rest/v1/perfiles?id=eq.${encodeURIComponent(String(id))}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        apikey: key,
        Authorization: `Bearer ${key}`,
        Prefer: 'return=representation',
      },
      body: JSON.stringify(body),
    })

    if (!res.ok) {
      let msg = 'No se pudo actualizar el usuario'
      try {
        const data = await res.json()
        msg = data?.message || data?.error || msg
      } catch {}
      throw new HttpError(400, msg)
    }

    const data = await res.json().catch(() => null)
    return NextResponse.json({ ok: true, user: data?.[0] || null })
  } catch (e: any) {
    if (e instanceof HttpError) {
      return NextResponse.json({ error: e.message }, { status: e.status })
    }
    const message = e?.message || 'Error interno'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await requireAdmin(req)
    const { url: supabaseUrl, key } = getSupabaseConfig()

    const id = req.nextUrl.searchParams.get('id')
    if (!id) {
      throw new HttpError(400, 'Falta id del usuario')
    }

    if (session.id === id) {
      throw new HttpError(400, 'No puedes eliminar tu propia cuenta')
    }

    const res = await fetch(`${supabaseUrl}/rest/v1/perfiles?id=eq.${encodeURIComponent(id)}`, {
      method: 'DELETE',
      headers: {
        apikey: key,
        Authorization: `Bearer ${key}`,
        Accept: 'application/json',
        Prefer: 'return=representation',
      },
    })

    if (!res.ok) {
      let msg = 'No se pudo eliminar el usuario'
      try {
        const data = await res.json()
        msg = data?.message || data?.error || msg
      } catch {}
      throw new HttpError(400, msg)
    }

    return NextResponse.json({ ok: true })
  } catch (e: any) {
    if (e instanceof HttpError) {
      return NextResponse.json({ error: e.message }, { status: e.status })
    }
    const message = e?.message || 'Error interno'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
