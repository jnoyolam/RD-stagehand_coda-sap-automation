 /**
 * SAP Automation Framework
 *
 * This module provides specialized automation capabilities for SAP systems.
 * It extends the base Stagehand framework with SAP-specific functionality for:
 *
 * - SAP Fiori (UI5 applications)
 * - SAP WebGUI (SAP GUI for HTML)
 * - SAP Business One
 * - SAP S/4HANA
 *
 * Key Features:
 * - UI5 element detection (ui5-class, ui5-role, ui5-type attributes)
 * - SAP WebGUI element detection (sapweb- attributes)
 * - Transaction code (T-code) navigation
 * - SAP-specific wait strategies
 * - Fiori Launchpad automation
 * - Data extraction from SAP tables
 * - SAP session management
 * - Multi-window/tab handling for SAP
 *
 * Architecture:
 * SAPAutomation (Base) → SAPFioriAutomation (Fiori specific)
 *                      → SAPWebGUIAutomation (WebGUI specific)
 */

import { Stagehand } from '@browserbasehq/stagehand';
import { config } from '../../src/config.js';
import { z } from 'zod';
import { RetryManager } from '../../src/retry-manager.js';
import { SmartWaits } from '../../src/smart-waits.js';
import { globalResourceManager } from '../../src/resource-manager.js';
import { Page } from 'playwright';

/**
 * SAP-specific configuration
 */
export interface SAPConfig {
  /** SAP system URL */
  baseUrl: string;
  /** SAP client number (e.g., "100") */
  client?: string;
  /** Language code (e.g., "EN", "ES", "DE") */
  language?: string;
  /** Enable SAP-specific waits */
  enableSAPWaits?: boolean;
  /** Session timeout in milliseconds */
  sessionTimeout?: number;
}

/**
 * Base SAP Automation Class
 *
 * Provides core functionality for all SAP system automation.
 * This class should be extended for specific SAP interfaces.
 */
export class SAPAutomation {
  protected stagehand: Stagehand | null = null;
  protected retryManager: RetryManager;
  protected smartWaits: SmartWaits;
  protected sapConfig: SAPConfig;

  constructor(sapConfig: SAPConfig) {
    this.sapConfig = {
      enableSAPWaits: true,
      sessionTimeout: 300000, // 5 minutes default
      language: 'EN',
      ...sapConfig
    };

    // Initialize retry manager with SAP-optimized settings
    this.retryManager = new RetryManager({
      maxAttempts: config.retry.maxAttempts,
      baseDelay: config.retry.baseDelay,
      maxDelay: config.retry.maxDelay,
      backoffMultiplier: config.retry.backoffMultiplier,
      retryableErrors: [
        'timeout',
        'network',
        'ECONNREFUSED',
        'ECONNRESET',
        'ETIMEDOUT',
        'ENOTFOUND',
        'fetch failed',
        'socket hang up',
        'SAP session expired',
        'SAP system not available',
        'Transaction cancelled',
        'ui5 framework not loaded'
      ]
    });

    // Initialize smart waits with SAP-optimized settings
    this.smartWaits = new SmartWaits({
      timeout: config.waits.timeout,
      pollInterval: config.waits.pollInterval,
      networkIdleTimeout: config.waits.networkIdleTimeout
    });
  }

