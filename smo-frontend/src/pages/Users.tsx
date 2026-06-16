import { useEffect, useState } from 'react'
import { Navbar } from '../components/Navbar'
import { Sidebar } from '../components/Sidebar'

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string
const SMO_AI_USER_ID = import.meta.env.VITE_SMO_AI_USER_ID as string

type UserRow = { id: string; username: string; reputation: number }

function Users() {
  const [users, setUsers] = useState<UserRow[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const params = new URLSearchParams({
      select: 'id,username,reputation',
      order: 'reputation.desc',
      [`id`]: `neq.${SMO_AI_USER_ID}`,
    })

    fetch(`${SUPABASE_URL}/rest/v1/profiles?${params}`, {
      headers: { apikey: SUPABASE_KEY },
    })
      .then((r) => r.json())
      .then((rows: UserRow[]) => setUsers(rows))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  return (
    <div>
      <Navbar />
      <div className="max-w-6xl mx-auto px-4 py-6 flex gap-6 items-start">
        <Sidebar />
        <main className="flex-1">
          <p className="text-2xl font-bold text-black mb-6">Users</p>

          {loading && (
            <p className="text-sm text-gray-400">Loading...</p>
          )}

          {!loading && (
            <div className="flex flex-col gap-3">
              {users.map((u, i) => (
                <div
                  key={u.id}
                  className="flex items-center gap-4 bg-gray-50 border border-gray-200 rounded-2xl px-5 py-4"
                >
                  <span className="text-sm font-bold text-gray-300 w-6 text-right shrink-0">#{i + 1}</span>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-gray-800">{u.username}</p>
                  </div>
                  <span className="text-sm font-semibold text-orange-500">{u.reputation} rep</span>
                </div>
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  )
}

export default Users
