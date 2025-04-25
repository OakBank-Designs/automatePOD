// frontend/src/components/NicheSelector.tsx
import { useState } from 'react'

interface Props {
  onSelect: (niche: string) => void
}

export default function NicheSelector({ onSelect }: Props) {
  const [input, setInput] = useState('')
  const [suggestions, setSuggestions] = useState<string[]>([])
  const [loading, setLoading] = useState(false)

  const fetchSuggestions = async () => {
    setLoading(true)
    const res = await fetch('/api/niches/suggest', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt: input })
    })
    const data = await res.json()
    setSuggestions(data.suggestions || [])
    setLoading(false)
  }

  return (
    <div className="space-y-4">
      <div className="flex space-x-2">
        <input
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder="Enter a broad niche (e.g. fitness, pets…)"
          className="flex-1 px-3 py-2 border rounded"
        />
        <button
          onClick={fetchSuggestions}
          disabled={loading || !input.trim()}
          className="px-4 py-2 bg-blue-600 text-white rounded disabled:opacity-50"
        >
          {loading ? 'Loading…' : 'Suggest'}
        </button>
      </div>
      <ul className="space-y-1">
        {suggestions.map((s, i) => (
          <li key={i}>
            <button
              onClick={() => onSelect(s)}
              className="text-left px-3 py-1 hover:bg-gray-100 w-full rounded"
            >
              {s}
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}