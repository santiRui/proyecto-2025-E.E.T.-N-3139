"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Search, Filter, Users } from "lucide-react"

const defaultCourses = ["3° Año C", "4° Año A", "4° Año B", "5° Año A", "5° Año B", "6° Año A"]

interface StudentListProps {
  userRole: string
  onSelectStudent: (student: any) => void
  selectedStudentId?: number
  students?: any[]
  courses?: string[]
}

export function StudentList({ userRole, onSelectStudent, selectedStudentId, students, courses }: StudentListProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCourse, setSelectedCourse] = useState("Todos los cursos")

  const sourceStudents = Array.isArray(students) && students.length > 0
    ? students.map((s) => ({
        id: s.id,
        name: s.nombre_completo || s.name || 'Sin nombre',
        course: s.course || '—',
        email: s.correo || s.email || '',
        phone: s.telefono || s.phone || '',
        average: s.average ?? 0,
        attendance: s.attendance ?? 0,
        status: s.status || 'active',
        photo: s.photo || null,
      }))
    : []

  const courseOptions = ["Todos los cursos", ...((courses && courses.length > 0) ? courses : defaultCourses)]

  const filteredStudents = sourceStudents.filter((student) => {
    const matchesSearch =
      student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.email.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCourse = selectedCourse === "Todos los cursos" || student.course === selectedCourse
    return matchesSearch && matchesCourse
  })

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
        return "Atención"
      case "inactive":
        return "Inactivo"
      default:
        return status
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="w-5 h-5" />
          Lista de Estudiantes
        </CardTitle>

        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nombre o email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          <Select value={selectedCourse} onValueChange={setSelectedCourse}>
            <SelectTrigger className="w-full sm:w-48">
              <Filter className="w-4 h-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {courseOptions.map((course) => (
                <SelectItem key={course} value={course}>
                  {course}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardHeader>

      <CardContent>
        <div className="space-y-3">
          {filteredStudents.map((student) => (
            <div
              key={student.id}
              className={`p-4 border border-border rounded-lg cursor-pointer transition-colors hover:bg-accent/50 ${
                selectedStudentId === student.id ? "bg-accent border-primary" : ""
              }`}
              onClick={() => onSelectStudent(student)}
            >
              <div className="flex items-center gap-4">
                <Avatar className="w-12 h-12">
                  <AvatarImage src={student.photo || "/placeholder.svg"} alt={student.name} />
                  <AvatarFallback className="bg-primary text-primary-foreground">
                    {student.name
                      .split(" ")
                      .map((n: string) => n[0])
                      .join("")}
                  </AvatarFallback>
                </Avatar>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-foreground">{student.name}</h3>
                    <Badge className={getStatusColor(student.status)}>{getStatusLabel(student.status)}</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mb-1">{student.course}</p>
                  <p className="text-sm text-muted-foreground">{student.email}</p>
                </div>

                <div className="text-right space-y-1">
                  <div className="text-sm">
                    <span className="text-muted-foreground">Promedio: </span>
                    <span
                      className={`font-semibold ${student.average >= 8 ? "text-green-600" : student.average >= 6 ? "text-yellow-600" : "text-red-600"}`}
                    >
                      {student.average}
                    </span>
                  </div>
                  <div className="text-sm">
                    <span className="text-muted-foreground">Asistencia: </span>
                    <span
                      className={`font-semibold ${student.attendance >= 90 ? "text-green-600" : student.attendance >= 80 ? "text-yellow-600" : "text-red-600"}`}
                    >
                      {student.attendance}%
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}

          {filteredStudents.length === 0 && (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No se encontraron estudiantes</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
