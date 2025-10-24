"use client"

import { useState, useEffect } from "react"
import { MainLayout } from "@/components/layout/main-layout" // Importando el nuevo layout
import { StudentList } from "@/components/students/student-list"
import { StudentProfile } from "@/components/students/student-profile"
import { useRouter } from "next/navigation"

export default function StudentsPage() {
  const [user, setUser] = useState<any>(null)
  const [selectedStudent, setSelectedStudent] = useState<any>(null)
  const [students, setStudents] = useState<any[]>([])
  const router = useRouter()

  useEffect(() => {
    const userData = localStorage.getItem("user")
    if (!userData) {
      router.push("/login")
      return
    }
    const parsedUser = JSON.parse(userData)
    if (!["preceptor", "teacher"].includes(parsedUser.role) && parsedUser.dbRole !== 'directivo') {
      router.push("/dashboard")
      return
    }
    setUser(parsedUser)
  }, [router])

  useEffect(() => {
    const userData = localStorage.getItem("user")
    if (!userData) return
    const parsedUser = JSON.parse(userData)
    ;(async () => {
      try {
        const res = await fetch('/api/students', { credentials: 'include' })
        const data = await res.json().catch(() => ({}))
        if (res.ok) setStudents(data.students || [])
      } catch {}
    })()
  }, [router])

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
      {" "}
      {/* Usando el nuevo MainLayout */}
      <div className="p-6">
        <div className="space-y-6">
          <div className="space-y-2">
            <h1 className="text-2xl font-bold text-foreground">Gestión de Estudiantes</h1>
            <p className="text-muted-foreground">
              {user.role === "teacher" ? "Estudiantes de tus cursos" : "Todos los estudiantes"}
            </p>
          </div>

          <div className="space-y-6">
            {!selectedStudent && (
              <StudentList
                userRole={user.role}
                onSelectStudent={setSelectedStudent}
                selectedStudentId={selectedStudent?.id}
                students={students}
              />
            )}

            {selectedStudent && (
              <div className="space-y-4">
                <div>
                  <button
                    className="text-sm px-3 py-2 border rounded hover:bg-accent"
                    onClick={() => setSelectedStudent(null)}
                  >
                    ← Volver a la lista
                  </button>
                </div>
                <StudentProfile student={selectedStudent} userRole={user.role} userDbRole={user.dbRole} />
              </div>
            )}

            {!selectedStudent && (
              <div className="bg-card border border-border rounded-lg p-8 text-center">
                <p className="text-muted-foreground">Selecciona un estudiante para ver su perfil</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </MainLayout>
  )
}
