export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from "next/server"

// Este handler recibe multipart/form-data con campos y archivos
export async function POST(req: NextRequest) {
  try {
    const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
    const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY
    const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!SUPABASE_URL) {
      return NextResponse.json({ error: "Falta NEXT_PUBLIC_SUPABASE_URL" }, { status: 500 })
    }
    if (!SUPABASE_ANON_KEY) {
      return NextResponse.json({ error: "Falta SUPABASE_ANON_KEY" }, { status: 500 })
    }
    if (!SUPABASE_SERVICE_ROLE_KEY) {
      return NextResponse.json({ error: "Falta SUPABASE_SERVICE_ROLE_KEY (necesario para subir archivos)" }, { status: 500 })
    }

    const form = await req.formData()

    // Campos del alumno
    const studentFirstName = String(form.get("student_firstName") || form.get("firstName") || "").trim()
    const studentLastName = String(form.get("student_lastName") || form.get("lastName") || "").trim()
    const studentDni = String(form.get("student_dni") || form.get("dni") || "").trim()
    const studentBirthDate = String(form.get("student_birthDate") || form.get("birthDate") || "").trim()
    const studentAverage = String(form.get("student_average") || form.get("average") || "").trim()
    const studentAddress = String(form.get("student_address") || form.get("address") || "").trim()
    const studentEmail = String(form.get("student_email") || form.get("email") || "").trim()
    const studentPhone = String(form.get("student_phone") || form.get("phone") || "").trim()
    const studentCourse = String(form.get("student_course") || form.get("course") || "").trim()

    // Campos del tutor (por ahora no se almacenan en la tabla principal)
    const tutor = {
      firstName: String(form.get("tutor_firstName") || "").trim(),
      lastName: String(form.get("tutor_lastName") || "").trim(),
      dni: String(form.get("tutor_dni") || "").trim(),
      relationship: String(form.get("tutor_relationship") || "").trim(),
      address: String(form.get("tutor_address") || "").trim(),
      email: String(form.get("tutor_email") || "").trim(),
      phone: String(form.get("tutor_phone") || "").trim(),
      occupation: String(form.get("tutor_occupation") || "").trim(),
    }

    const observations = String(form.get("observations") || "").trim()

    // Archivos opcionales
    const libreta = form.get("libreta") as File | null
    const photo = form.get("photo") as File | null
    const birthCertificate = form.get("birthCertificate") as File | null
    const dniCopy = form.get("dniCopy") as File | null

    const files: Array<{ key: string; file: File | null }> = [
      { key: "libreta", file: libreta },
      { key: "photo", file: photo },
      { key: "birthCertificate", file: birthCertificate },
      { key: "dniCopy", file: dniCopy },
    ]

    // Subir archivos a Storage (bucket: inscripciones)
    const bucket = "inscripciones"
    const uploadResults: Record<string, { path: string; publicUrl?: string } | null> = {}

    for (const { key, file } of files) {
      if (!file) {
        uploadResults[key] = null
        continue
      }
      const arrayBuffer = await file.arrayBuffer()
      const bytes = new Uint8Array(arrayBuffer)
      const fileNameSafe = file.name.replace(/[^a-zA-Z0-9._-]/g, "_")
      const uniquePrefix = crypto.randomUUID()
      const objectPath = `${studentDni || uniquePrefix}/${uniquePrefix}_${key}_${fileNameSafe}`

      const uploadRes = await fetch(`${SUPABASE_URL}/storage/v1/object/${bucket}/${objectPath}`, {
        method: "POST",
        headers: {
          apikey: SUPABASE_ANON_KEY,
          Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
          "Content-Type": file.type || "application/octet-stream",
          "x-upsert": "true",
        },
        body: bytes,
      })

      if (!uploadRes.ok) {
        const errText = await uploadRes.text().catch(() => "")
        return NextResponse.json(
          { error: `Error al subir ${key}: ${uploadRes.status} ${errText}` },
          { status: 500 }
        )
      }

      // Si el bucket es público, podemos construir la URL pública
      const publicUrl = `${SUPABASE_URL}/storage/v1/object/public/${bucket}/${objectPath}`
      uploadResults[key] = { path: objectPath, publicUrl }
    }

    // Insertar en la tabla inscripciones vía REST
    const rawIp = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || ""
    const firstIp = rawIp.split(",")[0]?.trim() || ""
    const ipv4 = /^(25[0-5]|2[0-4]\d|[01]?\d\d?)(\.(25[0-5]|2[0-4]\d|[01]?\d\d?)){3}$/
    const ipv6 = /^[0-9a-fA-F:]+$/
    const ip = firstIp && (ipv4.test(firstIp) || ipv6.test(firstIp)) ? firstIp : null
    const userAgent = req.headers.get("user-agent") || null

    const payload = {
      nombres: studentFirstName,
      apellidos: studentLastName,
      dni: studentDni,
      email: studentEmail || null,
      telefono: studentPhone || tutor.phone || null,
      fecha_nacimiento: studentBirthDate || null,
      direccion: studentAddress || null,
      ciudad: null,
      provincia: null,
      curso: studentCourse,
      turno: null,
      consentimiento: true,
      notas: observations || null,
      estado: 'sin_revisar',
      // Datos del tutor
      tutor_nombres: tutor.firstName || null,
      tutor_apellidos: tutor.lastName || null,
      tutor_dni: tutor.dni || null,
      tutor_parentesco: tutor.relationship || null,
      tutor_direccion: tutor.address || null,
      tutor_email: tutor.email || null,
      tutor_telefono: tutor.phone || null,
      tutor_ocupacion: tutor.occupation || null,
      ip_registro: ip,
      user_agent: userAgent,
    }

    const insertRes = await fetch(`${SUPABASE_URL}/rest/v1/inscripciones`, {
      method: "POST",
      headers: {
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
        "Content-Type": "application/json",
        Prefer: "return=representation",
      },
      body: JSON.stringify(payload),
      cache: "no-store",
    })

    if (!insertRes.ok) {
      const text = await insertRes.text().catch(() => "")
      return NextResponse.json({ error: `Error al guardar datos: ${text}` }, { status: 500 })
    }
    const rows = await insertRes.json()
    const inscripcion = Array.isArray(rows) ? rows[0] : rows

    return NextResponse.json({ ok: true, inscripcion, archivos: uploadResults })
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "Error inesperado" }, { status: 500 })
  }
}
