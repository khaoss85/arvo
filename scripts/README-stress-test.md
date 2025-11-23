# Split Generation Stress Test Suite

Documentazione completa per testare il sistema di generazione split asincrona (Inngest + SSE).

## 📋 Panoramica

Questa suite di test verifica che il sistema di generazione delle split funzioni correttamente in modalità asincrona, gestendo:

- ✅ Trigger corretto della generazione
- ✅ Esecuzione via Inngest in background
- ✅ Restituzione della split correttamente al client
- ✅ Gestione errori e retry
- ✅ Resume dopo disconnessione
- ✅ Richieste concorrenti
- ✅ Verifica del comportamento effettivamente asincrono

## 🚀 Setup Prerequisiti

### 1. Installare dipendenze

```bash
npm install
npm install -g tsx  # Per eseguire TypeScript direttamente
npm install eventsource  # Per SSE client-side
```

### 2. Configurare environment variables

Assicurati che `.env.local` contenga:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=http://localhost:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Inngest (dev mode)
INNGEST_DEV=1
```

### 3. Avviare i servizi necessari

**Terminal 1: Inngest Dev Server**
```bash
npx inngest-cli@latest dev
```

Verifica che mostri:
```
✓ Inngest Dev Server listening on http://localhost:8288
✓ Functions registered:
  - generate-split-async
  - adapt-split-async
  - generate-workout-async
```

**Terminal 2: Next.js Dev Server**
```bash
npm run dev
```

Verifica che sia disponibile su `http://localhost:3000`

**Terminal 3: Supabase Local** (opzionale, se usi Supabase local)
```bash
npx supabase start
```

## 🔑 Ottenere il Token di Autenticazione

**IMPORTANTE**: I test richiedono un token di autenticazione valido per chiamare le API.

### Estrarre il Token dal Browser

1. **Apri l'app nel browser** dove sei già loggato:
   ```
   http://localhost:3000
   ```

2. **Apri DevTools**:
   - Windows/Linux: Premi `F12`
   - Mac: Premi `Cmd+Option+I`

3. **Vai alla tab "Application"** (o "Storage" in Firefox)

4. **Trova il token**:

   **Metodo A - Local Storage (più semplice):**
   - Espandi `Local Storage` → `http://localhost:3000`
   - Cerca una chiave tipo `sb-<project-ref>-auth-token`
   - Clicca sulla chiave per vedere il valore (sarà un JSON)
   - Copia il valore del campo `access_token` (inizia con `eyJ...`)

   **Metodo B - Cookies:**
   - Espandi `Cookies` → `http://localhost:3000`
   - Cerca cookie tipo `sb-access-token` o `sb-<project-ref>-auth-token`
   - Copia il valore

5. **Formato del Token**:
   Il token inizia sempre con `eyJ` e assomiglia a questo:
   ```
   eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhdWQiOiJhdXRoZW50aWNhdGVkIiwiZXhwIjoxNjM...
   ```

### Validità del Token

⚠️ **Il token scade dopo circa 1 ora**. Se i test falliscono con errori di autenticazione, estrai un nuovo token dal browser.

## 📝 Eseguire i Test

**IMPORTANTE**: Tutti i comandi richiedono il parametro `--token` con il tuo auth token.

### Eseguire tutti i test

```bash
tsx scripts/stress-test-split.ts all --token="eyJhbGc..."
```

Questo eseguirà tutti i 10 test in sequenza e mostrerà un report finale.

### Eseguire un test specifico

```bash
tsx scripts/stress-test-split.ts [numero-test] --token="your-token-here"
```

Esempi:
```bash
# Test 1: Basic Split Generation
tsx scripts/stress-test-split.ts 1 --token="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."

# Test 5: SSE Disconnection Resume
tsx scripts/stress-test-split.ts 5 --token="eyJhbGc..."

# Test 10: Multiple Parallel Generations
tsx scripts/stress-test-split.ts 10 --token="eyJhbGc..."
```

### Sintassi Token

Il parametro `--token` può essere passato in due modi:

