const express = require('express')
const router = express.Router()
const { supabase } = require('../supabase')
const { requireAuth } = require('../middleware/auth')

// ─────────────────────────────────────────────
// GET /questions - ruta publica, oricine poate vedea intrebarile
// ─────────────────────────────────────────────
router.get('/', async (req, res) => {
  const { data, error } = await supabase
    .from('questions')
    // Selectam tot + join-uri: autorul, tag-urile, numarul de raspunsuri
    // author:profiles!author_id = join pe coloana author_id, alias "author"
    // answers(count) = doar numarul, nu toate raspunsurile (mai eficient)
    .select('*, author:profiles!author_id(id,username), question_tags(tag:tags(name)), answers(count)')
    .order('created_at', { ascending: false }) // cele mai noi primele

  if (error) return res.status(500).json({ error: error.message })

  // Supabase returneaza answers: [{ count: 3 }] pentru agregate.
  // Normalizam inainte sa trimitem - frontendul se asteapta la answer_count: 3
  const questions = data.map(q => ({
    ...q,
    answer_count: q.answers[0]?.count ?? 0, // scoatem numarul
    tags: q.question_tags.map(qt => qt.tag.name), // lista de stringuri
    answers: undefined,       // stergem forma bruta Supabase din raspuns
    question_tags: undefined,
  }))

  res.json(questions)
})

// ─────────────────────────────────────────────
// POST /questions - ruta protejata, doar utilizatori autentificati
// ─────────────────────────────────────────────
router.post('/', requireAuth, async (req, res) => {
  const { title, description, tags = [] } = req.body

  // Validam ca avem cel putin titlu si descriere
  if (!title?.trim() || !description?.trim()) {
    return res.status(400).json({ error: 'title si description sunt obligatorii' })
  }

  // author_id vine din TOKEN (req.user.id), NU din body!
  // Daca am folosi req.body.author_id, un user malitios ar putea posta in numele altuia
  const { data: question, error } = await supabase
    .from('questions')
    .insert({ title: title.trim(), description: description.trim(), author_id: req.user.id })
    .select()
    .single()

  if (error) return res.status(500).json({ error: error.message })

  // Procesam tag-urile: upsert = insert daca nu exista, ignora daca exista
  for (const tagName of tags) {
    const { data: tag } = await supabase
      .from('tags')
      .upsert({ name: tagName.toLowerCase() }, { onConflict: 'name' })
      .select()
      .single()

    await supabase.from('question_tags')
      .insert({ question_id: question.id, tag_id: tag.id })
  }

  // +15 reputatie pentru postarea unei intrebari noi
  const { data: profile } = await supabase
    .from('profiles')
    .select('reputation')
    .eq('id', req.user.id)
    .single()

  const newReputation = (profile?.reputation ?? 0) + 15

  await supabase.from('profiles')
    .update({ reputation: newReputation })
    .eq('id', req.user.id)

  res.status(201).json({ ...question, reputation: newReputation })
})

// ─────────────────────────────────────────────
// PATCH /questions/:id/vote - vot pe o intrebare (protejat)
// Logica toggle: acelasi vot = anulezi, vot opus = schimbi, vot nou = adaugi
// ─────────────────────────────────────────────
router.patch('/:id/vote', requireAuth, async (req, res) => {
  const { value } = req.body // 1 = upvote, -1 = downvote
  if (value !== 1 && value !== -1) {
    return res.status(400).json({ error: 'value trebuie sa fie 1 sau -1' })
  }

  const qId = req.params.id  // id-ul intrebarii din URL
  const uid = req.user.id    // id-ul userului din token

  // Schema foloseste target_id + target_type (relatii polimorfice)
  const { data: v } = await supabase
    .from('votes')
    .select('*')
    .eq('target_id', qId)
    .eq('target_type', 'question')
    .eq('user_id', uid)
    .single()

  if (v) {
    if (v.value === value) {
      // Acelasi vot - userul a dat click din nou: anulam votul
      await supabase.from('votes').delete().eq('id', v.id)
    } else {
      // Vot diferit - a trecut de la upvote la downvote sau invers
      await supabase.from('votes').update({ value }).eq('id', v.id)
    }
  } else {
    // Niciun vot anterior - inseram votul nou
    await supabase.from('votes').insert({
      target_id: qId,
      target_type: 'question',
      user_id: uid,
      value,
    })
  }

  // Recalculam vote_count din suma voturilor reale (nu folosim RPC)
  const { data: allVotes } = await supabase
    .from('votes')
    .select('value')
    .eq('target_id', qId)
    .eq('target_type', 'question')

  const newVoteCount = (allVotes ?? []).reduce((sum, v) => sum + v.value, 0)

  await supabase.from('questions')
    .update({ vote_count: newVoteCount })
    .eq('id', qId)

  // Verificam daca userul mai are un vot activ (pentru highlight in frontend)
  const { data: activeVote } = await supabase
    .from('votes').select('id')
    .eq('target_id', qId).eq('target_type', 'question').eq('user_id', uid)
    .maybeSingle()

  res.json({ vote_count: newVoteCount, voted: !!activeVote })
})

module.exports = router


