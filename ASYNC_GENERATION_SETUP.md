# Async Workout Generation - Setup & Testing Guide

## 📋 Overview

Il sistema di generazione asincrona permette di:
- ✅ Evitare timeout del browser (fino a 10s su Vercel Hobby)
- ✅ Generare workout in background (70-110 secondi)
- ✅ Progress bar in tempo reale con polling ogni 2 secondi
- ✅ Permettere all'utente di chiudere il browser e tornare dopo
- ✅ Auto-redirect al workout quando completato

## 🏗️ Architettura

### Flusso Completo

```
User clicks "Generate Workout" or "Pre-Generate"
       ↓
POST /api/workouts/generate/stream (with SSE support)
       ↓
1. Create queue entry (status: pending)
2. Check if INNGEST_EVENT_KEY is configured
3. If yes: Trigger Inngest event, close SSE stream
4. If no: Run synchronously (legacy mode)
       ↓
[Client ProgressFeedback] SSE stream closes early
       ↓
[Client] Automatically switch to polling mode
       ↓
[Client] Poll /api/workouts/generation-status/{requestId} every 2s
       ↓
[Inngest Worker] Process in background:
   → Update status to 'in_progress'
   → Call WorkoutGeneratorService.generateWorkout()
   → Update progress at: 5%, 15%, 30%, 45%, 60%, 70%, 85%, 95%, 100%
   → Mark as 'completed' with workoutId
       ↓
[Client] Detect completion (status: completed)
       ↓
Auto-redirect to /workout/{workoutId} (or reload dashboard)
```

### Stack Tecnologico

- **Backend**: Next.js API Routes + Inngest (background jobs)
- **Database**: Supabase (workout_generation_queue table)
- **Frontend**: React + Polling (ogni 2s)
- **Queue Service**: GenerationQueueService
- **Worker**: Inngest Function (retry automatico 3x)

## 🛠️ Setup Locale

### 1. Installa Inngest CLI

```bash
npm install -g inngest-cli
# oppure
npx inngest-cli@latest
```

### 2. Configura Environment Variables

Nel tuo `.env.local`:

```bash
# Inngest Configuration
INNGEST_EVENT_KEY=your_event_key_here
INNGEST_SIGNING_KEY=signkey-prod-xxxxx
```

**Come ottenere le chiavi**:
1. Vai su https://app.inngest.com/sign-up (free tier)
2. Dashboard → Keys → Copia Event Key e Signing Key

### 3. Avvia Development Environment

```bash
# Terminal 1: Next.js app
npm run dev

# Terminal 2: Inngest Dev Server
npx inngest-cli@latest dev
```

L'Inngest Dev Server si aprirà su http://localhost:8288

## 🧪 Testing Checklist

### Test 1: Basic Flow ✅

**Obiettivo**: Verificare che la generazione asincrona funzioni end-to-end

1. Vai su http://localhost:3000/dashboard
2. Clicca "Generate Workout"
3. **Aspettative**:
   - ✅ Modal si apre immediatamente
   - ✅ Progress bar parte da 0%
   - ✅ Messaggio iniziale: "Starting generation..."
   - ✅ Progress aumenta: 5% → 15% → 30% → 45% → 60% → 70% → 85% → 95% → 100%
   - ✅ Redirect automatico a `/workout/{id}` dopo 1.5s (o reload dashboard)

**Verifica Logs**:
```bash
# Terminal Next.js
[WorkoutGenerate] Created queue entry: ...
[WorkoutGenerate] Triggering Inngest worker for: ...
PUT /api/inngest 200 in 103ms (function registration)

# Terminal Inngest (http://localhost:8288)
[generate-workout-async] Event received: workout/generate.requested
[generate-workout-async] Status: in_progress
[generate-workout-async] Progress: 5%, 15%, 30%, 45%, 60%, 70%, 85%, 95%, 100%
[generate-workout-async] Completed successfully
```

