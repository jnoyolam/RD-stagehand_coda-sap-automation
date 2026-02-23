/**
 * Retry Manager with Exponential Backoff
 *
 * Handles automatic retry logic for transient failures with configurable
 * backoff strategy. Prevents cascading failures and improves resilience.
 */

export interface RetryConfig {
  maxAttempts: number;
  baseDelay: number;
  maxDelay: number;
  backoffMultiplier: number;
  retryableErrors: string[];
}

export class RetryManager {
  private config: RetryConfig;

  constructor(config: Partial<RetryConfig> = {}) {
    this.config = {
      maxAttempts: config.maxAttempts ?? 3,
      baseDelay: config.baseDelay ?? 1000,
      maxDelay: config.maxDelay ?? 10000,
      backoffMultiplier: config.backoffMultiplier ?? 2,
      retryableErrors: config.retryableErrors ?? [
        'timeout',
        'network',
        'ECONNREFUSED',
        'ECONNRESET',
        'ETIMEDOUT',
        'ENOTFOUND',
        'fetch failed',
        'socket hang up'
      ],
      ...config
    };
  }

  /**
   * Execute function with automatic retry on transient failures
   */
  async executeWithRetry<T>(
    fn: () => Promise<T>,
    context: string
  ): Promise<T> {
    let lastError: Error | undefined;

    for (let attempt = 1; attempt <= this.config.maxAttempts; attempt++) {
      try {
        return await fn();
      } catch (error: any) {
        lastError = error;

        // Don't retry if error is not retryable
        if (!this.isRetryable(error)) {
          throw error;
        }

        // Don't retry on last attempt
        if (attempt >= this.config.maxAttempts) {
          break;
        }

        const delay = this.calculateDelay(attempt);
        console.log(
          `⚠️  ${context} failed (attempt ${attempt}/${this.config.maxAttempts}). ` +
          `Retrying in ${delay}ms... Reason: ${error.message}`
        );
        await this.sleep(delay);
      }
    }

    throw new Error(
      `${context} failed after ${this.config.maxAttempts} attempts. Last error: ${lastError?.message}`
    );
  }

  /**
   * Check if error is retryable based on error message
   */
  private isRetryable(error: any): boolean {
    if (!error) return false;

    const errorMessage = (error.message || String(error)).toLowerCase();
    const errorName = (error.name || '').toLowerCase();

    return this.config.retryableErrors.some(pattern => {
      const patternLower = pattern.toLowerCase();
      return errorMessage.includes(patternLower) || errorName.includes(patternLower);
    });
  }

  /**
   * Calculate delay with exponential backoff
   */
  private calculateDelay(attempt: number): number {
    const delay = this.config.baseDelay * Math.pow(this.config.backoffMultiplier, attempt - 1);
    return Math.min(delay, this.config.maxDelay);
  }

  /**
   * Sleep for specified milliseconds
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
