"use client"

import { useState, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from "lucide-react"
import { cn } from "@/lib/utils"

type CalendarEvent = {
  id: string
  title: string
  subject: string | null
  date: string
  type: 'grade' | 'attendance'
  value?: number | string | null
}

type CalendarProps = {
  userRole?: string
  events?: CalendarEvent[]
}

export function Calendar({ userRole = "student", events = [] }: CalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedDay, setSelectedDay] = useState<number | null>(null)

  // Generar los días del mes correctamente
  const calendarDays = useMemo(() => {
    const year = currentDate.getFullYear()
    const month = currentDate.getMonth()
    
    // Primer día del mes
    const firstDay = new Date(year, month, 1)
    const startingDayOfWeek = firstDay.getDay() // 0 = domingo
    
    // Último día del mes
    const lastDay = new Date(year, month + 1, 0)
    const daysInMonth = lastDay.getDate()
    
    // Días del mes anterior para rellenar
    const prevMonthLastDay = new Date(year, month, 0).getDate()
    const daysFromPrevMonth = startingDayOfWeek
    
    // Días del siguiente mes para completar la grilla
    const totalCells = Math.ceil((daysInMonth + daysFromPrevMonth) / 7) * 7
    const daysFromNextMonth = totalCells - (daysInMonth + daysFromPrevMonth)
    
    const days: Array<{
      day: number
      isCurrentMonth: boolean
      date: Date
      dateString: string
    }> = []
    
    // Días del mes anterior
    for (let i = daysFromPrevMonth - 1; i >= 0; i--) {
      const day = prevMonthLastDay - i
      const date = new Date(year, month - 1, day)
      days.push({
        day,
        isCurrentMonth: false,
        date,
        dateString: date.toISOString().slice(0, 10)
      })
    }
    
    // Días del mes actual
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day)
      days.push({
        day,
        isCurrentMonth: true,
        date,
        dateString: date.toISOString().slice(0, 10)
      })
    }
    
    // Días del mes siguiente
    for (let day = 1; day <= daysFromNextMonth; day++) {
      const date = new Date(year, month + 1, day)
      days.push({
        day,
        isCurrentMonth: false,
        date,
        dateString: date.toISOString().slice(0, 10)
      })
    }
    
    return days
  }, [currentDate])

  // Agrupar eventos por fecha
  const eventsByDate = useMemo(() => {
    const grouped = new Map<string, CalendarEvent[]>()
    events.forEach(event => {
      if (!event.date) return
      const dateKey = event.date.slice(0, 10)
      if (!grouped.has(dateKey)) {
        grouped.set(dateKey, [])
      }
      grouped.get(dateKey)!.push(event)
    })
    return grouped
  }, [events])

  // Eventos del día seleccionado
  const selectedDayEvents = useMemo(() => {
    if (selectedDay === null) return []
    const year = currentDate.getFullYear()
    const month = currentDate.getMonth()
    const dateString = new Date(year, month, selectedDay).toISOString().slice(0, 10)
    return eventsByDate.get(dateString) || []
  }, [selectedDay, currentDate, eventsByDate])

  const getEventTypeColor = (type: string) => {
    const colors = {
      grade: "bg-blue-500",
      attendance: "bg-green-500",
    }
    return colors[type as keyof typeof colors] || "bg-gray-500"
  }

  const getEventTypeName = (type: string) => {
    const names = {
      grade: "Calificación",
      attendance: "Asistencia",
    }
    return names[type as keyof typeof names] || type
  }

  const formatMonthYear = (date: Date) => {
    return date.toLocaleDateString("es-AR", {
      year: "numeric",
      month: "long",
    })
  }

  const isToday = (date: Date) => {
    const today = new Date()
    return date.getDate() === today.getDate() &&
           date.getMonth() === today.getMonth() &&
           date.getFullYear() === today.getFullYear()
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
            <CalendarIcon className="w-5 h-5" />
            Calendario Académico
          </CardTitle>
        </div>

        <div className="flex items-center justify-center gap-2">
          <Button variant="outline" size="sm" onClick={() => navigateMonth("prev")}>
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <h3 className="text-lg font-semibold min-w-48 text-center capitalize">{formatMonthYear(currentDate)}</h3>
          <Button variant="outline" size="sm" onClick={() => navigateMonth("next")}>
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </CardHeader>

      <CardContent className="p-4 sm:p-6">
        <div className="space-y-4">
          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-1">
            {["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"].map((day) => (
              <div key={day} className="p-2 text-center text-xs font-semibold text-muted-foreground">
                {day}
              </div>
            ))}

            {calendarDays.map((dayInfo, index) => {
              const dayEvents = eventsByDate.get(dayInfo.dateString) || []
              const hasEvents = dayEvents.length > 0
              const hasGrades = dayEvents.some(e => e.type === 'grade')
              const hasAttendance = dayEvents.some(e => e.type === 'attendance')
              const today = isToday(dayInfo.date)
              
              return (
                <button
                  key={index}
                  onClick={() => dayInfo.isCurrentMonth ? setSelectedDay(dayInfo.day) : null}
                  className={cn(
                    "relative p-2 text-center text-sm border rounded transition-colors min-h-12 flex flex-col items-center justify-center",
                    dayInfo.isCurrentMonth
                      ? "border-border hover:bg-accent/50 cursor-pointer text-foreground"
                      : "border-transparent text-muted-foreground/40 cursor-default",
                    today && dayInfo.isCurrentMonth && "bg-primary/10 border-primary font-bold",
                    selectedDay === dayInfo.day && dayInfo.isCurrentMonth && "bg-accent border-accent-foreground"
                  )}
                  disabled={!dayInfo.isCurrentMonth}
                >
                  <span>{dayInfo.day}</span>
                  {hasEvents && dayInfo.isCurrentMonth && (
                    <div className="flex gap-0.5 mt-1">
                      {hasGrades && <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />}
                      {hasAttendance && <div className="w-1.5 h-1.5 rounded-full bg-green-500" />}
                    </div>
                  )}
                </button>
              )
            })}
          </div>

          {/* Events for Selected Day */}
          {selectedDay !== null && selectedDayEvents.length > 0 && (
            <div className="space-y-3 pt-4 border-t">
              <h4 className="font-semibold text-foreground">
                Actividades del {selectedDay} de {formatMonthYear(currentDate).split(' ')[0]}
              </h4>
              {selectedDayEvents.map((event) => (
                <div
                  key={event.id}
                  className="flex items-center justify-between p-3 border border-border rounded-lg hover:bg-accent/50"
                >
                  <div className="flex items-center gap-3">
                    <div className={cn("w-2 h-2 rounded-full", getEventTypeColor(event.type))} />
                    <div>
                      <p className="font-medium text-foreground">{event.title}</p>
                      <p className="text-sm text-muted-foreground">{event.subject || "Sin materia"}</p>
                    </div>
                  </div>
                  <div className="text-right text-sm">
                    <Badge variant="outline">{getEventTypeName(event.type)}</Badge>
                    {event.value && <p className="text-xs text-muted-foreground mt-1">{event.value}</p>}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Info when no day selected */}
          {selectedDay === null && events.length > 0 && (
            <div className="text-center text-sm text-muted-foreground pt-4 border-t">
              <p>Haz clic en un día para ver las actividades</p>
              <div className="flex justify-center gap-4 mt-2">
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 rounded-full bg-blue-500" />
                  <span className="text-xs">Calificaciones</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 rounded-full bg-green-500" />
                  <span className="text-xs">Asistencias</span>
                </div>
              </div>
            </div>
          )}

          {events.length === 0 && (
            <div className="text-center text-sm text-muted-foreground pt-4 border-t">
              <p>No hay actividades registradas</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
