"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Edit, X, Save } from "lucide-react"

const subjects = ["Matemática", "Lengua", "Historia", "Ciencias Naturales", "Informática", "Inglés"]
const courses = ["3° Año C", "4° Año A", "4° Año B", "5° Año A", "5° Año B", "6° Año A"]

interface MaterialEditProps {
  material: any
  onSave?: (updatedMaterial: any) => void
  onCancel?: () => void
}

export function MaterialEdit({ material, onSave, onCancel }: MaterialEditProps) {
  const [title, setTitle] = useState(material?.title || "")
  const [description, setDescription] = useState(material?.description || "")
  const [subject, setSubject] = useState(material?.subject || "")
  const [course, setCourse] = useState(material?.course || "")
  const [tags, setTags] = useState<string[]>(material?.tags || [])
  const [newTag, setNewTag] = useState("")
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    if (material) {
      setTitle(material.title)
      setDescription(material.description)
      setSubject(material.subject)
      setCourse(material.course)
      setTags(material.tags || [])
    }
  }, [material])

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
    setIsSaving(true)

    // Simulate API call
    setTimeout(() => {
      const updatedMaterial = {
        ...material,
        title,
        description,
        subject,
        course,
        tags,
        lastModified: new Date().toISOString(),
      }

      console.log("Updating material:", updatedMaterial)
      alert("Material actualizado exitosamente")

      setIsSaving(false)
      onSave?.(updatedMaterial)
    }, 1500)
  }

  const isFormValid = () => {
    return title.trim() && description.trim() && subject && course
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Edit className="w-5 h-5" />
            Editar Material
          </CardTitle>
          <Button variant="ghost" size="sm" onClick={onCancel}>
            <X className="w-4 h-4" />
          </Button>
        </div>
      </CardHeader>

      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-title">Título del Material *</Label>
              <Input id="edit-title" value={title} onChange={(e) => setTitle(e.target.value)} required />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-description">Descripción *</Label>
              <Textarea
                id="edit-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-subject">Materia *</Label>
                <Select value={subject} onValueChange={setSubject} required>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar materia" />
                  </SelectTrigger>
                  <SelectContent>
                    {subjects.map((subj) => (
                      <SelectItem key={subj} value={subj}>
                        {subj}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-course">Curso *</Label>
                <Select value={course} onValueChange={setCourse} required>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar curso" />
                  </SelectTrigger>
                  <SelectContent>
                    {courses.map((c) => (
                      <SelectItem key={c} value={c}>
                        {c}
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
              <Label htmlFor="edit-tags">Etiquetas</Label>
              <div className="flex gap-2">
                <Input
                  id="edit-tags"
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
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancelar
            </Button>
            <Button type="submit" disabled={!isFormValid() || isSaving} className="gap-2">
              {isSaving ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-foreground"></div>
                  Guardando...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Guardar Cambios
                </>
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
