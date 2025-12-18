'use client'

import { useState } from 'react'
import { createStudent, toggleStudentStatus, deleteStudent } from '@/app/actions/students'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { 
    DropdownMenu, 
    DropdownMenuContent, 
    DropdownMenuItem, 
    DropdownMenuSeparator, 
    DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { Plus, Copy, MoreVertical, Ban, CheckCircle, Trash2, Search, BookOpen, UserPlus } from 'lucide-react'
import { StudentClassManager } from './student-class-manager'
import { format } from 'date-fns'
import { it } from 'date-fns/locale'

interface StudentProfile {
    id: string
    full_name: string
    email: string
    avatar_url: string | null
    created_at: string | null
    is_disabled: boolean | null
}

export function StudentManager({ students }: { students: StudentProfile[] }) {
    const [searchTerm, setSearchTerm] = useState('')
    const [openCreate, setOpenCreate] = useState(false)
    const [loading, setLoading] = useState(false)
    const [createdCreds, setCreatedCreds] = useState<{ email: string, password: string } | null>(null)
    
    // Class Manager State
    const [selectedStudent, setSelectedStudent] = useState<{id: string, name: string} | null>(null)

    // Filter students
    const filteredStudents = students.filter(s => 
        s.full_name.toLowerCase().includes(searchTerm.toLowerCase()) || 
        s.email.toLowerCase().includes(searchTerm.toLowerCase())
    )

    const handleCreateSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        setLoading(true)
        const formData = new FormData(e.currentTarget)
        
        const result = await createStudent(formData)
        setLoading(false)

        if (result.error) {
            toast.error(result.error)
        } else if (result.success && result.tempPassword) {
            setCreatedCreds({
                email: result.email!,
                password: result.tempPassword
            })
            toast.success('Studente creato con successo!')
        }
    }

    const copyToClipboard = () => {
        if (createdCreds) {
            navigator.clipboard.writeText(`Email: ${createdCreds.email}\nPassword: ${createdCreds.password}`)
            toast.success('Credenziali copiate!')
        }
    }

    const handleCloseCreate = () => {
        setOpenCreate(false)
        setCreatedCreds(null)
    }

    const onToggleStatus = async (id: string, currentStatus: boolean) => {
        toast.loading('Aggiornamento stato...')
        const result = await toggleStudentStatus(id, !currentStatus)
        toast.dismiss()
        if (result.error) {
            toast.error(result.error)
        } else {
            toast.success(`Studente ${!currentStatus ? 'disabilitato' : 'abilitato'}`)
        }
    }

    const onDelete = async (id: string) => {
        if (!confirm('Eliminare definitivamente questo studente?')) return
        toast.loading('Eliminazione...')
        const result = await deleteStudent(id)
        toast.dismiss()
        if (result.error) toast.error(result.error)
        else toast.success('Studente eliminato')
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="relative w-full sm:w-72">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input 
                        placeholder="Cerca studente..." 
                        className="pl-8" 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>

                <Dialog open={openCreate} onOpenChange={(val) => { if (!val) handleCloseCreate(); else setOpenCreate(val); }}>
                    <DialogTrigger asChild>
                        <Button><UserPlus className="mr-2 h-4 w-4" /> Nuovo Studente</Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Nuovo Studente</DialogTitle>
                            <DialogDescription>Genera credenziali temporanee per un nuovo studente.</DialogDescription>
                        </DialogHeader>

                        {createdCreds ? (
                             <div className="space-y-4">
                                <div className="p-4 bg-green-50 text-green-800 rounded-md border border-green-200">
                                    <p className="font-bold mb-2">Studente creato!</p>
                                    <p className="text-sm mb-4">Credenziali temporanee (copiale ora):</p>
                                    <div className="font-mono text-sm bg-white p-3 rounded border space-y-1">
                                        <p>Email: <span>{createdCreds.email}</span></p>
                                        <p>Password: <span className="font-bold">{createdCreds.password}</span></p>
                                    </div>
                                </div>
                                <Button onClick={copyToClipboard} variant="outline" className="w-full">
                                    <Copy className="mr-2 h-4 w-4" /> Copia
                                </Button>
                                <Button onClick={handleCloseCreate} className="w-full">Chiudi</Button>
                            </div>
                        ) : (
                            <form onSubmit={handleCreateSubmit} className="space-y-4">
                                <div className="grid gap-2">
                                    <Label>Nome</Label>
                                    <Input name="firstName" required placeholder="Nome" />
                                </div>
                                <div className="grid gap-2">
                                    <Label>Cognome</Label>
                                    <Input name="lastName" required placeholder="Cognome" />
                                </div>
                                <div className="grid gap-2">
                                    <Label>Email</Label>
                                    <Input name="email" type="email" required placeholder="email@esempio.it" />
                                </div>
                                <DialogFooter>
                                    <Button type="submit" disabled={loading}>
                                        {loading ? 'Creazione...' : 'Crea Studente'}
                                    </Button>
                                </DialogFooter>
                            </form>
                        )}
                    </DialogContent>
                </Dialog>
            </div>

            <div className="border rounded-md">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Nome</TableHead>
                            <TableHead>Email</TableHead>
                            <TableHead>Data Iscrizione</TableHead>
                            <TableHead className="text-right">Azioni</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredStudents.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={4} className="text-center h-24">
                                    Nessuno studente trovato.
                                </TableCell>
                            </TableRow>
                        ) : (
                            filteredStudents.map((student) => (
                                <TableRow key={student.id} className={student.is_disabled ? 'bg-slate-50 opacity-60' : ''}>
                                    <TableCell className="font-medium">
                                        <div className="flex items-center gap-2">
                                            {student.full_name}
                                            {student.is_disabled && <Badge variant="destructive" className="text-[10px] h-5">DISABILITATO</Badge>}
                                        </div>
                                    </TableCell>
                                    <TableCell>{student.email}</TableCell>
                                    <TableCell>
                                        {student.created_at ? format(new Date(student.created_at), 'dd MMM yyyy', { locale: it }) : '-'}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" className="h-8 w-8 p-0">
                                                    <MoreVertical className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuItem onClick={() => setSelectedStudent({ id: student.id, name: student.full_name })}>
                                                    <BookOpen className="mr-2 h-4 w-4" /> Gestisci Classi
                                                </DropdownMenuItem>
                                                <DropdownMenuSeparator />
                                                <DropdownMenuItem onClick={() => onToggleStatus(student.id, !!student.is_disabled)}>
                                                    {student.is_disabled ? (
                                                        <><CheckCircle className="mr-2 h-4 w-4" /> Abilita Accesso</>
                                                    ) : (
                                                        <><Ban className="mr-2 h-4 w-4" /> Blocca Accesso</>
                                                    )}
                                                </DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => onDelete(student.id)} className="text-red-600 focus:text-red-600">
                                                    <Trash2 className="mr-2 h-4 w-4" /> Elimina
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            <StudentClassManager 
                studentId={selectedStudent?.id || null} 
                studentName={selectedStudent?.name || ''} 
                open={!!selectedStudent} 
                onClose={() => setSelectedStudent(null)} 
            />
        </div>
    )
}
