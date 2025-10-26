"use client"

import { useEffect, useMemo, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Progress } from "@/components/ui/progress"
import { Calendar, Clock, CheckCircle, XCircle, AlertTriangle, Search } from "lucide-react"

const mockAttendance = {
  student: {
    overall: {
      present: 85,
      absent: 12,
      late: 8,
      percentage: 89.5,
    },
    subjects: [
      {
        subject: "Matemática",
        present: 22,
        absent: 2,
        late: 1,
        percentage: 92,
        status: "good",
      },
      {
        subject: "Lengua",
        present: 20,
        absent: 3,
        late: 2,
        percentage: 88,
        status: "warning",
      },
      {
        subject: "Historia",
        present: 18,
        absent: 4,
        late: 3,
        percentage: 84,
        status: "warning",
      },
      {
        subject: "Ciencias Naturales",
        present: 25,
        absent: 1,
        late: 0,
        percentage: 96,
        status: "excellent",
      },
    ],
    recent: [
      { date: "2025-01-22", subject: "Matemática", status: "present" },
      { date: "2025-01-22", subject: "Lengua", status: "late" },
      { date: "2025-01-21", subject: "Historia", status: "absent" },
      { date: "2025-01-21", subject: "Ciencias Naturales", status: "present" },
      { date: "2025-01-20", subject: "Matemática", status: "present" },
    ],
  },
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

interface AttendanceViewProps {
  userRole: string
}

export function AttendanceView({ userRole }: AttendanceViewProps) {
  const [selectedPeriod, setSelectedPeriod] = useState("current")

  const isStaffView = userRole === "teacher" || userRole === "preceptor"

  const [courses, setCourses] = useState<Course[]>([])
  const [courseLoading, setCourseLoading] = useState(false)
  const [courseError, setCourseError] = useState("")
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null)

  const [students, setStudents] = useState<Student[]>([])
  const [studentsLoading, setStudentsLoading] = useState(false)
  const [studentsError, setStudentsError] = useState("")
  const [studentSearch, setStudentSearch] = useState("")

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

  const getAttendanceColor = (percentage: number) => {
    if (percentage >= 90) return "text-green-600"
    if (percentage >= 80) return "text-yellow-600"
    return "text-red-600"
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "excellent":
        return "bg-green-100 text-green-800"
      case "good":
        return "bg-blue-100 text-blue-800"
      case "warning":
        return "bg-yellow-100 text-yellow-800"
      case "at_risk":
        return "bg-red-100 text-red-800"
      default:
        return "bg-muted text-muted-foreground"
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "excellent":
        return "Excelente"
      case "good":
        return "Bueno"
      case "warning":
        return "Atención"
      case "at_risk":
        return "En Riesgo"
      default:
        return status
    }
  }

  const getAttendanceIcon = (status: string) => {
    switch (status) {
      case "present":
        return <CheckCircle className="w-4 h-4 text-green-600" />
      case "absent":
        return <XCircle className="w-4 h-4 text-red-600" />
      case "late":
        return <Clock className="w-4 h-4 text-yellow-600" />
      default:
        return <AlertTriangle className="w-4 h-4" />
    }
  }

  const getAttendanceLabel = (status: string) => {
    switch (status) {
      case "present":
        return "Presente"
      case "absent":
        return "Ausente"
      case "late":
        return "Tardanza"
      default:
        return status
    }
  }

  if (userRole === "student" || userRole === "parent") {
    const data = mockAttendance.student

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
              <SelectItem value="annual">Anual</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Overall Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Asistencia General</CardTitle>
              <Calendar className="w-4 h-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${getAttendanceColor(data.overall.percentage)}`}>
                {data.overall.percentage}%
              </div>
              <Progress value={data.overall.percentage} className="mt-2" />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Presentes</CardTitle>
              <CheckCircle className="w-4 h-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{data.overall.present}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Ausencias</CardTitle>
              <XCircle className="w-4 h-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{data.overall.absent}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Tardanzas</CardTitle>
              <Clock className="w-4 h-4 text-yellow-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">{data.overall.late}</div>
            </CardContent>
          </Card>
        </div>

        {/* By Subject */}
        <Card>
          <CardHeader>
            <CardTitle>Asistencia por Materia</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {data.subjects.map((subject, index) => (
                <div key={index} className="flex items-center justify-between p-4 bg-accent/30 rounded-lg">
                  <div>
                    <p className="font-medium">{subject.subject}</p>
                    <Badge className={`${getStatusColor(subject.status)} text-xs mt-1`}>
                      {getStatusLabel(subject.status)}
                    </Badge>
                  </div>
                  <div className="text-right">
                    <p className={`text-lg font-bold ${getAttendanceColor(subject.percentage)}`}>
                      {subject.percentage}%
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {subject.present}P / {subject.absent}A / {subject.late}T
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle>Registro Reciente</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {data.recent.map((record, index) => (
                <div key={index} className="flex items-center justify-between p-3 border border-border rounded-lg">
                  <div className="flex items-center gap-3">
                    {getAttendanceIcon(record.status)}
                    <div>
                      <p className="font-medium">{record.subject}</p>
                      <p className="text-sm text-muted-foreground">{record.date}</p>
                    </div>
                  </div>
                  <Badge variant="secondary">{getAttendanceLabel(record.status)}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
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
              <Calendar className="w-5 h-5" />
              Asistencia - {currentCourse.nombre}
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
                <div className="relative max-w-sm">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input
                    className="w-full rounded-md border border-input bg-background px-9 py-2 text-sm"
                    placeholder="Buscar por nombre, email o DNI..."
                    value={studentSearch}
                    onChange={(e) => setStudentSearch(e.target.value)}
                  />
                </div>

                {students
                  .filter((student) => {
                    if (!studentSearch.trim()) return true
                    const query = studentSearch.trim().toLowerCase()
                    const name = student.nombre_completo?.toLowerCase() || ''
                    const email = student.correo?.toLowerCase() || ''
                    const dni = student.dni?.toLowerCase() || ''
                    return name.includes(query) || email.includes(query) || dni.includes(query)
                  })
                  .map((student) => (
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
                        Asistencia no registrada
                      </Badge>
                    </div>
                  ))}

                {students.length > 0 && students.filter((student) => {
                  if (!studentSearch.trim()) return true
                  const query = studentSearch.trim().toLowerCase()
                  const name = student.nombre_completo?.toLowerCase() || ''
                  const email = student.correo?.toLowerCase() || ''
                  const dni = student.dni?.toLowerCase() || ''
                  return name.includes(query) || email.includes(query) || dni.includes(query)
                }).length === 0 && (
                  <p className="text-sm text-muted-foreground">No se encontraron estudiantes.</p>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
