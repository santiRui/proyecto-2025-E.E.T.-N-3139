import { NextRequest, NextResponse } from "next/server"
import { SESSION_COOKIE, verifySession } from "@/lib/auth"

function getKeys() {
  const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
  const ANON = process.env.SUPABASE_ANON_KEY
  const SERVICE = process.env.SUPABASE_SERVICE_ROLE_KEY
  return { SUPABASE_URL, KEY: SERVICE || ANON }
}

type AttendanceSummary = {
  estudiante_id: string
  curso_id: string | null
  total_registros: number
  presentes: number
  llegadas_tarde: number
  ausentes: number
  faltas_justificadas: number
  faltas_equivalentes: number
}

type GradeRecord = {
  id: string
  estudiante_id: string
  materia_nombre: string | null
  tipo_evaluacion: string | null
  fecha: string | null
  peso: number | null
  calificacion: number | null
  observaciones?: string | null
}

function computeAverage(records: GradeRecord[]) {
  if (!records.length) return null
  let weightedSum = 0
  let totalWeight = 0
  let sum = 0

  records.forEach((record) => {
    const grade = Number(record?.calificacion)
    if (Number.isNaN(grade)) return
    sum += grade
    const weight = record?.peso == null ? 0 : Number(record.peso)
    if (!Number.isNaN(weight) && weight > 0) {
      weightedSum += grade * weight
      totalWeight += weight
    }
  })

  if (totalWeight > 0) {
    return weightedSum / totalWeight
  }
  return records.length ? sum / records.length : null
}

