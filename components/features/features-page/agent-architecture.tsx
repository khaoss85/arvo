'use client';

import { motion } from "framer-motion";
import {
  Brain,
  Zap,
  Shield,
  BookOpen,
  Cpu,
  Target,
  FileText,
  Calculator,
  Mic,
  RefreshCw,
  AlertTriangle,
  ListOrdered,
  Lightbulb,
  Database,
  Search,
  Camera,
  Droplets,
  Activity,
  HeartPulse,
  TrendingUp,
  Clock,
  Crosshair,
  BarChart3
} from "lucide-react";
import { useTranslations } from 'next-intl';

interface AgentCardProps {
  icon: React.ReactNode;
  name: string;
  description: string;
  delay: number;
}

function AgentCard({ icon, name, description, delay }: AgentCardProps) {
  return (
    <motion.div
      className="flex items-start gap-3 p-4 rounded-lg bg-background border border-border hover:border-primary-300 dark:hover:border-primary-700 transition-colors"
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.4, delay }}
    >
      <div className="w-10 h-10 rounded-lg bg-primary-100 dark:bg-primary-900/50 flex items-center justify-center text-primary-600 dark:text-primary-400 shrink-0">
        {icon}
      </div>
      <div>
        <h4 className="font-semibold text-sm">{name}</h4>
        <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
      </div>
    </motion.div>
  );
}

export function AgentArchitecture() {
  const t = useTranslations('features.agentArchitecture');

  const layers = [
    {
      id: 'planning',
      title: t('layers.planning.title'),
      description: t('layers.planning.description'),
      icon: <Brain className="w-6 h-6" />,
      color: 'from-blue-500 to-cyan-500',
      agents: [
        { icon: <Target className="w-5 h-5" />, name: 'SplitPlanner', description: t('agents.splitPlanner') },
        { icon: <Cpu className="w-5 h-5" />, name: 'ExerciseSelector', description: t('agents.exerciseSelector') },
        { icon: <FileText className="w-5 h-5" />, name: 'RationaleGenerator', description: t('agents.rationaleGenerator') },
      ]
    },
    {
      id: 'execution',
      title: t('layers.execution.title'),
      description: t('layers.execution.description'),
      icon: <Zap className="w-6 h-6" />,
      color: 'from-amber-500 to-orange-500',
      agents: [
        { icon: <Calculator className="w-5 h-5" />, name: 'ProgressionCalculator', description: t('agents.progressionCalculator') },
        { icon: <Mic className="w-5 h-5" />, name: 'AudioScriptGenerator', description: t('agents.audioScriptGenerator') },
      ]
    },
    {
      id: 'validation',
      title: t('layers.validation.title'),
      description: t('layers.validation.description'),
      icon: <Shield className="w-6 h-6" />,
      color: 'from-green-500 to-emerald-500',
      agents: [
        { icon: <RefreshCw className="w-5 h-5" />, name: 'SubstitutionValidator', description: t('agents.substitutionValidator') },
        { icon: <AlertTriangle className="w-5 h-5" />, name: 'ModificationValidator', description: t('agents.modificationValidator') },
        { icon: <ListOrdered className="w-5 h-5" />, name: 'ReorderValidator', description: t('agents.reorderValidator') },
      ]
    },
    {
      id: 'learning',
      title: t('layers.learning.title'),
      description: t('layers.learning.description'),
      icon: <BookOpen className="w-6 h-6" />,
      color: 'from-purple-500 to-pink-500',
      agents: [
        { icon: <Lightbulb className="w-5 h-5" />, name: 'InsightsGenerator', description: t('agents.insightsGenerator') },
        { icon: <Database className="w-5 h-5" />, name: 'MemoryConsolidator', description: t('agents.memoryConsolidator') },
        { icon: <Search className="w-5 h-5" />, name: 'PatternDetector', description: t('agents.patternDetector') },
      ]
    },
    {
      id: 'specialized',
      title: t('layers.specialized.title'),
      description: t('layers.specialized.description'),
      icon: <Cpu className="w-6 h-6" />,
      color: 'from-rose-500 to-red-500',
      agents: [
        { icon: <Camera className="w-5 h-5" />, name: 'EquipmentVision', description: t('agents.equipmentVision') },
        { icon: <Droplets className="w-5 h-5" />, name: 'HydrationAdvisor', description: t('agents.hydrationAdvisor') },
        { icon: <Activity className="w-5 h-5" />, name: 'FatigueAnalyzer', description: t('agents.fatigueAnalyzer') },
        { icon: <HeartPulse className="w-5 h-5" />, name: 'InjuryPrevention', description: t('agents.injuryPrevention') },
        { icon: <TrendingUp className="w-5 h-5" />, name: 'VolumeOptimizer', description: t('agents.volumeOptimizer') },
        { icon: <Clock className="w-5 h-5" />, name: 'DeloadTrigger', description: t('agents.deloadTrigger') },
        { icon: <Crosshair className="w-5 h-5" />, name: 'WeakPointTargeting', description: t('agents.weakPointTargeting') },
        { icon: <BarChart3 className="w-5 h-5" />, name: 'CycleIntelligence', description: t('agents.cycleIntelligence') },
      ]
    },
  ];

  return (
    <section id="agent-architecture" className="py-24 px-4 bg-muted/30">
      <div className="container max-w-6xl mx-auto">
        {/* Header */}
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4">
            {t('title')}
          </h2>
          <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
            {t('subtitle')}
          </p>
        </motion.div>

        {/* Agent Layers */}
        <div className="space-y-12">
          {layers.map((layer, layerIndex) => (
            <motion.div
              key={layer.id}
              className="relative"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: layerIndex * 0.1 }}
            >
              {/* Layer Header */}
              <div className="flex items-center gap-4 mb-6">
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${layer.color} flex items-center justify-center text-white`}>
                  {layer.icon}
                </div>
                <div>
                  <h3 className="text-xl font-bold">{layer.title}</h3>
                  <p className="text-sm text-muted-foreground">{layer.description}</p>
                </div>
                <div className="ml-auto">
                  <span className="text-sm font-medium text-muted-foreground bg-muted px-3 py-1 rounded-full">
                    {layer.agents.length} {layer.agents.length === 1 ? 'agent' : 'agents'}
                  </span>
                </div>
              </div>

              {/* Agents Grid */}
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3 pl-4 border-l-2 border-muted ml-6">
                {layer.agents.map((agent, agentIndex) => (
                  <AgentCard
                    key={agent.name}
                    icon={agent.icon}
                    name={agent.name}
                    description={agent.description}
                    delay={agentIndex * 0.05}
                  />
                ))}
              </div>
            </motion.div>
          ))}
        </div>

        {/* Total Count */}
        <motion.div
          className="mt-16 text-center"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.4 }}
        >
          <div className="inline-flex items-center gap-3 px-6 py-3 rounded-full bg-primary-100 dark:bg-primary-900/50 border border-primary-200 dark:border-primary-800">
            <span className="text-3xl font-bold text-primary-600 dark:text-primary-400">19</span>
            <span className="text-muted-foreground">{t('totalAgents')}</span>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
