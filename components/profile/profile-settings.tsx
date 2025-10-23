"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { User, Mail, Phone, MapPin, Lock, Save, Camera } from "lucide-react"

interface ProfileSettingsProps {
  user: any
}

export function ProfileSettings({ user }: ProfileSettingsProps) {
  const [profileData, setProfileData] = useState({
    firstName: "Juan",
    lastName: "Pérez",
    email: user.username + "@eet3139.edu.ar",
    phone: "+54 11 1234-5678",
    address: "Av. San Martín 1234, Buenos Aires",
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  })

  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  const handleInputChange = (field: string, value: string) => {
    setProfileData((prev) => ({ ...prev, [field]: value }))
  }

  const handleSave = async () => {
    setIsSaving(true)

    // Simulate save operation
    setTimeout(() => {
      console.log("Saving profile:", profileData)
      alert("Perfil actualizado exitosamente")
      setIsEditing(false)
      setIsSaving(false)

      // Clear password fields
      setProfileData((prev) => ({
        ...prev,
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      }))
    }, 1000)
  }

  const getRoleLabel = (role: string) => {
    const roles = {
      student: "Estudiante",
      teacher: "Docente",
      preceptor: "Preceptor",
      parent: "Padre/Tutor",
    }
    return roles[role as keyof typeof roles] || role
  }

  const getRoleColor = (role: string) => {
    const colors = {
      student: "bg-blue-100 text-blue-800",
      teacher: "bg-green-100 text-green-800",
      preceptor: "bg-purple-100 text-purple-800",
      parent: "bg-orange-100 text-orange-800",
    }
    return colors[role as keyof typeof colors] || "bg-muted text-muted-foreground"
  }

  return (
    <div className="space-y-3 md:space-y-6">
      {/* Profile Header */}
      <Card>
        <CardHeader className="pb-3 md:pb-6">
          <CardTitle className="flex items-center gap-2 text-lg md:text-xl">
            <User className="w-4 h-4 md:w-5 md:h-5" />
            Información Personal
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6">
            <div className="relative">
              <Avatar className="w-16 h-16 md:w-24 md:h-24">
                <AvatarImage src="/placeholder.svg" alt="Profile" />
                <AvatarFallback className="bg-primary text-primary-foreground text-lg md:text-xl">
                  {profileData.firstName.charAt(0)}
                  {profileData.lastName.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <Button
                size="sm"
                variant="outline"
                className="absolute -bottom-1 -right-1 md:-bottom-2 md:-right-2 rounded-full w-6 h-6 md:w-8 md:h-8 p-0 bg-transparent"
              >
                <Camera className="w-3 h-3 md:w-4 md:h-4" />
              </Button>
            </div>

            <div className="space-y-1 md:space-y-2 text-center sm:text-left">
              <h3 className="text-lg md:text-xl font-semibold text-foreground">
                {profileData.firstName} {profileData.lastName}
              </h3>
              <Badge className={getRoleColor(user.role)}>{getRoleLabel(user.role)}</Badge>
              <p className="text-xs md:text-sm text-muted-foreground">Usuario: {user.username}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Personal Information */}
      <Card>
        <CardHeader className="pb-3 md:pb-6">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg md:text-xl">Datos Personales</CardTitle>
            <Button
              variant={isEditing ? "outline" : "default"}
              onClick={() => setIsEditing(!isEditing)}
              size="sm"
              className="text-xs md:text-sm"
            >
              {isEditing ? "Cancelar" : "Editar"}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-3 md:space-y-4 pt-0">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
            <div className="space-y-1 md:space-y-2">
              <Label htmlFor="firstName" className="text-sm">
                Nombre
              </Label>
              <Input
                id="firstName"
                value={profileData.firstName}
                onChange={(e) => handleInputChange("firstName", e.target.value)}
                disabled={!isEditing}
                className="h-9 md:h-10"
              />
            </div>
            <div className="space-y-1 md:space-y-2">
              <Label htmlFor="lastName" className="text-sm">
                Apellido
              </Label>
              <Input
                id="lastName"
                value={profileData.lastName}
                onChange={(e) => handleInputChange("lastName", e.target.value)}
                disabled={!isEditing}
                className="h-9 md:h-10"
              />
            </div>
          </div>

          <div className="space-y-1 md:space-y-2">
            <Label htmlFor="email" className="text-sm">
              Email
            </Label>
            <div className="flex items-center gap-2">
              <Mail className="w-4 h-4 text-muted-foreground flex-shrink-0" />
              <Input
                id="email"
                type="email"
                value={profileData.email}
                onChange={(e) => handleInputChange("email", e.target.value)}
                disabled={!isEditing}
                className="h-9 md:h-10"
              />
            </div>
          </div>

          <div className="space-y-1 md:space-y-2">
            <Label htmlFor="phone" className="text-sm">
              Teléfono
            </Label>
            <div className="flex items-center gap-2">
              <Phone className="w-4 h-4 text-muted-foreground flex-shrink-0" />
              <Input
                id="phone"
                value={profileData.phone}
                onChange={(e) => handleInputChange("phone", e.target.value)}
                disabled={!isEditing}
                className="h-9 md:h-10"
              />
            </div>
          </div>

          <div className="space-y-1 md:space-y-2">
            <Label htmlFor="address" className="text-sm">
              Dirección
            </Label>
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-muted-foreground flex-shrink-0" />
              <Input
                id="address"
                value={profileData.address}
                onChange={(e) => handleInputChange("address", e.target.value)}
                disabled={!isEditing}
                className="h-9 md:h-10"
              />
            </div>
          </div>

          {isEditing && (
            <div className="flex justify-end pt-2 md:pt-4">
              <Button onClick={handleSave} disabled={isSaving} className="gap-2 h-9 md:h-10 text-sm">
                {isSaving ? (
                  <>
                    <div className="animate-spin rounded-full h-3 w-3 md:h-4 md:w-4 border-b-2 border-primary-foreground"></div>
                    Guardando...
                  </>
                ) : (
                  <>
                    <Save className="w-3 h-3 md:w-4 md:h-4" />
                    Guardar Cambios
                  </>
                )}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Password Change */}
      <Card>
        <CardHeader className="pb-3 md:pb-6">
          <CardTitle className="flex items-center gap-2 text-lg md:text-xl">
            <Lock className="w-4 h-4 md:w-5 md:h-5" />
            Cambiar Contraseña
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 md:space-y-4 pt-0">
          <div className="space-y-1 md:space-y-2">
            <Label htmlFor="currentPassword" className="text-sm">
              Contraseña Actual
            </Label>
            <Input
              id="currentPassword"
              type="password"
              value={profileData.currentPassword}
              onChange={(e) => handleInputChange("currentPassword", e.target.value)}
              placeholder="Ingresa tu contraseña actual"
              className="h-9 md:h-10"
            />
          </div>

          <div className="space-y-1 md:space-y-2">
            <Label htmlFor="newPassword" className="text-sm">
              Nueva Contraseña
            </Label>
            <Input
              id="newPassword"
              type="password"
              value={profileData.newPassword}
              onChange={(e) => handleInputChange("newPassword", e.target.value)}
              placeholder="Ingresa tu nueva contraseña"
              className="h-9 md:h-10"
            />
          </div>

          <div className="space-y-1 md:space-y-2">
            <Label htmlFor="confirmPassword" className="text-sm">
              Confirmar Nueva Contraseña
            </Label>
            <Input
              id="confirmPassword"
              type="password"
              value={profileData.confirmPassword}
              onChange={(e) => handleInputChange("confirmPassword", e.target.value)}
              placeholder="Confirma tu nueva contraseña"
              className="h-9 md:h-10"
            />
          </div>

          <div className="flex justify-end pt-2 md:pt-4">
            <Button
              onClick={handleSave}
              disabled={
                !profileData.currentPassword ||
                !profileData.newPassword ||
                profileData.newPassword !== profileData.confirmPassword ||
                isSaving
              }
              className="gap-2 h-9 md:h-10 text-sm"
            >
              <Lock className="w-3 h-3 md:w-4 md:h-4" />
              Cambiar Contraseña
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
