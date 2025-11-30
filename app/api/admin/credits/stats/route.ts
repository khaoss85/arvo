import { NextResponse } from 'next/server'
import { getSupabaseServerClient } from '@/lib/supabase/server'
import { isAdmin } from '@/lib/utils/auth.server'

interface AgentStats {
  agentName: string
  totalCredits: number
  totalCalls: number
  avgCredits: number
  totalTokensInput: number
  totalTokensOutput: number
}

interface OperationStats {
  operationType: string
  totalCredits: number
  totalCalls: number
  estimatedCostUsd: number
}

export async function GET() {
  const admin = await isAdmin()
  if (!admin) {
    return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 })
  }

  const supabase = await getSupabaseServerClient()

  try {
    // Fetch all credit usage data
    const { data: usageData, error } = await supabase
      .from('credit_usage')
      .select('agent_name, operation_type, credits_used, tokens_input, tokens_output, estimated_cost_usd')

    if (error) {
      console.error('[Admin Credits Stats] Error:', error)
      throw error
    }

    if (!usageData || usageData.length === 0) {
      return NextResponse.json({
        success: true,
        byAgent: [],
        byOperation: [],
        totals: {
          totalCredits: 0,
          totalCalls: 0,
          estimatedCostUsd: 0,
          avgCreditsPerCall: 0,
          totalTokensInput: 0,
          totalTokensOutput: 0,
        },
      })
    }

    // Aggregate by agent
    const agentMap = new Map<string, {
      totalCredits: number
      totalCalls: number
      totalTokensInput: number
      totalTokensOutput: number
    }>()

    // Aggregate by operation
    const operationMap = new Map<string, {
      totalCredits: number
      totalCalls: number
      estimatedCostUsd: number
    }>()

    // Calculate totals
    let totalCredits = 0
    let totalCalls = 0
    let totalEstimatedCostUsd = 0
    let totalTokensInput = 0
    let totalTokensOutput = 0

    for (const row of usageData) {
      const credits = Number(row.credits_used) || 0
      const tokensIn = row.tokens_input || 0
      const tokensOut = row.tokens_output || 0
      const costUsd = Number(row.estimated_cost_usd) || 0

      totalCredits += credits
      totalCalls++
      totalEstimatedCostUsd += costUsd
      totalTokensInput += tokensIn
      totalTokensOutput += tokensOut

      // By agent
      const agentName = row.agent_name || 'Unknown'
      const agentData = agentMap.get(agentName) || {
        totalCredits: 0,
        totalCalls: 0,
        totalTokensInput: 0,
        totalTokensOutput: 0,
      }
      agentData.totalCredits += credits
      agentData.totalCalls++
      agentData.totalTokensInput += tokensIn
      agentData.totalTokensOutput += tokensOut
      agentMap.set(agentName, agentData)

      // By operation
      const opType = row.operation_type || 'other'
      const opData = operationMap.get(opType) || {
        totalCredits: 0,
        totalCalls: 0,
        estimatedCostUsd: 0,
      }
      opData.totalCredits += credits
      opData.totalCalls++
      opData.estimatedCostUsd += costUsd
      operationMap.set(opType, opData)
    }

    // Convert to arrays and sort by credits
    const byAgent: AgentStats[] = Array.from(agentMap.entries())
      .map(([agentName, data]) => ({
        agentName,
        totalCredits: Math.round(data.totalCredits),
        totalCalls: data.totalCalls,
        avgCredits: Math.round((data.totalCredits / data.totalCalls) * 10) / 10,
        totalTokensInput: data.totalTokensInput,
        totalTokensOutput: data.totalTokensOutput,
      }))
      .sort((a, b) => b.totalCredits - a.totalCredits)

    const byOperation: OperationStats[] = Array.from(operationMap.entries())
      .map(([operationType, data]) => ({
        operationType,
        totalCredits: Math.round(data.totalCredits),
        totalCalls: data.totalCalls,
        estimatedCostUsd: Math.round(data.estimatedCostUsd * 1000) / 1000,
      }))
      .sort((a, b) => b.totalCredits - a.totalCredits)

    return NextResponse.json({
      success: true,
      byAgent,
      byOperation,
      totals: {
        totalCredits: Math.round(totalCredits),
        totalCalls,
        estimatedCostUsd: Math.round(totalEstimatedCostUsd * 1000) / 1000,
        avgCreditsPerCall: totalCalls > 0 ? Math.round((totalCredits / totalCalls) * 10) / 10 : 0,
        totalTokensInput,
        totalTokensOutput,
      },
    })
  } catch (error) {
    console.error('[Admin Credits Stats] Error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch credit stats' },
      { status: 500 }
    )
  }
}