```bash
# Metodo 1: Con uguale (raccomandato)
tsx scripts/stress-test-split.ts 1 --token="eyJhbGc..."

# Metodo 2: Spazio
tsx scripts/stress-test-split.ts 1 --token "eyJhbGc..."
```

### Senza Token

Se non passi il token, vedrai un errore RLS:
```
✗ Test failed: Error: Failed to create profile: new row violates row-level security policy
```

In questo caso, estrai il token dal browser e riprova.

## 🧪 Elenco Test

### Test Funzionalità Base

#### Test 1: Basic Split Generation (Onboarding)
**Cosa testa:**
- Generazione split completa per nuovo utente
- Trigger API → Inngest → Database
- Verifica che la split sia salvata correttamente

**Durata attesa:** ~30-60 secondi

**Cosa verificare:**
- ✓ API risponde rapidamente (~2s)
- ✓ Queue entry viene creata con status `pending`
- ✓ Inngest worker inizia processing (status → `in_progress`)
- ✓ Progress aumenta: 0% → 10% → 30% → 60% → 85% → 100%
- ✓ Split plan salvata in database con ID valido
- ✓ Split plan contiene sessions, frequency_map, volume_distribution

#### Test 2: Split Adaptation
**Cosa testa:**
- Adattamento split dopo completamento ciclo
- Verifica che vecchia split venga disattivata
- Nuova split venga creata basandosi su context (history, insights, etc.)

**Durata attesa:** ~60-90 secondi (più lento di generazione base)

**Cosa verificare:**
- ✓ API `/api/splits/adapt/stream` funziona
- ✓ Vecchia split viene marcata `active: false`
- ✓ Nuova split viene creata con `active: true`
- ✓ User profile aggiornato con nuovo `active_split_plan_id`

#### Test 3: Concurrent Requests (3 users)
**Cosa testa:**
- 3 utenti diversi generano split contemporaneamente
- Verifica isolamento tra utenti
- Nessuna interferenza tra generazioni

**Durata attesa:** ~60-90 secondi

**Cosa verificare:**
- ✓ Tutte e 3 le richieste vengono accettate
- ✓ 3 queue entries separate create
- ✓ 3 Inngest jobs avviati in parallelo
- ✓ Tutti e 3 completano con successo
- ✓ Ogni split appartiene all'utente corretto

### Test Scenari Errore

#### Test 4: Timeout and Retry Handling
**Cosa testa:**
- Comportamento quando AI timeout (210s)
- Verifica retry automatici (max 3)
- Gestione failure dopo 3 retry

**⚠️ Note:** Test manuale - richiede simulazione timeout

**Come testare manualmente:**
1. Disabilitare temporaneamente OpenAI API key
2. Eseguire generazione split
3. Verificare che:
   - Inngest prova 3 volte
   - Ogni retry è loggato
   - Dopo 3 tentativi → status `failed`
   - Error message descrittivo salvato in queue

#### Test 5: SSE Disconnection and Resume
**Cosa testa:**
- Client chiude stream SSE durante generazione
- Riconnessione con stesso `requestId`
- Verifica resume dal punto di interruzione

**Durata attesa:** ~60 secondi

**Cosa verificare:**
- ✓ Prima connessione SSE inizia streaming
- ✓ Disconnessione non interrompe Inngest job
- ✓ Seconda connessione con stesso `requestId` riprende
- ✓ Progress aggiornato correttamente (non riparte da 0%)
- ✓ Generazione completa con successo

#### Test 6: Duplicate Request Handling
**Cosa testa:**
- Utente prova a generare 2 split contemporaneamente
- Verifica che seconda richiesta venga:
  - Bloccata con messaggio errore, OPPURE
  - Reindirizzata a resume della prima generazione

**Durata attesa:** ~60 secondi

**Cosa verificare:**
- ✓ Prima richiesta crea queue entry e inizia processing
- ✓ Seconda richiesta:
  - Trova active generation esistente
  - Non crea duplicato in queue
  - Resume la prima generazione
- ✓ Solo 1 split viene creata

#### Test 7: Complete Failure Handling
**Cosa testa:**
- Generazione fallisce completamente (non retriable error)
- Verifica error message salvato
- Verifica nessuna split creata

