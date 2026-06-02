import OpenAI from 'openai'
import { withRetry, CircuitBreaker } from './resilience.js'

export const PROVIDER = process.env.LLM_PROVIDER ?? 'groq'
export const MODEL    = process.env.GROQ_MODEL    ?? 'llama-3.1-8b-instant'

export const sysMsg = 'You are a helpful programming assistant. Answer concisely and clearly.'

const client = new OpenAI({
  apiKey:  process.env.GROQ_API_KEY,
  baseURL: 'https://api.groq.com/openai/v1',
})

export const breaker = new CircuitBreaker({
  failureThreshold: 3,   // deschide dupa 3 esecuri consecutive
  recoveryTimeMs: 30_000, // incearca din nou dupa 30s
})

const LLM_TIMEOUT_MS = parseInt(process.env.LLM_TIMEOUT_MS ?? '60000', 10)

function withTimeout(promise, ms) {
  const timeout = new Promise((_, reject) => {
    const t = setTimeout(() => {
      const err = new Error(`LLM timeout after ${ms / 1000}s`)
      err.isTimeout = true
      reject(err)
    }, ms)
    promise.finally(() => clearTimeout(t))
  })
  return Promise.race([promise, timeout])
}

export async function llm(messages) {
  return breaker.call(() =>
    withTimeout(
      withRetry(
        () => client.chat.completions.create({ model: MODEL, messages, max_tokens: 1024 })
              .then((c) => c.choices[0].message.content),
        { maxAttempts: 3, baseDelayMs: 500 }
      ),
      LLM_TIMEOUT_MS
    )
  )
}
