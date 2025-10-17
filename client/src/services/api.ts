import axios, { AxiosResponse } from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle common errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid - only redirect if not already on login page
      localStorage.removeItem('token');
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  login: (data: { email: string; password: string }): Promise<AxiosResponse> =>
    api.post('/auth/login', data),
  
  register: (data: {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    phone?: string;
  }): Promise<AxiosResponse> =>
    api.post('/auth/register', data),
  
  getCurrentUser: (): Promise<AxiosResponse> =>
    api.get('/auth/me'),
  
  updateProfile: (data: any): Promise<AxiosResponse> =>
    api.put('/auth/profile', data),
  
  changePassword: (data: {
    currentPassword: string;
    newPassword: string;
  }): Promise<AxiosResponse> =>
    api.put('/auth/change-password', data),
  
  logout: (): Promise<AxiosResponse> =>
    api.post('/auth/logout'),
  
  setAuthToken: (token: string) => {
    if (token) {
      api.defaults.headers.Authorization = `Bearer ${token}`;
    } else {
      delete api.defaults.headers.Authorization;
    }
  },
};

// Products API
export const productsAPI = {
  getProducts: (params?: {
    page?: number;
    limit?: number;
    category?: string;
    search?: string;
    minPrice?: number;
    maxPrice?: number;
    brand?: string;
    inStock?: boolean;
    featured?: boolean;
    sort?: string;
    order?: string;
  }): Promise<AxiosResponse> =>
    api.get('/products', { params }),
  
  getProduct: (id: string): Promise<AxiosResponse> =>
    api.get(`/products/${id}`),
  
  getFeaturedProducts: (limit?: number): Promise<AxiosResponse> =>
    api.get('/products/featured/list', { params: { limit } }),
  
  getRelatedProducts: (id: string, limit?: number): Promise<AxiosResponse> =>
    api.get(`/products/${id}/related`, { params: { limit } }),
  
  createProduct: (data: any): Promise<AxiosResponse> =>
    api.post('/products', data),
  
  updateProduct: (id: string, data: any): Promise<AxiosResponse> =>
    api.put(`/products/${id}`, data),
  
  deleteProduct: (id: string): Promise<AxiosResponse> =>
    api.delete(`/products/${id}`),
};

// Categories API
export const categoriesAPI = {
  getCategories: (): Promise<AxiosResponse> =>
    api.get('/categories'),
  
  getCategory: (id: string): Promise<AxiosResponse> =>
    api.get(`/categories/${id}`),
  
  createCategory: (data: any): Promise<AxiosResponse> =>
    api.post('/categories', data),
  
  updateCategory: (id: string, data: any): Promise<AxiosResponse> =>
    api.put(`/categories/${id}`, data),
  
  deleteCategory: (id: string): Promise<AxiosResponse> =>
    api.delete(`/categories/${id}`),
};

// Cart API
export const cartAPI = {
  getCart: (): Promise<AxiosResponse> =>
    api.get('/cart'),
  
  addToCart: (data: {
    productId: string;
    quantity: number;
    variant?: any;
  }): Promise<AxiosResponse> =>
    api.post('/cart/items', data),
  
  updateCartItem: (itemId: string, data: { quantity: number }): Promise<AxiosResponse> =>
    api.put(`/cart/items/${itemId}`, data),
  
  removeFromCart: (itemId: string): Promise<AxiosResponse> =>
    api.delete(`/cart/items/${itemId}`),
  
  clearCart: (): Promise<AxiosResponse> =>
    api.delete('/cart'),
  
  applyCoupon: (data: { code: string }): Promise<AxiosResponse> =>
    api.post('/cart/coupon', data),
  
  removeCoupon: (): Promise<AxiosResponse> =>
    api.delete('/cart/coupon'),
};

// Orders API
export const ordersAPI = {
  createOrder: (data: any): Promise<AxiosResponse> =>
    api.post('/orders', data),
  
  getOrders: (params?: {
    page?: number;
    limit?: number;
  }): Promise<AxiosResponse> =>
    api.get('/orders', { params }),
  
  getOrder: (id: string): Promise<AxiosResponse> =>
    api.get(`/orders/${id}`),
  
  updateOrderStatus: (id: string, data: {
    status: string;
    note?: string;
  }): Promise<AxiosResponse> =>
    api.put(`/orders/${id}/status`, data),
  
  cancelOrder: (id: string, data?: { reason?: string }): Promise<AxiosResponse> =>
    api.put(`/orders/${id}/cancel`, data),
  
  getAdminOrders: (params?: {
    page?: number;
    limit?: number;
    status?: string;
    customer?: string;
    startDate?: string;
    endDate?: string;
  }): Promise<AxiosResponse> =>
    api.get('/orders/admin/all', { params }),
  
  getOrderStats: (params?: {
    startDate?: string;
    endDate?: string;
  }): Promise<AxiosResponse> =>
    api.get('/orders/admin/stats', { params }),
};

// Users API
export const usersAPI = {
  getUsers: (params?: {
    page?: number;
    limit?: number;
    role?: string;
    isActive?: boolean;
    search?: string;
  }): Promise<AxiosResponse> =>
    api.get('/users', { params }),
  
  getUser: (id: string): Promise<AxiosResponse> =>
    api.get(`/users/${id}`),
  
  updateUser: (id: string, data: any): Promise<AxiosResponse> =>
    api.put(`/users/${id}`, data),
  
  deleteUser: (id: string): Promise<AxiosResponse> =>
    api.delete(`/users/${id}`),
  
  addAddress: (data: any): Promise<AxiosResponse> =>
    api.post('/users/addresses', data),
  
  updateAddress: (addressId: string, data: any): Promise<AxiosResponse> =>
    api.put(`/users/addresses/${addressId}`, data),
  
  deleteAddress: (addressId: string): Promise<AxiosResponse> =>
    api.delete(`/users/addresses/${addressId}`),
};

export default api;
