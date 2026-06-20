import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true,
});

api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        const refreshToken = localStorage.getItem('refreshToken');
        if (refreshToken) {
          const { data } = await axios.post(`${API_URL}/api/v1/auth/refresh-token`, { refreshToken });
          localStorage.setItem('accessToken', data.data.accessToken);
          localStorage.setItem('refreshToken', data.data.refreshToken);
          originalRequest.headers.Authorization = `Bearer ${data.data.accessToken}`;
          return api(originalRequest);
        }
      } catch {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
        if (typeof window !== 'undefined') {
          window.location.href = '/login';
        }
      }
    }
    return Promise.reject(error);
  }
);

export default api;

export const authAPI = {
  register: (data: { name: string; email: string; password: string }) => api.post('/api/v1/auth/register', data),
  login: (data: { email: string; password: string }) => api.post('/api/v1/auth/login', data),
  logout: () => api.post('/api/v1/auth/logout'),
  getMe: () => api.get('/api/v1/auth/me'),
  updateProfile: (data: any) => api.put('/api/v1/auth/profile', data),
  forgotPassword: (email: string) => api.post('/api/v1/auth/forgot-password', { email }),
  resetPassword: (token: string, password: string) => api.put(`/api/v1/auth/reset-password/${token}`, { password }),
};

export const productAPI = {
  getAll: (params?: any) => api.get('/api/v1/products', { params }),
  getBySlug: (slug: string) => api.get(`/api/v1/products/slug/${slug}`),
  getById: (id: string) => api.get(`/api/v1/products/${id}`),
  create: (data: any) => api.post('/api/v1/products', data),
  update: (id: string, data: any) => api.put(`/api/v1/products/${id}`, data),
  delete: (id: string) => api.delete(`/api/v1/products/${id}`),
  search: (params: any) => api.get('/api/v1/products/search', { params }),
  topRated: () => api.get('/api/v1/products/top-rated'),
  featured: () => api.get('/api/v1/products/featured'),
};

export const categoryAPI = {
  getAll: () => api.get('/api/v1/categories'),
  getBySlug: (slug: string) => api.get(`/api/v1/categories/${slug}`),
  create: (data: any) => api.post('/api/v1/categories', data),
  update: (id: string, data: any) => api.put(`/api/v1/categories/${id}`, data),
  delete: (id: string) => api.delete(`/api/v1/categories/${id}`),
};

export const cartAPI = {
  get: () => api.get('/api/v1/cart'),
  addItem: (data: { productId: string; variantId: string; quantity: number }) => api.post('/api/v1/cart/items', data),
  updateItem: (variantId: string, quantity: number) => api.put(`/api/v1/cart/items/${variantId}`, { quantity }),
  removeItem: (variantId: string) => api.delete(`/api/v1/cart/items/${variantId}`),
  clear: () => api.delete('/api/v1/cart'),
  applyCoupon: (code: string) => api.post('/api/v1/cart/coupon', { code }),
  removeCoupon: () => api.delete('/api/v1/cart/coupon'),
};

export const orderAPI = {
  create: (data: any) => api.post('/api/v1/orders', data),
  getMyOrders: (params?: any) => api.get('/api/v1/orders/my-orders', { params }),
  getById: (id: string) => api.get(`/api/v1/orders/${id}`),
  cancel: (id: string) => api.put(`/api/v1/orders/${id}/cancel`),
  getAll: (params?: any) => api.get('/api/v1/orders/all', { params }),
  updateStatus: (id: string, status: string) => api.put(`/api/v1/orders/${id}/status`, { status }),
};

export const reviewAPI = {
  getByProduct: (productId: string, params?: any) => api.get(`/api/v1/products/${productId}/reviews`, { params }),
  create: (productId: string, data: any) => api.post(`/api/v1/products/${productId}/reviews`, data),
  update: (reviewId: string, data: any) => api.put(`/api/v1/reviews/${reviewId}`, data),
  delete: (reviewId: string) => api.delete(`/api/v1/reviews/${reviewId}`),
};

export const wishlistAPI = {
  get: () => api.get('/api/v1/wishlist'),
  add: (productId: string) => api.post('/api/v1/wishlist', { productId }),
  remove: (productId: string) => api.delete(`/api/v1/wishlist/${productId}`),
};

export const couponAPI = {
  getAll: () => api.get('/api/v1/coupons'),
  getByCode: (code: string) => api.get(`/api/v1/coupons/code/${code}`),
  create: (data: any) => api.post('/api/v1/coupons', data),
  update: (id: string, data: any) => api.put(`/api/v1/coupons/${id}`, data),
  delete: (id: string) => api.delete(`/api/v1/coupons/${id}`),
};

export const paymentAPI = {
  createIntent: (data: { orderId: string; method: string }) => api.post('/api/v1/payments/create-intent', data),
  verifyRazorpay: (data: any) => api.post('/api/v1/payments/razorpay/verify', data),
};

export const adminAPI = {
  getDashboard: () => api.get('/api/v1/admin/dashboard'),
  getAnalytics: (params?: any) => api.get('/api/v1/admin/analytics', { params }),
  getUsers: (params?: any) => api.get('/api/v1/admin/users', { params }),
  updateUserRole: (id: string, role: string) => api.put(`/api/v1/admin/users/${id}/role`, { role }),
  deleteUser: (id: string) => api.delete(`/api/v1/admin/users/${id}`),
};

export const sellerAPI = {
  getAnalytics: (params?: any) => api.get('/api/v1/seller/analytics', { params }),
};

export const uploadAPI = {
  single: (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post('/api/v1/upload/single', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  multiple: (files: File[]) => {
    const formData = new FormData();
    files.forEach((f) => formData.append('files', f));
    return api.post('/api/v1/upload/multiple', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
};
