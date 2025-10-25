"use client"

import { useEffect, useMemo, useState } from "react"
import { MainLayout } from "@/components/layout/main-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useRouter } from "next/navigation"

export default function SubjectsPage() {
  const [user, setUser] = useState<any>(null)
  const [subjects, setSubjects] = useState<any[]>([])
  const [query, setQuery] = useState("")

  const [openCreateSubject, setOpenCreateSubject] = useState(false)
  const [newSubjectName, setNewSubjectName] = useState("")
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")

  const [editOpen, setEditOpen] = useState(false)
  const [editSubject, setEditSubject] = useState<any>(null)
  const [editName, setEditName] = useState("")

  const [assignOpen, setAssignOpen] = useState(false)
  const [assignSubject, setAssignSubject] = useState<any>(null)
  const [teacherQuery, setTeacherQuery] = useState("")
  const [teacherResults, setTeacherResults] = useState<any[]>([])
  const [selectedTeacherId, setSelectedTeacherId] = useState<string>("")
  const [assigning, setAssigning] = useState(false)
  const [assignedTeachers, setAssignedTeachers] = useState<any[]>([])
  const [counts, setCounts] = useState<Record<string, number>>({})

  const router = useRouter()

  useEffect(() => {
    const u = localStorage.getItem("user")
    if (!u) { router.push("/login"); return }
    const parsed = JSON.parse(u)
    // Solo preceptor, directivo, administrador
    const allowed = parsed.role === 'preceptor' || parsed.dbRole === 'directivo' || parsed.dbRole === 'administrador'
    if (!allowed) { router.push('/dashboard'); return }
    setUser(parsed)
  }, [router])

  async function loadSubjects() {
    const res = await fetch('/api/subjects', { credentials: 'include' })
    const data = await res.json().catch(() => ({}))
    if (res.ok) setSubjects(data.subjects || [])
  }

  useEffect(() => { loadSubjects() }, [])

  async function refreshCountFor(subjectId: string) {
    try {
      const res = await fetch(`/api/subject-teachers?subject_id=${encodeURIComponent(subjectId)}`, { credentials: 'include' })
      const data = await res.json().catch(() => ({}))
      setCounts((prev) => ({ ...prev, [subjectId]: Array.isArray(data.assignments) ? data.assignments.length : 0 }))
    } catch {
      setCounts((prev) => ({ ...prev, [subjectId]: 0 }))
    }
  }

  useEffect(() => {
    // after subjects load, fetch counts
    if (subjects.length === 0) return
    ;(async () => {
      await Promise.all(subjects.map((s) => refreshCountFor(s.id)))
    })()
  }, [subjects.length])

  async function loadAssignedTeachers(subjectId: string) {
    const res = await fetch(`/api/subject-teachers?subject_id=${encodeURIComponent(subjectId)}`, { credentials: 'include' })
    const data = await res.json().catch(() => ({}))
    if (res.ok) setAssignedTeachers(data.assignments || [])
  }

  async function createSubject() {
    setSaving(true)
    setError("")
    try {
      const res = await fetch('/api/subjects', { method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include', body: JSON.stringify({ nombre: newSubjectName.trim() }) })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) { setError(data?.error || 'No se pudo crear'); return }
      setOpenCreateSubject(false)
      setNewSubjectName("")
      await loadSubjects()
    } finally { setSaving(false) }
  }
  async function updateSubject() {
    if (!editSubject) return
    const res = await fetch('/api/subjects', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, credentials: 'include', body: JSON.stringify({ id: editSubject.id, nombre: editName.trim() }) })
    const data = await res.json().catch(() => ({}))
    if (!res.ok) { setError(data?.error || 'No se pudo actualizar'); return }
    setEditOpen(false)
    setEditSubject(null)
    setEditName("")
    await loadSubjects()
  }

  async function deleteSubject(id: string) {
    const res = await fetch(`/api/subjects?id=${encodeURIComponent(id)}`, { method: 'DELETE', credentials: 'include' })
    if (res.ok) setSubjects((prev) => prev.filter((s) => s.id !== id))
  }

  async function searchTeachers(q: string) {
    setTeacherQuery(q)
    try {
      const res = await fetch(`/api/teachers?q=${encodeURIComponent(q)}`, { credentials: 'include' })
      const data = await res.json().catch(() => ({}))
      if (res.ok) setTeacherResults(data.teachers || [])
    } catch {}
  }

  async function assignTeacherToSubject() {
    if (!assignSubject || !selectedTeacherId) return
    setAssigning(true)
    try {
      const res = await fetch('/api/subject-teachers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ teacher_id: selectedTeacherId, subject_id: assignSubject.id })
      })
      if (res.ok) {
        await loadAssignedTeachers(assignSubject.id)
        await refreshCountFor(assignSubject.id)
        setTeacherQuery("")
        setTeacherResults([])
        setSelectedTeacherId("")
      }
    } finally {
      setAssigning(false)
    }
  }

  async function unassignTeacher(assignmentId: string) {
    const res = await fetch(`/api/subject-teachers?id=${encodeURIComponent(assignmentId)}`, { method: 'DELETE', credentials: 'include' })
    if (res.ok && assignSubject) {
      await loadAssignedTeachers(assignSubject.id)
      await refreshCountFor(assignSubject.id)
    }
  }

  if (!user) return null

  return (
    <MainLayout>
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-foreground">Materias</h1>
          <div className="flex items-center gap-2">
            <Dialog open={openCreateSubject} onOpenChange={setOpenCreateSubject}>
              <DialogTrigger asChild>
                <Button>Nueva materia</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Crear materia</DialogTitle>
                </DialogHeader>
                <div className="space-y-3">
                  <div className="space-y-1">
                    <Label>Nombre</Label>
                    <Input value={newSubjectName} onChange={(e) => setNewSubjectName(e.target.value)} />
                  </div>
                  {error && <p className="text-sm text-destructive">{error}</p>}
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setOpenCreateSubject(false)}>Cancelar</Button>
                  <Button onClick={createSubject} disabled={!newSubjectName.trim() || saving}>Crear</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Materias</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="max-w-sm">
              <Input placeholder="Buscar materia..." value={query} onChange={(e) => setQuery(e.target.value)} />
            </div>
            <div className="space-y-2">
              {subjects
                .filter((s) => s.nombre?.toLowerCase().includes(query.toLowerCase()))
                .map((s) => (
                  <div key={s.id} className="p-3 border rounded flex items-center justify-between">
                    <div className="font-medium">{s.nombre} {typeof counts[s.id] === 'number' && <span className="text-xs text-muted-foreground">({counts[s.id]} docente{s.id && counts[s.id] === 1 ? '' : 's'})</span>}</div>
                    <div className="flex items-center gap-2">
                      <Button variant="secondary" onClick={async () => { setAssignSubject(s); setAssignOpen(true); await loadAssignedTeachers(s.id) }}>Asignar docente</Button>
                      <Button variant="outline" onClick={() => { setEditSubject(s); setEditName(s.nombre || ""); setEditOpen(true) }}>Editar</Button>
                      <Button variant="destructive" onClick={() => deleteSubject(s.id)}>Eliminar</Button>
                    </div>
                  </div>
                ))}
              {subjects.filter((s) => s.nombre?.toLowerCase().includes(query.toLowerCase())).length === 0 && (
                <div className="text-sm text-muted-foreground">No hay materias</div>
              )}
            </div>
          </CardContent>
        </Card>

        <Dialog open={editOpen} onOpenChange={(o) => { setEditOpen(o); if (!o) { setEditSubject(null); setEditName("") } }}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Editar materia</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <div className="space-y-1">
                <Label>Nombre</Label>
                <Input value={editName} onChange={(e) => setEditName(e.target.value)} />
              </div>
              {error && <p className="text-sm text-destructive">{error}</p>}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditOpen(false)}>Cancelar</Button>
              <Button onClick={updateSubject} disabled={!editName.trim()}>Guardar</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={assignOpen} onOpenChange={(o) => { setAssignOpen(o); if (!o) { setAssignSubject(null); setAssignedTeachers([]); setTeacherQuery(""); setTeacherResults([]); setSelectedTeacherId("") } }}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Asignar docente a {assignSubject?.nombre || 'materia'}</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <div className="space-y-1">
                <Label>Buscar docente</Label>
                <Input placeholder="Nombre o DNI" value={teacherQuery} onChange={(e) => searchTeachers(e.target.value)} />
                <div className="max-h-48 overflow-auto border rounded">
                  {teacherResults.map((t) => (
                    <label key={t.id} className="flex items-center gap-2 p-2 border-b last:border-b-0">
                      <input type="radio" name="sel_teacher" value={t.id} checked={selectedTeacherId === t.id} onChange={() => setSelectedTeacherId(t.id)} />
                      <div className="flex-1">
                        <div className="text-sm font-medium">{t.nombre_completo}</div>
                        <div className="text-xs text-muted-foreground">{t.dni} · {t.correo}</div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
              <div className="space-y-1">
                <Label>Docentes asignados</Label>
                <div className="max-h-48 overflow-auto border rounded">
                  {assignedTeachers.map((a) => (
                    <div key={a.id} className="flex items-center justify-between p-2 border-b last:border-b-0">
                      <div>
                        <div className="text-sm font-medium">{a.teacher_name}</div>
                        <div className="text-xs text-muted-foreground">{a.dni} · {a.correo}</div>
                      </div>
                      <Button variant="outline" onClick={() => unassignTeacher(a.id)}>Quitar</Button>
                    </div>
                  ))}
                  {assignedTeachers.length === 0 && (
                    <div className="p-2 text-sm text-muted-foreground">Sin docentes asignados</div>
                  )}
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setAssignOpen(false)}>Cancelar</Button>
              <Button onClick={assignTeacherToSubject} disabled={!assignSubject || !selectedTeacherId || assigning}>Asignar</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </MainLayout>
  )
}
