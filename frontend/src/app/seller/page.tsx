'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { useAuthStore } from '@/store/authStore';
import { sellerAPI, productAPI } from '@/lib/api';
import { formatPrice } from '@/lib/utils';
import Link from 'next/link';
import { FiDollarSign, FiShoppingBag, FiPackage, FiPlus, FiTrendingUp } from 'react-icons/fi';

export default function SellerDashboard() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading: authLoading } = useAuthStore();
  const [analytics, setAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading) {
      if (!isAuthenticated || (user?.role !== 'seller' && user?.role !== 'admin')) { router.push('/'); return; }
      Promise.all([
        sellerAPI.getAnalytics(),
        productAPI.getAll({ seller: user?._id, limit: 5 }),
      ]).then(([analyticsData]) => {
        setAnalytics(analyticsData.data.data);
      }).catch(() => {}).finally(() => setLoading(false));
    }
  }, [isAuthenticated, authLoading, user]);

  if (authLoading || !isAuthenticated) return null;

  const cards = [
    { label: 'Total Revenue', value: analytics ? formatPrice(analytics.totalRevenue) : '--', icon: FiDollarSign, color: 'bg-green-500' },
    { label: 'Total Orders', value: analytics?.totalOrders ?? '--', icon: FiShoppingBag, color: 'bg-blue-500' },
    { label: 'Active Products', value: analytics?.activeProducts ?? '--', icon: FiPackage, color: 'bg-purple-500' },
    { label: 'All Products', value: analytics?.totalProducts ?? '--', icon: FiTrendingUp, color: 'bg-orange-500' },
  ];

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 max-w-7xl mx-auto px-4 py-8 w-full">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-bold">Seller Dashboard</h1>
          <Link href="/seller/products/new" className="btn-primary flex items-center gap-2">
            <FiPlus /> Add Product
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {cards.map(({ label, value, icon: Icon, color }) => (
            <div key={label} className="card p-6 flex items-center gap-4">
              <div className={`w-12 h-12 ${color} rounded-lg flex items-center justify-center`}>
                <Icon className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-sm text-gray-500">{label}</p>
                <p className="text-xl font-bold">{value}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="card p-6">
            <h2 className="font-semibold mb-4">Quick Actions</h2>
            <div className="space-y-3">
              <Link href="/seller/products" className="block p-3 bg-gray-50 rounded-lg hover:bg-primary-50 hover:text-primary-600 transition-colors text-sm font-medium">
                My Products
              </Link>
              <Link href="/seller/products/new" className="block p-3 bg-gray-50 rounded-lg hover:bg-primary-50 hover:text-primary-600 transition-colors text-sm font-medium">
                Add New Product
              </Link>
              <Link href="/orders" className="block p-3 bg-gray-50 rounded-lg hover:bg-primary-50 hover:text-primary-600 transition-colors text-sm font-medium">
                View Orders
              </Link>
            </div>
          </div>
          <div className="card p-6">
            <h2 className="font-semibold mb-4">Revenue</h2>
            {analytics?.revenueByPeriod?.length > 0 ? (
              <div className="space-y-2">
                {analytics.revenueByPeriod.slice(-7).map((d: any) => (
                  <div key={d.date} className="flex justify-between text-sm">
                    <span>{new Date(d.date).toLocaleDateString()}</span>
                    <span className="font-medium">{formatPrice(d.revenue)}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-sm">No sales data yet</p>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
