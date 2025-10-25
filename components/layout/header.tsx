"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { GraduationCap, LogOut, Menu, ChevronDown } from "lucide-react"
import { useRouter } from "next/navigation"

interface AppUser {
  username: string
  role: string
}

interface HeaderProps {
  onToggleSidebar?: () => void // Cambié el nombre de la prop para mayor claridad
}

export function Header({ onToggleSidebar }: HeaderProps) {
  const [user, setUser] = useState<AppUser | null>(null)
  const router = useRouter()

  useEffect(() => {
    const userData = localStorage.getItem("user")
    if (userData) {
      setUser(JSON.parse(userData))
    }
  }, [])

  const handleLogout = async () => {
    try {
      await fetch('/api/logout', { method: 'POST', credentials: 'include' })
    } catch {}
    try {
      localStorage.removeItem('user')
    } catch {}
    router.push('/login')
  }

  const getRoleLabel = (role: string) => {
    const roles = {
      student: "Estudiante",
      teacher: "Docente",
      preceptor: "Preceptor",
      parent: "Padre/Tutor",
      admin: "Administrador",
      directivo: "Directivo",
    }
    return roles[role as keyof typeof roles] || role
  }

  if (!user) return null

  return (
    <header className="border-b border-border bg-card/95 backdrop-blur-sm fixed md:sticky top-0 z-40 w-full">
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" className="lg:hidden p-2 h-10 w-10" onClick={onToggleSidebar}>
              <Menu className="w-5 h-5" />
            </Button>

            {/* Logo and School Name */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-primary to-primary-light rounded-full flex items-center justify-center shadow-lg">
                <GraduationCap className="w-5 h-5 text-primary-foreground" />
              </div>
              <div className="hidden sm:block">
                <h1 className="font-semibold text-foreground">E.E.T. N°3139</h1>
                <p className="text-xs text-muted-foreground">"Martín Miguel de Güemes"</p>
              </div>
            </div>
          </div>

          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger className="flex items-center gap-2 h-auto p-2 hover-lift cursor-pointer rounded-md focus:outline-none focus:ring-2 focus:ring-primary/30">
              <Avatar className="w-8 h-8 ring-2 ring-primary/20">
                <AvatarFallback className="bg-gradient-to-br from-primary to-primary-light text-primary-foreground text-sm font-semibold">
                  {user.username.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="text-left hidden sm:block">
                <p className="text-sm font-medium">{user.username}</p>
                <p className="text-xs text-muted-foreground">{getRoleLabel(user.role)}</p>
              </div>
              <ChevronDown className="w-4 h-4 text-muted-foreground hidden sm:block" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" sideOffset={8} className="w-56 z-[100]">
              <DropdownMenuItem onClick={() => router.push("/profile")}>                
                <GraduationCap className="w-4 h-4 mr-2" />
                Mi Perfil
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout} className="text-destructive">
                <LogOut className="w-4 h-4 mr-2" />
                Cerrar Sesión
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  )
}
