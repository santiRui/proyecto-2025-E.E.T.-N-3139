"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { UserPlus, Upload, FileText, User, Users } from "lucide-react"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription } from "@/components/ui/alert-dialog"

export function EnrollmentForm() {
  const router = useRouter()
  const [studentData, setStudentData] = useState({
    firstName: "",
    lastName: "",
    dni: "",
    birthDate: "",
    average: "",
    address: "",
    email: "",
    phone: "",
    course: "",
  })

  const [tutorData, setTutorData] = useState({
    firstName: "",
    lastName: "",
    dni: "",
    relationship: "",
    address: "",
    email: "",
    phone: "",
    occupation: "",
  })

  const [files, setFiles] = useState({
    libreta: null as File | null,
    photo: null as File | null,
    birthCertificate: null as File | null,
    dniCopy: null as File | null,
  })

  // clave para forzar remount de los inputs file y limpiar su UI
  const [fileInputsKey, setFileInputsKey] = useState(0)

  const [observations, setObservations] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [dialogTitle, setDialogTitle] = useState("")
  const [dialogDesc, setDialogDesc] = useState("")
  const [dialogMode, setDialogMode] = useState<"success" | "error">("success")

  const handleStudentChange = (field: string, value: string) => {
    setStudentData((prev) => ({ ...prev, [field]: value }))
  }

  const handleTutorChange = (field: string, value: string) => {
    setTutorData((prev) => ({ ...prev, [field]: value }))
  }

  const handleFileChange = (field: string, file: File | null) => {
    setFiles((prev) => ({ ...prev, [field]: file }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    try {
      const formData = new FormData()
      // Campos del estudiante
      formData.append("firstName", studentData.firstName)
      formData.append("lastName", studentData.lastName)
      formData.append("dni", studentData.dni)
      formData.append("birthDate", studentData.birthDate)
      formData.append("average", studentData.average)
      formData.append("address", studentData.address)
      formData.append("email", studentData.email)
      formData.append("phone", studentData.phone)
      formData.append("course", studentData.course)

      // Campos del tutor
      formData.append("tutor_firstName", tutorData.firstName)
      formData.append("tutor_lastName", tutorData.lastName)
      formData.append("tutor_dni", tutorData.dni)
      formData.append("tutor_relationship", tutorData.relationship)
      formData.append("tutor_address", tutorData.address)
      formData.append("tutor_email", tutorData.email)
      formData.append("tutor_phone", tutorData.phone)
      formData.append("tutor_occupation", tutorData.occupation)

      // Observaciones
      formData.append("observations", observations)

      // Archivos
      if (files.libreta) formData.append("libreta", files.libreta)
      if (files.photo) formData.append("photo", files.photo)
      if (files.birthCertificate) formData.append("birthCertificate", files.birthCertificate)
      if (files.dniCopy) formData.append("dniCopy", files.dniCopy)

      const res = await fetch("/api/enrollment", {
        method: "POST",
        body: formData,
      })

      if (!res.ok) {
        const data = await res.json().catch(() => null)
        const message = data?.error || `Error al enviar la inscripción (${res.status})`
        setDialogMode("error")
        setDialogTitle("No se pudo enviar")
        setDialogDesc(message)
        setDialogOpen(true)
        return
      }

      const data = await res.json()
      console.log("Inscripción creada:", data)
      setDialogMode("success")
      setDialogTitle("Inscripción enviada")
      setDialogDesc("Se procesará en las próximas 48 horas. Puedes consultar el estado cuando quieras.")
      setDialogOpen(true)

      try {
        if (studentData.dni) localStorage.setItem('last_enrollment_student_dni', studentData.dni)
        if (tutorData.email) localStorage.setItem('last_enrollment_tutor_email', tutorData.email)
      } catch {}

      // Reset form
      setStudentData({
        firstName: "",
        lastName: "",
        dni: "",
        birthDate: "",
        average: "",
        address: "",
        email: "",
        phone: "",
        course: "",
      })
      setTutorData({
        firstName: "",
        lastName: "",
        dni: "",
        relationship: "",
        address: "",
        email: "",
        phone: "",
        occupation: "",
      })
      setFiles({
        libreta: null,
        photo: null,
        birthCertificate: null,
        dniCopy: null,
      })
      setObservations("")
      // Forzar limpieza visual de los <input type="file" />
      setFileInputsKey((k) => k + 1)
    } catch (e: any) {
      setDialogMode("error")
      setDialogTitle("Error")
      setDialogDesc(e?.message || "Ocurrió un problema al enviar la inscripción")
      setDialogOpen(true)
    } finally {
      setIsSubmitting(false)
    }
  }

  const isFormValid = () => {
    const requiredStudentFields = ["firstName", "lastName", "dni", "birthDate", "course"]
    const requiredTutorFields = ["firstName", "lastName", "dni", "relationship", "email", "phone"]

    const studentValid = requiredStudentFields.every((field) => studentData[field as keyof typeof studentData])
    const tutorValid = requiredTutorFields.every((field) => tutorData[field as keyof typeof tutorData])

    return studentValid && tutorValid
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Student Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="w-5 h-5" />
            Datos del Estudiante
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="studentFirstName">Nombre *</Label>
              <Input
                id="studentFirstName"
                value={studentData.firstName}
                onChange={(e) => handleStudentChange("firstName", e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="studentLastName">Apellido *</Label>
              <Input
                id="studentLastName"
                value={studentData.lastName}
                onChange={(e) => handleStudentChange("lastName", e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="studentDni">DNI *</Label>
              <Input
                id="studentDni"
                value={studentData.dni}
                onChange={(e) => handleStudentChange("dni", e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="studentBirthDate">Fecha de Nacimiento *</Label>
              <Input
                id="studentBirthDate"
                type="date"
                value={studentData.birthDate}
                onChange={(e) => handleStudentChange("birthDate", e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="studentAverage">Promedio</Label>
              <Input
                id="studentAverage"
                type="number"
                step="0.1"
                min="1"
                max="10"
                placeholder="Ej: 8.5"
                value={studentData.average}
                onChange={(e) => handleStudentChange("average", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="studentCourse">Curso a Inscribir *</Label>
              <Select value={studentData.course} onValueChange={(value) => handleStudentChange("course", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar curso" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1° año ciclo basico">1° año ciclo basico</SelectItem>
                  <SelectItem value="2° año ciclo basico">2° año ciclo basico</SelectItem>
                  <SelectItem value="1° año ciclo superior">1° año ciclo superior</SelectItem>
                  <SelectItem value="2° año ciclo superior">2° año ciclo superior</SelectItem>
                  <SelectItem value="3° año ciclo superior">3° año ciclo superior</SelectItem>
                  <SelectItem value="4° año ciclo superior">4° año ciclo superior</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="studentAddress">Dirección</Label>
            <Input
              id="studentAddress"
              placeholder="Calle, número, ciudad"
              value={studentData.address}
              onChange={(e) => handleStudentChange("address", e.target.value)}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="studentEmail">Email</Label>
              <Input
                id="studentEmail"
                type="email"
                value={studentData.email}
                onChange={(e) => handleStudentChange("email", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="studentPhone">Teléfono</Label>
              <Input
                id="studentPhone"
                value={studentData.phone}
                onChange={(e) => handleStudentChange("phone", e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tutor Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Datos del Padre/Tutor
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="tutorFirstName">Nombre *</Label>
              <Input
                id="tutorFirstName"
                value={tutorData.firstName}
                onChange={(e) => handleTutorChange("firstName", e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="tutorLastName">Apellido *</Label>
              <Input
                id="tutorLastName"
                value={tutorData.lastName}
                onChange={(e) => handleTutorChange("lastName", e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="tutorDni">DNI *</Label>
              <Input
                id="tutorDni"
                value={tutorData.dni}
                onChange={(e) => handleTutorChange("dni", e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="tutorRelationship">Parentesco *</Label>
              <Select
                value={tutorData.relationship}
                onValueChange={(value) => handleTutorChange("relationship", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar parentesco" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="padre">Padre</SelectItem>
                  <SelectItem value="madre">Madre</SelectItem>
                  <SelectItem value="tutor">Tutor Legal</SelectItem>
                  <SelectItem value="abuelo">Abuelo/a</SelectItem>
                  <SelectItem value="tio">Tío/a</SelectItem>
                  <SelectItem value="otro">Otro</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="tutorAddress">Dirección</Label>
            <Input
              id="tutorAddress"
              placeholder="Calle, número, ciudad"
              value={tutorData.address}
              onChange={(e) => handleTutorChange("address", e.target.value)}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="tutorEmail">Email *</Label>
              <Input
                id="tutorEmail"
                type="email"
                value={tutorData.email}
                onChange={(e) => handleTutorChange("email", e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="tutorPhone">Teléfono *</Label>
              <Input
                id="tutorPhone"
                value={tutorData.phone}
                onChange={(e) => handleTutorChange("phone", e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="tutorOccupation">Ocupación</Label>
              <Input
                id="tutorOccupation"
                value={tutorData.occupation}
                onChange={(e) => handleTutorChange("occupation", e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* File Uploads */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="w-5 h-5" />
            Documentación
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="libreta">Libreta de Calificaciones</Label>
              <Input
                id="libreta"
                type="file"
                accept=".pdf,.jpg,.png"
                key={`libreta-${fileInputsKey}`}
                onChange={(e) => handleFileChange("libreta", e.target.files?.[0] || null)}
              />
              {files.libreta && <p className="text-sm text-muted-foreground">Archivo: {files.libreta.name}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="photo">Foto 4x4</Label>
              <Input
                id="photo"
                type="file"
                accept=".jpg,.png"
                key={`photo-${fileInputsKey}`}
                onChange={(e) => handleFileChange("photo", e.target.files?.[0] || null)}
              />
              {files.photo && <p className="text-sm text-muted-foreground">Archivo: {files.photo.name}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="birthCertificate">Partida de Nacimiento</Label>
              <Input
                id="birthCertificate"
                type="file"
                accept=".pdf,.jpg,.png"
                key={`birthCertificate-${fileInputsKey}`}
                onChange={(e) => handleFileChange("birthCertificate", e.target.files?.[0] || null)}
              />
              {files.birthCertificate && (
                <p className="text-sm text-muted-foreground">Archivo: {files.birthCertificate.name}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="dniCopy">Copia de DNI</Label>
              <Input
                id="dniCopy"
                type="file"
                accept=".pdf,.jpg,.png"
                key={`dniCopy-${fileInputsKey}`}
                onChange={(e) => handleFileChange("dniCopy", e.target.files?.[0] || null)}
              />
              {files.dniCopy && <p className="text-sm text-muted-foreground">Archivo: {files.dniCopy.name}</p>}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Observations */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Observaciones
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Label htmlFor="observations">Comentarios Adicionales</Label>
            <Textarea
              id="observations"
              placeholder="Información adicional relevante para la inscripción..."
              value={observations}
              onChange={(e) => setObservations(e.target.value)}
              rows={4}
            />
          </div>
        </CardContent>
      </Card>

      {/* Submit */}
      <div className="flex justify-end">
        <Button type="submit" disabled={!isFormValid() || isSubmitting} className="gap-2">
          {isSubmitting ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-foreground"></div>
              Enviando Inscripción...
            </>
          ) : (
            <>
              <UserPlus className="w-4 h-4" />
              Enviar Inscripción
            </>
          )}
        </Button>
      </div>
    </form>
  )
}
