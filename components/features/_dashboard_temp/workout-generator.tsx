'use client'

import { useGenerateWorkout } from '@/lib/hooks/useAI'
import { Button } from '@/components/ui/button'
import { useRouter } from 'next/navigation'

interface WorkoutGeneratorProps {
  userId: string
}

export function WorkoutGenerator({ userId }: WorkoutGeneratorProps) {
  const router = useRouter()
  const { mutate: generateWorkout, isPending, isError, error } = useGenerateWorkout()

  const handleGenerate = () => {
    generateWorkout(userId, {
      onSuccess: (workout) => {
        // Refresh the page to show the new workout
        router.refresh()
      }
    })
  }

  return (
    <div className="bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-700 dark:to-purple-700 rounded-lg p-6 text-white">
      <h2 className="text-2xl font-bold mb-2">AI Workout Generator</h2>
      <p className="mb-4 text-blue-100 dark:text-blue-200">
        Generate a personalized workout based on your training approach, weak points, and equipment preferences.
      </p>

      {isError && (
        <div className="mb-4 p-3 bg-red-500/20 border border-red-300 dark:border-red-700 rounded text-sm">
          <p className="font-medium">Failed to generate workout</p>
          <p className="text-red-100 dark:text-red-200">
            {error instanceof Error ? error.message : 'An error occurred'}
          </p>
        </div>
      )}

      <Button
        onClick={handleGenerate}
        disabled={isPending}
        className="bg-white text-blue-600 hover:bg-blue-50 dark:bg-gray-900 dark:text-blue-400 dark:hover:bg-gray-800 font-medium"
      >
        {isPending ? (
          <>
            <span className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 dark:border-blue-400 mr-2"></span>
            Generating workout...
          </>
        ) : (
          <>
            <svg
              className="w-5 h-5 mr-2 inline-block"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 10V3L4 14h7v7l9-11h-7z"
              />
            </svg>
            Generate Today's Workout
          </>
        )}
      </Button>

      {isPending && (
        <p className="mt-3 text-sm text-blue-100 dark:text-blue-200">
          The AI is selecting exercises and calculating optimal sets/reps for you...
        </p>
      )}
    </div>
  )
}
