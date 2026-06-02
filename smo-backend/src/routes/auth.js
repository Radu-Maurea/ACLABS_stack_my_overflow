const express = require('express')
const router = express.Router()
const { supabase } = require('../supabase')

// ─────────────────────────────────────────────
// POST /auth/register — Inregistrare utilizator nou
// ─────────────────────────────────────────────
router.post('/register', async (req, res) => {
  const { email, password, username } = req.body

  // Pasul 1: validam ca toate campurile sunt prezente
  if (!email || !password || !username) {
    return res.status(400).json({ error: 'email, password si username sunt obligatorii' })
  }

  // Pasul 2: verificam ca username-ul nu e deja luat
  const { data: existing } = await supabase.from('profiles')
    .select('id').eq('username', username).single()

  if (existing) {
    return res.status(400).json({ error: 'Username-ul este deja folosit' })
  }

  // Pasul 3: cream userul in Supabase Auth — necesita SERVICE ROLE KEY!
  // email_confirm: true = marcam emailul ca verificat automat (dev only)
  const { data: { user }, error: createErr } =
    await supabase.auth.admin.createUser({ email, password, email_confirm: true })

  if (createErr) return res.status(400).json({ error: createErr.message })

  // Pasul 4: cream profilul — id TREBUIE sa fie UUID-ul din auth, nu altul!
  const { error: profileErr } = await supabase.from('profiles')
    .insert({ id: user.id, username, email })

  if (profileErr) {
    // Rollback: stergem userul din auth daca profilul n-a putut fi creat
    await supabase.auth.admin.deleteUser(user.id)
    return res.status(500).json({ error: 'Eroare la crearea profilului' })
  }

  // Pasul 5: logam userul automat si returnam tokenii
  const { data: sess } = await supabase.auth.signInWithPassword({ email, password })
  res.status(201).json({
    accessToken: sess.session.access_token,
    refreshToken: sess.session.refresh_token,
  })
})

// ─────────────────────────────────────────────
// POST /auth/login — Autentificare cu email si parola
// ─────────────────────────────────────────────
router.post('/login', async (req, res) => {
  const { email, password } = req.body

  // Validare — ambele campuri sunt obligatorii
  if (!email || !password) {
    return res.status(400).json({ error: 'email si password sunt obligatorii' })
  }

  // Supabase verifica parola hash-uita intern — nu facem niciodata compararea manual.
  // signInWithPassword se ocupa de tot: verifica hash-ul bcrypt si emite sesiunea JWT.
  const { data, error } = await supabase.auth.signInWithPassword({ email, password })

  if (error || !data.session) {
    return res.status(401).json({ error: 'Email sau parola incorecta' })
  }

  // Dupa autentificare reusita, aducem datele suplimentare din tabela profiles
  // (username, avatar etc.) folosind ID-ul utilizatorului returnat de Supabase Auth
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', data.user.id)
    .single()

  // Trimitem inapoi token-urile si obiectul utilizator complet (auth + profil)
  return res.status(200).json({
    accessToken: data.session.access_token,
    refreshToken: data.session.refresh_token,
    user: { ...data.user, profile },
  })
})

// ─────────────────────────────────────────────
// POST /auth/refresh — Obtinerea unui access token nou cu refresh token-ul
// ─────────────────────────────────────────────
router.post('/refresh', async (req, res) => {
  const { refreshToken } = req.body

  // Validare — refresh token-ul este obligatoriu
  if (!refreshToken) {
    return res.status(400).json({ error: 'refreshToken obligatoriu' })
  }

  // Lasam Supabase sa verifice validitatea refresh token-ului si sa emita o sesiune noua.
  // Daca token-ul a expirat sau a fost revocat, Supabase va returna eroare.
  const { data, error } = await supabase.auth.refreshSession({ refresh_token: refreshToken })

  if (error || !data.session) {
    return res.status(401).json({ error: 'Token invalid sau expirat' })
  }

  // Returnam noile token-uri generate de Supabase
  return res.status(200).json({
    accessToken: data.session.access_token,
    refreshToken: data.session.refresh_token,
  })
})

module.exports = router
