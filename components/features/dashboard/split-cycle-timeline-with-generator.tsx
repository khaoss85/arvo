'use client'

import { useGenerateWorkout } from '@/lib/hooks/useAI'
import { useRouter } from 'next/navigation'
import { SplitCycleTimeline } from './split-cycle-timeline'

interface SplitCycleTimelineWithGeneratorProps {
  userId: string
}

export function SplitCycleTimelineWithGenerator({ userId }: SplitCycleTimelineWithGeneratorProps) {
  const router = useRouter()
  const { mutate: generateWorkout, isPending } = useGenerateWorkout()

  const handleGenerateWorkout = () => {
    generateWorkout(userId, {
      onSuccess: (workout) => {
        // Redirect to the newly generated workout
        if (workout?.id) {
          router.push(`/workout/${workout.id}`)
        }
      }
    })
  }

  return (
    <>
      <SplitCycleTimeline
        userId={userId}
        onGenerateWorkout={isPending ? undefined : handleGenerateWorkout}
      />

      {/* Loading overlay when generating */}
      {isPending && (
        <div className="mt-4 p-4 bg-purple-50 dark:bg-purple-950 border border-purple-200 dark:border-purple-800 rounded-lg">
          <div className="flex items-center gap-3">
            <div className="inline-block animate-spin rounded-full h-5 w-5 border-b-2 border-purple-600"></div>
            <div>
              <p className="font-medium text-purple-900 dark:text-purple-100">
                Generating your workout...
              </p>
              <p className="text-sm text-purple-700 dark:text-purple-300">
                AI is selecting exercises and calculating optimal sets/reps for you
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
