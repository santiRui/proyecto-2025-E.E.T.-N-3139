"use client"

import { useEffect, useMemo, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Progress } from "@/components/ui/progress"
import { BookOpen, TrendingUp, Award, AlertCircle, Users } from "lucide-react"

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

type GradeRecord = {
  id: string
  curso_id: string
  curso_nombre: string
  estudiante_id: string
  estudiante_nombre: string
  materia_nombre: string
  tipo_evaluacion: string
  fecha: string
  peso: number | null
  calificacion: number
  observaciones: string | null
  creado_por: string
  creado_por_nombre: string
  creado_en: string
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
  const [grades, setGrades] = useState<GradeRecord[]>([])
  const [gradesLoading, setGradesLoading] = useState(false)
  const [gradesError, setGradesError] = useState("")

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

  useEffect(() => {
    if (!isStaffView) return
    if (!selectedCourseId) {
      setGrades([])
      return
    }

    let cancelled = false

    async function loadGrades() {
      setGradesLoading(true)
      setGradesError("")
      try {
        const res = await fetch(`/api/grades?course_id=${encodeURIComponent(selectedCourseId as string)}`, { credentials: 'include' })
        const data = await res.json().catch(() => ({}))
        if (!cancelled) {
          if (!res.ok) {
            setGradesError(data?.error || 'No se pudieron obtener las calificaciones')
            setGrades([])
          } else {
            setGrades(Array.isArray(data?.grades) ? data.grades : [])
          }
        }
      } catch {
        if (!cancelled) {
          setGradesError('No se pudieron obtener las calificaciones')
          setGrades([])
        }
      } finally {
        if (!cancelled) {
          setGradesLoading(false)
        }
      }
    }

    loadGrades()

    return () => {
      cancelled = true
    }
  }, [isStaffView, selectedCourseId])

  useEffect(() => {
    if (isStaffView) return

    let cancelled = false

    async function loadMyGrades() {
      setGradesLoading(true)
      setGradesError("")
      try {
        const res = await fetch('/api/grades', { credentials: 'include' })
        const data = await res.json().catch(() => ({}))
        if (!cancelled) {
          if (!res.ok) {
            setGradesError(data?.error || 'No se pudieron obtener las calificaciones')
            setGrades([])
          } else {
            setGrades(Array.isArray(data?.grades) ? data.grades : [])
          }
        }
      } catch {
        if (!cancelled) {
          setGradesError('No se pudieron obtener las calificaciones')
          setGrades([])
        }
      } finally {
        if (!cancelled) {
          setGradesLoading(false)
        }
      }
    }

    loadMyGrades()

    return () => {
      cancelled = true
    }
  }, [isStaffView])

  const currentCourse = useMemo(() => {
    if (!selectedCourseId) return null
    return courses.find((course) => course.id === selectedCourseId) || null
  }, [courses, selectedCourseId])

  const computeAverage = (list: GradeRecord[]) => {
    if (!list.length) return 0
    let weightedSum = 0
    let totalWeight = 0
    let sum = 0

    list.forEach((grade) => {
      const gradeValue = Number(grade.calificacion)
      sum += gradeValue
      const weight = grade.peso == null ? 0 : Number(grade.peso)
      if (!Number.isNaN(weight) && weight > 0) {
        weightedSum += gradeValue * weight
        totalWeight += weight
      }
    })

    if (totalWeight > 0) {
      return weightedSum / totalWeight
    }

    return sum / list.length
  }

  const determineStatus = (average: number): 'approved' | 'at_risk' | 'failed' => {
    if (average >= 8) return 'approved'
    if (average >= 6) return 'at_risk'
    return 'failed'
  }

  const gradesBySubject = useMemo(() => {
    return grades.reduce<Record<string, GradeRecord[]>>((acc, grade) => {
      const subject = grade.materia_nombre || 'Sin materia'
      if (!acc[subject]) acc[subject] = []
      acc[subject].push(grade)
      return acc
    }, {})
  }, [grades])

  type SubjectSummary = {
    subject: string
    grades: GradeRecord[]
    average: number
    status: 'approved' | 'at_risk' | 'failed'
  }

  const subjectSummaries = useMemo<SubjectSummary[]>(() => {
    return Object.entries(gradesBySubject)
      .map(([subject, list]) => {
        const average = computeAverage(list)
        return {
          subject,
          grades: list,
          average,
          status: determineStatus(average),
        }
      })
      .sort((a, b) => a.subject.localeCompare(b.subject))
  }, [gradesBySubject])

  const overallAverage = useMemo(() => {
    if (!grades.length) return null
    return computeAverage(grades)
  }, [grades])

  const approvedSubjectCount = useMemo(() => {
    return subjectSummaries.filter((summary) => summary.status === 'approved').length
  }, [subjectSummaries])

  const atRiskSubjects = useMemo(() => {
    return subjectSummaries.filter((summary) => summary.status === 'at_risk')
  }, [subjectSummaries])

  const gradesByStudent = useMemo(() => {
    return grades.reduce<Record<string, GradeRecord[]>>((acc, grade) => {
      if (!acc[grade.estudiante_id]) acc[grade.estudiante_id] = []
      acc[grade.estudiante_id].push(grade)
      return acc
    }, {})
  }, [grades])

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

  const renderStudentParentView = () => {
    return (
      <div className="space-y-6">
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

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Promedio General</CardTitle>
              <TrendingUp className="w-4 h-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${overallAverage ? getGradeColor(overallAverage) : "text-muted-foreground"}`}>
                {overallAverage ? overallAverage.toFixed(2) : "-"}
              </div>
              <Progress value={overallAverage ? Math.min(100, (overallAverage / 10) * 100) : 0} className="mt-2" />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Materias Aprobadas</CardTitle>
              <Award className="w-4 h-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{approvedSubjectCount}</div>
              <Progress
                value={subjectSummaries.length ? (approvedSubjectCount / subjectSummaries.length) * 100 : 0}
                className="mt-2"
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Materias en Riesgo</CardTitle>
              <AlertCircle className="w-4 h-4 text-yellow-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">{atRiskSubjects.length}</div>
            </CardContent>
          </Card>
        </div>

        {gradesLoading ? (
          <div className="text-sm text-muted-foreground">Cargando calificaciones...</div>
        ) : gradesError ? (
          <div className="text-sm text-destructive">{gradesError}</div>
        ) : subjectSummaries.length === 0 ? (
          <div className="text-sm text-muted-foreground">No hay calificaciones registradas.</div>
        ) : (
          <div className="space-y-4">
            {subjectSummaries.map((summary) => (
              <Card key={summary.subject}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <BookOpen className="w-5 h-5" />
                      {summary.subject}
                    </CardTitle>
                    <div className="flex items-center gap-2">
                      <Badge className={getStatusColor(summary.status)}>{getStatusLabel(summary.status)}</Badge>
                      <div className="text-right">
                        <p className="text-sm text-muted-foreground">Promedio</p>
                        <p className={`text-lg font-bold ${getGradeColor(summary.average)}`}>
                          {summary.average.toFixed(2)}
                        </p>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {summary.grades.map((grade) => (
                      <div key={grade.id} className="flex items-center justify-between p-3 bg-accent/30 rounded-lg">
                        <div>
                          <p className="font-medium">{grade.tipo_evaluacion}</p>
                          <p className="text-sm text-muted-foreground">{grade.fecha}</p>
                        </div>
                        <div className="text-right">
                          <p className={`text-lg font-bold ${getGradeColor(grade.calificacion)}`}>{grade.calificacion}</p>
                          <p className="text-xs text-muted-foreground">Peso: {grade.peso ?? 0}%</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    )
  }

  const renderStaffView = () => {
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

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>{currentCourse ? `Estudiantes (${students.length})` : "Estudiantes"}</span>
                <Users className="w-4 h-4 text-muted-foreground" />
              </CardTitle>
            </CardHeader>
            <CardContent>
              {studentsLoading ? (
                <div className="text-sm text-muted-foreground">Cargando estudiantes...</div>
              ) : students.length === 0 ? (
                <div className="text-sm text-muted-foreground">No hay estudiantes asignados.</div>
              ) : (
                <ul className="space-y-2">
                  {students.map((student) => (
                    <li key={student.id} className="flex items-center justify-between">
                      <span className="font-medium text-sm">{student.nombre_completo}</span>
                      <Badge variant="outline">{student.dni || "Sin DNI"}</Badge>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>

          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Resumen de Calificaciones</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 bg-accent/30 rounded-lg">
                  <p className="text-sm text-muted-foreground">Promedio General</p>
                  <p className={`text-2xl font-bold ${overallAverage ? getGradeColor(overallAverage) : ""}`}>
                    {overallAverage ? overallAverage.toFixed(2) : "-"}
                  </p>
                </div>
                <div className="p-4 bg-accent/30 rounded-lg">
                  <p className="text-sm text-muted-foreground">Materias Aprobadas</p>
                  <p className="text-2xl font-bold">{approvedSubjectCount}</p>
                </div>
                <div className="p-4 bg-accent/30 rounded-lg">
                  <p className="text-sm text-muted-foreground">Materias en Riesgo</p>
                  <p className="text-2xl font-bold text-yellow-600">{atRiskSubjects.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Detalle por Estudiante</CardTitle>
          </CardHeader>
          <CardContent>
            {gradesLoading ? (
              <div className="text-sm text-muted-foreground">Cargando calificaciones...</div>
            ) : gradesError ? (
              <div className="text-sm text-destructive">{gradesError}</div>
            ) : grades.length === 0 ? (
              <div className="text-sm text-muted-foreground">No hay calificaciones registradas para este curso.</div>
            ) : (
              <div className="space-y-4">
                {Object.entries(gradesByStudent).map(([studentId, studentGrades]) => {
                  const studentInfo = students.find((s) => s.id === studentId)
                  const average = computeAverage(studentGrades)
                  return (
                    <div key={studentId} className="border border-border rounded-lg">
                      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 p-4 bg-accent/30">
                        <div>
                          <p className="font-semibold">{studentInfo?.nombre_completo || "Estudiante"}</p>
                          <p className="text-xs text-muted-foreground">{studentInfo?.dni ? `DNI: ${studentInfo.dni}` : "Sin DNI"}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-muted-foreground">Promedio</p>
                          <p className={`text-xl font-bold ${getGradeColor(average)}`}>{average.toFixed(2)}</p>
                        </div>
                      </div>
                      <div className="divide-y">
                        {studentGrades.map((grade) => (
                          <div key={grade.id} className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4">
                            <div>
                              <p className="font-medium">{grade.materia_nombre}</p>
                              <p className="text-xs text-muted-foreground">{grade.tipo_evaluacion}</p>
                            </div>
                            <div>
                              <p className="text-sm text-muted-foreground">Fecha</p>
                              <p className="font-medium">{grade.fecha}</p>
                            </div>
                            <div>
                              <p className="text-sm text-muted-foreground">Peso</p>
                              <p className="font-medium">{grade.peso ?? 0}%</p>
                            </div>
                            <div className="text-right">
                              <p className="text-sm text-muted-foreground">Calificación</p>
                              <p className={`text-xl font-semibold ${getGradeColor(grade.calificacion)}`}>{grade.calificacion}</p>
                            </div>
                            {grade.observaciones && (
                              <div className="md:col-span-4 bg-muted/50 rounded p-3 text-sm text-muted-foreground">
                                {grade.observaciones}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    )
  }

  if (userRole === "student" || userRole === "parent") {
    return renderStudentParentView()
  }

  if (!isStaffView) {
    return null
  }

  return renderStaffView()
}
