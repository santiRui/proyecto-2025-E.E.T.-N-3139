"use client"

import { useState, useEffect } from "react"
import { MainLayout } from "@/components/layout/main-layout" // Importando el nuevo layout
import { StudentList } from "@/components/students/student-list"
import { StudentProfile } from "@/components/students/student-profile"
import { useRouter } from "next/navigation"

export default function StudentsPage() {
  const [user, setUser] = useState<any>(null)
  const [selectedStudent, setSelectedStudent] = useState<any>(null)
  const router = useRouter()

  useEffect(() => {
    const userData = localStorage.getItem("user")
    if (!userData) {
      router.push("/login")
      return
    }
    const parsedUser = JSON.parse(userData)
    if (!["teacher", "preceptor"].includes(parsedUser.role)) {
      router.push("/dashboard")
      return
    }
    setUser(parsedUser)
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

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <StudentList
                userRole={user.role}
                onSelectStudent={setSelectedStudent}
                selectedStudentId={selectedStudent?.id}
              />
            </div>
            <div>
              {selectedStudent ? (
                <StudentProfile student={selectedStudent} userRole={user.role} />
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
