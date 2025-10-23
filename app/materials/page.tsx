"use client"

import { useState, useEffect } from "react"
import { MainLayout } from "@/components/layout/main-layout" // Importando el nuevo layout
import { MaterialsGrid } from "@/components/materials/materials-grid"
import { MaterialUpload } from "@/components/materials/material-upload"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useRouter } from "next/navigation"

export default function MaterialsPage() {
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

  const canUpload = ["teacher", "preceptor"].includes(user.role)

  return (
    <MainLayout>
      <div className="p-4 md:p-6">
        <div className="space-y-4 md:space-y-6">
          <div className="space-y-1 md:space-y-2">
            <h1 className="text-xl md:text-2xl font-bold text-foreground">Material Educativo</h1>
            <p className="text-sm md:text-base text-muted-foreground">
              {canUpload
                ? "Gestiona y comparte recursos educativos con tus estudiantes"
                : "Accede a los materiales de estudio y recursos de tus materias"}
            </p>
          </div>

          <Tabs defaultValue="materials" className="space-y-4 md:space-y-6">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="materials" className="text-sm">
                Materiales
              </TabsTrigger>
              {canUpload && (
                <TabsTrigger value="upload" className="text-sm">
                  Subir Material
                </TabsTrigger>
              )}
            </TabsList>

            <TabsContent value="materials">
              <MaterialsGrid userRole={user.role} />
            </TabsContent>

            {canUpload && (
              <TabsContent value="upload">
                <MaterialUpload userRole={user.role} />
              </TabsContent>
            )}
          </Tabs>
        </div>
      </div>
    </MainLayout>
  )
}
