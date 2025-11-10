import { redirect } from "next/navigation";
import Link from "next/link";
import { getUser } from "@/lib/utils/auth.server";
import { UserProfileService } from "@/lib/services/user-profile.service";
import { WorkoutService } from "@/lib/services/workout.service";
import { SplitCycleTimelineWithGenerator } from "@/components/features/dashboard/split-cycle-timeline-with-generator";
import { Button } from "@/components/ui/button";
import {
  inferWorkoutType,
  getWorkoutTypeIcon,
  type WorkoutType
} from "@/lib/services/muscle-groups.service";

// Constants for dashboard display
const MAX_RECENT_WORKOUTS = 6;
const MAX_VISIBLE_MUSCLE_GROUPS = 3;

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
  const completedWorkouts = workouts.filter(w => w.completed).slice(0, MAX_RECENT_WORKOUTS);

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

        {/* Split Cycle Timeline - Shows complete split programming */}
        <div className="mb-8">
          <SplitCycleTimelineWithGenerator userId={user.id} />
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

        {/* Recent Completed Workouts */}
        <section aria-labelledby="recent-activity-heading">
          <div className="flex items-center justify-between mb-4">
            <h2 id="recent-activity-heading" className="text-2xl font-bold">Recent Activity</h2>
            <Link
              href="/progress"
              className="text-sm font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 flex items-center gap-1"
            >
              View All History
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>

          {completedWorkouts.length > 0 ? (
            <ul role="list" className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 divide-y divide-gray-200 dark:divide-gray-700">
              {completedWorkouts.map((workout) => {
                const exercises = Array.isArray(workout.exercises) ? (workout.exercises as Array<{ name: string; completedSets?: any; sets?: any }>) : [];
                const workoutType = (workout.workout_type as WorkoutType) || inferWorkoutType(exercises);
                const workoutTypeIcon = getWorkoutTypeIcon(workoutType);
                const workoutName = workout.workout_name;
                const muscleGroups = Array.isArray(workout.target_muscle_groups) ? workout.target_muscle_groups : [];

                // Calculate total sets
                const totalSets = exercises.reduce((sum, ex) => {
                  const sets = ex.completedSets || ex.sets || [];
                  return sum + (Array.isArray(sets) ? sets.length : 0);
                }, 0);

                const workoutDate = workout.planned_at
                  ? new Date(workout.planned_at).toLocaleDateString()
                  : 'recent workout';

                return (
                  <li key={workout.id}>
                    <Link
                      href={`/workout/${workout.id}/recap`}
                      aria-label={`View ${workoutName || workoutType} workout from ${workoutDate}`}
                    >
                      <div className="p-4 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors cursor-pointer group">
                        <div className="flex items-center gap-4">
                        {/* Date */}
                        <div className="flex-shrink-0 text-center">
                          <div className="text-xs text-gray-500 dark:text-gray-400 uppercase">
                            {workout.planned_at
                              ? new Date(workout.planned_at).toLocaleDateString('en-US', { month: 'short' })
                              : 'N/A'}
                          </div>
                          <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                            {workout.planned_at
                              ? new Date(workout.planned_at).getDate()
                              : '-'}
                          </div>
                        </div>

                        {/* Workout Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-lg">{workoutTypeIcon}</span>
                            <h3 className="font-semibold text-gray-900 dark:text-gray-100 truncate">
                              {workoutName || workoutType.toUpperCase()}
                            </h3>
                            <span className="px-2 py-0.5 bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 text-xs font-medium rounded flex-shrink-0">
                              ✓ Done
                            </span>
                          </div>

                          {/* Muscle Groups */}
                          {muscleGroups.length > 0 && (
                            <div className="flex flex-wrap gap-1.5 mb-1">
                              {muscleGroups.slice(0, MAX_VISIBLE_MUSCLE_GROUPS).map((group, idx) => (
                                <span
                                  key={idx}
                                  className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 text-xs rounded"
                                >
                                  {group}
                                </span>
                              ))}
                              {muscleGroups.length > MAX_VISIBLE_MUSCLE_GROUPS && (
                                <span className="text-xs text-gray-500 dark:text-gray-400">
                                  +{muscleGroups.length - MAX_VISIBLE_MUSCLE_GROUPS}
                                </span>
                              )}
                            </div>
                          )}
                        </div>

                        {/* Stats - Responsive: smaller on mobile */}
                        <div className="hidden sm:flex items-center gap-3 flex-shrink-0 text-sm text-gray-700 dark:text-gray-300">
                          {workout.duration_seconds && (
                            <div className="flex items-center gap-1">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              <span>{Math.round(workout.duration_seconds / 60)}m</span>
                            </div>
                          )}
                          <div className="flex items-center gap-1">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                            </svg>
                            <span>{totalSets} sets</span>
                          </div>
                        </div>

                        {/* Arrow */}
                        <svg className="w-5 h-5 text-gray-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                        </div>
                      </div>
                    </Link>
                  </li>
                );
              })}
            </ul>
          ) : (
            <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 p-8 text-center">
              <div className="flex flex-col items-center">
                <span className="text-5xl mb-4" role="img" aria-label="Flexed bicep">💪</span>
                <p className="text-gray-600 dark:text-gray-400">
                  No completed workouts yet. Complete your first workout to see it here!
                </p>
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
