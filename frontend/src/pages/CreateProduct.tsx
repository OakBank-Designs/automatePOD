axios.defaults.baseURL = import.meta.env.VITE_API_URL || 'http://localhost:8000'
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Wand2 } from 'lucide-react';
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

  async function fetchNicheSuggestions() {
    try {
      const productTitle = catalog.find(c => c.id === blueprintId)?.title || '';
      const res = await axios.post('/niches/suggest', { product_type: productTitle });
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
  useEffect(() => {
    async function loadCatalog() {
      try {
        const res = await axios.get('/printify/catalog');
        const data = Array.isArray(res.data) ? res.data : [];
        setCatalog(data);
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
        const res = await axios.get('/templates');
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
          const res = await axios.get(`/printify/catalog/${productId}/variants`);
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
              className="w-full border border-gray-300 rounded-md p-2 text-left hover:bg-gray-50"
            >
              {selectedProduct?.title || "Select a product…"}
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
        <div className="fixed inset-y-0 right-0 w-full sm:w-3/4 md:w-1/2 bg-white p-6 overflow-auto">
          <Dialog.Title className="text-xl font-semibold mb-4">Pick a product</Dialog.Title>
          <input
            type="text"
            placeholder="Search…"
            value={filter}
            onChange={e => setFilter(e.target.value)}
            className="mb-4 w-full border border-gray-300 rounded-md p-2"
          />
          <ul className="space-y-2">
            {catalog
              .filter(c => c.title.toLowerCase().includes(filter.toLowerCase()))
              .map(item => (
                <li key={item.id} className="flex justify-between items-center">
                  <span>{item.title}</span>
                  <button
                    onClick={() => {
                      setSelectedProduct(item);
                      setIsCatalogOpen(false);
                    }}
                    className="text-indigo-600 hover:underline"
                  >
                    Select
                  </button>
                </li>
              ))}
          </ul>
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