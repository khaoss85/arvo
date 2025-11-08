import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { TrainingApproachService } from "@/lib/services/training-approach.service";
import type {
  InsertTrainingApproach,
  UpdateTrainingApproach,
} from "@/lib/types/schemas";

export const trainingApproachKeys = {
  all: ["training-approaches"] as const,
  lists: () => [...trainingApproachKeys.all, "list"] as const,
  list: (filters?: string) =>
    [...trainingApproachKeys.lists(), { filters }] as const,
  details: () => [...trainingApproachKeys.all, "detail"] as const,
  detail: (id: string) => [...trainingApproachKeys.details(), id] as const,
};

export function useTrainingApproaches() {
  return useQuery({
    queryKey: trainingApproachKeys.lists(),
    queryFn: () => TrainingApproachService.getAll(),
  });
}

export function useTrainingApproach(id: string | undefined) {
  return useQuery({
    queryKey: trainingApproachKeys.detail(id!),
    queryFn: () => TrainingApproachService.getById(id!),
    enabled: !!id,
  });
}

export function useCreateTrainingApproach() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: InsertTrainingApproach) =>
      TrainingApproachService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: trainingApproachKeys.lists() });
    },
  });
}

export function useUpdateTrainingApproach() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateTrainingApproach }) =>
      TrainingApproachService.update(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: trainingApproachKeys.lists() });
      queryClient.invalidateQueries({
        queryKey: trainingApproachKeys.detail(variables.id),
      });
    },
  });
}

export function useDeleteTrainingApproach() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => TrainingApproachService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: trainingApproachKeys.lists() });
    },
  });
}
