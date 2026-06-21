'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { productAPI, categoryAPI } from '@/lib/api';
import { formatPrice, classNames } from '@/lib/utils';
import { Product, Category, Pagination } from '@/types';
import { FiFilter, FiGrid, FiList, FiStar, FiChevronLeft, FiChevronRight } from 'react-icons/fi';

export default function ProductsPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
      <ProductsContent />
    </Suspense>
  );
}

function ProductsContent() {
  const searchParams = useSearchParams();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showFilters, setShowFilters] = useState(false);

  const [filters, setFilters] = useState({
    category: searchParams.get('category') || '',
    minPrice: '',
    maxPrice: '',
    sort: '-createdAt',
    page: 1,
  });

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const params: any = { page: filters.page, limit: 20, sort: filters.sort };
      if (filters.category) params.category = filters.category;
      if (filters.minPrice) params['price[gte]'] = filters.minPrice;
      if (filters.maxPrice) params['price[lte]'] = filters.maxPrice;

      const { data } = await productAPI.getAll(params);
      setProducts(data.data);
      setPagination(data.pagination);
    } catch {
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    categoryAPI.getAll().then(({ data }) => setCategories(data.data)).catch(() => {});
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [filters]);

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 max-w-7xl mx-auto px-4 py-8 w-full">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">Products</h1>
          <div className="flex items-center gap-3">
            <button onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 btn-secondary text-sm py-2 px-3 lg:hidden">
              <FiFilter /> Filters
            </button>
            <div className="hidden sm:flex border rounded-lg">
              <button onClick={() => setViewMode('grid')}
                className={classNames('p-2', viewMode === 'grid' ? 'bg-primary-50 text-primary-600' : 'text-gray-400')}>
                <FiGrid />
              </button>
              <button onClick={() => setViewMode('list')}
                className={classNames('p-2', viewMode === 'list' ? 'bg-primary-50 text-primary-600' : 'text-gray-400')}>
                <FiList />
              </button>
            </div>
            <select value={filters.sort} onChange={(e) => setFilters({ ...filters, sort: e.target.value, page: 1 })}
              className="input-field py-2 w-auto text-sm">
              <option value="-createdAt">Newest</option>
              <option value="-averageRating">Top Rated</option>
              <option value="variants.price">Price: Low to High</option>
              <option value="-variants.price">Price: High to Low</option>
            </select>
          </div>
        </div>

        <div className="flex gap-8">
          <aside className={classNames('w-64 flex-shrink-0', showFilters ? 'block' : 'hidden lg:block')}>
            <div className="card p-4 space-y-6">
              <div>
                <h3 className="font-semibold mb-3">Categories</h3>
                <div className="space-y-2">
                  <button onClick={() => setFilters({ ...filters, category: '', page: 1 })}
                    className={classNames('block w-full text-left text-sm py-1 px-2 rounded', !filters.category ? 'bg-primary-50 text-primary-600' : 'hover:bg-gray-50')}>
                    All Categories
                  </button>
                  {categories.map((cat) => (
                    <button key={cat._id} onClick={() => setFilters({ ...filters, category: cat.slug, page: 1 })}
                      className={classNames('block w-full text-left text-sm py-1 px-2 rounded', filters.category === cat.slug ? 'bg-primary-50 text-primary-600' : 'hover:bg-gray-50')}>
                      {cat.name}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <h3 className="font-semibold mb-3">Price Range</h3>
                <div className="flex gap-2">
                  <input type="number" placeholder="Min" value={filters.minPrice}
                    onChange={(e) => setFilters({ ...filters, minPrice: e.target.value, page: 1 })}
                    className="input-field py-2 text-sm" />
                  <input type="number" placeholder="Max" value={filters.maxPrice}
                    onChange={(e) => setFilters({ ...filters, maxPrice: e.target.value, page: 1 })}
                    className="input-field py-2 text-sm" />
                </div>
              </div>
            </div>
          </aside>

          <div className="flex-1">
            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                {[1,2,3,4,5,6].map((i) => (
                  <div key={i} className="card animate-pulse">
                    <div className="aspect-square bg-gray-200" />
                    <div className="p-4 space-y-2">
                      <div className="h-4 bg-gray-200 rounded w-3/4" />
                      <div className="h-4 bg-gray-200 rounded w-1/2" />
                      <div className="h-6 bg-gray-200 rounded w-1/3" />
                    </div>
                  </div>
                ))}
              </div>
            ) : products.length === 0 ? (
              <div className="text-center py-20">
                <p className="text-gray-500">No products found</p>
              </div>
            ) : (
              <div className={classNames(viewMode === 'grid' ? 'grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6' : 'space-y-4')}>
                {products.map((product) => (
                  <ProductListItem key={product._id} product={product} listMode={viewMode === 'list'} />
                ))}
              </div>
            )}

            {pagination && pagination.totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-8">
                <button disabled={!pagination.hasNextPage}
                  onClick={() => setFilters({ ...filters, page: filters.page - 1 })}
                  className="btn-secondary py-2 px-3 disabled:opacity-50">
                  <FiChevronLeft />
                </button>
                {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map((p) => (
                  <button key={p} onClick={() => setFilters({ ...filters, page: p })}
                    className={classNames('w-10 h-10 rounded-lg text-sm font-medium',
                      p === filters.page ? 'bg-primary-600 text-white' : 'btn-secondary')}>
                    {p}
                  </button>
                ))}
                <button disabled={!pagination.hasNextPage}
                  onClick={() => setFilters({ ...filters, page: filters.page + 1 })}
                  className="btn-secondary py-2 px-3 disabled:opacity-50">
                  <FiChevronRight />
                </button>
              </div>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}

function ProductListItem({ product, listMode }: { product: Product; listMode: boolean }) {
  const variant = product.variants.find((v) => v.isActive) || product.variants[0];
  const price = variant?.salePrice || variant?.price || 0;
  const originalPrice = variant?.salePrice ? variant.price : undefined;

  if (listMode) {
    return (
      <Link href={`/products/${product.slug}`} className="card flex gap-4 p-4 hover:shadow-md transition-shadow">
        <div className="w-32 h-32 bg-gray-100 rounded-lg flex-shrink-0 overflow-hidden">
          {variant?.images?.[0] && <img src={variant.images[0]} alt={product.name} className="w-full h-full object-cover" />}
        </div>
        <div className="flex-1">
          <h3 className="font-medium hover:text-primary-600">{product.name}</h3>
          <p className="text-sm text-gray-500 mt-1 line-clamp-2">{product.description}</p>
          <div className="flex items-center gap-2 mt-2">
            <span className="text-lg font-bold">{formatPrice(price)}</span>
            {originalPrice && <span className="text-sm text-gray-400 line-through">{formatPrice(originalPrice)}</span>}
          </div>
        </div>
      </Link>
    );
  }

  return (
    <Link href={`/products/${product.slug}`} className="card group">
      <div className="aspect-square bg-gray-100 overflow-hidden">
        {variant?.images?.[0] ? (
          <img src={variant.images[0]} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-400">No Image</div>
        )}
      </div>
      <div className="p-4">
        <p className="text-xs text-gray-500 uppercase mb-1">{product.brand || product.category?.name}</p>
        <h3 className="font-medium text-sm mb-1 line-clamp-2 group-hover:text-primary-600">{product.name}</h3>
        <div className="flex items-center gap-1 mb-2">
          <FiStar className="w-4 h-4 text-yellow-400 fill-current" />
          <span className="text-sm font-medium">{product.averageRating.toFixed(1)}</span>
          <span className="text-xs text-gray-500">({product.numReviews})</span>
        </div>
        <span className="text-lg font-bold">{formatPrice(price)}</span>
        {originalPrice && <span className="text-sm text-gray-400 line-through ml-2">{formatPrice(originalPrice)}</span>}
      </div>
    </Link>
  );
}

