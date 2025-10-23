"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Newspaper, Calendar, User, ChevronRight } from "lucide-react"

const mockNews = [
  {
    id: 1,
    title: "Inicio del Ciclo Lectivo 2025",
    content:
      "Informamos a toda la comunidad educativa que el ciclo lectivo 2025 comenzará el lunes 4 de marzo. Se solicita a los estudiantes presentarse con el uniforme completo y los materiales solicitados.",
    date: "2025-01-20",
    author: "Dirección",
    category: "Institucional",
    priority: "high",
  },
  {
    id: 2,
    title: "Reunión de Padres - Febrero 2025",
    content:
      "Se convoca a los padres y tutores a la reunión informativa que se realizará el viernes 28 de febrero a las 18:00 hs en el salón de actos. Se tratarán temas importantes sobre el nuevo año lectivo.",
    date: "2025-01-18",
    author: "Secretaría Académica",
    category: "Reunión",
    priority: "medium",
  },
  {
    id: 3,
    title: "Inscripciones Abiertas para Talleres Extracurriculares",
    content:
      "Ya están abiertas las inscripciones para los talleres de robótica, teatro, música y deportes. Los interesados pueden inscribirse en secretaría hasta el 15 de marzo.",
    date: "2025-01-15",
    author: "Coordinación de Talleres",
    category: "Actividades",
    priority: "low",
  },
  {
    id: 4,
    title: "Protocolo de Seguridad Actualizado",
    content:
      "Se ha actualizado el protocolo de seguridad de la institución. Todos los miembros de la comunidad educativa deben tomar conocimiento de las nuevas medidas implementadas.",
    date: "2025-01-12",
    author: "Dirección",
    category: "Seguridad",
    priority: "high",
  },
  {
    id: 5,
    title: "Acto del 25 de Mayo - Preparativos",
    content:
      "Comenzamos con los preparativos para el acto del 25 de Mayo. Los estudiantes interesados en participar pueden anotarse con sus preceptores hasta el 20 de abril.",
    date: "2025-01-10",
    author: "Coordinación de Actos",
    category: "Eventos",
    priority: "medium",
  },
]

export function NewsList() {
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
      {mockNews.map((news) => (
        <Card key={news.id} className="hover:shadow-md transition-shadow">
          <CardHeader>
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <Badge className={getPriorityColor(news.priority)}>{getPriorityLabel(news.priority)}</Badge>
                  <Badge className={getCategoryColor(news.category)}>{news.category}</Badge>
                </div>
                <CardTitle className="text-lg text-balance">{news.title}</CardTitle>
              </div>
              <Button variant="ghost" size="sm">
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </CardHeader>

          <CardContent>
            <p className="text-muted-foreground text-pretty mb-4 leading-relaxed">{news.content}</p>

            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  <span>{formatDate(news.date)}</span>
                </div>
                <div className="flex items-center gap-1">
                  <User className="w-4 h-4" />
                  <span>{news.author}</span>
                </div>
              </div>
              <Button variant="outline" size="sm">
                Leer más
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}

      {mockNews.length === 0 && (
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
