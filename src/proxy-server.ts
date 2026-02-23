import express from 'express';
import { config } from './config.js';
import { globalResourceManager } from './resource-manager.js';

const app = express();
// Increase JSON body limit to handle large accessibility trees from Stagehand
app.use(express.json({ limit: '50mb' }));

// Health status tracking
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
  uptime: Date.now()
};

// Health check endpoint
app.get('/health', (req, res) => {
  const isHealthy = proxyHealth.errorCount < config.proxy.maxErrorThreshold;
  const uptimeSeconds = Math.floor((Date.now() - proxyHealth.uptime) / 1000);

  res.status(isHealthy ? 200 : 503).json({
    status: proxyHealth.status,
    errorCount: proxyHealth.errorCount,
    successCount: proxyHealth.successCount,
    lastError: proxyHealth.lastError,
    lastSuccessTimestamp: proxyHealth.lastSuccessTimestamp,
    lastErrorTimestamp: proxyHealth.lastErrorTimestamp,
    uptimeSeconds: uptimeSeconds,
    healthy: isHealthy
  });
});

// Reset health metrics endpoint (useful for testing)
app.post('/health/reset', (req, res) => {
  proxyHealth.errorCount = 0;
  proxyHealth.successCount = 0;
  proxyHealth.lastError = null;
  proxyHealth.status = 'healthy';
  res.json({ message: 'Health metrics reset', health: proxyHealth });
});

