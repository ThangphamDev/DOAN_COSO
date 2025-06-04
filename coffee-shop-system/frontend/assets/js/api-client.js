const API_BASE_URL = 'http://localhost:8081/api';


let authToken = localStorage.getItem('token') || null;


let apiCallCount = 0;

const apiCache = new Map();
const CACHE_DURATION = 30000; 

// Hàm trợ giúp để lấy token từ localStorage
function getAuthToken() {
    return localStorage.getItem('token');
}

// Hàm trợ giúp để tạo headers với token xác thực
function getAuthHeaders() {
    const token = getAuthToken();
    const headers = {
        'Accept': 'application/json'
    };
    
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }
    
    return headers;
}

// Hàm trợ giúp để tạo headers với token xác thực cho FormData
function getAuthHeadersForFormData() {
    const token = getAuthToken();
    const headers = {};
    
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }
    
    return headers;
}

async function fetchApi(endpoint, options = {}) {
    try {
        const cacheKey = `${endpoint}_${JSON.stringify(options)}`;
        
        // Kiểm tra cache nếu là GET request
        if (options.method === 'GET' || !options.method) {
            const cachedData = apiCache.get(cacheKey);
            if (cachedData && Date.now() - cachedData.timestamp < CACHE_DURATION) {
                console.log(`[API] Using cached data for ${endpoint}`);
                return cachedData.data;
            }
        }
        
        // Merge headers
        const headers = {
            ...getAuthHeaders(),
            ...(options.headers || {})
        };
        
        const fetchOptions = {
            ...options,
            headers
        };
        
        console.log(`[API] Fetching ${endpoint}`, fetchOptions);
        const response = await fetch(`${API_BASE_URL}${endpoint}`, fetchOptions);
        
        if (!response.ok) {
            let errorMessage = `API Error: ${response.status} ${response.statusText}`;
            try {
                const errorData = await response.json();
                errorMessage = errorData.message || errorMessage;
            } catch (e) {
                // Không phải JSON, sử dụng message mặc định
            }
            throw new Error(errorMessage);
        }
        
        // Phân tích phản hồi
        let data;
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
            data = await response.json();
        } else {
            data = await response.text();
        }
        
        // Lưu vào cache nếu là GET request
        if (options.method === 'GET' || !options.method) {
            apiCache.set(cacheKey, {
                data,
                timestamp: Date.now()
            });
        }
        
        return data;
    } catch (error) {
        console.error(`[API] Error fetching ${endpoint}:`, error);
        throw error;
    }
}

// Hàm để xóa cache
function clearApiCache() {
  apiCache.clear();
  console.log('API cache đã được xóa');
}

// Hàm để xóa một entry cụ thể từ cache
function invalidateCache(endpoint, method = 'GET') {
  const cacheKey = `${endpoint}-${method}`;
  apiCache.delete(cacheKey);
  console.log(`Cache cho ${cacheKey} đã được xóa`);
}

// API cho hoạt động
const ActivityApi = {
  // Lấy các hoạt động gần đây
  getRecentActivities: async () => {
    return await fetchApi('/activities/recent');
  },
  
  // Lấy hoạt động theo khoảng thời gian
  getActivitiesByDateRange: async (startDate, endDate) => {
    return await fetchApi(`/activities/range?start=${startDate}&end=${endDate}`);
  },
  
  // Lấy thống kê hoạt động
  getActivityStatistics: async () => {
    return await fetchApi('/activities/statistics');
  },
  
  // Xuất dữ liệu CSV
  exportActivitiesCSV: async (startDate, endDate) => {
    const response = await fetch(
      `${API_BASE_URL}/activities/export?start=${startDate}&end=${endDate}`,
      {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      }
    );
    
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    
    return await response.blob();
  },
  
  // Xóa nhật ký hoạt động (chỉ dành cho admin)
  clearActivities: async () => {
    return await fetchApi('/activities/clear', { method: 'DELETE' });
  }
};

