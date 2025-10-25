"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { GraduationCap, Users, UserCheck, Heart } from "lucide-react"
import { useRouter } from "next/navigation"

const userRoles = [
  { value: "estudiante", label: "Estudiante", icon: GraduationCap },
  { value: "docente", label: "Docente", icon: Users },
  { value: "preceptor", label: "Preceptor", icon: UserCheck },
  { value: "tutor", label: "Padre/Tutor", icon: Heart },
  { value: "directivo", label: "Directivo", icon: Users },
  { value: "administrador", label: "Administrador", icon: Users },
]

export default function LoginPage() {
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [role, setRole] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const router = useRouter()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!username || !password || !role) return

    setIsLoading(true)
    setError("")
    try {
      const res = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ dni: username, password, role }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        setError(data?.error || "Credenciales inválidas")
        setIsLoading(false)
        return
      }
      const payload = await res.json().catch(() => ({} as any))
      // Guardar usuario con roles UI (en) y BD (es)
      try {
        const username = payload?.user?.nombre || 'Usuario'
        const dbRole: string = payload?.user?.rol || role
        const mapEsToEn: Record<string, string> = {
          administrador: 'admin',
          docente: 'teacher',
          preceptor: 'preceptor',
          tutor: 'parent',
          estudiante: 'student',
          directivo: 'directivo',
        }
        const uiRole = mapEsToEn[dbRole] || 'student'
        localStorage.setItem('user', JSON.stringify({ username, role: uiRole, dbRole }))
      } catch {}
      // Redirigir según rol de BD
      const dbRole = payload?.user?.rol || role
      router.push(dbRole === 'administrador' ? '/admin' : '/dashboard')
    } catch (err) {
      setError("Error de red. Intenta nuevamente.")
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-secondary to-background flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        {/* School Header */}
        <div className="text-center space-y-2">
          <div className="mx-auto w-16 h-16 bg-primary rounded-full flex items-center justify-center mb-4">
            <GraduationCap className="w-8 h-8 text-primary-foreground" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">E.E.T. N°3139</h1>
          <p className="text-muted-foreground text-balance">"Martín Miguel de Güemes"</p>
        </div>

        {/* Login Card */}
        <Card className="border-border shadow-lg">
          <CardHeader className="space-y-1">
            <CardTitle className="text-xl text-center">Iniciar Sesión</CardTitle>
            <CardDescription className="text-center">Ingresa tus credenciales para acceder al sistema</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="username">Usuario</Label>
                <Input
                  id="username"
                  type="text"
                  placeholder="Ingresa tu usuario"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  className="border-input-border focus:border-input-focus"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Contraseña</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Ingresa tu contraseña"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="border-input-border focus:border-input-focus"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="role">Tipo de Usuario</Label>
                <Select value={role} onValueChange={setRole} required>
                  <SelectTrigger className="border-input-border focus:border-input-focus">
                    <SelectValue placeholder="Selecciona tu rol" />
                  </SelectTrigger>
                  <SelectContent>
                    {userRoles.map((userRole) => {
                      const Icon = userRole.icon
                      return (
                        <SelectItem key={userRole.value} value={userRole.value}>
                          <div className="flex items-center gap-2">
                            <Icon className="w-4 h-4" />
                            {userRole.label}
                          </div>
                        </SelectItem>
                      )
                    })}
                  </SelectContent>
                </Select>
              </div>

              <Button
                type="submit"
                className="w-full bg-primary hover:bg-primary-hover text-primary-foreground"
                disabled={isLoading || !username || !password || !role}
              >
                {isLoading ? "Iniciando sesión..." : "Iniciar Sesión"}
              </Button>
            </form>

            {error && (
              <Alert className="mt-4 border-destructive/20 bg-destructive/10">
                <AlertDescription className="text-sm">
                  {error}
                </AlertDescription>
              </Alert>
            )}

          </CardContent>
        </Card>

        {/* Footer */}
        <footer className="text-center text-sm text-muted-foreground">
          © 2025 – E.E.T. N°3139 "Martín Miguel de Güemes"
        </footer>
      </div>
    </div>
  )
}
