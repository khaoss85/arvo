"use client";

import { useEffect, useState } from "react";
import { Users, Search, Loader2, MoreHorizontal } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { GymService } from "@/lib/services/gym.service";
import type { GymMemberWithUser } from "@/lib/types/gym.types";

interface MembersListProps {
  gymId: string;
}

const statusColors: Record<string, string> = {
  active: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
  pending: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300",
  suspended: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
  churned: "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300",
};

export function MembersList({ gymId }: MembersListProps) {
  const [members, setMembers] = useState<GymMemberWithUser[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    async function loadMembers() {
      try {
        const { members: data, total: count } = await GymService.getMembers(gymId, {
          limit: 50,
        });
        setMembers(data);
        setTotal(count);
      } catch (error) {
        console.error("Failed to load members:", error);
      } finally {
        setIsLoading(false);
      }
    }

    loadMembers();
  }, [gymId]);

  // Filter members by search query
  const filteredMembers = members.filter((member) => {
    const search = searchQuery.toLowerCase();
    return (
      member.user.email.toLowerCase().includes(search) ||
      member.user.first_name?.toLowerCase().includes(search)
    );
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Cerca membri..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <p className="text-sm text-gray-500">
          {total} membri totali
        </p>
      </div>

      {/* Members list */}
      {filteredMembers.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Users className="w-12 h-12 text-gray-400 mb-4" />
            <p className="text-gray-600 dark:text-gray-400 text-center">
              {searchQuery
                ? "Nessun membro trovato per questa ricerca"
                : "Nessun membro ancora registrato"}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3">
          {filteredMembers.map((member) => (
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
                  <Badge className={statusColors[member.status]}>
                    {member.status === "active" ? "Attivo" : member.status}
                  </Badge>
                  {member.registered_at && (
                    <span className="text-xs text-gray-500">
                      Iscritto {new Date(member.registered_at).toLocaleDateString("it-IT")}
                    </span>
                  )}
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
