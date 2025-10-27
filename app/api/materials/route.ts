import { NextRequest, NextResponse } from 'next/server'
import { SESSION_COOKIE, verifySession } from '@/lib/auth'

function keys() {
  return {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL,
    anon: process.env.SUPABASE_ANON_KEY,
    service: process.env.SUPABASE_SERVICE_ROLE_KEY,
  }
}

// Helpers
async function fetchJSON(url: string, key: string) {
  const res = await fetch(url, { headers: { apikey: key, Authorization: `Bearer ${key}`, Accept: 'application/json' }, cache: 'no-store' })
  if (!res.ok) throw new Error(await res.text())
  return res.json()
}

export async function GET(req: NextRequest) {
  try {
    const token = req.cookies.get(SESSION_COOKIE)?.value
    if (!token) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    const session = await verifySession(token)

    const { url, anon, service } = keys()
    const key = (service || anon) as string
    if (!url || !key) return NextResponse.json({ error: 'Configuración de Supabase incompleta' }, { status: 500 })

    let filter = ''
    if (session.role === 'docente' || session.role === 'teacher') {
      // Get assigned materia_ids
      const mrUrl = `${url}/rest/v1/materias_responsables?docente_id=eq.${session.id}&select=materia_id`
      const mrRows: Array<{ materia_id: string }> = await fetchJSON(mrUrl, key).catch(() => [])
      const materiaIds = (mrRows || []).map((r) => r.materia_id).filter(Boolean)

      // Get assigned curso_ids
      const cdUrl = `${url}/rest/v1/cursos_docentes?docente_id=eq.${session.id}&select=curso_id`
      const cdRows: Array<{ curso_id: string }> = await fetchJSON(cdUrl, key).catch(() => [])
      const cursoIds = (cdRows || []).map((r) => r.curso_id).filter(Boolean)

      if (materiaIds.length === 0 && cursoIds.length === 0) {
        return NextResponse.json({ ok: true, materials: [] })
      }

      // Build OR filter: (materia_id IN (...) , curso_id IN (...))
      const parts: string[] = []
      if (materiaIds.length) parts.push(`materia_id.in.(${materiaIds.map((id) => `\"${id}\"`).join(',')})`)
      if (cursoIds.length) parts.push(`curso_id.in.(${cursoIds.map((id) => `\"${id}\"`).join(',')})`)
      const orExpr = encodeURIComponent(parts.map(p => p).join(','))
      filter = parts.length ? `or=(${orExpr})` : ''
    } else if (session.role === 'estudiante' || session.role === 'student') {
      // Student: only materials from their course(s) and subjects of those courses
      // url/key already defined above

      const ceUrl = `${url}/rest/v1/cursos_estudiantes?estudiante_id=eq.${session.id}&select=curso_id`
      const ceRows: Array<{ curso_id: string }> = await fetchJSON(ceUrl, key).catch(() => [])
      const cursoIds = (ceRows || []).map((r) => r.curso_id).filter(Boolean)
      if (cursoIds.length === 0) {
        return NextResponse.json({ ok: true, materials: [] })
      }

      // Subjects actually assigned to teachers for those courses
      const mdUrl = `${url}/rest/v1/materias_docentes?curso_id=in.(${cursoIds.map((id) => `"${id}"`).join(',')})&select=materia_id`
      const mdRows: Array<{ materia_id: string }> = await fetchJSON(mdUrl, key).catch(() => [])
      const materiaIds = (mdRows || []).map((r) => r.materia_id).filter(Boolean)

      const parts: string[] = []
      if (cursoIds.length) parts.push(`curso_id.in.(${cursoIds.map((id) => `"${id}"`).join(',')})`)
      if (materiaIds.length) parts.push(`materia_id.in.(${materiaIds.map((id) => `"${id}"`).join(',')})`)
      const orExpr = encodeURIComponent(parts.join(','))
      filter = parts.length ? `or=(${orExpr})` : ''
    }

    const base = `${url}/rest/v1/materiales?select=id,titulo,descripcion,tipo,file_url,file_type,size_bytes,tags,created_at,uploaded_by,materias(id,nombre),cursos(id,nombre)`
    const api = filter ? `${base}&${filter}` : base
    const rows = await fetchJSON(api, key)

    const materials = rows.map((r: any) => ({
      id: r.id,
      title: r.titulo,
      description: r.descripcion,
      subject: r.materias?.nombre || null,
      subject_id: r.materias?.id || r.materia_id || null,
      course: r.cursos?.nombre || null,
      course_id: r.cursos?.id || r.curso_id || null,
      type: r.tipo,
      file_url: r.file_url,
      file_type: r.file_type,
      size_bytes: r.size_bytes,
      tags: r.tags || [],
      uploadDate: r.created_at,
      uploadedBy: r.uploaded_by,
    }))

    return NextResponse.json({ ok: true, materials })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Error interno' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const token = req.cookies.get(SESSION_COOKIE)?.value
    if (!token) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    const session = await verifySession(token)

    const { url, anon, service } = keys()
    const key = (service || anon) as string
    if (!url || !key) return NextResponse.json({ error: 'Configuración de Supabase incompleta' }, { status: 500 })

    const body = await req.json()
    const { title, description, subject, course, materialType, tags, fileUrl, fileType, sizeBytes } = body || {}

    if (!title || !description || !materialType) return NextResponse.json({ error: 'Faltan campos obligatorios' }, { status: 400 })

    // Resolve materia_id and curso_id by name if provided
    let materia_id: string | null = null
    let curso_id: string | null = null

    if (subject) {
      const sUrl = `${url}/rest/v1/materias?nombre=eq.${encodeURIComponent(subject)}&select=id&limit=1`
      const sRows = await fetchJSON(sUrl, key).catch(() => [])
      materia_id = sRows?.[0]?.id || null
      if (!materia_id) return NextResponse.json({ error: 'Materia no encontrada' }, { status: 400 })
    }
    if (course) {
      const cUrl = `${url}/rest/v1/cursos?nombre=eq.${encodeURIComponent(course)}&select=id&limit=1`
      const cRows = await fetchJSON(cUrl, key).catch(() => [])
      curso_id = cRows?.[0]?.id || null
      if (!curso_id) return NextResponse.json({ error: 'Curso no encontrado' }, { status: 400 })
    }

    // Authorization for teachers: must be assigned to materia or curso
    if (session.role === 'docente' || session.role === 'teacher') {
      let authorized = false
      if (materia_id) {
        const checkMR = `${url}/rest/v1/materias_responsables?materia_id=eq.${materia_id}&docente_id=eq.${session.id}&select=id&limit=1`
        const mr = await fetchJSON(checkMR, key).catch(() => [])
        if (Array.isArray(mr) && mr.length > 0) authorized = true
      }
      if (!authorized && curso_id) {
        const checkCD = `${url}/rest/v1/cursos_docentes?curso_id=eq.${curso_id}&docente_id=eq.${session.id}&select=id&limit=1`
        const cd = await fetchJSON(checkCD, key).catch(() => [])
        if (Array.isArray(cd) && cd.length > 0) authorized = true
      }
      if (!authorized) return NextResponse.json({ error: 'No autorizado para esta materia/curso' }, { status: 403 })
    }

    const insertApi = `${url}/rest/v1/materiales`
    const payload: any = {
      titulo: title,
      descripcion: description,
      tipo: materialType,
      tags: tags || [],
      file_url: fileUrl || null,
      file_type: fileType || null,
      size_bytes: sizeBytes || null,
      uploaded_by: session.id,
    }
    if (materia_id) payload.materia_id = materia_id
    if (curso_id) payload.curso_id = curso_id

    const insRes = await fetch(insertApi, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json', apikey: key, Authorization: `Bearer ${key}`, Prefer: 'return=representation' },
      body: JSON.stringify(payload),
    })
    if (!insRes.ok) {
      let msg = 'No se pudo guardar el material'
      try { const d = await insRes.json(); msg = d?.message || d?.error || msg } catch {}
      return NextResponse.json({ error: msg }, { status: 400 })
    }
    const data = await insRes.json()
    return NextResponse.json({ ok: true, material: data?.[0] || null })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Error interno' }, { status: 500 })
  }
}
