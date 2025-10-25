"use client"

import { useEffect, useState } from "react"
import { MainLayout } from "@/components/layout/main-layout"
import { StudentList } from "@/components/students/student-list"
import { StudentProfile } from "@/components/students/student-profile"
import { useRouter } from "next/navigation"

export default function StudentsPage() {
  const [user, setUser] = useState<any>(null)
  const [students, setStudents] = useState<any[]>([])
  const [courses, setCourses] = useState<any[]>([])
  const [selectedStudent, setSelectedStudent] = useState<any>(null)
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
    ;(async () => {
      try {
        const [cRes, sRes] = await Promise.all([
          fetch('/api/courses', { credentials: 'include' }),
          fetch('/api/students', { credentials: 'include' }),
        ])
        const cData = await cRes.json().catch(() => ({}))
        const sData = await sRes.json().catch(() => ({}))
        if (cRes.ok) setCourses(cData.courses || [])
        if (sRes.ok) {
          const map: Record<string, string> = {}
          ;(cData.courses || []).forEach((c: any) => { map[c.id] = c.nombre })
          const normalized = (sData.students || []).map((st: any) => {
            const rel = Array.isArray(st.cursos_estudiantes) ? st.cursos_estudiantes : []
            const firstCourseId = rel?.[0]?.curso_id || null
            const courseName = firstCourseId ? (map[firstCourseId] || '—') : '—'
            return { ...st, course: courseName }
          })
          setStudents(normalized)
        }
      } catch {}
    })()
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
