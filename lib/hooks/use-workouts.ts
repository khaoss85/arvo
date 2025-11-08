import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { WorkoutService } from "@/lib/services/workout.service";
import type { InsertWorkout, UpdateWorkout } from "@/lib/types/schemas";

export const workoutKeys = {
  all: ["workouts"] as const,
  lists: () => [...workoutKeys.all, "list"] as const,
  list: (userId?: string) => [...workoutKeys.lists(), { userId }] as const,
  upcoming: (userId?: string) =>
    [...workoutKeys.all, "upcoming", { userId }] as const,
  completed: (userId?: string) =>
    [...workoutKeys.all, "completed", { userId }] as const,
  details: () => [...workoutKeys.all, "detail"] as const,
  detail: (id: string) => [...workoutKeys.details(), id] as const,
};

export function useWorkouts(userId: string | undefined) {
  return useQuery({
    queryKey: workoutKeys.list(userId),
    queryFn: () => WorkoutService.getByUserId(userId!),
    enabled: !!userId,
  });
}

export function useUpcomingWorkouts(userId: string | undefined, limit = 10) {
  return useQuery({
    queryKey: workoutKeys.upcoming(userId),
    queryFn: () => WorkoutService.getUpcoming(userId!, limit),
    enabled: !!userId,
  });
}

export function useCompletedWorkouts(userId: string | undefined, limit = 20) {
  return useQuery({
    queryKey: workoutKeys.completed(userId),
    queryFn: () => WorkoutService.getCompleted(userId!, limit),
    enabled: !!userId,
  });
}

export function useWorkout(id: string | undefined) {
  return useQuery({
    queryKey: workoutKeys.detail(id!),
    queryFn: () => WorkoutService.getById(id!),
    enabled: !!id,
  });
}

export function useCreateWorkout() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: InsertWorkout) => WorkoutService.create(data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: workoutKeys.list(variables.user_id || undefined),
      });
      queryClient.invalidateQueries({
        queryKey: workoutKeys.upcoming(variables.user_id || undefined),
      });
    },
  });
}

export function useUpdateWorkout() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateWorkout }) =>
      WorkoutService.update(id, data),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({
        queryKey: workoutKeys.list(data.user_id || undefined),
      });
      queryClient.invalidateQueries({
        queryKey: workoutKeys.detail(variables.id),
      });
      queryClient.invalidateQueries({
        queryKey: workoutKeys.upcoming(data.user_id || undefined),
      });
      queryClient.invalidateQueries({
        queryKey: workoutKeys.completed(data.user_id || undefined),
      });
    },
  });
}

export function useMarkWorkoutCompleted() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => WorkoutService.markCompleted(id),
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: workoutKeys.list(data.user_id || undefined),
      });
      queryClient.invalidateQueries({
        queryKey: workoutKeys.upcoming(data.user_id || undefined),
      });
      queryClient.invalidateQueries({
        queryKey: workoutKeys.completed(data.user_id || undefined),
      });
    },
  });
}

export function useDeleteWorkout() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => WorkoutService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: workoutKeys.lists() });
    },
  });
}
