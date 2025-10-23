"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Users, BookOpen, Calendar, TrendingUp } from "lucide-react"

interface QuickStatsProps {
  userRole: string
}

export function QuickStats({ userRole }: QuickStatsProps) {
  const getStatsForRole = (role: string) => {
    switch (role) {
      case "student":
        return [
          {
            title: "Materias Cursando",
            value: "8",
            icon: BookOpen,
            color: "text-primary",
            gradient: "from-primary to-primary-light",
          },
          {
            title: "Promedio General",
            value: "8.5",
            icon: TrendingUp,
            color: "text-accent-green",
            gradient: "from-accent-green to-accent-green-light",
          },
          {
            title: "Asistencia",
            value: "95%",
            icon: Calendar,
            color: "text-primary-light",
            gradient: "from-primary-light to-accent-green",
          },
          {
            title: "Tareas Pendientes",
            value: "3",
            icon: Users,
            color: "text-primary-dark",
            gradient: "from-primary-dark to-primary",
          },
        ]
      case "teacher":
        return [
          {
            title: "Cursos Asignados",
            value: "4",
            icon: Users,
            color: "text-primary",
            gradient: "from-primary to-primary-light",
          },
          {
            title: "Estudiantes Total",
            value: "120",
            icon: Users,
            color: "text-accent-green",
            gradient: "from-accent-green to-accent-green-light",
          },
          {
            title: "Clases Esta Semana",
            value: "18",
            icon: Calendar,
            color: "text-primary-light",
            gradient: "from-primary-light to-accent-green",
          },
          {
            title: "Evaluaciones Pendientes",
            value: "7",
            icon: BookOpen,
            color: "text-primary-dark",
            gradient: "from-primary-dark to-primary",
          },
        ]
      case "preceptor":
        return [
          {
            title: "Estudiantes a Cargo",
            value: "180",
            icon: Users,
            color: "text-primary",
            gradient: "from-primary to-primary-light",
          },
          {
            title: "Asistencia Promedio",
            value: "92%",
            icon: Calendar,
            color: "text-accent-green",
            gradient: "from-accent-green to-accent-green-light",
          },
          {
            title: "Reportes Pendientes",
            value: "5",
            icon: BookOpen,
            color: "text-primary-dark",
            gradient: "from-primary-dark to-primary",
          },
          {
            title: "Reuniones Programadas",
            value: "3",
            icon: TrendingUp,
            color: "text-primary-light",
            gradient: "from-primary-light to-accent-green",
          },
        ]
      case "parent":
        return [
          {
            title: "Hijos Registrados",
            value: "2",
            icon: Users,
            color: "text-primary",
            gradient: "from-primary to-primary-light",
          },
          {
            title: "Promedio Familiar",
            value: "8.2",
            icon: TrendingUp,
            color: "text-accent-green",
            gradient: "from-accent-green to-accent-green-light",
          },
          {
            title: "Reuniones Pendientes",
            value: "1",
            icon: Calendar,
            color: "text-primary-light",
            gradient: "from-primary-light to-accent-green",
          },
          {
            title: "Comunicados Nuevos",
            value: "4",
            icon: BookOpen,
            color: "text-primary-dark",
            gradient: "from-primary-dark to-primary",
          },
        ]
      default:
        return []
    }
  }

  const stats = getStatsForRole(userRole)

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat, index) => {
        const Icon = stat.icon
        return (
          <Card
            key={index}
            className="hover-lift card-glow animate-scale-in border-0 bg-gradient-to-br from-card to-card/80 backdrop-blur-sm"
            style={{ animationDelay: `${index * 0.1}s` }}
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{stat.title}</CardTitle>
              <div className={`p-2 rounded-lg bg-gradient-to-r ${stat.gradient} bg-opacity-10`}>
                <Icon className={`w-4 h-4 ${stat.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold bg-gradient-to-r ${stat.gradient} bg-clip-text text-transparent`}>
                {stat.value}
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
