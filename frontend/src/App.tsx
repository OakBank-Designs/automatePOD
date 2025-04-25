import { BrowserRouter, Routes, Route, Link } from 'react-router-dom'
import ProductSelector from './components/ProductSelector'
import NicheSelector   from './components/NicheSelector'
import Home            from './pages/home'

function App() {
  return (
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <nav className="bg-white shadow px-8 py-4 flex space-x-4">
        <Link to="/" className="font-medium hover:underline">Home</Link>
        <Link to="/products" className="font-medium hover:underline">Products</Link>
        <Link to="/niche" className="font-medium hover:underline">Niche</Link>
      </nav>
      <div className="min-h-screen bg-gray-100 p-8">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/products" element={<ProductSelector />} />
          <Route path="/niche"    element={<NicheSelector onSelect={n => console.log(n)} />} />
          {/* later: <Route path="/design" element={<DesignGenerator />} /> */}
          {/* later: <Route path="/publish" element={<PublishStep />} /> */}
        </Routes>
      </div>
    </BrowserRouter>
  )
}
export default App