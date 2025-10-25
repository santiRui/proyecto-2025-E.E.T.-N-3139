"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { MainLayout } from "@/components/layout/main-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { ShieldCheck, Pencil, Trash2, RefreshCcw } from "lucide-react"

type Perfil = {
  id: string
  nombre_completo: string
  correo: string
  dni: string
  telefono: string | null
  rol: string
  created_at?: string
}

const roles = [
  { value: "estudiante", label: "Estudiante" },
  { value: "docente", label: "Docente" },
  { value: "preceptor", label: "Preceptor" },
  { value: "tutor", label: "Padre/Tutor" },
  { value: "directivo", label: "Directivo" },
  { value: "administrador", label: "Administrador" },
]

const ALL_ROLES_VALUE = "__all__"
const roleFilterOptions = [{ value: ALL_ROLES_VALUE, label: "Todos los roles" }, ...roles]

export default function AdminPage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [initializing, setInitializing] = useState(true)

  const [form, setForm] = useState({
    nombre_completo: "",
    correo: "",
    dni: "",
    telefono: "",
    contrasena: "",
    rol: "estudiante",
  })
  const [loading, setLoading] = useState(false)
  const [formError, setFormError] = useState("")
  const [formSuccess, setFormSuccess] = useState("")

  const [users, setUsers] = useState<Perfil[]>([])
  const [usersLoading, setUsersLoading] = useState(false)
  const [listError, setListError] = useState("")
  const [listSuccess, setListSuccess] = useState("")
  const [search, setSearch] = useState("")
  const [roleFilter, setRoleFilter] = useState(ALL_ROLES_VALUE)

  const [editForm, setEditForm] = useState<(Perfil & { contrasena?: string }) | null>(null)
  const [editLoading, setEditLoading] = useState(false)
  const [deleteCandidate, setDeleteCandidate] = useState<Perfil | null>(null)
  const [deleteLoading, setDeleteLoading] = useState(false)

  const roleLabels = useMemo(() => {
    return roles.reduce<Record<string, string>>((acc, curr) => {
      acc[curr.value] = curr.label
      return acc
    }, {})
  }, [])

  useEffect(() => {
    let cancelled = false

    const loadUser = () => {
      try {
        const userData = localStorage.getItem("user")
        if (!userData) {
          router.push("/login")
          return
        }
        const parsed = JSON.parse(userData)
        if (parsed?.dbRole !== "administrador" && parsed?.dbRole !== "directivo") {
          router.push("/dashboard")
          return
        }
        if (!cancelled) {
          setUser(parsed)
          setInitializing(false)
        }
      } catch {
        router.push("/login")
      }
    }

    loadUser()

    return () => {
      cancelled = true
    }
  }, [router])

  async function fetchUsers(searchValue = search, roleValue = roleFilter) {
    setUsersLoading(true)
    setListError("")
    setListSuccess("")
    try {
      const params = new URLSearchParams()
      if (searchValue) params.set("search", searchValue)
      if (roleValue && roleValue !== ALL_ROLES_VALUE) params.set("rol", roleValue)

      const query = params.toString()
      const res = await fetch(`/api/admin/usuarios${query ? `?${query}` : ""}`, {
        method: "GET",
        credentials: "include",
        headers: { Accept: "application/json" },
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setListError(data?.error || "No se pudieron obtener los usuarios")
        setUsers([])
        return
      }
      setUsers(Array.isArray(data?.users) ? data.users : [])
    } catch (err) {
      setListError("Error de red al obtener usuarios")
      setUsers([])
    } finally {
      setUsersLoading(false)
    }
  }

  useEffect(() => {
    if (!initializing) {
      fetchUsers()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initializing])

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setFormError("")
    setFormSuccess("")
    setListSuccess("")
    try {
      const res = await fetch("/api/admin/usuarios", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(form),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setFormError(data?.error || "No se pudo crear el usuario")
      } else {
        setFormSuccess("Usuario creado correctamente")
        setForm({ nombre_completo: "", correo: "", dni: "", telefono: "", contrasena: "", rol: "estudiante" })
        fetchUsers()
      }
    } catch (err) {
      setFormError("Error de red")
    } finally {
      setLoading(false)
    }
  }

  function handleEdit(userToEdit: Perfil) {
    setEditForm({ ...userToEdit, contrasena: "" })
    setListError("")
    setListSuccess("")
  }

  async function onEditSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!editForm) return

    setEditLoading(true)
    setListError("")
    setListSuccess("")
    try {
      const payload: Record<string, any> = {
        id: editForm.id,
        nombre_completo: editForm.nombre_completo,
        correo: editForm.correo,
        dni: editForm.dni,
        telefono: editForm.telefono || null,
        rol: editForm.rol,
      }
      if (editForm.contrasena && editForm.contrasena.trim()) {
        payload.contrasena = editForm.contrasena
      }

      const res = await fetch("/api/admin/usuarios", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setListError(data?.error || "No se pudo actualizar el usuario")
        return
      }
      setListSuccess("Usuario actualizado correctamente")
      setEditForm(null)
      fetchUsers()
    } catch (err) {
      setListError("Error de red al actualizar")
    } finally {
      setEditLoading(false)
    }
  }

  async function onDeleteConfirm() {
    if (!deleteCandidate) return
    setDeleteLoading(true)
    setListError("")
    setListSuccess("")
    try {
      const params = new URLSearchParams({ id: deleteCandidate.id })
      const res = await fetch(`/api/admin/usuarios?${params.toString()}`, {
        method: "DELETE",
        credentials: "include",
        headers: { Accept: "application/json" },
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setListError(data?.error || "No se pudo eliminar el usuario")
        return
      }
      setListSuccess("Usuario eliminado correctamente")
      setDeleteCandidate(null)
      fetchUsers()
    } catch (err) {
      setListError("Error de red al eliminar")
    } finally {
      setDeleteLoading(false)
    }
  }

  function handleFilterSubmit(e: React.FormEvent) {
    e.preventDefault()
    fetchUsers()
  }

  function handleResetFilters() {
    setSearch("")
    setRoleFilter(ALL_ROLES_VALUE)
    fetchUsers("", ALL_ROLES_VALUE)
  }

  if (initializing) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Cargando panel de administración...</p>
        </div>
      </div>
    )
  }

  return (
    <MainLayout>
      <div className="p-4 lg:p-6 space-y-6 animate-fade-in bg-gradient-to-br from-background via-background to-accent/5 min-h-0">
        <div className="max-w-6xl mx-auto space-y-6">
          <div className="flex items-start gap-4 animate-slide-up">
            <div className="p-3 rounded-xl bg-primary/10 text-primary shadow-sm">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h1 className="text-2xl lg:text-3xl font-semibold text-foreground">Panel de administración</h1>
              <p className="text-muted-foreground">
                {user?.username ? `Sesión iniciada como ${user.username}. ` : ""}Gestiona la creación, edición y eliminación de cuentas del sistema educativo.
              </p>
            </div>
          </div>

          <div className="grid gap-6 lg:gap-8">
            <div className="animate-slide-up" style={{ animationDelay: "0.05s" }}>
              <Card className="border-border shadow-lg">
                <CardHeader>
                  <CardTitle className="text-xl">Crear cuenta</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <p className="text-sm text-muted-foreground">
                    Completa los datos para registrar un usuario con su rol correspondiente.
                  </p>

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
                          {roles.map((r) => (
                            <SelectItem key={r.value} value={r.value}>
                              {r.label}
                            </SelectItem>
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

                  {formError && (
                    <Alert className="border-destructive/20 bg-destructive/10">
                      <AlertDescription className="text-sm">{formError}</AlertDescription>
                    </Alert>
                  )}

                  {formSuccess && (
                    <Alert className="border-green-500/20 bg-green-500/10">
                      <AlertDescription className="text-sm">{formSuccess}</AlertDescription>
                    </Alert>
                  )}
                </CardContent>
              </Card>
            </div>

            <div className="animate-slide-up" style={{ animationDelay: "0.15s" }}>
              <Card className="border-border shadow-lg">
                <CardHeader className="space-y-1">
                  <CardTitle className="text-xl">Usuarios existentes</CardTitle>
                  <p className="text-sm text-muted-foreground">Filtra, edita o elimina los perfiles ya registrados.</p>
                </CardHeader>
                <CardContent className="space-y-4">
                  <form onSubmit={handleFilterSubmit} className="grid grid-cols-1 md:grid-cols-4 gap-3">
                    <div className="md:col-span-2">
                      <Label className="sr-only" htmlFor="admin-search">
                        Buscar
                      </Label>
                      <Input
                        id="admin-search"
                        placeholder="Buscar por nombre, correo o DNI"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                      />
                    </div>
                    <div>
                      <Select value={roleFilter} onValueChange={setRoleFilter}>
                        <SelectTrigger>
                          <SelectValue placeholder="Filtrar por rol" />
                        </SelectTrigger>
                        <SelectContent>
                          {roleFilterOptions.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex gap-2">
                      <Button type="submit" className="flex-1">
                        Aplicar
                      </Button>
                      <Button type="button" variant="outline" onClick={handleResetFilters}>
                        Limpiar
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        className="hidden md:flex"
                        onClick={() => fetchUsers()}
                        disabled={usersLoading}
                      >
                        <RefreshCcw className={`w-4 h-4 ${usersLoading ? "animate-spin" : ""}`} />
                      </Button>
                    </div>
                  </form>

                  {listError && (
                    <Alert className="border-destructive/20 bg-destructive/10">
                      <AlertDescription className="text-sm">{listError}</AlertDescription>
                    </Alert>
                  )}

                  {listSuccess && (
                    <Alert className="border-green-500/20 bg-green-500/10">
                      <AlertDescription className="text-sm">{listSuccess}</AlertDescription>
                    </Alert>
                  )}

                  <div className="rounded-md border border-border/60 overflow-hidden">
                    {usersLoading ? (
                      <div className="py-10 text-center text-sm text-muted-foreground">Cargando usuarios...</div>
                    ) : users.length === 0 ? (
                      <div className="py-10 text-center text-sm text-muted-foreground">No se encontraron usuarios con los filtros seleccionados.</div>
                    ) : (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Nombre</TableHead>
                            <TableHead>Correo</TableHead>
                            <TableHead>DNI</TableHead>
                            <TableHead>Teléfono</TableHead>
                            <TableHead>Rol</TableHead>
                            <TableHead>Creado</TableHead>
                            <TableHead className="text-right">Acciones</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {users.map((item) => {
                            const createdAt = item.created_at ? new Date(item.created_at) : null
                            return (
                              <TableRow key={item.id}>
                                <TableCell className="font-medium">{item.nombre_completo}</TableCell>
                                <TableCell>{item.correo}</TableCell>
                                <TableCell>{item.dni}</TableCell>
                                <TableCell>{item.telefono || "-"}</TableCell>
                                <TableCell>
                                  <Badge variant="secondary" className="capitalize">
                                    {roleLabels[item.rol] || item.rol}
                                  </Badge>
                                </TableCell>
                                <TableCell>
                                  {createdAt ? createdAt.toLocaleString("es-AR", { dateStyle: "short", timeStyle: "short" }) : "-"}
                                </TableCell>
                                <TableCell className="text-right">
                                  <div className="flex justify-end gap-2">
                                    <Button variant="outline" size="icon" onClick={() => handleEdit(item)}>
                                      <Pencil className="w-4 h-4" />
                                      <span className="sr-only">Editar</span>
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="text-destructive hover:text-destructive"
                                      onClick={() => setDeleteCandidate(item)}
                                    >
                                      <Trash2 className="w-4 h-4" />
                                      <span className="sr-only">Eliminar</span>
                                    </Button>
                                  </div>
                                </TableCell>
                              </TableRow>
                            )
                          })}
                        </TableBody>
                      </Table>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>

      <Dialog open={!!editForm} onOpenChange={(open) => (!open ? setEditForm(null) : undefined)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar usuario</DialogTitle>
            <DialogDescription>Actualiza los datos del usuario seleccionado.</DialogDescription>
          </DialogHeader>
          {editForm ? (
            <form onSubmit={onEditSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label>Nombre completo</Label>
                <Input
                  value={editForm.nombre_completo}
                  onChange={(e) => setEditForm({ ...editForm, nombre_completo: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Correo</Label>
                <Input
                  type="email"
                  value={editForm.correo}
                  onChange={(e) => setEditForm({ ...editForm, correo: e.target.value })}
                  required
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>DNI</Label>
                  <Input
                    value={editForm.dni}
                    onChange={(e) => setEditForm({ ...editForm, dni: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Teléfono</Label>
                  <Input
                    value={editForm.telefono ?? ""}
                    onChange={(e) => setEditForm({ ...editForm, telefono: e.target.value })}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Rol</Label>
                <Select value={editForm.rol} onValueChange={(v) => setEditForm({ ...editForm, rol: v })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona un rol" />
                  </SelectTrigger>
                  <SelectContent>
                    {roles.map((r) => (
                      <SelectItem key={r.value} value={r.value}>
                        {r.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Nueva contraseña (opcional)</Label>
                <Input
                  type="password"
                  value={editForm.contrasena ?? ""}
                  onChange={(e) => setEditForm({ ...editForm, contrasena: e.target.value })}
                  placeholder="Ingresa para actualizar la contraseña"
                />
              </div>
              <DialogFooter className="pt-2">
                <Button type="button" variant="outline" onClick={() => setEditForm(null)}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={editLoading}>
                  {editLoading ? "Guardando..." : "Guardar cambios"}
                </Button>
              </DialogFooter>
            </form>
          ) : null}
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteCandidate} onOpenChange={(open) => (!open ? setDeleteCandidate(null) : undefined)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar usuario?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción eliminará la cuenta de {deleteCandidate?.nombre_completo}. No se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteLoading}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={onDeleteConfirm} disabled={deleteLoading} className="bg-destructive hover:bg-destructive/90">
              {deleteLoading ? "Eliminando..." : "Eliminar"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </MainLayout>
  )
}
