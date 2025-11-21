# Split Generation Async Migration Guide

## 📋 Cosa è stato implementato

### ✅ Backend Completato

1. **Inngest Function** - `lib/inngest/functions/generate-split.ts`
   - Generazione split asincrona in background
   - Progress tracking (0% → 10% → 30% → 60% → 85% → 100%)
   - Retry automatici (3x)
   - Timeout protection (5 minuti)
   - Error categorization

2. **API Route SSE** - `app/api/splits/generate/stream/route.ts`
   - Server-Sent Events per progress updates real-time
   - Database polling (ogni 2 secondi)
   - Resume capability
   - Concurrency checks

3. **API Route Status** - `app/api/splits/generation-status/[requestId]/route.ts`
   - Endpoint per polling dello status
   - Verifica ownership
   - Ritorna progress e stato corrente

4. **Traduzioni** - `messages/en.json` e `messages/it.json`
   - Messaggi di progresso
   - Messaggi di errore
   - Supporto i18n completo

5. **Inngest Registration** - `app/api/inngest/route.ts`
   - Function registrata e pronta per Inngest

---

## 🔧 Prossimi Passi: Aggiornare il Client

### Opzione 1: Usare EventSource (Manuale)

Trova dove viene chiamato `generateSplitPlanAction()` (probabilmente in onboarding) e sostituisci con:

```typescript
// Prima (server action bloccante):
const result = await generateSplitPlanAction(input, generationRequestId)

// Dopo (SSE async):
const eventSource = new EventSource(
  `/api/splits/generate/stream?` + new URLSearchParams({
    input: JSON.stringify(input),
    generationRequestId
  })
)

eventSource.onmessage = (event) => {
  const data = JSON.parse(event.data)

  if (data.phase === 'complete') {
    setSplitPlan(data.splitPlan)
    eventSource.close()
  } else if (data.phase === 'error') {
    setError(data.error)
    eventSource.close()
  } else {
    // Update progress UI
    setProgress(data.progress)
    setMessage(data.message)
  }
}

eventSource.onerror = (error) => {
  console.error('SSE error:', error)
  eventSource.close()
  setError('Connection error. Please try again.')
}
```

### Opzione 2: Riusare AsyncGenerationProgress (Raccomandato)

Il componente `AsyncGenerationProgress` è già pronto per gestire SSE e polling.

**Esempio di utilizzo:**

```typescript
import { AsyncGenerationProgress } from '@/components/features/workout/async-generation-progress'

// Nel componente di onboarding:
const [isGenerating, setIsGenerating] = useState(false)
const [generationRequestId] = useState(() => crypto.randomUUID())

const handleGenerateSplit = async () => {
  setIsGenerating(true)
}

return (
  <>
    {isGenerating && (
      <AsyncGenerationProgress
        requestId={generationRequestId}
        apiEndpoint="/api/splits/generate/stream"
        statusEndpoint="/api/splits/generation-status"
        onComplete={(data) => {
          const splitPlan = data.splitPlan
          setIsGenerating(false)
          // Handle split plan (save to state, redirect, etc.)
        }}
        onError={(error) => {
          setIsGenerating(false)
          // Handle error
          console.error('Split generation failed:', error)
        }}
        labels={{
          title: "Generating your split plan",
          subtitle: "This may take up to 2 minutes"
        }}
      />
    )}
  </>
)
```

**Nota:** Potrebbe essere necessario adattare `AsyncGenerationProgress` per supportare splits (attualmente è ottimizzato per workouts). Puoi:
- Renderlo generico (accetta `type: 'workout' | 'split'`)
- Oppure creare un nuovo componente `AsyncSplitGenerationProgress`

---

## 📍 Dove Aggiornare il Client

### 1. Onboarding Flow

**File da verificare:**
- `app/(protected)/onboarding/**/*.tsx`
- Cerca chiamate a `generateSplitPlanAction`

**Cerca con:**
```bash
grep -r "generateSplitPlanAction" app/
```

### 2. Split Adaptation (Cycle Completion)

**File da verificare:**
- `app/actions/split-actions.ts` - `adaptSplitAfterCycleAction()`
- Componenti che chiamano questa action

**Cerca con:**
```bash
grep -r "adaptSplitAfterCycleAction" app/
```

---

## 🎯 Modalità di Funzionamento

### In Development (INNGEST_DEV=1)

```bash
# Terminal 1: Inngest Dev Server
npx inngest-cli@latest dev

# Terminal 2: Next.js Dev Server
npm run dev
```

L'API route detecta automaticamente `INNGEST_DEV=1` e usa Inngest in locale.

### In Production

