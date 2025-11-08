'use client'

import { useState } from 'react'
import { useWorkoutExecutionStore } from '@/lib/stores/workout-execution.store'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

interface SetLoggerProps {
  exerciseId: string
  setNumber: number
  targetWeight: number
  suggestion?: {
    weight: number
    reps: number
    rirTarget: number
  }
}

export function SetLogger({ exerciseId, setNumber, targetWeight, suggestion }: SetLoggerProps) {
  const { logSet } = useWorkoutExecutionStore()
  const [weight, setWeight] = useState(suggestion?.weight || targetWeight)
  const [reps, setReps] = useState(suggestion?.reps || 8)
  const [rir, setRir] = useState(suggestion?.rirTarget || 1)
  const [isLogging, setIsLogging] = useState(false)

  const handleLogSet = async () => {
    setIsLogging(true)
    try {
      await logSet({ weight, reps, rir })
    } catch (error) {
      console.error('Failed to log set:', error)
      alert('Failed to log set. Please try again.')
    } finally {
      setIsLogging(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="text-center mb-4">
        <h3 className="text-lg font-medium text-white">Log Set {setNumber}</h3>
      </div>

      {/* Weight Input */}
      <div>
        <label className="block text-sm text-gray-400 mb-2">Weight (kg)</label>
        <div className="flex items-center gap-2">
          <Button
            onClick={() => setWeight(Math.max(0, weight - 2.5))}
            className="w-12 h-12 bg-gray-800 hover:bg-gray-700"
          >
            -2.5
          </Button>
          <Input
            type="number"
            value={weight}
            onChange={(e) => setWeight(parseFloat(e.target.value) || 0)}
            className="flex-1 text-center text-lg h-12 bg-gray-800 border-gray-700 text-white"
            step="0.5"
          />
          <Button
            onClick={() => setWeight(weight + 2.5)}
            className="w-12 h-12 bg-gray-800 hover:bg-gray-700"
          >
            +2.5
          </Button>
        </div>
      </div>

      {/* Reps Input */}
      <div>
        <label className="block text-sm text-gray-400 mb-2">Reps</label>
        <div className="flex items-center gap-2">
          <Button
            onClick={() => setReps(Math.max(1, reps - 1))}
            className="w-12 h-12 bg-gray-800 hover:bg-gray-700"
          >
            -1
          </Button>
          <Input
            type="number"
            value={reps}
            onChange={(e) => setReps(parseInt(e.target.value) || 0)}
            className="flex-1 text-center text-lg h-12 bg-gray-800 border-gray-700 text-white"
          />
          <Button
            onClick={() => setReps(reps + 1)}
            className="w-12 h-12 bg-gray-800 hover:bg-gray-700"
          >
            +1
          </Button>
        </div>
      </div>

      {/* RIR Selector */}
      <div>
        <label className="block text-sm text-gray-400 mb-2">RIR (Reps in Reserve)</label>
        <div className="grid grid-cols-6 gap-2">
          {[0, 1, 2, 3, 4, 5].map((value) => (
            <button
              key={value}
              onClick={() => setRir(value)}
              className={`h-12 rounded font-medium transition-colors ${
                rir === value
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
              }`}
            >
              {value}
            </button>
          ))}
        </div>
      </div>

      {/* Log Button */}
      <Button
        onClick={handleLogSet}
        disabled={isLogging}
        className="w-full h-14 text-lg bg-green-600 hover:bg-green-700 text-white font-medium"
      >
        {isLogging ? 'Logging...' : 'Log Set'}
      </Button>
    </div>
  )
}
