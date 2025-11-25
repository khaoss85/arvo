import { redirect } from "next/navigation";
import { getUser } from "@/lib/utils/auth.server";
import { WorkoutService } from "@/lib/services/workout.service";
import { SimpleWorkoutExecution } from "@/components/features/simple/workout/simple-workout-execution";

export default async function SimpleWorkoutPage({
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

  return <SimpleWorkoutExecution workout={workout} userId={user.id} />;
}
