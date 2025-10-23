import { NextRequest, NextResponse } from 'next/server'
import { signSession, SESSION_COOKIE } from '@/lib/auth'
import { validarCredencialesPerfil } from '@/lib/supabase'

export async function POST(req: NextRequest) {
  try {
    const { dni, password, role } = await req.json()

    if (!dni || !password) {
      return NextResponse.json({ error: 'Faltan credenciales' }, { status: 400 })
    }

    // Valida contra Supabase (RPC validar_credenciales_perfil)
    const perfil = await validarCredencialesPerfil(String(dni), String(password))

    // Si el cliente envía un role elegido (ej. 'administrador'), validar que coincida con el del perfil
    if (role && role !== perfil.rol) {
      return NextResponse.json({ error: 'Rol no autorizado para este usuario' }, { status: 403 })
    }

    const token = await signSession({
      id: perfil.id,
      nombre: perfil.nombre_completo,
      correo: perfil.correo,
      dni: String(dni),
      role: perfil.rol,
    })

    const res = NextResponse.json({ ok: true, user: { id: perfil.id, nombre: perfil.nombre_completo, rol: perfil.rol } })
    res.cookies.set(SESSION_COOKIE, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7,
    })
    return res
  } catch (e: any) {
    const message = e?.message || 'Error en el login'
    console.error('[LOGIN_ERROR]', message)
    // 401 por defecto si el RPC no encuentra usuario/contraseña
    return NextResponse.json({ error: message }, { status: 401 })
  }
}
