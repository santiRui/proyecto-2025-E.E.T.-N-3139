"use client"

import { useState, useEffect } from "react"
import { MainLayout } from "@/components/layout/main-layout" // Importando el nuevo layout
import { GradesView } from "@/components/grades/grades-view"
import { AttendanceView } from "@/components/grades/attendance-view"
import { GradeEntry } from "@/components/grades/grade-entry"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useRouter } from "next/navigation"

export default function GradesPage() {
  const [user, setUser] = useState<any>(null)
  const router = useRouter()

  useEffect(() => {
    const userData = localStorage.getItem("user")
    if (!userData) {
      router.push("/login")
      return
    }
    setUser(JSON.parse(userData))
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

  const canManageGrades = ["teacher", "preceptor"].includes(user.role)

  return (
    <MainLayout>
      <div className="p-4 md:p-6">
        <div className="space-y-4 md:space-y-6">
          <div className="space-y-1 md:space-y-2">
            <h1 className="text-xl md:text-2xl font-bold text-foreground">Notas y Asistencia</h1>
            <p className="text-sm md:text-base text-muted-foreground">
              {canManageGrades
                ? "Gestiona las calificaciones y asistencia de los estudiantes"
                : "Consulta tus calificaciones y registro de asistencia"}
            </p>
          </div>

          <Tabs defaultValue="grades" className="space-y-4 md:space-y-6">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="grades" className="text-xs sm:text-sm">
                Calificaciones
              </TabsTrigger>
              <TabsTrigger value="attendance" className="text-xs sm:text-sm">
                Asistencia
              </TabsTrigger>
              {canManageGrades && (
                <TabsTrigger value="entry" className="text-xs sm:text-sm">
                  Cargar Notas
                </TabsTrigger>
              )}
            </TabsList>

            <TabsContent value="grades">
              <GradesView userRole={user.role} />
            </TabsContent>

            <TabsContent value="attendance">
              <AttendanceView userRole={user.role} />
            </TabsContent>

            {canManageGrades && (
              <TabsContent value="entry">
                <GradeEntry userRole={user.role} />
              </TabsContent>
            )}
          </Tabs>
        </div>
      </div>
    </MainLayout>
  )
}
