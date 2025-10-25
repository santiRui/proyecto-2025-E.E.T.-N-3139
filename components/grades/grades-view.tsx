"use client"

import { useEffect, useMemo, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Progress } from "@/components/ui/progress"
import { BookOpen, TrendingUp, Award, AlertCircle } from "lucide-react"

const mockGrades = {
  student: [
    {
      subject: "Matemática",
      grades: [
        { type: "Parcial", date: "2025-01-15", grade: 8.5, weight: 40 },
        { type: "TP", date: "2025-01-10", grade: 9.0, weight: 20 },
        { type: "Oral", date: "2025-01-08", grade: 7.5, weight: 20 },
        { type: "Participación", date: "2025-01-05", grade: 8.0, weight: 20 },
      ],
      average: 8.3,
      status: "approved",
    },
    {
      subject: "Lengua",
      grades: [
        { type: "Parcial", date: "2025-01-18", grade: 9.2, weight: 40 },
        { type: "Ensayo", date: "2025-01-12", grade: 8.8, weight: 30 },
        { type: "Oral", date: "2025-01-06", grade: 9.0, weight: 30 },
      ],
      average: 9.0,
      status: "approved",
    },
    {
      subject: "Historia",
      grades: [
        { type: "Parcial", date: "2025-01-20", grade: 6.5, weight: 50 },
        { type: "TP", date: "2025-01-14", grade: 7.0, weight: 25 },
        { type: "Oral", date: "2025-01-09", grade: 6.8, weight: 25 },
      ],
      average: 6.7,
      status: "at_risk",
    },
    {
      subject: "Ciencias Naturales",
      grades: [
        { type: "Parcial", date: "2025-01-16", grade: 8.8, weight: 40 },
        { type: "Laboratorio", date: "2025-01-11", grade: 9.5, weight: 30 },
        { type: "Informe", date: "2025-01-07", grade: 8.2, weight: 30 },
      ],
      average: 8.7,
      status: "approved",
    },
  ],
  teacher: [],
}

type Course = {
  id: string
  nombre: string
  descripcion?: string | null
  anio_lectivo?: number | null
}

type Student = {
  id: string
  nombre_completo: string
  correo?: string | null
  dni?: string | null
  telefono?: string | null
}

interface GradesViewProps {
  userRole: string
}

