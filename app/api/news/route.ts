import { NextRequest, NextResponse } from 'next/server'
import { SESSION_COOKIE, verifySession } from '@/lib/auth'

function keys() {
  return {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL,
    anon: process.env.SUPABASE_ANON_KEY,
    service: process.env.SUPABASE_SERVICE_ROLE_KEY,
  }
}

export async function PUT(req: NextRequest) {
  try {
    const token = req.cookies.get(SESSION_COOKIE)?.value
    if (!token) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    const session = await verifySession(token)
    if (!['preceptor', 'directivo', 'administrador', 'admin'].includes(session.role)) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
    }

    const urlId = new URL(req.url).searchParams.get('id')
    const body = await req.json().catch(() => ({}))
    const id = String(body?.id || urlId || '')
    if (!id) return NextResponse.json({ error: 'Falta id' }, { status: 400 })

    const {
      title,
      content,
      category,
      priority,
      tags = [],
      imageUrl,
      targetAllCourses,
      targetCourseIds = [],
    } = body || {}

    if (!title || !content || !category || !priority) {
      return NextResponse.json({ error: 'Faltan campos obligatorios' }, { status: 400 })
    }
    if (!targetAllCourses && (!Array.isArray(targetCourseIds) || targetCourseIds.length === 0)) {
      return NextResponse.json({ error: 'Debe seleccionar cursos o marcar Todos los cursos' }, { status: 400 })
    }

    const { url, anon, service } = keys()
    const key = service || anon
    if (!url || !key) return NextResponse.json({ error: 'Configuración de Supabase incompleta' }, { status: 500 })

    const updateApi = `${url}/rest/v1/news?id=eq.${encodeURIComponent(id)}`
    const updateBody = {
      title,
      content,
      category,
      priority,
      tags,
      image_url: imageUrl || null,
      target_all_courses: Boolean(targetAllCourses),
      author_id: session.id,
      author_role: session.role,
      updated_at: new Date().toISOString(),
    }

    const upd = await fetch(updateApi, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json', apikey: key, Authorization: `Bearer ${key}`, Prefer: 'return=representation' },
      body: JSON.stringify(updateBody),
    })
    if (!upd.ok) {
      let msg = 'No se pudo actualizar la noticia'
      try { const d = await upd.json(); msg = d?.message || d?.error || msg } catch {}
      return NextResponse.json({ error: msg }, { status: 400 })
    }
    const updatedArr = await upd.json()
    const updated = updatedArr?.[0]
    if (!updated?.id) return NextResponse.json({ error: 'Noticia no encontrada' }, { status: 404 })

    const relApi = `${url}/rest/v1/news_courses`
    const relDel = await fetch(`${relApi}?news_id=eq.${encodeURIComponent(id)}`, { method: 'DELETE', headers: { apikey: key, Authorization: `Bearer ${key}` } })
    if (!relDel.ok) {
      let msg = 'No se pudieron actualizar relaciones de cursos (eliminación)'
      try { const d = await relDel.json(); msg = d?.message || d?.error || msg } catch {}
      return NextResponse.json({ error: msg }, { status: 400 })
    }

    if (!Boolean(targetAllCourses) && Array.isArray(targetCourseIds) && targetCourseIds.length > 0) {
      const rows = targetCourseIds.map((cid: string) => ({ news_id: id, course_id: cid }))
      const relIns = await fetch(relApi, { method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json', apikey: key, Authorization: `Bearer ${key}` }, body: JSON.stringify(rows) })
      if (!relIns.ok) {
        let msg = 'No se pudieron asociar cursos a la noticia'
        try { const d = await relIns.json(); msg = d?.message || d?.error || msg } catch {}
        return NextResponse.json({ error: msg }, { status: 400 })
      }
    }

    return NextResponse.json({ ok: true, news: { ...updated } })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Error interno' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const token = req.cookies.get(SESSION_COOKIE)?.value
    if (!token) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    const session = await verifySession(token)
    if (!['preceptor', 'directivo', 'administrador', 'admin'].includes(session.role)) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
    }

    const id = new URL(req.url).searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'Falta id' }, { status: 400 })

    const { url, anon, service } = keys()
    const key = service || anon
    if (!url || !key) return NextResponse.json({ error: 'Configuración de Supabase incompleta' }, { status: 500 })

    const relApi = `${url}/rest/v1/news_courses?news_id=eq.${encodeURIComponent(id)}`
    const relDel = await fetch(relApi, { method: 'DELETE', headers: { apikey: key, Authorization: `Bearer ${key}` } })
    if (!relDel.ok) {
      let msg = 'No se pudieron eliminar relaciones de cursos'
      try { const d = await relDel.json(); msg = d?.message || d?.error || msg } catch {}
      return NextResponse.json({ error: msg }, { status: 400 })
    }

    const delApi = `${url}/rest/v1/news?id=eq.${encodeURIComponent(id)}`
    const del = await fetch(delApi, { method: 'DELETE', headers: { apikey: key, Authorization: `Bearer ${key}` } })
    if (!del.ok) {
      let msg = 'No se pudo eliminar la noticia'
      try { const d = await del.json(); msg = d?.message || d?.error || msg } catch {}
      return NextResponse.json({ error: msg }, { status: 400 })
    }

    return NextResponse.json({ ok: true })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Error interno' }, { status: 500 })
  }
}
export async function GET(req: NextRequest) {
  try {
    // Lectura pública: no exigimos sesión, usamos service role si está para evitar bloqueos por RLS
    const { url, anon, service } = keys()
    const key = service || anon
    if (!url || !key) return NextResponse.json({ error: 'Configuración de Supabase incompleta' }, { status: 500 })

    const newsApi = `${url}/rest/v1/news?select=id,title,content,category,priority,tags,image_url,target_all_courses,author_id,author_role,created_at,updated_at&order=created_at.desc`
    const newsRes = await fetch(newsApi, { headers: { apikey: key, Authorization: `Bearer ${key}`, Accept: 'application/json' }, cache: 'no-store' })
    if (!newsRes.ok) return NextResponse.json({ error: 'No se pudieron obtener noticias' }, { status: 500 })
    const news = await newsRes.json()

    const ids = (news as Array<any>).map(n => n.id).filter(Boolean)
    if (ids.length === 0) return NextResponse.json({ ok: true, news: [] })

    const inList = ids.map((id: string) => `"${id}"`).join(',')
    const relApi = `${url}/rest/v1/news_courses?select=news_id,course_id&news_id=in.(${inList})`
    const relRes = await fetch(relApi, { headers: { apikey: key, Authorization: `Bearer ${key}`, Accept: 'application/json' }, cache: 'no-store' })
    const rels: Array<{ news_id: string, course_id: string }> = relRes.ok ? await relRes.json() : []

    const byNews: Record<string, string[]> = {}
    for (const r of rels) {
      if (!byNews[r.news_id]) byNews[r.news_id] = []
      byNews[r.news_id].push(r.course_id)
    }

    const merged = (news as Array<any>).map(n => ({ ...n, target_course_ids: n.target_all_courses ? [] : (byNews[n.id] || []) }))
    return NextResponse.json({ ok: true, news: merged })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Error interno' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const token = req.cookies.get(SESSION_COOKIE)?.value
    if (!token) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    const session = await verifySession(token)
    if (!['preceptor', 'directivo', 'administrador', 'admin'].includes(session.role)) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
    }

    const body = await req.json()
    const {
      title,
      content,
      category,
      priority,
      tags = [],
      imageUrl,
      targetAllCourses,
      targetCourseIds = [],
    } = body || {}

    if (!title || !content || !category || !priority) {
      return NextResponse.json({ error: 'Faltan campos obligatorios' }, { status: 400 })
    }
    if (!targetAllCourses && (!Array.isArray(targetCourseIds) || targetCourseIds.length === 0)) {
      return NextResponse.json({ error: 'Debe seleccionar cursos o marcar Todos los cursos' }, { status: 400 })
    }

    const { url, anon, service } = keys()
    const key = service || anon
    if (!url || !key) return NextResponse.json({ error: 'Configuración de Supabase incompleta' }, { status: 500 })

    const insertNewsApi = `${url}/rest/v1/news`
    const insertBody = {
      title,
      content,
      category,
      priority,
      tags,
      image_url: imageUrl || null,
      target_all_courses: Boolean(targetAllCourses),
      author_id: session.id,
      author_role: session.role,
    }

    const ins = await fetch(insertNewsApi, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json', apikey: key, Authorization: `Bearer ${key}`, Prefer: 'return=representation' },
      body: JSON.stringify(insertBody),
    })
    if (!ins.ok) {
      let msg = 'No se pudo crear la noticia'
      try { const d = await ins.json(); msg = d?.message || d?.error || msg } catch {}
      return NextResponse.json({ error: msg }, { status: 400 })
    }
    const createdArr = await ins.json()
    const created = createdArr?.[0]
    if (!created?.id) return NextResponse.json({ error: 'Noticia creada sin id' }, { status: 500 })

    if (!Boolean(targetAllCourses) && Array.isArray(targetCourseIds) && targetCourseIds.length > 0) {
      const rows = targetCourseIds.map((cid: string) => ({ news_id: created.id, course_id: cid }))
      const relApi = `${url}/rest/v1/news_courses`
      const relRes = await fetch(relApi, { method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json', apikey: key, Authorization: `Bearer ${key}` }, body: JSON.stringify(rows) })
      if (!relRes.ok) {
        let msg = 'No se pudieron asociar cursos a la noticia'
        try { const d = await relRes.json(); msg = d?.message || d?.error || msg } catch {}
        return NextResponse.json({ error: msg }, { status: 400 })
      }
    }

    return NextResponse.json({ ok: true, news: created })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Error interno' }, { status: 500 })
  }
}
