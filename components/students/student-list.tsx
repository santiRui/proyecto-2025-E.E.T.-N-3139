"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Search, Filter, Users } from "lucide-react"

const defaultCourses = ["3° Año C", "4° Año A", "4° Año B", "5° Año A", "5° Año B", "6° Año A"]

type CourseOption = {
  id: string
  nombre: string
}

interface StudentListProps {
  userRole: string
  onSelectStudent: (student: any) => void
  selectedStudentId?: number
  students?: any[]
  courses?: CourseOption[]
}

export function StudentList({ userRole, onSelectStudent, selectedStudentId, students, courses }: StudentListProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCourseId, setSelectedCourseId] = useState<string>("all")

  const sourceStudents = Array.isArray(students) && students.length > 0
    ? students.map((s) => {
        const average = typeof s.average === 'number' ? Math.round(s.average * 100) / 100 : null
        const faltas = typeof s.faltas === 'number' ? Math.round(s.faltas * 100) / 100 : null
        return {
          ...s,
          id: s.id,
          name: s.name || s.nombre_completo || 'Sin nombre',
          course: s.course || '—',
          courseId: s.courseId ?? null,
          email: s.email || s.correo || '',
          phone: s.phone || s.telefono || '',
          average,
          faltas,
          status: s.status || 'active',
          photo: s.photo || null,
        }
      })
    : []

  const providedCourses: CourseOption[] = Array.isArray(courses) && courses.length > 0
    ? courses
    : defaultCourses.map((nombre) => ({ id: nombre, nombre }))

  const courseNameById = new Map(providedCourses.map((course) => [course.id, course.nombre]))

  useEffect(() => {
    if (selectedCourseId === 'all') return
    const exists = providedCourses.some((course) => course.id === selectedCourseId)
    if (!exists) setSelectedCourseId('all')
  }, [providedCourses, selectedCourseId])

  const filteredStudents = sourceStudents.filter((student) => {
    const matchesSearch =
      student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.email.toLowerCase().includes(searchTerm.toLowerCase())
    if (selectedCourseId === 'all') return matchesSearch

    const selectedCourseName = courseNameById.get(selectedCourseId)?.toLowerCase()
    const studentCourseName = typeof student.course === 'string' ? student.course.toLowerCase() : ''
    const matchesCourseId = student.courseId != null && student.courseId === selectedCourseId
    const matchesCourseName = selectedCourseName ? studentCourseName === selectedCourseName : false

    const matchesCourse = matchesCourseId || matchesCourseName
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

  const getFaltasColor = (faltas: number | null) => {
    if (faltas == null) return "text-muted-foreground"
    if (faltas <= 1) return "text-green-600"
    if (faltas <= 3) return "text-yellow-600"
    return "text-red-600"
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

          <Select value={selectedCourseId} onValueChange={setSelectedCourseId}>
            <SelectTrigger className="w-full sm:w-48">
              <Filter className="w-4 h-4 mr-2" />
              <SelectValue placeholder="Todos los cursos" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los cursos</SelectItem>
              {providedCourses.map((course) => (
                <SelectItem key={course.id} value={course.id}>
                  {course.nombre}
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
                      className={`font-semibold ${
                        typeof student.average === 'number'
                          ? student.average >= 8
                            ? "text-green-600"
                            : student.average >= 6
                            ? "text-yellow-600"
                            : "text-red-600"
                          : "text-muted-foreground"
                      }`}
                    >
                      {typeof student.average === 'number' ? student.average.toFixed(2) : "—"}
                    </span>
                  </div>
                  <div className="text-sm">
                    <span className="text-muted-foreground">Faltas: </span>
                    <span className={`font-semibold ${getFaltasColor(student.faltas)}`}>
                      {typeof student.faltas === 'number' ? student.faltas.toFixed(2) : '—'}
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
