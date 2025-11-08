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