### Test 2: Disconnect & Reconnect ✅

**Obiettivo**: Verificare che la generazione continui se l'utente chiude il browser

1. Inizia generazione
2. Quando progress è al 20%, clicca "Close and check later"
3. **Aspettative**:
   - ✅ Modal si chiude
   - ✅ Generazione continua in background (verifica Inngest logs)
4. Vai su `/api/workouts/pending-generations`
5. **Aspettative**:
   - ✅ Vedi entry con `status: "in_progress"`
   - ✅ `progress_percent` continua ad aumentare
6. Torna su `/dashboard` dopo 2 minuti
7. **Aspettative**:
   - ✅ Dashboard mostra il workout completato

### Test 3: Error Handling ✅

**Obiettivo**: Verificare gestione errori (es. OpenAI timeout)

1. **Simula errore**: Imposta OPENAI_API_KEY invalida temporaneamente
2. Inizia generazione
3. **Aspettative**:
   - ✅ Status diventa `failed`
   - ✅ Modal mostra icona rossa con messaggio errore
   - ✅ Button "Try Again" visibile
4. Clicca "Try Again"
5. **Aspettative**:
   - ✅ Redirect a `/dashboard`

**Verifica Inngest Retry**:
- Inngest tenterà automaticamente 3 volte prima di fallire
- Verifica nel dashboard Inngest: Functions → Runs → Vedi i retry

### Test 4: Concurrent Generations ✅

**Obiettivo**: Verificare che l'utente possa generare solo 1 workout alla volta

1. Inizia generazione
2. Mentre il primo è in corso, prova a cliccare di nuovo "Generate Workout"
3. **Aspettative**:
   - ✅ Bottone disabilitato oppure
   - ✅ Messaggio: "Generation already in progress"

### Test 5: Multi-Device ✅

**Obiettivo**: Verificare che lo stesso utente su più dispositivi veda lo stato sincronizzato

1. Device A: Inizia generazione
2. Device B: Vai su `/dashboard`
3. **Aspettative**:
   - ✅ Device B mostra banner "Generation in progress"
   - ✅ Cliccando il banner, modal si apre con progress aggiornato
4. Device A: Chiudi browser
5. Device B: Progress continua ad aggiornarsi
6. **Aspettative**:
   - ✅ Quando completato, entrambi i device possono vedere il workout

### Test 6: Polling Performance ✅

**Obiettivo**: Verificare che il polling non sovraccarichi il server

1. Apri Network tab nel browser
2. Inizia generazione
3. **Aspettative**:
   - ✅ Request a `/api/workouts/generation-status/{requestId}` ogni ~2s
   - ✅ Response time < 100ms
   - ✅ No memory leaks (verifica con React DevTools Profiler)
4. Dopo completamento:
   - ✅ Polling si ferma (interval cleared)

## 🚀 Deployment su Vercel

### Step 1: Environment Variables

Nel dashboard Vercel, aggiungi:

```
INNGEST_EVENT_KEY=...
INNGEST_SIGNING_KEY=signkey-prod-...
```

### Step 2: Deploy

```bash
git add .
git commit -m "feat: async workout generation with Inngest"
git push
```

Vercel farà il deploy automatico.

### Step 3: Configure Inngest Webhook

1. Vai su Inngest Dashboard → Apps
2. Clicca sul tuo app
3. Settings → Webhooks → Add Webhook
4. URL: `https://tuo-dominio.vercel.app/api/inngest`
5. Salva

### Step 4: Verifica Deployment

1. Vai su Inngest Dashboard → Functions
2. **Aspettative**:
   - ✅ Vedi funzione "generate-workout-async" registrata
   - ✅ Status: "Active"
3. Testa generando un workout su production
4. Verifica logs:
   - Vercel: Functions → generate-workout-async
   - Inngest: Functions → Runs

## 🐛 Troubleshooting

### Problema: Inngest Dev Server non riceve eventi

