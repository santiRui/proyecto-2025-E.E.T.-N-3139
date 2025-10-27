"use client"

import { useState, useEffect } from "react"
import { MainLayout } from "@/components/layout/main-layout" // Importando el nuevo layout
import { EnrollmentForm } from "@/components/enrollment/enrollment-form"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { toast } from "@/hooks/use-toast"

export default function EnrollmentPage() {
  const [user, setUser] = useState<any>(null)
  const [open, setOpen] = useState<boolean>(true)
  const [loadingStatus, setLoadingStatus] = useState<boolean>(true)
  const [toggling, setToggling] = useState<boolean>(false)
  const router = useRouter()

  useEffect(() => {
    const userData = localStorage.getItem("user")
    if (!userData) {
      router.push("/login")
      return
    }
    const parsedUser = JSON.parse(userData)
    // Normalizar roles para soportar valores como "Padre/Tutor"
    const roleRaw = String(parsedUser.role || '').toLowerCase()
    const dbRoleRaw = String(parsedUser.dbRole || '').toLowerCase()
    const splitTokens = (s: string) => s.split(/[\s,/|]+/).filter(Boolean)
    const userRoles: string[] = Array.from(new Set([...splitTokens(roleRaw), ...splitTokens(dbRoleRaw)]))

    const allowedRoles = ["preceptor", "padre", "tutor", "parent", "directivo", "administrador"]
    const isAllowed = userRoles.some(r => allowedRoles.includes(r))
    if (!isAllowed) {
      router.push("/dashboard")
      return
    }
    setUser(parsedUser)
  }, [router])

  // Cargar estado de inscripción
  useEffect(() => {
    let mounted = true
    async function fetchStatus() {
      try {
        const res = await fetch("/api/enrollment/status", { cache: "no-store" })
        if (!res.ok) throw new Error("No se pudo obtener el estado de inscripción")
        const data = await res.json()
        if (mounted) setOpen(Boolean(data?.open))
      } catch (e: any) {
        toast({ title: "Error", description: e?.message || "No se pudo cargar el estado", variant: "destructive" })
      } finally {
        if (mounted) setLoadingStatus(false)
      }
    }
    fetchStatus()
    return () => {
      mounted = false
    }
  }, [])

  const canToggle = user && (() => {
    const roleRaw = String(user.role || '').toLowerCase()
    const dbRoleRaw = String(user.dbRole || '').toLowerCase()
    const splitTokens = (s: string) => s.split(/[\s,/|]+/).filter(Boolean)
    const roles = Array.from(new Set([...splitTokens(roleRaw), ...splitTokens(dbRoleRaw)]))
    return roles.some(r => ["preceptor", "directivo", "administrador"].includes(r))
  })()

  const toggleOpen = async () => {
    if (!canToggle) return
    setToggling(true)
    try {
      const res = await fetch("/api/enrollment/status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ open: !open }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => null)
        throw new Error(data?.error || "No se pudo actualizar el estado")
      }
      const data = await res.json()
      setOpen(Boolean(data?.open))
      toast({ title: data?.open ? "Inscripción abierta" : "Inscripción cerrada" })
    } catch (e: any) {
      toast({ title: "Error", description: e?.message || "No se pudo actualizar", variant: "destructive" })
    } finally {
      setToggling(false)
    }
  }

  if (!user || loadingStatus) {
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
            <h1 className="text-xl md:text-2xl font-bold text-foreground">Inscripción Digital</h1>
            <p className="text-sm md:text-base text-muted-foreground">
              Sistema de inscripción digital para nuevos estudiantes
            </p>
          </div>

          {canToggle && (
            <div className="flex items-center gap-3">
              <Button variant={open ? "destructive" : "default"} onClick={toggleOpen} disabled={toggling}>
                {toggling ? "Actualizando..." : open ? "Cerrar inscripción" : "Abrir inscripción"}
              </Button>
              <span className="text-sm text-muted-foreground">
                Estado actual: {open ? "Abierta" : "Cerrada"}
              </span>
            </div>
          )}

          {open || canToggle ? (
            <EnrollmentForm />
          ) : (
            <div className="border rounded-lg p-6 bg-muted/40">
              <p className="text-sm text-muted-foreground">
                La inscripción no se encuentra disponible en este momento. Por favor, vuelve más tarde.
              </p>
            </div>
          )}
        </div>
      </div>
    </MainLayout>
  )
}
