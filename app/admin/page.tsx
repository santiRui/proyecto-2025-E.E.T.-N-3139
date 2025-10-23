"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { LayoutGrid, Users, BookOpen, FileText, Newspaper, User2, BarChart3, ClipboardList, LogOut } from "lucide-react"

const roles = [
  { value: "estudiante", label: "Estudiante" },
  { value: "docente", label: "Docente" },
  { value: "preceptor", label: "Preceptor" },
  { value: "tutor", label: "Padre/Tutor" },
  { value: "administrador", label: "Administrador" },
]

const nav = [
  { href: "/dashboard", label: "Tablero", icon: LayoutGrid },
  { href: "/students", label: "Estudiantes", icon: Users },
  { href: "/enrollment", label: "Inscripciones", icon: ClipboardList },
  { href: "/grades", label: "Calificaciones", icon: FileText },
  { href: "/materials", label: "Materiales", icon: BookOpen },
  { href: "/news", label: "Novedades", icon: Newspaper },
  { href: "/reports", label: "Reportes", icon: BarChart3 },
  { href: "/profile", label: "Mi Perfil", icon: User2 },
]

export default function AdminPage() {
  const router = useRouter()
  const [form, setForm] = useState({
    nombre_completo: "",
    correo: "",
    dni: "",
    telefono: "",
    contrasena: "",
    rol: "estudiante",
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [ok, setOk] = useState("")

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError("")
    setOk("")
    try {
      const res = await fetch("/api/admin/usuarios", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(form),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setError(data?.error || "No se pudo crear el usuario")
      } else {
        setOk("Usuario creado correctamente")
        setForm({ nombre_completo: "", correo: "", dni: "", telefono: "", contrasena: "", rol: "estudiante" })
      }
    } catch (err) {
      setError("Error de red")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-secondary to-background">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-12 gap-4 p-4">
        <aside className="md:col-span-3 lg:col-span-2 bg-card border border-border rounded-lg p-3 h-fit sticky top-4">
          <div className="text-sm font-semibold text-foreground mb-2">Módulos</div>
          <nav className="space-y-1">
            {nav.map((item) => {
              const Icon = item.icon
              return (
                <Link key={item.href} href={item.href} className="flex items-center gap-2 px-3 py-2 rounded-md hover:bg-accent hover:text-accent-foreground transition-colors">
                  <Icon className="w-4 h-4" />
                  <span className="text-sm">{item.label}</span>
                </Link>
              )
            })}
            <div className="mt-3 text-xs text-muted-foreground px-3">Administración</div>
            <div className="flex items-center gap-2 px-3 py-2 rounded-md bg-primary text-primary-foreground">
              <Users className="w-4 h-4" />
              <span className="text-sm font-medium">Crear cuentas</span>
            </div>
            <div className="mt-4 pt-3 border-t border-border/30">
              <Button
                variant="ghost"
                className="w-full justify-start gap-2 h-10 text-destructive hover:text-destructive hover:bg-destructive/10"
                onClick={async () => {
                  try { await fetch('/api/logout', { method: 'POST', credentials: 'include' }) } catch {}
                  try { localStorage.removeItem('user') } catch {}
                  router.push('/login')
                }}
              >
                <LogOut className="w-4 h-4" />
                Cerrar sesión
              </Button>
            </div>
          </nav>
        </aside>

        <main className="md:col-span-9 lg:col-span-10">
          <Card className="border-border shadow-lg">
            <CardHeader>
              <CardTitle className="text-xl">Crear cuenta</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={onSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2 md:col-span-2">
                  <Label>Nombre completo</Label>
                  <Input value={form.nombre_completo} onChange={(e) => setForm({ ...form, nombre_completo: e.target.value })} required />
                </div>
                <div className="space-y-2">
                  <Label>Correo</Label>
                  <Input type="email" value={form.correo} onChange={(e) => setForm({ ...form, correo: e.target.value })} required />
                </div>
                <div className="space-y-2">
                  <Label>DNI</Label>
                  <Input value={form.dni} onChange={(e) => setForm({ ...form, dni: e.target.value })} required />
                </div>
                <div className="space-y-2">
                  <Label>Teléfono</Label>
                  <Input value={form.telefono} onChange={(e) => setForm({ ...form, telefono: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Contraseña</Label>
                  <Input type="password" value={form.contrasena} onChange={(e) => setForm({ ...form, contrasena: e.target.value })} required />
                </div>
                <div className="space-y-2">
                  <Label>Rol</Label>
                  <Select value={form.rol} onValueChange={(v) => setForm({ ...form, rol: v })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona un rol" />
                    </SelectTrigger>
                    <SelectContent>
                      {roles.map(r => (
                        <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="md:col-span-2">
                  <Button type="submit" className="w-full bg-primary hover:bg-primary-hover text-primary-foreground" disabled={loading}>
                    {loading ? "Creando..." : "Crear cuenta"}
                  </Button>
                </div>
              </form>

              {error && (
                <Alert className="mt-4 border-destructive/20 bg-destructive/10">
                  <AlertDescription className="text-sm">{error}</AlertDescription>
                </Alert>
              )}

              {ok && (
                <Alert className="mt-4 border-green-500/20 bg-green-500/10">
                  <AlertDescription className="text-sm">{ok}</AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        </main>
      </div>
    </div>
  )
}
