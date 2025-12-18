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
    const [createdCreds, setCreatedCreds] = useState<{ email: string, password: string } | null>(null)

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

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold">Tutors del Corso</h2>
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
