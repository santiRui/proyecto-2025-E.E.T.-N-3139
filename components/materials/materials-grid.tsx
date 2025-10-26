"use client"

import { useEffect, useMemo, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { useToast } from "@/components/ui/use-toast"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  Search,
  Filter,
  FileText,
  Download,
  ExternalLink,
  Calendar,
  User,
  BookOpen,
  Video,
  ImageIcon,
  File,
  FileSpreadsheet,
  MoreVertical,
  Edit,
  Trash2,
  Eye,
} from "lucide-react"

// data now comes from API

const defaultSubjects = ["Todas las materias", "Matemática", "Lengua", "Historia", "Ciencias Naturales", "Informática"]
const defaultCourses = ["Todos los cursos", "3° Año C", "4° Año B", "5° Año A", "6° Año A"]
const materialTypes = ["Todos los tipos", "document", "video", "presentation", "link"]

interface MaterialsGridProps {
  userRole: string
}

export function MaterialsGrid({ userRole }: MaterialsGridProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedSubject, setSelectedSubject] = useState("Todas las materias")
  const [selectedCourse, setSelectedCourse] = useState("Todos los cursos")
  const [selectedType, setSelectedType] = useState("Todos los tipos")
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [materialToDelete, setMaterialToDelete] = useState<any>(null)
  const { toast } = useToast()

  const [materials, setMaterials] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const isTeacher = userRole === "teacher"
  const isStudent = userRole === "student" || userRole === "estudiante"
  const [assignedSubjects, setAssignedSubjects] = useState<string[]>([])
  const [assignedCourses, setAssignedCourses] = useState<string[]>([])
  const [studentCourseId, setStudentCourseId] = useState<string | null>(null)
  const [studentCourseName, setStudentCourseName] = useState<string>("")
  const [studentSubjectNames, setStudentSubjectNames] = useState<string[]>([])

  useEffect(() => {
    if (!isTeacher) return
    let cancelled = false
    ;(async () => {
      try {
        const [subRes, crsRes] = await Promise.all([
          fetch('/api/subject-teachers?teacher=me', { credentials: 'include' }),
          fetch('/api/teacher-courses?teacher=me', { credentials: 'include' }),
        ])
        const subData = await subRes.json().catch(() => ({}))
        const crsData = await crsRes.json().catch(() => ({}))
        if (!cancelled) {
          const subs = Array.isArray(subData?.subjects) ? subData.subjects.map((s: any) => s?.nombre).filter(Boolean) : []
          const crss = Array.isArray(crsData?.courses) ? crsData.courses.map((c: any) => c?.nombre).filter(Boolean) : []
          setAssignedSubjects(subs)
          setAssignedCourses(crss)
          setSelectedSubject((prev) => (prev !== "Todas las materias" && subs.includes(prev) ? prev : "Todas las materias"))
          setSelectedCourse((prev) => (prev !== "Todos los cursos" && crss.includes(prev) ? prev : "Todos los cursos"))
        }
      } catch {
        if (!cancelled) { setAssignedSubjects([]); setAssignedCourses([]) }
      }
    })()
    return () => { cancelled = true }
  }, [isTeacher])

  const subjectOptions = useMemo(() => {
    if (isTeacher) return ["Todas las materias", ...assignedSubjects]
    if (isStudent) {
      const fallback = Array.from(new Set((materials || []).map((m: any) => m?.subject).filter(Boolean))) as string[]
      const list = (studentSubjectNames && studentSubjectNames.length > 0) ? studentSubjectNames : fallback
      return ["Todas las materias", ...list]
    }
    return defaultSubjects
  }, [isTeacher, isStudent, assignedSubjects, studentSubjectNames, materials])

  const courseOptions = useMemo(() => {
    if (isTeacher) return ["Todos los cursos", ...assignedCourses]
    if (isStudent) return studentCourseName ? [studentCourseName] : []
    return defaultCourses
  }, [isTeacher, isStudent, assignedCourses, studentCourseName])

  // Load student's course and its subjects
  useEffect(() => {
    if (!isStudent) return
    let cancelled = false
    ;(async () => {
      try {
        const cr = await fetch('/api/student-course', { credentials: 'include' })
        const crData = await cr.json().catch(() => ({}))
        if (!cr.ok) throw new Error(crData?.error || 'No se pudo obtener curso asignado')
        const c = crData?.course
        if (!c?.id) throw new Error('Sin curso asignado')
        if (cancelled) return
        setStudentCourseId(c.id)
        setStudentCourseName(c.nombre)
        setSelectedCourse(c.nombre)

        const sr = await fetch(`/api/course-subjects?mode=assigned&course_id=${encodeURIComponent(c.id)}`, { credentials: 'include' })
        const srData = await sr.json().catch(() => ({}))
        if (!sr.ok) throw new Error(srData?.error || 'No se pudieron obtener materias del curso')
        const names = Array.isArray(srData?.subjects) ? srData.subjects.map((s: any) => s?.nombre).filter(Boolean) : []
        if (cancelled) return
        setStudentSubjectNames(names)
        setSelectedSubject((prev) => (prev !== "Todas las materias" && names.includes(prev) ? prev : "Todas las materias"))
      } catch (e: any) {
        if (!cancelled) {
          setStudentCourseId(null)
          setStudentCourseName("")
          setStudentSubjectNames([])
          toast({ title: 'Atención', description: e?.message || 'No tienes curso asignado', variant: 'destructive' as any })
        }
      }
    })()
    return () => { cancelled = true }
  }, [isStudent])

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError("")
    ;(async () => {
      try {
        const res = await fetch('/api/materials', { credentials: 'include' })
        const data = await res.json().catch(() => ({}))
        if (!res.ok) throw new Error(data?.error || 'No se pudieron obtener materiales')
        if (!cancelled) setMaterials(Array.isArray(data?.materials) ? data.materials : [])
      } catch (e: any) {
        if (!cancelled) {
          setError(e?.message || 'Error al cargar materiales')
          toast({ title: 'Error', description: e?.message || 'No se pudieron cargar los materiales', variant: 'destructive' as any })
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => { cancelled = true }
  }, [])

  const getFileIcon = (fileType: string, type: string) => {
    if (type === "video") return <Video className="w-5 h-5 text-red-500" />
    if (type === "link") return <ExternalLink className="w-5 h-5 text-blue-500" />
    if (type === "presentation") return <FileSpreadsheet className="w-5 h-5 text-orange-500" />

    switch (fileType) {
      case "pdf":
        return <FileText className="w-5 h-5 text-red-500" />
      case "docx":
        return <FileText className="w-5 h-5 text-blue-500" />
      case "pptx":
        return <FileSpreadsheet className="w-5 h-5 text-orange-500" />
      case "zip":
        return <File className="w-5 h-5 text-purple-500" />
      case "jpg":
      case "png":
        return <ImageIcon className="w-5 h-5 text-green-500" />
      default:
        return <File className="w-5 h-5 text-muted-foreground" />
    }
  }

  const getTypeLabel = (type: string) => {
    const labels = {
      document: "Documento",
      video: "Video",
      presentation: "Presentación",
      link: "Enlace",
    }
    return labels[type as keyof typeof labels] || type
  }

  const getTypeColor = (type: string) => {
    const colors = {
      document: "bg-blue-100 text-blue-800",
      video: "bg-red-100 text-red-800",
      presentation: "bg-orange-100 text-orange-800",
      link: "bg-green-100 text-green-800",
    }
    return colors[type as keyof typeof colors] || "bg-muted text-muted-foreground"
  }

  const filteredMaterials = materials.filter((material) => {
    const matchesSearch =
      material.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      material.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      material.tags.some((tag: string) => tag.toLowerCase().includes(searchTerm.toLowerCase()))

    const matchesSubject = (selectedSubject === "Todas las materias" || material.subject === selectedSubject) && (!isTeacher || assignedSubjects.includes(material.subject))
    const matchesCourse = (selectedCourse === "Todos los cursos" || material.course === selectedCourse) && (!isTeacher || assignedCourses.includes(material.course))
    const matchesType = selectedType === "Todos los tipos" || material.type === selectedType

    return matchesSearch && matchesSubject && matchesCourse && matchesType
  })

  const handleDownload = (material: any) => {
    const url = material?.file_url
    if (!url) {
      toast({ title: 'Archivo no disponible', description: 'Este material no tiene un archivo asociado', variant: 'destructive' as any })
      return
    }
    try {
      const a = document.createElement('a')
      a.href = url
      a.target = '_blank'
      a.rel = 'noopener'
      const baseName = (material?.title || 'material').toString().trim().replace(/\s+/g, '_')
      a.download = baseName
      document.body.appendChild(a)
      a.click()
      a.remove()
      toast({ title: 'Descarga iniciada', description: material.title })
    } catch (e: any) {
      toast({ title: 'No se pudo iniciar la descarga', description: e?.message || 'Intenta nuevamente', variant: 'destructive' as any })
    }
  }

  const handleOpenLink = (material: any) => {
    toast({
      title: "Abriendo enlace",
      description: material.title,
    })
  }

  const canManageMaterial = (material: any) => {
    if (userRole === "student" || userRole === "parent") return false
    return material.uploadedBy.includes("Prof.") && (userRole === "teacher" || userRole === "preceptor")
  }

  const handleEdit = (material: any) => {
    toast({ title: "Editar material", description: material.title })
  }

  const handleDeleteClick = (material: any) => {
    setMaterialToDelete(material)
    setDeleteDialogOpen(true)
  }

  const handleDeleteConfirm = () => {
    if (materialToDelete) {
      toast({ title: "Material eliminado", description: materialToDelete.title })
      setDeleteDialogOpen(false)
      setMaterialToDelete(null)
    }
  }

  const handleViewDetails = (material: any) => {
    toast({ title: "Detalles", description: material.title })
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="w-5 h-5" />
            Filtros
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Buscar materiales..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            <Select value={selectedSubject} onValueChange={setSelectedSubject}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {subjectOptions.map((subject) => (
                  <SelectItem key={subject} value={subject}>
                    {subject}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={selectedCourse} onValueChange={setSelectedCourse} disabled={isStudent}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {courseOptions.map((course) => (
                  <SelectItem key={course} value={course}>
                    {course}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={selectedType} onValueChange={setSelectedType}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {materialTypes.map((type) => (
                  <SelectItem key={type} value={type}>
                    {type === "Todos los tipos" ? type : getTypeLabel(type)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Materials Grid */}
      {loading && (
        <Card>
          <CardContent className="text-center py-12">Cargando materiales...</CardContent>
        </Card>
      )}
      {!loading && filteredMaterials.length > 0 && (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredMaterials.map((material: any) => (
          <Card key={material.id} className="hover:shadow-md transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  {getFileIcon(material.file_type || material.fileType, material.type)}
                  <Badge className={getTypeColor(material.type)}>{getTypeLabel(material.type)}</Badge>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs">
                    {material.subject}
                  </Badge>
                  {canManageMaterial(material) && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleViewDetails(material)}>
                          <Eye className="w-4 h-4 mr-2" />
                          Ver detalles
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleEdit(material)}>
                          <Edit className="w-4 h-4 mr-2" />
                          Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleDeleteClick(material)} className="text-destructive">
                          <Trash2 className="w-4 h-4 mr-2" />
                          Eliminar
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </div>
              </div>
              <CardTitle className="text-lg text-balance leading-tight">{material.title}</CardTitle>
            </CardHeader>

            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground text-pretty leading-relaxed">{material.description}</p>

              <div className="flex flex-wrap gap-1">
                {material.tags.map((tag: string, index: number) => (
                  <Badge key={index} variant="secondary" className="text-xs">
                    {tag}
                  </Badge>
                ))}
              </div>

              <div className="space-y-2 text-xs text-muted-foreground">
                <div className="flex items-center gap-2">
                  <BookOpen className="w-3 h-3" />
                  <span>{material.course || 'Sin curso'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <User className="w-3 h-3" />
                  <span>{material.uploadedBy || '—'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="w-3 h-3" />
                  <span>{new Date(material.uploadDate).toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Download className="w-3 h-3" />
                    <span>Descargar</span>
                  </div>
                  <span>{material.size_bytes ? `${(material.size_bytes/1024/1024).toFixed(2)} MB` : '-'}</span>
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                {material.type === "link" && material.file_url ? (
                  <Button size="sm" className="flex-1" onClick={() => handleOpenLink(material)}>
                    <ExternalLink className="w-4 h-4 mr-2" />
                    Abrir
                  </Button>
                ) : (
                  <Button size="sm" className="flex-1" onClick={() => handleDownload(material)} disabled={!material.file_url}>
                    <Download className="w-4 h-4 mr-2" />
                    Descargar
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      )}

      {!loading && filteredMaterials.length === 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <BookOpen className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No se encontraron materiales con los filtros seleccionados</p>
          </CardContent>
        </Card>
      )}

      {/* AlertDialog for Delete Confirmation */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar material?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. El material "{materialToDelete?.title}" será eliminado permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
