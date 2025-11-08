import { create } from "zustand";
import type { Workout, SetLog } from "@/lib/types/schemas";

interface ActiveWorkoutState {
  activeWorkout: Workout | null;
  currentExerciseIndex: number;
  completedSets: SetLog[];
  isWorkoutActive: boolean;

  // Actions
  startWorkout: (workout: Workout) => void;
  endWorkout: () => void;
  addCompletedSet: (set: SetLog) => void;
  updateCompletedSet: (setId: string, updates: Partial<SetLog>) => void;
  removeCompletedSet: (setId: string) => void;
  nextExercise: () => void;
  previousExercise: () => void;
  setExerciseIndex: (index: number) => void;
  clearWorkout: () => void;
}

export const useWorkoutStore = create<ActiveWorkoutState>((set, _get) => ({
  activeWorkout: null,
  currentExerciseIndex: 0,
  completedSets: [],
  isWorkoutActive: false,

  startWorkout: (workout) =>
    set({
      activeWorkout: workout,
      currentExerciseIndex: 0,
      completedSets: [],
      isWorkoutActive: true,
    }),

  endWorkout: () =>
    set({
      isWorkoutActive: false,
    }),

  addCompletedSet: (set_data) =>
    set((state) => ({
      completedSets: [...state.completedSets, set_data],
    })),

  updateCompletedSet: (setId, updates) =>
    set((state) => ({
      completedSets: state.completedSets.map((s) =>
        s.id === setId ? { ...s, ...updates } : s
      ),
    })),

  removeCompletedSet: (setId) =>
    set((state) => ({
      completedSets: state.completedSets.filter((s) => s.id !== setId),
    })),

  nextExercise: () =>
    set((state) => {
      const maxIndex = (state.activeWorkout?.exercises?.length ?? 1) - 1;
      return {
        currentExerciseIndex: Math.min(
          state.currentExerciseIndex + 1,
          maxIndex
        ),
      };
    }),

  previousExercise: () =>
    set((state) => ({
      currentExerciseIndex: Math.max(state.currentExerciseIndex - 1, 0),
    })),

  setExerciseIndex: (index) =>
    set({
      currentExerciseIndex: index,
    }),

  clearWorkout: () =>
    set({
      activeWorkout: null,
      currentExerciseIndex: 0,
      completedSets: [],
      isWorkoutActive: false,
    }),
}));