**⚠️ Note:** Test manuale - richiede dati invalidi

**Come testare manualmente:**
1. Inviare `approachId` non esistente
2. Verificare che:
   - Inngest job fallisce immediatamente
   - Status → `failed`
   - Error message descrittivo
   - Nessuna split creata
   - User profile non modificato

### Test Asincronismo

#### Test 8: Async Background Processing
**Cosa testa:**
- API risponde velocemente (non blocca)
- Inngest processa in background
- Verifica che generazione NON sia sincrona

**Durata attesa:** ~60 secondi

**Cosa verificare:**
- ✓ API risponde in <5 secondi
- ✓ Response contiene initial progress (0-50%)
- ✓ Client può chiudere connessione
- ✓ Inngest continua processing in background
- ✓ Generazione completa anche senza client connesso

**Interpretazione risultati:**
- API response time <5s → ✅ Async confermato
- API response time >10s → ❌ Probabilmente sincrono

#### Test 9: Progress Updates via SSE
**Cosa testa:**
- Progress updates arrivano ogni ~2 secondi
- Client riceve almeno 3-5 aggiornamenti
- Progress aumenta monotonicamente (0% → 100%)

**Durata attesa:** ~60 secondi

**Cosa verificare:**
- ✓ Almeno 3 progress updates (0%, 50-60%, 100%)
- ✓ `current_phase` descrive operazione corrente
- ✓ Nessun progresso in diminuzione
- ✓ Status API `/api/splits/generation-status/:id` funziona

**Progress atteso:**
```
0%   → Starting
10%  → Loading cycle history
30%  → AI analyzing training needs
60%  → AI generating split
85%  → Saving to database
100% → Complete
```

#### Test 10: Multiple Parallel Generations (5 users)
**Cosa testa:**
- Sistema gestisce 5 generazioni simultanee
- Nessun bottleneck o rate limiting
- Tutte completano con successo

**Durata attesa:** ~90-120 secondi

**Cosa verificare:**
- ✓ Tutte e 5 le richieste accettate
- ✓ 5 Inngest jobs in parallelo
- ✓ Tutti completano entro timeout (3 min)
- ✓ Nessun errore di concorrenza
- ✓ Avg completion time < 90s

## 📊 Interpretare i Risultati

### Output di Successo

```
[12:34:56] === Test 1: Basic Split Generation (Onboarding) ===
[12:34:56] Created test user: test1-...@example.com (uuid)
[12:34:58] Triggering split generation...
[12:35:00] Received initial SSE data: data: {"phase":"profile","progress":50...
[12:35:02] Progress: 50% - in_progress - AI analyzing training needs
[12:35:12] Progress: 60% - in_progress - AI generating split
[12:35:32] Progress: 85% - in_progress - Saving to database
[12:35:42] Progress: 100% - completed - Complete
[12:35:42] ✓ Split created successfully: uuid-split-id
[12:35:42]   Type: push_pull_legs, Cycle: 12 days
```

### Output di Errore

```
[12:34:56] === Test 1: Basic Split Generation (Onboarding) ===
[12:34:58] ✗ Test failed: Generation failed: AI service timeout
```

### Report Finale

```
╔════════════════════════════════════════════════════════════════════╗
║                         TEST SUMMARY                               ║
╚════════════════════════════════════════════════════════════════════╝

✓ PASS Test 1: Basic Split Generation (45234ms)
✓ PASS Test 2: Split Adaptation (67123ms)
✓ PASS Test 3: Concurrent Requests (3 users) (58934ms)
✓ PASS Test 4: Timeout and Retry Handling (0ms)  [Manual test]
✓ PASS Test 5: SSE Disconnection and Resume (52341ms)
✓ PASS Test 6: Duplicate Request Handling (49876ms)
✓ PASS Test 7: Complete Failure Handling (0ms)  [Manual test]
✓ PASS Test 8: Async Background Processing (48234ms)
✓ PASS Test 9: Progress Updates via SSE (51234ms)
✓ PASS Test 10: Multiple Parallel Generations (5 users) (89456ms)

======================================================================
Total: 10 tests
Passed: 10
Failed: 0
Total Duration: 462.43s
======================================================================
```

