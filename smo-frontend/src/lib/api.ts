// src/lib/api.ts - toate request-urile catre backend trec prin aceasta functie
const API_URL = import.meta.env.VITE_API_URL as string
// ATENTIE: prefixul VITE_ este obligatoriu! Fara el, valoarea e undefined in browser.

// ─────────────────────────────────────────────────────────────────
// Helper intern - face un singur fetch fara logica de refresh.
// Folosit direct pentru /auth/refresh ca sa evitam bucla infinita:
//   request() -> 401 -> request('/auth/refresh') -> 401 -> request('/auth/refresh') -> ...
// ─────────────────────────────────────────────────────────────────
// token-ul poate fi pasat explicit (prioritate maxima) sau citit din localStorage ca fallback
async function rawFetch(path: string, options: RequestInit = {}, token?: string | null): Promise<Response> {
  const t = token ?? localStorage.getItem('smo_token')

  return fetch(API_URL + path, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(t ? { Authorization: 'Bearer ' + t } : {}),
      ...(options.headers ?? {}),
    },
  })
}

// ─────────────────────────────────────────────────────────────────
// Functia principala de request - folosita in toata aplicatia
// token: pasat explicit din componenta (mai sigur decat localStorage)
// ─────────────────────────────────────────────────────────────────
export async function request<T = unknown>(path: string, options: RequestInit = {}, token?: string | null): Promise<T> {
  const res = await rawFetch(path, options, token)

  if (res.status === 401) {
    // Token-ul a expirat -> incercam sa il reinnoim automat (silent refresh)
    const rt = localStorage.getItem('smo_refresh')

    if (rt) {
      // Folosim rawFetch in loc de request() - evitam bucla infinita
      const refreshRes = await rawFetch('/auth/refresh', {
        method: 'POST',
        body: JSON.stringify({ refreshToken: rt }),
      })

      if (refreshRes.ok) {
        const data = await refreshRes.json()
        localStorage.setItem('smo_token', data.accessToken)   // salvam noul access token
        localStorage.setItem('smo_refresh', data.refreshToken) // salvam noul refresh token

        // Reincercam request-ul original cu noul token
        const retryRes = await rawFetch(path, options)
        if (!retryRes.ok) throw await retryRes.json()
        return retryRes.json() as Promise<T>
      }
    }

    // Refresh a esuat sau nu exista refresh token -> curatam storage-ul
    // si aruncam eroare (componenta va redirecta spre /signin)
    localStorage.removeItem('smo_token')
    localStorage.removeItem('smo_refresh')
    throw new Error('Unauthorized')
  }

  if (!res.ok) throw await res.json() // aruncam eroarea JSON de la server
  return res.json() as Promise<T>
}