export function GradesView({ userRole }: GradesViewProps) {
  const [selectedPeriod, setSelectedPeriod] = useState("current")

  const isStaffView = userRole === "teacher" || userRole === "preceptor"

  const [courses, setCourses] = useState<Course[]>([])
  const [courseLoading, setCourseLoading] = useState(false)
  const [courseError, setCourseError] = useState("")
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null)

  const [students, setStudents] = useState<Student[]>([])
  const [studentsLoading, setStudentsLoading] = useState(false)
  const [studentsError, setStudentsError] = useState("")

  useEffect(() => {
    if (!isStaffView) return

    let cancelled = false

    async function loadCourses() {
      setCourseLoading(true)
      setCourseError("")
      try {
        const res = await fetch('/api/courses', { credentials: 'include' })
        const data = await res.json().catch(() => ({}))
        if (!cancelled) {
          if (!res.ok) {
            setCourseError(data?.error || 'No se pudieron obtener los cursos')
            setCourses([])
            setSelectedCourseId(null)
          } else {
            const list = Array.isArray(data?.courses) ? data.courses : []
            setCourses(list)
            setSelectedCourseId((prev) => {
              if (prev && list.some((course: Course) => course.id === prev)) return prev
              return list.length ? list[0].id : null
            })
          }
        }
      } catch {
        if (!cancelled) {
          setCourseError('No se pudieron obtener los cursos')
          setCourses([])
          setSelectedCourseId(null)
        }
      } finally {
        if (!cancelled) {
          setCourseLoading(false)
        }
      }
    }

    loadCourses()

    return () => {
      cancelled = true
    }
  }, [isStaffView])

  useEffect(() => {
    if (!isStaffView || !selectedCourseId) {
      setStudents([])
      return
    }

    let cancelled = false

    async function loadStudents() {
      setStudentsLoading(true)
      setStudentsError("")
      try {
        const res = await fetch(`/api/course-students?course_id=${encodeURIComponent(selectedCourseId as string)}`, { credentials: 'include' })
        const data = await res.json().catch(() => ({}))
        if (!cancelled) {
          if (!res.ok) {
            setStudentsError(data?.error || 'No se pudieron obtener los estudiantes del curso')
            setStudents([])
          } else {
            setStudents(Array.isArray(data?.students) ? data.students : [])
          }
        }
      } catch {
        if (!cancelled) {
          setStudentsError('No se pudieron obtener los estudiantes del curso')
          setStudents([])
        }
      } finally {
        if (!cancelled) {
          setStudentsLoading(false)
        }
      }
    }

    loadStudents()

    return () => {
      cancelled = true
    }
  }, [isStaffView, selectedCourseId])

  const currentCourse = useMemo(() => {
    if (!selectedCourseId) return null
    return courses.find((course) => course.id === selectedCourseId) || null
  }, [courses, selectedCourseId])

  const getGradeColor = (grade: number) => {
    if (grade >= 8) return "text-green-600"
    if (grade >= 6) return "text-yellow-600"
    return "text-red-600"
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "approved":
        return "bg-green-100 text-green-800"
      case "at_risk":
        return "bg-yellow-100 text-yellow-800"
      case "failed":
        return "bg-red-100 text-red-800"
      default:
        return "bg-muted text-muted-foreground"
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "approved":
        return "Aprobado"
      case "at_risk":
        return "En Riesgo"
      case "failed":
        return "Desaprobado"
      default:
        return status
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "approved":
        return <Award className="w-4 h-4" />
      case "at_risk":
        return <AlertCircle className="w-4 h-4" />
      case "failed":
        return <AlertCircle className="w-4 h-4" />
      default:
        return <BookOpen className="w-4 h-4" />
    }
  }

  if (userRole === "student" || userRole === "parent") {
    return (
      <div className="space-y-6">
        {/* Period Selector */}
        <div className="flex items-center gap-4">
          <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="current">Período Actual</SelectItem>
              <SelectItem value="previous">Período Anterior</SelectItem>
              <SelectItem value="annual">Promedio Anual</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Overall Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Promedio General</CardTitle>
              <TrendingUp className="w-4 h-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">8.2</div>
              <Progress value={82} className="mt-2" />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Materias Aprobadas</CardTitle>
              <Award className="w-4 h-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">3/4</div>
              <Progress value={75} className="mt-2" />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">En Riesgo</CardTitle>
              <AlertCircle className="w-4 h-4 text-yellow-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">1</div>
              <p className="text-xs text-muted-foreground mt-1">Historia</p>
            </CardContent>
          </Card>
        </div>

        {/* Subjects */}
        <div className="space-y-4">
          {mockGrades.student.map((subject, index) => (
            <Card key={index}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <BookOpen className="w-5 h-5" />
                    {subject.subject}
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    <Badge className={getStatusColor(subject.status)}>{getStatusLabel(subject.status)}</Badge>
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground">Promedio</p>
                      <p className={`text-lg font-bold ${getGradeColor(subject.average)}`}>{subject.average}</p>
                    </div>
                  </div>
                </div>
              </CardHeader>

              <CardContent>
                <div className="space-y-3">
                  {subject.grades.map((grade, gradeIndex) => (
                    <div key={gradeIndex} className="flex items-center justify-between p-3 bg-accent/30 rounded-lg">
                      <div>
                        <p className="font-medium">{grade.type}</p>
                        <p className="text-sm text-muted-foreground">{grade.date}</p>
                      </div>
                      <div className="text-right">
                        <p className={`text-lg font-bold ${getGradeColor(grade.grade)}`}>{grade.grade}</p>
                        <p className="text-xs text-muted-foreground">Peso: {grade.weight}%</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  if (!isStaffView) {
    return null
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Select
          value={selectedCourseId ?? ""}
          onValueChange={(value) => setSelectedCourseId(value)}
          disabled={courseLoading || courses.length === 0}
        >
          <SelectTrigger className="w-64">
            <SelectValue placeholder={courseLoading ? "Cargando cursos..." : "Selecciona un curso"} />
          </SelectTrigger>
          <SelectContent>
            {courses.map((course) => (
              <SelectItem key={course.id} value={course.id}>
                {course.nombre}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {courseLoading && <span className="text-sm text-muted-foreground">Cargando cursos...</span>}
      </div>

      {courseError && <div className="text-sm text-destructive">{courseError}</div>}

      {courses.length === 0 && !courseLoading ? (
        <Card>
          <CardContent className="py-8 text-center text-sm text-muted-foreground">
            No hay cursos disponibles.
          </CardContent>
        </Card>
      ) : null}

      {currentCourse && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="w-5 h-5" />
              {currentCourse.nombre}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {studentsError && <div className="mb-3 text-sm text-destructive">{studentsError}</div>}
            {studentsLoading ? (
              <div className="py-6 text-center text-sm text-muted-foreground">Cargando estudiantes...</div>
            ) : students.length === 0 ? (
              <div className="py-6 text-center text-sm text-muted-foreground">Este curso aún no tiene estudiantes asignados.</div>
            ) : (
              <div className="space-y-3">
                {students.map((student) => (
                  <div
                    key={student.id}
                    className="flex items-center justify-between p-4 border border-border rounded-lg"
                  >
                    <div>
                      <p className="font-medium">{student.nombre_completo}</p>
                      <p className="text-sm text-muted-foreground">
                        {student.dni ? `${student.dni} · ` : ""}
                        {student.correo || "Sin correo"}
                      </p>
                    </div>
                    <Badge variant="outline" className="text-xs text-muted-foreground">
                      Calificaciones no registradas
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
