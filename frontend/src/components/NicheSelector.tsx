// frontend/src/components/NicheSelector.tsx
import { useState } from 'react'
import axios from 'axios'
import { useNavigate } from 'react-router-dom'

export default function NicheSelector() {
  const [productType, setProductType] = useState('')
  const [suggestions, setSuggestions] = useState<string[]>([])
  const [chosen, setChosen] = useState<string>('')
  const [isLoading, setIsLoading] = useState(false)
  const navigate = useNavigate()
  const [error, setError] = useState<string|null>(null);

  // Fetch AI suggestions
  const fetchSuggestions = async () => {
    if (!productType.trim()) return
    setIsLoading(true)
    try {
      const res = await axios.post('/niches/suggest', { product_type: productType })
      setSuggestions(res.data.suggestions)
    } catch (err: any) {
        console.error(err) 
        setError(err.response?.data?.detail || err.message || 'Unknown error')
    } finally {
      setIsLoading(false)
    }
  }

  // Save the chosen niche
  const chooseNiche = async (name: string) => {
    try {
      // assuming user_id is 1 for now; swap with real auth ID as needed
      const res = await axios.post('/niches/choose', { name, user_id: 1 })
      console.log('Niche saved:', res.data)
      // navigate to next step, e.g. design generator
      navigate('/design')
    } catch (err) {
      console.error(err)
      alert('Error saving niche')
    }
  }

  return (
    <div className="max-w-lg mx-auto p-4 space-y-4">
      <h2 className="text-2xl font-semibold">Step 2: Pick a Niche</h2>

      <div>
        <label className="block mb-1">Product Type</label>
        <input
          type="text"
          value={productType}
          onChange={e => setProductType(e.target.value)}
          placeholder="e.g. T-Shirt"
          className="w-full border rounded px-3 py-2"
        />
      </div>

      <button
        onClick={fetchSuggestions}
        disabled={isLoading || !productType.trim()}
        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
      >
        {isLoading ? 'Loading…' : 'Get AI Suggestions'}
      </button>

      {suggestions.length > 0 && (
        <ul className="space-y-2">
          {suggestions.map((s, i) => (
            <li key={i}>
              <button
                onClick={() => chooseNiche(s)}
                className="block w-full text-left border rounded px-3 py-2 hover:bg-gray-100"
              >
                {s}
              </button>
            </li>
          ))}
        </ul>
      )}

      <div className="mt-6">
        <label className="block mb-1">Or enter your own niche</label>
        <input
          type="text"
          value={chosen}
          onChange={e => setChosen(e.target.value)}
          placeholder="e.g. Fitness"
          className="w-full border rounded px-3 py-2"
        />
        <button
          onClick={() => chooseNiche(chosen)}
          disabled={!chosen.trim()}
          className="mt-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded"
        >
          Save Niche
        </button>
      </div>
    </div>
)
}