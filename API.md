# API Documentation

Base URL: `/api/v1`

## Authentication

### POST /auth/register
Register a new user.
```json
{ "name": "John", "email": "john@example.com", "password": "password123" }
```

### POST /auth/login
Login with email and password.
```json
{ "email": "john@example.com", "password": "password123" }
```

### POST /auth/refresh-token
Refresh access token.
```json
{ "refreshToken": "xxx" }
```

### POST /auth/logout
Logout user (requires auth).

### GET /auth/me
Get current user profile (requires auth).

### PUT /auth/profile
Update profile (requires auth).

### POST /auth/forgot-password
Send password reset email.
```json
{ "email": "john@example.com" }
```

### PUT /auth/reset-password/:token
Reset password with token.

### GET /auth/google
Google OAuth login.

## Products

### GET /products
List all products (supports pagination, filtering, sorting).
Query params: `page`, `limit`, `sort`, `category`, `price[gte]`, `price[lte]`, `rating[gte]`

### GET /products/search
Search products. Query: `q`, `category`, `minPrice`, `maxPrice`

### GET /products/top-rated
Get top rated products (limit: 10).

### GET /products/featured
Get featured products.

### GET /products/slug/:slug
Get product by slug.

### GET /products/:id
Get product by ID.

### POST /products
Create product (Seller/Admin only).
```json
{
  "name": "Product Name",
  "description": "Description",
  "category": "category_id",
  "brand": "Brand",
  "variants": [{ "sku": "SKU", "size": "M", "color": "Red", "price": 999, "stock": 50 }]
}
```

### PUT /products/:id
Update product.

### DELETE /products/:id
Delete product.

## Categories

### GET /categories
List all categories.

### GET /categories/:slug
Get category by slug.

### POST /categories
Create category (Admin only).

### PUT /categories/:id
Update category.

### DELETE /categories/:id
Delete category.

## Cart

### GET /cart
Get user cart.

### POST /cart/items
Add item to cart.
```json
{ "productId": "xxx", "variantId": "xxx", "quantity": 2 }
```

### PUT /cart/items/:variantId
Update item quantity.
```json
{ "quantity": 3 }
```

### DELETE /cart/items/:variantId
Remove item from cart.

### DELETE /cart
Clear cart.

### POST /cart/coupon
Apply coupon.
```json
{ "code": "WELCOME10" }
```

### DELETE /cart/coupon
Remove coupon.

## Orders

### GET /orders/my-orders
Get current user's orders.

### GET /orders/all
Get all orders (Admin/Seller).

### POST /orders
Create order.
```json
{
  "items": [{ "product": "xxx", "variant": "xxx", "quantity": 2 }],
  "shippingAddress": { "street": "...", "city": "...", "state": "...", "zip": "...", "country": "IN" },
  "billingAddress": { "...": "..." },
  "paymentMethod": "cod",
  "couponCode": "WELCOME10"
}
```

### GET /orders/:id
Get order details.

### PUT /orders/:id/cancel
Cancel order.

### PUT /orders/:id/status
Update order status (Admin/Seller).
```json
{ "status": "shipped" }
```

## Reviews

### GET /products/:productId/reviews
Get product reviews.

### POST /products/:productId/reviews
Create review.
```json
{ "rating": 5, "title": "Great!", "comment": "Amazing product" }
```

### PUT /reviews/:id
Update review.

### DELETE /reviews/:id
Delete review.

## Wishlist

### GET /wishlist
Get user wishlist.

### POST /wishlist
Add product to wishlist.
```json
{ "productId": "xxx" }
```

### DELETE /wishlist/:productId
Remove from wishlist.

## Coupons

### GET /coupons/code/:code
Get coupon by code.

### GET /coupons
Get all coupons (Admin).

### POST /coupons
Create coupon (Admin).

### PUT /coupons/:id
Update coupon (Admin).

### DELETE /coupons/:id
Delete coupon (Admin).

## Payments

### POST /payments/stripe/webhook
Stripe webhook endpoint.

### POST /payments/create-intent
Create payment intent.
```json
{ "orderId": "xxx", "method": "stripe" }
```

### POST /payments/razorpay/verify
Verify Razorpay payment.
```json
{ "orderId": "xxx", "razorpayPaymentId": "xxx", "razorpayOrderId": "xxx", "signature": "xxx" }
```

## Admin

### GET /admin/dashboard
Get dashboard stats.

### GET /admin/analytics
Get analytics data.

### GET /admin/users
Get all users.

### PUT /admin/users/:id/role
Update user role.
```json
{ "role": "seller" }
```

### DELETE /admin/users/:id
Delete user.

## Seller

### GET /seller/analytics
Get seller analytics.

## Upload

### POST /upload/single
Upload single image (multipart/form-data).

### POST /upload/multiple
Upload multiple images (multipart/form-data).

## Response Format

Success:
```json
{
  "success": true,
  "data": { ... },
  "pagination": { "page": 1, "limit": 20, "total": 50, "totalPages": 3, "hasNextPage": true, "hasPrevPage": false }
}
```

Error:
```json
{
  "success": false,
  "message": "Error message",
  "error": "ERROR_CODE"
}
```
