import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ProfileForm } from '@/components/profile/profile-form'
import { DogsSection } from '@/components/profile/dogs-section'

export default async function ProfilePage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (!profile) redirect('/login')

  // Get user's dogs
  const { data: dogs } = await supabase
    .from('dogs')
    .select('*')
    .eq('profile_id', user.id)
    .order('created_at', { ascending: true })

  // Check profile completion
  const isProfileComplete = !!(
    profile.first_name &&
    profile.last_name &&
    profile.birth_date &&
    profile.city &&
    profile.phone
  )

  return (
    <div className="space-y-8 max-w-3xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold">Il mio profilo</h1>
        <p className="text-gray-600">Gestisci i tuoi dati personali e i tuoi cani</p>
      </div>

      {!isProfileComplete && (
        <Card className="bg-yellow-50 border-yellow-200">
          <CardContent className="py-4">
            <div className="flex items-start gap-3">
              <span className="text-2xl">⚠️</span>
              <div>
                <p className="font-medium text-yellow-900">Profilo incompleto</p>
                <p className="text-sm text-yellow-700">
                  Completa il tuo profilo per poterti iscrivere ai corsi.
                  Sono richiesti: nome, cognome, data di nascita, comune e telefono.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Profile Data */}
      <Card>
        <CardHeader>
          <CardTitle>Dati personali</CardTitle>
          <CardDescription>Le tue informazioni personali</CardDescription>
        </CardHeader>
        <CardContent>
          <ProfileForm profile={profile} />
        </CardContent>
      </Card>

      {/* Dogs Section */}
      <Card>
        <CardHeader>
          <CardTitle>I miei cani</CardTitle>
          <CardDescription>
            Gestisci i tuoi cani. Potrai selezionarli quando ti iscrivi a un corso.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <DogsSection dogs={dogs || []} />
        </CardContent>
      </Card>
    </div>
  )
}
