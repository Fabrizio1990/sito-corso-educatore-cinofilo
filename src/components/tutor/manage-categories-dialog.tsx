'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { toast } from 'sonner'

interface Category {
  id: string
  name: string
  sort_order: number | null
}

interface ManageCategoriesDialogProps {
  courses: { id: string; name: string }[]
}

export function ManageCategoriesDialog({ courses }: ManageCategoriesDialogProps) {
  const [open, setOpen] = useState(false)
  const [courseId, setCourseId] = useState('')
  const [categories, setCategories] = useState<Category[]>([])
  const [newCategoryName, setNewCategoryName] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingName, setEditingName] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    if (courseId) {
      fetchCategories()
    } else {
      setCategories([])
    }
  }, [courseId])

  const fetchCategories = async () => {
    const { data } = await supabase
      .from('material_categories')
      .select('id, name, sort_order')
      .eq('course_id', courseId)
      .order('sort_order')

    setCategories(data || [])
  }

  const handleAddCategory = async () => {
    if (!newCategoryName.trim() || !courseId) return

    setLoading(true)
    const { error } = await supabase
      .from('material_categories')
      .insert({
        course_id: courseId,
        name: newCategoryName.trim(),
        sort_order: categories.length,
      })

    if (error) {
      toast.error('Errore nella creazione')
    } else {
      toast.success('Categoria creata')
      setNewCategoryName('')
      fetchCategories()
      router.refresh()
    }
    setLoading(false)
  }

  const handleUpdateCategory = async (id: string) => {
    if (!editingName.trim()) return

    setLoading(true)
    const { error } = await supabase
      .from('material_categories')
      .update({ name: editingName.trim() })
      .eq('id', id)

    if (error) {
      toast.error('Errore nel salvataggio')
    } else {
      toast.success('Categoria aggiornata')
      setEditingId(null)
      setEditingName('')
      fetchCategories()
      router.refresh()
    }
    setLoading(false)
  }

  const handleDeleteCategory = async (id: string) => {
    if (!confirm('Eliminare questa categoria? I materiali associati rimarranno senza categoria.')) {
      return
    }

    setLoading(true)
    const { error } = await supabase
      .from('material_categories')
      .delete()
      .eq('id', id)

    if (error) {
      toast.error('Errore nell\'eliminazione')
    } else {
      toast.success('Categoria eliminata')
      fetchCategories()
      router.refresh()
    }
    setLoading(false)
  }

  const handleMoveUp = async (index: number) => {
    if (index === 0) return
    const newCategories = [...categories]
    const temp = newCategories[index]
    newCategories[index] = newCategories[index - 1]
    newCategories[index - 1] = temp

    // Update sort_order for both
    await supabase.from('material_categories').update({ sort_order: index - 1 }).eq('id', temp.id)
    await supabase.from('material_categories').update({ sort_order: index }).eq('id', newCategories[index].id)

    fetchCategories()
  }

  const handleMoveDown = async (index: number) => {
    if (index === categories.length - 1) return
    const newCategories = [...categories]
    const temp = newCategories[index]
    newCategories[index] = newCategories[index + 1]
    newCategories[index + 1] = temp

    // Update sort_order for both
    await supabase.from('material_categories').update({ sort_order: index + 1 }).eq('id', temp.id)
    await supabase.from('material_categories').update({ sort_order: index }).eq('id', newCategories[index].id)

    fetchCategories()
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">Gestisci Categorie</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Gestisci Categorie</DialogTitle>
          <DialogDescription>
            Organizza i materiali in categorie/argomenti per ogni corso
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Course Selection */}
          <div className="grid gap-2">
            <Label>Seleziona un corso</Label>
            <Select value={courseId} onValueChange={setCourseId}>
              <SelectTrigger>
                <SelectValue placeholder="Seleziona un corso" />
              </SelectTrigger>
              <SelectContent>
                {courses.map((course) => (
                  <SelectItem key={course.id} value={course.id}>
                    {course.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {courseId && (
            <>
              {/* Add New Category */}
              <div className="flex gap-2">
                <Input
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  placeholder="Nuova categoria (es. Modulo 1)"
                  className="flex-1"
                  onKeyDown={(e) => e.key === 'Enter' && handleAddCategory()}
                />
                <Button onClick={handleAddCategory} disabled={loading || !newCategoryName.trim()}>
                  Aggiungi
                </Button>
              </div>

              {/* Categories List */}
              <div className="space-y-2 max-h-[300px] overflow-y-auto">
                {categories.length === 0 ? (
                  <p className="text-center text-gray-500 py-4">
                    Nessuna categoria per questo corso
                  </p>
                ) : (
                  categories.map((category, index) => (
                    <div
                      key={category.id}
                      className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg"
                    >
                      {/* Move buttons */}
                      <div className="flex flex-col gap-1">
                        <button
                          onClick={() => handleMoveUp(index)}
                          disabled={index === 0}
                          className="text-gray-400 hover:text-gray-600 disabled:opacity-30"
                        >
                          ▲
                        </button>
                        <button
                          onClick={() => handleMoveDown(index)}
                          disabled={index === categories.length - 1}
                          className="text-gray-400 hover:text-gray-600 disabled:opacity-30"
                        >
                          ▼
                        </button>
                      </div>

                      {/* Category name */}
                      {editingId === category.id ? (
                        <Input
                          value={editingName}
                          onChange={(e) => setEditingName(e.target.value)}
                          className="flex-1 h-8"
                          autoFocus
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleUpdateCategory(category.id)
                            if (e.key === 'Escape') {
                              setEditingId(null)
                              setEditingName('')
                            }
                          }}
                        />
                      ) : (
                        <span className="flex-1 font-medium">{category.name}</span>
                      )}

                      {/* Actions */}
                      <div className="flex gap-1">
                        {editingId === category.id ? (
                          <>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleUpdateCategory(category.id)}
                              disabled={loading}
                            >
                              ✓
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => {
                                setEditingId(null)
                                setEditingName('')
                              }}
                            >
                              ✕
                            </Button>
                          </>
                        ) : (
                          <>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => {
                                setEditingId(category.id)
                                setEditingName(category.name)
                              }}
                            >
                              ✎
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="text-red-600"
                              onClick={() => handleDeleteCategory(category.id)}
                              disabled={loading}
                            >
                              🗑
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
