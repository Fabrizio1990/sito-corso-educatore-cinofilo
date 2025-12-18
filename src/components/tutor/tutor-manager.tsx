'use client'

import { useState } from 'react'
import { createTutor, toggleTutorStatus, deleteTutor } from '@/app/actions/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { Plus, Copy, MoreVertical, Ban, CheckCircle, Trash2, Search } from 'lucide-react'
import { format } from 'date-fns'
import { it } from 'date-fns/locale'

interface TutorProfile {
    id: string
    full_name: string
    email: string
    avatar_url: string | null
    created_at: string | null
    is_disabled: boolean | null
}

export function TutorManager({ tutors }: { tutors: TutorProfile[] }) {
    const [searchTerm, setSearchTerm] = useState('')
    const [open, setOpen] = useState(false)
    const [loading, setLoading] = useState(false)
    const [createdCreds, setCreatedCreds] = useState<{ email: string, password: string } | null>(null)

    // Filter tutors
    const filteredTutors = tutors.filter(t =>
        t.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.email.toLowerCase().includes(searchTerm.toLowerCase())
    )

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        setLoading(true)
        const formData = new FormData(e.currentTarget)
        
        try {
            const result = await createTutor(formData)
            if (result.error) {
                toast.error(result.error)
            } else if (result.success && result.tempPassword) {
                setCreatedCreds({
                    email: result.email!,
                    password: result.tempPassword
                })
                toast.success('Tutor creato con successo!')
            }
        } catch (err) {
            toast.error('Errore imprevisto')
        } finally {
            setLoading(false)
        }
    }

    const copyToClipboard = () => {
        if (createdCreds) {
            navigator.clipboard.writeText(`Email: ${createdCreds.email}\nPassword: ${createdCreds.password}`)
            toast.success('Credenziali copiate!')
        }
    }

    const handleClose = () => {
        setOpen(false)
        setCreatedCreds(null)
    }

    const onToggleStatus = async (id: string, currentStatus: boolean) => {
        toast.loading('Aggiornamento stato...')
        const result = await toggleTutorStatus(id, !currentStatus)
        toast.dismiss()
        if (result.error) {
            toast.error(result.error)
        } else {
            toast.success(`Tutor ${!currentStatus ? 'disabilitato' : 'abilitato'}`)
        }
    }

    const onDelete = async (id: string) => {
        if (!confirm('Sei sicuro di voler eliminare questo tutor? Questa azione è irreversibile.')) return

        toast.loading('Eliminazione in corso...')
        const result = await deleteTutor(id)
        toast.dismiss()
        if (result.error) {
            toast.error(result.error)
        } else {
            toast.success('Tutor eliminato')
        }
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="relative w-full sm:w-72">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Cerca tutor..."
                        className="pl-8"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>

                <Dialog open={open} onOpenChange={(val) => { if (!val) handleClose(); else setOpen(val); }}>
                    <DialogTrigger asChild>
                        <Button><Plus className="mr-2 h-4 w-4" /> Aggiungi Tutor</Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Aggiungi un nuovo Tutor</DialogTitle>
                            <DialogDescription>
                                Crea un account tutor. Verrà generata una password temporanea.
                            </DialogDescription>
                        </DialogHeader>

                        {createdCreds ? (
                            <div className="space-y-4">
                                <div className="p-4 bg-green-50 text-green-800 rounded-md border border-green-200">
                                    <p className="font-bold mb-2">Tutor creato con successo!</p>
                                    <p className="text-sm mb-4">Copia queste credenziali e inviale al tutor. Non saranno mostrate di nuovo.</p>
                                    <div className="font-mono text-sm bg-white p-3 rounded border space-y-1">
                                        <p>Email: <span>{createdCreds.email}</span></p>
                                        <p>Password: <span className="font-bold">{createdCreds.password}</span></p>
                                    </div>
                                </div>
                                <Button onClick={copyToClipboard} variant="outline" className="w-full">
                                    <Copy className="mr-2 h-4 w-4" /> Copia Credenziali
                                </Button>
                                <Button onClick={handleClose} className="w-full">Chiudi</Button>
                            </div>
                        ) : (
                                <form onSubmit={handleSubmit} className="space-y-4">
                                    <div className="grid gap-2">
                                        <Label htmlFor="firstName">Nome</Label>
                                        <Input id="firstName" name="firstName" required placeholder="Mario" />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="lastName">Cognome</Label>
                                        <Input id="lastName" name="lastName" required placeholder="Rossi" />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="email">Email</Label>
                                        <Input id="email" name="email" type="email" required placeholder="mario@esempio.it" />
                                    </div>
                                    <DialogFooter>
                                        <Button type="submit" disabled={loading}>
                                            {loading ? 'Creazione...' : 'Crea Tutor'}
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
                            <TableHead>Data Creazione</TableHead>
                            <TableHead className="text-right">Azioni</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredTutors.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={4} className="text-center h-24">
                                    Nessun tutor trovato.
                                </TableCell>
                            </TableRow>
                        ) : (
                            filteredTutors.map((tutor) => (
                                <TableRow key={tutor.id} className={tutor.is_disabled ? 'bg-slate-50 opacity-60' : ''}>
                                    <TableCell className="font-medium">
                                        <div className="flex items-center gap-2">
                                            {tutor.full_name}
                                            {tutor.is_disabled && <Badge variant="destructive" className="text-[10px] h-5">DISABILITATO</Badge>}
                                        </div>
                                    </TableCell>
                                    <TableCell>{tutor.email}</TableCell>
                                    <TableCell>
                                        {tutor.created_at ? format(new Date(tutor.created_at), 'dd MMM yyyy', { locale: it }) : '-'}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" className="h-8 w-8 p-0">
                                                    <span className="sr-only">Open menu</span>
                                                    <MoreVertical className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuItem onClick={() => onToggleStatus(tutor.id, !!tutor.is_disabled)}>
                                                    {tutor.is_disabled ? (
                                                        <><CheckCircle className="mr-2 h-4 w-4" /> Abilita Tutor</>
                                                    ) : (
                                                        <><Ban className="mr-2 h-4 w-4" /> Disabilita Tutor</>
                                                    )}
                                                </DropdownMenuItem>
                                                <DropdownMenuSeparator />
                                                <DropdownMenuItem onClick={() => onDelete(tutor.id)} className="text-red-600 focus:text-red-600">
                                                    <Trash2 className="mr-2 h-4 w-4" /> Elimina Tutor
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
        </div>
    )
}
