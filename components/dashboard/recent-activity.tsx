"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Clock, FileText, Users, Calendar } from "lucide-react"
import type { TutorSummaryResponse } from "@/lib/types/tutor-summary"

interface RecentActivityProps {
  userRole: string
  tutorSummary?: TutorSummaryResponse | null
  tutorSummaryLoading?: boolean
  tutorSummaryError?: string
}

type Activity = {
  id: string | number
  title: string
  description: string
  time: string
  type: string
  icon: any
}

export function RecentActivity({ userRole, tutorSummary, tutorSummaryLoading, tutorSummaryError }: RecentActivityProps) {
  const formatDate = (value: string | null | undefined) => {
    if (!value) return "Sin fecha"
    return new Date(value).toLocaleDateString('es-AR', { day: '2-digit', month: 'short', year: 'numeric' })
  }

  const getActivitiesForRole = (role: string): Activity[] => {
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
      case "parent": {
        if (tutorSummaryLoading) {
          return [
            {
              id: "loading",
              title: "Cargando actividad reciente",
              description: "Estamos obteniendo los últimos registros",
              time: "",
              type: "loading",
              icon: Clock,
            },
          ]
        }

        if (tutorSummaryError) {
          return [
            {
              id: "error",
              title: "Sin actividad",
              description: tutorSummaryError,
              time: "",
              type: "error",
              icon: Users,
            },
          ]
        }

        const students = tutorSummary?.students || []
        if (students.length === 0) {
          return [
            {
              id: "empty",
              title: "Sin estudiantes vinculados",
              description: "Asocia un estudiante para ver su actividad",
              time: "",
              type: "info",
              icon: Users,
            },
          ]
        }

        const gradeActivities: Activity[] = students.flatMap((student) => {
          return (student.grades.recent || []).map((grade, index) => ({
            id: `${student.student.id}-grade-${index}`,
            title: `${student.student.nombre} · ${grade.subject || "Materia"}`,
            description: `${grade.type || "Evaluación"}: ${grade.grade ?? "—"}${grade.weight != null ? ` · Peso ${grade.weight}%` : ""}`,
            time: formatDate(grade.date),
            type: "grade",
            icon: FileText,
          }))
        })

        const attendanceActivities: Activity[] = students.map((student) => {
          const attendance = student.attendance
          const porcentaje = attendance.porcentaje_asistencia != null
            ? `${Math.round(attendance.porcentaje_asistencia)}%`
            : "Sin datos"
          return {
            id: `${student.student.id}-attendance`,
            title: `${student.student.nombre} · Asistencia actual`,
            description: `Presentes: ${attendance.presentes} · Ausentes: ${attendance.ausentes} · Llegadas tarde: ${attendance.llegadas_tarde}`,
            time: `Asistencia equivalente: ${attendance.faltas_equivalentes.toFixed(2)} · ${porcentaje}`,
            type: "attendance",
            icon: Calendar,
          }
        })

        const allActivities = [...gradeActivities, ...attendanceActivities]
          .sort((a, b) => (b.time || "").localeCompare(a.time || ""))
          .slice(0, 6)

        return allActivities.length > 0
          ? allActivities
          : [
              {
                id: "no-data",
                title: "Sin registros recientes",
                description: "Cuando se carguen nuevas calificaciones o asistencias aparecerán aquí",
                time: "",
                type: "info",
                icon: Users,
              },
            ]
      }
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
