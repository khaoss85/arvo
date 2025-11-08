import { redirect } from "next/navigation";
import Link from "next/link";
import { getUser } from "@/lib/utils/auth.server";
import { UserProfileService } from "@/lib/services/user-profile.service";
import { WorkoutService } from "@/lib/services/workout.service";
import { WorkoutGenerator } from "@/components/features/dashboard/workout-generator";
import { Button } from "@/components/ui/button";
import { formatDuration } from "@/lib/utils/workout-helpers";

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
  const inProgressWorkout = await WorkoutService.getInProgressWorkout(user.id);
  const upcomingWorkouts = workouts.filter(w => !w.completed).slice(0, 5);
  const completedWorkouts = workouts.filter(w => w.completed).slice(0, 5);

  return (
    <div className="min-h-screen p-4 sm:p-8 bg-gray-50 dark:bg-gray-950">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold sm:text-4xl">Dashboard</h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Welcome back, {user.email}!
          </p>
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

                return (
                  <div
                    key={workout.id}
                    className={`bg-white dark:bg-gray-900 rounded-lg border p-5 transition-all ${
                      isInProgress
                        ? 'border-orange-500 dark:border-orange-500 shadow-lg'
                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        {workout.planned_at ? new Date(workout.planned_at).toLocaleDateString() : 'No date'}
                      </span>
                      <span className={`px-2 py-1 text-xs font-medium rounded ${
                        isInProgress
                          ? 'bg-orange-100 dark:bg-orange-900 text-orange-700 dark:text-orange-300'
                          : 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300'
                      }`}>
                        {isInProgress ? 'In Progress' : 'Upcoming'}
                      </span>
                    </div>

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
                            • {ex.exercise_name || 'Exercise'}
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
                      <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white">
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

                return (
                  <div
                    key={workout.id}
                    className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 p-5 hover:border-gray-300 dark:hover:border-gray-600 transition-all"
                  >
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

                    <div className="mb-3">
                      <p className="text-sm text-gray-700 dark:text-gray-300 mb-1">
                        {exercises.length} {exercises.length === 1 ? 'exercise' : 'exercises'}
                      </p>
                    </div>

                    {/* Exercise Preview */}
                    {exercises.length > 0 && (
                      <div className="space-y-1">
                        {exercises.slice(0, 3).map((ex: any, idx: number) => (
                          <div key={idx} className="text-xs text-gray-600 dark:text-gray-400 truncate">
                            • {ex.exercise_name || 'Exercise'}
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
