const { supabase } = require('../supabase')

async function requireAuth(req, res, next) {
    
  const authHeader = req.headers['authorization']
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Token lipsa sau format gresit' })
  }
  const token = authHeader.split(' ')[1]

  console.log('[auth] token primit (primele 20 chars):', token?.slice(0, 20))

  // Lasam Supabase sa verifice semnatura si expirarea token-ului pentru noi.
  // NU decodam manual JWT-ul — supabase.auth.getUser() face validarea complet.
  const { data: { user }, error } = await supabase.auth.getUser(token)

  console.log('[auth] getUser result — user:', user?.id ?? null, '| error:', error?.message ?? null)

  if (error || !user) {
    return res.status(401).json({ error: 'Token invalid sau expirat' })
  }
  // Atasam utilizatorul autentificat la obiectul request,
  // astfel incat handler-ul rutei il poate accesa prin req.user
  req.user = user
  next()
}

module.exports = { requireAuth }
