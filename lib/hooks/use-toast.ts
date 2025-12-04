"use client";

import { useUIStore } from "@/lib/stores/ui.store";

export function useToast() {
  const addToast = useUIStore((state) => state.addToast);

  const toast = ({
    title,
    description,
    variant = "default",
  }: {
    title?: string;
    description?: string;
    variant?: "default" | "destructive";
  }) => {
    const message = description || title || "";
    const type = variant === "destructive" ? "error" : "info";
    addToast(message, type);
  };

  return { toast };
}
