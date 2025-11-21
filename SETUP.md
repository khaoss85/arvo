# Setup Instructions

## ✅ Step 1: Environment Variables (COMPLETED)
Le variabili d'ambiente sono già configurate in `.env.local`

## 🔧 Step 2: Database Migration (REQUIRED)

Devi eseguire la migrazione del database manualmente:

### Opzione A: Dashboard Supabase (Raccomandato)

1. Vai a: https://supabase.com/dashboard/project/pttyfxgmmhuhzgwmwser/sql/new

2. Apri il file `supabase/migrations/20240101000000_initial_schema.sql`

3. Copia **tutto** il contenuto del file

4. Incollalo nel SQL Editor di Supabase

5. Clicca su "Run" per eseguire la migrazione

### Opzione B: Supabase CLI

Se preferisci usare il CLI:

```bash
# Installa Supabase CLI
npm install -g supabase

# Fai login
supabase login

# Linka il progetto
supabase link --project-ref pttyfxgmmhuhzgwmwser

# Esegui le migrazioni
supabase db push
```

## 🚀 Step 3: Avvia l'Applicazione

Dopo aver eseguito la migrazione:

```bash
npm run dev
```

Apri http://localhost:3000

## 🧪 Test

1. Vai su `/login`
2. Inserisci la tua email
3. Controlla l'email per il magic link
4. Clicca sul link per autenticarti
5. Verrai reindirizzato a `/dashboard`

## ⚠️ Note Importanti

- **Non committare** il file `.env.local` (già in .gitignore)
- Il **service role key** deve rimanere segreto
- La migration crea:
  - 6 tabelle (users, training_approaches, user_profiles, exercises, workouts, sets_log)
  - Row Level Security (RLS) policies
  - Indexes per performance
  - Triggers per auto-update timestamps

## 📊 Verifica Database

Dopo la migrazione, verifica nel dashboard Supabase:

- Table Editor: dovresti vedere tutte le tabelle create
- Authentication: configurato per magic link
- Policies: ogni tabella ha le sue RLS policies

## 🔄 Step 4: Inngest Setup (Background Jobs - OPZIONALE ma RACCOMANDATO)

L'app usa Inngest per generare i workout in modo asincrono, evitando timeout e permettendo all'utente di chiudere il browser durante la generazione.

### Setup Inngest (Free Tier)

1. **Crea account gratuito**: https://app.inngest.com/sign-up

2. **Ottieni le chiavi**:
   - Vai a: https://app.inngest.com/env/production/manage/keys
   - Copia l'**Event Key**
   - Copia il **Signing Key**

3. **Aggiungi le chiavi al `.env.local`**:
```bash
INNGEST_EVENT_KEY=your_event_key_here
INNGEST_SIGNING_KEY=signkey-prod-xxxxx
```

4. **In sviluppo locale**:
```bash
# Terminal 1: Avvia l'app
npm run dev

# Terminal 2: Avvia Inngest Dev Server
npx inngest-cli@latest dev
```

Il dev server si aprirà su http://localhost:8288 dove puoi vedere:
- Events in tempo reale
- Function executions
- Logs e debugging

### Come funziona

- Senza Inngest: Generazione sincrona, timeout dopo 10s su Vercel Hobby
- Con Inngest: Generazione asincrona in background, nessun timeout, progress bar in tempo reale

### Testing

1. Vai su `/dashboard`
2. Clicca "Generate Workout"
3. Vedrai un modal con progress bar che si aggiorna in tempo reale
4. Puoi chiudere il modal e tornare dopo - la generazione continua
5. Al completamento, verrai reindirizzato automaticamente al workout

### Deployment su Vercel

Quando fai deploy su Vercel:

1. Aggiungi le variabili in Vercel dashboard:
   ```
   INNGEST_EVENT_KEY=...
   INNGEST_SIGNING_KEY=...
   ```

2. In Inngest dashboard, configura webhook:
   - URL: `https://tuo-dominio.vercel.app/api/inngest`
   - Vercel farà il deploy e Inngest inizierà a inviare eventi

3. Verifica deployment:
   - Vai su Inngest dashboard → Functions
   - Dovresti vedere "generate-workout-async" registrato
