import { BrowserRouter, Routes, Route, Link } from 'react-router-dom'
import Dashboard       from './pages/Dashboard'
import CreateProduct  from './pages/CreateProduct'
import ProductSelector from './components/ProductSelector'
import NicheSelector   from './components/NicheSelector'

export default function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen flex">
        <aside className="w-64 bg-gray-800 text-white p-4">
          <h1 className="text-xl font-bold mb-6">POD Automation</h1>
          <nav className="space-y-2">
            <Link to="/" className="block py-2 px-3 rounded hover:bg-gray-700">Home</Link>
            <Link to="/create" className="block py-2 px-3 rounded hover:bg-gray-700">Create New Product</Link>
          </nav>
        </aside>
        <main className="flex-1 bg-gray-50 p-6">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/create" element={<CreateProduct />}>
              <Route path="niche" element={<NicheSelector />} />
            </Route>
            <Route path="/product" element={<ProductSelector />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  )
}