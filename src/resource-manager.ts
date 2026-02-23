/**
 * Resource Manager
 *
 * Manages lifecycle of browser instances and ensures proper cleanup
 * on process exit. Prevents resource leaks and zombie processes.
 */

import { Stagehand } from '@browserbasehq/stagehand';

export class ResourceManager {
  private resources: Set<Stagehand> = new Set();
  private cleanupCallbacks: Set<() => Promise<void>> = new Set();
  private isCleaningUp = false;
  private totalTokensUsed: number = 0;

  /**
   * Register a Stagehand instance for automatic cleanup
   */
  register(stagehand: Stagehand): void {
    this.resources.add(stagehand);
  }

  /**
   * Unregister a Stagehand instance (when manually closed)
   */
  unregister(stagehand: Stagehand): void {
    this.resources.delete(stagehand);
  }

  /**
   * Register a custom cleanup callback
   */
  registerCleanup(callback: () => Promise<void>): void {
    this.cleanupCallbacks.add(callback);
  }

  /**
   * Clean up all registered resources
   */
  async cleanupAll(): Promise<void> {
    if (this.isCleaningUp) {
      return; // Prevent recursive cleanup
    }

    this.isCleaningUp = true;
    const errors: Error[] = [];

    // Execute custom cleanup callbacks
    for (const callback of this.cleanupCallbacks) {
      try {
        await callback();
      } catch (error: any) {
        errors.push(error);
        console.error('❌ Cleanup callback failed:', error.message);
      }
    }

    // Close all Stagehand instances
    for (const stagehand of this.resources) {
      try {
        await stagehand.close();
      } catch (error: any) {
        errors.push(error);
        console.error('❌ Failed to close Stagehand:', error.message);
      }
    }

    this.resources.clear();
    this.cleanupCallbacks.clear();
    this.isCleaningUp = false;

    if (errors.length > 0) {
      console.error(`⚠️  ${errors.length} cleanup error(s) occurred`);
    }
  }

  /**
   * Get count of active resources
   */
  getActiveCount(): number {
    return this.resources.size;
  }

  /**
   * Track token usage from API calls
   */
  addTokens(tokens: number): void {
    this.totalTokensUsed += tokens;
  }

  /**
   * Get total tokens used across all API calls
   */
  getTotalTokens(): number {
    return this.totalTokensUsed;
  }

  /**
   * Reset token counter (useful for testing)
   */
  resetTokens(): void {
    this.totalTokensUsed = 0;
  }
}

// Global resource manager instance
const globalResourceManager = new ResourceManager();

// Setup process signal handlers for graceful shutdown
let isShuttingDown = false;

async function gracefulShutdown(signal: string): Promise<void> {
  if (isShuttingDown) {
    return;
  }

  isShuttingDown = true;
  console.log(`\n🛑 ${signal} received, cleaning up resources...`);

  try {
    await globalResourceManager.cleanupAll();
    console.log('✅ Cleanup complete');
  } catch (error: any) {
    console.error('❌ Cleanup failed:', error.message);
    process.exit(1);
  }

  process.exit(0);
}

process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));

// Handle uncaught errors but still cleanup
process.on('uncaughtException', async (error) => {
  console.error('❌ Uncaught exception:', error);
  await globalResourceManager.cleanupAll();
  process.exit(1);
});

process.on('unhandledRejection', async (error: any) => {
  console.error('❌ Unhandled rejection:', error);
  await globalResourceManager.cleanupAll();
  process.exit(1);
});

export { globalResourceManager };
