import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Navbar } from '../components/Navbar'
import { Sidebar } from '../components/Sidebar'
import { tagColor } from '../components/TagPill'
import { supabase } from '../lib/supabase'

type Tag = { id: string; name: string }

function Tags() {
  const navigate = useNavigate()
  const [tags, setTags] = useState<Tag[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase
      .from('tags')
      .select('id, name')
      .order('name')
      .then(({ data }) => { if (data) setTags(data) })
      .then(() => setLoading(false))
      .catch(() => setLoading(false))
  }, [])

  return (
    <div className="pt-14">
      <Navbar />
      <Sidebar />
      <div className="max-w-5xl mx-auto px-4 py-6">
        <p className="text-2xl font-bold text-black mb-6">Tags</p>

        {loading && <p className="text-sm text-gray-400">Loading...</p>}

        {!loading && (
          <div className="flex flex-wrap gap-3">
            {tags.map((tag) => (
              <button
                key={tag.id}
                onClick={() => navigate(`/?search=${tag.name}&mode=tags`)}
                className={`text-sm font-medium px-4 py-2 rounded-full transition hover:opacity-80 ${tagColor(tag.name)}`}
              >
                {tag.name}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default Tags
