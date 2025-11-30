'use client';

import { useEffect, useState } from 'react';
import { Loader2, Cpu, DollarSign, Zap, Activity } from 'lucide-react';

interface AgentStats {
  agentName: string;
  totalCredits: number;
  totalCalls: number;
  avgCredits: number;
  totalTokensInput: number;
  totalTokensOutput: number;
}

interface OperationStats {
  operationType: string;
  totalCredits: number;
  totalCalls: number;
  estimatedCostUsd: number;
}

interface CreditStatsData {
  byAgent: AgentStats[];
  byOperation: OperationStats[];
  totals: {
    totalCredits: number;
    totalCalls: number;
    estimatedCostUsd: number;
    avgCreditsPerCall: number;
    totalTokensInput: number;
    totalTokensOutput: number;
  };
}

// Map agent names to friendly names
const AGENT_DISPLAY_NAMES: Record<string, string> = {
  ExerciseSelectorAgent: 'Exercise Selector',
  SplitPlannerAgent: 'Split Planner',
  AudioScriptGeneratorAgent: 'Audio Script Generator',
  ExerciseSubstitutionAgent: 'Exercise Substitution',
  TechniqueRecommenderAgent: 'Technique Recommender',
  InsightGeneratorAgent: 'Insight Generator',
  MemoryConsolidatorAgent: 'Memory Consolidator',
  WorkoutSummaryAgent: 'Workout Summary',
  WorkoutRationaleAgent: 'Workout Rationale',
  InsightParserAgent: 'Insight Parser',
  Unknown: 'Other',
};

// Map operation types to friendly names
const OPERATION_DISPLAY_NAMES: Record<string, string> = {
  workout_generation: 'Workout Generation',
  split_generation: 'Split Generation',
  audio_script_generation: 'Audio Scripts',
  exercise_substitution: 'Exercise Substitution',
  technique_recommendation: 'Technique Recommendation',
  insight_generation: 'Insight Generation',
  memory_consolidation: 'Memory Consolidation',
  modification_validation: 'Modification Validation',
  other: 'Other',
};

export function CreditStatsSection() {
  const [data, setData] = useState<CreditStatsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/admin/credits/stats');
      if (response.ok) {
        const result = await response.json();
        setData(result);
      }
    } catch (error) {
      console.error('Error fetching credit stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <p className="text-center text-gray-500 dark:text-gray-400">
          Failed to load credit statistics
        </p>
      </div>
    );
  }

  const cards = [
    {
      title: 'Total AI Calls',
      value: data.totals.totalCalls.toLocaleString(),
      icon: Activity,
      color: 'text-blue-600 dark:text-blue-400',
      bgColor: 'bg-blue-100 dark:bg-blue-900/30',
    },
    {
      title: 'Total Credits',
      value: data.totals.totalCredits.toLocaleString(),
      icon: Zap,
      color: 'text-amber-600 dark:text-amber-400',
      bgColor: 'bg-amber-100 dark:bg-amber-900/30',
    },
    {
      title: 'Estimated Cost',
      value: `$${data.totals.estimatedCostUsd.toFixed(2)}`,
      icon: DollarSign,
      color: 'text-green-600 dark:text-green-400',
      bgColor: 'bg-green-100 dark:bg-green-900/30',
    },
    {
      title: 'Avg Credits/Call',
      value: data.totals.avgCreditsPerCall.toString(),
      icon: Cpu,
      color: 'text-purple-600 dark:text-purple-400',
      bgColor: 'bg-purple-100 dark:bg-purple-900/30',
    },
  ];

  const totalCredits = data.totals.totalCredits || 1; // Avoid division by zero

  return (
    <div className="space-y-6">
      {/* Section Header */}
      <div>
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
          AI Credit Usage
        </h2>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Breakdown of AI resource consumption by agent and operation type
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((card, index) => (
          <div
            key={index}
            className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4"
          >
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                {card.title}
              </p>
              <div className={`p-2 rounded-lg ${card.bgColor}`}>
                <card.icon className={`w-4 h-4 ${card.color}`} />
              </div>
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {card.value}
            </p>
          </div>
        ))}
      </div>

      {/* Agent Usage Table */}
      {data.byAgent.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">
              Usage by Agent
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-900">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Agent
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Calls
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Credits
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Avg/Call
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    % Total
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase w-32">
                    Distribution
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {data.byAgent.map((agent) => {
                  const percentage = (agent.totalCredits / totalCredits) * 100;
                  return (
                    <tr key={agent.agentName} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                      <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white">
                        {AGENT_DISPLAY_NAMES[agent.agentName] || agent.agentName}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400 text-right">
                        {agent.totalCalls.toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white text-right">
                        {agent.totalCredits.toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400 text-right">
                        {agent.avgCredits}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400 text-right">
                        {percentage.toFixed(1)}%
                      </td>
                      <td className="px-4 py-3">
                        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                          <div
                            className="bg-primary-500 h-2 rounded-full"
                            style={{ width: `${Math.min(percentage, 100)}%` }}
                          />
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Operation Type Table */}
      {data.byOperation.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">
              Usage by Operation Type
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-900">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Operation
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Calls
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Credits
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Est. Cost
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {data.byOperation.map((op) => (
                  <tr key={op.operationType} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                    <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white">
                      {OPERATION_DISPLAY_NAMES[op.operationType] || op.operationType}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400 text-right">
                      {op.totalCalls.toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white text-right">
                      {op.totalCredits.toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-sm text-green-600 dark:text-green-400 text-right">
                      ${op.estimatedCostUsd.toFixed(3)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Empty State */}
      {data.byAgent.length === 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-8 text-center">
          <Cpu className="w-12 h-12 mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            No credit usage data yet
          </h3>
          <p className="text-gray-500 dark:text-gray-400">
            Credit tracking will populate this section as users interact with AI features.
          </p>
        </div>
      )}
    </div>
  );
}
