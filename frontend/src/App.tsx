import { BrowserRouter, Routes, Route, Link } from 'react-router-dom'
import ProductSelector from './components/ProductSelector'
import NicheSelector   from './components/NicheSelector'
import Home            from './pages/home'

export default function App() {
  return (
    <BrowserRouter>
      <nav className="p-4 bg-gray-100 space-x-4">
        <Link to="/" className="text-blue-600">Home</Link>
        <Link to="/product" className="text-blue-600">Product</Link>
        <Link to="/niche" className="text-blue-600">Niche</Link>
      </nav>

      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/product" element={<ProductSelector />} />
        <Route path="/niche" element={<NicheSelector />} />
        {/* add other steps here */}
      </Routes>
    </BrowserRouter>
  )
}