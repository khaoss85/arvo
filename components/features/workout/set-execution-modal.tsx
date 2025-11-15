'use client'

/**
 * SetExecutionModal
 *
 * Full-screen modal for guided set execution with audio + visual cues.
 * Coordinates with RealtimeTempoCoachingService to provide synchronized
 * tempo-based guidance during workout sets.
 */

import { useEffect, useState, useCallback } from 'react'
import { X, Pause, Play, SkipForward, Square } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { RealtimeTempoIndicator } from './realtime-tempo-indicator'
import { realtimeTempoCoachingService, type SetExecutionState } from '@/lib/services/realtime-tempo-coaching.service'
import { tempoParserService } from '@/lib/services/tempo-parser.service'
import { AudioScriptGeneratorAgent, type RealtimeCuePools } from '@/lib/agents/audio-script-generator.agent'
import { cuePoolCacheService } from '@/lib/services/cue-pool-cache.service'

interface SetExecutionModalProps {
  isOpen: boolean
  onClose: () => void
  exerciseName: string
  tempo: string
  targetReps: number
  targetWeight: number
  setNumber: number
  language?: 'en' | 'it'
  onSetComplete: (actualReps: number) => void
}

export function SetExecutionModal({
  isOpen,
  onClose,
  exerciseName,
  tempo,
  targetReps,
  targetWeight,
  setNumber,
  language = 'en',
  onSetComplete,
}: SetExecutionModalProps) {
  const [executionState, setExecutionState] = useState<SetExecutionState | null>(null)
  const [isStarting, setIsStarting] = useState(false)
  const [showCompletionDialog, setShowCompletionDialog] = useState(false)
  const [actualReps, setActualReps] = useState(targetReps)

  // Subscribe to execution state changes
  useEffect(() => {
    if (!isOpen) {
      return
    }

    const unsubscribe = realtimeTempoCoachingService.onStateChange((state) => {
      setExecutionState(state)

      // Show completion dialog when set finishes
      if (!state.isActive && state.completedReps > 0 && !showCompletionDialog) {
        setShowCompletionDialog(true)
        setActualReps(state.completedReps)
      }
    })

    return () => {
      unsubscribe()
    }
  }, [isOpen, showCompletionDialog])

  // Start set when modal opens
  useEffect(() => {
    if (isOpen && !isStarting) {
      setIsStarting(true)
      setShowCompletionDialog(false)

      // Generate AI cue pools and start set
      const startSetWithPools = async () => {
        try {
          let cuePools: RealtimeCuePools | null = null

          // Check cache first
          cuePools = cuePoolCacheService.get(exerciseName, language)

          // Generate new pools if not cached
          if (!cuePools) {
            console.log('[SetExecution] Cache miss, generating AI cue pools...')
            const agent = new AudioScriptGeneratorAgent()

            cuePools = await agent.generateRealtimeCuePools({
              exerciseName,
              setNumber,
              targetReps,
              tempo,
              setType: 'working', // TODO: determine from props if needed
              language,
            })

            // Cache the generated pools
            cuePoolCacheService.set(exerciseName, language, cuePools)
            console.log('[SetExecution] AI pools generated and cached')
          } else {
            console.log('[SetExecution] Using cached AI pools')
          }

          // Start set with AI-generated pools
          realtimeTempoCoachingService.startSet({
            tempo,
            targetReps,
            exerciseName,
            language,
            setNumber,
            cuePools, // Pass AI-generated pools (cached or fresh)
          })
        } catch (error) {
          console.error('[SetExecution] Failed to generate AI pools, falling back to default:', error)

          // Fallback: Start without pools (uses hardcoded cues)
          realtimeTempoCoachingService.startSet({
            tempo,
            targetReps,
            exerciseName,
            language,
            setNumber,
          })
        } finally {
          setIsStarting(false)
        }
      }

      // Small delay before starting for UX, then generate and start
      setTimeout(() => {
        startSetWithPools()
      }, 500)
    }
  }, [isOpen, tempo, targetReps, exerciseName, language, setNumber, isStarting])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (executionState?.isActive) {
        realtimeTempoCoachingService.stopSet()
      }
    }
  }, [executionState?.isActive])

  const handlePauseResume = useCallback(() => {
    if (!executionState) return

    if (executionState.isPaused) {
      realtimeTempoCoachingService.resumeSet()
    } else {
      realtimeTempoCoachingService.pauseSet()
    }
  }, [executionState])

  const handleSkipRep = useCallback(() => {
    realtimeTempoCoachingService.skipToNextRep()
  }, [])

  const handleStop = useCallback(() => {
    if (executionState?.isActive) {
      // Confirm stop
      if (
        window.confirm(
          language === 'it'
            ? `Sei sicuro di voler fermare la serie? Hai completato ${executionState.completedReps} ripetizioni.`
            : `Are you sure you want to stop the set? You completed ${executionState.completedReps} reps.`
        )
      ) {
        realtimeTempoCoachingService.stopSet()
        setShowCompletionDialog(true)
        setActualReps(executionState.completedReps)
      }
    }
  }, [executionState, language])

  const handleClose = useCallback(() => {
    if (executionState?.isActive && !showCompletionDialog) {
      // Warn user about closing during active set
      if (
        window.confirm(
          language === 'it'
            ? 'Sei sicuro? Serie in corso!'
            : 'Are you sure? Set in progress!'
        )
      ) {
        realtimeTempoCoachingService.stopSet()
        onClose()
      }
    } else {
      onClose()
    }
  }, [executionState, showCompletionDialog, language, onClose])

  const handleConfirmReps = useCallback(() => {
    onSetComplete(actualReps)
    onClose()
  }, [actualReps, onSetComplete, onClose])

  // Calculate phase progress
  const getPhaseProgress = (): number => {
    if (!executionState || executionState.currentPhase === 'idle') {
      return 0
    }

    // Parse tempo to get rep duration
    const tempoData = tempoParserService.parseTempo(tempo)
    if (!tempoData) {
      return 0
    }

    // Calculate time elapsed within current rep
    const elapsedInRep = executionState.elapsedSeconds % tempoData.totalRepDuration

    // Get detailed phase info including progress percentage
    const phaseInfo = tempoParserService.getPhaseAtTime(
      tempo,
      executionState.currentRep,
      targetReps,
      elapsedInRep
    )

    return phaseInfo?.percentComplete ?? 0
  }

  if (!isOpen) {
    return null
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl h-screen sm:h-auto p-0 gap-0">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              {language === 'it' ? 'Serie' : 'Set'} {setNumber} - {exerciseName}
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              {targetWeight}kg × {targetReps} {language === 'it' ? 'reps' : 'reps'}
            </p>
          </div>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
          >
            <X className="h-6 w-6 text-gray-600 dark:text-gray-400" />
          </button>
        </div>

        {/* Main Content */}
        <div className="flex-1 overflow-y-auto">
          {isStarting ? (
            <div className="flex items-center justify-center min-h-[400px]">
              <div className="text-center space-y-4">
                <div className="text-4xl animate-pulse">
                  {language === 'it' ? 'Preparati...' : 'Get ready...'}
                </div>
              </div>
            </div>
          ) : showCompletionDialog ? (
            /* Completion Dialog */
            <div className="flex items-center justify-center min-h-[400px] p-6">
              <div className="text-center space-y-6 max-w-md">
                <div className="text-6xl">🎉</div>
                <div>
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                    {language === 'it' ? 'Serie Completata!' : 'Set Complete!'}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    {language === 'it'
                      ? `Hai completato ${actualReps} ripetizioni?`
                      : `You completed ${actualReps} reps?`}
                  </p>
                </div>

                {/* Adjust Reps */}
                <div className="space-y-3">
                  <label className="text-sm text-gray-600 dark:text-gray-400">
                    {language === 'it' ? 'Modifica se necessario' : 'Adjust if needed'}
                  </label>
                  <div className="flex items-center justify-center gap-3">
                    <Button
                      onClick={() => setActualReps(Math.max(1, actualReps - 1))}
                      variant="outline"
                      size="sm"
                    >
                      -1
                    </Button>
                    <span className="text-3xl font-bold text-gray-900 dark:text-white w-16 text-center">
                      {actualReps}
                    </span>
                    <Button
                      onClick={() => setActualReps(actualReps + 1)}
                      variant="outline"
                      size="sm"
                    >
                      +1
                    </Button>
                  </div>
                </div>

                <Button onClick={handleConfirmReps} className="w-full h-14 text-lg" size="lg">
                  {language === 'it' ? 'Conferma e Continua' : 'Confirm & Continue'}
                </Button>
              </div>
            </div>
          ) : executionState ? (
            /* Active Set Execution */
            <div className="p-6 space-y-8">
              <RealtimeTempoIndicator
                currentRep={executionState.currentRep}
                totalReps={targetReps}
                currentPhase={executionState.currentPhase}
                phaseProgress={getPhaseProgress()}
                tempo={tempo}
                isPaused={executionState.isPaused}
                language={language}
              />
            </div>
          ) : null}
        </div>

        {/* Control Buttons (only show during active execution) */}
        {!isStarting && !showCompletionDialog && executionState?.isActive && (
          <div className="p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
            <div className="grid grid-cols-3 gap-4">
              <Button
                onClick={handlePauseResume}
                variant="outline"
                className="h-14 text-base"
                disabled={!executionState}
              >
                {executionState?.isPaused ? (
                  <>
                    <Play className="mr-2 h-5 w-5" />
                    {language === 'it' ? 'Riprendi' : 'Resume'}
                  </>
                ) : (
                  <>
                    <Pause className="mr-2 h-5 w-5" />
                    {language === 'it' ? 'Pausa' : 'Pause'}
                  </>
                )}
              </Button>

              <Button
                onClick={handleSkipRep}
                variant="outline"
                className="h-14 text-base"
                disabled={!executionState || executionState.isPaused}
              >
                <SkipForward className="mr-2 h-5 w-5" />
                {language === 'it' ? 'Salta Rep' : 'Skip Rep'}
              </Button>

              <Button
                onClick={handleStop}
                variant="outline"
                className="h-14 text-base text-red-600 hover:bg-red-50 dark:hover:bg-red-950"
                disabled={!executionState}
              >
                <Square className="mr-2 h-5 w-5" />
                {language === 'it' ? 'Ferma' : 'Stop'}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
