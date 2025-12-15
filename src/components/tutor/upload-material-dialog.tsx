'use client'

import { useState, useRef } from 'react'
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
import { notifyNewMaterial } from '@/lib/notifications'
import { toast } from 'sonner'

interface UploadMaterialDialogProps {
  courses: { id: string; name: string }[]
}

export function UploadMaterialDialog({ courses }: UploadMaterialDialogProps) {
  const [open, setOpen] = useState(false)
  const [courseId, setCourseId] = useState('')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [uploadProgress, setUploadProgress] = useState(0)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()
  const supabase = createClient()

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      // Check file size (50MB limit)
      if (selectedFile.size > 52428800) {
        setError('Il file è troppo grande. Limite massimo: 50MB')
        return
      }
      setFile(selectedFile)
      setError(null)
      // Auto-fill title with filename if empty
      if (!title) {
        setTitle(selectedFile.name.replace(/\.[^/.]+$/, ''))
      }
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!file) {
      setError('Seleziona un file da caricare')
      return
    }

    setLoading(true)
    setError(null)
    setUploadProgress(0)

    try {
      // Generate unique filename
      const fileExt = file.name.split('.').pop()
      const fileName = `${courseId}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`

      // Upload file to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('course-materials')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false,
        })

      if (uploadError) {
        throw uploadError
      }

      setUploadProgress(50)

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('course-materials')
        .getPublicUrl(fileName)

      // Create signed URL for private access
      const { data: signedUrlData } = await supabase.storage
        .from('course-materials')
        .createSignedUrl(fileName, 31536000) // 1 year expiry

      const fileUrl = signedUrlData?.signedUrl || publicUrl

      setUploadProgress(75)

      // Insert material record
      const { error: dbError } = await supabase.from('materials').insert({
        course_id: courseId,
        title,
        description: description || null,
        file_path: fileUrl,
        file_type: file.type,
      })

      if (dbError) {
        // Delete uploaded file if database insert fails
        await supabase.storage.from('course-materials').remove([fileName])
        throw dbError
      }

      setUploadProgress(100)

      // Send notification to students (fire and forget)
      notifyNewMaterial(courseId, title)

      // Reset form
      setOpen(false)
      setCourseId('')
      setTitle('')
      setDescription('')
      setFile(null)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
      setUploadProgress(0)
      toast.success('Materiale caricato con successo')
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Errore durante il caricamento')
      toast.error('Errore durante il caricamento')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>Carica Materiale</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Carica nuovo materiale</DialogTitle>
            <DialogDescription>
              Carica dispense, documenti o altri file per gli studenti
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
              <Label htmlFor="file">File *</Label>
              <Input
                id="file"
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.jpg,.jpeg,.png,.gif,.mp4,.mov,.mp3,.m4a,.txt"
                required
              />
              <p className="text-xs text-gray-500">
                Formati supportati: PDF, Word, Excel, PowerPoint, immagini, video, audio. Max 50MB.
              </p>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="title">Titolo *</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="es. Dispensa Modulo 1"
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="description">Descrizione</Label>
              <textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Breve descrizione del contenuto..."
                className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              />
            </div>
            {loading && uploadProgress > 0 && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Caricamento in corso...</span>
                  <span>{uploadProgress}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Annulla
            </Button>
            <Button type="submit" disabled={loading || !courseId || !file}>
              {loading ? 'Caricamento...' : 'Carica'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