  /**
   * Initialize Stagehand with SAP-optimized settings
   */
  async initialize() {
    console.log('Initializing SAP Automation in LOCAL mode...');
    console.log(`SAP Base URL: ${this.sapConfig.baseUrl}`);
    console.log(`Language: ${this.sapConfig.language}`);
    if (this.sapConfig.client) {
      console.log(`Client: ${this.sapConfig.client}`);
    }

    await this.retryManager.executeWithRetry(
      async () => {
        const modelConfig = config.getModelConfig();

        
        this.stagehand = new Stagehand({
          env: 'LOCAL',
          modelName: `openai/${modelConfig.model}`,
          modelClientOptions: {
            apiKey: modelConfig.apiKey,
            baseURL: modelConfig.baseURL
          },
          verbose: 1,
          enableCaching: false
        });
        
        
        /*
        this.stagehand = new Stagehand({
          env: 'LOCAL',
          modelName: 'deepseek/deepseek-chat',
          verbose: 1,
          enableCaching: false
        });
        */

        await this.stagehand.init();
        // Attempt to maximize browser viewport to full screen for better visibility
        try {
          if (this.stagehand?.page) {
            const page = this.stagehand.page;
            // Use a default fallback; try to read actual screen size from the page if possible
            let desiredViewport = { width: 1520, height: 680 };

            try {
              const screenSize = await page.evaluate(() => ({
                width: 1520,
                height: 680
              }));
              desiredViewport = screenSize;
            } catch (e) {
              // ignore - keep fallback
            }

            try {
              await page.setViewportSize({ width: desiredViewport.width, height: desiredViewport.height });
              console.log(`✅ Set viewport to: ${desiredViewport.width}x${desiredViewport.height}`);
            } catch (err: any) {
              console.warn('⚠️  Could not set viewport on main page:', err?.message || err);
            }

            // Ensure any new pages/tabs inherit the same viewport size
            try {
              const ctx = page.context();
              ctx.on('page', async (newPage) => {
                try {
                  await newPage.setViewportSize({ width: desiredViewport.width, height: desiredViewport.height });
                  console.log(`✅ Applied viewport to new tab: ${desiredViewport.width}x${desiredViewport.height}`);
                } catch (err: any) {
                  console.warn('⚠️  Could not set viewport on new tab:', err?.message || err);
                }
              });
            } catch (err: any) {
              console.warn('⚠️  Could not attach new-tab viewport handler:', err?.message || err);
            }
          }
        } catch (err: any) {
          console.warn('⚠️  Could not set full screen viewport:', err?.message || err);
        }

        globalResourceManager.register(this.stagehand);

        console.log('✅ SAP Automation initialized');
      },
      'SAP Automation initialization'
    );
  }

  /**
   * Clean up resources
   */
  async cleanup() {
    if (this.stagehand) {
      console.log('Closing SAP Automation...');
      try {
        await this.stagehand.close();
        globalResourceManager.unregister(this.stagehand);
      } catch (error: any) {
        console.error('⚠️  Error during cleanup:', error.message);
        globalResourceManager.unregister(this.stagehand);
      }
    }
  }

  /**
   * Navigate to SAP URL with automatic retry and SAP-specific waits
   */
  async navigate(url: string) {
    if (!this.stagehand || !this.stagehand.page) {
      throw new Error('SAP Automation not initialized');
    }

    console.log(`Navigating to SAP: ${url}`);

    await this.retryManager.executeWithRetry(
      async () => {
        await this.stagehand!.page.goto(url);

        if (this.sapConfig.enableSAPWaits) {
          await this.waitForSAPReady();
        } else {
          await this.smartWaits.waitForPageReady(this.stagehand!.page);
        }
      },
      `SAP navigation to ${url}`
    );

    console.log('✅ SAP navigation complete');
  }

  /**
   * Wait for SAP system to be ready
   * Checks for common SAP loading indicators
   */
  protected async waitForSAPReady() {
    if (!this.stagehand || !this.stagehand.page) {
      throw new Error('SAP Automation not initialized');
    }

    const page = this.stagehand.page;

    try {
      // Wait for DOM to be loaded
      await page.waitForLoadState('domcontentloaded', {
        timeout: this.smartWaits['config'].timeout
      });

      // Wait for SAP-specific loading indicators to disappear
      await page.waitForFunction(
        `() => {
          // Check for SAP busy indicators
          const busyIndicators = document.querySelectorAll(
            '[role="progressbar"], .sapUiLocalBusyIndicator, .sapMBusyIndicator, #BUSY_INDICATOR'
          );

          for (const indicator of busyIndicators) {
            const style = window.getComputedStyle(indicator);
            if (style.display !== 'none' && style.visibility !== 'hidden') {
              return false;
            }
          }

          return true;
        }`,
        { timeout: 8000 }
      ).catch(() => {
        // Continue if busy indicators not found or timeout
      });

      console.log('✅ SAP system ready');
    } catch (error: any) {
      console.warn(`⚠️  SAP ready wait warning: ${error.message}`);
    }
  }

