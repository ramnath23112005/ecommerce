'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { useAuthStore } from '@/store/authStore';
import { orderAPI } from '@/lib/api';
import { formatPrice, formatDate } from '@/lib/utils';
import { Order } from '@/types';
import { FiPackage, FiChevronRight } from 'react-icons/fi';

const statusColors: Record<string, string> = {
  pending: 'badge-warning',
  confirmed: 'badge-info',
  processing: 'badge-info',
  shipped: 'badge-info',
  delivered: 'badge-success',
  cancelled: 'badge-danger',
};

export default function OrdersPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading } = useAuthStore();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) { router.push('/login'); return; }
    if (isAuthenticated) {
      orderAPI.getMyOrders().then(({ data }) => setOrders(data.data)).catch(() => {})
        .finally(() => setLoading(false));
    }
  }, [isAuthenticated, authLoading]);

  if (authLoading || !isAuthenticated) return null;

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 max-w-7xl mx-auto px-4 py-8 w-full">
        <h1 className="text-2xl font-bold mb-8">My Orders</h1>

        {loading ? (
          <div className="space-y-4">
            {[1,2,3].map((i) => (
              <div key={i} className="card p-6 animate-pulse"><div className="h-6 bg-gray-200 rounded w-1/3" /></div>
            ))}
          </div>
        ) : orders.length === 0 ? (
          <div className="text-center py-20">
            <FiPackage className="w-16 h-16 mx-auto text-gray-300 mb-4" />
            <h2 className="text-xl font-semibold mb-2">No orders yet</h2>
            <p className="text-gray-500 mb-6">Start shopping to see your orders here.</p>
            <Link href="/products" className="btn-primary">Browse Products</Link>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => (
              <Link key={order._id} href={`/orders/${order._id}`} className="card p-6 block hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-sm text-gray-500">Order #{order.orderNumber}</p>
                    <p className="text-xs text-gray-400">{formatDate(order.createdAt)}</p>
                  </div>
                  <span className={statusColors[order.orderStatus] || 'badge'}>{order.orderStatus}</span>
                </div>
                <div className="flex items-center gap-4 overflow-x-auto">
                  {order.items.slice(0, 5).map((item, i) => (
                    <div key={i} className="w-16 h-16 bg-gray-100 rounded-lg flex-shrink-0 overflow-hidden">
                      {item.image ? <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                        : <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">N/A</div>}
                    </div>
                  ))}
                </div>
                <div className="flex items-center justify-between mt-4">
                  <span className="font-bold">{formatPrice(order.total)}</span>
                  <span className="flex items-center text-sm text-primary-600">View Details <FiChevronRight className="ml-1" /></span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
