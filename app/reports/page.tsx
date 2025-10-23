"use client"

import { useState, useEffect } from "react"
import { MainLayout } from "@/components/layout/main-layout" // Importando el nuevo layout
import { AcademicReports } from "@/components/reports/academic-reports"
import { AttendanceReports } from "@/components/reports/attendance-reports"
import { PerformanceCharts } from "@/components/reports/performance-charts"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useRouter } from "next/navigation"

export default function ReportsPage() {
  const [user, setUser] = useState<any>(null)
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
      <div className="p-4 md:p-6">
        <div className="space-y-4 md:space-y-6">
          <div className="space-y-1 md:space-y-2">
            <h1 className="text-xl md:text-2xl font-bold text-foreground">Reportes y Estadísticas</h1>
            <p className="text-sm md:text-base text-muted-foreground">
              Análisis del rendimiento académico y estadísticas institucionales
            </p>
          </div>

          <Tabs defaultValue="academic" className="space-y-4 md:space-y-6">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="academic" className="text-xs sm:text-sm">
                Rendimiento
              </TabsTrigger>
              <TabsTrigger value="attendance" className="text-xs sm:text-sm">
                Asistencia
              </TabsTrigger>
              <TabsTrigger value="charts" className="text-xs sm:text-sm">
                Gráficos
              </TabsTrigger>
            </TabsList>

            <TabsContent value="academic">
              <AcademicReports userRole={user.role} />
            </TabsContent>

            <TabsContent value="attendance">
              <AttendanceReports userRole={user.role} />
            </TabsContent>

            <TabsContent value="charts">
              <PerformanceCharts userRole={user.role} />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </MainLayout>
  )
}