// API cho khuyến mãi
const PromotionApi = {
  // Lấy tất cả khuyến mãi
  getAllPromotions: async () => {
    return await fetchApi('/promotions');
  },
  
  // Lấy khuyến mãi theo ID
  getPromotionById: async (id) => {
    return await fetchApi(`/promotions/${id}`);
  },
  
  // Lấy khuyến mãi đang hoạt động
  getActivePromotions: async () => {
    return await fetchApi('/promotions/active');
  },
  
  // Lấy khuyến mãi hiện tại
  getCurrentPromotions: async () => {
    return await fetchApi('/promotions/current');
  },
  
  // Tạo khuyến mãi mới
  createPromotion: async (promotionData) => {
    return await fetchApi('/promotions', {
      method: 'POST',
      body: JSON.stringify(promotionData)
    });
  },
  
  // Cập nhật khuyến mãi
  updatePromotion: async (id, promotionData) => {
    return await fetchApi(`/promotions/${id}`, {
      method: 'PUT',
      body: JSON.stringify(promotionData)
    });
  },
  
  // Cập nhật trạng thái khuyến mãi
  updatePromotionStatus: async (id, isActive) => {
    return await fetchApi(`/promotions/${id}/status?isActive=${isActive}`, {
      method: 'PATCH'
    });
  },
  
  // Xóa khuyến mãi
  deletePromotion: async (id) => {
    return await fetchApi(`/promotions/${id}`, {
      method: 'DELETE'
    });
  },
  
  // Xác thực mã khuyến mãi
  validatePromotionCode: async (code) => {
    return await fetchApi(`/promotions/validate/${code}`);
  }
};

// API cho tài khoản
const AccountApi = {
  // Đăng nhập
  login: async (username, password) => {
    return await fetchApi('/accounts/login', {
      method: 'POST',
      body: JSON.stringify({ userName: username, passWord: password })
    });
  },
  
  // Lấy tất cả tài khoản
  getAllAccounts: async (role = null) => {
    const endpoint = role ? `/accounts?role=${role}` : '/accounts';
    return await fetchApi(endpoint);
  },
  
  // Lấy thông tin người dùng hiện tại
  getCurrentUser: async () => {
    return await fetchApi('/accounts/me');
  },
  
  // Đăng xuất
  logout: async () => {
    localStorage.removeItem('token');
    return await fetchApi('/accounts/logout', { method: 'POST' });
  }
};

// API cho danh mục sản phẩm
const CategoryApi = {
  // Lấy tất cả danh mục
  getAllCategories: async () => {
    return await fetchApi('/categories');
  },
  
  // Lấy danh mục theo ID
  getCategoryById: async (id) => {
    return await fetchApi(`/categories/${id}`);
  },
  
  // Tạo danh mục mới
  createCategory: async (categoryData) => {
    return await fetchApi('/categories', {
      method: 'POST',
      body: JSON.stringify(categoryData)
    });
  },
  
  // Cập nhật danh mục
  updateCategory: async (id, categoryData) => {
    return await fetchApi(`/categories/${id}`, {
      method: 'PUT',
      body: JSON.stringify(categoryData)
    });
  },
  
  // Xóa danh mục
  deleteCategory: async (id) => {
    return await fetchApi(`/categories/${id}`, {
      method: 'DELETE'
    });
  },
  
  // Lấy danh sách sản phẩm theo danh mục
  getProductsByCategory: async (id) => {
    return await fetchApi(`/categories/${id}/products`);
  }
};

