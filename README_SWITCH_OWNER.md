# Guida al Trasferimento di Proprieta' - Dog Trainer Hub

Checklist completa per trasferire il progetto al nuovo proprietario (l'azienda del corso).

---

## 1. Repository GitHub

- [ ] Trasferire il repository GitHub al nuovo proprietario
  - Settings > Danger Zone > Transfer ownership
  - Oppure: creare un fork nell'organizzazione del cliente e archiviare l'originale
- [ ] Aggiornare i permessi dei collaboratori
- [ ] Rimuovere eventuali secrets/tokens personali dalle GitHub Actions (se presenti)

## 2. Vercel

- [ ] **Opzione A - Trasferimento progetto**:
  - Il nuovo proprietario crea un account Vercel
  - Tu trasferisci il progetto: Project Settings > General > Transfer Project
  - Il nuovo proprietario collega il proprio repo GitHub
- [ ] **Opzione B - Nuovo progetto**:
  - Il nuovo proprietario crea un nuovo progetto Vercel dal proprio repo
  - Configura le variabili d'ambiente (vedi sezione 5)
  - Il deploy automatico si attiva collegando il repo GitHub
- [ ] Configurare il dominio personalizzato (vedi sezione 3)
- [ ] Rimuovere il progetto dal tuo account Vercel dopo il trasferimento

## 3. Dominio

- [ ] Il cliente acquista un dominio (es. `dogtrainerhub.it`, `nomeazienda.it`)
- [ ] Su Vercel: Project Settings > Domains > aggiungere il dominio
- [ ] Configurare i DNS del dominio:
  - Record `A` che punta a `76.76.21.21` (Vercel)
  - Record `CNAME` per `www` che punta a `cname.vercel-dns.com`
- [ ] Vercel genera automaticamente il certificato SSL
- [ ] Aggiornare l'URL nel Supabase Auth (vedi sezione 4)

## 4. Supabase

### Trasferimento progetto
- [ ] **Opzione A - Trasferire l'organizzazione**:
  - Il nuovo proprietario crea un account Supabase
  - Tu lo inviti come Owner nell'organizzazione Supabase
  - Trasferisci la proprieta' dell'organizzazione
  - Rimuovi il tuo account dall'organizzazione
- [ ] **Opzione B - Nuovo progetto** (piu' complesso):
  - Esportare lo schema e i dati con `pg_dump`
  - Creare nuovo progetto Supabase
  - Importare schema e dati
  - Aggiornare tutte le chiavi API

### Configurazione Auth (IMPORTANTE)
- [ ] Dashboard Supabase > Authentication > URL Configuration:
  - **Site URL**: cambiare da URL attuale al nuovo dominio (es. `https://dogtrainerhub.it`)
  - **Redirect URLs**: aggiungere il nuovo dominio (es. `https://dogtrainerhub.it/**`)
  - Rimuovere i vecchi URL
- [ ] Se si usa email confirmation: aggiornare i template email con il nuovo dominio

### Chiavi API
- [ ] Dopo il trasferimento, le chiavi Supabase restano le stesse
- [ ] Se si crea un nuovo progetto, aggiornare TUTTE le chiavi:
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - `SUPABASE_SERVICE_ROLE_KEY`

## 5. Variabili d'Ambiente (Vercel)

Tutte queste variabili devono essere configurate su Vercel (Project Settings > Environment Variables):

| Variabile | Dove trovarla | Note |
|-----------|--------------|------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase Dashboard > Settings > API | URL del progetto |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase Dashboard > Settings > API | Chiave pubblica |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase Dashboard > Settings > API | Chiave segreta, NON esporre mai |
| `GEMINI_API_KEY` | Google AI Studio | Vedi sezione 6 |
| `RESEND_API_KEY` | Resend Dashboard | Vedi sezione 7 |

## 6. Google Gemini API (AI per Casi di Studio)

- [ ] Il nuovo proprietario crea un account su [Google AI Studio](https://aistudio.google.com/)
- [ ] Genera una nuova API key
- [ ] Aggiorna `GEMINI_API_KEY` su Vercel
- [ ] L'API ha un piano gratuito generoso, ma monitorare l'utilizzo
- [ ] Se necessario, attivare la fatturazione su Google Cloud

## 7. Resend (Email)

- [ ] Il nuovo proprietario crea un account su [Resend](https://resend.com/)
- [ ] Configura il dominio email (per inviare da `noreply@dominio.it`)
- [ ] Genera una nuova API key
- [ ] Aggiorna `RESEND_API_KEY` su Vercel
- [ ] Piano gratuito: 100 email/giorno, 3000/mese

## 8. File da Aggiornare nel Codice

- [ ] `public/manifest.json` - Aggiornare `name` e `short_name` se cambia il brand
- [ ] `src/app/layout.tsx` - Aggiornare il `title` e `description` nei metadata
- [ ] `src/app/page.tsx` - Aggiornare testi della landing page con nome azienda
- [ ] `public/icons/` - Sostituire le icone SVG con il logo dell'azienda
- [ ] `.env.local` - Aggiornare con le nuove chiavi (vedi sezione 5)

## 9. Account Utenti

- [ ] Creare l'account admin principale per il proprietario dell'azienda
  - Registrarsi normalmente, poi cambiare il ruolo a `admin` da Supabase Dashboard:
    ```sql
    UPDATE profiles SET role = 'admin' WHERE email = 'email@azienda.it';
    ```
- [ ] L'admin puo' poi creare account tutor dalla piattaforma
- [ ] Gli studenti si registrano autonomamente e si iscrivono con codice invito

## 10. Manutenzione Post-Trasferimento

- [ ] Monitorare i log su Vercel (Project > Logs)
- [ ] Monitorare l'uso del database su Supabase Dashboard
- [ ] Supabase piano gratuito: 500MB database, 1GB storage, 50K auth users
- [ ] Vercel piano gratuito: 100GB bandwidth/mese
- [ ] Se il traffico cresce, valutare upgrade ai piani pro

## 11. Checklist Rapida Post-Trasferimento

Prima di considerare il trasferimento completo, verificare:

- [ ] Il sito e' raggiungibile al nuovo dominio
- [ ] Login/Signup funzionano
- [ ] Le email arrivano (reset password, notifiche)
- [ ] I casi di studio con AI funzionano (Gemini)
- [ ] Il deploy automatico funziona (push su main)
- [ ] L'admin riesce a creare tutor
- [ ] I tutor riescono a creare corsi, classi, quiz
- [ ] Gli studenti riescono a iscriversi con codice invito
- [ ] La PWA si installa correttamente su mobile

---

## Contatti per Supporto

In caso di problemi tecnici post-trasferimento, contattare:
- [Il tuo nome/email qui]