export async function GET(_req: NextRequest) {
  try {
    const token = _req.cookies.get(SESSION_COOKIE)?.value
    if (!token) return NextResponse.json({ error: "No autenticado" }, { status: 401 })

    const session = await verifySession(token)
    if (session.role !== "tutor") {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 })
    }

    const { SUPABASE_URL, KEY } = getKeys()
    if (!SUPABASE_URL || !KEY) {
      return NextResponse.json({ error: "Configuración de Supabase incompleta" }, { status: 500 })
    }

    const relUrl = `${SUPABASE_URL}/rest/v1/tutores_estudiantes?select=estudiante_id&tutor_id=eq.${session.id}&order=estudiante_id`
    const relationsRes = await fetch(relUrl, {
      headers: { apikey: KEY, Authorization: `Bearer ${KEY}`, Accept: "application/json" },
      cache: "no-store",
    })

    if (!relationsRes.ok) {
      const msg = await relationsRes.text().catch(() => "No se pudieron obtener las asignaciones")
      return NextResponse.json({ error: msg || "No se pudieron obtener las asignaciones" }, { status: 500 })
    }

    const relations = await relationsRes.json()
    const studentIds: string[] = Array.isArray(relations)
      ? relations
          .map((row: any) => row?.estudiante_id)
          .filter((id: any): id is string => typeof id === "string" && id.trim().length > 0)
      : []

    if (studentIds.length === 0) {
      return NextResponse.json({ ok: true, students: [] })
    }

    // Construir el filtro IN para Supabase (formato correcto de PostgREST)
    const idsFilter = `(${studentIds.join(',')})`

    // Construir URLs manualmente para evitar problemas de codificación
    const studentsQuery = `select=id,nombre_completo,correo,telefono,cursos_estudiantes(curso_id,cursos(id,nombre,anio_lectivo))&id=in.${idsFilter}`
    const attendanceQuery = `select=estudiante_id,curso_id,total_registros,presentes,llegadas_tarde,ausentes,faltas_justificadas,faltas_equivalentes&estudiante_id=in.${idsFilter}`
    const gradesQuery = `select=id,estudiante_id,materia_nombre,tipo_evaluacion,fecha,peso,calificacion,observaciones&estudiante_id=in.${idsFilter}&order=fecha.desc`

    const [studentsRes, attendanceRes, gradesRes] = await Promise.all([
      fetch(`${SUPABASE_URL}/rest/v1/perfiles?${studentsQuery}`, {
        headers: { apikey: KEY, Authorization: `Bearer ${KEY}`, Accept: "application/json" },
        cache: "no-store",
      }),
      fetch(`${SUPABASE_URL}/rest/v1/v_asistencias_resumen?${attendanceQuery}`, {
        headers: { apikey: KEY, Authorization: `Bearer ${KEY}`, Accept: "application/json" },
        cache: "no-store",
      }),
      fetch(`${SUPABASE_URL}/rest/v1/v_calificaciones_detalle?${gradesQuery}`, {
        headers: { apikey: KEY, Authorization: `Bearer ${KEY}`, Accept: "application/json" },
        cache: "no-store",
      }),
    ])

    if (!studentsRes.ok) {
      const msg = await studentsRes.text().catch(() => "No se pudieron obtener estudiantes")
      return NextResponse.json({ error: msg || "No se pudieron obtener estudiantes" }, { status: 500 })
    }

    if (!attendanceRes.ok) {
      const msg = await attendanceRes.text().catch(() => "No se pudieron obtener asistencias")
      return NextResponse.json({ error: msg || "No se pudieron obtener asistencias" }, { status: 500 })
    }

    if (!gradesRes.ok) {
      const msg = await gradesRes.text().catch(() => "No se pudieron obtener calificaciones")
      return NextResponse.json({ error: msg || "No se pudieron obtener calificaciones" }, { status: 500 })
    }

    const studentsData = await studentsRes.json()
    const attendanceData: AttendanceSummary[] = await attendanceRes.json().catch(() => [])
    const gradesData: GradeRecord[] = await gradesRes.json().catch(() => [])

    const attendanceMap = new Map<string, AttendanceSummary>()
    attendanceData.forEach((row) => {
      if (row?.estudiante_id) {
        attendanceMap.set(row.estudiante_id, {
          estudiante_id: row.estudiante_id,
          curso_id: row?.curso_id ?? null,
          total_registros: Number(row?.total_registros ?? 0),
          presentes: Number(row?.presentes ?? 0),
          llegadas_tarde: Number(row?.llegadas_tarde ?? 0),
          ausentes: Number(row?.ausentes ?? 0),
          faltas_justificadas: Number(row?.faltas_justificadas ?? 0),
          faltas_equivalentes: Number(row?.faltas_equivalentes ?? 0),
        })
      }
    })

    const gradesMap = new Map<string, GradeRecord[]>()
    gradesData.forEach((grade) => {
      if (!grade?.estudiante_id) return
      if (!gradesMap.has(grade.estudiante_id)) {
        gradesMap.set(grade.estudiante_id, [])
      }
      gradesMap.get(grade.estudiante_id)!.push(grade)
    })

    const students = (Array.isArray(studentsData) ? studentsData : []).map((student: any) => {
      const rawRels = student?.cursos_estudiantes
      const rels = Array.isArray(rawRels) ? rawRels : rawRels ? [rawRels] : []
      const firstCourse = rels?.[0]
      const courseInfo = firstCourse?.cursos || null
      const courseId = firstCourse?.curso_id || courseInfo?.id || null
      
      // Debug logs
      console.log('DEBUG - Student:', student.nombre_completo)
      console.log('DEBUG - rawRels:', JSON.stringify(rawRels))
      console.log('DEBUG - firstCourse:', JSON.stringify(firstCourse))
      console.log('DEBUG - courseInfo:', JSON.stringify(courseInfo))
      console.log('DEBUG - courseId:', courseId)

      const attendance = attendanceMap.get(student.id) || null
      const studentGrades = gradesMap.get(student.id) || []
      const average = computeAverage(studentGrades)

      const subjectsMap = new Map<
        string,
        { subject: string; grades: GradeRecord[]; average: number | null }
      >()
      studentGrades.forEach((grade) => {
        const subjectName = grade?.materia_nombre || "Sin materia"
        if (!subjectsMap.has(subjectName)) {
          subjectsMap.set(subjectName, { subject: subjectName, grades: [], average: null })
        }
        subjectsMap.get(subjectName)!.grades.push(grade)
      })
      subjectsMap.forEach((value) => {
        value.average = computeAverage(value.grades)
      })

      const subjects = Array.from(subjectsMap.values()).map((item) => ({
        subject: item.subject,
        average: item.average,
        evaluations: item.grades
          .map((grade) => ({
            id: grade.id,
            type: grade.tipo_evaluacion,
            date: grade.fecha,
            grade: grade.calificacion,
            weight: grade.peso,
            observations: grade.observaciones,
          }))
          .sort((a, b) => (b.date || "").localeCompare(a.date || "")),
      }))

      const recentGrades = [...studentGrades]
        .filter((grade) => typeof grade.fecha === "string")
        .sort((a, b) => (b.fecha || "").localeCompare(a.fecha || ""))
        .slice(0, 5)
        .map((grade) => ({
          id: grade.id,
          subject: grade.materia_nombre,
          type: grade.tipo_evaluacion,
          date: grade.fecha,
          grade: grade.calificacion,
          weight: grade.peso,
        }))

      const totalRegistros = attendance?.total_registros ?? 0
      const attendancePercentage = totalRegistros > 0 ? (attendance!.presentes / totalRegistros) * 100 : null

      return {
        student: {
          id: student.id,
          nombre: student?.nombre_completo || "Sin nombre",
          correo: student?.correo || null,
          telefono: student?.telefono || null,
          curso_id: courseId,
          curso_nombre: courseInfo?.nombre || null,
          curso_anio: courseInfo?.anio_lectivo || null,
        },
        attendance: attendance
          ? {
              ...attendance,
              porcentaje_asistencia: attendancePercentage,
            }
          : {
              estudiante_id: student.id,
              curso_id: courseId,
              total_registros: 0,
              presentes: 0,
              llegadas_tarde: 0,
              ausentes: 0,
              faltas_justificadas: 0,
              faltas_equivalentes: 0,
              porcentaje_asistencia: null,
            },
        grades: {
          average,
          subjects,
          recent: recentGrades,
        },
      }
    })

    return NextResponse.json({ ok: true, students })
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || "Error interno" }, { status: 500 })
  }
}