// API cho sản phẩm
const ProductApi = {
  getAllProducts: async () => {
    return await fetchApi('/products');
  },
  
  getProductById: async (id) => {
    return await fetchApi(`/products/${id}`);
  },
  
  getFeaturedProducts: async () => {
    return await fetchApi('/products/featured');
  },
  
  searchProducts: async (query) => {
    return await fetchApi(`/products/search?q=${encodeURIComponent(query)}`);
  },
  
  filterProducts: async (params) => {
    const queryParams = new URLSearchParams(params).toString();
    return await fetchApi(`/products/filter?${queryParams}`);
  },
  
  createProduct: async (productData) => {
    return await fetchApi('/products', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(productData)
    });
  },
  
  createProductWithImage: async (formData) => {
    try {
      console.log('Đang tạo sản phẩm mới với ảnh');
      
      const response = await fetch(`${API_BASE_URL}/products/with-image`, {
        method: 'POST',
        body: formData,
        headers: getAuthHeadersForFormData()
      });
      
      if (!response.ok) {
        console.error('Tạo sản phẩm thất bại, status:', response.status);
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('Tạo sản phẩm với ảnh thành công, response:', data);
      return data;
    } catch (error) {
      console.error('Lỗi khi tạo sản phẩm với ảnh:', error);
      throw error;
    }
  },
  
  updateProduct: async (id, productData) => {
    return await fetchApi(`/products/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(productData)
    });
  },
  
  deleteProduct: async (id) => {
    return await fetchApi(`/products/${id}`, {
      method: 'DELETE'
    });
  },
  
  uploadProductImage: async (id, imageFile) => {
    const formData = new FormData();
    formData.append('image', imageFile);
    
    try {
      console.log(`Uploading image for product ${id}:`, imageFile.name, imageFile.size, 'bytes');
      
      const response = await fetch(`${API_BASE_URL}/products/${id}/image`, {
        method: 'POST',
        body: formData,
        headers: getAuthHeadersForFormData()
      });
      
      if (!response.ok) {
        console.error('Upload failed, status:', response.status);
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('Upload successful, response:', data);
      return data;
    } catch (error) {
      console.error('Error during image upload:', error);
      throw error;
    }
  },
  
  // Cập nhật trạng thái sản phẩm (có sẵn/hết hàng)
  updateProductStatus: async (id, isAvailable) => {
    return await fetchApi(`/products/${id}/availability?isAvailable=${isAvailable}`, {
      method: 'PATCH'
    });
  },

  // Thêm sản phẩm mới với ảnh
  addProductWithImage: async (productData, imageFile) => {
    try {
        const formData = new FormData();
        
        // Thêm thông tin sản phẩm
        formData.append('productName', productData.name);
        formData.append('categoryId', productData.categoryId);
        formData.append('price', productData.price);
        formData.append('description', productData.description || '');
        formData.append('isAvailable', productData.isAvailable === undefined ? true : productData.isAvailable);
        
        // Thêm file ảnh nếu có
        if (imageFile) {
            formData.append('image', imageFile);
        }
        
        // Gọi API để thêm sản phẩm với ảnh
        const response = await fetch(`${API_BASE_URL}/products/with-image`, {
            method: 'POST',
            headers: getAuthHeadersForFormData(),
            body: formData
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }
        
        return await response.json();
    } catch (error) {
        console.error('Error adding product with image:', error);
        throw error;
    }
  },

  // Cập nhật ảnh sản phẩm
  updateProductImage: async (id, imageFile) => {
    try {
        const formData = new FormData();
        formData.append('image', imageFile);
        
        const response = await fetch(`${API_BASE_URL}/products/${id}/image`, {
            method: 'PUT',
            headers: getAuthHeadersForFormData(),
            body: formData
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }
        
        return await response.json();
    } catch (error) {
        console.error('Error updating product image:', error);
        throw error;
    }
  },

  // Tải lên avatar nhân viên
  uploadStaffAvatar: async (id, avatarFile) => {
    try {
        const formData = new FormData();
        formData.append('avatar', avatarFile);
        
        const response = await fetch(`${API_BASE_URL}/accounts/${id}/avatar`, {
            method: 'POST',
            headers: getAuthHeadersForFormData(),
            body: formData
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }
        
        return await response.json();
    } catch (error) {
        console.error('Error uploading staff avatar:', error);
        throw error;
    }
  }
};

const StaffApi = {
  getAllStaff: async () => {
    return await fetchApi('/accounts');
  },
  
  getStaffById: async (id) => {
    return await fetchApi(`/accounts/${id}`);
  },
  
  createStaff: async (staffData) => {
    const apiStaffData = { ...staffData };
    if (apiStaffData.image) {
      delete apiStaffData.image;
    }
    
    return await fetchApi('/accounts', {
      method: 'POST',
      body: JSON.stringify(apiStaffData)
    });
  },
  
  updateStaff: async (id, staffData) => {
    const apiStaffData = { ...staffData };
    if (apiStaffData.image) {
      delete apiStaffData.image;
    }
    
    return await fetchApi(`/accounts/${id}`, {
      method: 'PUT',
      body: JSON.stringify(apiStaffData)
    });
  },
  
  deleteStaff: async (id) => {
    return await fetchApi(`/accounts/${id}`, {
      method: 'DELETE'
    });
  },
  
  updateStaffStatus: async (id, isActive) => {
    return await fetchApi(`/accounts/${id}/status?active=${isActive}`, {
      method: 'PATCH'
    });
  },
  
  uploadStaffAvatar: async (id, imageFile) => {
    const formData = new FormData();
    formData.append('avatar', imageFile);
    
    const response = await fetch(`${API_BASE_URL}/accounts/${id}/avatar`, {
      method: 'POST',
      body: formData,
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    
    return await response.json();
  }
};

// API cho báo cáo
const ReportApi = {
  getRevenueReport: async (startDate, endDate, period = 'day') => {
    return await fetchApi(`/reports/revenue?start=${startDate}&end=${endDate}&period=${period}`);
  },
  
  getTopSellingProducts: async (startDate, endDate, limit = 10) => {
    return await fetchApi(`/reports/top-products?start=${startDate}&end=${endDate}&limit=${limit}`);
  },
  
  getCategoryReport: async (startDate, endDate) => {
    return await fetchApi(`/reports/category?start=${startDate}&end=${endDate}`);
  },
  
  getHourlyReport: async (date) => {
    return await fetchApi(`/reports/hourly?date=${date}`);
  },
  
  getDashboardReport: async () => {
    return await fetchApi('/reports/dashboard');
  },
  
  exportRevenueReport: async (startDate, endDate, period = 'day') => {
    const response = await fetch(
      `${API_BASE_URL}/reports/revenue/export?start=${startDate}&end=${endDate}&period=${period}`,
      {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      }
    );
    
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    
    return await response.blob();
  },
  
  getCustomerReport: async (startDate, endDate) => {
    return await fetchApi(`/reports/customers?start=${startDate}&end=${endDate}`);
  }
};

// API cho quản lý bàn
const TableApi = {
  getAllTables: async () => {
    return await fetchApi('/tables');
  },
  
  getTableById: async (id) => {
    return await fetchApi(`/tables/${id}`);
  },
  
  createTable: async (tableData) => {
    return await fetchApi('/tables', {
      method: 'POST',
      body: JSON.stringify(tableData)
    });
  },
  
  updateTable: async (id, tableData) => {
    return await fetchApi(`/tables/${id}`, {
      method: 'PUT',
      body: JSON.stringify(tableData)
    });
  },
  
  updateTableStatus: async (id, status) => {
    return await fetchApi(`/tables/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status })
    });
  },
  
  deleteTable: async (id) => {
    return await fetchApi(`/tables/${id}`, {
      method: 'DELETE'
    });
  },
  
  getTablesByStatus: async (status) => {
    return await fetchApi(`/tables/status/${status}`);
  },
  
  mergeTables: async (sourceTableId, targetTableId) => {
    return await fetchApi('/tables/merge', {
      method: 'POST',
      body: JSON.stringify({
        sourceTableId,
        targetTableId
      })
    });
  }
};

