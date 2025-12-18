'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
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

interface CreateCaseStudyDialogProps {
  courses: { id: string; name: string }[]
}

export function CreateCaseStudyDialog({ courses }: CreateCaseStudyDialogProps) {
  const [open, setOpen] = useState(false)
  const [courseId, setCourseId] = useState('')
  const [title, setTitle] = useState('')
  const [scenario, setScenario] = useState('')
  const [modelAnswer, setModelAnswer] = useState('')
  const [hints, setHints] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const { error } = await supabase.from('case_studies').insert({
      course_id: courseId,
      title,
      scenario,
      model_answer: modelAnswer,
      hints: hints || null,
    })

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    setOpen(false)
    setCourseId('')
    setTitle('')
    setScenario('')
    setModelAnswer('')
    setHints('')
    setLoading(false)
    router.refresh()
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>Nuovo Caso di Studio</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Crea nuovo caso di studio</DialogTitle>
            <DialogDescription>
              L'AI valuterà le risposte degli studenti basandosi sulla risposta modello
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            {error && (
              <div className="p-3 text-sm text-red-500 bg-red-50 rounded-md">
                {error}
              </div>
            )}
            <div className="grid gap-2">
              <Label htmlFor="course">Corso *</Label>
              <Select value={courseId} onValueChange={setCourseId} required>
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
            <div className="grid gap-2">
              <Label htmlFor="title">Titolo *</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="es. Cane che tira al guinzaglio"
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="scenario">Scenario / Caso *</Label>
              <textarea
                id="scenario"
                value={scenario}
                onChange={(e) => setScenario(e.target.value)}
                placeholder="Descrivi la situazione che lo studente deve analizzare...&#10;&#10;es. Il cane tira al guinzaglio ed è geloso della padrona. Quando escono a passeggio, il cane si posiziona sempre tra la padrona e le altre persone."
                className="flex min-h-[120px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                required
              />
              <p className="text-xs text-gray-500">
                Questo è ciò che vedranno gli studenti
              </p>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="modelAnswer">Risposta Modello *</Label>
              <textarea
                id="modelAnswer"
                value={modelAnswer}
                onChange={(e) => setModelAnswer(e.target.value)}
                placeholder="La risposta corretta che l'AI userà per valutare...&#10;&#10;es. Il comportamento indica una mancanza di rispetto della gerarchia e un tentativo del cane di controllare e proteggere la risorsa (la padrona). È necessario lavorare sulla leadership e sul distacco emotivo."
                className="flex min-h-[120px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                required
              />
              <p className="text-xs text-gray-500">
                Gli studenti NON vedranno questa risposta. L'AI la userà per valutare
              </p>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="hints">Suggerimenti (opzionale)</Label>
              <textarea
                id="hints"
                value={hints}
                onChange={(e) => setHints(e.target.value)}
                placeholder="Suggerimenti che l'AI può usare per guidare lo studente...&#10;&#10;es. Pensa al concetto di risorsa nel mondo canino. Chi controlla le risorse?"
                className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              />
              <p className="text-xs text-gray-500">
                L'AI userà questi hint per aiutare gli studenti che sbagliano
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Annulla
            </Button>
            <Button type="submit" disabled={loading || !courseId || !title || !scenario || !modelAnswer}>
              {loading ? 'Creazione...' : 'Crea caso di studio'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
