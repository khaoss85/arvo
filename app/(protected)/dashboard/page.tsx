import { redirect } from "next/navigation";
import Link from "next/link";
import { getUser } from "@/lib/utils/auth.server";
import { UserProfileService } from "@/lib/services/user-profile.service";
import { WorkoutService } from "@/lib/services/workout.service";
import { WorkoutGenerator } from "@/components/features/dashboard/workout-generator";
import { Button } from "@/components/ui/button";
import {
  inferWorkoutType,
  getWorkoutTypeColor,
  getWorkoutTypeIcon,
  type WorkoutType
} from "@/lib/services/muscle-groups.service";

export default async function DashboardPage() {
  const user = await getUser();

  if (!user) {
    redirect("/login");
  }

  // Check if user has completed onboarding
  const profile = await UserProfileService.getByUserIdServer(user.id);
  if (!profile) {
    redirect("/onboarding/approach");
  }

  // Get user's workouts
  const workouts = await WorkoutService.getByUserIdServer(user.id);
  const inProgressWorkout = await WorkoutService.getInProgressWorkoutServer(user.id);
  const upcomingWorkouts = workouts.filter(w => !w.completed).slice(0, 5);
  const completedWorkouts = workouts.filter(w => w.completed).slice(0, 5);

  return (
    <div className="min-h-screen p-4 sm:p-8 bg-gray-50 dark:bg-gray-950">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold sm:text-4xl">Dashboard</h1>
              <p className="mt-2 text-gray-600 dark:text-gray-400">
                Welcome back, {user.email}!
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Link
                href="/settings"
                className="flex items-center gap-2 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-medium transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                Settings
              </Link>
              <Link
                href="/progress"
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                View Progress
              </Link>
            </div>
          </div>
        </div>

        {/* Workout Generator Section */}
        <div className="mb-8">
          <WorkoutGenerator userId={user.id} />
        </div>

        {/* In-Progress Workout Banner */}
        {inProgressWorkout && (
          <div className="mb-8 bg-gradient-to-r from-orange-500 to-red-600 rounded-lg p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold mb-2">Workout In Progress</h3>
                <p className="text-sm text-white/90">
                  {(inProgressWorkout.exercises as any[])?.length || 0} exercises • Started recently
                </p>
              </div>
              <Link href={`/workout/${inProgressWorkout.id}`}>
                <Button className="bg-white text-orange-600 hover:bg-gray-100 font-medium">
                  Resume Workout
                </Button>
              </Link>
            </div>
          </div>
        )}

        {/* Upcoming Workouts */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-4">Upcoming Workouts</h2>
          {upcomingWorkouts.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {upcomingWorkouts.map((workout) => {
                const exercises = (workout.exercises as any[]) || [];
                const isInProgress = inProgressWorkout?.id === workout.id;
                const estimatedDuration = exercises.length * 10; // ~10 min per exercise estimate

                // Get workout type (from DB or infer from exercises)
                const workoutType = (workout.workout_type as WorkoutType) || inferWorkoutType(exercises);
                const workoutTypeColor = getWorkoutTypeColor(workoutType);
                const workoutTypeIcon = getWorkoutTypeIcon(workoutType);
                const workoutName = workout.workout_name;
                const muscleGroups = workout.target_muscle_groups || [];

                // Color mapping for borders and badges
                const typeColorClasses: Record<string, { border: string; badge: string; button: string }> = {
                  red: {
                    border: 'border-red-300 dark:border-red-700',
                    badge: 'bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300',
                    button: 'bg-red-600 hover:bg-red-700'
                  },
                  blue: {
                    border: 'border-blue-300 dark:border-blue-700',
                    badge: 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300',
                    button: 'bg-blue-600 hover:bg-blue-700'
                  },
                  green: {
                    border: 'border-green-300 dark:border-green-700',
                    badge: 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300',
                    button: 'bg-green-600 hover:bg-green-700'
                  },
                  orange: {
                    border: 'border-orange-300 dark:border-orange-700',
                    badge: 'bg-orange-100 dark:bg-orange-900 text-orange-700 dark:text-orange-300',
                    button: 'bg-orange-600 hover:bg-orange-700'
                  },
                  purple: {
                    border: 'border-purple-300 dark:border-purple-700',
                    badge: 'bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300',
                    button: 'bg-purple-600 hover:bg-purple-700'
                  },
                  yellow: {
                    border: 'border-yellow-300 dark:border-yellow-700',
                    badge: 'bg-yellow-100 dark:bg-yellow-900 text-yellow-700 dark:text-yellow-300',
                    button: 'bg-yellow-600 hover:bg-yellow-700'
                  },
                  gray: {
                    border: 'border-gray-300 dark:border-gray-700',
                    badge: 'bg-gray-100 dark:bg-gray-900 text-gray-700 dark:text-gray-300',
                    button: 'bg-gray-600 hover:bg-gray-700'
                  }
                };

                const colors = typeColorClasses[workoutTypeColor] || typeColorClasses.gray;

                return (
                  <div
                    key={workout.id}
                    className={`bg-white dark:bg-gray-900 rounded-lg border-2 p-5 transition-all ${
                      isInProgress
                        ? 'border-orange-500 dark:border-orange-500 shadow-lg'
                        : `${colors.border} hover:shadow-md`
                    }`}
                  >
                    {/* Header with Date and Status */}
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        {workout.planned_at ? new Date(workout.planned_at).toLocaleDateString() : 'No date'}
                      </span>
                      <span className={`px-2 py-1 text-xs font-medium rounded ${
                        isInProgress
                          ? 'bg-orange-100 dark:bg-orange-900 text-orange-700 dark:text-orange-300'
                          : colors.badge
                      }`}>
                        {isInProgress ? 'In Progress' : 'Upcoming'}
                      </span>
                    </div>

                    {/* Workout Type Badge */}
                    <div className="mb-3">
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-semibold rounded-md ${colors.badge}`}>
                        <span>{workoutTypeIcon}</span>
                        <span>{workoutName || workoutType.toUpperCase()}</span>
                      </span>
                    </div>

                    {/* Muscle Groups Tags */}
                    {muscleGroups.length > 0 && (
                      <div className="mb-3 flex flex-wrap gap-1.5">
                        {muscleGroups.slice(0, 3).map((group, idx) => (
                          <span
                            key={idx}
                            className="px-2 py-0.5 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 text-xs rounded"
                          >
                            {group}
                          </span>
                        ))}
                        {muscleGroups.length > 3 && (
                          <span className="px-2 py-0.5 bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-500 text-xs rounded">
                            +{muscleGroups.length - 3}
                          </span>
                        )}
                      </div>
                    )}

                    {/* Exercise Count and Duration */}
                    <div className="mb-4">
                      <p className="text-sm text-gray-700 dark:text-gray-300 mb-1">
                        {exercises.length} {exercises.length === 1 ? 'exercise' : 'exercises'}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-500">
                        ~{estimatedDuration} min estimated
                      </p>
                    </div>

                    {/* Exercise Preview */}
                    {exercises.length > 0 && (
                      <div className="mb-4 space-y-1">
                        {exercises.slice(0, 3).map((ex: any, idx: number) => (
                          <div key={idx} className="text-xs text-gray-600 dark:text-gray-400 truncate">
                            • {ex.name || ex.exercise_name || 'Exercise'}
                          </div>
                        ))}
                        {exercises.length > 3 && (
                          <div className="text-xs text-gray-500 dark:text-gray-500">
                            +{exercises.length - 3} more
                          </div>
                        )}
                      </div>
                    )}

                    <Link href={`/workout/${workout.id}`} className="block">
                      <Button className={`w-full ${isInProgress ? 'bg-orange-600 hover:bg-orange-700' : colors.button} text-white`}>
                        {isInProgress ? 'Resume' : 'Start Workout'}
                      </Button>
                    </Link>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 p-8 text-center">
              <p className="text-gray-600 dark:text-gray-400">
                No upcoming workouts. Generate your next workout above!
              </p>
            </div>
          )}
        </div>

        {/* Recent Completed Workouts */}
        <div>
          <h2 className="text-2xl font-bold mb-4">Recent Completed Workouts</h2>
          {completedWorkouts.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {completedWorkouts.map((workout) => {
                const exercises = (workout.exercises as any[]) || [];

                // Get workout type (from DB or infer from exercises)
                const workoutType = (workout.workout_type as WorkoutType) || inferWorkoutType(exercises);
                const workoutTypeIcon = getWorkoutTypeIcon(workoutType);
                const workoutName = workout.workout_name;
                const muscleGroups = workout.target_muscle_groups || [];

                return (
                  <div
                    key={workout.id}
                    className="bg-white dark:bg-gray-900 rounded-lg border-2 border-gray-200 dark:border-gray-700 p-5 hover:border-gray-300 dark:hover:border-gray-600 hover:shadow-md transition-all opacity-90"
                  >
                    {/* Header with Date and Status */}
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        {workout.planned_at
                          ? new Date(workout.planned_at).toLocaleDateString()
                          : 'No date'}
                      </span>
                      <span className="px-2 py-1 bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 text-xs font-medium rounded">
                        Completed
                      </span>
                    </div>

                    {/* Workout Type Badge */}
                    <div className="mb-3">
                      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-semibold rounded-md bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300">
                        <span>{workoutTypeIcon}</span>
                        <span>{workoutName || workoutType.toUpperCase()}</span>
                      </span>
                    </div>

                    {/* Muscle Groups Tags */}
                    {muscleGroups.length > 0 && (
                      <div className="mb-3 flex flex-wrap gap-1.5">
                        {muscleGroups.slice(0, 3).map((group, idx) => (
                          <span
                            key={idx}
                            className="px-2 py-0.5 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 text-xs rounded"
                          >
                            {group}
                          </span>
                        ))}
                        {muscleGroups.length > 3 && (
                          <span className="px-2 py-0.5 bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-500 text-xs rounded">
                            +{muscleGroups.length - 3}
                          </span>
                        )}
                      </div>
                    )}

                    <div className="mb-3">
                      <p className="text-sm text-gray-700 dark:text-gray-300 mb-1">
                        {exercises.length} {exercises.length === 1 ? 'exercise' : 'exercises'}
                      </p>
                      {workout.duration_seconds && (
                        <p className="text-xs text-gray-500 dark:text-gray-500">
                          Duration: {Math.round(workout.duration_seconds / 60)} min
                        </p>
                      )}
                    </div>

                    {/* Exercise Preview */}
                    {exercises.length > 0 && (
                      <div className="space-y-1">
                        {exercises.slice(0, 3).map((ex: any, idx: number) => (
                          <div key={idx} className="text-xs text-gray-600 dark:text-gray-400 truncate">
                            • {ex.name || ex.exercise_name || 'Exercise'}
                          </div>
                        ))}
                        {exercises.length > 3 && (
                          <div className="text-xs text-gray-500 dark:text-gray-500">
                            +{exercises.length - 3} more
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 p-8 text-center">
              <p className="text-gray-600 dark:text-gray-400">
                No completed workouts yet. Complete your first workout to see it here!
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