// API cho quản lý đơn hàng
const OrderApi = {
  getAllOrders: async (page = 1, limit = 10) => {
    return await fetchApi(`/orders?page=${page}&limit=${limit}`);
  },
  
  getOrderById: async (id) => {
    return await fetchApi(`/orders/${id}`);
  },
  
  createOrder: async (orderData) => {
    return await fetchApi('/orders', {
      method: 'POST',
      body: JSON.stringify(orderData)
    });
  },
  
  updateOrder: async (id, orderData) => {
    return await fetchApi(`/orders/${id}`, {
      method: 'PUT',
      body: JSON.stringify(orderData)
    });
  },
  
  updateOrderStatus: async (id, status) => {
    return await fetchApi(`/orders/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status })
    });
  },
  
  deleteOrder: async (id) => {
    return await fetchApi(`/orders/${id}`, {
      method: 'DELETE'
    });
  },
  
  addProductToOrder: async (orderId, productData) => {
    return await fetchApi(`/orders/${orderId}/items`, {
      method: 'POST',
      body: JSON.stringify(productData)
    });
  },
  
  updateOrderItem: async (orderId, itemId, itemData) => {
    return await fetchApi(`/orders/${orderId}/items/${itemId}`, {
      method: 'PUT',
      body: JSON.stringify(itemData)
    });
  },
  
  removeOrderItem: async (orderId, itemId) => {
    return await fetchApi(`/orders/${orderId}/items/${itemId}`, {
      method: 'DELETE'
    });
  },
  
  getOrdersByTable: async (tableId) => {
    return await fetchApi(`/orders/table/${tableId}`);
  },
  
  checkoutOrder: async (orderId, paymentData) => {
    return await fetchApi(`/orders/${orderId}/checkout`, {
      method: 'POST',
      body: JSON.stringify(paymentData)
    });
  },
  
  getInvoice: async (orderId) => {
    return await fetchApi(`/orders/${orderId}/invoice`);
  },
  
  printInvoice: async (orderId) => {
    const response = await fetch(`${API_BASE_URL}/orders/${orderId}/print`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    
    return await response.json();
  }
};

window.ApiClient = {
  Activity: ActivityApi,
  Promotion: PromotionApi,
  Account: AccountApi,
  Category: CategoryApi,
  Product: ProductApi,
  Staff: StaffApi,
  Report: ReportApi,
  Table: TableApi,
  Order: OrderApi,
  clearCache: clearApiCache,
  invalidateCache: invalidateCache
};