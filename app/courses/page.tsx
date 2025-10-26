"use client"

import { useEffect, useMemo, useState } from "react"
import type { ComponentProps } from "react"
import { MainLayout } from "@/components/layout/main-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useRouter } from "next/navigation"
import { StudentProfile } from "@/components/students/student-profile"

export default function CoursesPage() {
  const [user, setUser] = useState<any>(null)
  const [courses, setCourses] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedCourse, setSelectedCourse] = useState<any>(null)
  const [students, setStudents] = useState<any[]>([])
  const [selectedStudent, setSelectedStudent] = useState<any | null>(null)
  const [teachers, setTeachers] = useState<any[]>([])
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState({ nombre: "", descripcion: "", anio_lectivo: new Date().getFullYear() })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")
  const [assignOpen, setAssignOpen] = useState(false)
  const [search, setSearch] = useState("")
  const [searching, setSearching] = useState(false)
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [selectedStudentId, setSelectedStudentId] = useState<string>("")
  const [assignError, setAssignError] = useState("")
  const [assignTeacherOpen, setAssignTeacherOpen] = useState(false)
  const [teacherQuery, setTeacherQuery] = useState("")
  const [teacherSearching, setTeacherSearching] = useState(false)
  const [teacherResults, setTeacherResults] = useState<any[]>([])
  const [selectedTeacherId, setSelectedTeacherId] = useState<string>("")
  type StudentProfileData = ComponentProps<typeof StudentProfile>["student"]
  const [selectedStudentDetail, setSelectedStudentDetail] = useState<StudentProfileData | null>(null)
  const [selectedStudentLoading, setSelectedStudentLoading] = useState(false)
  const [selectedStudentError, setSelectedStudentError] = useState("")
  const [manageOpen, setManageOpen] = useState(false)
  const [manageAction, setManageAction] = useState<'edit' | 'delete' | null>(null)
  const [manageCourseId, setManageCourseId] = useState<string>("")
  const [manageQuery, setManageQuery] = useState<string>("")
  const [editForm, setEditForm] = useState<{ id?: string; nombre?: string; descripcion?: string; anio_lectivo?: number }>({})
  const router = useRouter()

  useEffect(() => {
    const u = localStorage.getItem("user")
    if (!u) { router.push("/login"); return }
    const parsed = JSON.parse(u)
    // Acceso: docente, preceptor, directivo y administrador
    const allowed = parsed.role === 'teacher' || parsed.role === 'preceptor' || parsed.dbRole === 'directivo' || parsed.dbRole === 'administrador'
    if (!allowed) { router.push('/dashboard'); return }
    setUser(parsed)
  }, [router])

  async function fetchStudentsQuery(q: string) {
    setSearching(true)
    try {
      const res = await fetch(`/api/students?q=${encodeURIComponent(q)}`, { credentials: 'include' })
      const data = await res.json().catch(() => ({}))
      if (res.ok) setSearchResults(data.students || [])
    } finally {
      setSearching(false)
    }
  }

  const computeAverage = (grades: any[]) => {
    if (!grades || grades.length === 0) return null
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

    const baseAverage = totalWeight > 0 ? weightedSum / totalWeight : sum / grades.length
    if (!Number.isFinite(baseAverage)) return null
    return Math.round(baseAverage * 100) / 100
  }

  const determineStatus = (average: number | null) => {
    if (average == null) return 'warning'
    if (average >= 8) return 'active'
    if (average >= 6) return 'warning'
    return 'inactive'
  }

  async function loadStudentDetail(student: any, course: any) {
    if (!student || !course) {
      setSelectedStudentDetail(null)
      return
    }

    setSelectedStudentLoading(true)
    setSelectedStudentError("")

    try {
      const [attendanceRes, gradesRes, subjectsRes] = await Promise.all([
        fetch(`/api/attendance?summary=student&student_id=${encodeURIComponent(student.id)}&course_id=${encodeURIComponent(course.id)}`, {
          credentials: 'include',
        }),
        fetch(`/api/grades?student_id=${encodeURIComponent(student.id)}`, { credentials: 'include' }),
        fetch(`/api/course-subjects?course_id=${encodeURIComponent(course.id)}`, { credentials: 'include' }),
      ])

      const attendanceData = await attendanceRes.json().catch(() => ({}))
      const gradesData = await gradesRes.json().catch(() => ({}))
      const subjectsData = await subjectsRes.json().catch(() => ({}))

      const summaryRow = attendanceRes.ok && Array.isArray(attendanceData?.summaries) ? attendanceData.summaries[0] : null
      const attendanceSummary = summaryRow
        ? {
            estudiante_id: summaryRow.estudiante_id || student.id,
            curso_id: summaryRow.curso_id || course.id,
            total_registros: Number(summaryRow.total_registros ?? 0),
            presentes: Number(summaryRow.presentes ?? 0),
            llegadas_tarde: Number(summaryRow.llegadas_tarde ?? 0),
            ausentes: Number(summaryRow.ausentes ?? 0),
            faltas_justificadas: Number(summaryRow.faltas_justificadas ?? 0),
            faltas_equivalentes: Number.parseFloat(summaryRow.faltas_equivalentes ?? '0') || 0,
            porcentaje_asistencia: Number.parseFloat(summaryRow.porcentaje_asistencia ?? '0') || 0,
          }
        : null

      const grades = gradesRes.ok && Array.isArray(gradesData?.grades) ? gradesData.grades : []
      const average = computeAverage(grades)

      const subjects = subjectsRes.ok && Array.isArray(subjectsData?.subjects)
        ? subjectsData.subjects.map((s: any) => ({ id: s.id ?? s.materia_id ?? null, nombre: s.nombre ?? null }))
        : []

      const detail: StudentProfileData = {
        id: student.id,
        name: student.nombre_completo || student.name || 'Sin nombre',
        email: student.correo || student.email || '',
        phone: student.telefono || student.phone || '',
        course: course?.nombre || '—',
        courseId: course?.id || null,
        status: determineStatus(average),
        faltas: attendanceSummary ? attendanceSummary.faltas_equivalentes : null,
        average,
        grades,
        photo: student.photo || null,
        courseSubjects: subjects,
        attendanceSummary,
      }

      setSelectedStudentDetail(detail)
    } catch {
      setSelectedStudentDetail(null)
      setSelectedStudentError('No se pudieron cargar los datos del estudiante')
    } finally {
      setSelectedStudentLoading(false)
    }
  }

  useEffect(() => {
    // Al abrir el modal o cuando cambia la lista del curso, refrescar resultados según el término actual
    if (assignOpen) {
      fetchStudentsQuery(search)
    }
  }, [assignOpen, students.length])

  async function loadCourses() {
    try {
      const res = await fetch('/api/courses', { credentials: 'include' })
      const data = await res.json().catch(() => ({}))
      if (res.ok) setCourses(data.courses || [])
    } catch {}
  }

  useEffect(() => { loadCourses() }, [])

  useEffect(() => {
    if (!selectedCourse) { setStudents([]); setSelectedStudent(null); return }
    ;(async () => {
      try {
        const res = await fetch(`/api/course-students?course_id=${encodeURIComponent(selectedCourse.id)}`, { credentials: 'include' })
        const data = await res.json().catch(() => ({}))
        if (res.ok) {
          const studentsData = data.students || []

          if (studentsData.length > 0) {
            const ids = studentsData.map((s: any) => s.id).filter(Boolean)
            if (ids.length > 0) {
              try {
                const profilesRes = await fetch(`/api/students?ids=${encodeURIComponent(ids.join(','))}`, { credentials: 'include' })
                const profilesData = await profilesRes.json().catch(() => ({}))
                if (profilesRes.ok && Array.isArray(profilesData?.students)) {
                  const profilesMap = new Map<string, any>()
                  profilesData.students.forEach((student: any) => {
                    profilesMap.set(student.id, student)
                  })
                  studentsData.forEach((student: any) => {
                    const profile = profilesMap.get(student.id)
                    if (!profile) return
                    student.faltas = typeof profile?.attendance_summary?.faltas_equivalentes === 'number'
                      ? profile.attendance_summary.faltas_equivalentes
                      : Number.parseFloat(profile?.attendance_summary?.faltas_equivalentes ?? '0') || 0
                    student.attendanceSummary = profile?.attendance_summary || null
                    student.average = profile?.average ?? null
                    student.grades = profile?.grades ?? []
                    student.courseSubjects = profile?.courseSubjects ?? []
                    student.status = profile?.status ?? 'warning'
                  })
                }
              } catch {}
            }
          }

          setStudents(studentsData)
          if (selectedStudent) {
            const match = studentsData.find((s: any) => s.id === selectedStudent.id) || null
            setSelectedStudent(match)
            if (match) {
              await loadStudentDetail(match, selectedCourse)
            } else {
              setSelectedStudentDetail(null)
            }
          } else {
            setSelectedStudentDetail(null)
          }
        }
      } catch {}
    })()
  }, [selectedCourse?.id, selectedStudent?.id])

  useEffect(() => {
    if (selectedCourse && selectedStudent) {
      loadStudentDetail(selectedStudent, selectedCourse)
    }
  }, [selectedCourse?.id, selectedStudent?.id])

  useEffect(() => {
    if (!selectedCourse) { setTeachers([]); return }
    ;(async () => {
      try {
        const res = await fetch(`/api/course-teachers?course_id=${encodeURIComponent(selectedCourse.id)}`, { credentials: 'include' })
        const data = await res.json().catch(() => ({}))
        if (res.ok) setTeachers(data.teachers || [])
      } catch {}
    })()
  }, [selectedCourse?.id])

  async function createCourse() {
    setSaving(true)
    setError("")
    try {
      const res = await fetch('/api/courses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ nombre: form.nombre, descripcion: form.descripcion, anio_lectivo: Number(form.anio_lectivo) || new Date().getFullYear() })
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) { setError(data?.error || 'No se pudo crear'); return }
      setOpen(false)
      setForm({ nombre: "", descripcion: "", anio_lectivo: new Date().getFullYear() })
      await loadCourses()
    } finally {
      setSaving(false)
    }
  }

  const title = useMemo(() => selectedCourse ? `Curso: ${selectedCourse.nombre}` : 'Cursos', [selectedCourse])

  if (!user) return null

  return (
    <MainLayout>
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-foreground">{title}</h1>
          {!selectedCourse && (user.role === 'preceptor' || user.dbRole === 'directivo' || user.dbRole === 'administrador') && (
            <div className="flex items-center gap-2">
              <Dialog open={open} onOpenChange={setOpen}>
                <DialogTrigger asChild>
                  <Button>Nuevo curso</Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Crear curso</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-3">
                    <div className="space-y-1">
                      <Label>Nombre</Label>
                      <Input value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} required />
                    </div>
                    <div className="space-y-1">
                      <Label>Descripción</Label>
                      <Input value={form.descripcion} onChange={(e) => setForm({ ...form, descripcion: e.target.value })} />
                    </div>
                    <div className="space-y-1">
                      <Label>Año lectivo</Label>
                      <Input type="number" value={form.anio_lectivo} onChange={(e) => setForm({ ...form, anio_lectivo: e.target.value as unknown as number })} />
                    </div>
                    {error && <p className="text-sm text-destructive">{error}</p>}
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
                    <Button onClick={createCourse} disabled={saving || !form.nombre}>Crear</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>

              <Dialog open={manageOpen} onOpenChange={(o) => { setManageOpen(o); if (!o) { setManageAction(null); setManageCourseId(""); setEditForm({}) } }}>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>{manageAction === 'delete' ? 'Eliminar' : 'Editar'} curso</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-3">
                    <div className="space-y-1">
                      <Label>Buscar</Label>
                      <Input
                        placeholder="Escribe el nombre o año..."
                        value={manageQuery}
                        onChange={(e) => setManageQuery(e.target.value)}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label>Resultados</Label>
                      <div className="max-h-64 overflow-auto border rounded divide-y">
                        {courses
                          .filter((c) => {
                            const q = manageQuery.trim().toLowerCase()
                            if (!q) return true
                            const name = (c.nombre || '').toLowerCase()
                            const year = String(c.anio_lectivo || '')
                            return name.includes(q) || year.includes(q)
                          })
                          .map((c) => {
                            const isSel = manageCourseId === c.id
                            return (
                              <button
                                key={c.id}
                                className={`w-full text-left p-2 hover:bg-accent/50 ${isSel ? 'bg-accent' : ''}`}
                                onClick={() => {
                                  setManageCourseId(c.id)
                                  setEditForm({ id: c.id, nombre: c.nombre, descripcion: c.descripcion || '', anio_lectivo: c.anio_lectivo })
                                }}
                              >
                                <div className="font-medium">{c.nombre}</div>
                                <div className="text-xs text-muted-foreground">Año lectivo: {c.anio_lectivo}{c.descripcion ? ` · ${c.descripcion}` : ''}</div>
                              </button>
                            )
                          })}
                        {courses.length === 0 && (
                          <div className="p-2 text-sm text-muted-foreground">No hay cursos</div>
                        )}
                      </div>
                    </div>

                    {manageAction !== 'delete' && manageCourseId && (
                      <>
                        <div className="space-y-1">
                          <Label>Nombre</Label>
                          <Input value={editForm.nombre || ''} onChange={(e) => setEditForm({ ...editForm, nombre: e.target.value })} />
                        </div>
                        <div className="space-y-1">
                          <Label>Descripción</Label>
                          <Input value={editForm.descripcion || ''} onChange={(e) => setEditForm({ ...editForm, descripcion: e.target.value })} />
                        </div>
                        <div className="space-y-1">
                          <Label>Año lectivo</Label>
                          <Input type="number" value={editForm.anio_lectivo || new Date().getFullYear()} onChange={(e) => setEditForm({ ...editForm, anio_lectivo: e.target.value as unknown as number })} />
                        </div>
                      </>
                    )}

                    {manageAction === 'delete' && manageCourseId && (
                      <p className="text-sm text-destructive">Esta acción eliminará el curso seleccionado.</p>
                    )}
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setManageOpen(false)}>Cancelar</Button>
                    {manageAction === 'delete' ? (
                      <Button variant="destructive" disabled={!manageCourseId} onClick={async () => {
                        if (!manageCourseId) return
                        const res = await fetch(`/api/courses?id=${encodeURIComponent(manageCourseId)}`, { method: 'DELETE', credentials: 'include' })
                        if (res.ok) { setManageOpen(false); setManageCourseId(""); await loadCourses() }
                      }}>Eliminar</Button>
                    ) : (
                      <Button disabled={!manageCourseId || !editForm.nombre} onClick={async () => {
                        const res = await fetch('/api/courses', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, credentials: 'include', body: JSON.stringify(editForm) })
                        if (res.ok) { setManageOpen(false); setManageCourseId(""); setEditForm({}); await loadCourses() }
                      }}>Guardar</Button>
                    )}
                  </DialogFooter>
                </DialogContent>
              </Dialog>

              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  onClick={() => { setManageCourseId(""); setEditForm({}); setManageAction('edit'); setManageOpen(true) }}
                >
                  Editar curso
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => { setManageCourseId(""); setEditForm({}); setManageAction('delete'); setManageOpen(true) }}
                >
                  Eliminar curso
                </Button>
              </div>
            </div>
          )}
        </div>

        {!selectedCourse && (
          <Card>
            <CardHeader>
              <CardTitle>Listado de Cursos</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {courses.map((c) => (
                  <button key={c.id} className="text-left p-4 border rounded hover:bg-accent/50" onClick={() => setSelectedCourse(c)}>
                    <div className="font-semibold">{c.nombre}</div>
                    <div className="text-sm text-muted-foreground">Año lectivo: {c.anio_lectivo}</div>
                    {c.descripcion && <div className="text-sm mt-1">{c.descripcion}</div>}
                  </button>
                ))}
                {courses.length === 0 && (
                  <div className="text-sm text-muted-foreground">{user.role === 'teacher' ? 'No estás asignado a ningún curso' : 'No hay cursos creados'}</div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {selectedCourse && (
          <div className="space-y-4">
            <div>
              <Button variant="outline" onClick={() => setSelectedCourse(null)}>← Volver a cursos</Button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>Estudiantes del curso</CardTitle>
                    {(user.role === 'preceptor' || user.dbRole === 'directivo') && (
                      <Dialog open={assignOpen} onOpenChange={(o) => { setAssignOpen(o); if (!o) { setSearch(""); setSearchResults([]); setSelectedStudentId(""); setAssignError("") } }}>
                        <DialogTrigger asChild>
                          <Button>Asignar estudiante</Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Asignar estudiante a {selectedCourse?.nombre}</DialogTitle>
                          </DialogHeader>
                          <div className="space-y-3">
                            <Input
                              placeholder="Buscar por nombre o DNI..."
                              value={search}
                              onChange={async (e) => {
                                const q = e.target.value
                                setSearch(q)
                                setSearching(true)
                                try { await fetchStudentsQuery(q) } finally { setSearching(false) }
                              }}
                            />
                            <div className="max-h-64 overflow-auto border rounded">
                              {searching && <div className="p-3 text-sm text-muted-foreground">Buscando...</div>}
                              {!searching && searchResults.length === 0 && <div className="p-3 text-sm text-muted-foreground">Sin resultados</div>}
                              {searchResults.map((s) => {
                                const inThisCourse = students.some((st) => st.id === s.id)
                                const rels = Array.isArray(s.cursos_estudiantes) ? s.cursos_estudiantes : []
                                const inAnyCourse = rels.some((r: any) => !!r?.curso_id)
                                const inOtherCourse = rels.some((r: any) => r?.curso_id && r.curso_id !== selectedCourse?.id)
                                const disabled = inThisCourse || inOtherCourse
                                if (disabled) {
                                  return (
                                    <div key={s.id} className={`flex items-center gap-2 p-2 border-b last:border-b-0 opacity-60`}>
                                      <div className="flex-1">
                                        <div className="text-sm font-medium">{s.nombre_completo}</div>
                                        <div className={`text-xs ${inOtherCourse ? 'text-destructive' : 'text-muted-foreground'}`}>
                                          {s.dni} · {s.correo}
                                          {inOtherCourse && ' — Pertenece a otro curso'}
                                          {inThisCourse && ' — Ya está en este curso'}
                                        </div>
                                      </div>
                                    </div>
                                  )
                                }
                                return (
                                  <label key={s.id} className={`flex items-center gap-2 p-2 border-b last:border-b-0`}>
                                    <input type="radio" name="sel_student" value={s.id} checked={selectedStudentId === s.id} onChange={() => setSelectedStudentId(s.id)} />
                                    <div className="flex-1">
                                      <div className="text-sm font-medium">{s.nombre_completo}</div>
                                      <div className="text-xs text-muted-foreground">{s.dni} · {s.correo}</div>
                                    </div>
                                  </label>
                                )
                              })}
                            </div>
                            {assignError && <div className="text-sm text-destructive">{assignError}</div>}
                          </div>
                          <DialogFooter>
                            <Button variant="outline" onClick={() => setAssignOpen(false)}>Cancelar</Button>
                            <Button
                              disabled={!selectedStudentId}
                              onClick={async () => {
                                if (!selectedStudentId || !selectedCourse) return
                                const res = await fetch('/api/course-students', {
                                  method: 'POST',
                                  headers: { 'Content-Type': 'application/json' },
                                  credentials: 'include',
                                  body: JSON.stringify({ course_id: selectedCourse.id, student_id: selectedStudentId })
                                })
                                if (res.ok) {
                                  setAssignOpen(false)
                                  setSelectedStudentId("")
                                  // reload students
                                  try {
                                    const r = await fetch(`/api/course-students?course_id=${encodeURIComponent(selectedCourse.id)}`, { credentials: 'include' })
                                    const d = await r.json().catch(() => ({}))
                                    if (r.ok) setStudents(d.students || [])
                                  } catch {}
                                } else {
                                  const data = await res.json().catch(() => ({}))
                                  setAssignError(data?.error || 'No se pudo asignar')
                                }
                              }}
                            >
                              Asignar
                            </Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {students.map((s) => {
                      const isSelected = selectedStudent?.id === s.id
                      return (
                        <div
                          key={s.id}
                          className={`p-3 border rounded flex items-center justify-between cursor-pointer transition-colors ${
                            isSelected ? 'bg-accent border-primary' : 'hover:bg-accent/50'
                          }`}
                          onClick={() => setSelectedStudent(s)}
                        >
                          <div>
                            <div className="font-medium">{s.nombre_completo}</div>
                            <div className="text-sm text-muted-foreground">{s.dni} · {s.correo}</div>
                          </div>
                          {(user.role === 'preceptor' || user.dbRole === 'directivo') && (
                            <Button
                              variant="outline"
                              onClick={async (event) => {
                                event.stopPropagation()
                                const res = await fetch(`/api/course-students?course_id=${encodeURIComponent(selectedCourse.id)}&student_id=${encodeURIComponent(s.id)}`, {
                                  method: 'DELETE',
                                  credentials: 'include',
                                })
                                if (res.ok) {
                                  setStudents((prev: any[]) => prev.filter((x) => x.id !== s.id))
                                  setSelectedStudent((prev: any | null) => (prev?.id === s.id ? null : prev))
                                }
                              }}
                            >
                              Quitar
                            </Button>
                          )}
                        </div>
                      )
                    })}
                    {students.length === 0 && (
                      <div className="text-sm text-muted-foreground">Este curso aún no tiene estudiantes</div>
                    )}
                  </div>
                </CardContent>
              </Card>

              <div>
                {selectedStudentLoading && (
                  <Card>
                    <CardContent className="p-6 text-sm text-muted-foreground">Cargando perfil...</CardContent>
                  </Card>
                )}
                {!selectedStudentLoading && selectedStudentError && (
                  <Card>
                    <CardContent className="p-6 text-sm text-destructive">{selectedStudentError}</CardContent>
                  </Card>
                )}
                {!selectedStudentLoading && !selectedStudentError && selectedStudentDetail && (
                  <StudentProfile student={selectedStudentDetail} userRole={user.role} userDbRole={user.dbRole} />
                )}
                {!selectedStudentLoading && !selectedStudentError && !selectedStudentDetail && (
                  <Card>
                    <CardContent className="p-6 text-sm text-muted-foreground">Selecciona un estudiante para ver el detalle.</CardContent>
                  </Card>
                )}
              </div>
            </div>

            {(user.role === 'preceptor' || user.dbRole === 'directivo') && (
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>Docentes del curso</CardTitle>
                    <Dialog open={assignTeacherOpen} onOpenChange={(o) => { setAssignTeacherOpen(o); if (!o) { setTeacherQuery(""); setTeacherResults([]); setSelectedTeacherId("") } }}>
                      <DialogTrigger asChild>
                        <Button>Asignar docente</Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Asignar docente a {selectedCourse?.nombre}</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-3">
                          <Input
                            placeholder="Buscar por nombre o DNI..."
                            value={teacherQuery}
                            onChange={async (e) => {
                              const q = e.target.value
                              setTeacherQuery(q)
                              setTeacherSearching(true)
                              try {
                                const res = await fetch(`/api/teachers?q=${encodeURIComponent(q)}`, { credentials: 'include' })
                                const data = await res.json().catch(() => ({}))
                                if (res.ok) setTeacherResults((data.teachers || []).filter((t: any) => !teachers.some((tt: any) => tt.id === t.id)))
                              } finally { setTeacherSearching(false) }
                            }}
                          />
                          <div className="max-h-64 overflow-auto border rounded">
                            {teacherSearching && <div className="p-3 text-sm text-muted-foreground">Buscando...</div>}
                            {!teacherSearching && teacherResults.length === 0 && <div className="p-3 text-sm text-muted-foreground">Sin resultados</div>}
                            {teacherResults.map((t) => (
                              <label key={t.id} className="flex items-center gap-2 p-2 border-b last:border-b-0">
                                <input type="radio" name="sel_teacher" value={t.id} checked={selectedTeacherId === t.id} onChange={() => setSelectedTeacherId(t.id)} />
                                <div className="flex-1">
                                  <div className="text-sm font-medium">{t.nombre_completo}</div>
                                  <div className="text-xs text-muted-foreground">{t.dni} · {t.correo}</div>
                                </div>
                              </label>
                            ))}
                          </div>
                        </div>
                        <DialogFooter>
                          <Button variant="outline" onClick={() => setAssignTeacherOpen(false)}>Cancelar</Button>
                          <Button
                            disabled={!selectedTeacherId}
                            onClick={async () => {
                              if (!selectedTeacherId || !selectedCourse) return
                              const res = await fetch('/api/course-teachers', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                credentials: 'include',
                                body: JSON.stringify({ course_id: selectedCourse.id, teacher_id: selectedTeacherId })
                              })
                              if (res.ok) {
                                setAssignTeacherOpen(false)
                                setSelectedTeacherId("")
                                // reload teachers
                                try {
                                  const r = await fetch(`/api/course-teachers?course_id=${encodeURIComponent(selectedCourse.id)}`, { credentials: 'include' })
                                  const d = await r.json().catch(() => ({}))
                                  if (r.ok) setTeachers(d.teachers || [])
                                } catch {}
                              }
                            }}
                          >
                            Asignar
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {teachers.map((t) => (
                      <div key={t.id} className="p-3 border rounded flex items-center justify-between">
                        <div>
                          <div className="font-medium">{t.nombre_completo}</div>
                          <div className="text-sm text-muted-foreground">{t.dni} · {t.correo}</div>
                        </div>
                        <Button
                          variant="outline"
                          onClick={async () => {
                            const res = await fetch(`/api/course-teachers?course_id=${encodeURIComponent(selectedCourse.id)}&teacher_id=${encodeURIComponent(t.id)}`, {
                              method: 'DELETE',
                              credentials: 'include',
                            })
                            if (res.ok) setTeachers((prev: any[]) => prev.filter((x) => x.id !== t.id))
                          }}
                        >
                          Quitar
                        </Button>
                      </div>
                    ))}
                    {teachers.length === 0 && (
                      <div className="text-sm text-muted-foreground">Este curso aún no tiene docentes</div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

          </div>
        )}
      </div>
    </MainLayout>
  )
}
