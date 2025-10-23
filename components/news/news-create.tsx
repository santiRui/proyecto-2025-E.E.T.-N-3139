"use client"

import type React from "react"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { PlusCircle, X, Send } from "lucide-react"

const categories = [
  "Institucional",
  "Reunión",
  "Actividades",
  "Seguridad",
  "Eventos",
  "Académico",
  "Deportes",
  "Talleres",
]

const priorities = [
  { value: "high", label: "Urgente", color: "bg-red-100 text-red-800" },
  { value: "medium", label: "Importante", color: "bg-yellow-100 text-yellow-800" },
  { value: "low", label: "Informativo", color: "bg-green-100 text-green-800" },
]

interface NewsCreateProps {
  userRole: string
  onNewsCreated?: () => void
}

export function NewsCreate({ userRole, onNewsCreated }: NewsCreateProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [title, setTitle] = useState("")
  const [content, setContent] = useState("")
  const [category, setCategory] = useState("")
  const [priority, setPriority] = useState("")
  const [tags, setTags] = useState<string[]>([])
  const [newTag, setNewTag] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

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
    setIsSubmitting(true)

    // Simulate API call
    setTimeout(() => {
      console.log("Creating news:", {
        title,
        content,
        category,
        priority,
        tags,
        author: userRole === "teacher" ? "Profesor" : "Preceptor",
        date: new Date().toISOString(),
      })

      // Reset form
      setTitle("")
      setContent("")
      setCategory("")
      setPriority("")
      setTags([])
      setIsSubmitting(false)
      setIsOpen(false)

      alert("Noticia creada exitosamente")
      onNewsCreated?.()
    }, 1500)
  }

  const isFormValid = () => {
    return title.trim() && content.trim() && category && priority
  }

  const getPriorityColor = (priorityValue: string) => {
    return priorities.find((p) => p.value === priorityValue)?.color || "bg-muted text-muted-foreground"
  }

  if (!isOpen) {
    return (
      <Button onClick={() => setIsOpen(true)} className="gap-2">
        <PlusCircle className="w-4 h-4" />
        Crear Noticia
      </Button>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <PlusCircle className="w-5 h-5" />
            Nueva Noticia
          </CardTitle>
          <Button variant="ghost" size="sm" onClick={() => setIsOpen(false)}>
            <X className="w-4 h-4" />
          </Button>
        </div>
      </CardHeader>

      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Título de la Noticia *</Label>
              <Input
                id="title"
                placeholder="Ej: Reunión de Padres - Marzo 2025"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="content">Contenido *</Label>
              <Textarea
                id="content"
                placeholder="Escribe el contenido completo de la noticia..."
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={6}
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="category">Categoría *</Label>
                <Select value={category} onValueChange={setCategory} required>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar categoría" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat} value={cat}>
                        {cat}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="priority">Prioridad *</Label>
                <Select value={priority} onValueChange={setPriority} required>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar prioridad" />
                  </SelectTrigger>
                  <SelectContent>
                    {priorities.map((p) => (
                      <SelectItem key={p.value} value={p.value}>
                        <div className="flex items-center gap-2">
                          <div className={`w-2 h-2 rounded-full ${p.color.split(" ")[0]}`}></div>
                          {p.label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Tags */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="tags">Etiquetas (opcional)</Label>
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

          {/* Preview */}
          {(title || content || category || priority) && (
            <div className="space-y-2">
              <Label>Vista Previa</Label>
              <Card className="border-dashed">
                <CardContent className="pt-4">
                  <div className="space-y-2">
                    {(category || priority) && (
                      <div className="flex gap-2">
                        {priority && (
                          <Badge className={getPriorityColor(priority)}>
                            {priorities.find((p) => p.value === priority)?.label}
                          </Badge>
                        )}
                        {category && <Badge variant="outline">{category}</Badge>}
                      </div>
                    )}
                    {title && <h3 className="font-semibold text-balance">{title}</h3>}
                    {content && (
                      <p className="text-sm text-muted-foreground text-pretty">
                        {content.substring(0, 150)}
                        {content.length > 150 ? "..." : ""}
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Submit */}
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={!isFormValid() || isSubmitting} className="gap-2">
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-foreground"></div>
                  Publicando...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  Publicar Noticia
                </>
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
