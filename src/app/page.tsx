import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Button } from '@/components/ui/button'

export default async function Home() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (user) {
    redirect('/dashboard')
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      <nav className="container mx-auto px-4 py-6 flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Dog Trainer Hub</h1>
        <div className="space-x-4">
          <Link href="/login">
            <Button variant="ghost">Accedi</Button>
          </Link>
          <Link href="/signup">
            <Button>Registrati</Button>
          </Link>
        </div>
      </nav>

      <main className="container mx-auto px-4 py-20">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-5xl font-bold text-gray-900 mb-6">
            Piattaforma per Corsi di Educazione Cinofila
          </h2>
          <p className="text-xl text-gray-600 mb-10">
            Gestisci i tuoi corsi, accedi ai materiali didattici,
            consulta il calendario delle lezioni e molto altro.
          </p>
          <div className="flex justify-center gap-4">
            <Link href="/signup">
              <Button size="lg" className="text-lg px-8">
                Inizia Ora
              </Button>
            </Link>
            <Link href="/login">
              <Button size="lg" variant="outline" className="text-lg px-8">
                Accedi
              </Button>
            </Link>
          </div>
        </div>

        <div className="mt-24 grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          <div className="bg-white p-8 rounded-xl shadow-sm border">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold mb-2">Materiali Didattici</h3>
            <p className="text-gray-600">
              Accedi a dispense, documenti e risorse sempre disponibili online.
            </p>
          </div>

          <div className="bg-white p-8 rounded-xl shadow-sm border">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold mb-2">Calendario Lezioni</h3>
            <p className="text-gray-600">
              Visualizza le prossime lezioni con date, orari e cosa portare.
            </p>
          </div>

          <div className="bg-white p-8 rounded-xl shadow-sm border">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold mb-2">Quiz e Verifiche</h3>
            <p className="text-gray-600">
              Completa quiz e casi studio con feedback personalizzato dal tutor.
            </p>
          </div>
        </div>
      </main>

      <footer className="container mx-auto px-4 py-8 mt-20 border-t">
        <p className="text-center text-gray-500">
          &copy; {new Date().getFullYear()} Dog Trainer Hub. Tutti i diritti riservati.
        </p>
      </footer>
    </div>
  )
}
