'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { useAuthStore } from '@/store/authStore';
import toast from 'react-hot-toast';
import { FiUser, FiMail, FiPhone, FiMapPin } from 'react-icons/fi';

export default function ProfilePage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading: authLoading, updateProfile } = useAuthStore();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState({ street: '', city: '', state: '', zip: '', country: 'IN' });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) { router.push('/login'); return; }
    if (user) {
      setName(user.name || '');
      setPhone(user.phone || '');
      if (user.address) setAddress(user.address);
    }
  }, [isAuthenticated, authLoading, user]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateProfile({ name, phone, address });
      toast.success('Profile updated!');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to update');
    } finally {
      setSaving(false);
    }
  };

  if (authLoading || !isAuthenticated || !user) return null;

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 max-w-2xl mx-auto px-4 py-8 w-full">
        <h1 className="text-2xl font-bold mb-8">My Profile</h1>

        <div className="card p-8 space-y-6">
          <div className="flex items-center gap-4 pb-6 border-b">
            <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center">
              {user.avatar ? (
                <img src={user.avatar} alt={user.name} className="w-16 h-16 rounded-full object-cover" />
              ) : (
                <FiUser className="w-8 h-8 text-primary-600" />
              )}
            </div>
            <div>
              <h2 className="text-xl font-semibold">{user.name}</h2>
              <p className="text-gray-500">{user.email}</p>
              <span className="badge-info capitalize">{user.role}</span>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Full Name</label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="input-field" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1 flex items-center gap-2"><FiMail /> Email</label>
            <input type="email" value={user.email} disabled className="input-field bg-gray-50" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1 flex items-center gap-2"><FiPhone /> Phone</label>
            <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} className="input-field" />
          </div>

          <div className="border-t pt-6">
            <h3 className="font-semibold mb-4 flex items-center gap-2"><FiMapPin /> Address</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <input type="text" value={address.street} onChange={(e) => setAddress({ ...address, street: e.target.value })}
                  className="input-field" placeholder="Street Address" />
              </div>
              <div>
                <input type="text" value={address.city} onChange={(e) => setAddress({ ...address, city: e.target.value })}
                  className="input-field" placeholder="City" />
              </div>
              <div>
                <input type="text" value={address.state} onChange={(e) => setAddress({ ...address, state: e.target.value })}
                  className="input-field" placeholder="State" />
              </div>
              <div>
                <input type="text" value={address.zip} onChange={(e) => setAddress({ ...address, zip: e.target.value })}
                  className="input-field" placeholder="ZIP Code" />
              </div>
              <div>
                <input type="text" value={address.country} onChange={(e) => setAddress({ ...address, country: e.target.value })}
                  className="input-field" placeholder="Country" />
              </div>
            </div>
          </div>

          <button onClick={handleSave} disabled={saving} className="btn-primary w-full">
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </main>
      <Footer />
    </div>
  );
}
