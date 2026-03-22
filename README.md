# Dog Trainer Hub

Piattaforma web per la gestione di corsi di educazione cinofila. Pensata per essere il punto di riferimento unico per docenti e studenti, sostituendo la comunicazione frammentata su WhatsApp, Google Classroom e calendari PDF.

## Funzionalita'

### Per gli Studenti
- **Dashboard** con prossima lezione, comunicazioni recenti e corsi iscritti
- **Lezioni** con calendario, filtro per classe e integrazione Google Calendar / .ics
- **Materiali** didattici organizzati per corso e categoria (PDF, documenti, link)
- **Esercizi** (Quiz + Casi di Studio in un'unica sezione con tab)
  - Quiz a domanda aperta con feedback manuale del tutor
  - Quiz a risposta multipla con punteggio immediato
  - Casi di studio con valutazione AI automatica (Gemini)
- **Bacheca** comunicazioni con priorita' e indicatore non letti
- **Progressi** con percentuali presenze, quiz completati e punteggi
- **Profilo** con gestione dati personali e cani
- **Notifiche** in-app con campanella e contatore

### Per i Tutor
- **Dashboard** con statistiche, azioni in sospeso e prossime lezioni
- **Gestione Corsi** con classi, edizioni e codici invito
- **Gestione Lezioni** con calendario, presenze e export .ics
- **Gestione Materiali** con upload, categorie e ordinamento drag & drop
- **Gestione Esercizi** (Quiz MC/aperti + Casi di Studio con AI)
- **Registro Presenze** per lezione (presente/assente/giustificato/ritardo)
- **Bacheca** con annunci globali o per classe, priorita' e pin
- **Badge** nella navigazione per quiz da valutare

### Per gli Admin
- Tutto cio' che ha il tutor, piu':
- **Gestione Tutor** (creazione account con password temporanea)

### Generale
- **PWA** installabile su home screen del telefono
- **Navigazione mobile** con bottom tab bar e drawer "Altro"
- **Multi-account** switch rapido tra utenti
- **Pagina Guida** contestuale per ruolo

## Tech Stack

- **Frontend**: Next.js 16 (App Router), React 19, TypeScript
- **Styling**: Tailwind CSS 4, Radix UI / shadcn components
- **Database**: Supabase (PostgreSQL) con RLS
- **AI**: Google Gemini API (valutazione casi di studio)
- **Email**: Resend API
- **Deploy**: Vercel (CI/CD automatico da GitHub)
- **Icone**: Lucide React

## Setup Locale

### Prerequisiti
- Node.js 18+
- Account Supabase
- Account Vercel (opzionale, per deploy)

### Installazione

```bash
git clone <repo-url>
cd "Corso educatore cinofilo"
npm install
```

### Variabili d'Ambiente

Crea `.env.local` con:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
GEMINI_API_KEY=your-gemini-api-key
RESEND_API_KEY=your-resend-api-key
```

### Avvio

```bash
npm run dev
```

Apri [http://localhost:3000](http://localhost:3000)

### Build

```bash
npm run build
```

## Struttura Progetto

```
src/
  app/
    (auth)/          # Login, signup, join
    (dashboard)/     # Area protetta
      dashboard/     # Pagine studente
      tutor/         # Pagine tutor
      guide/         # Guida utente
      profile/       # Profilo utente
    actions/         # Server actions
    api/             # API routes (calendar .ics, AI evaluation)
  components/
    ui/              # Componenti base shadcn
    student/         # Componenti studente
    tutor/           # Componenti tutor
  lib/               # Utility (supabase client, ics, utils)
  types/             # TypeScript types (database schema)
```

## Database

Il database e' gestito da Supabase con le seguenti tabelle principali:

- `profiles`, `roles` - Utenti e permessi
- `courses`, `classes`, `class_students` - Corsi e iscrizioni
- `lessons`, `attendance` - Lezioni e presenze
- `materials`, `material_categories` - Materiali didattici
- `quizzes`, `quiz_questions`, `quiz_submissions` - Quiz (aperti e MC)
- `case_studies`, `case_study_attempts` - Casi di studio
- `announcements`, `announcement_reads` - Comunicazioni
- `notifications` - Notifiche in-app
- `dogs`, `class_dogs` - Cani degli studenti

Tutte le tabelle hanno Row Level Security (RLS) attive.

## Deploy

Il deploy avviene automaticamente su Vercel ad ogni push su `main`.
