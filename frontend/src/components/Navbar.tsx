'use client';

import Link from 'next/link';
import { useAuthStore } from '@/store/authStore';
import { FiShoppingCart, FiHeart, FiUser, FiLogOut, FiPackage, FiSearch } from 'react-icons/fi';

export default function Navbar() {
  const { user, isAuthenticated, logout } = useAuthStore();

  return (
    <nav className="bg-white shadow-sm border-b sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="text-2xl font-bold text-primary-600">
            ShopHub
          </Link>

          <div className="hidden md:flex flex-1 max-w-md mx-8">
            <div className="relative w-full">
              <input
                type="text"
                placeholder="Search products..."
                className="input-field pl-10"
              />
              <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            </div>
          </div>

          <div className="flex items-center gap-4">
            <Link href="/cart" className="relative p-2 hover:text-primary-600">
              <FiShoppingCart className="w-6 h-6" />
            </Link>

            {isAuthenticated ? (
              <>
                <Link href="/wishlist" className="p-2 hover:text-primary-600">
                  <FiHeart className="w-6 h-6" />
                </Link>
                <Link href="/orders" className="p-2 hover:text-primary-600">
                  <FiPackage className="w-6 h-6" />
                </Link>
                <div className="relative group">
                  <button className="flex items-center gap-2 p-2 hover:text-primary-600">
                    <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                      <FiUser className="w-4 h-4 text-primary-600" />
                    </div>
                    <span className="hidden md:block text-sm font-medium">{user?.name}</span>
                  </button>
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all">
                    <div className="py-1">
                      <Link href="/profile" className="block px-4 py-2 text-sm hover:bg-gray-50">
                        Profile
                      </Link>
                      {user?.role === 'admin' && (
                        <Link href="/admin" className="block px-4 py-2 text-sm hover:bg-gray-50">
                          Admin Dashboard
                        </Link>
                      )}
                      {user?.role === 'seller' && (
                        <Link href="/seller" className="block px-4 py-2 text-sm hover:bg-gray-50">
                          Seller Dashboard
                        </Link>
                      )}
                      <button
                        onClick={logout}
                        className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                      >
                        <FiLogOut className="w-4 h-4" /> Logout
                      </button>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <>
                <Link href="/login" className="btn-secondary text-sm py-2 px-4">
                  Login
                </Link>
                <Link href="/register" className="btn-primary text-sm py-2 px-4">
                  Register
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
