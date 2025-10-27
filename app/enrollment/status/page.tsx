"use client"

import { useEffect, useState } from "react"
import { MainLayout } from "@/components/layout/main-layout"
import Link from "next/link"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { toast } from "@/hooks/use-toast"

export default function EnrollmentStatusPage() {
  const [userAllowed, setUserAllowed] = useState<boolean>(false)
  const [checkedRole, setCheckedRole] = useState<boolean>(false)
  const [dni, setDni] = useState("")
  const [email, setEmail] = useState("")
  const [loading, setLoading] = useState(false)
  const [items, setItems] = useState<any[]>([])

  // Verificar rol (solo padres/tutores)
  useEffect(() => {
    const userData = localStorage.getItem('user')
    if (userData) {
      const parsed = JSON.parse(userData)
      const roleRaw = String(parsed.role || '').toLowerCase()
      const dbRoleRaw = String(parsed.dbRole || '').toLowerCase()
      const splitTokens = (s: string) => s.split(/[\s,/|]+/).filter(Boolean)
      const roles = Array.from(new Set([...splitTokens(roleRaw), ...splitTokens(dbRoleRaw)]))
      const allowed = roles.some(r => ["parent", "padre", "tutor"].includes(r))
      setUserAllowed(allowed)
    }
    setCheckedRole(true)
  }, [])

  const search = async () => {
    if (!dni && !email) {
      toast({ title: "Falta información", description: "Ingresa DNI o Email" })
      return
    }
    setLoading(true)
    try {
      const qs = new URLSearchParams()
      if (dni) qs.set("dni", dni)
      if (email) qs.set("email", email)
      const res = await fetch(`/api/enrollment/check?${qs.toString()}`, { cache: "no-store" })
      if (!res.ok) {
        const data = await res.json().catch(() => null)
        throw new Error(data?.error || "No se pudo obtener el estado")
      }
      const data = await res.json()
      setItems(data.items || [])
    } catch (e: any) {
      toast({ title: "Error", description: e?.message || "Ocurrió un problema", variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  // Auto-cargar inscripciones del tutor al abrir
  useEffect(() => {
    if (!checkedRole || !userAllowed) return
    let mounted = true
    ;(async () => {
      try {
        // Detectar email del usuario logueado
        let tutorEmail = ""
        try {
          const raw = localStorage.getItem('user')
          if (raw) {
            const u = JSON.parse(raw)
            const maybe = String(u.email || u.correo || u.username || '').trim()
            if (maybe.includes('@')) tutorEmail = maybe
          }
          if (!tutorEmail) {
            const last = localStorage.getItem('last_enrollment_tutor_email') || ''
            if (last.includes('@')) tutorEmail = last
          }
        } catch {}

        if (!tutorEmail) {
          setCheckedRole(true)
          return
        }
        setEmail(tutorEmail)
        setLoading(true)
        const qs = new URLSearchParams()
        qs.set('email', tutorEmail)
        qs.set('tutor_only', 'true')
        const res = await fetch(`/api/enrollment/check?${qs.toString()}`, { cache: 'no-store' })
        if (!res.ok) return
        const data = await res.json()
        if (mounted) setItems(data.items || [])
      } finally {
        if (mounted) setLoading(false)
      }
    })()
    return () => { mounted = false }
  }, [checkedRole, userAllowed])

  // Esperar verificación de rol
  if (!checkedRole) {
    return (
      <MainLayout>
        <div className="p-6">
          <p className="text-sm text-muted-foreground">Cargando...</p>
        </div>
      </MainLayout>
    )
  }

  if (!userAllowed) {
    return (
      <MainLayout>
        <div className="p-6">
          <p className="text-sm text-muted-foreground">Esta sección es exclusiva para padres o tutores.</p>
        </div>
      </MainLayout>
    )
  }

  return (
    <MainLayout>
      <div className="p-4 md:p-6 space-y-6">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-foreground">Estado de Inscripciones</h1>
          <p className="text-sm text-muted-foreground">Tus inscripciones recientes.</p>
        </div>

        {/* Formulario oculto por requerimiento: sólo autolistado */}

        <div className="space-y-3">
          {items.length === 0 ? (
            <p className="text-sm text-muted-foreground">Sin resultados.</p>
          ) : (
            items.map((it) => (
              <Card key={it.id} className="border">
                <CardContent className="py-4">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                    <div>
                      <p className="font-medium">{it.nombres} {it.apellidos} — {it.curso}</p>
                      <p className="text-sm text-muted-foreground">DNI: {it.dni} — Email: {it.email || "-"}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`px-2 py-1 rounded ${
                        it.estado === 'completada' ? 'bg-emerald-100 text-emerald-700' :
                        it.estado === 'rechazada' ? 'bg-red-100 text-red-700' :
                        it.estado === 'sin_revisar' ? 'bg-slate-100 text-slate-700' :
                        'bg-amber-100 text-amber-700'
                      }`}>{it.estado}</span>
                      {it.estado === 'pendiente' && (
                        <Link href={`/enrollment/edit/${it.id}`}>
                          <Button size="sm" variant="outline">Completar requerimientos</Button>
                        </Link>
                      )}
                    </div>
                  </div>
                  {it.notas && (
                    <p className="mt-2 text-sm text-muted-foreground">Mensaje: {it.notas}</p>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </MainLayout>
  )
}
