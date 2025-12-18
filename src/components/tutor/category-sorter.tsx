'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { updateCategoryOrder } from '@/app/actions/categories'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'

interface Category {
  id: string
  name: string
  sort_order: number | null
  materialCount?: number
}

interface CategorySorterProps {
  courseId: string
  categories: Category[]
}

interface SortableCategoryItemProps {
  category: Category
}

function SortableCategoryItem({ category }: SortableCategoryItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: category.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center gap-3 p-3 bg-white border rounded-lg cursor-grab active:cursor-grabbing ${
        isDragging ? 'shadow-lg opacity-90 z-50' : ''
      }`}
      {...attributes}
      {...listeners}
    >
      <div className="text-gray-400">
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" />
        </svg>
      </div>
      <div className="flex-1">
        <span className="font-medium">{category.name}</span>
      </div>
      {category.materialCount !== undefined && (
        <Badge variant="secondary" className="text-xs">
          {category.materialCount} materiali
        </Badge>
      )}
    </div>
  )
}

// Static placeholder for SSR
function StaticCategoryItem({ category }: SortableCategoryItemProps) {
  return (
    <div className="flex items-center gap-3 p-3 bg-white border rounded-lg cursor-grab">
      <div className="text-gray-400">
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" />
        </svg>
      </div>
      <div className="flex-1">
        <span className="font-medium">{category.name}</span>
      </div>
      {category.materialCount !== undefined && (
        <Badge variant="secondary" className="text-xs">
          {category.materialCount} materiali
        </Badge>
      )}
    </div>
  )
}

export function CategorySorter({ courseId, categories: initialCategories }: CategorySorterProps) {
  const [mounted, setMounted] = useState(false)
  const [categories, setCategories] = useState(initialCategories)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    setMounted(true)
    setCategories(initialCategories)
  }, [initialCategories])

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event

    if (!over || active.id === over.id) return

    const oldIndex = categories.findIndex((item) => item.id === active.id)
    const newIndex = categories.findIndex((item) => item.id === over.id)

    // Optimistic update
    const newOrder = arrayMove(categories, oldIndex, newIndex)
    setCategories(newOrder)

    try {
      const updates = newOrder.map((cat, index) => ({
        id: cat.id,
        sort_order: index,
      }))

      const result = await updateCategoryOrder(courseId, updates)

      if (!result.success) {
        throw new Error(result.error)
      }

      toast.success('Ordine aggiornato')
      router.refresh()
    } catch (error) {
      console.error('Error saving order:', error)
      toast.error('Errore nel salvataggio')
      // Revert optimization on error could be added here, but simplicity first
      setCategories(categories) // Revert to old state
    }
  }

  if (categories.length === 0) {
    return null
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Ordina argomenti</CardTitle>
        <CardDescription>
          Trascina gli argomenti per riordinarli. Le modifiche vengono salvate automaticamente.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {mounted ? (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext items={categories} strategy={verticalListSortingStrategy}>
              {categories.map((category) => (
                <SortableCategoryItem key={category.id} category={category} />
              ))}
            </SortableContext>
          </DndContext>
        ) : (
          // Static render for SSR to avoid hydration mismatch
          <div className="space-y-3">
            {categories.map((category) => (
              <StaticCategoryItem key={category.id} category={category} />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
