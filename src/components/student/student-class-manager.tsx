'use client'

import { useState, useEffect } from 'react'
import { 
    Dialog, 
    DialogContent, 
    DialogHeader, 
    DialogTitle, 
    DialogDescription 
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { 
    Select, 
    SelectContent, 
    SelectItem, 
    SelectTrigger, 
    SelectValue 
} from '@/components/ui/select'
import { toast } from 'sonner'
import { Trash2, Plus, BookOpen } from 'lucide-react'
import { getStudentClasses, assignStudentToClass, removeStudentFromClass } from '@/app/actions/students'
import { Badge } from '@/components/ui/badge'

interface StudentClassManagerProps {
    studentId: string | null
    studentName: string
    open: boolean
    onClose: () => void
}

export function StudentClassManager({ studentId, studentName, open, onClose }: StudentClassManagerProps) {
    const [enrolled, setEnrolled] = useState<any[]>([])
    const [allClasses, setAllClasses] = useState<any[]>([])
    const [loading, setLoading] = useState(false)
    const [selectedClassId, setSelectedClassId] = useState<string>('')

    useEffect(() => {
        if (open && studentId) {
            fetchClasses()
        }
    }, [open, studentId])

    const fetchClasses = async () => {
        if (!studentId) return
        setLoading(true)
        const res = await getStudentClasses(studentId)
        if (res.error) {
            toast.error(res.error)
        } else {
            setEnrolled(res.enrolled || [])
            setAllClasses(res.allClasses || [])
        }
        setLoading(false)
    }

    const handleAssign = async () => {
        if (!studentId || !selectedClassId) return
        
        toast.loading('Assegnazione in corso...')
        const res = await assignStudentToClass(studentId, selectedClassId)
        toast.dismiss()
        
        if (res.error) {
            toast.error(res.error)
        } else {
            toast.success('Classe assegnata')
            fetchClasses()
            setSelectedClassId('')
        }
    }

    const handleRemove = async (classId: string) => {
        if (!studentId) return
        if (!confirm('Rimuovere lo studente da questa classe?')) return

        toast.loading('Rimozione in corso...')
        const res = await removeStudentFromClass(studentId, classId)
        toast.dismiss()

        if (res.error) {
            toast.error(res.error)
        } else {
            toast.success('Studente rimosso dalla classe')
            fetchClasses()
        }
    }

    const availableClasses = allClasses.filter(c => !enrolled.find(e => e.id === c.id))

    return (
        <Dialog open={open} onOpenChange={(val) => !val && onClose()}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle>Classi di {studentName}</DialogTitle>
                    <DialogDescription>Gestisci le iscrizioni ai corsi per questo studente.</DialogDescription>
                </DialogHeader>

                <div className="space-y-6">
                    {/* Add Class Section */}
                    <div className="flex gap-2 items-end">
                        <div className="grid gap-2 flex-1">
                            <label className="text-sm font-medium">Assegna Nuova Classe</label>
                            <Select value={selectedClassId} onValueChange={setSelectedClassId}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Seleziona una classe..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {availableClasses.map((c) => (
                                        <SelectItem key={c.id} value={c.id}>
                                            {c.course?.name} - {c.edition_name}
                                        </SelectItem>
                                    ))}
                                    {availableClasses.length === 0 && (
                                        <SelectItem value="none" disabled>Nessuna classe disponibile</SelectItem>
                                    )}
                                </SelectContent>
                            </Select>
                        </div>
                        <Button onClick={handleAssign} disabled={!selectedClassId || loading}>
                            <Plus className="h-4 w-4" />
                        </Button>
                    </div>

                    <div className="space-y-2">
                        <h4 className="text-sm font-medium mb-2">Classi Attive</h4>
                        {loading && <div className="text-sm text-muted-foreground">Caricamento...</div>}
                        
                        {!loading && enrolled.length === 0 && (
                            <div className="p-4 border border-dashed rounded-md text-center text-sm text-muted-foreground">
                                Nessuna iscrizione attiva.
                            </div>
                        )}

                        <div className="space-y-2">
                            {enrolled.map((cls) => (
                                <div key={cls.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-md border">
                                    <div className="flex items-center gap-3">
                                        <div className="bg-primary/10 p-2 rounded-full">
                                            <BookOpen className="h-4 w-4 text-primary" />
                                        </div>
                                        <div>
                                            <p className="font-medium text-sm">{cls.course?.name}</p>
                                            <p className="text-xs text-muted-foreground">{cls.edition_name}</p>
                                        </div>
                                    </div>
                                    <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-700 hover:bg-red-50" onClick={() => handleRemove(cls.id)}>
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}
