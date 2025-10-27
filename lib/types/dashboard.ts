export type StudentDashboardOverview = {
  courseName: string | null
  subjectsCount: number
  average: number | null
  attendancePercentage: number | null
  attendanceSummary: {
    totalRegistros: number
    presentes: number
    llegadasTarde: number
    ausentes: number
    faltasJustificadas: number
    faltasEquivalentes: number
  }
  subjectsAtRisk: number
  totalEvaluations: number
  recentGrades: Array<{
    id: string
    subject: string | null
    type: string | null
    date: string | null
    grade: number | null
    weight: number | null
  }>
}
