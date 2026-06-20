import mongoose from 'mongoose';
import { config } from './config';
import User from './models/User';
import Category from './models/Category';
import Product from './models/Product';
import Coupon from './models/Coupon';
import { UserRole, ProductStatus } from '../shared/enums';

const seed = async () => {
  try {
    await mongoose.connect(config.mongodb.uri);
    console.log('Connected to MongoDB');

    await User.deleteMany({});
    await Category.deleteMany({});
    await Product.deleteMany({});
    await Coupon.deleteMany({});

    const admin = await User.create({
      name: 'Admin User',
      email: 'admin@ecommerce.com',
      password: 'admin123',
      role: UserRole.ADMIN,
      isEmailVerified: true,
    });

    const seller = await User.create({
      name: 'Seller User',
      email: 'seller@ecommerce.com',
      password: 'seller123',
      role: UserRole.SELLER,
      isEmailVerified: true,
    });

    const customer = await User.create({
      name: 'Customer User',
      email: 'customer@ecommerce.com',
      password: 'customer123',
      role: UserRole.CUSTOMER,
      isEmailVerified: true,
    });

    console.log('Users seeded');
    console.log(`  Admin: admin@ecommerce.com / admin123`);
    console.log(`  Seller: seller@ecommerce.com / seller123`);
    console.log(`  Customer: customer@ecommerce.com / customer123`);

    const electronics = await Category.create({ name: 'Electronics', description: 'Electronic devices and accessories', isActive: true });
    const clothing = await Category.create({ name: 'Clothing', description: 'Apparel and fashion', isActive: true });
    const home = await Category.create({ name: 'Home & Kitchen', description: 'Home appliances and kitchenware', isActive: true });
    const books = await Category.create({ name: 'Books', description: 'Books and publications', isActive: true });

    const mobiles = await Category.create({ name: 'Mobiles', parent: electronics._id, isActive: true });
    const laptops = await Category.create({ name: 'Laptops', parent: electronics._id, isActive: true });
    const menClothing = await Category.create({ name: "Men's Clothing", parent: clothing._id, isActive: true });
    const womenClothing = await Category.create({ name: "Women's Clothing", parent: clothing._id, isActive: true });

    console.log('Categories seeded');

    await Product.create({
      name: 'iPhone 15 Pro Max',
      description: 'Apple iPhone 15 Pro Max with A17 Pro chip, 48MP camera, and titanium design.',
      category: mobiles._id,
      seller: seller._id,
      brand: 'Apple',
      variants: [
        { sku: 'IP15PM-256-NAT', size: '6.7"', color: 'Natural Titanium', price: 159900, stock: 50, images: ['https://via.placeholder.com/400'], isActive: true },
        { sku: 'IP15PM-256-BLK', size: '6.7"', color: 'Black Titanium', price: 159900, stock: 40, images: ['https://via.placeholder.com/400'], isActive: true },
        { sku: 'IP15PM-512-NAT', size: '6.7"', color: 'Natural Titanium', price: 179900, stock: 30, salePrice: 169900, images: ['https://via.placeholder.com/400'], isActive: true },
      ],
      tags: ['iphone', 'apple', 'smartphone', '5g'],
      attributes: { processor: 'A17 Pro', ram: '8GB', storage: '256GB', battery: '4422mAh' },
      status: ProductStatus.ACTIVE,
      isFeatured: true,
    });

    await Product.create({
      name: 'MacBook Pro 16" M3 Pro',
      description: 'Apple MacBook Pro with M3 Pro chip, 18GB RAM, 512GB SSD.',
      category: laptops._id,
      seller: seller._id,
      brand: 'Apple',
      variants: [
        { sku: 'MBP16-M3-18-512', color: 'Space Black', price: 249900, stock: 25, images: ['https://via.placeholder.com/400'], isActive: true },
        { sku: 'MBP16-M3-36-1T', color: 'Silver', price: 299900, stock: 15, images: ['https://via.placeholder.com/400'], isActive: true },
      ],
      tags: ['macbook', 'apple', 'laptop', 'm3'],
      attributes: { processor: 'M3 Pro', ram: '18GB', storage: '512GB', display: '16.2" Liquid Retina XDR' },
      status: ProductStatus.ACTIVE,
      isFeatured: true,
    });

    await Product.create({
      name: 'Classic Fit Oxford Shirt',
      description: 'Premium cotton Oxford shirt, perfect for casual and formal occasions.',
      category: menClothing._id,
      seller: seller._id,
      brand: 'ClassicWear',
      variants: [
        { sku: 'OXF-WHT-M', size: 'M', color: 'White', price: 2499, stock: 100, salePrice: 1999, images: ['https://via.placeholder.com/400'], isActive: true },
        { sku: 'OXF-WHT-L', size: 'L', color: 'White', price: 2499, stock: 80, images: ['https://via.placeholder.com/400'], isActive: true },
        { sku: 'OXF-BLU-M', size: 'M', color: 'Blue', price: 2699, stock: 60, images: ['https://via.placeholder.com/400'], isActive: true },
      ],
      tags: ['shirt', 'oxford', 'cotton', 'formal'],
      attributes: { fabric: '100% Cotton', fit: 'Classic Fit', collar: 'Button-down' },
      status: ProductStatus.ACTIVE,
    });

    await Product.create({
      name: 'Wireless Bluetooth Headphones',
      description: 'Premium noise-cancelling wireless headphones with 30-hour battery life.',
      category: electronics._id,
      seller: seller._id,
      brand: 'SoundPro',
      variants: [
        { sku: 'SHP-BLK', color: 'Black', price: 7999, stock: 75, salePrice: 6499, images: ['https://via.placeholder.com/400'], isActive: true },
        { sku: 'SHP-WHT', color: 'White', price: 7999, stock: 50, images: ['https://via.placeholder.com/400'], isActive: true },
      ],
      tags: ['headphones', 'wireless', 'bluetooth', 'noise-cancelling'],
      attributes: { battery: '30 hours', driver: '40mm', connectivity: 'Bluetooth 5.3' },
      status: ProductStatus.ACTIVE,
      isFeatured: true,
    });

    console.log('Products seeded');

    await Coupon.create({
      code: 'WELCOME10',
      description: '10% off for new customers',
      discountType: 'percentage',
      discountValue: 10,
      minOrderAmount: 500,
      maxDiscount: 500,
      usageLimit: 1000,
      isActive: true,
      startsAt: new Date('2024-01-01'),
      expiresAt: new Date('2026-12-31'),
    });

    await Coupon.create({
      code: 'FLAT500',
      description: 'Flat ₹500 off on orders above ₹2500',
      discountType: 'fixed',
      discountValue: 500,
      minOrderAmount: 2500,
      usageLimit: 500,
      isActive: true,
      startsAt: new Date('2024-01-01'),
      expiresAt: new Date('2026-12-31'),
    });

    await Coupon.create({
      code: 'SALE25',
      description: '25% off on all electronics',
      discountType: 'percentage',
      discountValue: 25,
      minOrderAmount: 1000,
      maxDiscount: 2000,
      usageLimit: 200,
      isActive: true,
      startsAt: new Date('2024-06-01'),
      expiresAt: new Date('2026-12-31'),
    });

    console.log('Coupons seeded');
    console.log('Database seeded successfully!');

    process.exit(0);
  } catch (error) {
    console.error('Seeding error:', error);
    process.exit(1);
  }
};

seed();
