const RETRYABLE_STATUSES = new Set([429, 500, 502, 503, 504])

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function isRetryable(err) {
  const status = err?.status ?? err?.response?.status
  // Retrye daca nu avem status (eroare de retea) sau statusul e tranzitoriu
  return status == null || RETRYABLE_STATUSES.has(status)
}

export async function withRetry(fn, { maxAttempts = 3, baseDelayMs = 500 } = {}) {
  let lastError
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn()
    } catch (err) {
      lastError = err
      if (!isRetryable(err) || attempt === maxAttempts) throw err
      const delay = baseDelayMs * Math.pow(2, attempt - 1) // 500ms, 1000ms, 2000ms
      await sleep(delay)
    }
  }
  throw lastError
}

// Stari posibile: CLOSED -> OPEN -> HALF_OPEN -> CLOSED
export class CircuitBreaker {
  #state = 'CLOSED'
  #failureCount = 0
  #openedAt = null

  constructor({ failureThreshold = 3, recoveryTimeMs = 30_000 } = {}) {
    this.failureThreshold = failureThreshold
    this.recoveryTimeMs = recoveryTimeMs
  }

  get state() {
    return this.#state
  }

  async call(fn) {
    if (this.#state === 'OPEN') {
      if (Date.now() - this.#openedAt >= this.recoveryTimeMs) {
        this.#state = 'HALF_OPEN'
      } else {
        const retryAfterSec = Math.ceil((this.recoveryTimeMs - (Date.now() - this.#openedAt)) / 1000)
        const err = new Error(`Circuit breaker OPEN — retry after ${retryAfterSec}s`)
        err.circuitOpen = true
        throw err
      }
    }

    try {
      const result = await fn()
      this.#onSuccess()
      return result
    } catch (err) {
      if (!err.circuitOpen) this.#onFailure()
      throw err
    }
  }

  #onSuccess() {
    this.#failureCount = 0
    this.#state = 'CLOSED'
  }

  #onFailure() {
    this.#failureCount++
    if (this.#failureCount >= this.failureThreshold) {
      this.#state = 'OPEN'
      this.#openedAt = Date.now()
    }
  }
}
