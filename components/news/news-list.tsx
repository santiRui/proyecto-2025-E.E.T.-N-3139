"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Newspaper, Calendar, User, ChevronRight, ImageOff } from "lucide-react"

type NewsItem = {
  id: string
  title: string
  content: string
  category: string
  priority: "high" | "medium" | "low"
  tags: string[]
  image_url?: string | null
  target_all_courses: boolean
  target_course_ids?: string[]
  author_role?: string | null
  created_at: string
}

export function NewsList({ refreshKey }: { refreshKey?: number }) {
  const [items, setItems] = useState<NewsItem[]>([])
  const [loading, setLoading] = useState(true)
  const [canManage, setCanManage] = useState(false)

  useEffect(() => {
    try {
      const raw = localStorage.getItem('user')
      if (!raw) { setCanManage(false); return }
      const u = JSON.parse(raw)
      const roleRaw = String(u.role || '').toLowerCase()
      const dbRoleRaw = String(u.dbRole || '').toLowerCase()
      const tokens = new Set([...
        roleRaw.split(/[\s,/|]+/).filter(Boolean),
        ...dbRoleRaw.split(/[\s,/|]+/).filter(Boolean),
      ])
      setCanManage(tokens.has('preceptor') || tokens.has('admin') || tokens.has('administrador') || tokens.has('directivo'))
    } catch { setCanManage(false) }
  }, [])

  const fetchNews = async () => {
    const res = await fetch('/api/news', { cache: 'no-store' })
    if (!res.ok) throw new Error('No se pudieron obtener noticias')
    const data = await res.json()
    const list = Array.isArray(data?.news) ? data.news : []
    setItems(list)
  }

  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        if (mounted) await fetchNews()
      } catch {
        if (mounted) setItems([])
      } finally {
        if (mounted) setLoading(false)
      }
    })()
    return () => { mounted = false }
  }, [refreshKey])

  const handleDelete = async (id: string) => {
    if (!confirm('¿Eliminar esta noticia?')) return
    const res = await fetch(`/api/news?id=${encodeURIComponent(id)}`, { method: 'DELETE' })
    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      alert(err?.error || 'No se pudo eliminar la noticia')
      return
    }
    await fetchNews()
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "bg-red-100 text-red-800"
      case "medium":
        return "bg-yellow-100 text-yellow-800"
      case "low":
        return "bg-green-100 text-green-800"
      default:
        return "bg-muted text-muted-foreground"
    }
  }

  const getPriorityLabel = (priority: string) => {
    switch (priority) {
      case "high":
        return "Urgente"
      case "medium":
        return "Importante"
      case "low":
        return "Informativo"
      default:
        return priority
    }
  }

  const getCategoryColor = (category: string) => {
    const colors = {
      Institucional: "bg-primary text-primary-foreground",
      Reunión: "bg-blue-100 text-blue-800",
      Actividades: "bg-purple-100 text-purple-800",
      Seguridad: "bg-orange-100 text-orange-800",
      Eventos: "bg-teal-100 text-teal-800",
    }
    return colors[category as keyof typeof colors] || "bg-muted text-muted-foreground"
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("es-ES", {
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }

  return (
    <div className="space-y-4">
      {items.map((news) => (
        <Card key={news.id} className="hover:shadow-md transition-shadow">
          <CardHeader>
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <Badge className={getPriorityColor(news.priority)}>{getPriorityLabel(news.priority)}</Badge>
                  <Badge className={getCategoryColor(news.category)}>{news.category}</Badge>
                  {news.target_all_courses ? (
                    <Badge variant="secondary">Todos los cursos</Badge>
                  ) : (
                    <Badge variant="outline">Cursos específicos</Badge>
                  )}
                </div>
                <CardTitle className="text-lg text-balance">{news.title}</CardTitle>
              </div>
              <div className="flex items-center gap-2">
                {canManage && (
                  <>
                    <Button variant="outline" size="sm">
                      Editar
                    </Button>
                    <Button variant="destructive" size="sm" onClick={() => handleDelete(news.id)}>
                      Eliminar
                    </Button>
                  </>
                )}
                <Button variant="ghost" size="sm">
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </CardHeader>

          <CardContent>
            {news.image_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={news.image_url} alt="Noticia" className="mb-3 max-h-56 rounded-md border object-cover w-full" />
            ) : (
              <div className="mb-3 flex items-center gap-2 text-sm text-muted-foreground"><ImageOff className="w-4 h-4" /> Sin imagen</div>
            )}
            <p className="text-muted-foreground text-pretty mb-4 leading-relaxed">{news.content}</p>

            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  <span>{formatDate(news.created_at)}</span>
                </div>
                <div className="flex items-center gap-1">
                  <User className="w-4 h-4" />
                  <span>{news.author_role || 'Autor'}</span>
                </div>
              </div>
              <Button variant="outline" size="sm">
                Leer más
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}

      {(items.length === 0 && !loading) && (
        <Card>
          <CardContent className="text-center py-12">
            <Newspaper className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No hay noticias disponibles</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
