"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { BookOpen, Newspaper, Download, Eye, Users, TrendingUp } from "lucide-react"
import Link from "next/link"

interface TeacherStatsProps {
  userRole: string
}

export function TeacherStats({ userRole }: TeacherStatsProps) {
  // Mock data - en una aplicación real vendría de una API
  const stats = {
    materialsUploaded: 12,
    newsCreated: 8,
    totalDownloads: 245,
    totalViews: 1420,
    studentsReached: 156,
    thisMonthUploads: 3,
  }

  const recentActivity = [
    {
      type: "material",
      title: "Guía de Ejercicios - Álgebra",
      action: "subido",
      date: "Hace 2 días",
      downloads: 15,
    },
    {
      type: "news",
      title: "Reunión de Padres - Marzo",
      action: "publicado",
      date: "Hace 3 días",
      views: 89,
    },
    {
      type: "material",
      title: "Video Tutorial - Funciones",
      action: "actualizado",
      date: "Hace 1 semana",
      downloads: 32,
    },
  ]

  if (userRole !== "teacher" && userRole !== "preceptor") {
    return null
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Materiales Subidos</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{stats.materialsUploaded}</div>
            <p className="text-xs text-muted-foreground">+{stats.thisMonthUploads} este mes</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Noticias Creadas</CardTitle>
            <Newspaper className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{stats.newsCreated}</div>
            <p className="text-xs text-muted-foreground">Comunicaciones institucionales</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Descargas</CardTitle>
            <Download className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{stats.totalDownloads}</div>
            <p className="text-xs text-muted-foreground">De todos tus materiales</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Visualizaciones</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{stats.totalViews}</div>
            <p className="text-xs text-muted-foreground">Noticias y materiales</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Estudiantes Alcanzados</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{stats.studentsReached}</div>
            <p className="text-xs text-muted-foreground">Acceso a tu contenido</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tendencia</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">+23%</div>
            <p className="text-xs text-muted-foreground">Interacción este mes</p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Actividad Reciente</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recentActivity.map((activity, index) => (
              <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                <div className="flex items-center gap-3">
                  {activity.type === "material" ? (
                    <BookOpen className="w-4 h-4 text-blue-600" />
                  ) : (
                    <Newspaper className="w-4 h-4 text-green-600" />
                  )}
                  <div>
                    <p className="font-medium text-sm">{activity.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {activity.action} • {activity.date}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="text-xs">
                    {activity.type === "material" ? `${activity.downloads} descargas` : `${activity.views} vistas`}
                  </Badge>
                </div>
              </div>
            ))}
          </div>

          <div className="flex gap-2 mt-4 pt-4 border-t">
            <Button asChild variant="outline" size="sm">
              <Link href="/materials">
                <BookOpen className="w-4 h-4 mr-2" />
                Gestionar Materiales
              </Link>
            </Button>
            <Button asChild variant="outline" size="sm">
              <Link href="/news">
                <Newspaper className="w-4 h-4 mr-2" />
                Crear Noticia
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
