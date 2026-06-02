const express = require('express')
const router = express.Router()
const { supabase } = require('../supabase')
const { requireAuth } = require('../middleware/auth')

// ─────────────────────────────────────────────
// POST /answers - posteaza un raspuns (protejat)
// ─────────────────────────────────────────────
router.post('/', requireAuth, async (req, res) => {
  const { question_id, body } = req.body

  if (!question_id || !body?.trim()) {
    return res.status(400).json({ error: 'question_id si body sunt obligatorii' })
  }

  const { data: answer, error } = await supabase
    .from('answers')
    .insert({ question_id, body: body.trim(), author_id: req.user.id })
    .select('*, author:profiles!author_id(id,username)')
    .single()

  if (error) return res.status(500).json({ error: error.message })

  res.status(201).json(answer)
})

// ─────────────────────────────────────────────
// PATCH /answers/:id/vote - vot pe un raspuns (protejat)
// ─────────────────────────────────────────────
router.patch('/:id/vote', requireAuth, async (req, res) => {
  const { value } = req.body
  if (value !== 1 && value !== -1) {
    return res.status(400).json({ error: 'value trebuie sa fie 1 sau -1' })
  }

  const aId = req.params.id
  const uid = req.user.id

  const { data: v } = await supabase
    .from('votes')
    .select('*')
    .eq('target_id', aId)
    .eq('target_type', 'answer')
    .eq('user_id', uid)
    .single()

  if (v) {
    if (v.value === value) {
      await supabase.from('votes').delete().eq('id', v.id)
    } else {
      await supabase.from('votes').update({ value }).eq('id', v.id)
    }
  } else {
    await supabase.from('votes').insert({
      target_id: aId,
      target_type: 'answer',
      user_id: uid,
      value,
    })
  }

  await supabase.rpc('increment_answer_votes', { a_id: aId })

  const { data: a } = await supabase
    .from('answers')
    .select('vote_count')
    .eq('id', aId)
    .single()

  res.json({ vote_count: a.vote_count })
})

// ─────────────────────────────────────────────
// PATCH /answers/:id/accept - toggle accept (doar autorul intrebarii)
// ─────────────────────────────────────────────
router.patch('/:id/accept', requireAuth, async (req, res) => {
  const { data: answer } = await supabase
    .from('answers')
    .select('id, question_id, is_accepted, questions!inner(author_id)')
    .eq('id', req.params.id)
    .single()

  if (!answer) return res.status(404).json({ error: 'Raspunsul nu exista' })

  if (answer.questions.author_id !== req.user.id) {
    return res.status(403).json({ error: 'Doar autorul intrebarii poate accepta un raspuns' })
  }

  const nowAccepted = !answer.is_accepted

  if (nowAccepted) {
    // Deselectam orice alt raspuns acceptat al aceleiasi intrebari
    await supabase.from('answers')
      .update({ is_accepted: false })
      .eq('question_id', answer.question_id)
      .eq('is_accepted', true)
  }

  await supabase.from('answers')
    .update({ is_accepted: nowAccepted })
    .eq('id', req.params.id)

  // Sincronizam is_solved pe intrebare
  await supabase.from('questions')
    .update({ is_solved: nowAccepted })
    .eq('id', answer.question_id)

  res.json({ is_accepted: nowAccepted, is_solved: nowAccepted })
})

module.exports = router


