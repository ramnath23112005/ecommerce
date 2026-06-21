'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { useCartStore } from '@/store/cartStore';
import { useAuthStore } from '@/store/authStore';
import { formatPrice } from '@/lib/utils';
import toast from 'react-hot-toast';
import { FiMinus, FiPlus, FiTrash2, FiShoppingBag, FiArrowLeft } from 'react-icons/fi';

export default function CartPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading } = useAuthStore();
  const { cart, isLoading, fetchCart, updateItem, removeItem, applyCoupon, removeCoupon } = useCartStore();
  const [couponCode, setCouponCode] = useState('');
  const [couponLoading, setCouponLoading] = useState(false);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login');
      return;
    }
    if (isAuthenticated) fetchCart();
  }, [isAuthenticated, authLoading]);

  if (authLoading || !isAuthenticated) return null;

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) return;
    setCouponLoading(true);
    try {
      await applyCoupon(couponCode.trim());
      toast.success('Coupon applied!');
      setCouponCode('');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Invalid coupon');
    } finally {
      setCouponLoading(false);
    }
  };

  const subtotal = cart?.totalAmount || 0;
  const discount = cart?.discount || 0;
  const shipping = subtotal >= 500 ? 0 : 50;
  const total = Math.max(0, subtotal + shipping - discount);

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 max-w-7xl mx-auto px-4 py-8 w-full">
        <h1 className="text-2xl font-bold mb-8">Shopping Cart</h1>

        {isLoading ? (
          <div className="space-y-4">
            {[1,2,3].map((i) => (
              <div key={i} className="card p-4 animate-pulse flex gap-4">
                <div className="w-24 h-24 bg-gray-200 rounded-lg" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-3/4" />
                  <div className="h-4 bg-gray-200 rounded w-1/4" />
                </div>
              </div>
            ))}
          </div>
        ) : !cart?.items?.length ? (
          <div className="text-center py-20">
            <FiShoppingBag className="w-16 h-16 mx-auto text-gray-300 mb-4" />
            <h2 className="text-xl font-semibold mb-2">Your cart is empty</h2>
            <p className="text-gray-500 mb-6">Looks like you haven&apos;t added anything yet.</p>
            <Link href="/products" className="btn-primary inline-flex items-center gap-2">
              <FiArrowLeft /> Continue Shopping
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-4">
              {cart.items.map((item: any) => {
                const product = item.product;
                const variant = product?.variants?.find((v: any) => v._id === item.variant) || {};
                return (
                  <div key={item.variant} className="card p-4 flex gap-4">
                    <Link href={`/products/${product?.slug}`} className="w-24 h-24 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                      {variant?.images?.[0] ? (
                        <img src={variant.images[0]} alt={product?.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400">No Img</div>
                      )}
                    </Link>
                    <div className="flex-1 min-w-0">
                      <Link href={`/products/${product?.slug}`} className="font-medium hover:text-primary-600 line-clamp-1">
                        {product?.name || 'Product'}
                      </Link>
                      <p className="text-sm text-gray-500">
                        {variant?.size && `Size: ${variant.size}`}{variant?.size && variant?.color && ' | '}
                        {variant?.color && `Color: ${variant.color}`}
                      </p>
                      <p className="text-sm font-bold mt-1">{formatPrice(item.price)}</p>
                      <div className="flex items-center gap-3 mt-2">
                        <div className="flex items-center border rounded-lg">
                          <button onClick={() => updateItem(item.variant, Math.max(1, item.quantity - 1))}
                            className="p-1.5 hover:bg-gray-50"><FiMinus className="w-3 h-3" /></button>
                          <span className="px-3 text-sm font-medium">{item.quantity}</span>
                          <button onClick={() => updateItem(item.variant, item.quantity + 1)}
                            className="p-1.5 hover:bg-gray-50"><FiPlus className="w-3 h-3" /></button>
                        </div>
                        <button onClick={() => removeItem(item.variant)}
                          className="text-red-500 hover:text-red-700 p-1.5">
                          <FiTrash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold">{formatPrice(item.price * item.quantity)}</p>
                    </div>
                  </div>
                );
              })}
            </div>

            <div>
              <div className="card p-6 space-y-4">
                <div>
                  <h3 className="font-semibold mb-3">Apply Coupon</h3>
                  <div className="flex gap-2">
                    <input type="text" value={couponCode} onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                      placeholder="Enter coupon code" className="input-field py-2 text-sm flex-1" />
                    <button onClick={handleApplyCoupon} disabled={couponLoading}
                      className="btn-primary py-2 px-4 text-sm">Apply</button>
                  </div>
                  {cart.coupon && (
                    <div className="flex items-center justify-between mt-2 p-2 bg-green-50 rounded text-sm">
                      <span className="text-green-700 font-medium">{cart.coupon} applied</span>
                      <button onClick={() => { removeCoupon(); toast.success('Coupon removed'); }}
                        className="text-red-500 hover:text-red-700 text-xs">Remove</button>
                    </div>
                  )}
                </div>

                <div className="border-t pt-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Subtotal</span>
                    <span>{formatPrice(subtotal)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Shipping</span>
                    <span>{shipping === 0 ? <span className="text-green-600">Free</span> : formatPrice(shipping)}</span>
                  </div>
                  {discount > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Discount</span>
                      <span className="text-green-600">-{formatPrice(discount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between font-bold text-lg border-t pt-2">
                    <span>Total</span>
                    <span>{formatPrice(total)}</span>
                  </div>
                </div>

                <button onClick={() => router.push('/checkout')} className="btn-primary w-full">
                  Proceed to Checkout
                </button>
                <Link href="/products" className="block text-center text-sm text-primary-600 hover:underline">
                  Continue Shopping
                </Link>
              </div>
            </div>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
