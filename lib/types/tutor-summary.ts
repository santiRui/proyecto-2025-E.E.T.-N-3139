export type TutorSummaryStudent = {
  student: {
    id: string
    nombre: string
    correo: string | null
    telefono: string | null
    curso_id: string | null
    curso_nombre: string | null
    curso_anio: number | null
  }
  attendance: {
    estudiante_id: string
    curso_id: string | null
    total_registros: number
    presentes: number
    llegadas_tarde: number
    ausentes: number
    faltas_justificadas: number
    faltas_equivalentes: number
    porcentaje_asistencia: number | null
  }
  grades: {
    average: number | null
    subjects: Array<{
      subject: string
      average: number | null
      evaluations: Array<{
        id: string
        type: string | null
        date: string | null
        grade: number | null
        weight: number | null
        observations?: string | null
      }>
    }>
    recent: Array<{
      id: string
      subject: string | null
      type: string | null
      date: string | null
      grade: number | null
      weight: number | null
    }>
  }
}

export type TutorSummaryResponse = {
  students: TutorSummaryStudent[]
}
