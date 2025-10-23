"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Calendar, Clock, CheckCircle, XCircle, Users, TrendingDown } from "lucide-react"

const mockAttendanceData = {
  "5° Año A": {
    totalStudents: 25,
    averageAttendance: 89.5,
    totalClasses: 120,
    subjects: [
      { name: "Matemática", attendance: 92, classes: 30, present: 690, absent: 60 },
      { name: "Lengua", attendance: 88, classes: 25, present: 550, absent: 75 },
      { name: "Historia", attendance: 85, classes: 20, present: 425, absent: 75 },
      { name: "Ciencias Naturales", attendance: 94, classes: 25, present: 587, absent: 38 },
    ],
    monthly: [
      { month: "Marzo", attendance: 91.2, classes: 30 },
      { month: "Abril", attendance: 89.8, classes: 28 },
      { month: "Mayo", attendance: 87.5, classes: 32 },
      { month: "Junio", attendance: 90.1, classes: 30 },
    ],
    alerts: [
      { student: "Juan Pérez", attendance: 65, absences: 12, status: "critical" },
      { student: "María González", attendance: 78, absences: 8, status: "warning" },
      { student: "Carlos López", attendance: 82, absences: 6, status: "warning" },
    ],
  },
}

interface AttendanceReportsProps {
  userRole: string
}

export function AttendanceReports({ userRole }: AttendanceReportsProps) {
  const [selectedCourse, setSelectedCourse] = useState("5° Año A")
  const [selectedPeriod, setSelectedPeriod] = useState("current")

  const data = mockAttendanceData[selectedCourse as keyof typeof mockAttendanceData]

  const getAttendanceColor = (percentage: number) => {
    if (percentage >= 90) return "text-green-600"
    if (percentage >= 80) return "text-yellow-600"
    return "text-red-600"
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "critical":
        return "bg-red-100 text-red-800"
      case "warning":
        return "bg-yellow-100 text-yellow-800"
      default:
        return "bg-muted text-muted-foreground"
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "critical":
        return "Crítico"
      case "warning":
        return "Atención"
      default:
        return status
    }
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
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

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Asistencia Promedio</CardTitle>
            <Calendar className="w-4 h-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${getAttendanceColor(data.averageAttendance)}`}>
              {data.averageAttendance}%
            </div>
            <Progress value={data.averageAttendance} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Estudiantes</CardTitle>
            <Users className="w-4 h-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{data.totalStudents}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Clases Dictadas</CardTitle>
            <CheckCircle className="w-4 h-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{data.totalClasses}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Alertas</CardTitle>
            <TrendingDown className="w-4 h-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{data.alerts.length}</div>
            <p className="text-xs text-muted-foreground mt-1">estudiantes</p>
          </CardContent>
        </Card>
      </div>

      {/* Subject Attendance */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Asistencia por Materia - {selectedCourse}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {data.subjects.map((subject, index) => (
              <div key={index} className="flex items-center justify-between p-4 bg-accent/30 rounded-lg">
                <div>
                  <p className="font-medium">{subject.name}</p>
                  <p className="text-sm text-muted-foreground">{subject.classes} clases dictadas</p>
                </div>
                <div className="flex items-center gap-6">
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground">Asistencia</p>
                    <p className={`text-lg font-bold ${getAttendanceColor(subject.attendance)}`}>
                      {subject.attendance}%
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground">Presentes</p>
                    <p className="text-lg font-bold text-green-600">{subject.present}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground">Ausentes</p>
                    <p className="text-lg font-bold text-red-600">{subject.absent}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Monthly Trends */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5" />
            Evolución Mensual
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {data.monthly.map((month, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-accent/30 rounded-lg">
                <div>
                  <span className="font-medium">{month.month}</span>
                  <p className="text-sm text-muted-foreground">{month.classes} clases</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`font-bold ${getAttendanceColor(month.attendance)}`}>{month.attendance}%</span>
                  {index > 0 && (
                    <Badge variant={month.attendance > data.monthly[index - 1].attendance ? "default" : "secondary"}>
                      {month.attendance > data.monthly[index - 1].attendance ? "↗" : "↘"}
                    </Badge>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Attendance Alerts */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <XCircle className="w-5 h-5" />
            Estudiantes con Baja Asistencia
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {data.alerts.map((alert, index) => (
              <div key={index} className="flex items-center justify-between p-4 border border-border rounded-lg">
                <div className="flex items-center gap-3">
                  <XCircle className="w-5 h-5 text-red-500" />
                  <div>
                    <p className="font-medium">{alert.student}</p>
                    <Badge className={`${getStatusColor(alert.status)} text-xs mt-1`}>
                      {getStatusLabel(alert.status)}
                    </Badge>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`text-lg font-bold ${getAttendanceColor(alert.attendance)}`}>{alert.attendance}%</p>
                  <p className="text-sm text-muted-foreground">{alert.absences} ausencias</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
