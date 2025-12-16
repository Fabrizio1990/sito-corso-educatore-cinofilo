'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
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
}

interface EditMaterialCategoryProps {
  materialId: string
  materialTitle: string
  courseId: string
  currentCategoryId: string | null
}

export function EditMaterialCategory({
  materialId,
  materialTitle,
  courseId,
  currentCategoryId,
}: EditMaterialCategoryProps) {
  const [open, setOpen] = useState(false)
  const [categoryId, setCategoryId] = useState(currentCategoryId || 'none')
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    if (open) {
      fetchCategories()
    }
  }, [open])

  const fetchCategories = async () => {
    const { data } = await supabase
      .from('material_categories')
      .select('id, name')
      .eq('course_id', courseId)
      .order('sort_order')

    setCategories(data || [])
  }

  const handleSave = async () => {
    setLoading(true)

    const newCategoryId = categoryId === 'none' ? null : categoryId

    const { error } = await supabase
      .from('materials')
      .update({ category_id: newCategoryId })
      .eq('id', materialId)

    if (error) {
      toast.error('Errore nel salvataggio')
    } else {
      toast.success('Categoria aggiornata')
      setOpen(false)
      router.refresh()
    }

    setLoading(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="h-8 px-2">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
          </svg>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle>Modifica categoria</DialogTitle>
          <DialogDescription className="break-words">
            Assegna &quot;{materialTitle}&quot; a una categoria
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          <Select value={categoryId} onValueChange={setCategoryId}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Seleziona categoria" className="truncate" />
            </SelectTrigger>
            <SelectContent className="max-w-[350px]">
              <SelectItem value="none">Nessuna categoria</SelectItem>
              {categories.map((cat) => (
                <SelectItem key={cat.id} value={cat.id} className="max-w-full">
                  <span className="truncate block max-w-[300px]">{cat.name}</span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {categories.length === 0 && (
            <p className="text-sm text-gray-500 mt-2">
              Non ci sono categorie per questo corso. Creale dalla sezione Materiali.
            </p>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Annulla
          </Button>
          <Button onClick={handleSave} disabled={loading}>
            {loading ? 'Salvataggio...' : 'Salva'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
