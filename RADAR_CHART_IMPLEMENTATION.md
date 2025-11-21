# Muscle Distribution Radar Chart - Implementation Guide

## Overview
Implementazione di visualizzazione radar chart per la distribuzione del volume di allenamento sui gruppi muscolari, ispirata al design delle fitness app moderne.

## Componenti Creati

### 1. **MuscleRadarChart** (`components/features/analytics/muscle-radar-chart.tsx`)
Radar chart con Recharts che mostra la distribuzione muscolare.

**Props:**
- `targetData`: Target volume dal split plan (Record<string, number>)
- `actualData`: Volume effettivo dal ciclo corrente (Record<string, number>)
- `previousData?`: Volume del ciclo precedente per confronto (Record<string, number>)
- `comparisonMode`: 'target' | 'previous' - modalità di confronto
- `maxMuscles`: Numero massimo di gruppi muscolari da mostrare (default: 6)
- `loading`: Stato di caricamento

**Features:**
- Tooltip personalizzato con dettagli volume e progresso
- Color coding basato su percentuale completamento
- Support i18n per nomi muscoli (IT/EN)
- Responsive e dark mode ready

**Esempio d'uso:**
```tsx
<MuscleRadarChart
  targetData={splitPlan.volume_distribution}
  actualData={currentCycleVolumes}
  previousData={previousCycleVolumes}
  comparisonMode="previous"
  maxMuscles={6}
/>
```

---

### 2. **MetricCardsGrid** (`components/features/analytics/metric-cards-grid.tsx`)
Griglia di card metriche simile all'immagine di riferimento (Allenamenti, Durata, Volume, Serie).

**Props:**
- `workouts?`: Dati metrica allenamenti
- `duration?`: Dati metrica durata
- `volume?`: Dati metrica volume
- `sets?`: Dati metrica serie
- `customMetrics?`: Metriche custom aggiuntive
- `compact`: Modalità compatta per timeline

**MetricCardData Interface:**
```tsx
interface MetricCardData {
  icon: LucideIcon
  label: string
  value: string | number
  unit?: string
  delta?: {
    value: number
    type: 'percentage' | 'absolute' | 'time'
  }
  trend?: 'up' | 'down' | 'neutral'
}
```

**Helper Function:**
```tsx
const metrics = createMetricsFromCycleStats(
  stats: { totalVolume, totalWorkouts, totalSets, totalDurationSeconds },
  comparison: { volumeDelta, workoutsDelta, setsDelta, durationDelta },
  t // translation function
)
```

---

### 3. **MuscleDistributionCard** (`components/features/dashboard/muscle-distribution-card.tsx`)
Card completa che combina radar chart + metric cards.

**Props:**
- `targetData`: Volume target dal split plan
- `actualData`: Volume effettivo
- `stats`: Statistiche ciclo corrente
- `comparison?`: Confronto con ciclo precedente
- `comparisonMode`: 'target' | 'previous'
- `previousCycleData?`: Dati ciclo precedente
- `variant`: 'timeline' | 'full'

**Variants:**
- **timeline**: Versione compatta (280px) per dashboard timeline, collapsible radar chart
- **full**: Versione completa per pagine dedicate

**Esempio d'uso:**
```tsx
<MuscleDistributionCard
  targetData={volumeDistribution}
  actualData={currentVolumes}
  stats={{
    totalVolume: 12500,
    totalWorkouts: 8,
    totalSets: 120,
    totalDurationSeconds: 28800
  }}
  comparison={{
    volumeDelta: 5.2,
    workoutsDelta: 1,
    setsDelta: 10,
    durationDelta: 1200
  }}
  variant="timeline"
/>
```

---

## Integrazioni Completate

### ✅ Cycle Completion Modal
Il modal di completamento ciclo ora include il radar chart per mostrare la distribuzione muscolare.

**File modificato:** `components/features/dashboard/cycle-completion-modal.tsx`

**Nuove props:**
- `volumeByMuscleGroup?`: Volume per gruppo muscolare del ciclo completato
- `previousVolumeByMuscleGroup?`: Volume del ciclo precedente

Il radar chart viene mostrato automaticamente quando i dati sono disponibili.

---

## Traduzioni i18n

### Inglese (`messages/en.json`)
```json
{
  "dashboard": {
    "muscleDistribution": "Muscle Distribution",
    "cycleComparison": "Cycle Comparison",
    "actualVsTarget": "Your current cycle progress vs planned targets",
    "currentVsPrevious": "Current cycle vs previous cycle comparison",
    "viewRadarChart": "View muscle distribution chart"
  },
  "Analytics": {
    "Metrics": {
      "workouts": "Workouts",
      "duration": "Duration",
      "volume": "Volume",
      "sets": "Sets"
    }
  }
}
```

