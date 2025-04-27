axios.defaults.baseURL = import.meta.env.VITE_API_URL
  ? `${import.meta.env.VITE_API_URL}`
  : 'http://localhost:8000'
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Wand2 } from 'lucide-react';
import { Image as ImageIcon } from 'lucide-react';
import { Info } from 'lucide-react';
import { Star } from 'lucide-react';
import { Dialog } from '@headlessui/react';


export default function CreateProduct() {
  // Form state
  const [catalog, setCatalog] = useState<{ id: number; title: string }[]>([]);
  const [blueprintId, setBlueprintId] = useState<number | undefined>();
  const [variants, setVariants] = useState<number[]>([]);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [safetyInfo, setSafetyInfo] = useState('');
  // Preview images
  const [previews, setPreviews] = useState<string[]>([]);
  // Additional form fields
  const [niche, setNiche] = useState('');
  const [stylePrefs, setStylePrefs] = useState('');
  const [additionalNotes, setAdditionalNotes] = useState('');
  const [suggestions, setSuggestions] = useState<string[]>([]);

  // New states for templates and product selection
  const [templates, setTemplates] = useState<{ id: number; name: string; products: number[]; variants: { [key: number]: number[] } }[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState<number | undefined>();
  const [selectedProducts, setSelectedProducts] = useState<number[]>([]);
  const [variantOptions, setVariantOptions] = useState<{ [productId: number]: { id: number; title: string }[] }>({});
  const [selectedVariants, setSelectedVariants] = useState<{ [productId: number]: number[] }>({});
  // Catalog modal and product selection state
  const [isCatalogOpen, setIsCatalogOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<{ id: number; title: string } | null>(null);
  const [filter, setFilter] = useState('');
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  // State for product detail modal
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [detailProduct, setDetailProduct] = useState<{ id: number; title: string; [key: string]: any } | null>(null);

  // Image carousel state
  const [isImageCarouselOpen, setIsImageCarouselOpen] = useState(false);
  const [carouselImages, setCarouselImages] = useState<string[]>([]);
  const [carouselIndex, setCarouselIndex] = useState(0);

  async function fetchNicheSuggestions() {
    try {
      const productTitle = catalog.find(c => c.id === blueprintId)?.title || '';
      const res = await axios.post('niches/suggest', { product_type: productTitle });
      setSuggestions(res.data.suggestions || []);
    } catch (err) {
      console.error(err);
    }
  }
  // Tab state for Panel B
  const [activeTab, setActiveTab] = useState<'preview' | 'metadata'>('preview');
  // Metadata fields
  const [keywords, setKeywords] = useState('');
  const [tags, setTags] = useState('');

  // Fetch Printify catalog on mount
  // Image loading state for catalog thumbnails
  const [loadingImages, setLoadingImages] = useState<{ [key: number]: boolean }>({});
  useEffect(() => {
    async function loadCatalog() {
      try {
        const res = await axios.get('printify/catalog');
        const raw = Array.isArray(res.data) ? res.data : [];
        // Temporarily disable AI classification; assign all items to 'Other'
        const categorized = raw.map(item => ({ ...item, category: 'Other' }));
        setCatalog(categorized);
        setCategories(Array.from(new Set(categorized.map(item => item.category))));
      } catch (err) {
        console.error('Failed to load catalog', err);
        setCatalog([]);
      }
    }
    loadCatalog();
  }, []);

  // Load saved templates on mount
  useEffect(() => {
    async function loadTemplates() {
      try {
        const res = await axios.get('templates');
        // Ensure we have an array
        const data = Array.isArray(res.data) ? res.data : res.data.templates ?? [];
        setTemplates(data);
      } catch (err) {
        if (!axios.isAxiosError(err) || err.response?.status !== 404) {
          console.error(err);
        }
        setTemplates([]);
      }
    }
    loadTemplates();
  }, []);

  // Apply selected template
  useEffect(() => {
    if (selectedTemplateId === undefined) return;
    const template = templates.find(t => t.id === selectedTemplateId);
    if (template) {
      setSelectedProducts(template.products);
      setSelectedVariants(template.variants || {});
    }
  }, [selectedTemplateId, templates]);

  // Fetch variant options whenever selectedProducts changes
  useEffect(() => {
    async function fetchVariants() {
      const variantsMap: { [productId: number]: { id: number; title: string }[] } = {};
      for (const productId of selectedProducts) {
        try {
          const res = await axios.get(`printify/catalog/${productId}/variants`);
          variantsMap[productId] = res.data || [];
        } catch (err) {
          console.error(err);
          variantsMap[productId] = [];
        }
      }
      setVariantOptions(variantsMap);
    }
    if (selectedProducts.length > 0) {
      fetchVariants();
    } else {
      setVariantOptions({});
    }
  }, [selectedProducts]);

  // Helper to toggle product selection
  function toggleProduct(productId: number) {
    setSelectedProducts(prev => {
      if (prev.includes(productId)) {
        const newSelected = prev.filter(id => id !== productId);
        // Also remove variants for this product
        setSelectedVariants(prevVariants => {
          const copy = { ...prevVariants };
          delete copy[productId];
          return copy;
        });
        return newSelected;
      } else {
        return [...prev, productId];
      }
    });
  }

  // Helper to toggle variant selection for a product
  function toggleVariant(productId: number, variantId: number) {
    setSelectedVariants(prev => {
      const current = prev[productId] || [];
      if (current.includes(variantId)) {
        return { ...prev, [productId]: current.filter(v => v !== variantId) };
      } else {
        return { ...prev, [productId]: [...current, variantId] };
      }
    });
  }

  // Save current template
  async function saveTemplate() {
    try {
      const name = prompt('Enter a name for this template');
      if (!name) return;
      const res = await axios.post('/templates', {
        name,
        products: selectedProducts,
        variants: selectedVariants,
      });
      setTemplates(prev => [...prev, res.data]);
      setSelectedTemplateId(res.data.id);
    } catch (err) {
      console.error(err);
    }
  }

  // Handle form submission
  async function onGenerate() {
    if (selectedProducts.length === 0) return;
    // Save product records for each selected product with selected variants
    // Assuming backend expects one product at a time, we process sequentially
    for (const productId of selectedProducts) {
      const prodRes = await axios.post('/products/', {
        niche,
        blueprint_id: productId,
        variants: selectedVariants[productId] || [],
        style_preferences: stylePrefs,
        additional_notes: additionalNotes,
        title,
        description,
        safety_information: safetyInfo,
      });
      const productIdCreated = prodRes.data.id;
      // Generate design previews for each created product
      const genRes = await axios.post('/designs/generate', { product_id: productIdCreated });
      setPreviews(genRes.data.previews || []);
    }
  }

  return (
    <div className="container mx-auto p-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
      {/* Panel A: Generate form */}
      <section className="lg:col-span-5 bg-white border border-gray-200 rounded-lg shadow-lg p-6 flex flex-col">
        <h3 className="text-2xl font-semibold text-gray-800 mb-6">Product Generation</h3>
        <div className="space-y-4 flex flex-col flex-grow">
          <div>
            <label className="block mb-1">Niche</label>
            <div className="flex items-center space-x-2">
              <input
                type="text"
                className="flex-1 border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-blue-200"
                value={niche}
                placeholder="e.g. Fitness & Wellness"
                onChange={e => setNiche(e.target.value)}
              />
              <button
                type="button"
                onClick={fetchNicheSuggestions}
                className="flex items-center bg-indigo-600 text-white px-3 py-2 rounded-md hover:bg-indigo-700 transition"
              >
                <Wand2 className="w-5 h-5 mr-2" />
                AI Suggest
            </button>
            </div>
            {suggestions.length > 0 && (
              <ul className="mt-2 bg-white border border-gray-200 rounded-md max-h-40 overflow-auto">
                {suggestions.map((s, i) => (
                  <li
                    key={i}
                    className="px-3 py-2 hover:bg-gray-100 cursor-pointer"
                    onClick={() => { setNiche(s); setSuggestions([]); }}
                  >
                    {s}
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Template selection and save */}
          <div>
            <label className="block mb-1">Product Type Template</label>
            <div className="flex space-x-2">
              <select
                className="flex-1 border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-blue-200"
                value={selectedTemplateId || ''}
                onChange={e => setSelectedTemplateId(e.target.value ? Number(e.target.value) : undefined)}
              >
                <option value="">Select a template</option>
                {Array.isArray(templates) && templates.map(t => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
              {/* <button
                type="button"
                onClick={saveTemplate}
                className="bg-green-600 text-white px-3 py-2 rounded-md hover:bg-green-700 transition"
              >
                Save Template
              </button> */}
            </div>
          </div>

          {/* Product selection */}
          <div className="w-full">
            <label className="block mb-1">Product Type</label>
            <button
              type="button"
              onClick={() => setIsCatalogOpen(true)}
              className="w-full border border-gray-300 rounded-md p-2 text-left hover:bg-gray-50 flex flex-wrap gap-2"
            >
              {selectedProducts.length > 0
                ? selectedProducts
                    .map(id => catalog.find(c => c.id === id)?.title)
                    .filter(Boolean)
                    .join(', ')
                : "Select products…"}
            </button>
          </div>
           <div>
            <label className="block mb-1">Style Preferences</label>
            <input
              type="text"
              className="w-full border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-blue-200"
              value={stylePrefs}
              placeholder="e.g. Bold typography, minimal graphics"
              onChange={e => setStylePrefs(e.target.value)}
            />
          </div>

          <div>
            <label className="block mb-1">Additional Notes</label>
            <textarea
              className="w-full border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-blue-200"
              rows={2}
              value={additionalNotes}
              placeholder="e.g. Use eco-friendly inks"
              onChange={e => setAdditionalNotes(e.target.value)}
            />
          </div>

          <button
            onClick={onGenerate}
            className="mt-auto bg-blue-600 text-white py-3 px-6 rounded-lg hover:bg-blue-700 transition"
          >
            Generate Design
          </button>
        </div>
      </section>

      {/* Catalog selection modal */}
      <Dialog open={isCatalogOpen} onClose={() => setIsCatalogOpen(false)}>
        <Dialog.Overlay className="fixed inset-0 bg-black opacity-30" />
        <div className="fixed inset-y-0 right-0 w-full sm:w-3/4 md:w-1/2 bg-white p-6 overflow-auto rounded-l-lg shadow-xl transform transition-transform duration-300">
          <Dialog.Title className="text-2xl font-semibold mb-4 flex justify-between items-center">
            <span>Pick a Product</span>
            <span className="text-sm text-gray-600">{selectedProducts.length} selected</span>
          </Dialog.Title>
          <div className="mb-4 flex space-x-2 overflow-auto">
            <button
              type="button"
              className={`px-3 py-1 rounded-md ${selectedCategory === '' ? 'bg-indigo-600 text-white' : 'bg-gray-200'}`}
              onClick={() => setSelectedCategory('')}
            >
              All
            </button>
            {categories.map(cat => (
              <button
                key={cat}
                type="button"
                className={`px-3 py-1 rounded-md ${selectedCategory === cat ? 'bg-indigo-600 text-white' : 'bg-gray-200'}`}
                onClick={() => setSelectedCategory(cat)}
              >
                {cat}
              </button>
            ))}
          </div>
          <input
            type="text"
            placeholder="Search…"
            value={filter}
            onChange={e => setFilter(e.target.value)}
            className="mb-6 w-full border border-gray-300 rounded-md p-3 focus:outline-none focus:ring-2 focus:ring-indigo-200"
          />
          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {catalog
              .filter(c =>
                (!selectedCategory || (c as any).category === selectedCategory) &&
                c.title.toLowerCase().includes(filter.toLowerCase())
              )
              .map(item => {
                const isSelected = selectedProducts.includes(item.id);
                let imgSrc: string | undefined = undefined;
                const anyItem = item as any;
                if (anyItem.image_url) imgSrc = anyItem.image_url;
                else if (anyItem.image) imgSrc = anyItem.image;
                else if (Array.isArray(anyItem.images) && anyItem.images.length > 0) {
                  const firstImage = anyItem.images[0];
                  imgSrc = typeof firstImage === 'string' ? firstImage : firstImage?.src;
                }
                return (
                  <li key={item.id} className="bg-white border border-gray-200 rounded-lg shadow hover:shadow-lg transition p-4 flex items-center space-x-4">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleProduct(item.id)}
                      className="h-5 w-5 text-indigo-600"
                    />
                    <div className="relative w-16 h-16">
                      {loadingImages[item.id] && (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-indigo-600"></div>
                        </div>
                      )}
                      <img
                        src={imgSrc || '/placeholder.png'}
                        alt={item.title}
                        className="w-16 h-16 object-cover rounded"
                        loading="lazy"
                        onLoad={() => setLoadingImages(prev => ({ ...prev, [item.id]: false }))}
                        onError={e => { e.currentTarget.onerror = null; e.currentTarget.src = '/placeholder.png'; setLoadingImages(prev => ({ ...prev, [item.id]: false })); }}
                        onLoadStart={() => setLoadingImages(prev => ({ ...prev, [item.id]: true }))}
                      />
                    </div>
                    <span className="flex-1 font-medium">{item.title}</span>
                    <button
                      type="button"
                      className="text-indigo-600 hover:underline"
                      onClick={() => {
                        setDetailProduct(item);
                        setIsDetailOpen(true);
                      }}
                    >
                      Details
                    </button>
                  </li>
                );
              })}
          </ul>
          <button
            type="button"
            onClick={() => setIsCatalogOpen(false)}
            className="mt-6 bg-indigo-600 text-white px-5 py-3 rounded-md hover:bg-indigo-700 transition"
          >
            Done
          </button>
        </div>
      </Dialog>

      {/* Product Detail Modal */}
      <Dialog open={isDetailOpen} onClose={() => setIsDetailOpen(false)}>
        <Dialog.Overlay className="fixed inset-0 bg-black opacity-30" />
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-lg w-full p-6">
            <Dialog.Title className="text-xl font-semibold mb-4">
              {detailProduct?.title}
            </Dialog.Title>
            {/* Display any additional fields */}
            <div className="space-y-4">
              {detailProduct && Object.entries(detailProduct).map(([key, value]) => {
                // Skip id and title
                if (key === 'id' || key === 'title') return null;

                // Render description HTML
                if (key === 'description') {
                  return (
                    <div key={key}>
                      <strong className="capitalize">{key.replace(/_/g, ' ')}:</strong>
                      <div
                        className="mt-1 prose"
                        dangerouslySetInnerHTML={{ __html: String(value) }}
                      />
                    </div>
                  );
                }

                // Render images as thumbnails
                if (['image_url', 'image', 'images'].includes(key)) {
                  const urls = Array.isArray(value) ? value : [String(value)];
                  return (
                    <div key={key}>
                      <strong className="capitalize">{key.replace(/_/g, ' ')}:</strong>
                      <div className="mt-1 flex space-x-2">
                        {urls.map((url, i) => (
                          <img
                            key={i}
                            src={url}
                            alt={detailProduct.title}
                            className="w-16 h-16 object-cover rounded cursor-pointer border"
                            onClick={() => {
                              setCarouselImages(urls);
                              setCarouselIndex(i);
                              setIsImageCarouselOpen(true);
                            }}
                          />
                        ))}
                      </div>
                    </div>
                  );
                }

                // Default text fields
                return (
                  <div key={key}>
                    <strong className="capitalize">{key.replace(/_/g, ' ')}:</strong>{' '}
                    {Array.isArray(value) ? value.join(', ') : String(value)}
                  </div>
                );
              })}
            </div>
            <button
              type="button"
              onClick={() => setIsDetailOpen(false)}
              className="mt-4 bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 transition"
            >
              Close
            </button>
          </div>
        </div>
      </Dialog>

      {/* Image Carousel Modal */}
      <Dialog open={isImageCarouselOpen} onClose={() => setIsImageCarouselOpen(false)}>
        <Dialog.Overlay className="fixed inset-0 bg-black bg-opacity-50" />
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-lg max-w-xl w-full p-6 flex flex-col items-center">
            <img
              src={carouselImages[carouselIndex]}
              alt={`Image ${carouselIndex + 1}`}
              className="max-h-[60vh] object-contain mb-4"
            />
            <div className="flex space-x-4 mb-4">
              <button
                type="button"
                onClick={() => setCarouselIndex(prev => (prev - 1 + carouselImages.length) % carouselImages.length)}
                className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
              >
                Prev
              </button>
              <button
                type="button"
                onClick={() => setCarouselIndex(prev => (prev + 1) % carouselImages.length)}
                className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
              >
                Next
              </button>
            </div>
            <button
              type="button"
              onClick={() => setIsImageCarouselOpen(false)}
              className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
            >
              Close
            </button>
          </div>
        </div>
      </Dialog>

      {/* Panel B: Preview carousel and metadata tabs */}
      <section className="lg:col-span-7 bg-white border border-gray-200 rounded-lg shadow-lg p-6 flex flex-col">
        <h3 className="text-2xl font-semibold text-gray-800 mb-6">Design Preview</h3>
        <div className="mb-6 flex space-x-4 bg-gray-100 rounded-lg p-1">
          <button
            className={`flex-1 text-center py-2 rounded-lg transition ${
              activeTab === 'preview'
                ? 'bg-white text-blue-600 shadow'
                : 'text-gray-600 hover:text-gray-800 hover:bg-white'
            }`}
            onClick={() => setActiveTab('preview')}
          >
            Design Preview
          </button>
          <button
            className={`flex-1 text-center py-2 rounded-lg transition ${
              activeTab === 'metadata'
                ? 'bg-white text-blue-600 shadow'
                : 'text-gray-600 hover:text-gray-800 hover:bg-white'
            }`}
            onClick={() => setActiveTab('metadata')}
          >
            Product Metadata
          </button>
        </div>
        {activeTab === 'preview' ? (
          previews.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {previews.map((url, i) => (
                <div key={i} className="rounded-lg overflow-hidden shadow-md">
                  <img src={url} alt={`Preview ${i+1}`} className="w-full object-cover" />
                </div>
              ))}
            </div>
          ) : (
            <div className="h-64 bg-gray-100 flex items-center justify-center">
              No design has been generated yet.
            </div>
          )
        ) : (
          <div className="space-y-4">
            <div>
              <label className="block mb-1">Title</label>
              <input
                type="text"
                className="w-full border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-blue-200"
                placeholder="e.g. Premium Cotton Tee"
                value={title}
                onChange={e => setTitle(e.target.value)}
              />
            </div>
            <div>
              <label className="block mb-1">Description</label>
              <textarea
                className="w-full border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-blue-200"
                rows={3}
                placeholder="e.g. High-quality, breathable cotton T-shirt perfect for summer."
                value={description}
                onChange={e => setDescription(e.target.value)}
              />
            </div>
            <div>
              <label className="block mb-1">Keywords</label>
              <input
                type="text"
                className="w-full border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-blue-200"
                placeholder="e.g. cotton, summer, casual"
                value={keywords}
                onChange={e => setKeywords(e.target.value)}
              />
            </div>
            <div>
              <label className="block mb-1">Tags</label>
              <input
                type="text"
                className="w-full border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-blue-200"
                placeholder="e.g. summer, bestseller"
                value={tags}
                onChange={e => setTags(e.target.value)}
              />
            </div>
            <div>
              <label className="block mb-1">Safety Information</label>
              <textarea
                className="w-full border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-blue-200"
                rows={2}
                placeholder="e.g. Machine wash cold, tumble dry low."
                value={safetyInfo}
                onChange={e => setSafetyInfo(e.target.value)}
              />
            </div>
          </div>
        )}
      </section>
    </div>
  )
}