## 🔍 Debugging

### Inngest non si avvia

```bash
# Verifica che Inngest dev server sia running
curl http://localhost:8288/health

# Se non risponde, riavvia:
npx inngest-cli@latest dev
```

### Database errori "split_plan_id column not found"

```bash
# Verifica che la migration sia applicata
npx supabase db diff

# Se manca, applica migration:
npx supabase db push
```

### Test timeout prematuramente

Aumenta `maxPolls` nello script:
```typescript
const maxPolls = 120  // 4 minutes invece di 2
```

### Vedere log Inngest

Vai a http://localhost:8288 nel browser per vedere:
- Function runs
- Event triggers
- Error logs
- Retry attempts

## ✅ Checklist di Verifica Completa

Dopo aver eseguito tutti i test, verifica:

- [ ] Test 1-3 passano (funzionalità base)
- [ ] Test 5-6 passano (error handling automatico)
- [ ] Test 8 conferma async (API <5s)
- [ ] Test 9 mostra almeno 3 progress updates
- [ ] Test 10 gestisce 5 utenti concorrenti
- [ ] Inngest dashboard mostra function runs completati
- [ ] Database contiene split_plans create
- [ ] workout_generation_queue contiene entries con status `completed`
- [ ] Nessun job bloccato in `pending` o `in_progress` dopo test

## 🎯 Obiettivi di Performance

| Metrica | Target | Test |
|---------|--------|------|
| API response time | <5s | Test 8 |
| Split generation (onboarding) | 30-60s | Test 1 |
| Split adaptation | 60-90s | Test 2 |
| Concurrent (3 users) | Tutti <90s | Test 3 |
| Concurrent (5 users) | Tutti <120s | Test 10 |
| Progress updates | ≥3 updates | Test 9 |
| Retry on timeout | 3 attempts | Test 4 (manual) |

## 🐛 Problemi Comuni

### "Generation queue entry not found"
**Causa:** Queue entry non creata o cancellata prematuramente
**Soluzione:** Verifica che `GenerationQueueService.createServer()` funzioni

### "Split plan not found in database"
**Causa:** Inngest completato ma split non salvata
**Soluzione:** Controlla Inngest logs per errori durante save

### "API returned 401/403"
**Causa:** Service role key mancante o invalida
**Soluzione:** Verifica `SUPABASE_SERVICE_ROLE_KEY` in `.env.local`

### "Inngest worker not triggered"
**Causa:** Event key mancante o Inngest server non running
**Soluzione:** Verifica `INNGEST_DEV=1` e Inngest server attivo

## 📚 Risorse

- **Inngest Dashboard:** http://localhost:8288
- **Supabase Studio:** http://localhost:54323 (se local)
- **Next.js Dev:** http://localhost:3000
- **Documentazione Architettura:** `/SPLIT_GENERATION_ARCHITECTURE.md`
- **Migration Guide:** `/SPLIT_GENERATION_ASYNC_MIGRATION.md`

## 🚨 Se Tutti i Test Falliscono

1. Verifica servizi running:
   ```bash
   # Inngest
   curl http://localhost:8288/health

   # Next.js
   curl http://localhost:3000/api/health

   # Supabase
   curl http://localhost:54321/rest/v1/
   ```

2. Controlla environment variables:
   ```bash
   cat .env.local | grep -E "SUPABASE|INNGEST|APP_URL"
   ```

3. Verifica database migrations:
   ```bash
   npx supabase migration list
   ```

4. Controlla logs:
   - Terminal Inngest: errori function runs
   - Terminal Next.js: errori API routes
   - Browser DevTools: errori network

## 📞 Support

Per problemi o domande:
1. Controlla Inngest dashboard per error details
2. Verifica Next.js console per API errors
3. Controlla database con Supabase Studio
4. Rivedi documentazione architettura

---

**Ultima modifica:** 2025-01-23
**Versione:** 1.0.0
