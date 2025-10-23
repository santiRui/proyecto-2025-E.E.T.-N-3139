"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Progress } from "@/components/ui/progress"
import { Calendar, Clock, CheckCircle, XCircle, AlertTriangle } from "lucide-react"

const mockAttendance = {
  student: {
    overall: {
      present: 85,
      absent: 12,
      late: 8,
      percentage: 89.5,
    },
    subjects: [
      {
        subject: "Matemática",
        present: 22,
        absent: 2,
        late: 1,
        percentage: 92,
        status: "good",
      },
      {
        subject: "Lengua",
        present: 20,
        absent: 3,
        late: 2,
        percentage: 88,
        status: "warning",
      },
      {
        subject: "Historia",
        present: 18,
        absent: 4,
        late: 3,
        percentage: 84,
        status: "warning",
      },
      {
        subject: "Ciencias Naturales",
        present: 25,
        absent: 1,
        late: 0,
        percentage: 96,
        status: "excellent",
      },
    ],
    recent: [
      { date: "2025-01-22", subject: "Matemática", status: "present" },
      { date: "2025-01-22", subject: "Lengua", status: "late" },
      { date: "2025-01-21", subject: "Historia", status: "absent" },
      { date: "2025-01-21", subject: "Ciencias Naturales", status: "present" },
      { date: "2025-01-20", subject: "Matemática", status: "present" },
    ],
  },
  teacher: [
    {
      course: "5° Año A",
      subject: "Matemática",
      students: [
        { name: "Ana García", percentage: 95, status: "excellent" },
        { name: "Carlos Rodríguez", percentage: 88, status: "good" },
        { name: "María López", percentage: 98, status: "excellent" },
        { name: "Juan Pérez", percentage: 75, status: "at_risk" },
      ],
    },
  ],
}

interface AttendanceViewProps {
  userRole: string
}

export function AttendanceView({ userRole }: AttendanceViewProps) {
  const [selectedPeriod, setSelectedPeriod] = useState("current")
  const [selectedCourse, setSelectedCourse] = useState("5° Año A")

  const getAttendanceColor = (percentage: number) => {
    if (percentage >= 90) return "text-green-600"
    if (percentage >= 80) return "text-yellow-600"
    return "text-red-600"
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "excellent":
        return "bg-green-100 text-green-800"
      case "good":
        return "bg-blue-100 text-blue-800"
      case "warning":
        return "bg-yellow-100 text-yellow-800"
      case "at_risk":
        return "bg-red-100 text-red-800"
      default:
        return "bg-muted text-muted-foreground"
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "excellent":
        return "Excelente"
      case "good":
        return "Bueno"
      case "warning":
        return "Atención"
      case "at_risk":
        return "En Riesgo"
      default:
        return status
    }
  }

  const getAttendanceIcon = (status: string) => {
    switch (status) {
      case "present":
        return <CheckCircle className="w-4 h-4 text-green-600" />
      case "absent":
        return <XCircle className="w-4 h-4 text-red-600" />
      case "late":
        return <Clock className="w-4 h-4 text-yellow-600" />
      default:
        return <AlertTriangle className="w-4 h-4" />
    }
  }

  const getAttendanceLabel = (status: string) => {
    switch (status) {
      case "present":
        return "Presente"
      case "absent":
        return "Ausente"
      case "late":
        return "Tardanza"
      default:
        return status
    }
  }

  if (userRole === "student" || userRole === "parent") {
    const data = mockAttendance.student

    return (
      <div className="space-y-6">
        {/* Period Selector */}
        <div className="flex items-center gap-4">
          <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="current">Período Actual</SelectItem>
              <SelectItem value="previous">Período Anterior</SelectItem>
              <SelectItem value="annual">Anual</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Overall Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Asistencia General</CardTitle>
              <Calendar className="w-4 h-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${getAttendanceColor(data.overall.percentage)}`}>
                {data.overall.percentage}%
              </div>
              <Progress value={data.overall.percentage} className="mt-2" />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Presentes</CardTitle>
              <CheckCircle className="w-4 h-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{data.overall.present}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Ausencias</CardTitle>
              <XCircle className="w-4 h-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{data.overall.absent}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Tardanzas</CardTitle>
              <Clock className="w-4 h-4 text-yellow-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">{data.overall.late}</div>
            </CardContent>
          </Card>
        </div>

        {/* By Subject */}
        <Card>
          <CardHeader>
            <CardTitle>Asistencia por Materia</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {data.subjects.map((subject, index) => (
                <div key={index} className="flex items-center justify-between p-4 bg-accent/30 rounded-lg">
                  <div>
                    <p className="font-medium">{subject.subject}</p>
                    <Badge className={`${getStatusColor(subject.status)} text-xs mt-1`}>
                      {getStatusLabel(subject.status)}
                    </Badge>
                  </div>
                  <div className="text-right">
                    <p className={`text-lg font-bold ${getAttendanceColor(subject.percentage)}`}>
                      {subject.percentage}%
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {subject.present}P / {subject.absent}A / {subject.late}T
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle>Registro Reciente</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {data.recent.map((record, index) => (
                <div key={index} className="flex items-center justify-between p-3 border border-border rounded-lg">
                  <div className="flex items-center gap-3">
                    {getAttendanceIcon(record.status)}
                    <div>
                      <p className="font-medium">{record.subject}</p>
                      <p className="text-sm text-muted-foreground">{record.date}</p>
                    </div>
                  </div>
                  <Badge variant="secondary">{getAttendanceLabel(record.status)}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Teacher/Preceptor view
  return (
    <div className="space-y-6">
      {/* Course Selector */}
      <div className="flex items-center gap-4">
        <Select value={selectedCourse} onValueChange={setSelectedCourse}>
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="5° Año A">5° Año A</SelectItem>
            <SelectItem value="4° Año B">4° Año B</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Course Attendance */}
      {mockAttendance.teacher.map((course, index) => {
        if (course.course !== selectedCourse) return null

        return (
          <Card key={index}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                Asistencia - {course.subject} ({course.course})
              </CardTitle>
            </CardHeader>

            <CardContent>
              <div className="space-y-3">
                {course.students.map((student, studentIndex) => (
                  <div
                    key={studentIndex}
                    className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-accent/50"
                  >
                    <div className="flex items-center gap-3">
                      <Calendar className="w-4 h-4 text-primary" />
                      <div>
                        <p className="font-medium">{student.name}</p>
                        <Badge className={`${getStatusColor(student.status)} text-xs`}>
                          {getStatusLabel(student.status)}
                        </Badge>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground">Asistencia</p>
                      <p className={`text-lg font-bold ${getAttendanceColor(student.percentage)}`}>
                        {student.percentage}%
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
