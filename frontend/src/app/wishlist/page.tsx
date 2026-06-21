'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { useAuthStore } from '@/store/authStore';
import { wishlistAPI } from '@/lib/api';
import { formatPrice } from '@/lib/utils';
import { Product } from '@/types';
import toast from 'react-hot-toast';
import { FiHeart, FiTrash2, FiShoppingCart } from 'react-icons/fi';

export default function WishlistPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading } = useAuthStore();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) { router.push('/login'); return; }
    if (isAuthenticated) {
      wishlistAPI.get().then(({ data }) => setProducts(data.data?.products || []))
        .catch(() => {}).finally(() => setLoading(false));
    }
  }, [isAuthenticated, authLoading]);

  const handleRemove = async (productId: string) => {
    try {
      await wishlistAPI.remove(productId);
      setProducts((prev) => prev.filter((p) => p._id !== productId));
      toast.success('Removed from wishlist');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to remove');
    }
  };

  if (authLoading || !isAuthenticated) return null;

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 max-w-7xl mx-auto px-4 py-8 w-full">
        <h1 className="text-2xl font-bold mb-8">My Wishlist</h1>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
            {[1,2,3,4].map((i) => (
              <div key={i} className="card animate-pulse"><div className="aspect-square bg-gray-200" /><div className="p-4 space-y-2"><div className="h-4 bg-gray-200 rounded" /><div className="h-6 bg-gray-200 rounded w-1/3" /></div></div>
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-20">
            <FiHeart className="w-16 h-16 mx-auto text-gray-300 mb-4" />
            <h2 className="text-xl font-semibold mb-2">Your wishlist is empty</h2>
            <p className="text-gray-500 mb-6">Save your favorite items here.</p>
            <Link href="/products" className="btn-primary">Explore Products</Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
            {products.map((product) => {
              const variant = product.variants?.[0];
              const price = variant?.salePrice || variant?.price || 0;
              return (
                <div key={product._id} className="card group">
                  <Link href={`/products/${product.slug}`}>
                    <div className="aspect-square bg-gray-100 overflow-hidden">
                      {variant?.images?.[0] ? (
                        <img src={variant.images[0]} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400">No Image</div>
                      )}
                    </div>
                  </Link>
                  <div className="p-4">
                    <Link href={`/products/${product.slug}`} className="font-medium text-sm line-clamp-2 hover:text-primary-600">
                      {product.name}
                    </Link>
                    <p className="text-lg font-bold mt-1">{formatPrice(price)}</p>
                    <div className="flex gap-2 mt-3">
                      <button onClick={() => handleRemove(product._id)}
                        className="btn-secondary py-2 px-3 flex-1 flex items-center justify-center gap-1 text-sm">
                        <FiTrash2 className="w-4 h-4" /> Remove
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
