"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { MainLayout } from "@/components/layout/main-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"

export default function EnrollmentParentEditPage() {
  const params = useParams() as { id?: string }
  const router = useRouter()
  const id = Array.isArray(params?.id) ? params.id[0] : params?.id

  const [dni, setDni] = useState("")
  const [message, setMessage] = useState("")
  const [files, setFiles] = useState<{ libreta: File | null, photo: File | null, birthCertificate: File | null, dniCopy: File | null }>({
    libreta: null,
    photo: null,
    birthCertificate: null,
    dniCopy: null,
  })
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    // validar que es padre/tutor
    const raw = localStorage.getItem("user")
    if (!raw) { router.push("/login"); return }
    const u = JSON.parse(raw)
    const toTokens = (s: string) => String(s || '').toLowerCase().split(/[\s,/|]+/).filter(Boolean)
    const roles = Array.from(new Set([...toTokens(u.role), ...toTokens(u.dbRole)]))
    const allowed = roles.some(r => ["padre", "tutor", "parent"].includes(r))
    if (!allowed) { router.push("/dashboard"); return }
  }, [router])

  const handleSubmit = async () => {
    if (!id) return
    setLoading(true)
    try {
      const raw = localStorage.getItem('user')
      const u = raw ? JSON.parse(raw) : null
      const tutorEmail = String(u?.email || u?.correo || u?.username || '').trim()
      if (!tutorEmail || !tutorEmail.includes('@')) {
        alert('No se pudo determinar el email del tutor')
        return
      }
      const form = new FormData()
      form.set('id', id)
      form.set('tutor_email', tutorEmail)
      form.set('message', message)
      if (files.libreta) form.set('libreta', files.libreta)
      if (files.photo) form.set('photo', files.photo)
      if (files.birthCertificate) form.set('birthCertificate', files.birthCertificate)
      if (files.dniCopy) form.set('dniCopy', files.dniCopy)

      const res = await fetch('/api/enrollment/parent-update', { method: 'POST', body: form })
      const data = await res.json().catch(() => null)
      if (!res.ok) {
        alert(data?.error || 'No se pudo enviar la actualización')
        return
      }
      alert('Enviado. El preceptor revisará nuevamente tu inscripción.')
      router.push('/enrollment/status')
    } catch (e: any) {
      alert(e?.message || 'Ocurrió un problema')
    } finally {
      setLoading(false)
    }
  }

  return (
    <MainLayout>
      <div className="p-4 md:p-6 space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-xl md:text-2xl font-bold">Completar requerimientos</h1>
          <Button variant="outline" onClick={() => router.back()}>Volver</Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Subir documentación faltante</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Libreta de Calificaciones (opcional)</Label>
                <Input type="file" accept=".pdf,.jpg,.png" onChange={(e) => setFiles(s => ({ ...s, libreta: e.target.files?.[0] || null }))} />
              </div>
              <div className="space-y-2">
                <Label>Foto 4x4 (opcional)</Label>
                <Input type="file" accept=".jpg,.jpeg,.png" onChange={(e) => setFiles(s => ({ ...s, photo: e.target.files?.[0] || null }))} />
              </div>
              <div className="space-y-2">
                <Label>Partida de Nacimiento (opcional)</Label>
                <Input type="file" accept=".pdf,.jpg,.png" onChange={(e) => setFiles(s => ({ ...s, birthCertificate: e.target.files?.[0] || null }))} />
              </div>
              <div className="space-y-2">
                <Label>Copia de DNI (opcional)</Label>
                <Input type="file" accept=".pdf,.jpg,.png" onChange={(e) => setFiles(s => ({ ...s, dniCopy: e.target.files?.[0] || null }))} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Mensaje al preceptor</Label>
              <Textarea value={message} onChange={(e) => setMessage(e.target.value)} rows={4} placeholder="Aclare lo solicitado o agregue comentarios" />
            </div>
            <div className="flex justify-end">
              <Button onClick={handleSubmit} disabled={loading}>{loading ? 'Enviando...' : 'Enviar actualización'}</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  )
}
