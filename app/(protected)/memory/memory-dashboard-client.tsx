'use client'

import { useState, useEffect } from 'react'
import { memoryService } from '@/lib/services/memory.service'
import { insightService } from '@/lib/services/insight.service'
import type { Database } from '@/lib/types/database.types'
import {
  Brain,
  Lightbulb,
  TrendingUp,
  Target,
  Heart,
  Dumbbell,
  Archive,
  Download,
  RefreshCw,
  CheckCircle,
  AlertCircle,
  Loader2
} from 'lucide-react'
import { Button } from '@/components/ui/button'

type UserMemoryEntry = Database['public']['Tables']['user_memory_entries']['Row']
type WorkoutInsight = Database['public']['Tables']['workout_insights']['Row']

type TabType = 'overview' | 'preference' | 'limitation' | 'pattern' | 'strength' | 'equipment'

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  preference: <Heart className="w-5 h-5 text-pink-400" />,
  pattern: <TrendingUp className="w-5 h-5 text-blue-400" />,
  limitation: <AlertCircle className="w-5 h-5 text-orange-400" />,
  strength: <Target className="w-5 h-5 text-green-400" />,
  equipment: <Dumbbell className="w-5 h-5 text-purple-400" />,
  learned_behavior: <Brain className="w-5 h-5 text-indigo-400" />
}

const SEVERITY_COLORS: Record<string, string> = {
  info: 'bg-blue-900/50 border-blue-700 text-blue-300',
  caution: 'bg-yellow-900/50 border-yellow-700 text-yellow-300',
  warning: 'bg-orange-900/50 border-orange-700 text-orange-300',
  critical: 'bg-red-900/50 border-red-700 text-red-300'
}

interface MemoryDashboardClientProps {
  userId: string
}

