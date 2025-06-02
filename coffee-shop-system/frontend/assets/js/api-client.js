const API_BASE_URL = 'http://localhost:8081/api';

// Token JWT cho authentication
let authToken = localStorage.getItem('token') || null;

// Bộ đếm cache-breaking
let apiCallCount = 0;

// Cache đơn giản để lưu trữ response từ API
const apiCache = new Map();
const CACHE_DURATION = 30000; // 30 giây

// Hàm trợ giúp để gọi API
async function fetchApi(endpoint, options = {}) {
  try {
    // Kiểm tra phương thức, nếu không phải GET thì không sử dụng cache
    const method = options.method || 'GET';
    const cacheKey = `${endpoint}-${method}`;
    
    // Chỉ sử dụng cache cho các requests GET
    if (method === 'GET') {
      const cachedData = apiCache.get(cacheKey);
      if (cachedData && Date.now() - cachedData.timestamp < CACHE_DURATION) {
        console.log(`Sử dụng dữ liệu cache cho: ${endpoint}`);
        return cachedData.data;
      }
    }
    
    // Thiết lập các options mặc định
    const defaultOptions = {
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      mode: 'cors', // Sử dụng CORS
      credentials: 'include' // Luôn gửi credentials để hỗ trợ xác thực
    };

    // Kết hợp options mặc định với options được cung cấp
    const fetchOptions = { ...defaultOptions, ...options };
    
    // Kiểm tra xem endpoint có phải là API công khai không
    const isPublicAPI = 
      endpoint.includes('/tables') || 
      endpoint.includes('/products') || 
      endpoint.includes('/promotions') ||
      endpoint.includes('/accounts/login') ||
      endpoint.includes('/accounts/register');
    
    // Nếu có token trong localStorage và endpoint không phải là API công khai, thêm vào header
    const token = localStorage.getItem('token');
    if (token && !isPublicAPI) {
      // Log token để debug (chỉ hiển thị 20 ký tự đầu tiên)
      console.log(`Token found, adding to authenticated request: ${endpoint}`);
      console.log(`Token: ${token.substring(0, 20)}...`);
      
      fetchOptions.headers.Authorization = `Bearer ${token}`;
    } else if (isPublicAPI) {
      console.log(`Public API request, no token needed: ${endpoint}`);
    }

    console.log(`Gọi API: ${API_BASE_URL}${endpoint}`, { 
      method: fetchOptions.method,
      headers: Object.keys(fetchOptions.headers),
      credentials: fetchOptions.credentials,
      isPublicAPI: isPublicAPI
    });
    
    // Gọi API
    const response = await fetch(`${API_BASE_URL}${endpoint}`, fetchOptions);
    
    // Xử lý lỗi HTTP
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`HTTP error! Status: ${response.status}, Details:`, errorText);
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    // Kiểm tra nếu response rỗng
    const contentType = response.headers.get('content-type');
    let data;
    if (contentType && contentType.includes('application/json')) {
      data = await response.json();
    } else {
      data = await response.text();
    }
    
    // Lưu vào cache nếu là request GET
    if (method === 'GET') {
      apiCache.set(cacheKey, {
        data,
        timestamp: Date.now()
      });
    }
    
    return data;
  } catch (error) {
    console.error('API request error:', error);
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
  // Lấy tất cả sản phẩm
  getAllProducts: async () => {
    return await fetchApi('/products');
  },
  
  // Lấy sản phẩm theo ID
  getProductById: async (id) => {
    return await fetchApi(`/products/${id}`);
  },
  
  // Lấy sản phẩm nổi bật
  getFeaturedProducts: async () => {
    return await fetchApi('/products/featured');
  },
  
  // Tìm kiếm sản phẩm
  searchProducts: async (query) => {
    return await fetchApi(`/products/search?q=${encodeURIComponent(query)}`);
  },
  
  // Lọc sản phẩm
  filterProducts: async (params) => {
    const queryParams = new URLSearchParams(params).toString();
    return await fetchApi(`/products/filter?${queryParams}`);
  },
  
  // Tạo sản phẩm mới
  createProduct: async (productData) => {
    return await fetchApi('/products', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(productData)
    });
  },
  
  // Tạo sản phẩm mới với ảnh (sử dụng FormData)
  createProductWithImage: async (formData) => {
    try {
      console.log('Đang tạo sản phẩm mới với ảnh');
      
      const response = await fetch(`${API_BASE_URL}/products/with-image`, {
        method: 'POST',
        body: formData,
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
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
  
  // Cập nhật sản phẩm
  updateProduct: async (id, productData) => {
    return await fetchApi(`/products/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(productData)
    });
  },
  
  // Xóa sản phẩm
  deleteProduct: async (id) => {
    return await fetchApi(`/products/${id}`, {
      method: 'DELETE'
    });
  },
  
  // Cập nhật hình ảnh sản phẩm (sử dụng FormData)
  uploadProductImage: async (id, imageFile) => {
    const formData = new FormData();
    formData.append('image', imageFile);
    
    try {
      console.log(`Uploading image for product ${id}:`, imageFile.name, imageFile.size, 'bytes');
      
      const response = await fetch(`${API_BASE_URL}/products/${id}/image`, {
        method: 'POST',
        body: formData,
        // Không đặt Content-Type, để trình duyệt tự xác định boundary cho multipart/form-data
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
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
  }
};

// API cho nhân viên
const StaffApi = {
  // Lấy tất cả nhân viên
  getAllStaff: async () => {
    return await fetchApi('/accounts');
  },
  
  // Lấy nhân viên theo ID
  getStaffById: async (id) => {
    return await fetchApi(`/accounts/${id}`);
  },
  
  // Tạo nhân viên mới
  createStaff: async (staffData) => {
    // Loại bỏ ảnh khỏi dữ liệu gửi đi nếu có
    const apiStaffData = { ...staffData };
    if (apiStaffData.image) {
      delete apiStaffData.image;
    }
    
    return await fetchApi('/accounts', {
      method: 'POST',
      body: JSON.stringify(apiStaffData)
    });
  },
  
  // Cập nhật thông tin nhân viên
  updateStaff: async (id, staffData) => {
    // Loại bỏ ảnh khỏi dữ liệu gửi đi nếu có
    const apiStaffData = { ...staffData };
    if (apiStaffData.image) {
      delete apiStaffData.image;
    }
    
    return await fetchApi(`/accounts/${id}`, {
      method: 'PUT',
      body: JSON.stringify(apiStaffData)
    });
  },
  
  // Xóa nhân viên
  deleteStaff: async (id) => {
    return await fetchApi(`/accounts/${id}`, {
      method: 'DELETE'
    });
  },
  
  // Cập nhật trạng thái nhân viên (đang làm việc/nghỉ việc)
  updateStaffStatus: async (id, isActive) => {
    return await fetchApi(`/accounts/${id}/status?active=${isActive}`, {
      method: 'PATCH'
    });
  },
  
  // Tải lên ảnh đại diện nhân viên
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
  // Lấy báo cáo doanh thu
  getRevenueReport: async (startDate, endDate, period = 'day') => {
    return await fetchApi(`/reports/revenue?start=${startDate}&end=${endDate}&period=${period}`);
  },
  
  // Lấy báo cáo sản phẩm bán chạy
  getTopSellingProducts: async (startDate, endDate, limit = 10) => {
    return await fetchApi(`/reports/top-products?start=${startDate}&end=${endDate}&limit=${limit}`);
  },
  
  // Lấy báo cáo theo danh mục
  getCategoryReport: async (startDate, endDate) => {
    return await fetchApi(`/reports/category?start=${startDate}&end=${endDate}`);
  },
  
  // Lấy báo cáo theo thời gian trong ngày
  getHourlyReport: async (date) => {
    return await fetchApi(`/reports/hourly?date=${date}`);
  },
  
  // Lấy báo cáo tổng quan
  getDashboardReport: async () => {
    return await fetchApi('/reports/dashboard');
  },
  
  // Xuất báo cáo doanh thu dưới dạng CSV
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
  
  // Lấy báo cáo khách hàng
  getCustomerReport: async (startDate, endDate) => {
    return await fetchApi(`/reports/customers?start=${startDate}&end=${endDate}`);
  }
};

// API cho quản lý bàn
const TableApi = {
  // Lấy tất cả bàn
  getAllTables: async () => {
    return await fetchApi('/tables');
  },
  
  // Lấy thông tin bàn theo ID
  getTableById: async (id) => {
    return await fetchApi(`/tables/${id}`);
  },
  
  // Tạo bàn mới
  createTable: async (tableData) => {
    return await fetchApi('/tables', {
      method: 'POST',
      body: JSON.stringify(tableData)
    });
  },
  
  // Cập nhật thông tin bàn
  updateTable: async (id, tableData) => {
    return await fetchApi(`/tables/${id}`, {
      method: 'PUT',
      body: JSON.stringify(tableData)
    });
  },
  
  // Cập nhật trạng thái bàn
  updateTableStatus: async (id, status) => {
    return await fetchApi(`/tables/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status })
    });
  },
  
  // Xóa bàn
  deleteTable: async (id) => {
    return await fetchApi(`/tables/${id}`, {
      method: 'DELETE'
    });
  },
  
  // Lấy danh sách bàn theo trạng thái
  getTablesByStatus: async (status) => {
    return await fetchApi(`/tables/status/${status}`);
  },
  
  // Hợp nhất các bàn
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
  // Lấy tất cả đơn hàng
  getAllOrders: async (page = 1, limit = 10) => {
    return await fetchApi(`/orders?page=${page}&limit=${limit}`);
  },
  
  // Lấy thông tin đơn hàng theo ID
  getOrderById: async (id) => {
    return await fetchApi(`/orders/${id}`);
  },
  
  // Tạo đơn hàng mới
  createOrder: async (orderData) => {
    return await fetchApi('/orders', {
      method: 'POST',
      body: JSON.stringify(orderData)
    });
  },
  
  // Cập nhật thông tin đơn hàng
  updateOrder: async (id, orderData) => {
    return await fetchApi(`/orders/${id}`, {
      method: 'PUT',
      body: JSON.stringify(orderData)
    });
  },
  
  // Cập nhật trạng thái đơn hàng
  updateOrderStatus: async (id, status) => {
    return await fetchApi(`/orders/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status })
    });
  },
  
  // Xóa đơn hàng
  deleteOrder: async (id) => {
    return await fetchApi(`/orders/${id}`, {
      method: 'DELETE'
    });
  },
  
  // Thêm sản phẩm vào đơn hàng
  addProductToOrder: async (orderId, productData) => {
    return await fetchApi(`/orders/${orderId}/items`, {
      method: 'POST',
      body: JSON.stringify(productData)
    });
  },
  
  // Cập nhật sản phẩm trong đơn hàng
  updateOrderItem: async (orderId, itemId, itemData) => {
    return await fetchApi(`/orders/${orderId}/items/${itemId}`, {
      method: 'PUT',
      body: JSON.stringify(itemData)
    });
  },
  
  // Xóa sản phẩm khỏi đơn hàng
  removeOrderItem: async (orderId, itemId) => {
    return await fetchApi(`/orders/${orderId}/items/${itemId}`, {
      method: 'DELETE'
    });
  },
  
  // Lấy đơn hàng theo bàn
  getOrdersByTable: async (tableId) => {
    return await fetchApi(`/orders/table/${tableId}`);
  },
  
  // Thanh toán đơn hàng
  checkoutOrder: async (orderId, paymentData) => {
    return await fetchApi(`/orders/${orderId}/checkout`, {
      method: 'POST',
      body: JSON.stringify(paymentData)
    });
  },
  
  // Lấy hóa đơn
  getInvoice: async (orderId) => {
    return await fetchApi(`/orders/${orderId}/invoice`);
  },
  
  // In hóa đơn
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