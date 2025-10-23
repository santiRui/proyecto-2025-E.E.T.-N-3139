"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Progress } from "@/components/ui/progress"
import { BarChart3, PieChart, TrendingUp, Activity } from "lucide-react"
import { useState } from "react"

interface PerformanceChartsProps {
  userRole: string
}

export function PerformanceCharts({ userRole }: PerformanceChartsProps) {
  const [selectedCourse, setSelectedCourse] = useState("5° Año A")
  const [selectedPeriod, setSelectedPeriod] = useState("current")

  // Mock data for charts
  const gradeDistribution = [
    { range: "9-10", count: 5, percentage: 20, color: "bg-green-500" },
    { range: "8-8.9", count: 8, percentage: 32, color: "bg-blue-500" },
    { range: "7-7.9", count: 6, percentage: 24, color: "bg-yellow-500" },
    { range: "6-6.9", count: 4, percentage: 16, color: "bg-orange-500" },
    { range: "< 6", count: 2, percentage: 8, color: "bg-red-500" },
  ]

  const subjectComparison = [
    { subject: "Matemática", average: 7.8, students: 25 },
    { subject: "Lengua", average: 8.2, students: 25 },
    { subject: "Historia", average: 7.5, students: 25 },
    { subject: "Ciencias Naturales", average: 8.0, students: 25 },
    { subject: "Inglés", average: 7.9, students: 25 },
    { subject: "Informática", average: 8.5, students: 25 },
  ]

  const monthlyTrends = [
    { month: "Marzo", average: 7.2, attendance: 91 },
    { month: "Abril", average: 7.5, attendance: 89 },
    { month: "Mayo", average: 7.8, attendance: 87 },
    { month: "Junio", average: 8.0, attendance: 90 },
    { month: "Julio", average: 8.1, attendance: 92 },
  ]

  const attendanceDistribution = [
    { range: "95-100%", count: 12, percentage: 48, color: "bg-green-500" },
    { range: "90-94%", count: 8, percentage: 32, color: "bg-blue-500" },
    { range: "85-89%", count: 3, percentage: 12, color: "bg-yellow-500" },
    { range: "80-84%", count: 1, percentage: 4, color: "bg-orange-500" },
    { range: "< 80%", count: 1, percentage: 4, color: "bg-red-500" },
  ]

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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Grade Distribution Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChart className="w-5 h-5" />
              Distribución de Calificaciones
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {gradeDistribution.map((item, index) => (
                <div key={index} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className={`w-4 h-4 rounded ${item.color}`}></div>
                      <span className="text-sm font-medium">{item.range}</span>
                      <span className="text-sm text-muted-foreground">({item.count} estudiantes)</span>
                    </div>
                    <span className="text-sm font-medium">{item.percentage}%</span>
                  </div>
                  <Progress value={item.percentage} className="h-2" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Attendance Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="w-5 h-5" />
              Distribución de Asistencia
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {attendanceDistribution.map((item, index) => (
                <div key={index} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className={`w-4 h-4 rounded ${item.color}`}></div>
                      <span className="text-sm font-medium">{item.range}</span>
                      <span className="text-sm text-muted-foreground">({item.count} estudiantes)</span>
                    </div>
                    <span className="text-sm font-medium">{item.percentage}%</span>
                  </div>
                  <Progress value={item.percentage} className="h-2" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Subject Comparison */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              Comparación por Materia
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {subjectComparison.map((subject, index) => (
                <div key={index} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">{subject.subject}</span>
                    <span className="text-sm font-bold">{subject.average}</span>
                  </div>
                  <Progress value={subject.average * 10} className="h-2" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Monthly Trends */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Tendencias Mensuales
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {monthlyTrends.map((month, index) => (
                <div key={index} className="p-3 bg-accent/30 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium">{month.month}</span>
                    <div className="flex items-center gap-4 text-sm">
                      <span>
                        Promedio: <strong>{month.average}</strong>
                      </span>
                      <span>
                        Asistencia: <strong>{month.attendance}%</strong>
                      </span>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Rendimiento</p>
                      <Progress value={month.average * 10} className="h-1" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Asistencia</p>
                      <Progress value={month.attendance} className="h-1" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
