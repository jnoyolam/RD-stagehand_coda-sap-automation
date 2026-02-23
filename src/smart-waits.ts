/**
 * Smart Waits System
 *
 * Intelligent waiting strategies that detect actual page readiness
 * instead of using fixed timeouts. Improves test reliability and speed.
 *
 * Note: Functions passed to page.waitForFunction() execute in browser context
 * where document and window globals are available. TypeScript may show errors
 * but the code runs correctly.
 */

import { Page } from 'playwright';

export interface WaitConfig {
  timeout: number;
  pollInterval: number;
  networkIdleTimeout: number;
}

export class SmartWaits {
  private config: WaitConfig;

  constructor(config: Partial<WaitConfig> = {}) {
    this.config = {
      timeout: config.timeout ?? 30000,
      pollInterval: config.pollInterval ?? 100,
      networkIdleTimeout: config.networkIdleTimeout ?? 2000,
      ...config
    };
  }

  /**
   * Wait for page to be fully ready for interaction
   */
  async waitForPageReady(page: Page): Promise<void> {
    try {
      // Wait for DOM to be loaded
      await page.waitForLoadState('domcontentloaded', {
        timeout: this.config.timeout
      });

      // Try to wait for network idle (best effort - SPAs may not reach this)
      await page.waitForLoadState('networkidle', {
        timeout: this.config.networkIdleTimeout
      }).catch(() => {
        // Network idle timeout is expected for SPAs with long polling
        // This is not an error, just continue
      });

      // Wait for JavaScript frameworks to finish rendering
      await this.waitForJavaScriptReady(page);

    } catch (error: any) {
      console.warn(`⚠️  Page ready wait warning: ${error.message}`);
      // Don't throw - best effort waiting
    }
  }

  /**
   * Wait for JavaScript frameworks to complete rendering
   */
  private async waitForJavaScriptReady(page: Page): Promise<void> {
    try {
      await page.waitForFunction(
        `() => {
          if (document.readyState !== 'complete') return false;
          const reactRoot = document.querySelector('[data-reactroot], #root, #__next');
          if (reactRoot && reactRoot.children.length === 0) return false;
          const vueApp = document.querySelector('[data-v-app]');
          if (vueApp && vueApp.children.length === 0) return false;
          return true;
        }`,
        { timeout: this.config.timeout }
      );
    } catch (error) {
      // Best effort - don't fail if we can't detect framework readiness
    }
  }

  /**
   * Wait for element to be visible and interactable
   */
  async waitForElement(
    page: Page,
    selector: string,
    options: { timeout?: number; state?: 'visible' | 'attached' | 'hidden' } = {}
  ): Promise<void> {
    const timeout = options.timeout ?? this.config.timeout;
    const state = options.state ?? 'visible';

    await page.waitForSelector(selector, {
      state,
      timeout
    });

    // Additional check for visibility and interactability
    if (state === 'visible') {
      await page.waitForFunction(
        `(sel) => {
          const element = document.querySelector(sel);
          if (!element) return false;
          const rect = element.getBoundingClientRect();
          if (rect.width === 0 || rect.height === 0) return false;
          const style = window.getComputedStyle(element);
          if (style.display === 'none' || style.visibility === 'hidden' || style.opacity === '0') {
            return false;
          }
          return true;
        }`,
        selector,
        { timeout }
      );
    }
  }

  /**
   * Wait for navigation to complete with optional URL pattern matching
   */
  async waitForNavigation(
    page: Page,
    urlPattern?: string | RegExp,
    options: { timeout?: number } = {}
  ): Promise<void> {
    const timeout = options.timeout ?? this.config.timeout;
    const startUrl = page.url();

    // Wait for navigation event
    await page.waitForLoadState('domcontentloaded', { timeout });

    // If URL pattern provided, verify it matches
    if (urlPattern) {
      await page.waitForFunction(
        `({ pattern, isRegex }) => {
          if (isRegex) {
            const regex = new RegExp(pattern.slice(1, -1));
            return regex.test(window.location.href);
          }
          return window.location.href.includes(pattern);
        }`,
        {
          pattern: urlPattern.toString(),
          isRegex: urlPattern instanceof RegExp
        },
        { timeout }
      );
    } else {
      // Just wait for URL to change
      await page.waitForFunction(
        `(oldUrl) => window.location.href !== oldUrl`,
        startUrl,
        { timeout }
      );
    }

    // Wait for page to be fully ready after navigation
    await this.waitForPageReady(page);
  }

  /**
   * Wait for condition with custom function
   */
  async waitForCondition(
    page: Page,
    condition: () => boolean | Promise<boolean>,
    options: { timeout?: number; message?: string } = {}
  ): Promise<void> {
    const timeout = options.timeout ?? this.config.timeout;
    const startTime = Date.now();

    while (Date.now() - startTime < timeout) {
      try {
        const result = await condition();
        if (result) return;
      } catch (error) {
        // Continue polling on error
      }

      await new Promise(resolve => setTimeout(resolve, this.config.pollInterval));
    }

    throw new Error(
      options.message || `Condition not met within ${timeout}ms`
    );
  }

  /**
   * Wait with timeout (for backward compatibility with existing code)
   * This is a fallback - prefer other smart wait methods
   */
  async wait(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
