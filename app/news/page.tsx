"use client"

import { useState, useEffect } from "react"
import { MainLayout } from "@/components/layout/main-layout" // Importando el nuevo layout
import { NewsList } from "@/components/news/news-list"
import { NewsCreate } from "@/components/news/news-create"
import { useRouter } from "next/navigation"

export default function NewsPage() {
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

  const canCreateNews = user.role === "teacher" || user.role === "preceptor"

  return (
    <MainLayout>
      <div className="p-4 md:p-6">
        <div className="space-y-4 md:space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="space-y-1 md:space-y-2">
              <h1 className="text-xl md:text-2xl font-bold text-foreground">Noticias Institucionales</h1>
              <p className="text-sm md:text-base text-muted-foreground">
                Comunicados, novedades y avisos importantes de la institución
              </p>
            </div>

            {canCreateNews && <NewsCreate userRole={user.role} />}
          </div>

          <NewsList />
        </div>
      </div>
    </MainLayout>
  )
}
