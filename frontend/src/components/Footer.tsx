import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-300 mt-auto">
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <h3 className="text-xl font-bold text-white mb-4">ShopHub</h3>
            <p className="text-sm">Your one-stop shop for everything. Quality products, best prices.</p>
          </div>
          <div>
            <h4 className="font-semibold text-white mb-3">Quick Links</h4>
            <ul className="space-y-2 text-sm">
              <li><Link href="/" className="hover:text-white">Home</Link></li>
              <li><Link href="/products" className="hover:text-white">Products</Link></li>
              <li><Link href="/cart" className="hover:text-white">Cart</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-white mb-3">Categories</h4>
            <ul className="space-y-2 text-sm">
              <li><Link href="/products?category=electronics" className="hover:text-white">Electronics</Link></li>
              <li><Link href="/products?category=clothing" className="hover:text-white">Clothing</Link></li>
              <li><Link href="/products?category=home" className="hover:text-white">Home & Kitchen</Link></li>
              <li><Link href="/products?category=books" className="hover:text-white">Books</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-white mb-3">Support</h4>
            <ul className="space-y-2 text-sm">
              <li><Link href="/contact" className="hover:text-white">Contact Us</Link></li>
              <li><span>support@shophub.com</span></li>
            </ul>
          </div>
        </div>
        <div className="border-t border-gray-700 mt-8 pt-8 text-center text-sm">
          <p>&copy; {new Date().getFullYear()} ShopHub. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
