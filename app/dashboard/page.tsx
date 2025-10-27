"use client"

import { useState, useEffect } from "react"
import { MainLayout } from "@/components/layout/main-layout" // Importando el nuevo layout
import { Calendar } from "@/components/dashboard/calendar"
import { QuickStats } from "@/components/dashboard/quick-stats"
import { RecentActivity } from "@/components/dashboard/recent-activity"
import { TeacherStats } from "@/components/dashboard/teacher-stats"
import type { TutorSummaryResponse } from "@/lib/types/tutor-summary"
import { useRouter } from "next/navigation"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

export default function DashboardPage() {
  const [user, setUser] = useState<any>(null)
  const [summary, setSummary] = useState<TutorSummaryResponse | null>(null)
  const [summaryLoading, setSummaryLoading] = useState(false)
  const [summaryError, setSummaryError] = useState("")
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const res = await fetch("/api/session", { credentials: "include" })
        if (!res.ok) {
          router.push("/login")
          return
        }
        const data = await res.json()
        if (!cancelled) {
          const mapRole = (role: string) => {
            switch (role) {
              case "docente":
                return "teacher"
              case "preceptor":
                return "preceptor"
              case "tutor":
                return "parent"
              case "estudiante":
                return "student"
              case "administrador":
                return "admin"
              case "directivo":
                return "directivo"
              default:
                return role
            }
          }

          const payload = data.user
          const normalized = payload
            ? {
                ...payload,
                username: payload?.nombre || payload?.name || "Usuario",
                dbRole: payload?.role,
                role: mapRole(payload?.role),
              }
            : null
          setUser(normalized)
        }
      } catch {
        router.push("/login")
      }
    })()
    return () => {
      cancelled = true
    }
  }, [router])

  useEffect(() => {
    if (!user || user.role !== "parent") {
      setSummary(null)
      setSummaryError("")
      setSummaryLoading(false)
      return
    }

    let cancelled = false

    ;(async () => {
      setSummaryLoading(true)
      setSummaryError("")
      try {
        const res = await fetch("/api/tutor/summary", { credentials: "include" })
        const data = await res.json().catch(() => ({}))
        if (cancelled) return
        if (!res.ok) {
          setSummaryError(data?.error || "No se pudo obtener la información del estudiante")
          setSummary(null)
        } else {
          setSummary(Array.isArray(data?.students) ? { students: data.students } : data)
        }
      } catch {
        if (!cancelled) {
          setSummaryError("No se pudo obtener la información del estudiante")
          setSummary(null)
        }
      } finally {
        if (!cancelled) setSummaryLoading(false)
      }
    })()

    return () => {
      cancelled = true
    }
  }, [user])

  useEffect(() => {
    if (user?.role !== "parent") {
      setSelectedStudentId(null)
      return
    }
    const firstStudentId = summary?.students?.[0]?.student.id || null
    setSelectedStudentId((prev) => {
      if (prev && summary?.students?.some((student) => student.student.id === prev)) {
        return prev
      }
      return firstStudentId
    })
  }, [summary, user?.role])

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-transparent bg-gradient-to-r from-primary to-primary-light bg-clip-border mx-auto">
            <div className="rounded-full h-8 w-8 bg-background m-2"></div>
          </div>
          <p className="mt-4 text-muted-foreground animate-pulse">Cargando panel de control...</p>
        </div>
      </div>
    )
  }

  const isTeacherOrPreceptor = user.role === "teacher" || user.role === "preceptor"
  const isParent = user.role === "parent"
  const parentStudents = summary?.students || []
  const selectedStudent = isParent
    ? parentStudents.find((student) => student.student.id === selectedStudentId) || null
    : null

  return (
    <MainLayout>
      {" "}
      {/* Usando el nuevo MainLayout */}
      <div className="p-4 lg:p-6 space-y-4 lg:space-y-6 animate-fade-in bg-gradient-to-br from-background via-background to-accent/5 min-h-0">
        <div className="space-y-2 animate-slide-up">
          <h1 className="text-2xl lg:text-3xl font-bold bg-gradient-to-r from-primary to-primary-light bg-clip-text text-transparent">
            Bienvenido, {user.username}
          </h1>
          <p className="text-muted-foreground text-base lg:text-lg">
            {isTeacherOrPreceptor
              ? "Panel de gestión académica y contenido educativo"
              : "Panel principal - Gestión académica"}
          </p>
        </div>

        {isParent && (
          <div
            className="space-y-4 animate-slide-up"
            style={{ animationDelay: "0.1s" }}
            id={selectedStudent ? `estudiante-${selectedStudent.student.id}` : undefined}
          >
            <Card>
              <CardHeader className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                  <CardTitle>Estudiante a cargo</CardTitle>
                  <p className="text-sm text-muted-foreground">Selecciona a quién quieres revisar</p>
                </div>
                <Select
                  value={selectedStudentId || undefined}
                  onValueChange={(value) => setSelectedStudentId(value)}
                  disabled={summaryLoading || parentStudents.length === 0}
                >
                  <SelectTrigger className="w-full md:w-72">
                    <SelectValue placeholder={summaryLoading ? "Cargando estudiantes..." : "Selecciona un estudiante"} />
                  </SelectTrigger>
                  <SelectContent>
                    {parentStudents.map((student) => (
                      <SelectItem key={student.student.id} value={student.student.id}>
                        {student.student.nombre}
                        {student.student.curso_nombre ? ` · ${student.student.curso_nombre}` : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </CardHeader>
              {summaryError && (
                <CardContent>
                  <p className="text-sm text-destructive">{summaryError}</p>
                </CardContent>
              )}
              {!summaryError && !summaryLoading && selectedStudent && (
                <CardContent className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">Curso</p>
                    <p className="text-lg font-semibold text-foreground">
                      {selectedStudent.student.curso_nombre || "Sin curso asignado"}
                    </p>
                    {selectedStudent.student.curso_anio && (
                      <p className="text-xs text-muted-foreground">Año lectivo: {selectedStudent.student.curso_anio}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">Contacto</p>
                    <p className="text-sm text-foreground">{selectedStudent.student.correo || "Sin correo"}</p>
                    <p className="text-sm text-muted-foreground">{selectedStudent.student.telefono || "Sin teléfono"}</p>
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">Promedio</p>
                    <Badge className="w-fit text-base px-3 py-1">
                      {selectedStudent.grades.average != null ? selectedStudent.grades.average.toFixed(2) : "—"}
                    </Badge>
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">Asistencia</p>
                    <Badge variant="outline" className="w-fit text-base px-3 py-1">
                      {selectedStudent.attendance.porcentaje_asistencia != null
                        ? `${Math.round(selectedStudent.attendance.porcentaje_asistencia)}%`
                        : "Sin datos"}
                    </Badge>
                    <p className="text-xs text-muted-foreground">
                      Faltas equivalentes: {selectedStudent.attendance.faltas_equivalentes.toFixed(2)}
                    </p>
                  </div>
                </CardContent>
              )}
              {summaryLoading && (
                <CardContent>
                  <p className="text-sm text-muted-foreground">Cargando información del estudiante...</p>
                </CardContent>
              )}
            </Card>
          </div>
        )}

        <div className="animate-slide-up" style={{ animationDelay: isParent ? "0.2s" : "0.1s" }}>
          <QuickStats
            userRole={user.role}
            tutorSummary={summary}
            tutorSummaryLoading={summaryLoading}
            tutorSummaryError={summaryError}
            selectedStudentId={selectedStudentId}
          />
        </div>

        {isTeacherOrPreceptor && (
          <div className="animate-slide-up" style={{ animationDelay: "0.3s" }}>
            <TeacherStats userRole={user.role} />
          </div>
        )}

        <div
          className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6 animate-slide-up"
          style={{ animationDelay: "0.4s" }}
        >
          <div className="lg:col-span-2">
            <Calendar />
          </div>
          <div className="space-y-4 lg:space-y-6">
            <RecentActivity
              userRole={user.role}
              tutorSummary={summary}
              tutorSummaryLoading={summaryLoading}
              tutorSummaryError={summaryError}
            />
          </div>
        </div>
      </div>
    </MainLayout>
  )
}
