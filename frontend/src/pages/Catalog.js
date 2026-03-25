import React, { useEffect, useState, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Filter, X, Loader2 } from 'lucide-react';
import axios from 'axios';
import { ProductCard } from '../components/ProductCard';
import { Button } from '../components/ui/button';
import { Slider } from '../components/ui/slider';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';
import { Checkbox } from '../components/ui/checkbox';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const categories = [
  { id: 'engines', name: 'Двигуни та комплектуючі' },
  { id: 'transmission', name: 'Трансмісія' },
  { id: 'hydraulics', name: 'Гідравліка' },
  { id: 'electrical', name: 'Електрика' },
  { id: 'chassis', name: 'Ходова частина' },
];

export const Catalog = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  
  // Filter states
  const [selectedCategories, setSelectedCategories] = useState(
    searchParams.get('category') ? [searchParams.get('category')] : []
  );
  const [priceRange, setPriceRange] = useState([500, 30000]);
  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '');
  const [sortBy, setSortBy] = useState('name');

  const fetchProducts = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      
      if (selectedCategories.length === 1) {
        params.append('category', selectedCategories[0]);
      }
      if (priceRange[0] > 500) {
        params.append('min_price', priceRange[0]);
      }
      if (priceRange[1] < 30000) {
        params.append('max_price', priceRange[1]);
      }
      if (searchQuery) {
        params.append('search', searchQuery);
      }

      const response = await axios.get(`${API}/products?${params.toString()}`);
      let filteredProducts = response.data;
      
      // Client-side filtering for multiple categories
      if (selectedCategories.length > 1) {
        filteredProducts = filteredProducts.filter(p => selectedCategories.includes(p.category));
      }

      // Sort
      if (sortBy === 'price_asc') {
        filteredProducts.sort((a, b) => a.price - b.price);
      } else if (sortBy === 'price_desc') {
        filteredProducts.sort((a, b) => b.price - a.price);
      } else {
        filteredProducts.sort((a, b) => a.name.localeCompare(b.name));
      }

      setProducts(filteredProducts);
    } catch (error) {
      console.error('Failed to fetch products:', error);
    } finally {
      setLoading(false);
    }
  }, [selectedCategories, priceRange, searchQuery, sortBy]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  useEffect(() => {
    const category = searchParams.get('category');
    const search = searchParams.get('search');
    if (category) {
      setSelectedCategories([category]);
    }
    if (search) {
      setSearchQuery(search);
    }
  }, [searchParams]);

  const handleCategoryToggle = (categoryId) => {
    setSelectedCategories(prev => 
      prev.includes(categoryId)
        ? prev.filter(c => c !== categoryId)
        : [...prev, categoryId]
    );
  };

  const clearFilters = () => {
    setSelectedCategories([]);
    setPriceRange([500, 30000]);
    setSearchQuery('');
    setSearchParams({});
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('uk-UA').format(price);
  };

  const activeFiltersCount = selectedCategories.length + (priceRange[0] > 500 || priceRange[1] < 30000 ? 1 : 0);

  return (
    <div className="max-w-7xl mx-auto px-4 py-8" data-testid="catalog-page">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl sm:text-4xl font-bold uppercase tracking-tight">Каталог</h1>
          <p className="text-[#474A51] mt-1">
            {loading ? 'Завантаження...' : `Знайдено ${products.length} товарів`}
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Mobile Filter Toggle */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="md:hidden flex items-center gap-2 px-4 py-2 border border-[#EBECEE] font-bold text-sm uppercase"
            data-testid="filter-toggle-btn"
          >
            <Filter size={18} />
            Фільтри
            {activeFiltersCount > 0 && (
              <span className="bg-[#FF3B30] text-white w-5 h-5 flex items-center justify-center text-xs">
                {activeFiltersCount}
              </span>
            )}
          </button>

          {/* Sort */}
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-[180px] rounded-none border-[#EBECEE]" data-testid="sort-select">
              <SelectValue placeholder="Сортування" />
            </SelectTrigger>
            <SelectContent className="rounded-none">
              <SelectItem value="name">За назвою</SelectItem>
              <SelectItem value="price_asc">Спочатку дешевші</SelectItem>
              <SelectItem value="price_desc">Спочатку дорожчі</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-8">
        {/* Filters Sidebar */}
        <aside 
          className={`${showFilters ? 'block' : 'hidden'} md:block w-full md:w-64 flex-shrink-0`}
          data-testid="filters-sidebar"
        >
          <div className="filter-sidebar sticky top-24">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-bold uppercase tracking-wider text-sm">Фільтри</h3>
              {activeFiltersCount > 0 && (
                <button
                  onClick={clearFilters}
                  className="text-[#FF3B30] text-xs uppercase font-bold hover:underline"
                  data-testid="clear-filters-btn"
                >
                  Скинути
                </button>
              )}
            </div>

            {/* Search */}
            <div className="mb-6">
              <label className="label-industrial mb-2 block">Пошук</label>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Артикул або назва"
                className="w-full input-industrial"
                data-testid="filter-search-input"
              />
            </div>

            {/* Categories */}
            <div className="mb-6">
              <label className="label-industrial mb-3 block">Категорії</label>
              <div className="space-y-2">
                {categories.map((cat) => (
                  <label 
                    key={cat.id} 
                    className="flex items-center gap-3 cursor-pointer group"
                    data-testid={`category-filter-${cat.id}`}
                  >
                    <Checkbox
                      checked={selectedCategories.includes(cat.id)}
                      onCheckedChange={() => handleCategoryToggle(cat.id)}
                      className="rounded-none border-[#D1D3D8] data-[state=checked]:bg-[#0A0A0A] data-[state=checked]:border-[#0A0A0A]"
                    />
                    <span className="text-sm group-hover:text-[#FF3B30] transition-colors">
                      {cat.name}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {/* Price Range */}
            <div className="mb-6">
              <label className="label-industrial mb-3 block">Ціна (₴)</label>
              <div className="px-2">
                <Slider
                  min={500}
                  max={30000}
                  step={100}
                  value={priceRange}
                  onValueChange={setPriceRange}
                  className="mb-4"
                  data-testid="price-slider"
                />
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={priceRange[0]}
                  onChange={(e) => setPriceRange([Number(e.target.value), priceRange[1]])}
                  className="w-full input-industrial text-center"
                  min={500}
                  max={priceRange[1]}
                  data-testid="price-min-input"
                />
                <span className="text-[#474A51]">—</span>
                <input
                  type="number"
                  value={priceRange[1]}
                  onChange={(e) => setPriceRange([priceRange[0], Number(e.target.value)])}
                  className="w-full input-industrial text-center"
                  min={priceRange[0]}
                  max={30000}
                  data-testid="price-max-input"
                />
              </div>
            </div>

            {/* Apply Button (Mobile) */}
            <button
              onClick={() => setShowFilters(false)}
              className="md:hidden w-full btn-primary"
            >
              Застосувати
            </button>
          </div>
        </aside>

        {/* Products Grid */}
        <div className="flex-1">
          {/* Active Filters */}
          {(selectedCategories.length > 0 || searchQuery) && (
            <div className="flex flex-wrap gap-2 mb-6">
              {selectedCategories.map(catId => {
                const cat = categories.find(c => c.id === catId);
                return (
                  <span
                    key={catId}
                    className="flex items-center gap-1 bg-[#F7F7F8] border border-[#EBECEE] px-3 py-1 text-sm"
                  >
                    {cat?.name}
                    <button onClick={() => handleCategoryToggle(catId)}>
                      <X size={14} />
                    </button>
                  </span>
                );
              })}
              {searchQuery && (
                <span className="flex items-center gap-1 bg-[#F7F7F8] border border-[#EBECEE] px-3 py-1 text-sm">
                  Пошук: {searchQuery}
                  <button onClick={() => setSearchQuery('')}>
                    <X size={14} />
                  </button>
                </span>
              )}
            </div>
          )}

          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="animate-spin text-[#FF3B30]" size={40} />
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-20" data-testid="no-products">
              <p className="text-[#474A51] mb-4">Товари не знайдено</p>
              <Button onClick={clearFilters} className="btn-secondary">
                Скинути фільтри
              </Button>
            </div>
          ) : (
            <div className="product-grid" data-testid="products-grid">
              {products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
