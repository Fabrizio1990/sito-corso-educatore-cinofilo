import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center px-4">
        <h1 className="text-9xl font-bold text-gray-200">404</h1>
        <h2 className="text-2xl font-semibold text-gray-800 mt-4">
          Pagina non trovata
        </h2>
        <p className="text-gray-600 mt-2 max-w-md mx-auto">
          La pagina che stai cercando non esiste o e stata spostata.
        </p>
        <div className="mt-8 flex gap-4 justify-center">
          <Link href="/dashboard">
            <Button>Torna alla Dashboard</Button>
          </Link>
          <Link href="/">
            <Button variant="outline">Home</Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
