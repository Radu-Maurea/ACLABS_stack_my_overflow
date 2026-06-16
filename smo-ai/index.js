import express from 'express'
import cors from 'cors'
import morgan from 'morgan'
import { rateLimit } from 'express-rate-limit'
import { llm, MODEL, PROVIDER, sysMsg, breaker } from './llm.js'
import { logger } from './logger.js'

const TAGS_SYSTEM_PROMPT =
  'You are a tagging assistant for Stack_my_Overflow, a Q&A platform for software developers.\n\n' +
  'Given a question title and optional description, suggest between 3 and 5 tags that best categorize the question.\n\n' +
  'Rules:\n' +
  '- Return ONLY a raw JSON array of lowercase tag strings. No explanation, no markdown, no extra text.\n' +
  '- Include at least ONE specific tag that reflects the precise topic or subtopic (e.g. "css-flexbox", "binary-search", "react-hooks", "sql-joins").\n' +
  '- Include at least ONE general tag that represents the broad technology, language, or domain (e.g. "javascript", "python", "html", "algorithms", "databases").\n' +
  '- Tags must be 1-30 characters, lowercase, using only letters, digits, hyphens, dots, # and +.\n' +
  '- Use hyphens instead of spaces (e.g. "linked-list", not "linked list").\n' +
  '- Do not repeat the same concept at different levels of specificity.\n' +
  '- Maximum 5 tags total.\n\n' +
  'Examples:\n' +
  'Question: "How to center a div in CSS?" → ["css","html","css-flexbox","frontend","web-design"]\n' +
  'Question: "How do I reverse a linked list in Python?" → ["python","data-structures","linked-list","algorithms"]'

const INTERNAL_SECRET = process.env.SMO_AI_SECRET
if (!INTERNAL_SECRET) {
  logger.warn('SMO_AI_SECRET is not set — endpoint is unprotected')
}

const app = express()
app.use(express.json())
app.use(cors())
app.use(morgan(':method :url :status :response-time ms'))

// Verifica secretul intern — /health e exempt
app.use((req, res, next) => {
  if (req.path === '/health') return next()
  if (INTERNAL_SECRET && req.headers['x-internal-secret'] !== INTERNAL_SECRET) {
    return res.status(401).json({ error: 'unauthorized' })
  }
  next()
})

// Rate limiter — max 20 cereri/minut per IP
const limiter = rateLimit({
  windowMs: 60 * 1000,
  max: 20,
  message: { error: 'Too many requests, please try again later.' },
})
app.use('/ask', limiter)
app.use('/suggest-tags', limiter)

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', provider: PROVIDER, model: MODEL, circuit: breaker.state })
})

// Endpoint principal — primeste { messages } sau { prompt }
app.post('/ask', async (req, res) => {
  try {
    const { messages, prompt } = req.body

    let msgs
    if (messages && Array.isArray(messages)) {
      msgs = messages
    } else if (prompt) {
      msgs = [
        { role: 'system', content: sysMsg },
        { role: 'user', content: sanitizeInput(prompt) },
      ]
    } else {
      return res.status(400).json({ error: 'Provide either "messages" array or "prompt" string.' })
    }

    const answer = await llm(msgs)
    res.json({ answer, model: MODEL, provider: PROVIDER })
  } catch (err) {
    logger.error('LLM error:', err.message)
    const status = err.circuitOpen ? 503 : err.isTimeout ? 504 : 500
    res.status(status).json({ error: err.message, circuit: breaker.state })
  }
})

// Sugereaza taguri pe baza titlului (si optinal descrierii) unei intrebari
app.post('/suggest-tags', async (req, res) => {
  try {
    const { title, description } = req.body
    if (!title || typeof title !== 'string') {
      return res.status(400).json({ error: '"title" is required.' })
    }

    const userContent = description
      ? `Title: ${sanitizeInput(title)}\nDescription: ${sanitizeInput(description, 500)}`
      : `Title: ${sanitizeInput(title)}`

    const msgs = [
      { role: 'system', content: TAGS_SYSTEM_PROMPT },
      { role: 'user', content: userContent },
    ]

    const raw = await llm(msgs)

    // Parsam array-ul JSON returnat de model
    const jsonMatch = raw.match(/\[[\s\S]*?\]/)
    if (!jsonMatch) {
      logger.warn('suggest-tags: model did not return a JSON array:', raw)
      return res.status(502).json({ error: 'Model returned unexpected format.' })
    }

    const parsed = JSON.parse(jsonMatch[0])
    const tags = sanitizeTags(parsed)

    res.json({ tags, model: MODEL, provider: PROVIDER })
  } catch (err) {
    logger.error('suggest-tags error:', err.message)
    const status = err.circuitOpen ? 503 : err.isTimeout ? 504 : 500
    res.status(status).json({ error: err.message, circuit: breaker.state })
  }
})

const PORT = process.env.PORT || 3100
app.listen(PORT, () => {
  logger.info(`smo-ai running on port ${PORT} | provider: ${PROVIDER} | model: ${MODEL}`)
})

// --- HELPERS ---

function sanitizeInput(text, maxLength = 300) {
  return text
    .slice(0, maxLength)
    .replace(/[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]/g, '')
    .trim()
}

function sanitizeTags(tags) {
  const seen = new Set()
  return tags
    .filter((t) => typeof t === 'string')
    .map((t) =>
      t
        .toLowerCase()
        .trim()
        .slice(0, 30)
        .replace(/\s+/g, '-')        // spatii -> cratime
        .replace(/[^a-z0-9\-\.#\+]/g, '') // pastreaza doar alfanumerice + - . # +
        .replace(/^-+|-+$/g, '')     // elimina cratime de la inceput/sfarsit
    )
    .filter((t) => t.length > 0 && !seen.has(t) && seen.add(t)) // dedup + fara goluri
    .slice(0, 5) // max 5 taguri
}


//----- ROUTES ----
