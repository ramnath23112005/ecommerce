'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { useAuthStore } from '@/store/authStore';
import { adminAPI } from '@/lib/api';
import { formatPrice } from '@/lib/utils';
import { FiUsers, FiPackage, FiShoppingBag, FiDollarSign } from 'react-icons/fi';

export default function AdminDashboard() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading: authLoading } = useAuthStore();
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading) {
      if (!isAuthenticated || user?.role !== 'admin') { router.push('/'); return; }
      adminAPI.getDashboard().then(({ data }) => setStats(data.data)).catch(() => {})
        .finally(() => setLoading(false));
    }
  }, [isAuthenticated, authLoading, user]);

  if (authLoading || !isAuthenticated) return null;

  const cards = [
    { label: 'Total Revenue', value: stats ? formatPrice(stats.totalRevenue) : '--', icon: FiDollarSign, color: 'bg-green-500' },
    { label: 'Total Orders', value: stats?.totalOrders ?? '--', icon: FiShoppingBag, color: 'bg-blue-500' },
    { label: 'Total Products', value: stats?.totalProducts ?? '--', icon: FiPackage, color: 'bg-purple-500' },
    { label: 'Total Users', value: stats?.totalUsers ?? '--', icon: FiUsers, color: 'bg-orange-500' },
  ];

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 max-w-7xl mx-auto px-4 py-8 w-full">
        <h1 className="text-2xl font-bold mb-8">Admin Dashboard</h1>

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
            <h2 className="font-semibold mb-4">Quick Links</h2>
            <div className="space-y-3">
              <AdminLink href="/admin/users" label="Manage Users" />
              <AdminLink href="/admin/products" label="Manage Products" />
              <AdminLink href="/admin/orders" label="Manage Orders" />
              <AdminLink href="/admin/categories" label="Manage Categories" />
              <AdminLink href="/admin/coupons" label="Manage Coupons" />
              <AdminLink href="/admin/analytics" label="View Analytics" />
            </div>
          </div>
          <div className="card p-6">
            <h2 className="font-semibold mb-4">Recent Activity</h2>
            <p className="text-gray-500 text-sm">Analytics and activity tracking coming soon.</p>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}

function AdminLink({ href, label }: { href: string; label: string }) {
  return (
    <a href={href} className="block p-3 bg-gray-50 rounded-lg hover:bg-primary-50 hover:text-primary-600 transition-colors text-sm font-medium">
      {label}
    </a>
  );
}
