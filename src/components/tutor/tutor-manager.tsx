'use client'

import { useState } from 'react'
import { createTutor } from '@/app/actions/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { toast } from 'sonner'
import { Plus, Copy } from 'lucide-react'

interface TutorProfile {
    id: string
    full_name: string
    email: string
    avatar_url: string | null
    created_at: string | null
}

export function TutorManager({ tutors }: { tutors: TutorProfile[] }) {
    const [open, setOpen] = useState(false)
    const [loading, setLoading] = useState(false)

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        setLoading(true)
        const formData = new FormData(e.currentTarget)
        
        try {
            const result = await createTutor(formData)
            if (result.error) {
                toast.error(result.error)
            } else if (result.success) {
                toast.success(`Invito inviato con successo a ${result.email}`)
                setOpen(false)
            }
        } catch (err) {
            toast.error('Errore imprevisto')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold">Tutors del Corso</h2>
                <Dialog open={open} onOpenChange={setOpen}>
                    <DialogTrigger asChild>
                        <Button><Plus className="mr-2 h-4 w-4" /> Aggiungi Tutor</Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Aggiungi un nuovo Tutor</DialogTitle>
                            <DialogDescription>
                                Invia un invito via email al nuovo tutor.
                            </DialogDescription>
                        </DialogHeader>

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
                                    {loading ? 'Invio in corso...' : 'Invia Invito'}
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {tutors.map((tutor) => (
                    <Card key={tutor.id}>
                        <CardHeader className="flex flex-row items-center gap-4">
                            <div className="h-10 w-10 rounded-full bg-slate-200 flex items-center justify-center text-slate-500 font-bold overflow-hidden">
                                {tutor.avatar_url ? (
                                    <img src={tutor.avatar_url} alt={tutor.full_name} className="h-full w-full object-cover" />
                                ) : (
                                    tutor.full_name.substring(0, 2).toUpperCase()
                                )}
                            </div>
                            <div>
                                <CardTitle className="text-base">{tutor.full_name}</CardTitle>
                                <CardDescription className="text-xs">{tutor.email}</CardDescription>
                            </div>
                        </CardHeader>
                    </Card>
                ))}
            </div>
        </div>
    )
}
