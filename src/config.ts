import dotenv from 'dotenv';

dotenv.config();

export const config = {
  // Azure OpenAI Configuration
  azureOpenAiEndpoint: process.env.AZURE_OPENAI_ENDPOINT || 'https://genaiapimna.jnj.com/openai-chat',
  azureOpenAiApiKey: process.env.AZURE_OPENAI_API_KEY || '76cf7f1a70af43e98c530f172887fac4',
  azureOpenAiDeployment: process.env.AZURE_OPENAI_DEPLOYMENT || 'gpt-4o',
  azureOpenAiApiVersion: process.env.AZURE_OPENAI_API_VERSION || '2024-10-21',

  // Proxy local (para agregar prefijo del provider al modelo)
  proxyUrl: process.env.PROXY_URL || 'http://localhost:3456',
  proxyPort: parseInt(process.env.PROXY_PORT || '3456', 10),
  useProxy: process.env.USE_PROXY !== 'false', // Usar proxy por defecto

  // eBay
  ebayBaseUrl: 'https://www.ebay.com',

  // Logging
  logLevel: process.env.LOG_LEVEL || 'info',

  // Retry Configuration
  retry: {
    maxAttempts: parseInt(process.env.RETRY_MAX_ATTEMPTS || '3', 10),
    baseDelay: parseInt(process.env.RETRY_BASE_DELAY || '1000', 10),
    maxDelay: parseInt(process.env.RETRY_MAX_DELAY || '10000', 10),
    backoffMultiplier: parseFloat(process.env.RETRY_BACKOFF_MULTIPLIER || '2')
  },

  // Wait Configuration
  waits: {
    timeout: parseInt(process.env.WAIT_TIMEOUT || '30000', 10),
    pollInterval: parseInt(process.env.WAIT_POLL_INTERVAL || '100', 10),
    networkIdleTimeout: parseInt(process.env.WAIT_NETWORK_IDLE_TIMEOUT || '2000', 10)
  },

  // Test Suite Configuration
  testSuite: {
    maxConcurrency: parseInt(process.env.TEST_MAX_CONCURRENCY || '2', 10),
    defaultTimeout: parseInt(process.env.TEST_DEFAULT_TIMEOUT || '120000', 10)
  },

  // Proxy Health Configuration
  proxy: {
    healthCheckInterval: parseInt(process.env.PROXY_HEALTH_CHECK_INTERVAL || '30000', 10),
    requestTimeout: parseInt(process.env.PROXY_REQUEST_TIMEOUT || '60000', 10),
    maxErrorThreshold: parseInt(process.env.PROXY_MAX_ERROR_THRESHOLD || '5', 10)
  },

  // Validate required configuration
  validate() {
    if (!this.azureOpenAiApiKey) {
      throw new Error('Missing AZURE_OPENAI_API_KEY in .env file');
    }
    if (!this.azureOpenAiEndpoint) {
      throw new Error('Missing AZURE_OPENAI_ENDPOINT in .env file');
    }

    // Validate numeric configurations
    if (this.retry.maxAttempts < 1) {
      throw new Error('RETRY_MAX_ATTEMPTS must be at least 1');
    }
    if (this.testSuite.maxConcurrency < 1) {
      throw new Error('TEST_MAX_CONCURRENCY must be at least 1');
    }
  },

  // Get model configuration for Stagehand
  getModelConfig() {
    return {
      model: this.azureOpenAiDeployment,
      apiKey: this.azureOpenAiApiKey,
      baseURL: this.useProxy ? this.proxyUrl : this.azureOpenAiEndpoint
    };
  }
};
