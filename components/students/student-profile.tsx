"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { User, Mail, Phone, MapPin, Calendar, BookOpen, TrendingUp, Clock, Plus, Trash2 } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"

type GradeRecord = {
  id: string
  materia_nombre: string | null
  tipo_evaluacion: string | null
  fecha: string | null
  peso: number | null
  calificacion: number | null
  observaciones?: string | null
}

type AttendanceSummary = {
  estudiante_id: string
  curso_id: string | null
  total_registros: number
  presentes: number
  llegadas_tarde: number
  ausentes: number
  faltas_justificadas: number
  faltas_equivalentes: number
  porcentaje_asistencia: number
}

type StudentWithGrades = {
  id: string
  name: string
  email: string
  phone: string
  course: string
  courseId?: string | null
  status: string
  faltas: number | null
  average: number | null
  grades: GradeRecord[]
  photo?: string | null
  courseSubjects?: Array<{ id: string | null; nombre: string | null }>
  attendanceSummary?: AttendanceSummary | null
}

interface StudentProfileProps {
  student: StudentWithGrades
  userRole: string
  userDbRole?: string
}

export function StudentProfile({ student, userRole, userDbRole }: StudentProfileProps) {
  const canManageTutors = userRole === "preceptor" || userDbRole === 'directivo'
  const [allTutors, setAllTutors] = useState<any[]>([])
  const [studentTutors, setStudentTutors] = useState<any[]>([])
  const [selectedTutor, setSelectedTutor] = useState<string>("")
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState("")
  const [searching, setSearching] = useState(false)
  const [courseSubjects, setCourseSubjects] = useState<Array<{ id: string | null; nombre: string | null }>>(
    () => (Array.isArray(student.courseSubjects) ? student.courseSubjects : [])
  )

  useEffect(() => {
    setCourseSubjects(Array.isArray(student.courseSubjects) ? student.courseSubjects : [])

    const courseId = student.courseId ?? null
    if (!courseId) return

    ;(async () => {
      try {
        const res = await fetch(`/api/course-subjects?course_id=${encodeURIComponent(String(courseId))}`, {
          credentials: 'include',
        })
        const data = await res.json().catch(() => ({}))
        if (res.ok) {
          const subjects = Array.isArray(data?.subjects)
            ? data.subjects.map((s: any) => ({ id: s.id ?? s.materia_id ?? null, nombre: s.nombre ?? null }))
            : []
          setCourseSubjects(subjects)
        }
      } catch {
        // ignore: keep previous subjects
      }
    })()
  }, [student.courseId, student.id, student.courseSubjects])

  useEffect(() => {
    if (!canManageTutors) return
    ;(async () => {
      try {
        const [tRes, sRes] = await Promise.all([
          fetch('/api/tutors', { credentials: 'include' }),
          fetch(`/api/student-tutors?student_id=${encodeURIComponent(student.id)}`, { credentials: 'include' }),
        ])
        const tData = await tRes.json().catch(() => ({}))
        const sData = await sRes.json().catch(() => ({}))
        if (tRes.ok) setAllTutors(tData.tutors || [])
        if (sRes.ok) setStudentTutors(sData.tutors || [])
      } catch {}
    })()
  }, [student?.id, canManageTutors])

  async function addTutor() {
    if (!selectedTutor) return
    try {
      const res = await fetch('/api/student-tutors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ student_id: student.id, tutor_id: selectedTutor }),
      })
      if (res.ok) {
        setSelectedTutor("")
        setOpen(false)
        const r = await fetch(`/api/student-tutors?student_id=${encodeURIComponent(student.id)}`, { credentials: 'include' })
        const d = await r.json().catch(() => ({}))
        if (r.ok) setStudentTutors(d.tutors || [])
      }
    } catch {}
  }

  async function removeTutor(tutorId: string) {
    try {
      const res = await fetch(`/api/student-tutors?student_id=${encodeURIComponent(student.id)}&tutor_id=${encodeURIComponent(tutorId)}`, {
        method: 'DELETE',
        credentials: 'include',
      })
      if (res.ok) {
        setStudentTutors((prev) => prev.filter((t) => t.id !== tutorId))
      }
    } catch {}
  }
  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800"
      case "warning":
        return "bg-yellow-100 text-yellow-800"
      case "inactive":
        return "bg-red-100 text-red-800"
      default:
        return "bg-muted text-muted-foreground"
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "active":
        return "Activo"
      case "warning":
        return "Requiere Atención"
      case "inactive":
        return "Inactivo"
      default:
        return status
    }
  }

  const computeAverage = (grades: GradeRecord[]) => {
    if (!Array.isArray(grades) || grades.length === 0) return null
    let weightedSum = 0
    let totalWeight = 0
    let sum = 0

    grades.forEach((grade) => {
      const value = Number(grade?.calificacion)
      if (Number.isNaN(value)) return
      sum += value
      const weight = grade?.peso == null ? 0 : Number(grade.peso)
      if (!Number.isNaN(weight) && weight > 0) {
        weightedSum += value * weight
        totalWeight += weight
      }
    })

    if (totalWeight > 0) return weightedSum / totalWeight
    return sum / grades.length
  }

  const grades = Array.isArray(student.grades) ? student.grades : []
  const assignedSubjects = courseSubjects

  type SubjectSummary = {
    subjectKey: string
    subjectName: string
    grades: GradeRecord[]
    average: number | null
    assignedOnly: boolean
  }

  const subjectsMap = new Map<string, SubjectSummary>()

  assignedSubjects.forEach((subject) => {
    const key = subject?.nombre || subject?.id || 'Sin materia'
    if (!subjectsMap.has(key)) {
      subjectsMap.set(key, {
        subjectKey: key,
        subjectName: subject?.nombre || 'Sin materia',
        grades: [],
        average: null,
        assignedOnly: true,
      })
    }
  })

  grades.forEach((grade) => {
    const subjectName = grade.materia_nombre || 'Sin materia'
    const key = subjectName
    if (!subjectsMap.has(key)) {
      subjectsMap.set(key, {
        subjectKey: key,
        subjectName,
        grades: [],
        average: null,
        assignedOnly: false,
      })
    }
    const summary = subjectsMap.get(key)!
    summary.grades.push(grade)
    summary.average = computeAverage(summary.grades)
    summary.assignedOnly = false
  })

  const subjectSummaries: SubjectSummary[] = Array.from(subjectsMap.values())
    .map((summary) => ({
      ...summary,
      average: summary.average != null ? summary.average : computeAverage(summary.grades),
    }))
    .sort((a, b) => a.subjectName.localeCompare(b.subjectName))

  const recentGrades = [...grades]
    .filter((grade): grade is GradeRecord & { fecha: string } => typeof grade.fecha === 'string')
    .sort((a, b) => (b.fecha ?? '').localeCompare(a.fecha ?? ''))
    .slice(0, 5)

  const formatAverage = (value: number | null | undefined) => {
    if (value == null || Number.isNaN(value)) return '—'
    return value.toFixed(2)
  }

  const formatGradeValue = (value: number | null | undefined) => {
    if (value == null || Number.isNaN(value)) return '—'
    return Number(value).toFixed(1)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <User className="w-5 h-5" />
          Perfil del Estudiante
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Basic Info */}
        <div className="text-center space-y-4">
          <Avatar className="w-20 h-20 mx-auto">
            <AvatarImage src={student.photo || "/placeholder.svg"} alt={student.name} />
            <AvatarFallback className="bg-primary text-primary-foreground text-lg">
              {student.name
                .split(" ")
                .map((n: string) => n[0])
                .join("")}
            </AvatarFallback>
          </Avatar>

          <div>
            <h3 className="text-xl font-semibold text-foreground">{student.name}</h3>
            <p className="text-muted-foreground">{student.course}</p>
            <Badge className={`mt-2 ${getStatusColor(student.status)}`}>{getStatusLabel(student.status)}</Badge>
          </div>
        </div>

        <Separator />

        {/* Contact Info */}
        <div className="space-y-3">
          <h4 className="font-semibold text-foreground">Información de Contacto</h4>
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm">
              <Mail className="w-4 h-4 text-muted-foreground" />
              <span className="text-muted-foreground">{student.email}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Phone className="w-4 h-4 text-muted-foreground" />
              <span className="text-muted-foreground">{student.phone}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <MapPin className="w-4 h-4 text-muted-foreground" />
              <span className="text-muted-foreground">Buenos Aires, Argentina</span>
            </div>
          </div>
        </div>

        <Separator />

        {/* Academic Summary */}
        <div className="space-y-3">
          <h4 className="font-semibold text-foreground">Resumen Académico</h4>
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center p-3 bg-accent/50 rounded-lg">
              <TrendingUp className="w-5 h-5 text-primary mx-auto mb-1" />
              <p className="text-sm text-muted-foreground">Promedio</p>
              <p className="text-lg font-semibold text-foreground">{formatAverage(student.average)}</p>
            </div>
            <div className="text-center p-3 bg-accent/50 rounded-lg">
              <Clock className="w-5 h-5 text-primary mx-auto mb-1" />
              <p className="text-sm text-muted-foreground">Faltas acumuladas</p>
              <p className="text-lg font-semibold text-foreground">{student.faltas != null ? student.faltas.toFixed(2) : '—'}</p>
            </div>
          </div>

          {student.attendanceSummary && (
            <div className="grid grid-cols-2 gap-4 text-sm bg-accent/30 rounded-lg p-4">
              <div>
                <p className="text-muted-foreground">Presentes</p>
                <p className="font-semibold text-green-600">{student.attendanceSummary.presentes}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Llegadas tarde</p>
                <p className="font-semibold text-yellow-600">{student.attendanceSummary.llegadas_tarde}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Ausentes</p>
                <p className="font-semibold text-red-600">{student.attendanceSummary.ausentes}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Justificadas</p>
                <p className="font-semibold text-muted-foreground">{student.attendanceSummary.faltas_justificadas}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Faltas equivalentes</p>
                <p className="font-semibold text-foreground">{Number(student.attendanceSummary.faltas_equivalentes).toFixed(2)}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Registros</p>
                <p className="font-semibold text-foreground">{student.attendanceSummary.total_registros}</p>
              </div>
            </div>
          )}
        </div>

        <Separator />

        {/* Subjects */}
        <div className="space-y-3">
          <h4 className="font-semibold text-foreground">Materias</h4>
          <div className="space-y-2">
            {subjectSummaries.length === 0 && (
              <div className="text-sm text-muted-foreground">Aún no hay materias asignadas.</div>
            )}

            {subjectSummaries.length > 0 && (
              <Accordion type="multiple" className="space-y-2">
                {subjectSummaries.map((subject) => {
                  const average = subject.average
                  const gradeCount = subject.grades.length
                  return (
                    <AccordionItem
                      key={subject.subjectKey}
                      value={subject.subjectKey}
                      className="border border-border rounded-lg bg-accent/10"
                    >
                      <AccordionTrigger className="px-3">
                        <div className="flex flex-1 items-center justify-between">
                          <div className="flex items-center gap-2">
                            <BookOpen className="w-4 h-4 text-primary" />
                            <span className="text-sm font-medium text-foreground">{subject.subjectName}</span>
                          </div>
                          <div className="flex items-center gap-3 text-xs md:text-sm">
                            <span className="text-muted-foreground">{gradeCount} nota{gradeCount === 1 ? '' : 's'}</span>
                            <span
                              className={`font-semibold ${
                                average != null && average >= 8
                                  ? 'text-green-600'
                                  : average != null && average >= 6
                                  ? 'text-yellow-600'
                                  : average != null
                                  ? 'text-red-600'
                                  : 'text-muted-foreground'
                              }`}
                            >
                              Promedio: {formatAverage(average)}
                            </span>
                          </div>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="px-3">
                        {subject.grades.length === 0 && (
                          <div className="text-sm text-muted-foreground">Sin calificaciones registradas.</div>
                        )}

                        {subject.grades
                          .slice()
                          .sort((a, b) => (b.fecha ?? '').localeCompare(a.fecha ?? ''))
                          .map((grade) => (
                            <div
                              key={grade.id}
                              className="mt-2 grid grid-cols-1 md:grid-cols-4 gap-3 text-xs md:text-sm p-3 bg-background rounded border border-border/50"
                            >
                              <div>
                                <p className="font-medium text-foreground">{grade.tipo_evaluacion || 'Evaluación'}</p>
                                <p className="text-muted-foreground">{grade.fecha || 'Sin fecha'}</p>
                              </div>
                              <div>
                                <p className="text-muted-foreground">Peso</p>
                                <p className="font-medium">{grade.peso != null ? `${grade.peso}%` : '—'}</p>
                              </div>
                              <div>
                                <p className="text-muted-foreground">Calificación</p>
                                <p
                                  className={`font-semibold ${
                                    grade.calificacion != null && grade.calificacion >= 8
                                      ? 'text-green-600'
                                      : grade.calificacion != null && grade.calificacion >= 6
                                      ? 'text-yellow-600'
                                      : grade.calificacion != null
                                      ? 'text-red-600'
                                      : 'text-muted-foreground'
                                  }`}
                                >
                                  {formatGradeValue(grade.calificacion)}
                                </p>
                              </div>
                              {grade.observaciones && (
                                <div className="md:col-span-4 text-muted-foreground bg-muted/40 rounded p-2">
                                  {grade.observaciones}
                                </div>
                              )}
                            </div>
                          ))}
                      </AccordionContent>
                    </AccordionItem>
                  )
                })}
              </Accordion>
            )}
          </div>
        </div>

        <Separator />

        {/* Recent Activity */}
        <div className="space-y-3">
          <h4 className="font-semibold text-foreground">Actividad Reciente</h4>
          <div className="space-y-2">
            {recentGrades.length === 0 && (
              <div className="text-sm text-muted-foreground">Sin actividad reciente.</div>
            )}

            {recentGrades.map((grade) => (
              <div key={grade.id} className="flex items-center justify-between p-2 border border-border rounded bg-background/60">
                <div>
                  <p className="text-sm font-medium">
                    {grade.tipo_evaluacion || 'Evaluación'} · {grade.materia_nombre || 'Sin materia'}
                  </p>
                  <p className="text-xs text-muted-foreground">{grade.fecha || 'Sin fecha'}</p>
                </div>
                <Badge variant="secondary" className="text-xs">
                  {formatGradeValue(grade.calificacion)}
                </Badge>
              </div>
            ))}
          </div>
        </div>

        {/* Gestión de tutores */}
        {canManageTutors && (
          <>
            <Separator />
            <div className="space-y-3">
              <h4 className="font-semibold text-foreground">Tutores</h4>
              <div className="space-y-2">
                {studentTutors.length === 0 && (
                  <p className="text-sm text-muted-foreground">Sin tutores asociados</p>
                )}
                {studentTutors.map((t) => (
                  <div key={t.id} className="flex items-center justify-between p-2 border border-border rounded">
                    <div>
                      <p className="text-sm font-medium">{t.nombre_completo}</p>
                      <p className="text-xs text-muted-foreground">{t.correo} {t.telefono ? `· ${t.telefono}` : ''}</p>
                    </div>
                    <Button variant="outline" size="sm" onClick={() => removeTutor(t.id)}>
                      <Trash2 className="w-4 h-4 mr-1" /> Quitar
                    </Button>
                  </div>
                ))}
              </div>

              <Dialog open={open} onOpenChange={setOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="w-4 h-4 mr-1" /> Asignar tutor
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Asignar tutor</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-3">
                    <Input
                      placeholder="Buscar por nombre o DNI..."
                      value={query}
                      onChange={async (e) => {
                        const q = e.target.value
                        setQuery(q)
                        setSearching(true)
                        try {
                          const res = await fetch(`/api/tutors?q=${encodeURIComponent(q)}`, { credentials: 'include' })
                          const data = await res.json().catch(() => ({}))
                          if (res.ok) setAllTutors(data.tutors || [])
                        } finally {
                          setSearching(false)
                        }
                      }}
                    />

                    <div className="max-h-64 overflow-auto border border-border rounded">
                      {searching && (
                        <div className="p-3 text-sm text-muted-foreground">Buscando...</div>
                      )}
                      {!searching && (allTutors || []).filter((t) => !studentTutors.some((st) => st.id === t.id)).length === 0 && (
                        <div className="p-3 text-sm text-muted-foreground">Sin resultados</div>
                      )}
                      {(!searching && allTutors || [])
                        .filter((t) => !studentTutors.some((st) => st.id === t.id))
                        .map((t) => (
                          <label key={t.id} className="flex items-center gap-2 p-2 border-b border-border/50">
                            <input
                              type="radio"
                              name="sel_tutor"
                              value={t.id}
                              checked={selectedTutor === t.id}
                              onChange={() => setSelectedTutor(t.id)}
                            />
                            <div className="flex-1">
                              <p className="text-sm font-medium">{t.nombre_completo}</p>
                              <p className="text-xs text-muted-foreground">{t.dni ? `${t.dni} · ` : ''}{t.correo}</p>
                            </div>
                          </label>
                        ))}
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
                    <Button onClick={addTutor} disabled={!selectedTutor}>Asociar</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}
