// src/components/ProductSelector.tsx
import { useEffect, useState } from 'react'
import axios from '../api' // Adjusted the path to match the likely correct location
import { ChevronLeftIcon, ChevronRightIcon, XMarkIcon } from '@heroicons/react/24/solid'

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

  // Track which descriptions are expanded
  const [expandedDescriptions, setExpandedDescriptions] = useState<Record<string, boolean>>({})

  // Track selected products
  const [selected, setSelected] = useState<Record<string, boolean>>({})

  // Modal carousel state
  const [modalOpen, setModalOpen] = useState(false)
  const [modalImages, setModalImages] = useState<string[]>([])
  const [modalIndex, setModalIndex] = useState(0)

  // Search state
  const [searchText, setSearchText] = useState('')

  const openModal = (images: string[] = [], startIndex: number = 0) => {
    setModalImages(images)
    setModalIndex(startIndex)
    setModalOpen(true)
  }
  const closeModal = () => setModalOpen(false)

  const toggleExpanded = (id: string) => {
    setExpandedDescriptions(prev => ({
      ...prev,
      [id]: !prev[id],
    }))
  }

  const toggleSelected = (id: string) => {
    setSelected(prev => ({
      ...prev,
      [id]: !prev[id],
    }))
  }

  // Filter products by search text
  const filteredProducts = products.filter(product =>
    product.title.toLowerCase().includes(searchText.toLowerCase()) ||
    product.brand.toLowerCase().includes(searchText.toLowerCase()) ||
    product.model.toLowerCase().includes(searchText.toLowerCase())
  )

  // Pagination state
  const itemsPerPage = 10
  const [currentPage, setCurrentPage] = useState(1)
  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage)
  // Slice the products for current page
  const paginatedProducts = filteredProducts.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  )

  // Compute visible page numbers (max 10 links, always including 1 and totalPages)
  const pageNumbers: (number | 'ellipsis')[] = []
  if (totalPages <= 10) {
    for (let i = 1; i <= totalPages; i++) pageNumbers.push(i)
  } else {
    const start = Math.max(2, currentPage - 4)
    const end = Math.min(totalPages - 1, currentPage + 5)
    pageNumbers.push(1)
    if (start > 2) pageNumbers.push('ellipsis')
    for (let i = start; i <= end; i++) pageNumbers.push(i)
    if (end < totalPages - 1) pageNumbers.push('ellipsis')
    pageNumbers.push(totalPages)
  }

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
      <div className="mb-4 flex justify-end">
        <input
          type="text"
          value={searchText}
          onChange={e => {
            setSearchText(e.target.value)
            setCurrentPage(1)
          }}
          placeholder="Search products..."
          className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
      </div>
      <div className="border border-gray-300 rounded-lg shadow-lg bg-gradient-to-br from-white to-gray-50">
        <div className="relative overflow-x-auto">
          <table className="min-w-full table-fixed text-sm text-gray-800">
            <thead className="sticky top-0 z-10 bg-white shadow">
              <tr>
                <th className="p-3 text-center border-b border-gray-300 w-28">Select</th>
                <th className="p-3 text-center border-b border-gray-300">Image</th>
                <th className="p-3 text-center border-b border-gray-300">Product Name</th>
                <th className="p-3 text-center border-b border-gray-300">Brand</th>
                <th className="p-3 text-center border-b border-gray-300">Model</th>
                <th className="p-3 text-center border-b border-gray-300">Description</th>
              </tr>
            </thead>
            <tbody>
              {paginatedProducts.map(product => {
                const imageUrl = product.images && product.images.length > 0 ? product.images[0] : null
                return (
                  <tr key={product.id} className="even:bg-white odd:bg-gray-50 hover:bg-blue-50 transition duration-150">
                    <td className="p-2 text-center border-t border-gray-300 w-28">
                      <button
                        onClick={() => toggleSelected(product.id)}
                        className={`px-3 py-1 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-offset-2 ${selected[product.id] ? 'bg-blue-600 text-white focus:ring-blue-500' : 'bg-gray-200 text-gray-800 focus:ring-gray-400'}`}
                      >
                        {selected[product.id] ? 'Selected' : 'Select'}
                      </button>
                    </td>
                    <td className="p-2 text-left border-t border-gray-300">
                      {imageUrl ? (
                        <button onClick={() => openModal(product.images || [], 0)} className="focus:outline-none">
                          <img
                            src={imageUrl}
                            alt={product.title}
                            loading="lazy"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = 'https://placehold.co/64x64'
                            }}
                            className="w-[64px] h-[64px] object-cover rounded-md mx-auto cursor-pointer"
                          />
                        </button>
                      ) : (
                        <button onClick={() => openModal(product.images || [], 0)} className="focus:outline-none">
                          <img
                            src="https://placehold.co/64x64"
                            alt="No Image Available"
                            loading="lazy"
                            className="w-[64px] h-[64px] object-cover rounded-md mx-auto cursor-pointer"
                          />
                        </button>
                      )}
                    </td>
                    <td className="p-2 text-left border-t border-gray-300">
                      <span className="font-semibold">{product.title}</span>
                    </td>
                    <td className="p-2 text-left border-t border-gray-300">
                      <span className="font-semibold">{product.brand}</span>
                    </td>
                    <td className="p-2 text-left border-t border-gray-300">
                      <span className="font-semibold">{product.model}</span>
                    </td>
                    <td className="p-2 text-left border-t border-gray-300">
                      <div className="flex justify-between items-start">
                        <div
                          className={
                            expandedDescriptions[product.id]
                              ? 'text-left'
                              : 'overflow-hidden text-left [display:-webkit-box] [-webkit-line-clamp:2] [-webkit-box-orient:vertical]'
                          }
                        >
                          <div
                            dangerouslySetInnerHTML={{ __html: product.description }}
                          />
                        </div>
                        <button
                          onClick={() => toggleExpanded(product.id)}
                          className="ml-4 px-2 py-0.5 bg-gray-100 text-gray-700 text-sm font-normal rounded hover:bg-gray-200 focus:outline-none focus:ring-1 focus:ring-gray-300"
                        >
                          {expandedDescriptions[product.id] ? 'Show Less' : 'Show More'}
                        </button>
                      </div>
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
              <div className="flex items-center space-x-6">
                <p className="text-sm text-gray-700">
                  Showing <span className="font-medium">{(currentPage - 1) * itemsPerPage + 1}</span> to <span className="font-medium">{Math.min(currentPage * itemsPerPage, filteredProducts.length)}</span> of{' '}
                  <span className="font-medium">{filteredProducts.length}</span> results
                </p>
                <p className="text-sm text-gray-700">
                  Items selected: <span className="font-medium">{Object.values(selected).filter(Boolean).length}</span>
                </p>
              </div>
              <div>
                <nav aria-label="Pagination" className="isolate inline-flex -space-x-px rounded-md shadow-xs">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                    className="relative inline-flex items-center px-2 py-2 text-gray-400 ring-1 ring-gray-300 ring-inset hover:bg-gray-50 disabled:opacity-50 focus:z-20 focus:outline-offset-0"
                  >
                    <span className="sr-only">Previous</span>
                    <ChevronLeftIcon aria-hidden="true" className="w-5 h-5" />
                  </button>
                  {pageNumbers.map((page, idx) =>
                    page === 'ellipsis' ? (
                      <span key={idx} className="relative inline-flex items-center px-4 py-2 text-sm text-gray-700">
                        …
                      </span>
                    ) : (
                      <button
                        key={idx}
                        onClick={() => setCurrentPage(page as number)}
                        aria-current={page === currentPage ? 'page' : undefined}
                        className={`relative inline-flex items-center px-4 py-2 text-sm font-semibold focus:z-20 focus:outline-offset-0 ${
                          page === currentPage
                            ? 'bg-indigo-600 text-white'
                            : 'text-gray-900 ring-1 ring-gray-300 ring-inset hover:bg-gray-50'
                        }`}
                      >
                        {page}
                      </button>
                    )
                  )}
                  <button
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                    className="relative inline-flex items-center px-2 py-2 text-gray-400 ring-1 ring-gray-300 ring-inset hover:bg-gray-50 disabled:opacity-50 focus:z-20 focus:outline-offset-0"
                  >
                    <span className="sr-only">Next</span>
                    <ChevronRightIcon aria-hidden="true" className="w-5 h-5" />
                  </button>
                </nav>
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* Modal carousel for product images */}
      {modalOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 transition-opacity duration-300"
          onClick={closeModal}
        >
          <button
            onClick={closeModal}
            aria-label="Close carousel"
            className="absolute top-4 right-4 p-2 bg-white bg-opacity-90 rounded-full hover:bg-opacity-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 z-60"
          >
            <XMarkIcon className="w-8 h-8 text-gray-800" />
          </button>
          <div
            className="relative bg-white rounded-md shadow-lg"
            onClick={e => e.stopPropagation()}
          >
            <div className="relative">
              <img
                key={modalIndex}
                src={modalImages[modalIndex]}
                alt={`Image ${modalIndex + 1}`}
                className="transition-opacity duration-300 max-h-[80vh] max-w-[80vw] object-contain"
              />
              <button
                onClick={() => setModalIndex((modalIndex - 1 + modalImages.length) % modalImages.length)}
                className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 p-2 rounded-full focus:outline-none"
              >
                <ChevronLeftIcon className="w-6 h-6 text-white" />
              </button>
              <button
                onClick={() => setModalIndex((modalIndex + 1) % modalImages.length)}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 p-2 rounded-full focus:outline-none"
              >
                <ChevronRightIcon className="w-6 h-6 text-white" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}