"use client"

import { useEffect, useState } from "react"
import { MainLayout } from "@/components/layout/main-layout"
import { StudentList } from "@/components/students/student-list"
import { StudentProfile } from "@/components/students/student-profile"
import { useRouter } from "next/navigation"

export default function StudentsPage() {
  const [user, setUser] = useState<any>(null)
  type StudentRow = any
  type CourseSubject = {
    id: string | null
    nombre: string | null
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
  }
  type StudentWithGrades = StudentRow & {
    name: string
    email: string
    phone: string
    course: string
    courseId: string | null
    grades: any[]
    average: number | null
    status: string
    faltas: number | null
    attendanceSummary: AttendanceSummary | null
    courseSubjects: CourseSubject[]
  }

  const [students, setStudents] = useState<StudentWithGrades[]>([])
  const [courses, setCourses] = useState<any[]>([])
  const [selectedStudent, setSelectedStudent] = useState<StudentWithGrades | null>(null)
  const router = useRouter()

  // Guard de acceso y carga de usuario
  useEffect(() => {
    const userData = localStorage.getItem("user")
    if (!userData) { router.push('/login'); return }
    const parsed = JSON.parse(userData)
    // Permitir admin, directivo, preceptor y docente
    if (!['admin', 'directivo', 'preceptor', 'teacher'].includes(parsed.role)) {
      router.push('/dashboard'); return
    }
    setUser(parsed)
  }, [router])

  // Cargar cursos y estudiantes
  useEffect(() => {
    let cancelled = false

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

    ;(async () => {
      try {
        const [cRes, sRes] = await Promise.all([
          fetch('/api/courses', { credentials: 'include' }),
          fetch('/api/students', { credentials: 'include' }),
        ])
        const cData = await cRes.json().catch(() => ({}))
        const sData = await sRes.json().catch(() => ({}))

        if (!cancelled && cRes.ok) setCourses(cData.courses || [])

        if (sRes.ok) {
          const courseNameMap: Record<string, string> = {}
          ;(cData.courses || []).forEach((c: any) => { courseNameMap[c.id] = c.nombre })

          const rawStudents = Array.isArray(sData.students) ? (sData.students as StudentRow[]) : []

          const uniqueCourseIds = Array.from(
            new Set(
              rawStudents
                .map((st: StudentRow) => {
                  const rel = Array.isArray(st.cursos_estudiantes) ? st.cursos_estudiantes : []
                  return rel?.[0]?.curso_id || null
                })
                .filter((id): id is string => Boolean(id))
            )
          )

          const courseSubjectsEntries = await Promise.all(
            uniqueCourseIds.map(async (courseId) => {
              try {
                const res = await fetch(`/api/course-subjects?course_id=${encodeURIComponent(courseId)}`, { credentials: 'include' })
                const data = await res.json().catch(() => ({}))
                if (!res.ok) throw new Error('course subjects fetch failed')
                const subjects = Array.isArray(data?.subjects)
                  ? (data.subjects as any[]).map((s) => ({ id: s.id ?? s.materia_id ?? null, nombre: s.nombre ?? null }))
                  : []
                return [courseId, subjects] as const
              } catch {
                return [courseId, [] as CourseSubject[]] as const
              }
            })
          )

          const courseSubjectsMap = courseSubjectsEntries.reduce<Record<string, CourseSubject[]>>((acc, [courseId, subjects]) => {
            acc[courseId] = subjects
            return acc
          }, {})

          const normalized = await Promise.all(
            rawStudents.map(async (st: StudentRow) => {
              const rel = Array.isArray(st.cursos_estudiantes) ? st.cursos_estudiantes : []
              const firstCourseId = rel?.[0]?.curso_id || null
              const courseName = firstCourseId ? (courseNameMap[firstCourseId] || '—') : '—'
              const courseSubjects = firstCourseId ? courseSubjectsMap[firstCourseId] || [] : []
              const rawSummary = st.attendance_summary
              const attendanceSummary: AttendanceSummary | null = rawSummary
                ? {
                    estudiante_id: rawSummary.estudiante_id,
                    curso_id: rawSummary.curso_id ?? firstCourseId,
                    total_registros: Number(rawSummary.total_registros ?? 0),
                    presentes: Number(rawSummary.presentes ?? 0),
                    llegadas_tarde: Number(rawSummary.llegadas_tarde ?? 0),
                    ausentes: Number(rawSummary.ausentes ?? 0),
                    faltas_justificadas: Number(rawSummary.faltas_justificadas ?? 0),
                    faltas_equivalentes: Number.parseFloat(rawSummary.faltas_equivalentes ?? '0') || 0,
                  }
                : firstCourseId
                ? {
                    estudiante_id: st.id,
                    curso_id: firstCourseId,
                    total_registros: 0,
                    presentes: 0,
                    llegadas_tarde: 0,
                    ausentes: 0,
                    faltas_justificadas: 0,
                    faltas_equivalentes: 0,
                  }
                : null
              const faltasEquivalentes = attendanceSummary ? Number(attendanceSummary.faltas_equivalentes ?? 0) : 0

              try {
                const res = await fetch(`/api/grades?student_id=${encodeURIComponent(st.id)}`, { credentials: 'include' })
                const data = await res.json().catch(() => ({}))
                if (!res.ok) throw new Error('grades fetch failed')
                const grades = Array.isArray(data?.grades) ? data.grades : []
                const average = computeAverage(grades)
                const roundedAverage = average == null ? null : Math.round(average * 100) / 100
                return {
                  ...st,
                  id: st.id,
                  name: st.nombre_completo || st.name || 'Sin nombre',
                  email: st.correo || st.email || '',
                  phone: st.telefono || st.phone || '',
                  course: courseName,
                  courseId: firstCourseId,
                  grades,
                  average: roundedAverage,
                  status: determineStatus(roundedAverage),
                  faltas: faltasEquivalentes,
                  attendanceSummary,
                  courseSubjects,
                }
              } catch {
                return {
                  ...st,
                  id: st.id,
                  name: st.nombre_completo || st.name || 'Sin nombre',
                  email: st.correo || st.email || '',
                  phone: st.telefono || st.phone || '',
                  course: courseName,
                  courseId: firstCourseId,
                  grades: [],
                  average: null,
                  status: 'warning',
                  faltas: faltasEquivalentes,
                  attendanceSummary,
                  courseSubjects,
                }
              }
            })
          )

          if (!cancelled) {
            setStudents(normalized)
            setSelectedStudent((prev: StudentWithGrades | null) => {
              if (!prev) return prev
              return normalized.find((st) => st.id === prev.id) || prev
            })
          }
        }
      } catch {}
    })()

    return () => {
      cancelled = true
    }
  }, [])

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Cargando...</p>
        </div>
      </div>
    )
  }

  return (
    <MainLayout>
      <div className="p-6">
        <div className="space-y-6">
          <div className="space-y-2">
            <h1 className="text-2xl font-bold text-foreground">Estudiantes</h1>
            <p className="text-muted-foreground">Listado de cuentas con rol Estudiante. Filtra por curso.</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <StudentList
                userRole={user.role}
                onSelectStudent={setSelectedStudent}
                selectedStudentId={selectedStudent?.id}
                students={students}
                courses={courses.map((c: any) => c.nombre)}
              />
            </div>
            <div>
              {selectedStudent ? (
                <StudentProfile student={selectedStudent} userRole={user.role} userDbRole={user.dbRole} />
              ) : (
                <div className="bg-card border border-border rounded-lg p-8 text-center">
                  <p className="text-muted-foreground">Selecciona un estudiante para ver su perfil</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  )
}