Imposta:
```env
INNGEST_EVENT_KEY=your-event-key
INNGEST_SIGNING_KEY=your-signing-key
```

Inngest gestirà automaticamente le richieste in background via webhook.

---

## 🧪 Come Testare

### 1. Avvia Inngest Dev Server

```bash
npx inngest-cli@latest dev
```

Dovresti vedere:
```
✓ Inngest Dev Server listening on http://localhost:8288
✓ Functions registered:
  - generate-workout-async
  - generate-split-async  # ← Nuova function
```

### 2. Avvia Next.js

```bash
npm run dev
```

### 3. Testa il Flow

1. Vai su onboarding (o dove generi lo split)
2. Clicca "Generate Split"
3. Verifica:
   - Progress bar appare con aggiornamenti real-time
   - Console logs mostrano progress updates
   - Inngest dashboard mostra l'evento in esecuzione
   - Split viene salvato al completamento

### 4. Testa Resume

1. Inizia generazione
2. Ricarica la pagina (o chiudi e riapri browser)
3. Verifica che riprenda da dove era rimasto

### 5. Testa Errori

Simula timeout modificando temporaneamente:
```typescript
// In lib/inngest/functions/generate-split.ts
const GENERATION_TIMEOUT_MS = 5000 // 5 secondi invece di 5 minuti
```

---

## 🔍 Troubleshooting

### "Function not found" in Inngest

Verifica che:
1. `app/api/inngest/route.ts` importi `generateSplitFunction`
2. Sia nell'array `functions: [...]`
3. Inngest dev server sia stato riavviato dopo le modifiche

### "Queue entry disappeared"

Il database potrebbe non avere RLS policy corrette:
```sql
-- Verifica le policy su workout_generation_queue
SELECT * FROM pg_policies WHERE tablename = 'workout_generation_queue';
```

### SSE non riceve updates

Verifica:
1. `generationRequestId` sia passato correttamente
2. Database queue entry sia stata creata
3. Inngest function stia aggiornando `GenerationQueueAdminService.updateProgress()`

### Progress si blocca

Controlla:
1. Inngest dashboard per errori
2. Console del browser per disconnessioni SSE
3. Network tab per vedere i messaggi SSE

---

## 📊 Metriche da Monitorare

### Inngest Dashboard

- **Success rate**: Dovrebbe essere >95%
- **Retry rate**: Dovrebbe essere <5%
- **Average duration**: ~30-60s per onboarding, ~90-180s per adaptation
- **Errors**: Categorizzati (timeout, API, validation, etc.)

### Database

```sql
-- Generazioni completate nelle ultime 24h
SELECT
  COUNT(*) as total,
  COUNT(*) FILTER (WHERE status = 'completed') as completed,
  COUNT(*) FILTER (WHERE status = 'failed') as failed,
  AVG(EXTRACT(EPOCH FROM (completed_at - created_at))) as avg_duration_seconds
FROM workout_generation_queue
WHERE
  context->>'type' = 'split'
  AND created_at > NOW() - INTERVAL '24 hours';
```

---

## ✅ Checklist Finale

Prima di deployare in produzione:

- [ ] Client aggiornato per usare SSE invece di server action
- [ ] Testato onboarding flow end-to-end
- [ ] Testato adaptation flow end-to-end
- [ ] Testato resume dopo page reload
- [ ] Testato comportamento con Inngest in dev mode
- [ ] Verificato error handling (timeout, API errors, etc.)
- [ ] Verificato traduzioni IT/EN
- [ ] Build TypeScript senza errori
- [ ] Configurate env vars in produzione (INNGEST_EVENT_KEY, INNGEST_SIGNING_KEY)
- [ ] Testato in produzione con traffic reale

---

## 🎉 Benefici Attesi

| Metrica | Prima | Dopo |
|---------|-------|------|
| **UX Onboarding** | 30s di blocco UI | Progress bar real-time |
| **UX Adaptation** | 2min di blocco UI | Progress real-time |
| **Timeout Risk** | Alto (240s limit) | Zero (Inngest 5min) |
| **Resume Capability** | No | Sì (sopravvive reload) |
| **Retry on Failure** | No | Sì (3x automatico) |
| **User Can Track** | No | Sì (status endpoint) |
| **Monitoring** | No | Dashboard Inngest |
| **Scalability** | Limitata (request threads) | Illimitata (workers) |

---

## 📚 Riferimenti

- **Inngest Docs**: https://www.inngest.com/docs
- **Server-Sent Events**: https://developer.mozilla.org/en-US/docs/Web/API/Server-sent_events
- **Workout Generation (reference)**: `app/api/workouts/generate/stream/route.ts`
- **Generation Queue Service**: `lib/services/generation-queue.service.ts`