// Proxy endpoint with retry logic and circuit breaker
app.post('/chat/completions', async (req, res) => {
  const maxRetries = config.retry.maxAttempts;
  let lastError: any;
  const requestId = `${Date.now()}-${Math.random().toString(36).substring(7)}`;
  const requestStartTime = Date.now();

  console.log(`[PROXY] [${requestId}] 📨 New request received`);
  console.log(`[PROXY] [${requestId}] Model: ${req.body.model}`);
  console.log(`[PROXY] [${requestId}] Request timeout: ${config.proxy.requestTimeout}ms`);
  console.log(`[PROXY] [${requestId}] Base URL: ${config.codaBaseUrl}`);
  console.log(`[PROXY] [${requestId}] Body size: ${JSON.stringify(req.body).length} bytes`);

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    const attemptStartTime = Date.now();
    try {
      console.log(`[PROXY] [${requestId}] Attempt ${attempt}/${maxRetries} - Model: ${req.body.model}`);

      // Add provider prefix if not present
      let model = req.body.model;
      if (!model.includes('/')) {
        model = `${config.codaProvider}/${model}`;
        console.log(`[PROXY] [${requestId}] Modified model to: ${model}`);
      }

      const modifiedBody = {
        ...req.body,
        model: model
      };

      // Create abort controller for timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(
        () => {
          console.warn(`[PROXY] [${requestId}] ⏱️  Timeout triggered after ${config.proxy.requestTimeout}ms, aborting request`);
          controller.abort();
        },
        config.proxy.requestTimeout
      );

      try {
        console.log(`[PROXY] [${requestId}] 🚀 Sending request to ${config.codaBaseUrl}/chat/completions`);
        
        const response = await fetch(`${config.codaBaseUrl}/chat/completions`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${config.codaApiKey}`
          },
          body: JSON.stringify(modifiedBody),
          signal: controller.signal
        });

        clearTimeout(timeoutId);
        const elapsedMs = Date.now() - attemptStartTime;
        console.log(`[PROXY] [${requestId}] ✅ Response received in ${elapsedMs}ms (status: ${response.status})`);

        const data = await response.json() as any;

        if (!response.ok) {
          throw new Error(
            `CODA API error: ${response.status} - ${JSON.stringify(data)}`
          );
        }

        // Track tokens from response
        console.log(`[PROXY] [${requestId}] 📊 Response keys:`, Object.keys(data).join(', '));
        console.log(`[PROXY] [${requestId}] 📊 Usage data:`, JSON.stringify(data.usage, null, 2));
        
        if (data.usage && data.usage.total_tokens) {
          const tokensUsed = data.usage.total_tokens;
          globalResourceManager.addTokens(tokensUsed);
          console.log(`[PROXY] [${requestId}] 🎫 Tokens used: ${tokensUsed} (total so far: ${globalResourceManager.getTotalTokens()})`);
        } else {
          console.warn(`[PROXY] [${requestId}] ⚠️  No token usage data in response`);
        }

        // Success - update health metrics
        proxyHealth.status = 'healthy';
        proxyHealth.errorCount = Math.max(0, proxyHealth.errorCount - 1); // Decay error count
        proxyHealth.successCount++;
        proxyHealth.lastSuccessTimestamp = Date.now();

        const totalElapsedMs = Date.now() - requestStartTime;
        console.log(`[PROXY] [${requestId}] ✅ Success! Total time: ${totalElapsedMs}ms`);
        return res.json(data);

      } catch (fetchError: any) {
        clearTimeout(timeoutId);
        const elapsedMs = Date.now() - attemptStartTime;

        // Detect abort errors
        if (fetchError.name === 'AbortError') {
          console.error(`[PROXY] [${requestId}] ⏱️  Request aborted after ${elapsedMs}ms (AbortError)`);
          console.error(`[PROXY] [${requestId}] This usually means: request timeout or manual abort`);
        } else if (fetchError.message && fetchError.message.includes('aborted')) {
          console.error(`[PROXY] [${requestId}] ❌ Abort-related error: ${fetchError.message}`);
        } else if (fetchError.message && fetchError.message.includes('socket')) {
          console.error(`[PROXY] [${requestId}] 🔌 Socket error: ${fetchError.message}`);
        } else if (fetchError.message && (fetchError.message.includes('ECONNREFUSED') || fetchError.message.includes('ECONNRESET'))) {
          console.error(`[PROXY] [${requestId}] 🔌 Connection error: ${fetchError.message}`);
        } else {
          console.error(`[PROXY] [${requestId}] ❌ Fetch error: ${fetchError.message}`);
        }

        throw fetchError;
      } finally {
        clearTimeout(timeoutId);
      }

    } catch (error: any) {
      lastError = error;
      const attemptElapsedMs = Date.now() - attemptStartTime;

      console.error(`[PROXY] [${requestId}] ❌ Attempt ${attempt} failed: ${error.message}`);
      console.error(`[PROXY] [${requestId}] Error type: ${error.name}`);
      console.error(`[PROXY] [${requestId}] Attempt duration: ${attemptElapsedMs}ms`);
      
      // Log full stack trace for debugging
      if (error.stack) {
        console.error(`[PROXY] [${requestId}] Stack trace:`, error.stack);
      }

      // Update health status
      proxyHealth.errorCount++;
      proxyHealth.lastError = error.message;
      proxyHealth.lastErrorTimestamp = Date.now();

      if (proxyHealth.errorCount >= config.proxy.maxErrorThreshold) {
        proxyHealth.status = 'unhealthy';
        console.error(`[PROXY] [${requestId}] 🚨 Proxy status changed to UNHEALTHY (error count: ${proxyHealth.errorCount})`);
      } else if (proxyHealth.errorCount >= Math.floor(config.proxy.maxErrorThreshold / 2)) {
        proxyHealth.status = 'degraded';
        console.warn(`[PROXY] [${requestId}] ⚠️  Proxy status changed to DEGRADED (error count: ${proxyHealth.errorCount})`);
      }

      // Retry with exponential backoff
      if (attempt < maxRetries) {
        const delay = Math.min(
          config.retry.baseDelay * Math.pow(config.retry.backoffMultiplier, attempt - 1),
          config.retry.maxDelay
        );
        console.log(`[PROXY] [${requestId}] 🔄 Retrying in ${delay}ms... (${maxRetries - attempt} retries remaining)`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  // All retries failed
  const totalElapsedMs = Date.now() - requestStartTime;
  console.error(`[PROXY] [${requestId}] ❌ All ${maxRetries} retry attempts failed after ${totalElapsedMs}ms`);
  console.error(`[PROXY] [${requestId}] Final error: ${lastError?.message}`);
  console.error(`[PROXY] [${requestId}] Final error type: ${lastError?.name}`);
  console.error(`[PROXY] [${requestId}] Config - timeout: ${config.proxy.requestTimeout}ms, base delay: ${config.retry.baseDelay}ms, backoff multiplier: ${config.retry.backoffMultiplier}`);
  
  res.status(500).json({
    error: 'Proxy error after retries',
    message: lastError?.message || 'Unknown error',
    errorType: lastError?.name || 'Unknown',
    attempts: maxRetries,
    totalDurationMs: totalElapsedMs,
    health: proxyHealth.status,
    requestId: requestId
  });
});

// Global error handlers
process.on('uncaughtException', (error) => {
  console.error('[PROXY] ❌ Uncaught exception:', error);
  proxyHealth.status = 'degraded';
  proxyHealth.lastError = error.message;
});

process.on('unhandledRejection', (error: any) => {
  console.error('[PROXY] ❌ Unhandled rejection:', error);
  proxyHealth.status = 'degraded';
  proxyHealth.lastError = error?.message || String(error);
});

const PORT = config.proxyPort;
const server = app.listen(PORT, () => {
  console.log(`
╔═══════════════════════════════════════════════════════════╗
║  CODA GEAI Proxy Server Running                           ║
║  Port: ${PORT}                                               ║
║  Target: ${config.codaBaseUrl}                   ║
║  Provider: ${config.codaProvider}                                         ║
║  Health: http://localhost:${PORT}/health                     ║
║                                                           ║
║  Features:                                                ║
║  • Automatic retry with exponential backoff               ║
║  • Circuit breaker pattern                                ║
║  • Health monitoring                                      ║
║  • Model transformation: gpt-4o → openai/gpt-4o           ║
╚═══════════════════════════════════════════════════════════╝
  `);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('[PROXY] 🛑 SIGTERM received, shutting down gracefully...');
  server.close(() => {
    console.log('[PROXY] ✅ Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('[PROXY] 🛑 SIGINT received, shutting down gracefully...');
  server.close(() => {
    console.log('[PROXY] ✅ Server closed');
    process.exit(0);
  });
});

export { app };
