export function Status({ solved }: { solved: boolean }) {
  return solved ? (
    <span className="text-xs font-medium px-3 py-1 rounded-full" style={{ backgroundColor: '#e8f0e1', color: '#5B7E3C' }}>
      Solved
    </span>
  ) : (
    <span className="text-xs bg-gray-100 text-gray-700 font-medium px-3 py-1 rounded-full">
      Unsolved
    </span>
  )
}
