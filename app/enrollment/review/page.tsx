"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { MainLayout } from "@/components/layout/main-layout"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { toast } from "@/hooks/use-toast"

const estados = [
  { value: "all", label: "Todos" },
  { value: "pendiente", label: "Pendiente" },
  { value: "completada", label: "Completada" },
  { value: "rechazada", label: "Rechazada" },
]

export default function EnrollmentReviewPage() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState<boolean>(false)
  const [q, setQ] = useState("")
  const [estado, setEstado] = useState("all")
  const [items, setItems] = useState<any[]>([])
  const [docModalOpen, setDocModalOpen] = useState(false)
  const [docTargetId, setDocTargetId] = useState<string | null>(null)
  const [docNotas, setDocNotas] = useState("")

  useEffect(() => {
    const userData = localStorage.getItem("user")
    if (!userData) return
    const parsed = JSON.parse(userData)
    // Roles permitidos
    const r = String(parsed.role || '').toLowerCase()
    const db = String(parsed.dbRole || '').toLowerCase()
    const tokens = Array.from(new Set([...r.split(/[\s,/|]+/).filter(Boolean), ...db.split(/[\s,/|]+/).filter(Boolean)]))
    const allowed = tokens.some((x) => ["preceptor", "directivo", "administrador", "admin"].includes(x))
    if (allowed) setUser(parsed)
  }, [])

  const fetchList = async () => {
    setLoading(true)
    try {
      const qs = new URLSearchParams()
      if (q) qs.set("q", q)
      if (estado && estado !== 'all') qs.set("estado", estado)
      const res = await fetch(`/api/enrollment/list?${qs.toString()}`, { cache: "no-store" })
      if (!res.ok) {
        const data = await res.json().catch(() => null)
        throw new Error(data?.error || "No se pudo obtener la lista")
      }
      const data = await res.json()
      setItems(data.items || [])
    } catch (e: any) {
      toast({ title: "Error", description: e?.message || "Ocurrió un problema", variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchList()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const updateItem = async (id: string, estado: string, notas?: string) => {
    try {
      const res = await fetch(`/api/enrollment/update`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, estado, notas }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => null)
        throw new Error(data?.error || 'No se pudo actualizar')
      }
      toast({ title: 'Actualizado', description: 'La inscripción fue actualizada.' })
      fetchList()
    } catch (e: any) {
      toast({ title: 'Error', description: e?.message || 'Ocurrió un problema', variant: 'destructive' })
    }
  }

  if (!user) {
    return (
      <MainLayout>
        <div className="p-6">
          <p className="text-sm text-muted-foreground">No tienes permisos para ver esta sección.</p>
        </div>
      </MainLayout>
    )
  }

  return (
    <MainLayout>
      <div className="p-4 md:p-6 space-y-4">
        <div className="flex flex-col md:flex-row gap-3 md:items-end">
          <div className="flex-1">
            <label className="text-sm mb-1 block">Buscar por DNI o nombre</label>
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Ej: 12345678 o Juan" />
          </div>
          <div className="w-full md:w-64">
            <label className="text-sm mb-1 block">Estado</label>
            <Select value={estado} onValueChange={(v) => setEstado(v)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {estados.map((e) => (
                  <SelectItem key={e.value} value={e.value}>{e.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Button onClick={fetchList} disabled={loading}>{loading ? 'Cargando...' : 'Filtrar'}</Button>
          </div>
        </div>

        <div className="space-y-3">
          {items.length === 0 ? (
            <p className="text-sm text-muted-foreground">No hay inscripciones.</p>
          ) : (
            items.map((it) => (
              <Card key={it.id}>
                <CardContent className="py-4 space-y-2">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                    <div>
                      <Link href={`/enrollment/review/${it.id}`} className="font-medium hover:underline">
                        {it.nombres} {it.apellidos} — {it.curso}
                      </Link>
                      <p className="text-sm text-muted-foreground">DNI: {it.dni} — Email: {it.email || '-'} — Estado: {it.estado}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span
                        className={`px-2 py-1 rounded text-sm ${
                          it.estado === 'completada' ? 'bg-emerald-100 text-emerald-800' :
                          it.estado === 'rechazada' ? 'bg-red-100 text-red-800' :
                          it.estado === 'pendiente' ? 'bg-amber-100 text-amber-800' :
                          'bg-slate-100 text-slate-800'
                        }`}
                      >
                        {it.estado}
                      </span>
                      <Link href={`/enrollment/review/${it.id}`}>
                        <Button variant="outline">Ver detalle</Button>
                      </Link>
                    </div>
                  </div>
                  {it.notas && <p className="text-xs text-muted-foreground">Notas: {it.notas}</p>}
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>

      {/* Modal para solicitar documentación */}
      <Dialog open={docModalOpen} onOpenChange={setDocModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Pedir documentación adicional</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="docNotas">Indique la documentación faltante o comentarios para el tutor</Label>
            <Textarea id="docNotas" value={docNotas} onChange={(e) => setDocNotas(e.target.value)} rows={4} />
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setDocModalOpen(false)}>Cancelar</Button>
            <Button
              onClick={async () => {
                if (!docTargetId) return
                await updateItem(docTargetId, 'documentacion_extra', docNotas)
                setDocModalOpen(false)
                setDocNotas("")
                setDocTargetId(null)
              }}
            >
              Enviar solicitud
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </MainLayout>
  )
}
