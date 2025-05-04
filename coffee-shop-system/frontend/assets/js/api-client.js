/**
 * API Client cho T2K Coffee
 * File này cung cấp các hàm gọi API backend
 */

// URL cơ sở của API
const API_BASE_URL = 'http://localhost:8081/api';

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
      mode: 'cors' // Thêm chế độ CORS
    };

    // Kết hợp options mặc định với options được cung cấp
    const fetchOptions = { ...defaultOptions, ...options };
    
    // Nếu có token trong localStorage, thêm vào header
    const token = localStorage.getItem('token');
    if (token) {
      fetchOptions.headers.Authorization = `Bearer ${token}`;
    }

    console.log(`Gọi API: ${API_BASE_URL}${endpoint}`, fetchOptions);
    
    // Gọi API
    const response = await fetch(`${API_BASE_URL}${endpoint}`, fetchOptions);
    
    // Xử lý lỗi HTTP
    if (!response.ok) {
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
    return await fetchApi('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password })
    });
  },
  
  // Lấy thông tin người dùng hiện tại
  getCurrentUser: async () => {
    return await fetchApi('/auth/me');
  },
  
  // Đăng xuất
  logout: async () => {
    localStorage.removeItem('token');
    return await fetchApi('/auth/logout', { method: 'POST' });
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
      body: JSON.stringify(productData)
    });
  },
  
  // Cập nhật sản phẩm
  updateProduct: async (id, productData) => {
    return await fetchApi(`/products/${id}`, {
      method: 'PUT',
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
    return await fetchApi(`/products/${id}/status?available=${isAvailable}`, {
      method: 'PATCH'
    });
  }
};

// API cho nhân viên
const StaffApi = {
  // Lấy tất cả nhân viên
  getAllStaff: async () => {
    return await fetchApi('/staffs');
  },
  
  // Lấy nhân viên theo ID
  getStaffById: async (id) => {
    return await fetchApi(`/staffs/${id}`);
  },
  
  // Tạo nhân viên mới
  createStaff: async (staffData) => {
    return await fetchApi('/staffs', {
      method: 'POST',
      body: JSON.stringify(staffData)
    });
  },
  
  // Cập nhật thông tin nhân viên
  updateStaff: async (id, staffData) => {
    return await fetchApi(`/staffs/${id}`, {
      method: 'PUT',
      body: JSON.stringify(staffData)
    });
  },
  
  // Xóa nhân viên
  deleteStaff: async (id) => {
    return await fetchApi(`/staffs/${id}`, {
      method: 'DELETE'
    });
  },
  
  // Cập nhật trạng thái nhân viên (đang làm việc/nghỉ việc)
  updateStaffStatus: async (id, isActive) => {
    return await fetchApi(`/staffs/${id}/status?active=${isActive}`, {
      method: 'PATCH'
    });
  },
  
  // Tải lên ảnh đại diện nhân viên
  uploadStaffAvatar: async (id, imageFile) => {
    const formData = new FormData();
    formData.append('avatar', imageFile);
    
    return await fetch(`${API_BASE_URL}/staffs/${id}/avatar`, {
      method: 'POST',
      body: formData,
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    }).then(response => {
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      return response.json();
    });
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

// Xuất các API để sử dụng trong các file khác
window.ApiClient = {
  Activity: ActivityApi,
  Promotion: PromotionApi,
  Account: AccountApi,
  Category: CategoryApi,
  Product: ProductApi,
  Staff: StaffApi,
  Report: ReportApi,
  clearCache: clearApiCache,
  invalidateCache: invalidateCache
};