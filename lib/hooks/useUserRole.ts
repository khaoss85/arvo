"use client";

import { useState, useEffect } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { useAuthStore } from "@/lib/stores/auth.store";

export type UserRole = "user" | "admin" | "coach" | "gym_owner";

export function useUserRole() {
  const { user } = useAuthStore();
  const [role, setRole] = useState<UserRole>("user");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchRole() {
      if (!user?.id) {
        setRole("user");
        setIsLoading(false);
        return;
      }

      try {
        const supabase = getSupabaseBrowserClient();
        const { data, error } = await supabase
          .from("users")
          .select("role")
          .eq("id", user.id)
          .single();

        if (error || !data) {
          setRole("user");
        } else {
          setRole((data.role as UserRole) || "user");
        }
      } catch (error) {
        console.error("Failed to fetch user role:", error);
        setRole("user");
      } finally {
        setIsLoading(false);
      }
    }

    fetchRole();
  }, [user?.id]);

  return {
    role,
    isLoading,
    isUser: role === "user",
    isAdmin: role === "admin",
    isCoach: role === "coach",
    isGymOwner: role === "gym_owner",
    canAccessCoachMode: true,
    canAccessGymAdminMode: role === "gym_owner" || role === "admin",
  };
}
