"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
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

const mockMaterials = [
  {
    id: 1,
    title: "Guía de Ejercicios - Álgebra Lineal",
    description: "Ejercicios prácticos para reforzar conceptos de álgebra lineal y matrices.",
    subject: "Matemática",
    course: "5° Año A",
    type: "document",
    fileType: "pdf",
    uploadDate: "2025-01-20",
    uploadedBy: "Prof. García",
    downloads: 45,
    size: "2.3 MB",
    tags: ["ejercicios", "álgebra", "matrices"],
  },
  {
    id: 2,
    title: "Video Tutorial - Funciones Cuadráticas",
    description: "Explicación detallada sobre funciones cuadráticas con ejemplos prácticos.",
    subject: "Matemática",
    course: "4° Año B",
    type: "video",
    fileType: "mp4",
    uploadDate: "2025-01-18",
    uploadedBy: "Prof. García",
    downloads: 32,
    size: "125 MB",
    tags: ["video", "funciones", "cuadráticas"],
  },
  {
    id: 3,
    title: "Análisis de Texto - Martín Fierro",
    description: "Análisis literario completo del Martín Fierro con guía de preguntas.",
    subject: "Lengua",
    course: "6° Año A",
    type: "document",
    fileType: "docx",
    uploadDate: "2025-01-15",
    uploadedBy: "Prof. Martínez",
    downloads: 28,
    size: "1.8 MB",
    tags: ["literatura", "análisis", "martín fierro"],
  },
  {
    id: 4,
    title: "Presentación - Revolución Industrial",
    description: "Presentación interactiva sobre la Revolución Industrial y sus consecuencias.",
    subject: "Historia",
    course: "5° Año A",
    type: "presentation",
    fileType: "pptx",
    uploadDate: "2025-01-12",
    uploadedBy: "Prof. López",
    downloads: 38,
    size: "15.2 MB",
    tags: ["historia", "revolución", "industrial"],
  },
  {
    id: 5,
    title: "Laboratorio Virtual - Química Orgánica",
    description: "Simulador interactivo para experimentos de química orgánica.",
    subject: "Ciencias Naturales",
    course: "6° Año A",
    type: "link",
    fileType: "url",
    uploadDate: "2025-01-10",
    uploadedBy: "Prof. Rodríguez",
    downloads: 52,
    size: "-",
    tags: ["laboratorio", "química", "simulador"],
  },
  {
    id: 6,
    title: "Ejercicios de Programación - Python",
    description: "Conjunto de ejercicios prácticos para aprender programación en Python.",
    subject: "Informática",
    course: "5° Año A",
    type: "document",
    fileType: "zip",
    uploadDate: "2025-01-08",
    uploadedBy: "Prof. Silva",
    downloads: 41,
    size: "5.7 MB",
    tags: ["programación", "python", "ejercicios"],
  },
]

const subjects = ["Todas las materias", "Matemática", "Lengua", "Historia", "Ciencias Naturales", "Informática"]
const courses = ["Todos los cursos", "3° Año C", "4° Año B", "5° Año A", "6° Año A"]
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

  const filteredMaterials = mockMaterials.filter((material) => {
    const matchesSearch =
      material.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      material.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      material.tags.some((tag) => tag.toLowerCase().includes(searchTerm.toLowerCase()))

    const matchesSubject = selectedSubject === "Todas las materias" || material.subject === selectedSubject
    const matchesCourse = selectedCourse === "Todos los cursos" || material.course === selectedCourse
    const matchesType = selectedType === "Todos los tipos" || material.type === selectedType

    return matchesSearch && matchesSubject && matchesCourse && matchesType
  })

  const handleDownload = (material: any) => {
    // Simulate download
    console.log("Downloading:", material.title)
    alert(`Descargando: ${material.title}`)
  }

  const handleOpenLink = (material: any) => {
    // Simulate opening external link
    console.log("Opening link:", material.title)
    alert(`Abriendo enlace: ${material.title}`)
  }

  const canManageMaterial = (material: any) => {
    if (userRole === "student" || userRole === "parent") return false
    return material.uploadedBy.includes("Prof.") && (userRole === "teacher" || userRole === "preceptor")
  }

  const handleEdit = (material: any) => {
    console.log("Editing material:", material.title)
    alert(`Editando: ${material.title}`)
  }

  const handleDeleteClick = (material: any) => {
    setMaterialToDelete(material)
    setDeleteDialogOpen(true)
  }

  const handleDeleteConfirm = () => {
    if (materialToDelete) {
      console.log("Deleting material:", materialToDelete.title)
      alert(`Material eliminado: ${materialToDelete.title}`)
      setDeleteDialogOpen(false)
      setMaterialToDelete(null)
    }
  }

  const handleViewDetails = (material: any) => {
    console.log("Viewing details:", material.title)
    alert(`Viendo detalles de: ${material.title}`)
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
                {subjects.map((subject) => (
                  <SelectItem key={subject} value={subject}>
                    {subject}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={selectedCourse} onValueChange={setSelectedCourse}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {courses.map((course) => (
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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredMaterials.map((material) => (
          <Card key={material.id} className="hover:shadow-md transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  {getFileIcon(material.fileType, material.type)}
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
                {material.tags.map((tag, index) => (
                  <Badge key={index} variant="secondary" className="text-xs">
                    {tag}
                  </Badge>
                ))}
              </div>

              <div className="space-y-2 text-xs text-muted-foreground">
                <div className="flex items-center gap-2">
                  <BookOpen className="w-3 h-3" />
                  <span>{material.course}</span>
                </div>
                <div className="flex items-center gap-2">
                  <User className="w-3 h-3" />
                  <span>{material.uploadedBy}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="w-3 h-3" />
                  <span>{material.uploadDate}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Download className="w-3 h-3" />
                    <span>{material.downloads} descargas</span>
                  </div>
                  <span>{material.size}</span>
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                {material.type === "link" ? (
                  <Button size="sm" className="flex-1" onClick={() => handleOpenLink(material)}>
                    <ExternalLink className="w-4 h-4 mr-2" />
                    Abrir
                  </Button>
                ) : (
                  <Button size="sm" className="flex-1" onClick={() => handleDownload(material)}>
                    <Download className="w-4 h-4 mr-2" />
                    Descargar
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredMaterials.length === 0 && (
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
