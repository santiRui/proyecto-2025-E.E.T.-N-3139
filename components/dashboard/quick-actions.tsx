"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { PlusCircle, Upload, Newspaper, Users, ClipboardList } from "lucide-react"
import Link from "next/link"

import type { TutorSummaryResponse } from "@/lib/types/tutor-summary"

interface QuickActionsProps {
  userRole: string
  tutorSummary?: TutorSummaryResponse | null
  selectedStudentId?: string | null
}

export function QuickActions({ userRole, tutorSummary, selectedStudentId }: QuickActionsProps) {
  const getActionsForRole = () => {
    const role = String(userRole || '').toLowerCase()
    const isPreceptor = role.includes('preceptor')
    const isAdminLike = role.includes('admin') || role.includes('administrador') || role.includes('directivo')
    const isStudent = role.includes('student')
    const isParentLike = role.includes('parent') || role.includes('padre') || role.includes('tutor')

    if (isPreceptor) {
      return [
        {
          title: "Crear Noticia",
          description: "Publicar comunicado institucional",
          icon: Newspaper,
          href: "/news",
          color: "bg-green-100 text-green-700 hover:bg-green-200",
        },
        {
          title: "Subir Material",
          description: "Agregar recurso educativo",
          icon: Upload,
          href: "/materials",
          color: "bg-blue-100 text-blue-700 hover:bg-blue-200",
        },
        {
          title: "Cargar Notas",
          description: "Actualizar calificaciones",
          icon: ClipboardList,
          href: "/grades",
          color: "bg-orange-100 text-orange-700 hover:bg-orange-200",
        },
      ]
    }

    if (isAdminLike) {
      return [
        {
          title: "Crear Noticia",
          description: "Publicar comunicado institucional",
          icon: Newspaper,
          href: "/news",
          color: "bg-green-100 text-green-700 hover:bg-green-200",
        },
      ]
    }

    if (isStudent) {
      return [
        {
          title: "Ver Materiales",
          description: "Acceder a recursos de estudio",
          icon: Upload,
          href: "/materials",
          color: "bg-blue-100 text-blue-700 hover:bg-blue-200",
        },
        {
          title: "Mis Notas",
          description: "Consultar calificaciones",
          icon: ClipboardList,
          href: "/grades",
          color: "bg-green-100 text-green-700 hover:bg-green-200",
        },
      ]
    }

    if (isParentLike) {
      const students = tutorSummary?.students || []
      const studentId = selectedStudentId || students[0]?.student.id
      return [
        {
          title: "Ver Notas",
          description: "Resumen académico del estudiante",
          icon: ClipboardList,
          href: studentId ? `/dashboard#estudiante-${studentId}` : "#",
          color: "bg-green-100 text-green-700 hover:bg-green-200",
        },
        {
          title: "Materiales de Estudio",
          description: "Recursos educativos",
          icon: Upload,
          href: "/materials",
          color: "bg-blue-100 text-blue-700 hover:bg-blue-200",
        },
      ]
    }

    return []
  }

  const actions = getActionsForRole()

  if (actions.length === 0) return null

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <PlusCircle className="w-5 h-5" />
          Acciones Rápidas
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {actions.map((action, index) => {
            const Icon = action.icon
            return (
              <Button
                key={index}
                asChild
                variant="ghost"
                className={`h-auto p-4 flex flex-col items-center gap-2 ${action.color}`}
              >
                <Link href={action.href}>
                  <Icon className="w-6 h-6" />
                  <div className="text-center">
                    <p className="font-medium text-sm">{action.title}</p>
                    <p className="text-xs opacity-80">{action.description}</p>
                  </div>
                </Link>
              </Button>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
