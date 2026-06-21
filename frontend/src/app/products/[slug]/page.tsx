'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { productAPI, reviewAPI, cartAPI, wishlistAPI } from '@/lib/api';
import { formatPrice, getDiscountPercentage, formatDate } from '@/lib/utils';
import { Product, Review } from '@/types';
import { useAuthStore } from '@/store/authStore';
import toast from 'react-hot-toast';
import { FiStar, FiShoppingCart, FiHeart, FiMinus, FiPlus, FiTruck, FiShield, FiRefreshCw } from 'react-icons/fi';

export default function ProductDetailPage() {
  const { slug } = useParams();
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();
  const [product, setProduct] = useState<Product | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [selectedVariant, setSelectedVariant] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(0);

  useEffect(() => {
    if (!slug) return;
    Promise.all([
      productAPI.getBySlug(slug as string),
      reviewAPI.getByProduct(slug as string),
    ]).then(([prod, rev]) => {
      setProduct(prod.data.data);
      setReviews(rev.data.data);
    }).catch(() => router.push('/products'))
    .finally(() => setLoading(false));
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <div className="flex-1 max-w-7xl mx-auto px-4 py-8 w-full">
          <div className="animate-pulse grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="aspect-square bg-gray-200 rounded-xl" />
            <div className="space-y-4">
              <div className="h-8 bg-gray-200 rounded w-3/4" />
              <div className="h-4 bg-gray-200 rounded w-1/4" />
              <div className="h-6 bg-gray-200 rounded w-1/3" />
              <div className="h-32 bg-gray-200 rounded" />
            </div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (!product) return null;

  const variant = product.variants[selectedVariant];
  const price = variant?.salePrice || variant?.price || 0;
  const originalPrice = variant?.salePrice ? variant.price : undefined;
  const discount = originalPrice ? getDiscountPercentage(originalPrice, price) : 0;

  const handleAddToCart = async () => {
    if (!isAuthenticated) return router.push('/login');
    try {
      await cartAPI.addItem({ productId: product._id, variantId: variant._id, quantity });
      toast.success('Added to cart!');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to add');
    }
  };

  const handleAddToWishlist = async () => {
    if (!isAuthenticated) return router.push('/login');
    try {
      await wishlistAPI.add(product._id);
      toast.success('Added to wishlist!');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed');
    }
  };

  const sizes = [...new Set(product.variants.filter((v) => v.size).map((v) => v.size))];
  const colors = [...new Set(product.variants.filter((v) => v.color).map((v) => v.color))];

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 max-w-7xl mx-auto px-4 py-8 w-full">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div>
            <div className="aspect-square bg-gray-100 rounded-xl overflow-hidden mb-4">
              {variant?.images?.[selectedImage] ? (
                <img src={variant.images[selectedImage]} alt={product.name}
                  className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-400">No Image</div>
              )}
            </div>
            {variant?.images && variant.images.length > 1 && (
              <div className="flex gap-2 overflow-x-auto">
                {variant.images.map((img, i) => (
                  <button key={i} onClick={() => setSelectedImage(i)}
                    className={`w-20 h-20 rounded-lg overflow-hidden border-2 flex-shrink-0 ${i === selectedImage ? 'border-primary-600' : 'border-gray-200'}`}>
                    <img src={img} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          <div>
            <p className="text-sm text-gray-500 uppercase mb-1">{product.brand || product.category?.name}</p>
            <h1 className="text-3xl font-bold mb-3">{product.name}</h1>

            <div className="flex items-center gap-2 mb-4">
              <div className="flex items-center">
                {[1,2,3,4,5].map((star) => (
                  <FiStar key={star} className={`w-5 h-5 ${star <= Math.round(product.averageRating) ? 'text-yellow-400 fill-current' : 'text-gray-300'}`} />
                ))}
              </div>
              <span className="text-sm font-medium">{product.averageRating.toFixed(1)}</span>
              <span className="text-sm text-gray-500">({product.numReviews} reviews)</span>
            </div>

            <div className="flex items-baseline gap-3 mb-6">
              <span className="text-3xl font-bold">{formatPrice(price)}</span>
              {originalPrice && (
                <>
                  <span className="text-xl text-gray-400 line-through">{formatPrice(originalPrice)}</span>
                  <span className="badge-success">{discount}% OFF</span>
                </>
              )}
            </div>

            {sizes.length > 0 && (
              <div className="mb-4">
                <label className="block text-sm font-medium mb-2">Size</label>
                <div className="flex gap-2">
                  {sizes.map((size) => {
                    const matchingIdx = product.variants.findIndex((v) => v.size === size && (!colors.length || v.color === colors[0]));
                    return (
                      <button key={size} onClick={() => setSelectedVariant(matchingIdx >= 0 ? matchingIdx : selectedVariant)}
                        className={`px-4 py-2 border rounded-lg text-sm font-medium ${product.variants[selectedVariant]?.size === size ? 'border-primary-600 bg-primary-50 text-primary-600' : 'hover:border-gray-400'}`}>
                        {size}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {colors.length > 0 && (
              <div className="mb-4">
                <label className="block text-sm font-medium mb-2">Color</label>
                <div className="flex gap-2">
                  {colors.map((color) => {
                    const matchingIdx = product.variants.findIndex((v) => v.color === color && (!sizes.length || v.size === sizes[0]));
                    return (
                      <button key={color} onClick={() => setSelectedVariant(matchingIdx >= 0 ? matchingIdx : selectedVariant)}
                        className={`px-4 py-2 border rounded-lg text-sm font-medium ${product.variants[selectedVariant]?.color === color ? 'border-primary-600 bg-primary-50 text-primary-600' : 'hover:border-gray-400'}`}>
                        {color}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="flex items-center gap-4 mb-6">
              <div className="flex items-center border rounded-lg">
                <button onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="p-3 hover:bg-gray-50"><FiMinus className="w-4 h-4" /></button>
                <span className="px-4 font-medium">{quantity}</span>
                <button onClick={() => setQuantity(Math.min(variant?.stock || 1, quantity + 1))}
                  className="p-3 hover:bg-gray-50"><FiPlus className="w-4 h-4" /></button>
              </div>
              <span className="text-sm text-gray-500">{variant?.stock} units available</span>
            </div>

            <div className="flex gap-3 mb-8">
              <button onClick={handleAddToCart} disabled={!variant?.stock}
                className="btn-primary flex-1 flex items-center justify-center gap-2">
                <FiShoppingCart /> Add to Cart
              </button>
              <button onClick={handleAddToWishlist} className="btn-secondary px-4">
                <FiHeart className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-3 gap-4 p-4 bg-gray-50 rounded-xl mb-6">
              <div className="text-center">
                <FiTruck className="w-6 h-6 mx-auto text-primary-600 mb-1" />
                <p className="text-xs font-medium">Free Shipping</p>
                <p className="text-xs text-gray-500">On orders above ₹500</p>
              </div>
              <div className="text-center">
                <FiShield className="w-6 h-6 mx-auto text-primary-600 mb-1" />
                <p className="text-xs font-medium">Secure</p>
                <p className="text-xs text-gray-500">100% secure checkout</p>
              </div>
              <div className="text-center">
                <FiRefreshCw className="w-6 h-6 mx-auto text-primary-600 mb-1" />
                <p className="text-xs font-medium">Easy Returns</p>
                <p className="text-xs text-gray-500">30-day return policy</p>
              </div>
            </div>

            <div className="prose prose-sm max-w-none">
              <h3 className="font-semibold mb-2">Description</h3>
              <p className="text-gray-600 whitespace-pre-wrap">{product.description}</p>
            </div>

            {Object.keys(product.attributes).length > 0 && (
              <div className="mt-6">
                <h3 className="font-semibold mb-3">Specifications</h3>
                <div className="border rounded-lg divide-y">
                  {Object.entries(product.attributes).map(([key, val]) => (
                    <div key={key} className="flex px-4 py-2.5 text-sm">
                      <span className="w-1/3 text-gray-500 capitalize">{key}</span>
                      <span className="w-2/3 font-medium">{val}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        <section className="mt-16">
          <h2 className="text-2xl font-bold mb-6">Customer Reviews</h2>
          {reviews.length === 0 ? (
            <p className="text-gray-500">No reviews yet. Be the first to review!</p>
          ) : (
            <div className="space-y-4">
              {reviews.map((review) => (
                <div key={review._id} className="card p-6">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="font-semibold text-primary-600 text-sm">
                        {review.user?.name?.[0] || 'U'}
                      </span>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium">{review.user?.name}</span>
                        {review.isVerifiedPurchase && (
                          <span className="badge-success text-xs">Verified Purchase</span>
                        )}
                      </div>
                      <div className="flex items-center gap-1 mb-2">
                        {[1,2,3,4,5].map((star) => (
                          <FiStar key={star} className={`w-4 h-4 ${star <= review.rating ? 'text-yellow-400 fill-current' : 'text-gray-300'}`} />
                        ))}
                      </div>
                      <h4 className="font-medium mb-1">{review.title}</h4>
                      <p className="text-gray-600 text-sm">{review.comment}</p>
                      <p className="text-xs text-gray-400 mt-2">{formatDate(review.createdAt)}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>
      <Footer />
    </div>
  );
}
