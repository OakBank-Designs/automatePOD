import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'

import './index.css'
import ProductSelector from './components/ProductSelector'


function App() {
  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <h1 className="text-3xl font-bold mb-6">Printify Product Selector</h1>
      <ProductSelector />
    </div>
  )
}

export default App
