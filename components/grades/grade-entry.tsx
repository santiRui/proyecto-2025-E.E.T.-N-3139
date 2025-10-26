"use client"

import { useEffect, useMemo, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Save, Users, BookOpen } from "lucide-react"

const gradeTypes = [
  "Parcial",
  "Trabajo Práctico",
  "Oral",
  "Laboratorio",
  "Proyecto",
  "Participación",
  "Ensayo",
  "Informe",
]

interface GradeEntryProps {
  userRole: string
}

export function GradeEntry({ userRole }: GradeEntryProps) {
  const isStaffView = userRole === "teacher" || userRole === "preceptor"

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
  }

  const [courses, setCourses] = useState<Course[]>([])
  const [courseLoading, setCourseLoading] = useState(false)
  const [courseError, setCourseError] = useState("")
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null)

  const [students, setStudents] = useState<Student[]>([])
  const [studentsLoading, setStudentsLoading] = useState(false)
  const [studentsError, setStudentsError] = useState("")
  const [studentSearch, setStudentSearch] = useState("")

  const currentCourse = useMemo(() => {
    if (!selectedCourseId) return null
    return courses.find((course) => course.id === selectedCourseId) || null
  }, [courses, selectedCourseId])

  const [selectedSubject, setSelectedSubject] = useState("Matemática")
  const [assignedSubjects, setAssignedSubjects] = useState<Array<{ id: string; nombre: string }>>([])
  const isTeacher = userRole === "teacher"
  const [gradeType, setGradeType] = useState("")
  const [gradeDate, setGradeDate] = useState("")
  const [gradeWeight, setGradeWeight] = useState("")
  const [observations, setObservations] = useState("")
  const [studentGrades, setStudentGrades] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState("")
  const [saveSuccess, setSaveSuccess] = useState("")

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

  // Load subjects assigned to the logged-in teacher (global, without course)
  useEffect(() => {
    if (!isTeacher) return
    let cancelled = false
    ;(async () => {
      try {
        const res = await fetch('/api/subject-teachers?teacher=me', { credentials: 'include' })
        const data = await res.json().catch(() => ({}))
        if (!cancelled) {
          const list = Array.isArray(data?.subjects) ? data.subjects : []
          setAssignedSubjects(list)
          // set default selected subject if available
          setSelectedSubject((prev) => {
            if (prev && list.some((s: any) => s.nombre === prev)) return prev
            return list.length ? list[0].nombre : ""
          })
        }
      } catch {
        if (!cancelled) setAssignedSubjects([])
      }
    })()
    return () => { cancelled = true }
  }, [isTeacher])

  useEffect(() => {
    if (!isStaffView || !selectedCourseId) {
      setStudents([])
      setStudentGrades({})
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
            setStudentGrades({})
          } else {
            const list = Array.isArray(data?.students) ? data.students : []
            setStudents(list)
            setStudentGrades({})
          }
        }
      } catch {
        if (!cancelled) {
          setStudentsError('No se pudieron obtener los estudiantes del curso')
          setStudents([])
          setStudentGrades({})
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

  const handleGradeChange = (studentId: string, grade: string) => {
    setStudentGrades((prev) => ({
      ...prev,
      [studentId]: grade,
    }))
  }

  const handleSaveGrades = async () => {
    if (!currentCourse || !selectedCourseId) return

    setSaving(true)
    setSaveError("")
    setSaveSuccess("")

    try {
      const payload = {
        courseId: selectedCourseId,
        subject: selectedSubject,
        type: gradeType,
        date: gradeDate,
        weight: gradeWeight,
        observations,
        grades: studentGrades,
      }

      const res = await fetch('/api/grades', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload),
      })

      const data = await res.json().catch(() => ({}))

      if (!res.ok) {
        setSaveError(data?.error || 'No se pudieron guardar las calificaciones')
        return
      }

      setSaveSuccess('Calificaciones guardadas exitosamente')

      setGradeType("")
      setGradeDate("")
      setGradeWeight("")
      setObservations("")
      setStudentGrades({})
    } catch {
      setSaveError('No se pudieron guardar las calificaciones')
    } finally {
      setSaving(false)
    }
  }

  const getGradeColor = (grade: string) => {
    const numGrade = Number.parseFloat(grade)
    if (isNaN(numGrade)) return ""
    if (numGrade >= 8) return "text-green-600"
    if (numGrade >= 6) return "text-yellow-600"
    return "text-red-600"
  }

  const isFormValid = () => {
    return (
      selectedCourseId &&
      selectedSubject &&
      gradeType &&
      gradeDate &&
      gradeWeight &&
      Object.keys(studentGrades).length > 0
    )
  }

  if (!isStaffView) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Sin acceso</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Solo docentes y preceptores pueden cargar calificaciones.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="w-5 h-5" />
            Configuración de Evaluación
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="course">Curso</Label>
              <Select
                value={selectedCourseId ?? ""}
                onValueChange={(value) => setSelectedCourseId(value)}
                disabled={courseLoading || courses.length === 0}
              >
                <SelectTrigger>
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
              {courseError && <p className="text-xs text-destructive">{courseError}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="subject">Materia</Label>
              <Select
                value={selectedSubject}
                onValueChange={setSelectedSubject}
                disabled={isTeacher && assignedSubjects.length === 0}
              >
                <SelectTrigger>
                  <SelectValue placeholder={isTeacher ? (assignedSubjects.length === 0 ? "No tienes materias asignadas" : undefined) : undefined} />
                </SelectTrigger>
                <SelectContent>
                  {isTeacher
                    ? assignedSubjects.map((s) => (
                        <SelectItem key={s.id} value={s.nombre}>{s.nombre}</SelectItem>
                      ))
                    : (
                      <>
                        <SelectItem value="Matemática">Matemática</SelectItem>
                        <SelectItem value="Lengua">Lengua</SelectItem>
                        <SelectItem value="Historia">Historia</SelectItem>
                        <SelectItem value="Ciencias Naturales">Ciencias Naturales</SelectItem>
                      </>
                    )}
                </SelectContent>
              </Select>
              {isTeacher && assignedSubjects.length === 0 && (
                <p className="text-xs text-muted-foreground">No tienes materias asignadas. Contacta a un preceptor/directivo/administrador.</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="gradeType">Tipo de Evaluación</Label>
              <Select value={gradeType} onValueChange={setGradeType}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar tipo" />
                </SelectTrigger>
                <SelectContent>
                  {gradeTypes.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="gradeDate">Fecha</Label>
              <Input id="gradeDate" type="date" value={gradeDate} onChange={(e) => setGradeDate(e.target.value)} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="gradeWeight">Peso (%)</Label>
              <Input
                id="gradeWeight"
                type="number"
                min="1"
                max="100"
                placeholder="Ej: 40"
                value={gradeWeight}
                onChange={(e) => setGradeWeight(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="observations">Observaciones (Opcional)</Label>
            <Textarea
              id="observations"
              placeholder="Comentarios sobre la evaluación..."
              value={observations}
              onChange={(e) => setObservations(e.target.value)}
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

      {/* Grade Entry */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Cargar Calificaciones {currentCourse ? `- ${currentCourse.nombre}` : ""}
          </CardTitle>
          {gradeType && (
            <div className="flex items-center gap-2">
              <Badge variant="secondary">{gradeType}</Badge>
              <Badge variant="outline">{gradeDate}</Badge>
              <Badge variant="outline">Peso: {gradeWeight}%</Badge>
            </div>
          )}
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {studentsError && <p className="text-sm text-destructive">{studentsError}</p>}
            {saveError && <p className="text-sm text-destructive">{saveError}</p>}
            {saveSuccess && <p className="text-sm text-green-600">{saveSuccess}</p>}

            {studentsLoading ? (
              <div className="py-6 text-center text-sm text-muted-foreground">Cargando estudiantes...</div>
            ) : students.length === 0 ? (
              <div className="py-6 text-center text-sm text-muted-foreground">
                {selectedCourseId
                  ? "Este curso aún no tiene estudiantes asignados."
                  : "Selecciona un curso para comenzar."}
              </div>
            ) : (
              <div className="space-y-2">
                <h4 className="font-semibold text-foreground">Cargar Calificaciones {currentCourse ? `- ${currentCourse.nombre}` : ""}</h4>
                {studentsLoading && <p className="text-sm text-muted-foreground">Cargando estudiantes...</p>}
                {studentsError && <p className="text-sm text-destructive">{studentsError}</p>}

                {!studentsLoading && students.length > 0 && (
                  <div className="relative max-w-sm">
                    <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="student-search"
                      placeholder="Buscar por nombre, email o DNI..."
                      value={studentSearch}
                      onChange={(e) => setStudentSearch(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                )}

                <div className="space-y-3">
                  {students
                    .filter((student) => {
                      if (!studentSearch.trim()) return true
                      const query = studentSearch.trim().toLowerCase()
                      const name = student.nombre_completo?.toLowerCase() || ""
                      const email = student.correo?.toLowerCase() || ""
                      const dni = student.dni?.toLowerCase() || ""
                      return name.includes(query) || email.includes(query) || dni.includes(query)
                    })
                    .map((student) => (
                      <div key={student.id} className="p-3 border border-border rounded-lg flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                        <div className="space-y-1">
                          <p className="font-medium text-foreground flex items-center gap-2">
                            <Users className="w-4 h-4 text-primary" />
                            {student.nombre_completo}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {student.dni ? `${student.dni} · ` : ""}
                            {student.correo || "Sin correo"}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Input
                            type="number"
                            min="1"
                            max="10"
                            step="0.1"
                            placeholder="Nota"
                            className={`w-20 text-center ${getGradeColor(studentGrades[student.id] || "")}`}
                            value={studentGrades[student.id] || ""}
                            onChange={(e) => handleGradeChange(student.id, e.target.value)}
                          />
                          <span className="text-sm text-muted-foreground">/10</span>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            )}

            <div className="flex justify-end pt-4">
              <Button onClick={handleSaveGrades} disabled={!isFormValid() || saving} className="gap-2">
                <Save className="w-4 h-4" />
                {saving ? 'Guardando…' : 'Guardar Calificaciones'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
