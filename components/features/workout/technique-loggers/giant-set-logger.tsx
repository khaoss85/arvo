'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Dumbbell, Check } from 'lucide-react'
import type { GiantSetConfig, TechniqueExecutionResult } from '@/lib/types/advanced-techniques'

interface GiantSetLoggerProps {
  config: GiantSetConfig
  initialWeight: number
  onComplete: (result: TechniqueExecutionResult) => void
  onCancel: () => void
}

export function GiantSetLogger({
  config,
  onComplete,
  onCancel,
}: GiantSetLoggerProps) {
  const [isCompleting, setIsCompleting] = useState(false)

  const exerciseCount = config.exerciseIndices.length

  const handleComplete = () => {
    setIsCompleting(true)

    const result: TechniqueExecutionResult = {
      technique: 'giant_set',
      config,
      completedFully: true,
    }

    onComplete(result)
  }

  return (
    <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center gap-2 text-amber-400">
        <Dumbbell className="h-5 w-5" />
        <span className="font-semibold">Giant Set</span>
        <span className="text-sm text-gray-400">
          ({exerciseCount} esercizi)
        </span>
      </div>

      {/* Instructions */}
      <div className="text-sm text-gray-400">
        Nessun riposo tra gli esercizi!
        <span className="block mt-1 text-amber-300">
          Rest dopo tutti: {config.restAfterAll}s
        </span>
      </div>

      {/* Action buttons */}
      <div className="flex gap-2 pt-2">
        <Button
          variant="outline"
          onClick={onCancel}
          className="flex-1"
          size="sm"
        >
          Cancel
        </Button>
        <Button
          onClick={handleComplete}
          disabled={isCompleting}
          className="flex-1 bg-green-600 hover:bg-green-700"
          size="sm"
        >
          <Check className="h-4 w-4 mr-1" />
          Complete
        </Button>
      </div>
    </div>
  )
}
