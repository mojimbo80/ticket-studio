import Anthropic from '@anthropic-ai/sdk';
import { env } from '../config/env';
import { LLM_LIMITS } from './limits';

// Client Anthropic avec délai maximal et relances automatiques (erreurs 429 et 5xx).
export function createAnthropicClient(): Anthropic {
  return new Anthropic({
    apiKey: env.ANTHROPIC_API_KEY,
    timeout: LLM_LIMITS.requestTimeoutMs,
    maxRetries: LLM_LIMITS.maxRetries,
  });
}