### Italiano (`messages/it.json`)
```json
{
  "dashboard": {
    "muscleDistribution": "Distribuzione Muscolare",
    "cycleComparison": "Confronto Cicli",
    "actualVsTarget": "Il tuo progresso attuale vs obiettivi pianificati",
    "currentVsPrevious": "Confronto ciclo corrente vs ciclo precedente",
    "viewRadarChart": "Visualizza grafico distribuzione"
  },
  "Analytics": {
    "Metrics": {
      "workouts": "Allenamenti",
      "duration": "Durata",
      "volume": "Volume",
      "sets": "Serie"
    }
  }
}
```

---

## Come Integrare nella Dashboard Timeline

La `MuscleDistributionCard` può essere facilmente aggiunta alla timeline orizzontale in `split-cycle-timeline.tsx`,
accanto alla `VolumeSummaryTimelineCard`:

```tsx
{/* In split-cycle-timeline.tsx, dentro il map dei days */}

{/* Existing cards */}
{days.map((dayData) => (
  <TimelineDayCard key={dayData.day} {...} />
))}

{/* Volume Summary Card */}
{volumeProgress && volumeProgress.length > 0 && (
  <VolumeSummaryTimelineCard progressData={volumeProgress} />
)}

{/* NEW: Muscle Distribution Card */}
{cycleStats && volumeDistribution && (
  <MuscleDistributionCard
    targetData={volumeDistribution}
    actualData={cycleStats.volumeByMuscleGroup}
    stats={cycleStats}
    comparison={cycleComparison}
    variant="timeline"
  />
)}
```

---

## Dati Necessari

### Dal Database (già disponibili):
- `split_plans.volume_distribution` - Target volume per gruppo muscolare
- `cycle_completions.volume_by_muscle_group` - Volume effettivo del ciclo
- `workouts.exercises[]` con `primaryMuscles` e `secondaryMuscles`

### Servizi Esistenti (da utilizzare):
- `getVolumeProgressAction()` - Progresso volume corrente
- `CycleStatsService.calculateCycleStats()` - Statistiche ciclo
- `CycleStatsService.getComparisonWithPreviousCycle()` - Confronto cicli
- `calculateMuscleGroupVolumes()` - Calcolo volume per muscolo

---

## Color Scheme

**Radar Chart:**
- Target: Blu (#3b82f6) con opacity 0.25
- Actual/Current: Verde (#10b981) con opacity 0.5
- Previous: Viola (#a855f7) con opacity 0.25

**Metric Cards:**
- Delta positivo: Verde (#10b981)
- Delta negativo: Rosso (#ef4444)
- Delta neutro: Grigio (#6b7280)

**Card Background:**
- Gradient: da blu-50 a indigo-50 (light)
- Border: blu-300 (light) / blu-700 (dark)

---

## Testing

Per testare i componenti:

1. **Con dati reali:**
   - Completa alcuni workout in un ciclo
   - Visualizza il cycle completion modal
   - I dati verranno automaticamente popolati

2. **Con dati mock:**
   ```tsx
   const mockData = {
     targetData: {
       chest: 20,
       back: 22,
       shoulders: 16,
       quads: 18,
       hamstrings: 12,
       biceps: 10
     },
     actualData: {
       chest: 18,
       back: 20,
       shoulders: 14,
       quads: 16,
       hamstrings: 10,
       biceps: 9
     }
   }
   ```

---

## Next Steps (Opzionali)

1. **Dashboard Timeline Integration**: Aggiungere MuscleDistributionCard alla timeline orizzontale
2. **Progress Page**: Sezione dedicata con vista full del radar chart
3. **Export/Share**: Funzionalità per condividere il grafico
4. **Historical Comparison**: Mostrare trend nel tempo (ultimo 3-6 mesi)
5. **AI Insights**: Suggerimenti basati sulla distribuzione muscolare

---

## Librerie Utilizzate

- **Recharts** (v3.3.0): Già installato, usato per RadarChart, PolarGrid, ecc.
- **Lucide React**: Per icone (Dumbbell, Calendar, Timer, Activity, TrendingUp/Down)
- **next-intl**: Per traduzioni i18n

---

## Conclusione

L'implementazione fornisce:
✅ Visualizzazione radar professionale e responsive
✅ Metric cards con delta indicators
✅ Full i18n support (IT/EN)
✅ Dark mode ready
✅ Componenti riutilizzabili e modulari
✅ Integrazione facile con dati esistenti

Tutti i componenti sono pronti per essere testati con dati reali appena l'utente completa un ciclo!