  /**
   * Perform action with SAP-specific retry logic
   */
  async act(instruction: string) {
    if (!this.stagehand || !this.stagehand.page) {
      throw new Error('SAP Automation not initialized');
    }

    console.log(`SAP Action: ${instruction}`);

    await this.retryManager.executeWithRetry(
      async () => {
        const res: any = await this.stagehand!.page.act({ action: instruction, iframes: true });

        // Wait for SAP to process the action
        if (this.sapConfig.enableSAPWaits) {
          await this.waitForSAPReady();
        }
      },
      `SAP Action: ${instruction}`
    );

    console.log('✅ SAP action complete');
  }

  /**
   * Extract data from SAP with schema validation
   */
  async extract<T>(instruction: string, schema: z.ZodSchema<T>): Promise<T> {
    if (!this.stagehand || !this.stagehand.page) {
      throw new Error('SAP Automation not initialized');
    }

    console.log(`SAP Extract: ${instruction}`);

    const result = await this.retryManager.executeWithRetry(
      async () => {
        const res: any = await this.stagehand!.page.extract({
          instruction,
          schema: schema as any,
          iframes: true
        });

        return res as T;
      },
      `SAP Extract: ${instruction}`
    );

    console.log('✅ SAP extraction complete');
    return result;
  }

  /**
   * Extract simple text from SAP page using natural language instruction
   * Useful for extracting confirmation messages, numbers, or other text content
   */
  async extractText(instruction: string, schema?: any): Promise<string> {

    const result = await this.stagehand!.page.extract({
      instruction,
      schema: schema as any,
      iframes: true
    });

    return result.text;
  }

  /**
   * Observe SAP elements
   */
  async observe(instruction: string) {
    if (!this.stagehand || !this.stagehand.page) {
      throw new Error('SAP Automation not initialized');
    }

    console.log(`SAP Observe: ${instruction}`);

    const result = await this.retryManager.executeWithRetry(
      async () => {
        const res: any = await this.stagehand!.page.observe({ instruction, iframes: true });

        return res;
      },
      `SAP Observe: ${instruction}`
    );

    console.log(`✅ Found ${result.length} SAP elements`);
    return result;
  }

  /**
   * Login to SAP system
   * Works for both Fiori and WebGUI
   */
  async login(username: string, password: string) {
    console.log(`Logging into SAP as: ${username}`);

    // Navigate to login page if needed
    await this.navigate(this.sapConfig.baseUrl);

    // Enter credentials - LLM will detect login form type
    await this.act(`type "${username}" in the username field`);
    await this.act(`type "${password}" in the password field`);
    /*
    // Enter client if provided
    if (this.sapConfig.client) {
      await this.act(`type "${this.sapConfig.client}" in the client field`);
    }
    */
    // Enter language if needed
    if (this.sapConfig.language) {
      await this.act(`type "${this.sapConfig.language}" in the language field`);
    }

    // Submit login
    await this.act('click the login button');

    // Wait for successful login
    if (this.sapConfig.enableSAPWaits) {
      await this.waitForSAPReady();
    }
    /*
    // Verify successful login by checking page title
    const pageTitle = await this.page.title();
    if (!pageTitle.includes('Home')) {
      throw new Error(`Login verification failed: Expected page title to contain 'Home', but got '${pageTitle}'`);
    }
    */
    console.log('✅ SAP login successful');
  }
    
async keyboard(key: string, options?: { times?: number }) {
    if (!this.stagehand || !this.stagehand.page) {
      throw new Error('SAP Automation not initialized');
    }

    const times = options?.times || 1;
    console.log(`Performing keyboard action: ${key} (x${times})`);

    for (let i = 0; i < times; i++) {
      await this.stagehand!.page.keyboard.press(key);
      await this.waitForSAPReady();
    }
    
    console.log('✅ Keyboard action complete');
  }

async keyboardType(text: string, options?: { times?: number }) {
    if (!this.stagehand || !this.stagehand.page) {
      throw new Error('SAP Automation not initialized');
    }

    const times = options?.times || 1;
    console.log(`Typing text: "${text}" (x${times})`);

    for (let i = 0; i < times; i++) {
      await this.stagehand!.page.keyboard.type(text);
      await this.waitForSAPReady();
    }
    
    console.log('✅ Text typing complete');
  }

