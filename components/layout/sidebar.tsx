"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { Calendar, Users, BookOpen, BarChart3, Newspaper, UserPlus, ClipboardList, X, LogOut } from "lucide-react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"

interface SidebarItem {
  title: string
  href: string
  icon: any
  roles: string[]
}

const sidebarItems: SidebarItem[] = [
  {
    title: "Dashboard",
    href: "/dashboard",
    icon: Calendar,
    roles: ["student", "teacher", "preceptor", "parent"],
  },
  {
    title: "Noticias",
    href: "/news",
    icon: Newspaper,
    roles: ["student", "teacher", "preceptor", "parent"],
  },
  {
    title: "Estudiantes",
    href: "/students",
    icon: Users,
    roles: ["teacher", "preceptor"],
  },
  {
    title: "Notas y Asistencia",
    href: "/grades",
    icon: ClipboardList,
    roles: ["student", "teacher", "preceptor", "parent"],
  },
  {
    title: "Material Educativo",
    href: "/materials",
    icon: BookOpen,
    roles: ["student", "teacher", "preceptor", "parent"],
  },
  {
    title: "Inscripción Digital",
    href: "/enrollment",
    icon: UserPlus,
    roles: ["preceptor"],
  },
  {
    title: "Reportes",
    href: "/reports",
    icon: BarChart3,
    roles: ["teacher", "preceptor"],
  },
]

interface SidebarProps {
  isOpen?: boolean
  onClose?: () => void
}

export function Sidebar({ isOpen = true, onClose }: SidebarProps) {
  const [user, setUser] = useState<any>(null)
  const pathname = usePathname()
  const router = useRouter()

  useEffect(() => {
    const userData = localStorage.getItem("user")
    if (userData) {
      setUser(JSON.parse(userData))
    }
  }, [])

  if (!user) return null

  const isAdmin = user?.dbRole === 'administrador'
  const filteredItems = isAdmin ? sidebarItems : sidebarItems.filter((item) => item.roles.includes(user.role))

  return (
    <>
      {isOpen && <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={onClose} />}

      <aside
        className={cn(
          "fixed lg:static inset-y-0 left-0 z-50 w-64 bg-gradient-to-b from-sidebar via-sidebar to-sidebar/95 border-r border-border/50 backdrop-blur-sm transition-transform duration-300 ease-in-out",
          "lg:translate-x-0", // Siempre visible en desktop
          isOpen ? "translate-x-0" : "-translate-x-full", // Controlado por estado en móviles
        )}
      >
        <div className="p-4 h-full overflow-y-auto flex flex-col">
          <div className="flex items-center justify-between mb-6 pb-4 border-b border-border/30">
            <div>
              <h2 className="text-lg font-semibold bg-gradient-to-r from-primary to-primary-light bg-clip-text text-transparent">
                E.E.T. N°3139
              </h2>
              <p className="text-xs text-muted-foreground mt-1">Martín Miguel de Güemes</p>
            </div>
            <Button variant="ghost" size="sm" className="lg:hidden p-1 h-8 w-8" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          </div>

          <nav className="space-y-2 flex-1">
            {filteredItems.map((item, index) => {
              const Icon = item.icon
              const isActive = pathname === item.href

              return (
                <Link key={item.href} href={item.href}>
                  <Button
                    variant={isActive ? "default" : "ghost"}
                    className={cn(
                      "w-full justify-start gap-3 h-11 transition-all duration-200 animate-fade-in hover-lift",
                      isActive
                        ? "bg-gradient-to-r from-primary to-primary-light text-primary-foreground shadow-lg"
                        : "hover:bg-gradient-to-r hover:from-accent-green/10 hover:to-accent-green-light/10 hover:text-primary",
                    )}
                    style={{ animationDelay: `${index * 0.05}s` }}
                    onClick={() => {
                      if (window.innerWidth < 1024) {
                        onClose?.()
                      }
                    }}
                  >
                    <Icon className="w-4 h-4 flex-shrink-0" />
                    <span className="truncate">{item.title}</span>
                  </Button>
                </Link>
              )
            })}
          </nav>

          <div className="pt-4 border-t border-border/30">
            <Button
              variant="ghost"
              className="w-full justify-start gap-3 h-11 text-destructive hover:text-destructive hover:bg-destructive/10"
              onClick={async () => {
                try { await fetch('/api/logout', { method: 'POST', credentials: 'include' }) } catch {}
                try { localStorage.removeItem('user') } catch {}
                router.push('/login')
              }}
            >
              <LogOut className="w-4 h-4" />
              <span>Cerrar sesión</span>
            </Button>
          </div>
        </div>
      </aside>
    </>
  )
}
