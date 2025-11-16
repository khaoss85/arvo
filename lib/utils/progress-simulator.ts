/**
 * ProgressSimulator
 *
 * Simulates smooth progress updates during long-running operations (like AI calls)
 * to provide continuous user feedback instead of freezing the progress bar.
 *
 * Usage:
 * ```typescript
 * const simulator = new ProgressSimulator()
 *
 * simulator.start(45, 75, 120000, async (progress) => {
 *   await sendProgress('ai', progress, 'Processing...')
 * })
 *
 * try {
 *   await longRunningAICall()
 * } finally {
 *   simulator.stop()
 * }
 * ```
 */
export class ProgressSimulator {
  private interval: NodeJS.Timeout | null = null
  private currentProgress: number = 0
  private startProgress: number = 0
  private endProgress: number = 0
  private stopped: boolean = false

  /**
   * Start simulating progress updates
   *
   * @param from - Starting progress percentage (e.g., 45)
   * @param to - Ending progress percentage (e.g., 75)
   * @param estimatedDurationMs - Estimated duration of the operation in milliseconds
   * @param onUpdate - Callback function called with each progress update
   * @param updateIntervalMs - How often to update progress (default: 2000ms)
   */
  start(
    from: number,
    to: number,
    estimatedDurationMs: number,
    onUpdate: (progress: number) => void | Promise<void>,
    updateIntervalMs: number = 2000
  ) {
    this.startProgress = from
    this.endProgress = to
    this.currentProgress = from
    this.stopped = false

    // Calculate how much to increment per update
    const totalUpdates = Math.floor(estimatedDurationMs / updateIntervalMs)
    const totalRange = to - from
    const incrementPerUpdate = totalRange / totalUpdates

    // Start interval
    this.interval = setInterval(async () => {
      if (this.stopped) {
        this.cleanup()
        return
      }

      // Increment progress, but never reach the end (leave 1% buffer)
      this.currentProgress = Math.min(
        this.currentProgress + incrementPerUpdate,
        this.endProgress - 1
      )

      // Round to nearest integer for cleaner display
      const roundedProgress = Math.floor(this.currentProgress)

      // Call update callback
      try {
        await onUpdate(roundedProgress)
      } catch (error) {
        console.error('[ProgressSimulator] Error in update callback:', error)
      }
    }, updateIntervalMs)
  }

  /**
   * Stop the progress simulation
   * Should be called when the actual operation completes
   */
  stop() {
    this.stopped = true
    this.cleanup()
  }

  /**
   * Clean up interval
   */
  private cleanup() {
    if (this.interval) {
      clearInterval(this.interval)
      this.interval = null
    }
  }

  /**
   * Get current simulated progress
   */
  getCurrentProgress(): number {
    return Math.floor(this.currentProgress)
  }
}
