"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import { User, Mail, Phone, MapPin, Calendar, BookOpen, TrendingUp, Clock, Plus, Trash2 } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"

interface StudentProfileProps {
  student: any
  userRole: string
  userDbRole?: string
}

export function StudentProfile({ student, userRole, userDbRole }: StudentProfileProps) {
  const canManageTutors = userRole === "preceptor" || userDbRole === 'directivo'
  const [allTutors, setAllTutors] = useState<any[]>([])
  const [studentTutors, setStudentTutors] = useState<any[]>([])
  const [selectedTutor, setSelectedTutor] = useState<string>("")
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState("")
  const [searching, setSearching] = useState(false)

  useEffect(() => {
    if (!canManageTutors) return
    ;(async () => {
      try {
        const [tRes, sRes] = await Promise.all([
          fetch('/api/tutors', { credentials: 'include' }),
          fetch(`/api/student-tutors?student_id=${encodeURIComponent(student.id)}`, { credentials: 'include' }),
        ])
        const tData = await tRes.json().catch(() => ({}))
        const sData = await sRes.json().catch(() => ({}))
        if (tRes.ok) setAllTutors(tData.tutors || [])
        if (sRes.ok) setStudentTutors(sData.tutors || [])
      } catch {}
    })()
  }, [student?.id, canManageTutors])

  async function addTutor() {
    if (!selectedTutor) return
    try {
      const res = await fetch('/api/student-tutors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ student_id: student.id, tutor_id: selectedTutor }),
      })
      if (res.ok) {
        setSelectedTutor("")
        setOpen(false)
        const r = await fetch(`/api/student-tutors?student_id=${encodeURIComponent(student.id)}`, { credentials: 'include' })
        const d = await r.json().catch(() => ({}))
        if (r.ok) setStudentTutors(d.tutors || [])
      }
    } catch {}
  }

  async function removeTutor(tutorId: string) {
    try {
      const res = await fetch(`/api/student-tutors?student_id=${encodeURIComponent(student.id)}&tutor_id=${encodeURIComponent(tutorId)}`, {
        method: 'DELETE',
        credentials: 'include',
      })
      if (res.ok) {
        setStudentTutors((prev) => prev.filter((t) => t.id !== tutorId))
      }
    } catch {}
  }
  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800"
      case "warning":
        return "bg-yellow-100 text-yellow-800"
      case "inactive":
        return "bg-red-100 text-red-800"
      default:
        return "bg-muted text-muted-foreground"
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "active":
        return "Activo"
      case "warning":
        return "Requiere Atención"
      case "inactive":
        return "Inactivo"
      default:
        return status
    }
  }

  const mockSubjects = [
    { name: "Matemática", grade: 8.5, attendance: 95 },
    { name: "Lengua", grade: 9.0, attendance: 98 },
    { name: "Historia", grade: 7.8, attendance: 92 },
    { name: "Ciencias Naturales", grade: 8.2, attendance: 96 },
    { name: "Inglés", grade: 8.8, attendance: 94 },
    { name: "Informática", grade: 9.2, attendance: 100 },
  ]

  const mockRecentActivity = [
    { date: "2025-01-15", activity: "Examen de Matemática", result: "8.5" },
    { date: "2025-01-12", activity: "Entrega de proyecto", result: "Aprobado" },
    { date: "2025-01-10", activity: "Participación en clase", result: "Excelente" },
  ]

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <User className="w-5 h-5" />
          Perfil del Estudiante
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Basic Info */}
        <div className="text-center space-y-4">
          <Avatar className="w-20 h-20 mx-auto">
            <AvatarImage src={student.photo || "/placeholder.svg"} alt={student.name} />
            <AvatarFallback className="bg-primary text-primary-foreground text-lg">
              {student.name
                .split(" ")
                .map((n: string) => n[0])
                .join("")}
            </AvatarFallback>
          </Avatar>

          <div>
            <h3 className="text-xl font-semibold text-foreground">{student.name}</h3>
            <p className="text-muted-foreground">{student.course}</p>
            <Badge className={`mt-2 ${getStatusColor(student.status)}`}>{getStatusLabel(student.status)}</Badge>
          </div>
        </div>

        <Separator />

        {/* Contact Info */}
        <div className="space-y-3">
          <h4 className="font-semibold text-foreground">Información de Contacto</h4>
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm">
              <Mail className="w-4 h-4 text-muted-foreground" />
              <span className="text-muted-foreground">{student.email}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Phone className="w-4 h-4 text-muted-foreground" />
              <span className="text-muted-foreground">{student.phone}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <MapPin className="w-4 h-4 text-muted-foreground" />
              <span className="text-muted-foreground">Buenos Aires, Argentina</span>
            </div>
          </div>
        </div>

        <Separator />

        {/* Academic Summary */}
        <div className="space-y-3">
          <h4 className="font-semibold text-foreground">Resumen Académico</h4>
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center p-3 bg-accent/50 rounded-lg">
              <TrendingUp className="w-5 h-5 text-primary mx-auto mb-1" />
              <p className="text-sm text-muted-foreground">Promedio</p>
              <p className="text-lg font-semibold text-foreground">{student.average}</p>
            </div>
            <div className="text-center p-3 bg-accent/50 rounded-lg">
              <Clock className="w-5 h-5 text-primary mx-auto mb-1" />
              <p className="text-sm text-muted-foreground">Asistencia</p>
              <p className="text-lg font-semibold text-foreground">{student.attendance}%</p>
            </div>
          </div>
        </div>

        <Separator />

        {/* Subjects */}
        <div className="space-y-3">
          <h4 className="font-semibold text-foreground">Materias</h4>
          <div className="space-y-2">
            {mockSubjects.map((subject, index) => (
              <div key={index} className="flex items-center justify-between p-2 bg-accent/30 rounded">
                <div className="flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-primary" />
                  <span className="text-sm font-medium">{subject.name}</span>
                </div>
                <div className="text-right text-xs">
                  <div
                    className={`font-semibold ${subject.grade >= 8 ? "text-green-600" : subject.grade >= 6 ? "text-yellow-600" : "text-red-600"}`}
                  >
                    {subject.grade}
                  </div>
                  <div className="text-muted-foreground">{subject.attendance}%</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <Separator />

        {/* Recent Activity */}
        <div className="space-y-3">
          <h4 className="font-semibold text-foreground">Actividad Reciente</h4>
          <div className="space-y-2">
            {mockRecentActivity.map((activity, index) => (
              <div key={index} className="flex items-center justify-between p-2 border border-border rounded">
                <div>
                  <p className="text-sm font-medium">{activity.activity}</p>
                  <p className="text-xs text-muted-foreground">{activity.date}</p>
                </div>
                <Badge variant="secondary" className="text-xs">
                  {activity.result}
                </Badge>
              </div>
            ))}
          </div>
        </div>

        {/* Gestión de tutores */}
        {canManageTutors && (
          <>
            <Separator />
            <div className="space-y-3">
              <h4 className="font-semibold text-foreground">Tutores</h4>
              <div className="space-y-2">
                {studentTutors.length === 0 && (
                  <p className="text-sm text-muted-foreground">Sin tutores asociados</p>
                )}
                {studentTutors.map((t) => (
                  <div key={t.id} className="flex items-center justify-between p-2 border border-border rounded">
                    <div>
                      <p className="text-sm font-medium">{t.nombre_completo}</p>
                      <p className="text-xs text-muted-foreground">{t.correo} {t.telefono ? `· ${t.telefono}` : ''}</p>
                    </div>
                    <Button variant="outline" size="sm" onClick={() => removeTutor(t.id)}>
                      <Trash2 className="w-4 h-4 mr-1" /> Quitar
                    </Button>
                  </div>
                ))}
              </div>

              <Dialog open={open} onOpenChange={setOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="w-4 h-4 mr-1" /> Asignar tutor
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Asignar tutor</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-3">
                    <Input
                      placeholder="Buscar por nombre o DNI..."
                      value={query}
                      onChange={async (e) => {
                        const q = e.target.value
                        setQuery(q)
                        setSearching(true)
                        try {
                          const res = await fetch(`/api/tutors?q=${encodeURIComponent(q)}`, { credentials: 'include' })
                          const data = await res.json().catch(() => ({}))
                          if (res.ok) setAllTutors(data.tutors || [])
                        } finally {
                          setSearching(false)
                        }
                      }}
                    />

                    <div className="max-h-64 overflow-auto border border-border rounded">
                      {searching && (
                        <div className="p-3 text-sm text-muted-foreground">Buscando...</div>
                      )}
                      {!searching && (allTutors || []).filter((t) => !studentTutors.some((st) => st.id === t.id)).length === 0 && (
                        <div className="p-3 text-sm text-muted-foreground">Sin resultados</div>
                      )}
                      {(!searching && allTutors || [])
                        .filter((t) => !studentTutors.some((st) => st.id === t.id))
                        .map((t) => (
                          <label key={t.id} className="flex items-center gap-2 p-2 border-b border-border/50">
                            <input
                              type="radio"
                              name="sel_tutor"
                              value={t.id}
                              checked={selectedTutor === t.id}
                              onChange={() => setSelectedTutor(t.id)}
                            />
                            <div className="flex-1">
                              <p className="text-sm font-medium">{t.nombre_completo}</p>
                              <p className="text-xs text-muted-foreground">{t.dni ? `${t.dni} · ` : ''}{t.correo}</p>
                            </div>
                          </label>
                        ))}
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
                    <Button onClick={addTutor} disabled={!selectedTutor}>Asociar</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}
