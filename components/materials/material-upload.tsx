"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/components/ui/use-toast"
import { Upload, X, FileText, Link, Video, FileSpreadsheet } from "lucide-react"

const defaultSubjects = ["Matemática", "Lengua", "Historia", "Ciencias Naturales", "Informática", "Inglés"]
const defaultCourses = ["3° Año C", "4° Año A", "4° Año B", "5° Año A", "5° Año B", "6° Año A"]
const materialTypes = [
  { value: "document", label: "Documento", icon: FileText },
  { value: "video", label: "Video", icon: Video },
  { value: "presentation", label: "Presentación", icon: FileSpreadsheet },
  { value: "link", label: "Enlace Web", icon: Link },
]

interface MaterialUploadProps {
  userRole: string
}

export function MaterialUpload({ userRole }: MaterialUploadProps) {
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [subject, setSubject] = useState("")
  const [course, setCourse] = useState("")
  const [materialType, setMaterialType] = useState("")
  const [tags, setTags] = useState<string[]>([])
  const [newTag, setNewTag] = useState("")
  const [file, setFile] = useState<File | null>(null)
  const [url, setUrl] = useState("")
  const [isUploading, setIsUploading] = useState(false)
  const { toast } = useToast()

  const isTeacher = userRole === "teacher"
  const [assignedSubjects, setAssignedSubjects] = useState<string[]>([])
  const [assignedCourses, setAssignedCourses] = useState<string[]>([])

  useEffect(() => {
    if (!isTeacher) return
    let cancelled = false
    ;(async () => {
      try {
        const [subRes, crsRes] = await Promise.all([
          fetch('/api/subject-teachers?teacher=me', { credentials: 'include' }),
          fetch('/api/teacher-courses?teacher=me', { credentials: 'include' })
        ])
        const subData = await subRes.json().catch(() => ({}))
        const crsData = await crsRes.json().catch(() => ({}))
        if (!cancelled) {
          const subs = Array.isArray(subData?.subjects) ? subData.subjects.map((s: any) => s?.nombre).filter(Boolean) : []
          const crss = Array.isArray(crsData?.courses) ? crsData.courses.map((c: any) => c?.nombre).filter(Boolean) : []
          setAssignedSubjects(subs)
          setAssignedCourses(crss)
          // reset selections if not included
          setSubject((prev) => (prev && subs.includes(prev) ? prev : ""))
          setCourse((prev) => (prev && crss.includes(prev) ? prev : ""))
        }
      } catch {
        if (!cancelled) { setAssignedSubjects([]); setAssignedCourses([]) }
      }
    })()
    return () => { cancelled = true }
  }, [isTeacher])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      setFile(selectedFile)
    }
  }

  const handleAddTag = () => {
    if (newTag.trim() && !tags.includes(newTag.trim())) {
      setTags([...tags, newTag.trim()])
      setNewTag("")
    }
  }

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter((tag) => tag !== tagToRemove))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsUploading(true)
    try {
      // If it's a file (not a link), upload to storage first
      let uploadedUrl: string | null = null
      let uploadedType: string | undefined
      let uploadedSize: number | undefined
      if (materialType !== "link" && file) {
        const form = new FormData()
        form.append('file', file)
        const up = await fetch('/api/upload-material?folder=educativos', { method: 'POST', body: form, credentials: 'include' })
        const upData = await up.json().catch(() => ({}))
        if (!up.ok) {
          throw new Error(upData?.error || 'No se pudo subir el archivo')
        }
        uploadedUrl = upData?.url || null
        uploadedType = upData?.type
        uploadedSize = upData?.size
      }

      const payload: any = {
        title,
        description,
        subject,
        course,
        materialType,
        tags,
      }
      if (materialType === "link") {
        payload.fileUrl = url
        payload.fileType = "url"
      } else if (file) {
        payload.fileUrl = uploadedUrl
        payload.fileType = uploadedType || file.type || undefined
        payload.sizeBytes = uploadedSize || file.size || undefined
      }

      const res = await fetch('/api/materials', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        throw new Error(data?.error || 'No se pudo guardar el material')
      }

      // Reset form
      setTitle("")
      setDescription("")
      setSubject("")
      setCourse("")
      setMaterialType("")
      setTags([])
      setFile(null)
      setUrl("")

      toast({ title: "Material subido", description: "Tu material se cargó correctamente y ya está disponible." })
    } catch (err: any) {
      toast({ title: "Error al subir", description: err?.message || 'Intenta nuevamente', variant: "destructive" as any })
    } finally {
      setIsUploading(false)
    }
  }

  const isFormValid = () => {
    const subjectOk = isTeacher ? assignedSubjects.includes(subject) : Boolean(subject)
    const courseOk = isTeacher ? assignedCourses.includes(course) : Boolean(course)
    const basicFields = title && description && subjectOk && courseOk && materialType
    const hasFileOrUrl = materialType === "link" ? url : file
    return basicFields && hasFileOrUrl
  }

  const getTypeIcon = (type: string) => {
    const typeData = materialTypes.find((t) => t.value === type)
    if (typeData) {
      const Icon = typeData.icon
      return <Icon className="w-4 h-4" />
    }
    return <FileText className="w-4 h-4" />
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="w-5 h-5" />
          Subir Material Educativo
        </CardTitle>
      </CardHeader>

      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Título del Material *</Label>
              <Input
                id="title"
                placeholder="Ej: Guía de Ejercicios - Álgebra Lineal"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Descripción *</Label>
              <Textarea
                id="description"
                placeholder="Describe el contenido y propósito del material..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="subject">Materia *</Label>
                <Select value={subject} onValueChange={setSubject} required disabled={isTeacher && assignedSubjects.length === 0}>
                  <SelectTrigger>
                    <SelectValue placeholder={isTeacher ? (assignedSubjects.length === 0 ? "No tienes materias asignadas" : "Seleccionar materia") : "Seleccionar materia"} />
                  </SelectTrigger>
                  <SelectContent>
                    {(isTeacher ? assignedSubjects : defaultSubjects).map((subj) => (
                      <SelectItem key={subj} value={subj}>
                        {subj}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="course">Curso *</Label>
                <Select value={course} onValueChange={setCourse} required disabled={isTeacher && assignedCourses.length === 0}>
                  <SelectTrigger>
                    <SelectValue placeholder={isTeacher ? (assignedCourses.length === 0 ? "No tienes cursos asignados" : "Seleccionar curso") : "Seleccionar curso"} />
                  </SelectTrigger>
                  <SelectContent>
                    {(isTeacher ? assignedCourses : defaultCourses).map((c) => (
                      <SelectItem key={c} value={c}>
                        {c}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="materialType">Tipo de Material *</Label>
                <Select value={materialType} onValueChange={setMaterialType} required>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    {materialTypes.map((type) => {
                      const Icon = type.icon
                      return (
                        <SelectItem key={type.value} value={type.value}>
                          <div className="flex items-center gap-2">
                            <Icon className="w-4 h-4" />
                            {type.label}
                          </div>
                        </SelectItem>
                      )
                    })}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* File Upload or URL */}
          <div className="space-y-4">
            {materialType === "link" ? (
              <div className="space-y-2">
                <Label htmlFor="url">URL del Enlace *</Label>
                <Input
                  id="url"
                  type="url"
                  placeholder="https://ejemplo.com/recurso"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  required
                />
              </div>
            ) : (
              <div className="space-y-2">
                <Label htmlFor="file">Archivo *</Label>
                <div className="border-2 border-dashed border-border rounded-lg p-6 text-center">
                  <input
                    id="file"
                    type="file"
                    onChange={handleFileChange}
                    className="hidden"
                    accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.zip,.jpg,.png,.mp4,.avi"
                  />
                  <label htmlFor="file" className="cursor-pointer">
                    <Upload className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">
                      {file ? file.name : "Haz clic para seleccionar un archivo"}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">PDF, DOC/DOCX, PPT/PPTX, XLS/XLSX, ZIP, JPG/PNG, MP4 (máx. 50MB)</p>
                  </label>
                </div>
              </div>
            )}
          </div>

          {/* Tags */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="tags">Etiquetas</Label>
              <div className="flex gap-2">
                <Input
                  id="tags"
                  placeholder="Agregar etiqueta..."
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), handleAddTag())}
                />
                <Button type="button" variant="outline" onClick={handleAddTag}>
                  Agregar
                </Button>
              </div>
            </div>

            {tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {tags.map((tag, index) => (
                  <Badge key={index} variant="secondary" className="flex items-center gap-1">
                    {tag}
                    <button type="button" onClick={() => handleRemoveTag(tag)} className="ml-1 hover:text-destructive">
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {/* Submit */}
          <div className="flex justify-end">
            <Button type="submit" disabled={!isFormValid() || isUploading} className="gap-2">
              {isUploading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-foreground"></div>
                  Subiendo...
                </>
              ) : (
                <>
                  {getTypeIcon(materialType)}
                  Subir Material
                </>
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
