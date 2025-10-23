"use client"

import { useState, useEffect } from "react"
import { MainLayout } from "@/components/layout/main-layout" // Importando el nuevo layout
import { Calendar } from "@/components/dashboard/calendar"
import { QuickStats } from "@/components/dashboard/quick-stats"
import { RecentActivity } from "@/components/dashboard/recent-activity"
import { TeacherStats } from "@/components/dashboard/teacher-stats"
import { QuickActions } from "@/components/dashboard/quick-actions"
import { useRouter } from "next/navigation"

export default function DashboardPage() {
  const [user, setUser] = useState<any>(null)
  const router = useRouter()

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const res = await fetch("/api/session", { credentials: "include" })
        if (!res.ok) {
          router.push("/login")
          return
        }
        const data = await res.json()
        if (!cancelled) setUser(data.user)
      } catch {
        router.push("/login")
      }
    })()
    return () => {
      cancelled = true
    }
  }, [router])

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-transparent bg-gradient-to-r from-primary to-primary-light bg-clip-border mx-auto">
            <div className="rounded-full h-8 w-8 bg-background m-2"></div>
          </div>
          <p className="mt-4 text-muted-foreground animate-pulse">Cargando panel de control...</p>
        </div>
      </div>
    )
  }

  const isTeacherOrPreceptor = user.role === "teacher" || user.role === "preceptor"

  return (
    <MainLayout>
      {" "}
      {/* Usando el nuevo MainLayout */}
      <div className="p-4 lg:p-6 space-y-4 lg:space-y-6 animate-fade-in bg-gradient-to-br from-background via-background to-accent/5 min-h-0">
        <div className="space-y-2 animate-slide-up">
          <h1 className="text-2xl lg:text-3xl font-bold bg-gradient-to-r from-primary to-primary-light bg-clip-text text-transparent">
            Bienvenido, {user.username}
          </h1>
          <p className="text-muted-foreground text-base lg:text-lg">
            {isTeacherOrPreceptor
              ? "Panel de gestión académica y contenido educativo"
              : "Panel principal - Gestión académica"}
          </p>
        </div>

        <div className="animate-slide-up" style={{ animationDelay: "0.1s" }}>
          <QuickStats userRole={user.role} />
        </div>

        <div className="animate-slide-up" style={{ animationDelay: "0.2s" }}>
          <QuickActions userRole={user.role} />
        </div>

        {isTeacherOrPreceptor && (
          <div className="animate-slide-up" style={{ animationDelay: "0.3s" }}>
            <TeacherStats userRole={user.role} />
          </div>
        )}

        <div
          className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6 animate-slide-up"
          style={{ animationDelay: "0.4s" }}
        >
          <div className="lg:col-span-2">
            <Calendar />
          </div>
          <div className="space-y-4 lg:space-y-6">
            <RecentActivity userRole={user.role} />
          </div>
        </div>
      </div>
    </MainLayout>
  )
}
