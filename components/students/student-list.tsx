"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Search, Filter, Users } from "lucide-react"

const mockStudents = [
  {
    id: 1,
    name: "Ana García",
    course: "5° Año A",
    email: "ana.garcia@estudiante.edu.ar",
    phone: "+54 11 1234-5678",
    average: 8.5,
    attendance: 95,
    status: "active",
    photo: "/diverse-student-girl.png",
  },
  {
    id: 2,
    name: "Carlos Rodríguez",
    course: "4° Año B",
    email: "carlos.rodriguez@estudiante.edu.ar",
    phone: "+54 11 2345-6789",
    average: 7.8,
    attendance: 88,
    status: "active",
    photo: "/student-boy.png",
  },
  {
    id: 3,
    name: "María López",
    course: "6° Año A",
    email: "maria.lopez@estudiante.edu.ar",
    phone: "+54 11 3456-7890",
    average: 9.2,
    attendance: 98,
    status: "active",
    photo: "/placeholder-rh70l.png",
  },
  {
    id: 4,
    name: "Juan Pérez",
    course: "3° Año C",
    email: "juan.perez@estudiante.edu.ar",
    phone: "+54 11 4567-8901",
    average: 6.5,
    attendance: 82,
    status: "warning",
    photo: "/student-boy-2.jpg",
  },
  {
    id: 5,
    name: "Sofía Martínez",
    course: "5° Año B",
    email: "sofia.martinez@estudiante.edu.ar",
    phone: "+54 11 5678-9012",
    average: 8.9,
    attendance: 96,
    status: "active",
    photo: "/student-girl-3.jpg",
  },
  {
    id: 6,
    name: "Diego Fernández",
    course: "4° Año A",
    email: "diego.fernandez@estudiante.edu.ar",
    phone: "+54 11 6789-0123",
    average: 7.2,
    attendance: 90,
    status: "active",
    photo: "/student-boy-3.jpg",
  },
]

const courses = ["Todos los cursos", "3° Año C", "4° Año A", "4° Año B", "5° Año A", "5° Año B", "6° Año A"]

interface StudentListProps {
  userRole: string
  onSelectStudent: (student: any) => void
  selectedStudentId?: number
  students?: any[]
}

export function StudentList({ userRole, onSelectStudent, selectedStudentId, students }: StudentListProps) {
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
    : mockStudents

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
              {courses.map((course) => (
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