export function MemoryDashboardClient({ userId }: MemoryDashboardClientProps) {
  const [activeTab, setActiveTab] = useState<TabType>('overview')
  const [memories, setMemories] = useState<UserMemoryEntry[]>([])
  const [insights, setInsights] = useState<WorkoutInsight[]>([])
  const [loading, setLoading] = useState(true)
  const [consolidating, setConsolidating] = useState(false)

  useEffect(() => {
    loadData()
  }, [userId])

  const loadData = async () => {
    try {
      setLoading(true)
      const [memoriesData, insightsData] = await Promise.all([
        memoryService.getActiveMemories(userId),
        insightService.getActiveInsights(userId)
      ])
      setMemories(memoriesData)
      setInsights(insightsData)
    } catch (error) {
      console.error('[MemoryDashboard] Failed to load data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleArchiveMemory = async (memoryId: string) => {
    try {
      await memoryService.archiveMemory(memoryId)
      await loadData()
    } catch (error) {
      console.error('[MemoryDashboard] Failed to archive memory:', error)
    }
  }

  const handleResolveInsight = async (insightId: string) => {
    try {
      await insightService.resolveInsight(insightId, 'user')
      await loadData()
    } catch (error) {
      console.error('[MemoryDashboard] Failed to resolve insight:', error)
    }
  }

  const handleExport = async () => {
    try {
      const exportData = await memoryService.exportMemories(userId)
      const blob = new Blob([JSON.stringify(exportData, null, 2)], {
        type: 'application/json'
      })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `arvo-memories-${new Date().toISOString().split('T')[0]}.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error('[MemoryDashboard] Failed to export:', error)
    }
  }

  const handleConsolidate = async () => {
    setConsolidating(true)
    setTimeout(() => {
      setConsolidating(false)
      loadData()
    }, 2000)
  }

  const getFilteredMemories = () => {
    if (activeTab === 'overview') return memories
    return memories.filter(m => m.memory_category === activeTab)
  }

  const getCategoryCount = (category: string) => {
    return memories.filter(m => m.memory_category === category).length
  }

  const getAverageConfidence = () => {
    if (memories.length === 0) return 0
    const sum = memories.reduce((acc, m) => acc + m.confidence_score, 0)
    return Math.round((sum / memories.length) * 100)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
      </div>
    )
  }

  const displayMemories = getFilteredMemories()

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Memory Dashboard</h1>
            <p className="text-gray-400">
              Cosa ha imparato Arvo su di te
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={handleConsolidate}
              disabled={consolidating}
              variant="outline"
              size="sm"
              className="flex items-center gap-2"
            >
              {consolidating ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <RefreshCw className="w-4 h-4" />
              )}
              Aggiorna
            </Button>
            <Button
              onClick={handleExport}
              variant="outline"
              size="sm"
              className="flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              Esporta
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-gray-800 rounded-lg p-4">
            <div className="text-2xl font-bold text-white mb-1">{memories.length}</div>
            <div className="text-sm text-gray-400">Memories Attive</div>
          </div>
          <div className="bg-gray-800 rounded-lg p-4">
            <div className="text-2xl font-bold text-white mb-1">{getAverageConfidence()}%</div>
            <div className="text-sm text-gray-400">Confidence Media</div>
          </div>
          <div className="bg-gray-800 rounded-lg p-4">
            <div className="text-2xl font-bold text-white mb-1">{insights.length}</div>
            <div className="text-sm text-gray-400">Insights Attivi</div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        {(['overview', 'preference', 'limitation', 'pattern', 'strength', 'equipment'] as TabType[]).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-lg font-medium transition-colors whitespace-nowrap ${
              activeTab === tab
                ? 'bg-purple-600 text-white'
                : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
            }`}
          >
            {tab === 'overview' ? `Overview (${memories.length})` : `${tab.charAt(0).toUpperCase() + tab.slice(1)} (${getCategoryCount(tab)})`}
          </button>
        ))}
      </div>

      {/* Insights Section */}
      {activeTab === 'overview' && insights.length > 0 && (
        <div className="mb-6">
          <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <Lightbulb className="w-5 h-5 text-yellow-400" />
            Insights Attivi
          </h2>
          <div className="space-y-3">
            {insights.map(insight => (
              <div
                key={insight.id}
                className={`rounded-lg border p-4 ${SEVERITY_COLORS[insight.severity || 'info']}`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-sm font-semibold uppercase">{insight.insight_type}</span>
                      {insight.exercise_name && (
                        <span className="text-sm opacity-75">• {insight.exercise_name}</span>
                      )}
                    </div>
                    <p className="text-sm mb-2">{insight.user_note}</p>
                    <div className="flex items-center gap-4 text-xs opacity-75">
                      <span>Relevance: {Math.round(insight.relevance_score * 100)}%</span>
                      <span>•</span>
                      <span>{new Date(insight.created_at).toLocaleDateString('it-IT')}</span>
                    </div>
                  </div>
                  <button
                    onClick={() => handleResolveInsight(insight.id)}
                    className="ml-4 p-2 hover:bg-white/10 rounded transition-colors"
                    title="Segna come risolto"
                  >
                    <CheckCircle className="w-5 h-5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Memories Cards */}
      <div className="space-y-4">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <Brain className="w-5 h-5 text-purple-400" />
          {activeTab === 'overview' ? 'Tutte le Memories' : `Memories: ${activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}`}
        </h2>

        {displayMemories.length === 0 ? (
          <div className="text-center py-12 bg-gray-800 rounded-lg">
            <Brain className="w-12 h-12 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400">
              {activeTab === 'overview'
                ? 'Nessuna memory ancora. Continua ad allenarti!'
                : `Nessuna memory in "${activeTab}"`
              }
            </p>
          </div>
        ) : (
          <div className="grid gap-4">
            {displayMemories.map(memory => (
              <div
                key={memory.id}
                className="bg-gray-800 rounded-lg border border-gray-700 p-4 hover:border-purple-500/50 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3 flex-1">
                    <div className="p-2 bg-gray-700/50 rounded">
                      {CATEGORY_ICONS[memory.memory_category] || <Brain className="w-5 h-5" />}
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-white mb-1">{memory.title}</h3>
                      {memory.description && (
                        <p className="text-sm text-gray-400 mb-3">{memory.description}</p>
                      )}
                      {/* Confidence Bar */}
                      <div className="mb-3">
                        <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                          <span>Confidence</span>
                          <span className="font-semibold">{Math.round(memory.confidence_score * 100)}%</span>
                        </div>
                        <div className="w-full h-2 bg-gray-700 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-purple-600 to-blue-500"
                            style={{ width: `${memory.confidence_score * 100}%` }}
                          />
                        </div>
                      </div>
                      {/* Related Exercises */}
                      {memory.related_exercises && memory.related_exercises.length > 0 && (
                        <div className="flex flex-wrap gap-2 mb-2">
                          {memory.related_exercises.slice(0, 3).map((ex, idx) => (
                            <span
                              key={idx}
                              className="text-xs px-2 py-1 bg-gray-700 rounded text-gray-300"
                            >
                              {ex}
                            </span>
                          ))}
                          {memory.related_exercises.length > 3 && (
                            <span className="text-xs px-2 py-1 text-gray-500">
                              +{memory.related_exercises.length - 3}
                            </span>
                          )}
                        </div>
                      )}
                      {/* Footer */}
                      <div className="flex items-center gap-3 text-xs text-gray-500">
                        <span>Confermata {memory.times_confirmed}x</span>
                        <span>•</span>
                        <span>{new Date(memory.created_at).toLocaleDateString('it-IT')}</span>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => handleArchiveMemory(memory.id)}
                    className="ml-4 p-2 hover:bg-red-600/20 rounded transition-colors text-gray-400 hover:text-red-400"
                    title="Archivia"
                  >
                    <Archive className="w-5 h-5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
