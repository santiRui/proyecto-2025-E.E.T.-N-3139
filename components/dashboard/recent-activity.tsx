"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Clock, FileText, Users, Calendar } from "lucide-react"

interface RecentActivityProps {
  userRole: string
}

export function RecentActivity({ userRole }: RecentActivityProps) {
  const getActivitiesForRole = (role: string) => {
    switch (role) {
      case "student":
        return [
          {
            id: 1,
            title: "Nueva tarea asignada",
            description: "Matemática - Ejercicios de álgebra",
            time: "Hace 2 horas",
            type: "assignment",
            icon: FileText,
          },
          {
            id: 2,
            title: "Calificación publicada",
            description: "Historia - Examen parcial: 9/10",
            time: "Hace 1 día",
            type: "grade",
            icon: Users,
          },
          {
            id: 3,
            title: "Recordatorio de clase",
            description: "Laboratorio de Ciencias - Mañana 9:00 AM",
            time: "Hace 2 días",
            type: "reminder",
            icon: Calendar,
          },
        ]
      case "teacher":
        return [
          {
            id: 1,
            title: "Evaluaciones por corregir",
            description: "15 exámenes de Matemática pendientes",
            time: "Hace 1 hora",
            type: "task",
            icon: FileText,
          },
          {
            id: 2,
            title: "Reunión programada",
            description: "Consejo docente - Viernes 14:00",
            time: "Hace 3 horas",
            type: "meeting",
            icon: Users,
          },
          {
            id: 3,
            title: "Material subido",
            description: "Guía de ejercicios - Álgebra lineal",
            time: "Hace 1 día",
            type: "upload",
            icon: Calendar,
          },
        ]
      case "preceptor":
        return [
          {
            id: 1,
            title: "Reporte de asistencia",
            description: "5 estudiantes con inasistencias",
            time: "Hace 30 min",
            type: "report",
            icon: Users,
          },
          {
            id: 2,
            title: "Solicitud de reunión",
            description: "Padres de Juan Pérez solicitan reunión",
            time: "Hace 2 horas",
            type: "request",
            icon: Calendar,
          },
          {
            id: 3,
            title: "Comunicado enviado",
            description: "Información sobre acto del 25 de Mayo",
            time: "Hace 1 día",
            type: "communication",
            icon: FileText,
          },
        ]
      case "parent":
        return [
          {
            id: 1,
            title: "Nueva calificación",
            description: "María - Lengua: 8/10",
            time: "Hace 1 hora",
            type: "grade",
            icon: FileText,
          },
          {
            id: 2,
            title: "Comunicado escolar",
            description: "Información sobre reunión de padres",
            time: "Hace 4 horas",
            type: "communication",
            icon: Users,
          },
          {
            id: 3,
            title: "Recordatorio",
            description: "Entrega de boletín - Viernes 16:00",
            time: "Hace 1 día",
            type: "reminder",
            icon: Calendar,
          },
        ]
      default:
        return []
    }
  }

  const activities = getActivitiesForRole(userRole)

  const getTypeColor = (type: string) => {
    const colors = {
      assignment: "bg-primary text-primary-foreground",
      grade: "bg-green-100 text-green-800",
      reminder: "bg-blue-100 text-blue-800",
      task: "bg-orange-100 text-orange-800",
      meeting: "bg-purple-100 text-purple-800",
      upload: "bg-teal-100 text-teal-800",
      report: "bg-red-100 text-red-800",
      request: "bg-yellow-100 text-yellow-800",
      communication: "bg-indigo-100 text-indigo-800",
    }
    return colors[type as keyof typeof colors] || "bg-muted text-muted-foreground"
  }

  const getTypeLabel = (type: string) => {
    const labels = {
      assignment: "Tarea",
      grade: "Nota",
      reminder: "Recordatorio",
      task: "Pendiente",
      meeting: "Reunión",
      upload: "Material",
      report: "Reporte",
      request: "Solicitud",
      communication: "Comunicado",
    }
    return labels[type as keyof typeof labels] || type
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="w-5 h-5" />
          Actividad Reciente
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {activities.map((activity) => {
            const Icon = activity.icon
            return (
              <div
                key={activity.id}
                className="flex items-start gap-3 p-3 border border-border rounded-lg hover:bg-accent/50"
              >
                <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                  <Icon className="w-4 h-4 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-medium text-foreground text-sm">{activity.title}</p>
                    <Badge variant="secondary" className={`text-xs ${getTypeColor(activity.type)}`}>
                      {getTypeLabel(activity.type)}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mb-1">{activity.description}</p>
                  <p className="text-xs text-muted-foreground">{activity.time}</p>
                </div>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
