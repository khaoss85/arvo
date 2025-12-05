import { redirect } from "next/navigation";
import { getUser } from "@/lib/utils/auth.server";
import { WorkoutService } from "@/lib/services/workout.service";
import { SetLogService } from "@/lib/services/set-log.service";
import { WorkoutRecap } from "@/components/features/simple/workout/workout-recap";
import { markWorkoutCompletedAction } from "@/app/actions/workout-actions";

export default async function SimpleWorkoutRecapPage({
  params,
}: {
  params: { id: string };
}) {
  const user = await getUser();

  if (!user) {
    redirect("/login");
  }

  const workout = await WorkoutService.getByIdServer(params.id);

  if (!workout) {
    redirect("/simple");
  }

  // Verify ownership
  if (workout.user_id !== user.id) {
    redirect("/simple");
  }

  // Get set logs for stats
  const sets = await SetLogService.getByWorkoutIdServer(params.id);

  // Calculate stats
  const totalSets = sets.filter((s) => !s.skipped).length;
  const exercises = workout.exercises || [];
  const exerciseCount = exercises.length;
  const skippedExerciseCount = exercises.filter((ex: { skipped?: boolean }) => ex.skipped).length;
  const completedExerciseCount = exerciseCount - skippedExerciseCount;
  const totalVolume = sets.reduce(
    (sum, s) => sum + (s.weight_actual || 0) * (s.reps_actual || 0),
    0
  );

  // Calculate duration from started_at
  const durationSeconds = workout.started_at
    ? Math.floor((Date.now() - new Date(workout.started_at).getTime()) / 1000)
    : null;

  // Mark workout as completed if not already
  // Note: This might fail if the workout was deleted in another tab
  // We handle the error gracefully since we already have the workout data
  if (workout.status !== "completed") {
    const result = await markWorkoutCompletedAction(workout.id, {
      totalSets,
      totalVolume,
      durationSeconds: durationSeconds ?? undefined,
    });
    if (!result.success) {
      console.error("[SimpleRecapPage] Failed to mark workout as completed:", result.error);
    }
  }

  return (
    <WorkoutRecap
      workoutId={workout.id}
      workoutName={workout.workout_name || "Workout"}
      exerciseCount={completedExerciseCount}
      skippedExerciseCount={skippedExerciseCount}
      totalSets={totalSets}
      totalVolume={Math.round(totalVolume)}
    />
  );
}
