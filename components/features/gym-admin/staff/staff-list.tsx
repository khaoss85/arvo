"use client";

import { useEffect, useState } from "react";
import { UserPlus, MoreHorizontal, Loader2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { GymService } from "@/lib/services/gym.service";
import type { GymStaffWithUser } from "@/lib/types/gym.types";

interface StaffListProps {
  gymId: string;
}

const statusColors: Record<string, string> = {
  active: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
  pending: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300",
  suspended: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
  terminated: "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300",
};

const roleLabels: Record<string, string> = {
  coach: "Coach",
  manager: "Manager",
  admin: "Admin",
};

export function StaffList({ gymId }: StaffListProps) {
  const [staff, setStaff] = useState<GymStaffWithUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadStaff() {
      try {
        const data = await GymService.getStaff(gymId);
        setStaff(data);
      } catch (error) {
        console.error("Failed to load staff:", error);
      } finally {
        setIsLoading(false);
      }
    }

    loadStaff();
  }, [gymId]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Add staff button */}
      <div className="flex justify-end">
        <Button>
          <UserPlus className="w-4 h-4 mr-2" />
          Invita Staff
        </Button>
      </div>

      {/* Staff list */}
      {staff.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <UserPlus className="w-12 h-12 text-gray-400 mb-4" />
            <p className="text-gray-600 dark:text-gray-400 text-center">
              Nessun membro dello staff ancora.
              <br />
              Invita il tuo primo coach!
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {staff.map((member) => (
            <Card key={member.id}>
              <CardContent className="flex items-center justify-between p-4">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-primary-100 dark:bg-primary-900/30 rounded-full flex items-center justify-center">
                    <span className="text-primary-700 dark:text-primary-300 font-medium">
                      {member.user.first_name?.[0] || member.user.email[0].toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {member.user.first_name || member.user.email}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {member.user.email}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Badge variant="outline">{roleLabels[member.staff_role]}</Badge>
                  <Badge className={statusColors[member.status]}>
                    {member.status === "active" ? "Attivo" : member.status}
                  </Badge>
                  <Button variant="ghost" size="icon">
                    <MoreHorizontal className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
