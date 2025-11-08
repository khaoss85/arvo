"use client";

import { useEffect } from "react";
import { useUIStore } from "@/lib/stores/ui.store";
import { cn } from "@/lib/utils/cn";

export function Toaster() {
  const { toasts, removeToast } = useUIStore();

  useEffect(() => {
    toasts.forEach((toast) => {
      const timer = setTimeout(() => {
        removeToast(toast.id);
      }, 5000);

      return () => clearTimeout(timer);
    });
  }, [toasts, removeToast]);

  return (
    <div className="fixed bottom-0 right-0 z-50 p-4 sm:p-6">
      <div className="flex flex-col gap-2">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={cn(
              "rounded-lg border px-4 py-3 shadow-lg",
              "min-w-[300px] max-w-md",
              "animate-in slide-in-from-bottom-5",
              {
                "border-green-200 bg-green-50 text-green-900 dark:border-green-800 dark:bg-green-950 dark:text-green-100":
                  toast.type === "success",
                "border-red-200 bg-red-50 text-red-900 dark:border-red-800 dark:bg-red-950 dark:text-red-100":
                  toast.type === "error",
                "border-yellow-200 bg-yellow-50 text-yellow-900 dark:border-yellow-800 dark:bg-yellow-950 dark:text-yellow-100":
                  toast.type === "warning",
                "border-blue-200 bg-blue-50 text-blue-900 dark:border-blue-800 dark:bg-blue-950 dark:text-blue-100":
                  toast.type === "info",
              }
            )}
          >
            <div className="flex items-start justify-between gap-2">
              <p className="text-sm font-medium">{toast.message}</p>
              <button
                onClick={() => removeToast(toast.id)}
                className="text-current opacity-70 hover:opacity-100"
              >
                ×
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
