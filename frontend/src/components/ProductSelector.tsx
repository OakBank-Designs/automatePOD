// src/components/ProductSelector.tsx
import { useEffect, useState } from 'react'
import axios from '../api'
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/solid'

interface Product {
  id: string
  title: string
  images?: string[]
  brand: string
  model: string
  description: string
}

export default function ProductSelector() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    axios.get('/printify/catalog')
      .then(response => {
        if (import.meta.env.MODE === 'development') {
          console.log('RESPONSE:', response.data)
        }

        const rawProducts = response.data.products as Product[]
        console.log('SAMPLE PRODUCT:', rawProducts[0])
        const productArray: Product[] = Array.isArray(rawProducts)
          ? Array.from(
              new Map(
                rawProducts.map((p: Product) => [p.id, p])
              ).values()
            )
          : []

        setProducts(productArray)
        setLoading(false)
      })
      .catch(() => {
        setError("Failed to load products")
        setLoading(false)
      })
  }, [])

  if (loading) return <p>Loading products...</p>
  if (error) return <p className="text-red-500">{error}</p>

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 mt-10">
      <div className="border border-gray-300 rounded-lg shadow-lg bg-gradient-to-br from-white to-gray-50">
        <div className="relative overflow-x-auto max-h-[460px]">
          <table className="min-w-full table-fixed text-sm text-gray-800">
            <thead className="sticky top-0 z-10 bg-white shadow">
              <tr>
                <th className="p-3 text-center border-b border-gray-300">Select</th>
                <th className="p-3 text-center border-b border-gray-300">Image</th>
                <th className="p-3 text-center border-b border-gray-300">Product Name</th>
                <th className="p-3 text-center border-b border-gray-300">Brand</th>
                <th className="p-3 text-center border-b border-gray-300">Model</th>
                <th className="p-3 text-center border-b border-gray-300">Description</th>
              </tr>
            </thead>
            <tbody>
              {products.map(product => {
                const imageUrl = product.images && product.images.length > 0 ? product.images[0] : null
                return (
                  <tr key={product.id} className="even:bg-white odd:bg-gray-50 hover:bg-blue-50 transition duration-150">
                    <td className="p-2 align-middle text-center border-t border-gray-300">
                      <input
                        type="checkbox"
                        id={`select-${product.id}`}
                        name={`select-${product.id}`}
                        className="form-checkbox w-4 h-4 text-blue-600"
                      />
                    </td>
                    <td className="p-2 align-middle text-center border-t border-gray-300">
                      {imageUrl ? (
                        <img
                          src={imageUrl}
                          alt={product.title}
                          loading="lazy"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = 'https://placehold.co/64x64'
                          }}
                          className="w-[64px] h-[64px] object-cover rounded-md mx-auto"
                        />
                      ) : (
                        <img
                          src="https://placehold.co/64x64"
                          alt="No Image Available"
                          loading="lazy"
                          className="w-[64px] h-[64px] object-cover rounded-md mx-auto"
                        />
                      )}
                    </td>
                    <td className="p-2 align-middle border-t border-gray-300">
                      <span className="font-semibold">{product.title}</span>
                    </td>
                    <td className="p-2 align-middle border-t border-gray-300">
                      <span className="font-semibold">{product.brand}</span>
                    </td>
                    <td className="p-2 align-middle border-t border-gray-300">
                      <span className="font-semibold">{product.model}</span>
                    </td>
                    <td className="p-2 align-middle border-t border-gray-300">
                      <span
                        className="font-semibold"
                        dangerouslySetInnerHTML={{ __html: product.description }}
                      />
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        <div className="border-t border-gray-200 bg-gray-100 rounded-b-md px-4 py-3 sm:px-6">
          <div className="flex items-center justify-between">
            <div className="flex flex-1 justify-between sm:hidden">
              <a
                href="#"
                className="relative inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Previous
              </a>
              <a
                href="#"
                className="relative ml-3 inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Next
              </a>
            </div>
            <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-gray-700">
                  Showing <span className="font-medium">1</span> to <span className="font-medium">10</span> of{' '}
                  <span className="font-medium">{products.length}</span> results
                </p>
              </div>
              <div>
                <nav aria-label="Pagination" className="isolate inline-flex -space-x-px rounded-md shadow-xs">
                  <a
                    href="#"
                    className="relative inline-flex items-center rounded-l-md px-2 py-2 text-gray-400 ring-1 ring-gray-300 ring-inset hover:bg-gray-50 focus:z-20 focus:outline-offset-0"
                  >
                    <span className="sr-only">Previous</span>
                    <ChevronLeftIcon aria-hidden="true" className="w-5 h-5" />
                  </a>
                  <a
                    href="#"
                    aria-current="page"
                    className="relative z-10 inline-flex items-center bg-indigo-600 px-4 py-2 text-sm font-semibold text-white focus:z-20 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
                  >
                    1
                  </a>
                  <a
                    href="#"
                    className="relative inline-flex items-center px-4 py-2 text-sm font-semibold text-gray-900 ring-1 ring-gray-300 ring-inset hover:bg-gray-50 focus:z-20 focus:outline-offset-0"
                  >
                    2
                  </a>
                  <a
                    href="#"
                    className="relative hidden items-center px-4 py-2 text-sm font-semibold text-gray-900 ring-1 ring-gray-300 ring-inset hover:bg-gray-50 focus:z-20 focus:outline-offset-0 md:inline-flex"
                  >
                    3
                  </a>
                  <span className="relative inline-flex items-center px-4 py-2 text-sm font-semibold text-gray-700 ring-1 ring-gray-300 ring-inset focus:outline-offset-0">
                    ...
                  </span>
                  <a
                    href="#"
                    className="relative hidden items-center px-4 py-2 text-sm font-semibold text-gray-900 ring-1 ring-gray-300 ring-inset hover:bg-gray-50 focus:z-20 focus:outline-offset-0 md:inline-flex"
                  >
                    8
                  </a>
                  <a
                    href="#"
                    className="relative inline-flex items-center px-4 py-2 text-sm font-semibold text-gray-900 ring-1 ring-gray-300 ring-inset hover:bg-gray-50 focus:z-20 focus:outline-offset-0"
                  >
                    9
                  </a>
                  <a
                    href="#"
                    className="relative inline-flex items-center px-4 py-2 text-sm font-semibold text-gray-900 ring-1 ring-gray-300 ring-inset hover:bg-gray-50 focus:z-20 focus:outline-offset-0"
                  >
                    10
                  </a>
                  <a
                    href="#"
                    className="relative inline-flex items-center rounded-r-md px-2 py-2 text-gray-400 ring-1 ring-gray-300 ring-inset hover:bg-gray-50 focus:z-20 focus:outline-offset-0"
                  >
                    <span className="sr-only">Next</span>
                    <ChevronRightIcon aria-hidden="true" className="w-5 h-5" />
                  </a>
                </nav>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}