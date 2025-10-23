"use client"

import { useState, useEffect } from "react"
import { MainLayout } from "@/components/layout/main-layout" // Importando el nuevo layout
import { ProfileSettings } from "@/components/profile/profile-settings"
import { useRouter } from "next/navigation"

export default function ProfilePage() {
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

  return (
    <MainLayout>
      <div className="p-3 md:p-6">
        <div className="space-y-3 md:space-y-6">
          <div className="space-y-1 md:space-y-2">
            <h1 className="text-xl md:text-2xl font-bold text-foreground">Mi Perfil</h1>
            <p className="text-sm md:text-base text-muted-foreground">
              Gestiona tu información personal y configuración de cuenta
            </p>
          </div>

          <ProfileSettings user={user} />
        </div>
      </div>
    </MainLayout>
  )
}
