const express = require('express')
const cors = require('cors')

const authRoutes = require('./routes/auth')
const questionRoutes = require('./routes/questions')
const answerRoutes = require('./routes/answer')

const app = express()

// ─────────────────────────────────────────────
// Middleware global
// ─────────────────────────────────────────────

// CORS - permite request-uri de la frontend (Vite ruleaza pe portul 5173)
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
}))

// Parseaza automat body-ul JSON al request-urilor
app.use(express.json())

// ─────────────────────────────────────────────
// Rute
// ─────────────────────────────────────────────
app.use('/auth', authRoutes)
app.use('/questions', questionRoutes)
app.use('/answers', answerRoutes)

// Ruta de health-check - utila pentru a verifica ca serverul ruleaza
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'SMO Backend ruleaza' })
})

// Handler global de erori - prinde orice eroare neasteptata
app.use((err, req, res, next) => {
  console.error('Eroare neasteptata:', err)
  res.status(500).json({ error: 'Eroare interna de server' })
})

module.exports = app