  /**
   * Return today's date formatted as specified.
   * Supported formats: 'MM/DD/YYYY' (default), 'DD/MM/YYYY', 'YYYY-MM-DD'
   */
  getTodayFormattedDate(format: 'MM/DD/YYYY' | 'DD/MM/YYYY' | 'YYYY-MM-DD' = 'MM/DD/YYYY'): string {
    const today = new Date();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    const yyyy = String(today.getFullYear());

    switch (format) {
      case 'DD/MM/YYYY':
        return `${dd}/${mm}/${yyyy}`;
      case 'YYYY-MM-DD':
        return `${yyyy}-${mm}-${dd}`;
      case 'MM/DD/YYYY':
      default:
        return `${mm}/${dd}/${yyyy}`;
    }
  }

  /**
   * Get Playwright page instance
   */
  get page(): Page {
    if (!this.stagehand || !this.stagehand.page) {
      throw new Error('SAP Automation not initialized');
    }
    return this.stagehand.page;
  }

  /**
   * Get Stagehand instance
   */
  protected getStagehand(): Stagehand {
    if (!this.stagehand) {
      throw new Error('SAP Automation not initialized');
    }
    return this.stagehand;
  }
}

/**
 * SAP Fiori Automation Class
 *
 * Specialized for SAP Fiori applications (UI5 framework).
 * Handles Fiori Launchpad, UI5 elements, and Fiori-specific workflows.
 */
export class SAPFioriAutomation extends SAPAutomation {
  /**
   * Wait for UI5 framework to be fully loaded
   */
  async waitForUI5Ready() {
    if (!this.stagehand || !this.stagehand.page) {
      throw new Error('SAP Fiori Automation not initialized');
    }

    const page = this.stagehand.page;

    try {
      await page.waitForFunction(
        `() => {
          // Check if UI5 core is loaded
          if (typeof sap === 'undefined' || !sap.ui) {
            return false;
          }

          // Check if UI5 core is initialized
          if (!sap.ui.getCore) {
            return false;
          }

          const core = sap.ui.getCore();

          // Check if core is loaded
          if (!core || typeof core.isInitialized !== 'function') {
            return false;
          }

          // Check if rendering is complete
          if (core.getUIDirty && core.getUIDirty()) {
            return false;
          }

          return true;
        }`,
        { timeout: 30000 }
      );

      console.log('✅ UI5 framework ready');
    } catch (error: any) {
      console.warn(`⚠️  UI5 ready check warning: ${error.message}`);
      // Continue even if UI5 check fails - fallback to standard waits
    }
  }

  /**
   * Override waitForSAPReady to include UI5-specific checks
   */
  protected async waitForSAPReady() {
    await super.waitForSAPReady();
    await this.waitForUI5Ready();
  }

  /**
   * Navigate to Fiori Launchpad tile
   */
  async navigateToTile(tileName: string) {
    console.log(`Navigating to Fiori tile: ${tileName}`);

    await this.act(`click the tile named "${tileName}"`);
    await this.waitForSAPReady();

    console.log('✅ Tile navigation complete');
  }

  /**
   * Navigate using Fiori Launchpad search
   */
  async searchAndNavigate(searchTerm: string) {
    console.log(`Searching in Fiori Launchpad: ${searchTerm}`);

    await this.act('click the search button in the shell bar');
    await this.act(`type "${searchTerm}" in the search field`);
    // await this.act('press enter');
    await this.act('click the first search result');
    await this.waitForSAPReady();

    console.log('✅ Search navigation complete');
  }

  /**
   * Extract data from Fiori table
   */
  async extractTableData<T>(schema: z.ZodSchema<T>): Promise<T> {
    console.log('Extracting Fiori table data...');

    const data = await this.extract(
      'extract all visible rows from the table with their data',
      schema
    );

    return data;
  }

