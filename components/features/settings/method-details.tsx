'use client'

import { useState, useEffect } from 'react'
import { ChevronDown, ChevronRight, BookOpen, TrendingUp, Target, Zap, Calendar } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { KnowledgeEngine } from '@/lib/knowledge/engine'
import type { TrainingApproach } from '@/lib/knowledge/types'

interface MethodDetailsProps {
  approachId: string
}

export function MethodDetails({ approachId }: MethodDetailsProps) {
  const [approach, setApproach] = useState<TrainingApproach | null>(null)
  const [loading, setLoading] = useState(true)
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['philosophy']))

  useEffect(() => {
    const loadApproach = async () => {
      try {
        const knowledge = new KnowledgeEngine()
        const data = await knowledge.loadApproach(approachId)
        setApproach(data)
      } catch (error) {
        console.error('Failed to load approach:', error)
      } finally {
        setLoading(false)
      }
    }

    loadApproach()
  }, [approachId])

  const toggleSection = (section: string) => {
    setExpandedSections((prev) => {
      const next = new Set(prev)
      if (next.has(section)) {
        next.delete(section)
      } else {
        next.add(section)
      }
      return next
    })
  }

  if (loading) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-center py-8">
          <div className="text-gray-400">Caricamento dettagli metodo...</div>
        </div>
      </Card>
    )
  }

  if (!approach) {
    return (
      <Card className="p-6">
        <div className="text-gray-400">Metodo non trovato</div>
      </Card>
    )
  }

  const SectionHeader = ({ icon: Icon, title, section }: { icon: any; title: string; section: string }) => {
    const isExpanded = expandedSections.has(section)
    return (
      <button
        onClick={() => toggleSection(section)}
        className="w-full flex items-center justify-between p-4 hover:bg-gray-800/50 rounded-lg transition-colors"
      >
        <div className="flex items-center gap-3">
          <Icon className="w-5 h-5 text-blue-400" />
          <h3 className="text-lg font-semibold text-white">{title}</h3>
        </div>
        {isExpanded ? (
          <ChevronDown className="w-5 h-5 text-gray-400" />
        ) : (
          <ChevronRight className="w-5 h-5 text-gray-400" />
        )}
      </button>
    )
  }

  const formatTempo = (tempo: any) => {
    if (!tempo) return null
    return `${tempo.eccentric}-${tempo.pauseBottom}-${tempo.concentric}-${tempo.pauseTop}`
  }

  return (
    <Card className="p-6 bg-gray-900/50 border-gray-800">
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <BookOpen className="w-6 h-6 text-blue-400" />
          <h2 className="text-2xl font-bold text-white">{approach.name}</h2>
        </div>
        {approach.creator && (
          <p className="text-sm text-gray-400">di {approach.creator}</p>
        )}
      </div>

      <div className="space-y-2">
        {/* Philosophy */}
        <div className="border border-gray-800 rounded-lg overflow-hidden">
          <SectionHeader icon={BookOpen} title="Filosofia" section="philosophy" />
          {expandedSections.has('philosophy') && (
            <div className="p-4 bg-gray-900/30">
              <p className="text-gray-300 leading-relaxed">{approach.philosophy}</p>
            </div>
          )}
        </div>

        {/* Training Variables */}
        <div className="border border-gray-800 rounded-lg overflow-hidden">
          <SectionHeader icon={Target} title="Variabili di Allenamento" section="variables" />
          {expandedSections.has('variables') && (
            <div className="p-4 bg-gray-900/30 space-y-4">
              {/* Sets & Reps */}
              <div>
                <h4 className="text-sm font-semibold text-blue-300 mb-2">Serie e Ripetizioni</h4>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="bg-gray-800/50 p-3 rounded">
                    <div className="text-gray-400">Serie di lavoro</div>
                    <div className="text-white font-semibold">{approach.variables.setsPerExercise.working} sets</div>
                  </div>
                  <div className="bg-gray-800/50 p-3 rounded">
                    <div className="text-gray-400">Riscaldamento</div>
                    <div className="text-white font-semibold">{approach.variables.setsPerExercise.warmup}</div>
                  </div>
                  <div className="bg-gray-800/50 p-3 rounded">
                    <div className="text-gray-400">Reps composti</div>
                    <div className="text-white font-semibold">{approach.variables.repRanges.compound.join('-')} reps</div>
                  </div>
                  <div className="bg-gray-800/50 p-3 rounded">
                    <div className="text-gray-400">Reps isolamento</div>
                    <div className="text-white font-semibold">{approach.variables.repRanges.isolation.join('-')} reps</div>
                  </div>
                </div>
              </div>

              {/* RIR */}
              <div>
                <h4 className="text-sm font-semibold text-blue-300 mb-2">Target RIR (Reps In Reserve)</h4>
                <div className="grid grid-cols-3 gap-3 text-sm">
                  <div className="bg-gray-800/50 p-3 rounded">
                    <div className="text-gray-400">Normale</div>
                    <div className="text-white font-semibold">{approach.variables.rirTarget.normal} RIR</div>
                  </div>
                  <div className="bg-gray-800/50 p-3 rounded">
                    <div className="text-gray-400">Intenso</div>
                    <div className="text-white font-semibold">{approach.variables.rirTarget.intense} RIR</div>
                  </div>
                  <div className="bg-gray-800/50 p-3 rounded">
                    <div className="text-gray-400">Deload</div>
                    <div className="text-white font-semibold">{approach.variables.rirTarget.deload} RIR</div>
                  </div>
                </div>
              </div>

              {/* Rest Periods */}
              <div>
                <h4 className="text-sm font-semibold text-blue-300 mb-2">Periodi di Recupero</h4>
                <div className="space-y-2 text-sm">
                  <div className="bg-gray-800/50 p-3 rounded flex justify-between">
                    <span className="text-gray-400">Esercizi composti</span>
                    <span className="text-white font-semibold">{approach.variables.restPeriods.compound.join('-')}s</span>
                  </div>
                  <div className="bg-gray-800/50 p-3 rounded flex justify-between">
                    <span className="text-gray-400">Esercizi isolamento</span>
                    <span className="text-white font-semibold">{approach.variables.restPeriods.isolation.join('-')}s</span>
                  </div>
                  {approach.variables.restPeriods.autoRegulation && (
                    <div className="bg-blue-900/20 p-3 rounded border border-blue-500/30">
                      <div className="text-blue-300 text-xs mb-1">Autoregolazione</div>
                      <div className="text-gray-300">{approach.variables.restPeriods.autoRegulation}</div>
                    </div>
                  )}
                </div>
              </div>

              {/* Tempo */}
              {approach.variables.tempo && (
                <div>
                  <h4 className="text-sm font-semibold text-blue-300 mb-2">Tempo di Esecuzione</h4>
                  <div className="bg-gray-800/50 p-4 rounded">
                    <div className="text-center mb-2">
                      <div className="text-3xl font-mono font-bold text-white">{formatTempo(approach.variables.tempo)}</div>
                    </div>
                    <div className="grid grid-cols-4 gap-2 text-xs">
                      <div className="text-center">
                        <div className="text-blue-300 font-semibold">{approach.variables.tempo.eccentric}s</div>
                        <div className="text-gray-400">Discesa</div>
                      </div>
                      <div className="text-center">
                        <div className="text-purple-300 font-semibold">{approach.variables.tempo.pauseBottom}s</div>
                        <div className="text-gray-400">Pausa</div>
                      </div>
                      <div className="text-center">
                        <div className="text-green-300 font-semibold">{approach.variables.tempo.concentric}s</div>
                        <div className="text-gray-400">Salita</div>
                      </div>
                      <div className="text-center">
                        <div className="text-amber-300 font-semibold">{approach.variables.tempo.pauseTop}s</div>
                        <div className="text-gray-400">Contrazione</div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Frequency */}
              <div>
                <h4 className="text-sm font-semibold text-blue-300 mb-2">Frequenza di Allenamento</h4>
                <div className="space-y-2 text-sm">
                  <div className="bg-gray-800/50 p-3 rounded flex justify-between">
                    <span className="text-gray-400">Giorni per gruppo muscolare</span>
                    <span className="text-white font-semibold">{approach.variables.frequency.muscleGroupDays}x/settimana</span>
                  </div>
                  <div className="bg-blue-900/20 p-3 rounded border border-blue-500/30">
                    <div className="text-blue-300 text-xs mb-1">Pattern settimanale</div>
                    <div className="text-gray-300">{approach.variables.frequency.weeklyPattern}</div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Progression Rules */}
        <div className="border border-gray-800 rounded-lg overflow-hidden">
          <SectionHeader icon={TrendingUp} title="Regole di Progressione" section="progression" />
          {expandedSections.has('progression') && (
            <div className="p-4 bg-gray-900/30 space-y-4">
              <div className="bg-gray-800/50 p-3 rounded">
                <div className="text-gray-400 text-sm mb-1">Priorità</div>
                <div className="text-white font-semibold capitalize">{approach.progression.priority.replace('_', ' ')}</div>
              </div>
              <div className="bg-blue-900/20 p-3 rounded border border-blue-500/30">
                <div className="text-blue-300 text-sm mb-2">Quando aumentare il peso</div>
                <div className="text-gray-300">{approach.progression.rules.whenToAddWeight}</div>
              </div>
              <div className="bg-blue-900/20 p-3 rounded border border-blue-500/30">
                <div className="text-blue-300 text-sm mb-2">Strategia progressione serie</div>
                <div className="text-gray-300 mb-1">{approach.progression.setProgression.strategy.replace(/_/g, ' ')}</div>
                <div className="text-gray-400 text-sm">{approach.progression.setProgression.conditions}</div>
              </div>
              {approach.progression.rules.deloadTriggers && approach.progression.rules.deloadTriggers.length > 0 && (
                <div className="bg-amber-900/20 p-3 rounded border border-amber-500/30">
                  <div className="text-amber-300 text-sm mb-2">⚠️ Trigger per Deload</div>
                  <ul className="list-disc list-inside text-gray-300 text-sm space-y-1">
                    {approach.progression.rules.deloadTriggers.map((trigger, idx) => (
                      <li key={idx}>{trigger}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Volume Landmarks */}
        {approach.volumeLandmarks && (
          <div className="border border-gray-800 rounded-lg overflow-hidden">
            <SectionHeader icon={Target} title="Volume Landmarks (MEV/MAV/MRV)" section="volume" />
            {expandedSections.has('volume') && (
              <div className="p-4 bg-gray-900/30">
                <div className="mb-3 p-3 bg-blue-900/20 rounded border border-blue-500/30">
                  <div className="text-xs text-gray-400 space-y-1">
                    <div><span className="text-green-300 font-semibold">MEV</span> = Minimum Effective Volume (minimo per crescita)</div>
                    <div><span className="text-blue-300 font-semibold">MAV</span> = Maximum Adaptive Volume (range ottimale)</div>
                    <div><span className="text-red-300 font-semibold">MRV</span> = Maximum Recoverable Volume (massimo recuperabile)</div>
                  </div>
                </div>
                <div className="grid gap-3">
                  {Object.entries(approach.volumeLandmarks.muscleGroups).map(([muscle, landmarks]) => (
                    <div key={muscle} className="bg-gray-800/50 p-3 rounded">
                      <div className="text-white font-semibold mb-2 capitalize">{muscle}</div>
                      <div className="flex gap-3 text-sm">
                        <div className="flex-1 bg-green-900/30 p-2 rounded border border-green-500/30">
                          <div className="text-green-300 text-xs">MEV</div>
                          <div className="text-white font-semibold">{landmarks.mev} sets/week</div>
                        </div>
                        <div className="flex-1 bg-blue-900/30 p-2 rounded border border-blue-500/30">
                          <div className="text-blue-300 text-xs">MAV</div>
                          <div className="text-white font-semibold">{landmarks.mav} sets/week</div>
                        </div>
                        <div className="flex-1 bg-red-900/30 p-2 rounded border border-red-500/30">
                          <div className="text-red-300 text-xs">MRV</div>
                          <div className="text-white font-semibold">{landmarks.mrv} sets/week</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Advanced Techniques */}
        {approach.advancedTechniques && Object.keys(approach.advancedTechniques).length > 0 && (
          <div className="border border-gray-800 rounded-lg overflow-hidden">
            <SectionHeader icon={Zap} title="Tecniche Avanzate" section="advanced" />
            {expandedSections.has('advanced') && (
              <div className="p-4 bg-gray-900/30 space-y-3">
                {Object.entries(approach.advancedTechniques).map(([name, technique]) => (
                  <div key={name} className="bg-gray-800/50 p-3 rounded">
                    <h4 className="text-white font-semibold mb-2 capitalize">{name.replace(/_/g, ' ')}</h4>
                    <div className="space-y-2 text-sm">
                      {technique.when && (
                        <div className="text-gray-300">
                          <span className="text-blue-300">Quando:</span> {technique.when}
                        </div>
                      )}
                      {technique.protocol && (
                        <div className="text-gray-300">
                          <span className="text-blue-300">Protocollo:</span> {technique.protocol}
                        </div>
                      )}
                      {technique.frequency && (
                        <div className="text-gray-300">
                          <span className="text-blue-300">Frequenza:</span> {technique.frequency}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Periodization */}
        {approach.periodization && (
          <div className="border border-gray-800 rounded-lg overflow-hidden">
            <SectionHeader icon={Calendar} title="Modello di Periodizzazione" section="periodization" />
            {expandedSections.has('periodization') && (
              <div className="p-4 bg-gray-900/30 space-y-4">
                {approach.periodization.mesocycleLength && (
                  <div className="bg-gray-800/50 p-3 rounded flex justify-between">
                    <span className="text-gray-400">Lunghezza mesociclo</span>
                    <span className="text-white font-semibold">{approach.periodization.mesocycleLength} settimane</span>
                  </div>
                )}

                {approach.periodization.accumulationPhase && (
                  <div className="bg-green-900/20 p-3 rounded border border-green-500/30">
                    <h4 className="text-green-300 font-semibold mb-2">Fase di Accumulazione</h4>
                    <div className="text-sm space-y-1">
                      <div className="text-gray-300">Durata: {approach.periodization.accumulationPhase.weeks} settimane</div>
                      <div className="text-gray-300">Focus: {approach.periodization.accumulationPhase.focus}</div>
                      <div className="text-gray-300">Volume: {(approach.periodization.accumulationPhase.volumeMultiplier * 100)}% della baseline</div>
                    </div>
                  </div>
                )}

                {approach.periodization.intensificationPhase && (
                  <div className="bg-orange-900/20 p-3 rounded border border-orange-500/30">
                    <h4 className="text-orange-300 font-semibold mb-2">Fase di Intensificazione</h4>
                    <div className="text-sm space-y-1">
                      <div className="text-gray-300">Durata: {approach.periodization.intensificationPhase.weeks} settimane</div>
                      <div className="text-gray-300">Focus: {approach.periodization.intensificationPhase.focus}</div>
                      <div className="text-gray-300">Volume: {(approach.periodization.intensificationPhase.volumeMultiplier * 100)}% della baseline</div>
                      {approach.periodization.intensificationPhase.techniquesIntroduced && (
                        <div className="text-gray-300 mt-2">
                          <span className="text-orange-300">Tecniche introdotte:</span>
                          <div className="ml-4 mt-1">
                            {approach.periodization.intensificationPhase.techniquesIntroduced.join(', ')}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {approach.periodization.deloadPhase && (
                  <div className="bg-blue-900/20 p-3 rounded border border-blue-500/30">
                    <h4 className="text-blue-300 font-semibold mb-2">Fase di Deload</h4>
                    <div className="text-sm space-y-1">
                      <div className="text-gray-300">Frequenza: {approach.periodization.deloadPhase.frequency}</div>
                      <div className="text-gray-300">Riduzione volume: {approach.periodization.deloadPhase.volumeReduction}%</div>
                      <div className="text-gray-300">Intensità: {approach.periodization.deloadPhase.intensityMaintenance}</div>
                      <div className="text-gray-300">Durata: {approach.periodization.deloadPhase.duration}</div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </Card>
  )
}
