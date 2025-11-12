/**
 * Embedding Service
 * Generates and manages text embeddings using OpenAI API
 * Used for semantic search in exercise matching
 */

import OpenAI from 'openai'

const EMBEDDING_MODEL = 'text-embedding-3-small' // 1536 dimensions, $0.02/1M tokens
const BATCH_SIZE = 100 // Process 100 texts at a time to respect rate limits
const MAX_RETRIES = 3
const RETRY_DELAY = 1000 // 1 second

export class EmbeddingService {
  private static openai: OpenAI | null = null

  /**
   * Initialize OpenAI client
   * MUST be called server-side only (uses secure API key)
   */
  private static getClient(): OpenAI {
    // Ensure we're on server-side
    if (typeof window !== 'undefined') {
      throw new Error(
        '[EmbeddingService] Cannot be used client-side. Use server action (generateQueryEmbedding) instead.'
      )
    }

    if (!this.openai) {
      const apiKey = process.env.OPENAI_API_KEY

      if (!apiKey) {
        throw new Error(
          '[EmbeddingService] OPENAI_API_KEY not found in environment variables'
        )
      }

      this.openai = new OpenAI({
        apiKey,
      })
    }

    return this.openai
  }

  /**
   * Generate embedding for a single text
   */
  static async generateEmbedding(text: string, retries = 0): Promise<number[]> {
    try {
      const client = this.getClient()

      const response = await client.embeddings.create({
        model: EMBEDDING_MODEL,
        input: text,
        encoding_format: 'float',
      })

      return response.data[0].embedding
    } catch (error) {
      console.error(`[EmbeddingService] Error generating embedding for "${text}":`, error)

      // Retry logic for rate limits or transient errors
      if (retries < MAX_RETRIES) {
        console.log(`[EmbeddingService] Retrying... (${retries + 1}/${MAX_RETRIES})`)
        await this.delay(RETRY_DELAY * (retries + 1)) // Exponential backoff
        return this.generateEmbedding(text, retries + 1)
      }

      throw error
    }
  }

  /**
   * Generate embeddings for multiple texts in batches
   * Respects rate limits by processing in chunks
   */
  static async generateBatchEmbeddings(
    texts: string[],
    onProgress?: (processed: number, total: number) => void
  ): Promise<number[][]> {
    const embeddings: number[][] = []
    const batches = this.chunkArray(texts, BATCH_SIZE)

    console.log(
      `[EmbeddingService] Generating embeddings for ${texts.length} texts in ${batches.length} batches...`
    )

    for (let i = 0; i < batches.length; i++) {
      const batch = batches[i]

      try {
        const client = this.getClient()

        const response = await client.embeddings.create({
          model: EMBEDDING_MODEL,
          input: batch,
          encoding_format: 'float',
        })

        // Extract embeddings in order
        const batchEmbeddings = response.data
          .sort((a, b) => a.index - b.index)
          .map((item) => item.embedding)

        embeddings.push(...batchEmbeddings)

        // Report progress
        const processed = (i + 1) * BATCH_SIZE
        if (onProgress) {
          onProgress(Math.min(processed, texts.length), texts.length)
        }

        // Rate limiting: small delay between batches
        if (i < batches.length - 1) {
          await this.delay(200) // 200ms between batches
        }
      } catch (error) {
        console.error(`[EmbeddingService] Error in batch ${i + 1}/${batches.length}:`, error)
        throw error
      }
    }

    console.log(`[EmbeddingService] ✓ Generated ${embeddings.length} embeddings`)
    return embeddings
  }

  /**
   * Calculate cosine similarity between two vectors
   * Returns value between -1 and 1 (higher = more similar)
   */
  static cosineSimilarity(a: number[], b: number[]): number {
    if (a.length !== b.length) {
      throw new Error(
        `[EmbeddingService] Vector dimensions don't match: ${a.length} vs ${b.length}`
      )
    }

    let dotProduct = 0
    let magnitudeA = 0
    let magnitudeB = 0

    for (let i = 0; i < a.length; i++) {
      dotProduct += a[i] * b[i]
      magnitudeA += a[i] * a[i]
      magnitudeB += b[i] * b[i]
    }

    magnitudeA = Math.sqrt(magnitudeA)
    magnitudeB = Math.sqrt(magnitudeB)

    if (magnitudeA === 0 || magnitudeB === 0) {
      return 0
    }

    return dotProduct / (magnitudeA * magnitudeB)
  }

  /**
   * Find top N most similar texts from a list
   */
  static findMostSimilar(
    queryEmbedding: number[],
    candidates: Array<{ text: string; embedding: number[] }>,
    topN: number = 5
  ): Array<{ text: string; similarity: number }> {
    const similarities = candidates.map((candidate) => ({
      text: candidate.text,
      similarity: this.cosineSimilarity(queryEmbedding, candidate.embedding),
    }))

    // Sort by similarity (descending) and return top N
    return similarities.sort((a, b) => b.similarity - a.similarity).slice(0, topN)
  }

  /**
   * Helper: Split array into chunks
   */
  private static chunkArray<T>(array: T[], size: number): T[][] {
    const chunks: T[][] = []
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size))
    }
    return chunks
  }

  /**
   * Helper: Delay for retry logic
   */
  private static delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms))
  }

  /**
   * Estimate cost for generating embeddings
   * text-embedding-3-small: $0.02 per 1M tokens
   * Rough estimate: ~10 tokens per exercise name
   */
  static estimateCost(textCount: number, avgTokensPerText: number = 10): string {
    const totalTokens = textCount * avgTokensPerText
    const costPer1M = 0.02
    const estimatedCost = (totalTokens / 1_000_000) * costPer1M

    return `~$${estimatedCost.toFixed(4)} (${textCount} texts × ${avgTokensPerText} tokens = ${totalTokens} tokens)`
  }
}
