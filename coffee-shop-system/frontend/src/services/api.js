import axios from 'axios';

// Thiết lập cấu hình mặc định cho axios
const API = axios.create({
  baseURL: 'http://localhost:3001/api',
  headers: {
    'Content-Type': 'application/json'
  }
});

// Thêm interceptor để xử lý token xác thực
API.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// API Authentication
export const login = (username, password) => {
  return API.post('/auth/login', { username, password });
};

export const logout = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
};

// API Table
export const getTables = () => {
  return API.get('/tables');
};

export const updateTableStatus = (id, isAvailable) => {
  return API.patch(`/tables/${id}`, { isAvailable });
};

export const createTable = (tableData) => {
  return API.post('/tables', tableData);
};

export const updateTable = (id, tableData) => {
  return API.put(`/tables/${id}`, tableData);
};

export const deleteTable = (id) => {
  return API.delete(`/tables/${id}`);
};

// API Category
export const getCategories = () => {
  return API.get('/categories');
};

export const createCategory = (categoryData) => {
  return API.post('/categories', categoryData);
};

export const updateCategory = (id, categoryData) => {
  return API.put(`/categories/${id}`, categoryData);
};

export const deleteCategory = (id) => {
  return API.delete(`/categories/${id}`);
};

// API Product
export const getProducts = () => {
  return API.get('/products');
};

export const getProductsByCategory = (categoryId) => {
  return API.get(`/products?categoryId=${categoryId}`);
};

export const createProduct = (productData) => {
  return API.post('/products', productData);
};

export const updateProduct = (id, productData) => {
  return API.put(`/products/${id}`, productData);
};

export const deleteProduct = (id) => {
  return API.delete(`/products/${id}`);
};

// API Order
export const getOrders = () => {
  return API.get('/orders');
};

export const getOrderById = (id) => {
  return API.get(`/orders/${id}`);
};

export const createOrder = (orderData) => {
  return API.post('/orders', orderData);
};

export const updateOrderStatus = (id, status) => {
  return API.patch(`/orders/${id}`, { status });
};

// API User
export const getUsers = () => {
  return API.get('/users');
};

export const createUser = (userData) => {
  return API.post('/users', userData);
};

export const updateUser = (id, userData) => {
  return API.put(`/users/${id}`, userData);
};

export const deleteUser = (id) => {
  return API.delete(`/users/${id}`);
};

// API Promotion
export const getPromotions = () => {
  return API.get('/promotions');
};

export const createPromotion = (promotionData) => {
  return API.post('/promotions', promotionData);
};

export const updatePromotion = (id, promotionData) => {
  return API.put(`/promotions/${id}`, promotionData);
};

export const deletePromotion = (id) => {
  return API.delete(`/promotions/${id}`);
};

// API Dashboard
export const getDashboardStats = () => {
  return API.get('/dashboard/stats');
};

export const getRevenueByDateRange = (startDate, endDate) => {
  return API.get(`/dashboard/revenue?startDate=${startDate}&endDate=${endDate}`);
};

export const getTopSellingProducts = (limit = 5) => {
  return API.get(`/dashboard/top-products?limit=${limit}`);
};

export default API; 