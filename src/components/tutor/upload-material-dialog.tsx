'use client'

import { useState, useRef, useEffect } from 'react'
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
import { Badge } from '@/components/ui/badge'

interface Category {
  id: string
  name: string
}

interface FileToUpload {
  file: File
  title: string
  id: string
}

interface UploadMaterialDialogProps {
  courses: { id: string; name: string }[]
  categories?: Category[]
  preselectedCourseId?: string
}

export function UploadMaterialDialog({ courses, categories: initialCategories, preselectedCourseId }: UploadMaterialDialogProps) {
  const [open, setOpen] = useState(false)
  const [materialType, setMaterialType] = useState<'file' | 'link'>('file')
  const [courseId, setCourseId] = useState(preselectedCourseId || '')
  const [categoryId, setCategoryId] = useState('')
  const [categories, setCategories] = useState<Category[]>(initialCategories || [])
  const [newCategoryName, setNewCategoryName] = useState('')
  const [showNewCategory, setShowNewCategory] = useState(false)

  // For link uploads
  const [linkUrl, setLinkUrl] = useState('')
  const [linkTitle, setLinkTitle] = useState('')
  const [linkDescription, setLinkDescription] = useState('')

  // For file uploads (multiple)
  const [filesToUpload, setFilesToUpload] = useState<FileToUpload[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [currentFile, setCurrentFile] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()
  const supabase = createClient()

  // Fetch categories when course changes
  useEffect(() => {
    if (courseId) {
      fetchCategories()
    } else {
      setCategories([])
      setCategoryId('')
    }
  }, [courseId])

  const fetchCategories = async () => {
    const { data } = await supabase
      .from('material_categories')
      .select('id, name')
      .eq('course_id', courseId)
      .order('sort_order')

    setCategories(data || [])
  }

  const handleCreateCategory = async () => {
    if (!newCategoryName.trim() || !courseId) return

    const { data, error } = await supabase
      .from('material_categories')
      .insert({
        course_id: courseId,
        name: newCategoryName.trim(),
        sort_order: categories.length,
      })
      .select()
      .single()

    if (error) {
      toast.error('Errore nella creazione della categoria')
      return
    }

    setCategories([...categories, data])
    setCategoryId(data.id)
    setNewCategoryName('')
    setShowNewCategory(false)
    toast.success('Categoria creata')
  }

  const handleFilesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || [])
    const validFiles: FileToUpload[] = []

    for (const file of selectedFiles) {
      if (file.size > 52428800) {
        toast.error(`${file.name} è troppo grande (max 50MB)`)
        continue
      }
      validFiles.push({
        file,
        title: file.name.replace(/\.[^/.]+$/, ''),
        id: Math.random().toString(36).substring(7),
      })
    }

    setFilesToUpload(prev => [...prev, ...validFiles])
    setError(null)

    // Reset input to allow selecting same files again
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const updateFileTitle = (id: string, title: string) => {
    setFilesToUpload(prev =>
      prev.map(f => f.id === id ? { ...f, title } : f)
    )
  }

  const removeFile = (id: string) => {
    setFilesToUpload(prev => prev.filter(f => f.id !== id))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (materialType === 'link') {
      await uploadLink()
    } else {
      await uploadFiles()
    }
  }

  const uploadLink = async () => {
    if (!linkUrl || !linkTitle) {
      setError('Inserisci URL e titolo')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const { error: dbError } = await supabase.from('materials').insert({
        course_id: courseId,
        category_id: categoryId || null,
        title: linkTitle,
        description: linkDescription || null,
        link_url: linkUrl,
        material_type: 'link',
        file_path: '', // Empty for links
        file_type: null,
      })

      if (dbError) throw dbError

      notifyNewMaterial(courseId, linkTitle)
      toast.success('Link aggiunto con successo')
      resetForm()
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Errore durante il salvataggio')
      toast.error('Errore durante il salvataggio')
    } finally {
      setLoading(false)
    }
  }

  const uploadFiles = async () => {
    if (filesToUpload.length === 0) {
      setError('Seleziona almeno un file da caricare')
      return
    }

    setLoading(true)
    setError(null)
    setUploadProgress(0)

    const totalFiles = filesToUpload.length
    let uploadedCount = 0

    try {
      for (const fileItem of filesToUpload) {
        setCurrentFile(fileItem.title)

        const fileExt = fileItem.file.name.split('.').pop()
        const fileName = `${courseId}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`

        // Upload file
        const { error: uploadError } = await supabase.storage
          .from('course-materials')
          .upload(fileName, fileItem.file, {
            cacheControl: '3600',
            upsert: false,
          })

        if (uploadError) throw uploadError

        // Get signed URL
        const { data: signedUrlData } = await supabase.storage
          .from('course-materials')
          .createSignedUrl(fileName, 31536000)

        const { data: { publicUrl } } = supabase.storage
          .from('course-materials')
          .getPublicUrl(fileName)

        const fileUrl = signedUrlData?.signedUrl || publicUrl

        // Insert material record
        const { error: dbError } = await supabase.from('materials').insert({
          course_id: courseId,
          category_id: categoryId || null,
          title: fileItem.title,
          file_path: fileUrl,
          file_type: fileItem.file.type,
          material_type: 'file',
        })

        if (dbError) {
          await supabase.storage.from('course-materials').remove([fileName])
          throw dbError
        }

        uploadedCount++
        setUploadProgress(Math.round((uploadedCount / totalFiles) * 100))
      }

      notifyNewMaterial(courseId, `${totalFiles} nuovi materiali`)
      toast.success(`${totalFiles} file caricati con successo`)
      resetForm()
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Errore durante il caricamento')
      toast.error('Errore durante il caricamento')
    } finally {
      setLoading(false)
      setCurrentFile('')
    }
  }

  const resetForm = () => {
    setOpen(false)
    setCourseId(preselectedCourseId || '')
    setCategoryId('')
    setMaterialType('file')
    setLinkUrl('')
    setLinkTitle('')
    setLinkDescription('')
    setFilesToUpload([])
    setUploadProgress(0)
    setShowNewCategory(false)
    setNewCategoryName('')
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const getFileIcon = (file: File) => {
    const type = file.type
    if (type.includes('pdf')) return '📕'
    if (type.includes('word') || type.includes('doc')) return '📘'
    if (type.includes('excel') || type.includes('sheet')) return '📗'
    if (type.includes('video')) return '🎬'
    if (type.includes('audio')) return '🎵'
    if (type.includes('image')) return '🖼️'
    return '📄'
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>Carica Materiale</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Carica materiali</DialogTitle>
            <DialogDescription>
              Carica file multipli o aggiungi link esterni per gli studenti
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            {error && (
              <div className="p-3 text-sm text-red-500 bg-red-50 rounded-md">
                {error}
              </div>
            )}

            {/* Material Type Selection */}
            <div className="flex gap-2">
              <Button
                type="button"
                variant={materialType === 'file' ? 'default' : 'outline'}
                onClick={() => setMaterialType('file')}
                className="flex-1"
              >
                File
              </Button>
              <Button
                type="button"
                variant={materialType === 'link' ? 'default' : 'outline'}
                onClick={() => setMaterialType('link')}
                className="flex-1"
              >
                Link
              </Button>
            </div>

            {/* Course Selection */}
            {!preselectedCourseId && (
              <div className="grid gap-2">
                <Label>Corso *</Label>
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
            )}

            {/* Category Selection */}
            {courseId && (
              <div className="grid gap-2">
                <Label>Categoria/Argomento</Label>
                {!showNewCategory ? (
                  <div className="flex gap-2">
                    <Select
                      value={categoryId || 'none'}
                      onValueChange={(val) => setCategoryId(val === 'none' ? '' : val)}
                    >
                      <SelectTrigger className="flex-1">
                        <SelectValue placeholder="Nessuna categoria" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Nessuna categoria</SelectItem>
                        {categories.map((cat) => (
                          <SelectItem key={cat.id} value={cat.id}>
                            {cat.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setShowNewCategory(true)}
                    >
                      + Nuova
                    </Button>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <Input
                      value={newCategoryName}
                      onChange={(e) => setNewCategoryName(e.target.value)}
                      placeholder="es. Modulo 1 - Comunicazione"
                      className="flex-1"
                    />
                    <Button type="button" onClick={handleCreateCategory}>
                      Crea
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setShowNewCategory(false)
                        setNewCategoryName('')
                      }}
                    >
                      Annulla
                    </Button>
                  </div>
                )}
              </div>
            )}

            {/* Link Form */}
            {materialType === 'link' && (
              <>
                <div className="grid gap-2">
                  <Label>URL *</Label>
                  <Input
                    type="url"
                    value={linkUrl}
                    onChange={(e) => setLinkUrl(e.target.value)}
                    placeholder="https://..."
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label>Titolo *</Label>
                  <Input
                    value={linkTitle}
                    onChange={(e) => setLinkTitle(e.target.value)}
                    placeholder="es. Video YouTube - Comunicazione canina"
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label>Descrizione</Label>
                  <textarea
                    value={linkDescription}
                    onChange={(e) => setLinkDescription(e.target.value)}
                    placeholder="Breve descrizione..."
                    className="flex min-h-[60px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  />
                </div>
              </>
            )}

            {/* Files Form */}
            {materialType === 'file' && (
              <>
                <div className="grid gap-2">
                  <Label>File (puoi selezionarne multipli)</Label>
                  <Input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFilesChange}
                    accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.jpg,.jpeg,.png,.gif,.mp4,.mov,.mp3,.m4a,.txt"
                    multiple
                  />
                  <p className="text-xs text-gray-500">
                    PDF, Word, Excel, PowerPoint, immagini, video, audio. Max 50MB per file.
                  </p>
                </div>

                {/* Files List */}
                {filesToUpload.length > 0 && (
                  <div className="space-y-2 max-h-[200px] overflow-y-auto border rounded-lg p-3">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium">{filesToUpload.length} file selezionati</span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setFilesToUpload([])}
                        className="text-red-600 h-auto py-1"
                      >
                        Rimuovi tutti
                      </Button>
                    </div>
                    {filesToUpload.map((fileItem) => (
                      <div key={fileItem.id} className="flex items-center gap-2 p-2 bg-gray-50 rounded">
                        <span className="text-lg">{getFileIcon(fileItem.file)}</span>
                        <Input
                          value={fileItem.title}
                          onChange={(e) => updateFileTitle(fileItem.id, e.target.value)}
                          className="flex-1 h-8 text-sm"
                          placeholder="Titolo"
                        />
                        <Badge variant="secondary" className="text-xs">
                          {fileItem.file.type.split('/').pop()?.toUpperCase()}
                        </Badge>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeFile(fileItem.id)}
                          className="h-8 w-8 p-0 text-red-600"
                        >
                          ×
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}

            {/* Upload Progress */}
            {loading && uploadProgress > 0 && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>{currentFile ? `Caricamento: ${currentFile}` : 'Caricamento...'}</span>
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
            <Button type="button" variant="outline" onClick={resetForm}>
              Annulla
            </Button>
            <Button
              type="submit"
              disabled={loading || !courseId || (materialType === 'file' ? filesToUpload.length === 0 : !linkUrl || !linkTitle)}
            >
              {loading ? 'Caricamento...' : materialType === 'file' ? `Carica ${filesToUpload.length} file` : 'Aggiungi link'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
