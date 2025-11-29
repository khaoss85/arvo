'use client';

import { Card, CardContent } from "@/components/ui/card";
import { motion } from "framer-motion";
import { UserPlus, Eye, MessageSquare, Settings, Users, Calendar, CheckCircle, TrendingUp } from "lucide-react";
import { useTranslations } from 'next-intl';

export function ClientDashboardPreview() {
  const t = useTranslations('landing.forTrainers.clientDashboard');

  const features = [
    {
      icon: UserPlus,
      title: t('features.invite.title'),
      description: t('features.invite.description'),
    },
    {
      icon: Eye,
      title: t('features.overview.title'),
      description: t('features.overview.description'),
    },
    {
      icon: MessageSquare,
      title: t('features.feedback.title'),
      description: t('features.feedback.description'),
    },
    {
      icon: Settings,
      title: t('features.control.title'),
      description: t('features.control.description'),
    },
  ];

  // Mock client data for the dashboard preview
  const mockClients = [
    { name: "Marco R.", status: "active", lastWorkout: "Today", completion: 95 },
    { name: "Sara L.", status: "active", lastWorkout: "Yesterday", completion: 88 },
    { name: "Luca T.", status: "pending", lastWorkout: "2 days ago", completion: 72 },
    { name: "Anna M.", status: "active", lastWorkout: "Today", completion: 100 },
  ];

  return (
    <section className="py-24 px-4 bg-muted/30">
      <div className="container max-w-6xl mx-auto">
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-3xl md:text-5xl font-bold mb-4">
            {t('title')}
          </h2>
          <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
            {t('subtitle')}
          </p>
          <p className="text-sm text-muted-foreground/70 mt-2 max-w-2xl mx-auto">
            {t('description')}
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-8 items-start">
          {/* Features List */}
          <div className="space-y-4">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
              >
                <Card className="hover:border-primary-300 dark:hover:border-primary-700 transition-colors">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-4">
                      <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-primary-100 dark:bg-primary-900/50 flex items-center justify-center">
                        <feature.icon className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                      </div>
                      <div>
                        <h3 className="font-semibold mb-1">{feature.title}</h3>
                        <p className="text-muted-foreground text-sm">{feature.description}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>

          {/* Dashboard Preview Mock */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <Card className="overflow-hidden shadow-xl border-2">
              <div className="bg-primary-600 dark:bg-primary-800 text-white p-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold">Coach Dashboard</h3>
                  <span className="px-2 py-1 text-xs font-medium rounded-full bg-white/20 text-white">
                    Pro
                  </span>
                </div>
              </div>
              <CardContent className="p-4">
                {/* Stats Row */}
                <div className="grid grid-cols-4 gap-2 mb-4">
                  <div className="text-center p-2 bg-muted/50 rounded-lg">
                    <div className="flex items-center justify-center mb-1">
                      <Users className="w-4 h-4 text-primary-600" />
                    </div>
                    <p className="text-lg font-bold">24</p>
                    <p className="text-xs text-muted-foreground">{t('metrics.activeClients')}</p>
                  </div>
                  <div className="text-center p-2 bg-muted/50 rounded-lg">
                    <div className="flex items-center justify-center mb-1">
                      <Calendar className="w-4 h-4 text-primary-600" />
                    </div>
                    <p className="text-lg font-bold">68</p>
                    <p className="text-xs text-muted-foreground">{t('metrics.workoutsThisWeek')}</p>
                  </div>
                  <div className="text-center p-2 bg-muted/50 rounded-lg">
                    <div className="flex items-center justify-center mb-1">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                    </div>
                    <p className="text-lg font-bold">89%</p>
                    <p className="text-xs text-muted-foreground">{t('metrics.completionRate')}</p>
                  </div>
                  <div className="text-center p-2 bg-muted/50 rounded-lg">
                    <div className="flex items-center justify-center mb-1">
                      <TrendingUp className="w-4 h-4 text-primary-600" />
                    </div>
                    <p className="text-lg font-bold">4.8</p>
                    <p className="text-xs text-muted-foreground">{t('metrics.avgSatisfaction')}</p>
                  </div>
                </div>

                {/* Client List Mock */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs text-muted-foreground px-2">
                    <span>Client</span>
                    <span>Status</span>
                  </div>
                  {mockClients.map((client, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 bg-muted/30 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary-200 dark:bg-primary-800 flex items-center justify-center">
                          <span className="text-xs font-semibold text-primary-700 dark:text-primary-300">
                            {client.name.split(' ').map(n => n[0]).join('')}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium text-sm">{client.name}</p>
                          <p className="text-xs text-muted-foreground">{client.lastWorkout}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-2 bg-muted rounded-full overflow-hidden">
                          <div
                            className="h-full bg-primary-500 rounded-full"
                            style={{ width: `${client.completion}%` }}
                          />
                        </div>
                        <span
                          className={`px-2 py-0.5 text-xs font-medium rounded-full ${
                            client.status === "active"
                              ? "bg-primary-100 text-primary-700 dark:bg-primary-900/50 dark:text-primary-300"
                              : "bg-muted text-muted-foreground"
                          }`}
                        >
                          {client.status === "active" ? "Active" : "Pending"}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
