/**
 * openaiClient.js — OpenAI API caller with retry logic
 *
 * Key decisions:
 *
 * 1. JSON mode (response_format: { type: "json_object" }):
 *    Guarantees valid parseable JSON output. Without this, the model might
 *    wrap the JSON in markdown code fences (```json ... ```) which breaks
 *    JSON.parse(). JSON mode eliminates this entire class of bugs.
 *    Requirement: the word "JSON" must appear in the system or user prompt.
 *
 * 2. Exponential backoff on 429 (rate limit):
 *    OpenAI returns HTTP 429 when you exceed rate limits. On a free/low-tier
 *    key, this can happen even with 1-2 requests. Exponential backoff means:
 *    wait 1s → retry → wait 2s → retry → wait 4s → retry → give up.
 *    This is the standard pattern for any third-party API.
 *
 * 3. Model choice:
 *    gpt-4o-mini for development — cheap (~$0.15/1M input tokens), fast.
 *    gpt-4o for the benchmark run — better reasoning on complex code.
 *    The model is configurable so switching is a one-line change.
 *
 * 4. Temperature = 0:
 *    We want deterministic, analytical output — not creative text.
 *    Temperature 0 makes the model maximally consistent across runs.
 *    For code review, we want the same PR to produce similar findings
 *    each time it's analyzed.
 *
 * 5. Why not streaming?
 *    Streaming returns tokens as they're generated. We need the complete
 *    JSON object before we can parse it. Non-streaming (single response)
 *    is the right choice here.
 */

const OpenAI = require('openai');
const { config } = require('../utils/config');
const logger = require('../utils/logger');
const { estimateTokens } = require('./diffChunker');

const openai = new OpenAI({
  apiKey: config.OPENAI_API_KEY,
});

const MAX_RETRIES = 3;
const BASE_RETRY_DELAY_MS = 1000;

/**
 * Calls the OpenAI chat completions API with retry on rate limits.
 *
 * @param {string} systemPrompt
 * @param {string} userPrompt
 * @param {Object} options
 * @param {string} options.model - Model to use (default: gpt-4o-mini)
 * @param {number} options.maxTokens - Max tokens in the response (default: 4000)
 * @returns {Promise<Object>} Parsed JSON response object
 */
async function callOpenAI(systemPrompt, userPrompt, options = {}) {
  const model = options.model || process.env.OPENAI_MODEL || 'gpt-4o-mini';
  const maxTokens = options.maxTokens || 4000;

  const inputTokenEstimate = estimateTokens(systemPrompt + userPrompt);
  logger.info('Calling OpenAI', {
    model,
    estimatedInputTokens: inputTokenEstimate,
    maxResponseTokens: maxTokens,
  });

  let lastError;

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const response = await openai.chat.completions.create({
        model,
        temperature: 0,       // deterministic, analytical output
        max_tokens: maxTokens,
        response_format: { type: 'json_object' }, // guaranteed JSON output
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
      });

      const rawContent = response.choices[0]?.message?.content;
      if (!rawContent) {
        throw new Error('OpenAI returned an empty response');
      }

      // Log usage for cost tracking
      const usage = response.usage;
      logger.info('OpenAI response received', {
        model,
        promptTokens: usage?.prompt_tokens,
        completionTokens: usage?.completion_tokens,
        totalTokens: usage?.total_tokens,
        finishReason: response.choices[0]?.finish_reason,
      });

      // response_format: json_object guarantees this parses successfully
      const parsed = JSON.parse(rawContent);
      return parsed;

    } catch (err) {
      lastError = err;

      // Handle rate limit errors (429) with exponential backoff
      if (err.status === 429 || err.code === 'rate_limit_exceeded') {
        const delay = BASE_RETRY_DELAY_MS * Math.pow(2, attempt - 1);

        // Honor Retry-After header if provided
        const retryAfter = err.headers?.['retry-after'];
        const waitMs = retryAfter ? parseInt(retryAfter) * 1000 : delay;

        logger.warn('OpenAI rate limit hit — retrying', {
          attempt,
          maxRetries: MAX_RETRIES,
          waitMs,
        });

        await new Promise((resolve) => setTimeout(resolve, waitMs));
        continue;
      }

      // Context length exceeded — don't retry (chunking should have prevented this)
      if (err.code === 'context_length_exceeded') {
        logger.error('OpenAI context length exceeded — chunk is too large', {
          estimatedInputTokens: inputTokenEstimate,
        });
        throw err;
      }

      // Any other error — don't retry
      logger.error('OpenAI API error', {
        attempt,
        status: err.status,
        code: err.code,
        message: err.message,
      });
      throw err;
    }
  }

  // All retries exhausted
  logger.error('OpenAI call failed after all retries', {
    maxRetries: MAX_RETRIES,
    lastError: lastError?.message,
  });
  throw lastError;
}

module.exports = { callOpenAI };
