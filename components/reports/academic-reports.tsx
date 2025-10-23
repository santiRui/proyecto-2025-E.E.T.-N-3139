"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { BarChart3, TrendingUp, Users, BookOpen, Award, AlertTriangle } from "lucide-react"

const mockAcademicData = {
  "5° Año A": {
    subject: "Matemática",
    totalStudents: 25,
    averageGrade: 7.8,
    approvalRate: 84,
    subjects: [
      { name: "Matemática", average: 7.8, approval: 84, students: 25 },
      { name: "Lengua", average: 8.2, approval: 88, students: 25 },
      { name: "Historia", average: 7.5, approval: 80, students: 25 },
      { name: "Ciencias Naturales", average: 8.0, approval: 86, students: 25 },
    ],
    performance: [
      { range: "9-10", count: 5, percentage: 20 },
      { range: "8-8.9", count: 8, percentage: 32 },
      { range: "7-7.9", count: 6, percentage: 24 },
      { range: "6-6.9", count: 4, percentage: 16 },
      { range: "< 6", count: 2, percentage: 8 },
    ],
    trends: [
      { period: "Marzo", average: 7.2 },
      { period: "Abril", average: 7.5 },
      { period: "Mayo", average: 7.8 },
      { period: "Junio", average: 8.0 },
    ],
  },
  "4° Año B": {
    subject: "Matemática",
    totalStudents: 22,
    averageGrade: 7.3,
    approvalRate: 77,
    subjects: [
      { name: "Matemática", average: 7.3, approval: 77, students: 22 },
      { name: "Lengua", average: 7.9, approval: 82, students: 22 },
      { name: "Historia", average: 7.1, approval: 73, students: 22 },
      { name: "Ciencias Naturales", average: 7.6, approval: 79, students: 22 },
    ],
    performance: [
      { range: "9-10", count: 3, percentage: 14 },
      { range: "8-8.9", count: 6, percentage: 27 },
      { range: "7-7.9", count: 8, percentage: 36 },
      { range: "6-6.9", count: 3, percentage: 14 },
      { range: "< 6", count: 2, percentage: 9 },
    ],
    trends: [
      { period: "Marzo", average: 6.8 },
      { period: "Abril", average: 7.0 },
      { period: "Mayo", average: 7.2 },
      { period: "Junio", average: 7.3 },
    ],
  },
}

interface AcademicReportsProps {
  userRole: string
}

export function AcademicReports({ userRole }: AcademicReportsProps) {
  const [selectedCourse, setSelectedCourse] = useState("5° Año A")
  const [selectedPeriod, setSelectedPeriod] = useState("current")

  const data = mockAcademicData[selectedCourse as keyof typeof mockAcademicData]

  const getGradeColor = (average: number) => {
    if (average >= 8) return "text-green-600"
    if (average >= 7) return "text-yellow-600"
    return "text-red-600"
  }

  const getApprovalColor = (rate: number) => {
    if (rate >= 85) return "text-green-600"
    if (rate >= 75) return "text-yellow-600"
    return "text-red-600"
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
            <CardTitle className="text-sm font-medium">Total Estudiantes</CardTitle>
            <Users className="w-4 h-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{data.totalStudents}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Promedio General</CardTitle>
            <TrendingUp className="w-4 h-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${getGradeColor(data.averageGrade)}`}>{data.averageGrade}</div>
            <Progress value={data.averageGrade * 10} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tasa de Aprobación</CardTitle>
            <Award className="w-4 h-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${getApprovalColor(data.approvalRate)}`}>{data.approvalRate}%</div>
            <Progress value={data.approvalRate} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">En Riesgo</CardTitle>
            <AlertTriangle className="w-4 h-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {Math.round((data.totalStudents * (100 - data.approvalRate)) / 100)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">estudiantes</p>
          </CardContent>
        </Card>
      </div>

      {/* Subject Performance */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="w-5 h-5" />
            Rendimiento por Materia - {selectedCourse}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {data.subjects.map((subject, index) => (
              <div key={index} className="flex items-center justify-between p-4 bg-accent/30 rounded-lg">
                <div>
                  <p className="font-medium">{subject.name}</p>
                  <p className="text-sm text-muted-foreground">{subject.students} estudiantes</p>
                </div>
                <div className="flex items-center gap-6">
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground">Promedio</p>
                    <p className={`text-lg font-bold ${getGradeColor(subject.average)}`}>{subject.average}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground">Aprobación</p>
                    <p className={`text-lg font-bold ${getApprovalColor(subject.approval)}`}>{subject.approval}%</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Performance Distribution */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5" />
            Distribución de Calificaciones
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {data.performance.map((range, index) => (
              <div key={index} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">{range.range}</Badge>
                    <span className="text-sm text-muted-foreground">{range.count} estudiantes</span>
                  </div>
                  <span className="text-sm font-medium">{range.percentage}%</span>
                </div>
                <Progress value={range.percentage} className="h-2" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Trends */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Evolución del Rendimiento
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {data.trends.map((trend, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-accent/30 rounded-lg">
                <span className="font-medium">{trend.period}</span>
                <div className="flex items-center gap-2">
                  <span className={`font-bold ${getGradeColor(trend.average)}`}>{trend.average}</span>
                  {index > 0 && (
                    <Badge variant={trend.average > data.trends[index - 1].average ? "default" : "secondary"}>
                      {trend.average > data.trends[index - 1].average ? "↗" : "↘"}
                    </Badge>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