**Causa**: Inngest client non configurato correttamente

**Fix**:
```bash
# Verifica che l'app sia avviata DOPO Inngest dev server
npx inngest-cli@latest dev
# Poi in un altro terminale
npm run dev
```

### Problema: Progress bar bloccata allo 0%

**Causa**: Polling endpoint non ritorna dati

**Fix**:
```bash
# Verifica che la queue entry esista
curl http://localhost:3000/api/workouts/generation-status/{requestId}

# Dovrebbe ritornare:
{
  "status": "in_progress",
  "progress_percent": 45,
  "current_phase": "AI analyzing and selecting exercises"
}
```

### Problema: "Unauthorized" su pending-generations

**Causa**: User non autenticato

**Fix**:
- Verifica che Supabase auth sia configurato
- Controlla cookie session in DevTools
- Fai re-login

### Problema: Workout non si completa

**Causa**: Inngest worker crashed

**Fix**:
1. Verifica Inngest logs: http://localhost:8288
2. Cerca errori nel worker
3. Controlla che OPENAI_API_KEY sia valida
4. Verifica Supabase connection

### Problema: Production deployment - funzioni non registrate

**Causa**: Webhook non configurato

**Fix**:
1. Verifica URL webhook in Inngest dashboard
2. Controlla che INNGEST_SIGNING_KEY sia in Vercel env vars
3. Re-deploy app

## 📊 Monitoring

### Metriche da Monitorare

1. **Generation Success Rate**:
   ```sql
   SELECT
     status,
     COUNT(*) as count,
     AVG(EXTRACT(EPOCH FROM (completed_at - created_at))) as avg_duration_sec
   FROM workout_generation_queue
   GROUP BY status;
   ```

2. **Average Generation Time**:
   - Target: < 90 secondi
   - Alert se > 120 secondi

3. **Error Rate**:
   - Target: < 5%
   - Alert se > 10%

### Dashboard Inngest

Usa Inngest dashboard per:
- Function runs (successi/fallimenti)
- Retry attempts
- Average execution time
- Error logs

## 🔄 Next Steps

### Frontend Integration ✅ COMPLETATO

Tutti i componenti sono già integrati e funzionanti:

1. **Dashboard**: ✅ Controlla pending generations on mount
   ```typescript
   // components/features/dashboard/dashboard-client.tsx
   useEffect(() => {
     const checkPendingGenerations = async () => {
       const response = await fetch('/api/workouts/pending-generations')
       if (response.ok) {
         const generations = await response.json()
         if (generations && generations.length > 0) {
           setPendingGeneration(generations[0])
           setShowGenerationProgress(true)
         }
       }
     }
     checkPendingGenerations()
   }, [])
   ```

2. **Generate Button**: ✅ Usa endpoint unificato con Inngest
   ```typescript
   // components/features/dashboard/timeline-day-card.tsx
   // Entrambi i pulsanti ("Generate Today" e "Pre-Generate") usano:
   <ProgressFeedback
     variant="inline"
     endpoint="/api/workouts/generate/stream"  // Unified endpoint
     requestBody={{ targetCycleDay: targetDayForGeneration || day }}
     cancellable={true}
     onComplete={handleGenerationComplete}
   />

   // L'endpoint detecta automaticamente se Inngest è configurato
   // e switcha tra sync (legacy) e async (Inngest) mode
   ```

3. **Progress Modal**: ✅ Mostra progresso in tempo reale
   ```typescript
   // components/features/workout/async-generation-progress.tsx
   // Polling automatico ogni 2s
   // Switch automatico da SSE a polling quando stream chiude
   ```

### Future Enhancements

- [ ] Email notification quando workout è pronto
- [ ] Push notification (PWA)
- [ ] Webhook per integrazioni esterne
- [ ] Batch generation (genera settimana intera)
- [ ] Priority queue (utenti Pro in cima)
- [ ] Analytics dashboard per admin
