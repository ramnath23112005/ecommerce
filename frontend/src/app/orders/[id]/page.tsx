'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { useAuthStore } from '@/store/authStore';
import { orderAPI } from '@/lib/api';
import { formatPrice, formatDate } from '@/lib/utils';
import { Order } from '@/types';
import toast from 'react-hot-toast';
import { FiArrowLeft, FiMapPin, FiCreditCard } from 'react-icons/fi';

const statusFlow = ['pending', 'confirmed', 'processing', 'shipped', 'in_transit', 'out_for_delivery', 'delivered'];

export default function OrderDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading, user } = useAuthStore();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) { router.push('/login'); return; }
    if (isAuthenticated && id) {
      orderAPI.getById(id as string).then(({ data }) => setOrder(data.data))
        .catch(() => router.push('/orders'))
        .finally(() => setLoading(false));
    }
  }, [isAuthenticated, authLoading, id]);

  const handleCancel = async () => {
    if (!confirm('Are you sure you want to cancel this order?')) return;
    try {
      await orderAPI.cancel(id as string);
      toast.success('Order cancelled');
      setOrder((prev) => prev ? { ...prev, orderStatus: 'cancelled' } : prev);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to cancel');
    }
  };

  if (authLoading || !isAuthenticated) return null;

  if (loading) return (
    <div className="min-h-screen flex flex-col"><Navbar /><main className="flex-1 max-w-4xl mx-auto px-4 py-8 w-full animate-pulse space-y-4"><div className="h-8 bg-gray-200 rounded w-1/3" /><div className="h-64 bg-gray-200 rounded-xl" /></main><Footer /></div>
  );

  if (!order) return null;

  const currentStep = statusFlow.indexOf(order.orderStatus);

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 max-w-4xl mx-auto px-4 py-8 w-full">
        <Link href="/orders" className="flex items-center gap-2 text-gray-500 hover:text-gray-700 mb-6">
          <FiArrowLeft /> Back to Orders
        </Link>

        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold">Order #{order.orderNumber}</h1>
            <p className="text-gray-500">Placed on {formatDate(order.createdAt)}</p>
          </div>
          <div className="flex gap-3">
            {['pending', 'confirmed'].includes(order.orderStatus) && (
              <button onClick={handleCancel} className="btn-danger py-2 px-4 text-sm">Cancel Order</button>
            )}
          </div>
        </div>

        <div className="card p-6 mb-8">
          <div className="flex items-center justify-between mb-6">
            {statusFlow.map((status, i) => (
              <div key={status} className="flex items-center">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium ${i <= currentStep ? 'bg-primary-600 text-white' : 'bg-gray-200 text-gray-500'}`}>
                  {i + 1}
                </div>
                {i < statusFlow.length - 1 && (
                  <div className={`w-12 md:w-24 h-1 mx-1 ${i < currentStep ? 'bg-primary-600' : 'bg-gray-200'}`} />
                )}
              </div>
            ))}
          </div>
          <div className="flex justify-between text-xs md:text-sm">
            {statusFlow.map((s) => <span key={s} className="capitalize text-center">{s.replace('_', ' ')}</span>)}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="card p-4">
            <h3 className="font-semibold mb-2 flex items-center gap-2"><FiMapPin /> Shipping Address</h3>
            <p className="text-sm text-gray-600">{order.shippingAddress.street}</p>
            <p className="text-sm text-gray-600">{order.shippingAddress.city}, {order.shippingAddress.state} - {order.shippingAddress.zip}</p>
          </div>
          <div className="card p-4">
            <h3 className="font-semibold mb-2 flex items-center gap-2"><FiCreditCard /> Payment</h3>
            <p className="text-sm text-gray-600 capitalize">{order.paymentMethod}</p>
            <p className="text-sm text-gray-600">Status: <span className="capitalize font-medium">{order.paymentStatus}</span></p>
          </div>
          <div className="card p-4">
            <h3 className="font-semibold mb-2">Summary</h3>
            <div className="space-y-1 text-sm text-gray-600">
              <p>Subtotal: {formatPrice(order.subtotal)}</p>
              <p>Shipping: {order.shippingCost === 0 ? 'Free' : formatPrice(order.shippingCost)}</p>
              {order.discount > 0 && <p>Discount: -{formatPrice(order.discount)}</p>}
              <p className="font-bold text-gray-900">Total: {formatPrice(order.total)}</p>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Order Items</h2>
          {order.items.map((item, i) => (
            <div key={i} className="card p-4 flex items-center gap-4">
              <div className="w-20 h-20 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                {item.image ? <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                  : <div className="w-full h-full flex items-center justify-center text-gray-400">N/A</div>}
              </div>
              <div className="flex-1">
                <h4 className="font-medium">{item.name}</h4>
                <p className="text-sm text-gray-500">Qty: {item.quantity} x {formatPrice(item.price)}</p>
              </div>
              <p className="font-bold">{formatPrice(item.price * item.quantity)}</p>
            </div>
          ))}
        </div>
      </main>
      <Footer />
    </div>
  );
}
