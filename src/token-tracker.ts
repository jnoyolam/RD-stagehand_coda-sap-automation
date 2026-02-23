import { globalResourceManager } from './resource-manager.js';

// Token tracker: intercepts Stagehand's Pino logger output at stdout level
// Pino writes directly to stdout, so we intercept process.stdout.write

let _patched = false;
let _collectedUsageLines: string[] = [];
let _writeCalls = 0;
let _tokensFound = 0;

function initTokenTracker() {
  if (_patched) return;
  _patched = true;

  const originalWrite = process.stdout.write.bind(process.stdout);

  function parseUsageFromString(str: string): number | null {
    try {
      // Look for "promptTokens" or "prompt_tokens" pattern
      const promptMatch = str.match(/"(?:promptTokens|prompt_tokens)"\s*:\s*(\d+)/);
      const completionMatch = str.match(/"(?:completionTokens|completion_tokens)"\s*:\s*(\d+)/);
      
      if (promptMatch && completionMatch) {
        const prompt = parseInt(promptMatch[1], 10);
        const completion = parseInt(completionMatch[1], 10);
        const total = prompt + completion;
        if (total > 0) return total;
      }

      // Also look for direct "totalTokens" or "total_tokens"
      const totalMatch = str.match(/"(?:totalTokens|total_tokens)"\s*:\s*(\d+)/);
      if (totalMatch) {
        const total = parseInt(totalMatch[1], 10);
        if (total > 0) return total;
      }
    } catch (e) {
      // silently ignore
    }
    return null;
  }

  // Patch process.stdout.write to intercept all output
  (process.stdout.write as any) = function(
    chunk: string | Uint8Array | Buffer,
    encodingOrCallback?: string | ((error?: Error | null) => void),
    maybeCallback?: (error?: Error | null) => void
  ): boolean {
    _writeCalls++;

    // Convert to string for analysis
    const str = typeof chunk === 'string' ? chunk : Buffer.isBuffer(chunk) ? chunk.toString('utf-8') : chunk.toString();

    // Look for usage information
    if (str.includes('usage') || str.includes('prompt') || str.includes('completion')) {
      const tokens = parseUsageFromString(str);
      if (tokens && tokens > 0) {
        globalResourceManager.addTokens(tokens);
        _collectedUsageLines.push(str);
        _tokensFound++;
      }
    }

    // Call the original write
    if (typeof encodingOrCallback === 'string') {
      return originalWrite(chunk, encodingOrCallback as BufferEncoding, maybeCallback as any);
    } else if (typeof encodingOrCallback === 'function') {
      return originalWrite(chunk, encodingOrCallback);
    } else {
      return originalWrite(chunk);
    }
  };

  console.log('[TOKEN-TRACKER] initialized - intercepting process.stdout for Pino logs');
}

// Export diagnostics
export function getTokenTrackerDiagnostics() {
  return {
    stdoutWriteCalls: _writeCalls,
    usageLinesFound: _tokensFound,
    totalTokensCollected: globalResourceManager.getTotalTokens(),
    lineCount: _collectedUsageLines.length
  };
}

// Export collected usage lines
export function getCollectedUsageLines(): string[] {
  return _collectedUsageLines;
}

initTokenTracker();

export {};
function originalLog(arg0: string) {
    throw new Error('Function not implemented.');
}

