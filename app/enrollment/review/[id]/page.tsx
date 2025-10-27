"use client"

import { useEffect, useState } from "react"
import { useSearchParams, useParams, useRouter } from "next/navigation"
import { MainLayout } from "@/components/layout/main-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "@/hooks/use-toast"

export default function EnrollmentDetailPage() {
  const params = useParams() as { id?: string }
  const router = useRouter()
  const id = Array.isArray(params?.id) ? params.id[0] : params?.id

  const [item, setItem] = useState<any | null>(null)
  const [loading, setLoading] = useState(true)
  const [files, setFiles] = useState<any[]>([])
  const [grouped, setGrouped] = useState<any | null>(null)
  const [saving, setSaving] = useState(false)
  const [estadoLocal, setEstadoLocal] = useState<string>("")
  const [motivo, setMotivo] = useState<string>("")

  useEffect(() => {
    // verificar permisos mínimos (staff)
    const userData = localStorage.getItem("user")
    if (!userData) return
    const parsed = JSON.parse(userData)
    const r = String(parsed.role || '').toLowerCase()
    const db = String(parsed.dbRole || '').toLowerCase()
    const tokens = Array.from(new Set([...r.split(/[\s,/|]+/).filter(Boolean), ...db.split(/[\s,/|]+/).filter(Boolean)]))
    const allowed = tokens.some((x) => ["preceptor", "directivo", "administrador", "admin"].includes(x))
    if (!allowed) router.push("/dashboard")
  }, [router])

  useEffect(() => {
    if (!id) return
    setLoading(true)
    ;(async () => {
      try {
        const res = await fetch(`/api/enrollment/get?id=${encodeURIComponent(id)}`, { cache: "no-store" })
        if (!res.ok) {
          const data = await res.json().catch(() => null)
          throw new Error(data?.error || "No se pudo obtener la inscripción")
        }
        const data = await res.json()
        setItem(data.item)
        setEstadoLocal(String(data.item?.estado || ''))
        setMotivo(String(data.item?.notas || ''))
        // Cargar archivos por DNI
        try {
          if (data.item?.dni) {
            const r2 = await fetch(`/api/enrollment/files?dni=${encodeURIComponent(data.item.dni)}`, { cache: 'no-store' })
            if (r2.ok) {
              const f = await r2.json()
              setFiles(Array.isArray(f.files) ? f.files : [])
              setGrouped(f.grouped || null)
            }
          }
        } catch {}
      } catch (e: any) {
        toast({ title: "Error", description: e?.message || "Ocurrió un problema", variant: "destructive" })
      } finally {
        setLoading(false)
      }
    })()
  }, [id])

  return (
    <MainLayout>
      <div className="p-4 md:p-6 space-y-4">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-3">
            <h1 className="text-xl md:text-2xl font-bold text-foreground">Detalle de inscripción</h1>
            {item && (
              <span
                className={`px-2 py-1 rounded text-sm ${
                  (estadoLocal || item.estado) === 'completada' ? 'bg-emerald-100 text-emerald-800' :
                  (estadoLocal || item.estado) === 'rechazada' ? 'bg-red-100 text-red-800' :
                  (estadoLocal || item.estado) === 'pendiente' ? 'bg-amber-100 text-amber-800' :
                  'bg-slate-100 text-slate-800'
                }`}
              >
                {(estadoLocal || item.estado) || 'sin_revisar'}
              </span>
            )}
          </div>
          <Button variant="outline" onClick={() => router.back()}>Volver</Button>
        </div>

        {loading && <p className="text-sm text-muted-foreground">Cargando...</p>}
        {!loading && !item && <p className="text-sm text-muted-foreground">No encontrada.</p>}

        {item && (
          <div className="space-y-6">
            {/* Datos del Estudiante */}
            <Card>
              <CardHeader>
                <CardTitle>Datos del Estudiante</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Nombre</Label>
                    <Input readOnly value={item.nombres || ''} />
                  </div>
                  <div className="space-y-2">
                    <Label>Apellido</Label>
                    <Input readOnly value={item.apellidos || ''} />
                  </div>
                  <div className="space-y-2">
                    <Label>DNI</Label>
                    <Input readOnly value={item.dni || ''} />
                  </div>
                  <div className="space-y-2">
                    <Label>Fecha de Nacimiento</Label>
                    <Input readOnly value={item.fecha_nacimiento || ''} />
                  </div>
                  <div className="space-y-2">
                    <Label>Curso</Label>
                    <Input readOnly value={item.curso || ''} />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Dirección</Label>
                  <Input readOnly value={item.direccion || ''} />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Email</Label>
                    <Input readOnly value={item.email || ''} />
                  </div>
                  <div className="space-y-2">
                    <Label>Teléfono</Label>
                    <Input readOnly value={item.telefono || ''} />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Documentación */}
            <Card>
              <CardHeader>
                <CardTitle>Documentación</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {(!grouped || files.length === 0) ? (
                  <p className="text-sm text-muted-foreground">Sin archivos subidos.</p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <Label>Libreta de Calificaciones</Label>
                      {grouped?.libreta ? (
                        <a href={grouped.libreta.public_url} target="_blank" rel="noreferrer" className="text-primary hover:underline">
                          {grouped.libreta.name}
                        </a>
                      ) : (
                        <p className="text-sm text-muted-foreground">No adjunto</p>
                      )}
                    </div>
                    <div className="space-y-1">
                      <Label>Foto 4x4</Label>
                      {grouped?.foto ? (
                        <a href={grouped.foto.public_url} target="_blank" rel="noreferrer" className="text-primary hover:underline">
                          {grouped.foto.name}
                        </a>
                      ) : (
                        <p className="text-sm text-muted-foreground">No adjunto</p>
                      )}
                    </div>
                    <div className="space-y-1">
                      <Label>Partida de Nacimiento</Label>
                      {grouped?.partida ? (
                        <a href={grouped.partida.public_url} target="_blank" rel="noreferrer" className="text-primary hover:underline">
                          {grouped.partida.name}
                        </a>
                      ) : (
                        <p className="text-sm text-muted-foreground">No adjunto</p>
                      )}
                    </div>
                    <div className="space-y-1">
                      <Label>Copia de DNI</Label>
                      {grouped?.dni ? (
                        <a href={grouped.dni.public_url} target="_blank" rel="noreferrer" className="text-primary hover:underline">
                          {grouped.dni.name}
                        </a>
                      ) : (
                        <p className="text-sm text-muted-foreground">No adjunto</p>
                      )}
                    </div>
                    {grouped?.otros?.length ? (
                      <div className="md:col-span-2 space-y-1">
                        <Label>Otros</Label>
                        <ul className="list-disc pl-6">
                          {grouped.otros.map((f: any) => (
                            <li key={f.path}>
                              <a href={f.public_url} target="_blank" rel="noreferrer" className="text-primary hover:underline">
                                {f.name}
                              </a>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ) : null}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Datos del Tutor */}
            <Card>
              <CardHeader>
                <CardTitle>Datos del Tutor</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Nombre</Label>
                  <Input readOnly value={item.tutor_nombres || ''} />
                </div>
                <div className="space-y-2">
                  <Label>Apellido</Label>
                  <Input readOnly value={item.tutor_apellidos || ''} />
                </div>
                <div className="space-y-2">
                  <Label>DNI</Label>
                  <Input readOnly value={item.tutor_dni || ''} />
                </div>
                <div className="space-y-2">
                  <Label>Parentesco</Label>
                  <Input readOnly value={item.tutor_parentesco || ''} />
                </div>
                <div className="space-y-2">
                  <Label>Dirección</Label>
                  <Input readOnly value={item.tutor_direccion || ''} />
                </div>
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input readOnly value={item.tutor_email || ''} />
                </div>
                <div className="space-y-2">
                  <Label>Teléfono</Label>
                  <Input readOnly value={item.tutor_telefono || ''} />
                </div>
                <div className="space-y-2">
                  <Label>Ocupación</Label>
                  <Input readOnly value={item.tutor_ocupacion || ''} />
                </div>
                <div className="space-y-2 mt-2">
                  <Label>Estado de Inscripción</Label>
                  <Select
                    value={estadoLocal || 'sin_revisar'}
                    onValueChange={(v) => {
                      setEstadoLocal(v)
                    }}
                  >
                    <SelectTrigger
                      disabled={saving}
                      className={`${
                        estadoLocal === 'completada' ? 'bg-emerald-100 text-emerald-800' :
                        estadoLocal === 'rechazada' ? 'bg-red-100 text-red-800' :
                        estadoLocal === 'pendiente' ? 'bg-amber-100 text-amber-800' :
                        'bg-slate-100 text-slate-800'
                      }`}
                    >
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {estadoLocal === 'sin_revisar' && (
                        <SelectItem value="sin_revisar" disabled>
                          Sin revisar
                        </SelectItem>
                      )}
                      <SelectItem value="pendiente">Pendiente</SelectItem>
                      <SelectItem value="completada">Completada</SelectItem>
                      <SelectItem value="rechazada">Rechazada</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {(estadoLocal === 'pendiente' || estadoLocal === 'rechazada') && (
                  <div className="space-y-2 mt-3 md:col-span-3">
                    <Label>Motivo</Label>
                    <Textarea
                      value={motivo}
                      onChange={(e) => setMotivo(e.target.value)}
                      placeholder={estadoLocal === 'pendiente' ? 'Describa la documentación faltante' : 'Indique la razón del rechazo'}
                      rows={4}
                    />
                    <div className="flex justify-end">
                      <Button
                        disabled={saving}
                        onClick={async () => {
                          setSaving(true)
                          try {
                            const res = await fetch('/api/enrollment/update', {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({ id, estado: estadoLocal, notas: motivo }),
                            })
                            if (!res.ok) {
                              const data = await res.json().catch(() => null)
                              throw new Error(data?.error || 'No se pudo actualizar')
                            }
                            setItem({ ...item, estado: estadoLocal, notas: motivo })
                            toast({ title: 'Actualizado', description: 'Cambios guardados' })
                          } catch (e: any) {
                            toast({ title: 'Error', description: e?.message || 'Ocurrió un problema', variant: 'destructive' })
                          } finally {
                            setSaving(false)
                          }
                        }}
                      >
                        Guardar
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </MainLayout>
  )
}
