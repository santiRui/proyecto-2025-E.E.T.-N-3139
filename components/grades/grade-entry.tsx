"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Save, Users, BookOpen } from "lucide-react"

const mockStudents = [
  { id: 1, name: "Ana García" },
  { id: 2, name: "Carlos Rodríguez" },
  { id: 3, name: "María López" },
  { id: 4, name: "Juan Pérez" },
]

const gradeTypes = [
  "Parcial",
  "Trabajo Práctico",
  "Oral",
  "Laboratorio",
  "Proyecto",
  "Participación",
  "Ensayo",
  "Informe",
]

interface GradeEntryProps {
  userRole: string
}

export function GradeEntry({ userRole }: GradeEntryProps) {
  const [selectedCourse, setSelectedCourse] = useState("5° Año A")
  const [selectedSubject, setSelectedSubject] = useState("Matemática")
  const [gradeType, setGradeType] = useState("")
  const [gradeDate, setGradeDate] = useState("")
  const [gradeWeight, setGradeWeight] = useState("")
  const [observations, setObservations] = useState("")
  const [studentGrades, setStudentGrades] = useState<{ [key: number]: string }>({})

  const handleGradeChange = (studentId: number, grade: string) => {
    setStudentGrades((prev) => ({
      ...prev,
      [studentId]: grade,
    }))
  }

  const handleSaveGrades = () => {
    // Here you would save the grades to the backend
    console.log("Saving grades:", {
      course: selectedCourse,
      subject: selectedSubject,
      type: gradeType,
      date: gradeDate,
      weight: gradeWeight,
      observations,
      grades: studentGrades,
    })

    // Reset form
    setGradeType("")
    setGradeDate("")
    setGradeWeight("")
    setObservations("")
    setStudentGrades({})

    alert("Calificaciones guardadas exitosamente")
  }

  const getGradeColor = (grade: string) => {
    const numGrade = Number.parseFloat(grade)
    if (isNaN(numGrade)) return ""
    if (numGrade >= 8) return "text-green-600"
    if (numGrade >= 6) return "text-yellow-600"
    return "text-red-600"
  }

  const isFormValid = () => {
    return (
      selectedCourse &&
      selectedSubject &&
      gradeType &&
      gradeDate &&
      gradeWeight &&
      Object.keys(studentGrades).length > 0
    )
  }

  return (
    <div className="space-y-6">
      {/* Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="w-5 h-5" />
            Configuración de Evaluación
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="course">Curso</Label>
              <Select value={selectedCourse} onValueChange={setSelectedCourse}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="5° Año A">5° Año A</SelectItem>
                  <SelectItem value="4° Año B">4° Año B</SelectItem>
                  <SelectItem value="3° Año C">3° Año C</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="subject">Materia</Label>
              <Select value={selectedSubject} onValueChange={setSelectedSubject}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Matemática">Matemática</SelectItem>
                  <SelectItem value="Lengua">Lengua</SelectItem>
                  <SelectItem value="Historia">Historia</SelectItem>
                  <SelectItem value="Ciencias Naturales">Ciencias Naturales</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="gradeType">Tipo de Evaluación</Label>
              <Select value={gradeType} onValueChange={setGradeType}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar tipo" />
                </SelectTrigger>
                <SelectContent>
                  {gradeTypes.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="gradeDate">Fecha</Label>
              <Input id="gradeDate" type="date" value={gradeDate} onChange={(e) => setGradeDate(e.target.value)} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="gradeWeight">Peso (%)</Label>
              <Input
                id="gradeWeight"
                type="number"
                min="1"
                max="100"
                placeholder="Ej: 40"
                value={gradeWeight}
                onChange={(e) => setGradeWeight(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="observations">Observaciones (Opcional)</Label>
            <Textarea
              id="observations"
              placeholder="Comentarios sobre la evaluación..."
              value={observations}
              onChange={(e) => setObservations(e.target.value)}
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

      {/* Grade Entry */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Cargar Calificaciones - {selectedCourse}
          </CardTitle>
          {gradeType && (
            <div className="flex items-center gap-2">
              <Badge variant="secondary">{gradeType}</Badge>
              <Badge variant="outline">{gradeDate}</Badge>
              <Badge variant="outline">Peso: {gradeWeight}%</Badge>
            </div>
          )}
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {mockStudents.map((student) => (
              <div key={student.id} className="flex items-center justify-between p-4 border border-border rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                    <span className="text-sm font-medium text-primary">
                      {student.name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")}
                    </span>
                  </div>
                  <p className="font-medium">{student.name}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    min="1"
                    max="10"
                    step="0.1"
                    placeholder="Nota"
                    className={`w-20 text-center ${getGradeColor(studentGrades[student.id] || "")}`}
                    value={studentGrades[student.id] || ""}
                    onChange={(e) => handleGradeChange(student.id, e.target.value)}
                  />
                  <span className="text-sm text-muted-foreground">/10</span>
                </div>
              </div>
            ))}

            <div className="flex justify-end pt-4">
              <Button onClick={handleSaveGrades} disabled={!isFormValid()} className="gap-2">
                <Save className="w-4 h-4" />
                Guardar Calificaciones
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
