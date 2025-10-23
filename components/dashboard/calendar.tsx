"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ChevronLeft, ChevronRight, Filter } from "lucide-react"

const subjects = [
  "Todas las materias",
  "Matemática",
  "Lengua",
  "Informática",
  "Historia",
  "Ciencias Naturales",
  "Inglés",
]

const mockEvents = [
  {
    id: 1,
    title: "Examen de Matemática",
    subject: "Matemática",
    date: "2025-01-15",
    time: "10:00",
    type: "exam",
  },
  {
    id: 2,
    title: "Entrega de Proyecto",
    subject: "Informática",
    date: "2025-01-18",
    time: "14:00",
    type: "assignment",
  },
  {
    id: 3,
    title: "Reunión de Padres",
    subject: "General",
    date: "2025-01-20",
    time: "18:00",
    type: "meeting",
  },
  {
    id: 4,
    title: "Clase de Laboratorio",
    subject: "Ciencias Naturales",
    date: "2025-01-22",
    time: "09:00",
    type: "class",
  },
]

export function Calendar() {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedSubject, setSelectedSubject] = useState("Todas las materias")
  const [viewMode, setViewMode] = useState<"week" | "month">("month")

  const getEventTypeColor = (type: string) => {
    const colors = {
      exam: "bg-destructive text-destructive-foreground",
      assignment: "bg-primary text-primary-foreground",
      meeting: "bg-secondary text-secondary-foreground",
      class: "bg-accent text-accent-foreground",
    }
    return colors[type as keyof typeof colors] || "bg-muted text-muted-foreground"
  }

  const filteredEvents = mockEvents.filter(
    (event) => selectedSubject === "Todas las materias" || event.subject === selectedSubject,
  )

  const formatDate = (date: Date) => {
    return date.toLocaleDateString("es-ES", {
      year: "numeric",
      month: "long",
    })
  }

  const navigateMonth = (direction: "prev" | "next") => {
    setCurrentDate((prev) => {
      const newDate = new Date(prev)
      if (direction === "prev") {
        newDate.setMonth(prev.getMonth() - 1)
      } else {
        newDate.setMonth(prev.getMonth() + 1)
      }
      return newDate
    })
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Filter className="w-5 h-5" />
            Calendario Académico
          </CardTitle>
          <div className="flex items-center gap-2">
            <Select value={viewMode} onValueChange={(value: "week" | "month") => setViewMode(value)}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="week">Semanal</SelectItem>
                <SelectItem value="month">Mensual</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => navigateMonth("prev")}>
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <h3 className="text-lg font-semibold min-w-0 flex-1 sm:min-w-32 text-center">{formatDate(currentDate)}</h3>
            <Button variant="outline" size="sm" onClick={() => navigateMonth("next")}>
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>

          <Select value={selectedSubject} onValueChange={setSelectedSubject}>
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {subjects.map((subject) => (
                <SelectItem key={subject} value={subject}>
                  {subject}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardHeader>

      <CardContent className="p-4 sm:p-6">
        <div className="space-y-4">
          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-1 sm:gap-2 mb-4">
            {["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"].map((day) => (
              <div key={day} className="p-2 text-center text-sm font-medium text-muted-foreground">
                {day}
              </div>
            ))}

            {/* Calendar days would go here - simplified for demo */}
            {Array.from({ length: 35 }, (_, i) => (
              <div
                key={i}
                className="p-1 sm:p-2 text-center text-sm border border-border rounded hover:bg-accent/50 cursor-pointer min-h-8 sm:min-h-12"
              >
                {i < 31 ? i + 1 : ""}
              </div>
            ))}
          </div>

          {/* Events List */}
          <div className="space-y-3">
            <h4 className="font-semibold text-foreground">Próximos Eventos</h4>
            {filteredEvents.map((event) => (
              <div
                key={event.id}
                className="flex items-center justify-between p-3 border border-border rounded-lg hover:bg-accent/50"
              >
                <div className="flex items-center gap-3">
                  <Badge className={getEventTypeColor(event.type)}>
                    {event.type === "exam"
                      ? "Examen"
                      : event.type === "assignment"
                        ? "Tarea"
                        : event.type === "meeting"
                          ? "Reunión"
                          : "Clase"}
                  </Badge>
                  <div>
                    <p className="font-medium text-foreground">{event.title}</p>
                    <p className="text-sm text-muted-foreground">{event.subject}</p>
                  </div>
                </div>
                <div className="text-right text-sm text-muted-foreground">
                  <p>{event.date}</p>
                  <p>{event.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
