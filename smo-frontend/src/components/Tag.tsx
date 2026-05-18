const TAG_COLOR_MAP: Record<string, string> = {
  c: 'bg-green-100 text-green-700',
  j: 'bg-yellow-100 text-yellow-700',
  r: 'bg-rose-100 text-rose-600',
  p: 'bg-purple-100 text-purple-700',
  a: 'bg-amber-100 text-amber-700',
  h: 'bg-orange-100 text-orange-600',
  t: 'bg-teal-100 text-teal-700',
  s: 'bg-sky-100 text-sky-700',
}

const FALLBACK_COLOR = 'bg-stone-100 text-stone-600'

export function tagColor(name: string): string {
  const first = name[0]?.toLowerCase() ?? ''
  return TAG_COLOR_MAP[first] ?? FALLBACK_COLOR
}

export function Tag({ name }: { name: string }) {
  return (
    <span className={`text-xs font-medium px-3 py-1 rounded-full ${tagColor(name)}`}>
      {name}
    </span>
  )
}
