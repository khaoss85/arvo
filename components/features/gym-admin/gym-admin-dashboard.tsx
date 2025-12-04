"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Users,
  UserPlus,
  Activity,
  TrendingUp,
  Palette,
  Link2,
  ArrowRight,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { GymService } from "@/lib/services/gym.service";
import type { GymStats } from "@/lib/types/gym.types";

interface GymAdminDashboardProps {
  gymId: string;
  gymName: string;
}

export function GymAdminDashboard({ gymId, gymName }: GymAdminDashboardProps) {
  const [stats, setStats] = useState<GymStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadStats() {
      try {
        const data = await GymService.getStats(gymId);
        setStats(data);
      } catch (error) {
        console.error("Failed to load gym stats:", error);
      } finally {
        setIsLoading(false);
      }
    }

    loadStats();
  }, [gymId]);

  return (
    <div className="space-y-8">
      {/* Welcome section */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Bentornato, {gymName}
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          Ecco una panoramica della tua palestra
        </p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
              Membri Totali
            </CardTitle>
            <Users className="h-4 w-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {isLoading ? "..." : stats?.total_members || 0}
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-500">
              {stats?.active_members || 0} attivi
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
              Staff
            </CardTitle>
            <UserPlus className="h-4 w-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {isLoading ? "..." : stats?.total_staff || 0}
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-500">
              {stats?.active_staff || 0} attivi
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
              Nuovi Membri
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {isLoading ? "..." : stats?.members_this_month || 0}
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-500">
              questo mese
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
              Allenamenti
            </CardTitle>
            <Activity className="h-4 w-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {isLoading ? "..." : stats?.workouts_this_month || 0}
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-500">
              questo mese
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card className="hover:shadow-md transition-shadow">
          <Link href="/gym-admin/branding">
            <CardContent className="flex items-center justify-between p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-primary-100 dark:bg-primary-900/30 rounded-lg flex items-center justify-center">
                  <Palette className="w-6 h-6 text-primary-600 dark:text-primary-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">
                    Personalizza Branding
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Logo, colori, font
                  </p>
                </div>
              </div>
              <ArrowRight className="w-5 h-5 text-gray-400" />
            </CardContent>
          </Link>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <Link href="/gym-admin/staff">
            <CardContent className="flex items-center justify-between p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
                  <UserPlus className="w-6 h-6 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">
                    Gestisci Staff
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Aggiungi coach e manager
                  </p>
                </div>
              </div>
              <ArrowRight className="w-5 h-5 text-gray-400" />
            </CardContent>
          </Link>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <Link href="/gym-admin/registration">
            <CardContent className="flex items-center justify-between p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                  <Link2 className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">
                    Link Registrazione
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Condividi con i clienti
                  </p>
                </div>
              </div>
              <ArrowRight className="w-5 h-5 text-gray-400" />
            </CardContent>
          </Link>
        </Card>
      </div>
    </div>
  );
}
