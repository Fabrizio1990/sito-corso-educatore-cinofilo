'use client'

import { useState } from 'react'
import { changePassword } from '@/app/actions/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'
import { redirect } from 'next/navigation'

export function ChangePasswordForm({ required = false }: { required?: boolean }) {
    const [loading, setLoading] = useState(false)

    const handleSubmit = async (formData: FormData) => {
        setLoading(true)
        const result = await changePassword(formData)
        setLoading(false)

        if (result.error) {
            toast.error(result.error)
        } else {
            toast.success('Password aggiornata con successo!')
            if (required) {
                // Refresh to clear the required flag from session/ui
                window.location.reload()
            }
        }
    }

    return (
        <Card className={required ? "border-red-500 shadow-xl" : ""}>
            <CardHeader>
                <CardTitle className={required ? "text-red-600" : ""}>
                    {required ? 'Cambio Password Obbligatorio' : 'Cambia Password'}
                </CardTitle>
                <CardDescription>
                    {required 
                        ? 'Per sicurezza, devi cambiare la password temporanea prima di continuare.' 
                        : 'Inserisci la tua nuova password.'}
                </CardDescription>
            </CardHeader>
            <CardContent>
                <form action={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="password">Nuova Password</Label>
                        <Input 
                            id="password" 
                            name="password" 
                            type="password" 
                            required 
                            minLength={6}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="confirmPassword">Conferma Password</Label>
                        <Input 
                            id="confirmPassword" 
                            name="confirmPassword" 
                            type="password" 
                            required 
                            minLength={6}
                        />
                    </div>
                    <Button type="submit" disabled={loading} className="w-full">
                        {loading ? 'Aggiornamento...' : 'Aggiorna Password'}
                    </Button>
                </form>
            </CardContent>
        </Card>
    )
}
