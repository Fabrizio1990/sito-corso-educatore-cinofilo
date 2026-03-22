import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Card, CardContent } from '@/components/ui/card'
import {
  BookOpen,
  Calendar,
  FileQuestion,
  Megaphone,
  BarChart3,
  Users,
  GraduationCap,
  ClipboardList,
  UserCog,
  Bell,
  Dog,
  User,
  LayoutDashboard,
  type LucideIcon,
} from 'lucide-react'

type GuideSection = {
  icon: LucideIcon
  title: string
  description: string
  tips?: string
}

const studentSections: GuideSection[] = [
  {
    icon: LayoutDashboard,
    title: 'Dashboard',
    description:
      'La tua pagina principale mostra le ultime comunicazioni, la prossima lezione, e i corsi a cui sei iscritto.',
  },
  {
    icon: Calendar,
    title: 'Lezioni',
    description:
      'Visualizza tutte le lezioni in programma. Usa il filtro per classe se sei iscritto a più corsi. Puoi aggiungere le lezioni al tuo Google Calendar o scaricare il file .ics.',
    tips: 'Puoi filtrare per classe se sei iscritto a più corsi',
  },
  {
    icon: BookOpen,
    title: 'Materiali',
    description:
      'Accedi a dispense, documenti e link organizzati per corso e categoria. Scarica i file o apri i link esterni.',
  },
  {
    icon: FileQuestion,
    title: 'Quiz',
    description:
      'Completa i quiz assegnati dai tutor. I quiz possono essere a domanda aperta (con feedback del tutor) o a risposta multipla (con punteggio immediato).',
    tips: 'I quiz a risposta multipla mostrano il punteggio subito!',
  },
  {
    icon: ClipboardList,
    title: 'Casi di Studio',
    description:
      "Analizza scenari reali e ricevi feedback automatico dall'AI. Puoi riprovare finché non raggiungi la risposta corretta.",
  },
  {
    icon: Megaphone,
    title: 'Bacheca',
    description:
      'Leggi le comunicazioni importanti dai tutor. Gli annunci urgenti sono evidenziati in rosso, quelli importanti in giallo.',
  },
  {
    icon: BarChart3,
    title: 'Progressi',
    description:
      'Monitora i tuoi progressi: percentuale presenze, quiz completati, casi studio risolti, e punteggi medi.',
  },
  {
    icon: User,
    title: 'Profilo e Cani',
    description:
      'Completa il tuo profilo con i dati personali e registra i tuoi cani per i corsi. Seleziona quale cane parteciperà a ogni corso.',
  },
  {
    icon: Bell,
    title: 'Notifiche',
    description:
      'La campanella in alto ti avvisa di nuove comunicazioni, materiali e feedback. Il numero rosso indica le notifiche non lette.',
  },
]

const tutorSections: GuideSection[] = [
  {
    icon: LayoutDashboard,
    title: 'Dashboard',
    description:
      'La tua pagina principale mostra statistiche rapide, azioni in sospeso (quiz da valutare, presenze da registrare), e le prossime lezioni.',
  },
  {
    icon: GraduationCap,
    title: 'Corsi',
    description:
      'Crea e gestisci i corsi. Ogni corso può avere più classi (edizioni), materiali, quiz e casi di studio.',
  },
  {
    icon: Users,
    title: 'Classi',
    description:
      'Crea edizioni del corso e condividi il codice invito con gli studenti. Gestisci iscrizioni, lezioni e presenze.',
  },
  {
    icon: Calendar,
    title: 'Lezioni',
    description:
      'Pianifica le lezioni con data, orario, luogo e materiale da portare. Esporta il calendario della classe in formato .ics.',
  },
  {
    icon: BookOpen,
    title: 'Materiali',
    description:
      'Carica dispense, documenti e link. Organizzali in categorie e riordinale con il drag & drop.',
  },
  {
    icon: FileQuestion,
    title: 'Quiz',
    description:
      'Crea quiz a domanda aperta o a risposta multipla. Per i quiz aperti, dai feedback manualmente. Per i quiz MC, i risultati sono automatici.',
  },
  {
    icon: ClipboardList,
    title: 'Casi di Studio',
    description:
      "Crea scenari con risposta modello. L'AI valuta automaticamente le risposte degli studenti.",
  },
  {
    icon: BarChart3,
    title: 'Presenze',
    description:
      'Registra le presenze per ogni lezione: presente, assente, giustificato, ritardo. Il badge nella lista lezioni ti indica quelle ancora da registrare.',
    tips: "Usa il pulsante 'Segna tutti presenti' per velocizzare",
  },
  {
    icon: Megaphone,
    title: 'Bacheca',
    description:
      'Pubblica comunicazioni per tutti o per classi specifiche. Scegli la priorità (normale, importante, urgente) e fissa in alto gli annunci importanti.',
    tips: 'Gli studenti vedono un indicatore blu per i messaggi non letti',
  },
  {
    icon: UserCog,
    title: 'Gestione Studenti',
    description:
      'Visualizza e gestisci gli studenti iscritti ai tuoi corsi.',
  },
]

const adminExtraSections: GuideSection[] = [
  {
    icon: UserCog,
    title: 'Gestione Tutor',
    description:
      'Crea account per nuovi tutor con password temporanea. Al primo accesso dovranno cambiarla.',
  },
]

export default async function GuidePage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('*, roles(permissions)')
    .eq('id', user.id)
    .single()

  if (!profile) {
    redirect('/login')
  }

  const isStudent = profile.role === 'student'
  const isAdmin = profile.role === 'admin'

  let sections: GuideSection[]

  if (isStudent) {
    sections = studentSections
  } else if (isAdmin) {
    sections = [...tutorSections, ...adminExtraSections]
  } else {
    sections = tutorSections
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold">Guida all&apos;uso</h1>
        <p className="text-muted-foreground mt-1">
          {isStudent
            ? 'Tutto quello che devi sapere per usare la piattaforma'
            : 'Come gestire i tuoi corsi e studenti sulla piattaforma'}
        </p>
      </div>

      <div className="space-y-4">
        {sections.map((section) => (
          <Card key={section.title}>
            <CardContent className="py-4">
              <div className="flex gap-4">
                <div className="h-10 w-10 rounded-lg bg-blue-50 flex items-center justify-center shrink-0">
                  <section.icon className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold">{section.title}</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    {section.description}
                  </p>
                  {section.tips && (
                    <div className="mt-2 p-2 bg-muted rounded text-xs text-muted-foreground">
                      💡 {section.tips}
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
