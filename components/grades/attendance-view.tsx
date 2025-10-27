"use client"

import { useEffect, useMemo, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Progress } from "@/components/ui/progress"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Calendar, Clock, CheckCircle, XCircle, AlertTriangle, Search, Loader2 } from "lucide-react"

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
  user?: any
}

export function AttendanceView({ userRole, user }: AttendanceViewProps) {
  const [selectedPeriod, setSelectedPeriod] = useState("current")
  
  // Estados para datos de estudiante
  const [studentAttendanceData, setStudentAttendanceData] = useState<any>(null)
  const [studentAttendanceLoading, setStudentAttendanceLoading] = useState(false)
  const [studentAttendanceError, setStudentAttendanceError] = useState("")

  const isStaffView = userRole === "teacher" || userRole === "preceptor"

  const [courses, setCourses] = useState<Course[]>([])
  const [courseLoading, setCourseLoading] = useState(false)
  const [courseError, setCourseError] = useState("")
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null)

  const [students, setStudents] = useState<Student[]>([])
  const [studentsLoading, setStudentsLoading] = useState(false)
  const [studentsError, setStudentsError] = useState("")
  const [studentSearch, setStudentSearch] = useState("")
  const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().slice(0, 10))
  const [attendanceValues, setAttendanceValues] = useState<Record<string, { status: string; observations?: string }>>({})
  const [recordsLoading, setRecordsLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState("")
  const [saveSuccess, setSaveSuccess] = useState("")

  const ATTENDANCE_OPTIONS = useMemo(
    () => [
      { value: "presente", label: "Presente" },
      { value: "llegada_tarde", label: "Llegada tarde (¼ falta)" },
      { value: "ausente", label: "Ausente (½ falta)" },
      { value: "falta_justificada", label: "Falta justificada (½ falta)" },
    ],
    []
  )

  const filteredStudents = useMemo(() => {
    if (!studentSearch.trim()) return students
    const query = studentSearch.trim().toLowerCase()
    return students.filter((student) => {
      const name = student.nombre_completo?.toLowerCase() || ""
      const email = student.correo?.toLowerCase() || ""
      const dni = student.dni?.toLowerCase() || ""
      return name.includes(query) || email.includes(query) || dni.includes(query)
    })
  }, [students, studentSearch])

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
      setAttendanceValues({})
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
    if (!isStaffView || !selectedCourseId) {
      setAttendanceValues({})
      return
    }

    let cancelled = false

    async function loadAttendance() {
      setRecordsLoading(true)
      setSaveError("")
      setSaveSuccess("")
      try {
        const query = new URLSearchParams({
          course_id: selectedCourseId!,
          date: selectedDate,
        })
        const res = await fetch(`/api/attendance?${query.toString()}`, { credentials: 'include' })
        const data = await res.json().catch(() => ({}))
        if (cancelled) return
        if (!res.ok) {
          setSaveError(data?.error || 'No se pudieron obtener asistencias del día')
          setAttendanceValues({})
          return
        }
        const mapped: Record<string, { status: string; observations?: string }> = {}
        if (Array.isArray(data?.records)) {
          data.records.forEach((record: any) => {
            if (record?.estudiante_id && typeof record?.estado === 'string') {
              mapped[record.estudiante_id] = {
                status: record.estado,
                observations: record?.observaciones || undefined,
              }
            }
          })
        }
        setAttendanceValues(mapped)
      } catch {
        if (!cancelled) {
          setSaveError('No se pudieron obtener asistencias del día')
          setAttendanceValues({})
        }
      } finally {
        if (!cancelled) {
          setRecordsLoading(false)
        }
      }
    }

    loadAttendance()

    return () => {
      cancelled = true
    }
  }, [isStaffView, selectedCourseId, selectedDate])

  // Cargar datos de asistencia para estudiantes
  useEffect(() => {
    if (isStaffView || userRole !== "student" || !user?.id) return

    let cancelled = false

    async function loadStudentAttendance() {
      setStudentAttendanceLoading(true)
      setStudentAttendanceError("")
      
      try {
        // Obtener resumen de asistencias
        const summaryRes = await fetch(`/api/attendance?summary=student&student_id=${encodeURIComponent(user.id)}`, { credentials: 'include' })
        const summaryData = await summaryRes.json().catch(() => ({}))
        
        console.log('[AttendanceView] Summary response:', { ok: summaryRes.ok, data: summaryData })
        
        if (!cancelled) {
          if (!summaryRes.ok) {
            console.error('[AttendanceView] Error en resumen:', summaryData)
            setStudentAttendanceError(summaryData?.error || 'No se pudo obtener el resumen de asistencias')
            return
          }

          const summary = Array.isArray(summaryData?.summaries) && summaryData.summaries.length > 0 
            ? summaryData.summaries[0] 
            : null

          console.log('[AttendanceView] Summary procesado:', summary)

          // Obtener registros detallados de los últimos 30 días
          const thirtyDaysAgo = new Date()
          thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
          const fromDate = thirtyDaysAgo.toISOString().slice(0, 10)
          
          const recordsRes = await fetch(`/api/attendance?student_id=${encodeURIComponent(user.id)}&from=${fromDate}&limit=50`, { credentials: 'include' })
          const recordsData = await recordsRes.json().catch(() => ({}))
          
          console.log('[AttendanceView] Records response:', { ok: recordsRes.ok, data: recordsData })
          
          if (!recordsRes.ok) {
            console.error('[AttendanceView] Error en registros:', recordsData)
            setStudentAttendanceError(recordsData?.error || 'No se pudieron obtener los registros de asistencia')
            return
          }

          const records = Array.isArray(recordsData?.records) ? recordsData.records : []
          
          console.log('[AttendanceView] Datos finales:', { summary, recordsCount: records.length })
          
          setStudentAttendanceData({
            summary,
            records,
            overall: summary ? {
              present: Number(summary.presentes || 0),
              absent: Number(summary.ausentes || 0),
              late: Number(summary.llegadas_tarde || 0),
              justified: Number(summary.faltas_justificadas || 0),
              equivalent: Number(summary.faltas_equivalentes || 0),
              total: Number(summary.total_registros || 0),
              percentage: summary.total_registros > 0 
                ? Math.round((Number(summary.presentes || 0) / Number(summary.total_registros || 1)) * 100)
                : 0
            } : null
          })
        }
      } catch (error) {
        console.error('[AttendanceView] Error catch:', error)
        if (!cancelled) {
          setStudentAttendanceError('Error al cargar datos de asistencia: ' + (error instanceof Error ? error.message : 'Error desconocido'))
        }
      } finally {
        if (!cancelled) {
          setStudentAttendanceLoading(false)
        }
      }
    }

    loadStudentAttendance()

    return () => {
      cancelled = true
    }
  }, [isStaffView, userRole, user?.id])

  const handleStatusChange = (studentId: string, status: string) => {
    setAttendanceValues((prev) => ({
      ...prev,
      [studentId]: {
        ...(prev[studentId] || {}),
        status,
      },
    }))
  }

  const handleSaveAttendance = async () => {
    if (!selectedCourseId) return

    const entries = Object.entries(attendanceValues)
      .filter(([, value]) => value?.status && ATTENDANCE_OPTIONS.some((opt) => opt.value === value.status))

    if (entries.length === 0) {
      setSaveError('Selecciona al menos una asistencia para guardar')
      return
    }

    setSaving(true)
    setSaveError("")
    setSaveSuccess("")

    try {
      const records: Record<string, { status: string; observations?: string }> = {}
      entries.forEach(([studentId, value]) => {
        if (!studentId) return
        records[studentId] = {
          status: value.status,
          observations: value.observations,
        }
      })

      const res = await fetch('/api/attendance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ courseId: selectedCourseId, date: selectedDate, records }),
      })

      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setSaveError(data?.error || 'No se pudieron guardar las asistencias')
        return
      }

      setSaveSuccess('Asistencias guardadas correctamente')
      await new Promise((resolve) => setTimeout(resolve, 400))
      // recargar registros para reflejar merges
      setAttendanceValues({})
      const query = new URLSearchParams({ course_id: selectedCourseId!, date: selectedDate })
      const reload = await fetch(`/api/attendance?${query.toString()}`, { credentials: 'include' })
      const reloadData = await reload.json().catch(() => ({}))
      if (reload.ok && Array.isArray(reloadData?.records)) {
        const mapped: Record<string, { status: string; observations?: string }> = {}
        reloadData.records.forEach((record: any) => {
          if (record?.estudiante_id && typeof record?.estado === 'string') {
            mapped[record.estudiante_id] = {
              status: record.estado,
              observations: record?.observaciones || undefined,
            }
          }
        })
        setAttendanceValues(mapped)
      }
    } catch {
      setSaveError('No se pudieron guardar las asistencias')
    } finally {
      setSaving(false)
    }
  }

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
    if (studentAttendanceLoading) {
      return (
        <div className="space-y-6">
          <div className="flex items-center justify-center py-8">
            <div className="flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span className="text-muted-foreground">Cargando datos de asistencia...</span>
            </div>
          </div>
        </div>
      )
    }

    if (studentAttendanceError) {
      return (
        <div className="space-y-6">
          <Card>
            <CardContent className="py-8 text-center">
              <div className="text-destructive mb-2">Error al cargar asistencias</div>
              <p className="text-sm text-muted-foreground">{studentAttendanceError}</p>
            </CardContent>
          </Card>
        </div>
      )
    }

    const data = studentAttendanceData?.overall
    const records = studentAttendanceData?.records || []

    // Si no hay datos en absoluto, mostrar mensaje vacío
    if (!studentAttendanceData || !data) {
      return (
        <div className="space-y-6">
          <Card>
            <CardContent className="py-8 text-center">
              <p className="text-muted-foreground">No hay registros de asistencia disponibles</p>
              <p className="text-xs text-muted-foreground mt-2">Los registros aparecerán cuando se carguen asistencias</p>
            </CardContent>
          </Card>
        </div>
      )
    }

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
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Asistencia General</CardTitle>
              <Calendar className="w-4 h-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${getAttendanceColor(data.percentage)}`}>
                {data.percentage}%
              </div>
              <Progress value={data.percentage} className="mt-2" />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Presentes</CardTitle>
              <CheckCircle className="w-4 h-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{data.present}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Ausencias</CardTitle>
              <XCircle className="w-4 h-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{data.absent}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Tardanzas</CardTitle>
              <Clock className="w-4 h-4 text-yellow-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">{data.late}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Faltas Justificadas</CardTitle>
              <AlertTriangle className="w-4 h-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{data.justified}</div>
            </CardContent>
          </Card>
        </div>

        {/* Detalle de Faltas */}
        <Card>
          <CardHeader>
            <CardTitle>Detalle de Faltas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="p-4 bg-red-50 rounded-lg border border-red-200">
                <div className="flex items-center gap-2 mb-2">
                  <XCircle className="w-4 h-4 text-red-600" />
                  <span className="font-medium text-red-800">Faltas Injustificadas</span>
                </div>
                <div className="text-2xl font-bold text-red-600">{data.absent - data.justified}</div>
                <p className="text-xs text-red-600">Equivalen a {((data.absent - data.justified) * 0.5).toFixed(1)} faltas</p>
              </div>
              
              <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle className="w-4 h-4 text-blue-600" />
                  <span className="font-medium text-blue-800">Faltas Justificadas</span>
                </div>
                <div className="text-2xl font-bold text-blue-600">{data.justified}</div>
                <p className="text-xs text-blue-600">Equivalen a {(data.justified * 0.5).toFixed(1)} faltas</p>
              </div>
              
              <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                <div className="flex items-center gap-2 mb-2">
                  <Clock className="w-4 h-4 text-yellow-600" />
                  <span className="font-medium text-yellow-800">Llegadas Tarde</span>
                </div>
                <div className="text-2xl font-bold text-yellow-600">{data.late}</div>
                <p className="text-xs text-yellow-600">Equivalen a {(data.late * 0.25).toFixed(1)} faltas</p>
              </div>
            </div>
            
            <div className="p-4 bg-accent/30 rounded-lg">
              <div className="flex items-center justify-between">
                <span className="font-medium">Total Faltas Equivalentes:</span>
                <span className="text-lg font-bold text-destructive">{data.equivalent.toFixed(2)}</span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Límite permitido: 25% del total de clases
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle>Registro Reciente de Asistencias</CardTitle>
          </CardHeader>
          <CardContent>
            {records.length === 0 ? (
              <p className="text-center text-muted-foreground py-4">No hay registros recientes</p>
            ) : (
              <div className="space-y-3">
                {records.slice(0, 10).map((record: any, index: number) => {
                  const formatDate = (dateStr: string) => {
                    try {
                      return new Date(dateStr).toLocaleDateString('es-AR', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric'
                      })
                    } catch {
                      return dateStr
                    }
                  }

                  const getStatusIcon = (estado: string) => {
                    switch (estado) {
                      case "presente":
                        return <CheckCircle className="w-4 h-4 text-green-600" />
                      case "ausente":
                        return <XCircle className="w-4 h-4 text-red-600" />
                      case "llegada_tarde":
                        return <Clock className="w-4 h-4 text-yellow-600" />
                      case "falta_justificada":
                        return <AlertTriangle className="w-4 h-4 text-blue-600" />
                      default:
                        return <AlertTriangle className="w-4 h-4" />
                    }
                  }

                  const getStatusLabel = (estado: string) => {
                    switch (estado) {
                      case "presente":
                        return "Presente"
                      case "ausente":
                        return "Ausente"
                      case "llegada_tarde":
                        return "Llegada Tarde"
                      case "falta_justificada":
                        return "Falta Justificada"
                      default:
                        return estado
                    }
                  }

                  return (
                    <div key={index} className="flex items-center justify-between p-3 border border-border rounded-lg">
                      <div className="flex items-center gap-3">
                        {getStatusIcon(record.estado)}
                        <div>
                          <p className="font-medium">{record.materia_nombre || 'Materia no especificada'}</p>
                          <p className="text-sm text-muted-foreground">{formatDate(record.fecha)}</p>
                          {record.observaciones && (
                            <p className="text-xs text-muted-foreground italic">{record.observaciones}</p>
                          )}
                        </div>
                      </div>
                      <Badge variant="secondary">{getStatusLabel(record.estado)}</Badge>
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

  if (!isStaffView) {
    return null
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:gap-4">
        <Select
          value={selectedCourseId ?? ""}
          onValueChange={(value) => setSelectedCourseId(value)}
          disabled={courseLoading || courses.length === 0}
        >
          <SelectTrigger className="w-full md:w-64">
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

        <div className="flex items-center gap-2">
          <Label htmlFor="attendance-date" className="text-sm text-muted-foreground">
            Fecha
          </Label>
          <Input
            id="attendance-date"
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="w-full md:w-auto"
            max={new Date().toISOString().slice(0, 10)}
          />
        </div>

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
            <div className="space-y-3">
              {studentsError && <div className="text-sm text-destructive">{studentsError}</div>}
              {saveError && <div className="text-sm text-destructive">{saveError}</div>}
              {saveSuccess && <div className="text-sm text-green-600">{saveSuccess}</div>}
            </div>

            {studentsLoading || recordsLoading ? (
              <div className="py-6 text-center text-sm text-muted-foreground flex items-center justify-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                Cargando estudiantes y asistencias...
              </div>
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

                {filteredStudents.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No se encontraron estudiantes.</p>
                ) : (
                  <div className="space-y-3">
                    {filteredStudents.map((student) => {
                      const current = attendanceValues[student.id]?.status || ""
                      return (
                        <div
                          key={student.id}
                          className="p-4 border border-border rounded-lg space-y-3"
                        >
                          <div className="flex flex-col gap-1 md:flex-row md:items-center md:justify-between">
                            <div>
                              <p className="font-medium">{student.nombre_completo}</p>
                              <p className="text-sm text-muted-foreground">
                                {student.dni ? `${student.dni} · ` : ""}
                                {student.correo || "Sin correo"}
                              </p>
                            </div>
                            <div className="flex flex-wrap gap-2">
                              {ATTENDANCE_OPTIONS.map((option) => (
                                <Button
                                  key={option.value}
                                  variant={current === option.value ? "default" : "outline"}
                                  size="sm"
                                  onClick={() => handleStatusChange(student.id, option.value)}
                                >
                                  {option.label}
                                </Button>
                              ))}
                            </div>
                          </div>
                          <div className="grid gap-2 md:grid-cols-[1fr,auto] md:items-center">
                            <Input
                              placeholder="Observaciones (opcional)"
                              value={attendanceValues[student.id]?.observations || ""}
                              onChange={(e) =>
                                setAttendanceValues((prev) => ({
                                  ...prev,
                                  [student.id]: {
                                    ...(prev[student.id] || {}),
                                    observations: e.target.value,
                                  },
                                }))
                              }
                            />
                            {current ? (
                              <Badge variant="outline" className="justify-self-start md:justify-self-end">
                                {ATTENDANCE_OPTIONS.find((opt) => opt.value === current)?.label || current}
                              </Badge>
                            ) : (
                              <span className="text-xs text-muted-foreground md:text-right">Sin registro</span>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            )}
          </CardContent>
          {students.length > 0 && (
            <div className="flex justify-end gap-2 border-t border-border px-6 py-4">
              <Button variant="outline" onClick={() => setAttendanceValues({})} disabled={saving}>
                Limpiar seleccionados
              </Button>
              <Button onClick={handleSaveAttendance} disabled={saving} className="gap-2">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                {saving ? 'Guardando…' : 'Guardar asistencias'}
              </Button>
            </div>
          )}
        </Card>
      )}
    </div>
  )
}
