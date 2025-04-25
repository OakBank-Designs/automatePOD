import { Link } from 'react-router-dom'

export default function Home() {
    return (
      <div className="max-w-2xl mx-auto text-center space-y-6">
        <h1 className="text-4xl font-bold">Welcome to POD Assistant</h1>
        <p className="text-gray-700">
          Streamline your print-on-demand workflow:  
          select products, discover niches, generate designs, and publish—all in one place.
        </p>
        <div className="flex justify-center space-x-4">
          <Link to="/products" className="px-4 py-2 bg-indigo-600 text-white rounded">Get Started</Link>
          <Link to="/niche"    className="px-4 py-2 bg-gray-200 text-gray-800 rounded">Explore Niches</Link>
        </div>
      </div>
    )
  }