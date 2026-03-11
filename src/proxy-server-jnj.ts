import express from 'express';
import { globalResourceManager } from './resource-manager.js';

/**
 * JNJ Azure OpenAI Proxy Server
 *
 * Translates OpenAI-compatible /chat/completions requests from Stagehand
 * into Azure OpenAI API calls targeting the JNJ corporate endpoint.
 *
 * Reference: src/test_server_jnj.py (uses AzureChatOpenAI with the same endpoint/key/deployment).
 *
 * Environment variables (all optional – sensible defaults match test_server_jnj.py):
 *   JNJ_AZURE_ENDPOINT        – Azure OpenAI base URL
 *   JNJ_AZURE_API_KEY          – API key
 *   JNJ_AZURE_DEPLOYMENT       – Model deployment name
 *   JNJ_AZURE_API_VERSION      – Azure API version
 *   JNJ_PROXY_PORT             – Local port (default 3456)
 *   JNJ_PROXY_REQUEST_TIMEOUT  – Per-request timeout in ms (default 120 000)
 *   JNJ_PROXY_MAX_RETRIES      – Max retry attempts (default 3)
 */

import dotenv from 'dotenv';
dotenv.config();

// ---------------------------------------------------------------------------
// Configuration – mirrors values from test_server_jnj.py
// ---------------------------------------------------------------------------
const JNJ_CONFIG = {
  azureEndpoint: process.env.JNJ_AZURE_ENDPOINT || 'https://genaiapimna.jnj.com/openai-chat',
  apiKey: process.env.JNJ_AZURE_API_KEY || '76cf7f1a70af43e98c530f172887fac4',
  deployment: process.env.JNJ_AZURE_DEPLOYMENT || 'gpt-4o',
  apiVersion: process.env.JNJ_AZURE_API_VERSION || '2024-10-21',
  port: parseInt(process.env.JNJ_PROXY_PORT || '3456', 10),
  requestTimeout: parseInt(process.env.JNJ_PROXY_REQUEST_TIMEOUT || '120000', 10),
  maxRetries: parseInt(process.env.JNJ_PROXY_MAX_RETRIES || '3', 10),
  retryBaseDelay: 1000,
  retryMaxDelay: 10000,
  backoffMultiplier: 2,
  maxErrorThreshold: 5,
};

// ---------------------------------------------------------------------------
// Health tracking
// ---------------------------------------------------------------------------
interface ProxyHealth {
  status: 'healthy' | 'degraded' | 'unhealthy';
  lastError: string | null;
  errorCount: number;
  successCount: number;
  lastSuccessTimestamp: number | null;
  lastErrorTimestamp: number | null;
  uptime: number;
}

const proxyHealth: ProxyHealth = {
  status: 'healthy',
  lastError: null,
  errorCount: 0,
  successCount: 0,
  lastSuccessTimestamp: null,
  lastErrorTimestamp: null,
  uptime: Date.now(),
};

// ---------------------------------------------------------------------------
// Express app
// ---------------------------------------------------------------------------
const app = express();
app.use(express.json({ limit: '50mb' }));

// ---- Health endpoints -----------------------------------------------------

app.get('/health', (_req, res) => {
  const isHealthy = proxyHealth.errorCount < JNJ_CONFIG.maxErrorThreshold;
  const uptimeSeconds = Math.floor((Date.now() - proxyHealth.uptime) / 1000);

  res.status(isHealthy ? 200 : 503).json({
    status: proxyHealth.status,
    errorCount: proxyHealth.errorCount,
    successCount: proxyHealth.successCount,
    lastError: proxyHealth.lastError,
    lastSuccessTimestamp: proxyHealth.lastSuccessTimestamp,
    lastErrorTimestamp: proxyHealth.lastErrorTimestamp,
    uptimeSeconds,
    healthy: isHealthy,
  });
});

app.post('/health/reset', (_req, res) => {
  proxyHealth.errorCount = 0;
  proxyHealth.successCount = 0;
  proxyHealth.lastError = null;
  proxyHealth.status = 'healthy';
  res.json({ message: 'Health metrics reset', health: proxyHealth });
});

// ---- Main proxy endpoint --------------------------------------------------

