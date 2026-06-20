'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { productAPI, categoryAPI } from '@/lib/api';
import { formatPrice } from '@/lib/utils';
import { Product, Category } from '@/types';
import { FiStar, FiArrowRight, FiTruck, FiShield, FiRefreshCw, FiHeadphones } from 'react-icons/fi';

export default function HomePage() {
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [topRated, setTopRated] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);

  useEffect(() => {
    Promise.all([
      productAPI.featured(),
      productAPI.topRated(),
      categoryAPI.getAll(),
    ]).then(([feat, top, cats]) => {
      setFeaturedProducts(feat.data.data);
      setTopRated(top.data.data);
      setCategories(cats.data.data);
    }).catch(() => {});
  }, []);

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1">
        <section className="bg-gradient-to-br from-primary-600 to-primary-800 text-white">
          <div className="max-w-7xl mx-auto px-4 py-20">
            <div className="max-w-2xl">
              <h1 className="text-5xl font-bold mb-6">Discover Quality Products</h1>
              <p className="text-xl mb-8 text-primary-100">Shop the latest trends with exclusive deals and fast delivery.</p>
              <Link href="/products" className="inline-flex items-center gap-2 bg-white text-primary-600 px-8 py-3 rounded-lg font-semibold hover:bg-primary-50 transition-colors">
                Shop Now <FiArrowRight />
              </Link>
            </div>
          </div>
        </section>

        <section className="py-12 bg-white border-b">
          <div className="max-w-7xl mx-auto px-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {[
                { icon: FiTruck, title: 'Free Shipping', desc: 'On orders above ₹500' },
                { icon: FiShield, title: 'Secure Payment', desc: '100% secure checkout' },
                { icon: FiRefreshCw, title: 'Easy Returns', desc: '30-day return policy' },
                { icon: FiHeadphones, title: '24/7 Support', desc: 'Dedicated support team' },
              ].map(({ icon: Icon, title, desc }) => (
                <div key={title} className="text-center p-4">
                  <Icon className="w-10 h-10 mx-auto text-primary-600 mb-3" />
                  <h3 className="font-semibold">{title}</h3>
                  <p className="text-sm text-gray-500">{desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {categories.length > 0 && (
          <section className="py-12">
            <div className="max-w-7xl mx-auto px-4">
              <h2 className="text-2xl font-bold mb-8">Shop by Category</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {categories.map((cat) => (
                  <Link key={cat._id} href={`/products?category=${cat.slug}`}
                    className="card p-6 text-center hover:shadow-md transition-shadow group">
                    <h3 className="font-semibold group-hover:text-primary-600">{cat.name}</h3>
                    {cat.description && <p className="text-sm text-gray-500 mt-1">{cat.description}</p>}
                  </Link>
                ))}
              </div>
            </div>
          </section>
        )}

        {featuredProducts.length > 0 && (
          <section className="py-12 bg-white">
            <div className="max-w-7xl mx-auto px-4">
              <div className="flex justify-between items-center mb-8">
                <h2 className="text-2xl font-bold">Featured Products</h2>
                <Link href="/products" className="text-primary-600 hover:underline">View All</Link>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
                {featuredProducts.map((product) => (
                  <ProductCard key={product._id} product={product} />
                ))}
              </div>
            </div>
          </section>
        )}

        {topRated.length > 0 && (
          <section className="py-12">
            <div className="max-w-7xl mx-auto px-4">
              <h2 className="text-2xl font-bold mb-8">Top Rated Products</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
                {topRated.map((product) => (
                  <ProductCard key={product._id} product={product} />
                ))}
              </div>
            </div>
          </section>
        )}
      </main>
      <Footer />
    </div>
  );
}

function ProductCard({ product }: { product: Product }) {
  const primaryVariant = product.variants.find((v) => v.isActive) || product.variants[0];
  const price = primaryVariant?.salePrice || primaryVariant?.price || 0;
  const originalPrice = primaryVariant?.salePrice ? primaryVariant.price : undefined;

  return (
    <Link href={`/products/${product.slug}`} className="card group">
      <div className="aspect-square bg-gray-100 relative overflow-hidden">
        {primaryVariant?.images?.[0] ? (
          <img src={primaryVariant.images[0]} alt={product.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-400">No Image</div>
        )}
      </div>
      <div className="p-4">
        <p className="text-xs text-gray-500 uppercase mb-1">{product.brand || product.category?.name}</p>
        <h3 className="font-medium text-sm mb-2 line-clamp-2 group-hover:text-primary-600">{product.name}</h3>
        <div className="flex items-center gap-1 mb-2">
          <FiStar className="w-4 h-4 text-yellow-400 fill-current" />
          <span className="text-sm font-medium">{product.averageRating.toFixed(1)}</span>
          <span className="text-xs text-gray-500">({product.numReviews})</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-lg font-bold">{formatPrice(price)}</span>
          {originalPrice && (
            <span className="text-sm text-gray-400 line-through">{formatPrice(originalPrice)}</span>
          )}
        </div>
      </div>
    </Link>
  );
}
