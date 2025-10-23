const SESSION_COOKIE = 'session'

export type SessionPayload = {
  id: string
  nombre: string
  correo: string
  dni: string
  role: string
}

// Helpers base64url compatibles con Edge/Node
function toBase64Url(bytes: Uint8Array): string {
  // Prefer btoa si existe
  let base64: string
  if (typeof btoa === 'function') {
    let binary = ''
    for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i])
    base64 = btoa(binary)
  } else if (typeof Buffer !== 'undefined') {
    base64 = Buffer.from(bytes).toString('base64')
  } else {
    throw new Error('No hay implementacion base64 disponible')
  }
  return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '')
}

function fromBase64Url(b64url: string): Uint8Array {
  let base64 = b64url.replace(/-/g, '+').replace(/_/g, '/')
  const pad = base64.length % 4
  if (pad) base64 += '='.repeat(4 - pad)

  if (typeof atob === 'function') {
    const binary = atob(base64)
    const bytes = new Uint8Array(binary.length)
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
    return bytes
  }
  if (typeof Buffer !== 'undefined') {
    return new Uint8Array(Buffer.from(base64, 'base64'))
  }
  throw new Error('No hay implementacion base64 disponible')
}

// Sesión sin firma: Base64URL de JSON
function encode(payload: SessionPayload): string {
  const json = JSON.stringify(payload)
  const bytes = new TextEncoder().encode(json)
  return toBase64Url(bytes)
}

function decode(token: string): SessionPayload {
  const bytes = fromBase64Url(token)
  const json = new TextDecoder().decode(bytes)
  return JSON.parse(json)
}

export async function signSession(payload: SessionPayload) {
  return encode(payload)
}

export async function verifySession(token: string) {
  return decode(token)
}

export { SESSION_COOKIE }
