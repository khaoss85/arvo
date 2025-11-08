import { redirect } from "next/navigation";
import { getUser } from "@/lib/utils/auth.server";
import { UserProfileService } from "@/lib/services/user-profile.service";
import { WorkoutService } from "@/lib/services/workout.service";
import { WorkoutGenerator } from "@/components/features/dashboard/workout-generator";

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

        {/* Upcoming Workouts */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-4">Upcoming Workouts</h2>
          {upcomingWorkouts.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {upcomingWorkouts.map((workout) => (
                <div
                  key={workout.id}
                  className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 p-4"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      {new Date(workout.planned_at).toLocaleDateString()}
                    </span>
                    <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 text-xs font-medium rounded">
                      Upcoming
                    </span>
                  </div>
                  <p className="text-sm text-gray-700 dark:text-gray-300">
                    {(workout.exercises as any[])?.length || 0} exercises
                  </p>
                </div>
              ))}
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
              {completedWorkouts.map((workout) => (
                <div
                  key={workout.id}
                  className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 p-4"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      {new Date(workout.planned_at).toLocaleDateString()}
                    </span>
                    <span className="px-2 py-1 bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 text-xs font-medium rounded">
                      Completed
                    </span>
                  </div>
                  <p className="text-sm text-gray-700 dark:text-gray-300">
                    {(workout.exercises as any[])?.length || 0} exercises
                  </p>
                </div>
              ))}
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