app.post('/chat/completions', async (req, res) => {
  const requestId = `${Date.now()}-${Math.random().toString(36).substring(7)}`;
  const requestStartTime = Date.now();

  console.log(`[JNJ-PROXY] [${requestId}] New request received`);
  console.log(`[JNJ-PROXY] [${requestId}] Model requested: ${req.body.model}`);
  console.log(`[JNJ-PROXY] [${requestId}] Body size: ${JSON.stringify(req.body).length} bytes`);

  let lastError: any;

  for (let attempt = 1; attempt <= JNJ_CONFIG.maxRetries; attempt++) {
    const attemptStart = Date.now();

    try {
      console.log(`[JNJ-PROXY] [${requestId}] Attempt ${attempt}/${JNJ_CONFIG.maxRetries}`);

      // Always route to the configured JNJ deployment regardless of what the
      // client requested (Stagehand may send "openai/gpt-4o" or similar).
      const deployment = JNJ_CONFIG.deployment;

      const azureUrl = `${JNJ_CONFIG.azureEndpoint}/openai/deployments/${deployment}/chat/completions?api-version=${JNJ_CONFIG.apiVersion}`;

      // Build the forwarded body – override model with the deployment name
      const forwardedBody = {
        ...req.body,
        model: deployment,
      };

      // Abort controller for timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => {
        console.warn(`[JNJ-PROXY] [${requestId}] Timeout after ${JNJ_CONFIG.requestTimeout}ms – aborting`);
        controller.abort();
      }, JNJ_CONFIG.requestTimeout);

      try {
        console.log(`[JNJ-PROXY] [${requestId}] -> ${azureUrl}`);

        const response = await fetch(azureUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'api-key': JNJ_CONFIG.apiKey,
          },
          body: JSON.stringify(forwardedBody),
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        const elapsedMs = Date.now() - attemptStart;
        console.log(`[JNJ-PROXY] [${requestId}] Response ${response.status} in ${elapsedMs}ms`);

        const data = (await response.json()) as any;

        if (!response.ok) {
          throw new Error(`Azure OpenAI error ${response.status}: ${JSON.stringify(data)}`);
        }

        // Track token usage
        if (data.usage?.total_tokens) {
          globalResourceManager.addTokens(data.usage.total_tokens);
          console.log(
            `[JNJ-PROXY] [${requestId}] Tokens: ${data.usage.total_tokens} (session total: ${globalResourceManager.getTotalTokens()})`,
          );
        }

        // Update health
        proxyHealth.status = 'healthy';
        proxyHealth.errorCount = Math.max(0, proxyHealth.errorCount - 1);
        proxyHealth.successCount++;
        proxyHealth.lastSuccessTimestamp = Date.now();

        const totalMs = Date.now() - requestStartTime;
        console.log(`[JNJ-PROXY] [${requestId}] Success – total ${totalMs}ms`);
        return res.json(data);
      } catch (fetchError: any) {
        clearTimeout(timeoutId);
        const label =
          fetchError.name === 'AbortError'
            ? 'Timeout/Abort'
            : fetchError.message?.includes('socket')
              ? 'Socket error'
              : fetchError.message?.includes('ECONN')
                ? 'Connection error'
                : 'Fetch error';
        console.error(`[JNJ-PROXY] [${requestId}] ${label}: ${fetchError.message}`);
        throw fetchError;
      }
    } catch (error: any) {
      lastError = error;
      console.error(`[JNJ-PROXY] [${requestId}] Attempt ${attempt} failed: ${error.message}`);

      // Update health
      proxyHealth.errorCount++;
      proxyHealth.lastError = error.message;
      proxyHealth.lastErrorTimestamp = Date.now();

      if (proxyHealth.errorCount >= JNJ_CONFIG.maxErrorThreshold) {
        proxyHealth.status = 'unhealthy';
      } else if (proxyHealth.errorCount >= Math.floor(JNJ_CONFIG.maxErrorThreshold / 2)) {
        proxyHealth.status = 'degraded';
      }

      // Exponential backoff before next attempt
      if (attempt < JNJ_CONFIG.maxRetries) {
        const delay = Math.min(
          JNJ_CONFIG.retryBaseDelay * Math.pow(JNJ_CONFIG.backoffMultiplier, attempt - 1),
          JNJ_CONFIG.retryMaxDelay,
        );
        console.log(`[JNJ-PROXY] [${requestId}] Retrying in ${delay}ms...`);
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }

  // All retries exhausted
  const totalMs = Date.now() - requestStartTime;
  console.error(`[JNJ-PROXY] [${requestId}] All ${JNJ_CONFIG.maxRetries} attempts failed (${totalMs}ms)`);

  res.status(500).json({
    error: 'Proxy error after retries',
    message: lastError?.message || 'Unknown error',
    errorType: lastError?.name || 'Unknown',
    attempts: JNJ_CONFIG.maxRetries,
    totalDurationMs: totalMs,
    health: proxyHealth.status,
    requestId,
  });
});

// ---------------------------------------------------------------------------
// Global error handlers
// ---------------------------------------------------------------------------
process.on('uncaughtException', (error) => {
  console.error('[JNJ-PROXY] Uncaught exception:', error);
  proxyHealth.status = 'degraded';
  proxyHealth.lastError = error.message;
});

process.on('unhandledRejection', (error: any) => {
  console.error('[JNJ-PROXY] Unhandled rejection:', error);
  proxyHealth.status = 'degraded';
  proxyHealth.lastError = error?.message || String(error);
});

// ---------------------------------------------------------------------------
// Start server
// ---------------------------------------------------------------------------
const server = app.listen(JNJ_CONFIG.port, () => {
  console.log(`
╔══════════════════════════════════════════════════════════════╗
║  JNJ Azure OpenAI Proxy Server                              ║
║  Port: ${JNJ_CONFIG.port}                                              ║
║  Endpoint: ${JNJ_CONFIG.azureEndpoint}  ║
║  Deployment: ${JNJ_CONFIG.deployment}                                            ║
║  API Version: ${JNJ_CONFIG.apiVersion}                                    ║
║  Health: http://localhost:${JNJ_CONFIG.port}/health                        ║
║                                                              ║
║  Features:                                                   ║
║  - Automatic retry with exponential backoff                  ║
║  - Circuit breaker / health monitoring                       ║
║  - Azure OpenAI (JNJ corporate endpoint)                     ║
║  - Compatible with Stagehand modelClientOptions              ║
╚══════════════════════════════════════════════════════════════╝
  `);
});

// Graceful shutdown
const shutdown = (signal: string) => {
  console.log(`[JNJ-PROXY] ${signal} received – shutting down...`);
  server.close(() => {
    console.log('[JNJ-PROXY] Server closed');
    process.exit(0);
  });
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

export { app };
