type PerfilRPC = {
  id: string
  nombre_completo: string
  rol: string
  correo: string
}

export async function validarCredencialesPerfil(dni: string, contrasena: string) {
  const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
  const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY
  if (!SUPABASE_URL) throw new Error('Falta variable de entorno NEXT_PUBLIC_SUPABASE_URL')
  if (!SUPABASE_ANON_KEY) throw new Error('Falta variable de entorno SUPABASE_ANON_KEY')

  const url = `${SUPABASE_URL}/rest/v1/rpc/validar_credenciales_perfil`
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'Prefer': 'params=single-object',
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
    },
    body: JSON.stringify({ p_dni: dni, p_contrasena: contrasena }),
    // Next.js: no cache for auth endpoints
    cache: 'no-store',
  })

  if (!res.ok) {
    let message = 'Credenciales inválidas'
    try {
      const data = await res.json()
      message = data?.message || data?.error || message
    } catch {
      const text = await res.text().catch(() => '')
      if (text) message = text
    }
    throw new Error(message)
  }

  const data: PerfilRPC[] = await res.json()
  if (!Array.isArray(data) || data.length === 0) {
    throw new Error('Credenciales inválidas')
  }
  const perfil = data[0]
  return perfil
}