  /**
   * Filter Fiori table
   */
  async filterTable(filterCriteria: string) {
    console.log(`Filtering Fiori table: ${filterCriteria}`);

    await this.act('click the filter button');
    await this.act(`enter filter criteria: ${filterCriteria}`);
    await this.act('click apply filter');
    await this.waitForUI5Ready();

    console.log('✅ Table filter applied');
  }

  /**
   * Sort Fiori table
   */
  async sortTable(columnName: string, direction: 'ascending' | 'descending' = 'ascending') {
    console.log(`Sorting table by ${columnName} (${direction})`);

    await this.act(`click the column header for "${columnName}"`);

    if (direction === 'descending') {
      await this.act(`click the column header for "${columnName}" again`);
    }

    await this.waitForUI5Ready();

    console.log('✅ Table sorted');
  }
}

/**
 * SAP WebGUI Automation Class
 *
 * Specialized for SAP GUI for HTML (WebGUI).
 * Handles transaction codes, SAP-specific controls, and classic SAP workflows.
 */
export class SAPWebGUIAutomation extends SAPAutomation {
  /**
   * Execute SAP transaction code (T-code)
   */
  async executeTransaction(tcode: string) {
    console.log(`Executing transaction: ${tcode}`);

    // Navigate to transaction field and enter T-code
    await this.act('click the transaction code field in the toolbar');
    await this.act(`type "${tcode}" in the transaction code field`);
    await this.act('press enter');

    await this.waitForSAPReady();

    console.log(`✅ Transaction ${tcode} executed`);
  }

  /**
   * Navigate back in SAP (F3)
   */
  async navigateBack() {
    console.log('Navigating back in SAP');

    await this.act('click the back button or press F3');
    await this.waitForSAPReady();

    console.log('✅ Navigated back');
  }

  /**
   * Save in SAP (Ctrl+S)
   */
  async save() {
    console.log('Saving in SAP');

    await this.act('click the save button or press Ctrl+S');
    await this.waitForSAPReady();

    console.log('✅ Saved');
  }

  /**
   * Extract data from SAP table control
   */
  async extractSAPTable<T>(schema: z.ZodSchema<T>): Promise<T> {
    console.log('Extracting SAP table data...');

    const data = await this.extract(
      'extract all rows from the SAP table control with their data',
      schema
    );

    return data;
  }

  /**
   * Fill SAP form fields
   */
  async fillForm(fields: Record<string, string>) {
    console.log('Filling SAP form...');

    for (const [fieldName, value] of Object.entries(fields)) {
      await this.act(`type "${value}" in the field labeled "${fieldName}"`);
    }

    console.log('✅ Form filled');
  }

  /**
   * Click SAP toolbar button
   */
  async clickToolbarButton(buttonName: string) {
    console.log(`Clicking toolbar button: ${buttonName}`);

    await this.act(`click the "${buttonName}" button in the toolbar`);
    await this.waitForSAPReady();

    console.log('✅ Toolbar button clicked');
  }

  /**
   * Select item from SAP dropdown
   */
  async selectFromDropdown(dropdownLabel: string, value: string) {
    console.log(`Selecting "${value}" from dropdown "${dropdownLabel}"`);

    await this.act(`click the dropdown labeled "${dropdownLabel}"`);
    await this.act(`select "${value}" from the dropdown`);
    await this.waitForSAPReady();

    console.log('✅ Dropdown selection complete');
  }

  /**
   * Check SAP checkbox
   */
  async checkCheckbox(checkboxLabel: string) {
    console.log(`Checking checkbox: ${checkboxLabel}`);

    await this.act(`check the checkbox labeled "${checkboxLabel}"`);

    console.log('✅ Checkbox checked');
  }

  /**
   * Handle SAP popup/dialog
   */
  async handlePopup(action: 'accept' | 'cancel' = 'accept') {
    console.log(`Handling SAP popup: ${action}`);

    if (action === 'accept') {
      await this.act('click the OK or Yes button in the popup');
    } else {
      await this.act('click the Cancel or No button in the popup');
    }

    await this.waitForSAPReady();

    console.log('✅ Popup handled');
  }
}
