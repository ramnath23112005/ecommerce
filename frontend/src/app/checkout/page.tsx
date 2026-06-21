'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { useCartStore } from '@/store/cartStore';
import { useAuthStore } from '@/store/authStore';
import { orderAPI, paymentAPI } from '@/lib/api';
import { formatPrice } from '@/lib/utils';
import toast from 'react-hot-toast';

export default function CheckoutPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading } = useAuthStore();
  const { cart, fetchCart } = useCartStore();
  const [loading, setLoading] = useState(false);
  const [address, setAddress] = useState({ street: '', city: '', state: '', zip: '', country: 'IN' });
  const [paymentMethod, setPaymentMethod] = useState('cod');

  useEffect(() => {
    if (!authLoading && !isAuthenticated) { router.push('/login'); return; }
    if (isAuthenticated) fetchCart();
  }, [isAuthenticated, authLoading]);

  const handlePlaceOrder = async () => {
    if (!cart?.items?.length) return;
    if (!address.street || !address.city || !address.state || !address.zip) {
      return toast.error('Please fill in all address fields');
    }

    setLoading(true);
    try {
      const { data } = await orderAPI.create({
        items: cart.items.map((i: any) => ({
          product: i.product._id,
          variant: i.variant,
          quantity: i.quantity,
        })),
        shippingAddress: address,
        billingAddress: address,
        paymentMethod,
        couponCode: cart.coupon,
      });

      const order = data.data;

      if (paymentMethod === 'cod') {
        toast.success('Order placed successfully!');
        router.push(`/orders/${order._id}`);
        return;
      }

      const { data: paymentData } = await paymentAPI.createIntent({
        orderId: order._id,
        method: paymentMethod,
      });

      if (paymentMethod === 'stripe' && (window as any).Stripe) {
        const stripe = (window as any).Stripe(process.env.NEXT_PUBLIC_STRIPE_KEY);
        const { error } = await stripe.confirmCardPayment(paymentData.data.clientSecret);
        if (error) {
          toast.error(error.message);
        } else {
          toast.success('Payment successful!');
          router.push(`/orders/${order._id}`);
        }
      } else if (paymentMethod === 'razorpay' && (window as any).Razorpay) {
        const options = {
          key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
          amount: paymentData.data.amount,
          currency: paymentData.data.currency,
          name: 'ShopHub',
          order_id: paymentData.data.orderId,
          handler: async (response: any) => {
            try {
              await paymentAPI.verifyRazorpay({
                orderId: order._id,
                razorpayPaymentId: response.razorpay_payment_id,
                razorpayOrderId: response.razorpay_order_id,
                signature: response.razorpay_signature,
              });
              toast.success('Payment successful!');
              router.push(`/orders/${order._id}`);
            } catch {
              toast.error('Payment verification failed');
            }
          },
          modal: { ondismiss: () => setLoading(false) },
        };
        const rzp = new (window as any).Razorpay(options);
        rzp.open();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to place order');
    } finally {
      setLoading(false);
    }
  };

  if (authLoading || !isAuthenticated) return null;

  const subtotal = cart?.totalAmount || 0;
  const discount = cart?.discount || 0;
  const shipping = subtotal >= 500 ? 0 : 50;
  const total = Math.max(0, subtotal + shipping - discount);

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 max-w-7xl mx-auto px-4 py-8 w-full">
        <h1 className="text-2xl font-bold mb-8">Checkout</h1>

        {!cart?.items?.length ? (
          <div className="text-center py-20">
            <p className="text-gray-500">Your cart is empty</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              <div className="card p-6">
                <h2 className="text-lg font-semibold mb-4">Shipping Address</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="sm:col-span-2">
                    <label className="block text-sm font-medium mb-1">Street Address</label>
                    <input type="text" value={address.street} onChange={(e) => setAddress({ ...address, street: e.target.value })}
                      className="input-field" placeholder="123 Main St" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">City</label>
                    <input type="text" value={address.city} onChange={(e) => setAddress({ ...address, city: e.target.value })}
                      className="input-field" placeholder="Mumbai" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">State</label>
                    <input type="text" value={address.state} onChange={(e) => setAddress({ ...address, state: e.target.value })}
                      className="input-field" placeholder="Maharashtra" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">ZIP Code</label>
                    <input type="text" value={address.zip} onChange={(e) => setAddress({ ...address, zip: e.target.value })}
                      className="input-field" placeholder="400001" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Country</label>
                    <input type="text" value={address.country} onChange={(e) => setAddress({ ...address, country: e.target.value })}
                      className="input-field" placeholder="IN" />
                  </div>
                </div>
              </div>

              <div className="card p-6">
                <h2 className="text-lg font-semibold mb-4">Payment Method</h2>
                <div className="space-y-3">
                  {[
                    { value: 'cod', label: 'Cash on Delivery', desc: 'Pay when you receive' },
                    { value: 'stripe', label: 'Stripe', desc: 'Pay with credit/debit card' },
                    { value: 'razorpay', label: 'Razorpay', desc: 'UPI, Net Banking, Cards' },
                  ].map((method) => (
                    <label key={method.value} className={`flex items-center gap-3 p-4 border rounded-lg cursor-pointer ${paymentMethod === method.value ? 'border-primary-600 bg-primary-50' : 'hover:bg-gray-50'}`}>
                      <input type="radio" name="payment" value={method.value} checked={paymentMethod === method.value}
                        onChange={(e) => setPaymentMethod(e.target.value)} className="text-primary-600" />
                      <div>
                        <p className="font-medium">{method.label}</p>
                        <p className="text-sm text-gray-500">{method.desc}</p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            <div>
              <div className="card p-6 space-y-4">
                <h2 className="text-lg font-semibold">Order Summary</h2>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {cart.items.map((item: any) => (
                    <div key={item.variant} className="flex justify-between text-sm">
                      <span className="truncate">{item.product?.name} x{item.quantity}</span>
                      <span className="font-medium">{formatPrice(item.price * item.quantity)}</span>
                    </div>
                  ))}
                </div>
                <div className="border-t pt-4 space-y-2">
                  <div className="flex justify-between text-sm"><span className="text-gray-500">Subtotal</span><span>{formatPrice(subtotal)}</span></div>
                  <div className="flex justify-between text-sm"><span className="text-gray-500">Shipping</span><span>{shipping === 0 ? <span className="text-green-600">Free</span> : formatPrice(shipping)}</span></div>
                  {discount > 0 && <div className="flex justify-between text-sm"><span className="text-gray-500">Discount</span><span className="text-green-600">-{formatPrice(discount)}</span></div>}
                  <div className="flex justify-between font-bold text-lg border-t pt-2"><span>Total</span><span>{formatPrice(total)}</span></div>
                </div>
                <button onClick={handlePlaceOrder} disabled={loading} className="btn-primary w-full">
                  {loading ? 'Processing...' : `Place Order - ${formatPrice(total)}`}
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
