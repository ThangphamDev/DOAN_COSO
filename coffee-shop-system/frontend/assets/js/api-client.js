
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
    return await fetchApi('/accounts/login', {
      method: 'POST',
      body: JSON.stringify({ userName: username, passWord: password })
    });
  },
  
  // Lấy tất cả tài khoản
  getAllAccounts: async (role = null) => {
    const endpoint = role ? `/accounts?role=${role}` : '/accounts';
    try {
      return await fetchApi(endpoint);
    } catch (error) {
      console.warn('Không thể lấy danh sách tài khoản, sử dụng dữ liệu mẫu:', error);
      if (role === 'staff') {
        return getMockStaffData().filter(account => account.role === 'staff');
      }
      return getMockStaffData();
    }
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
    try {
      // Lấy tất cả tài khoản
      return await fetchApi('/accounts');
    } catch (error) {
      console.warn('Không thể kết nối API nhân viên, sử dụng dữ liệu mẫu:', error);
      // Trả về dữ liệu mẫu nếu API lỗi
      return getMockStaffData();
    }
  },
  
  // Lấy nhân viên theo ID
  getStaffById: async (id) => {
    try {
      return await fetchApi(`/accounts/${id}`);
    } catch (error) {
      console.warn(`Không thể lấy thông tin nhân viên ID ${id}, sử dụng dữ liệu mẫu:`, error);
      const mockStaff = getMockStaffData();
      return mockStaff.find(staff => staff.id == id) || {};
    }
  },
  
  // Tạo nhân viên mới
  createStaff: async (staffData) => {
    try {
      // Lưu lại ảnh nếu có để hiển thị giả lập
      let imageData = null;
      if (staffData.image && staffData.image.startsWith('data:image')) {
        imageData = staffData.image;
      }
      
      // Loại bỏ ảnh khỏi dữ liệu gửi đi để tránh lỗi
      const apiStaffData = { ...staffData };
      delete apiStaffData.image;
      
      // Gọi API tạo tài khoản cơ bản (không gồm ảnh)
      console.log('Tạo tài khoản mới (không gồm ảnh)');
      const result = await fetchApi('/accounts', {
        method: 'POST',
        body: JSON.stringify(apiStaffData)
      });
      
      console.log('Tạo tài khoản thành công:', result);
      
      // Nếu có ảnh, lưu vào localStorage để dùng cho việc hiển thị
      if (imageData && result) {
        const staffId = result.idAccount || result.id;
        if (staffId) {
          try {
            const staffImages = JSON.parse(localStorage.getItem('staffImages') || '{}');
            staffImages[staffId] = imageData;
            localStorage.setItem('staffImages', JSON.stringify(staffImages));
            console.log('Đã lưu ảnh vào localStorage cho nhân viên mới, ID:', staffId);
            
            // Trả về kết quả kèm theo ảnh
            return {
              ...result,
              image: imageData
            };
          } catch (e) {
            console.warn('Không thể lưu ảnh vào localStorage:', e);
          }
        }
      }
      
      return result;
    } catch (error) {
      console.warn('Không thể tạo nhân viên:', error);
      // Ném lại lỗi để giao diện xử lý
      throw error;
    }
  },
  
  // Cập nhật thông tin nhân viên
  updateStaff: async (id, staffData) => {
    try {
      // Lưu lại ảnh nếu có để hiển thị giả lập
      let imageData = null;
      if (staffData.image && staffData.image.startsWith('data:image')) {
        imageData = staffData.image;
        
        // Lưu ảnh vào localStorage để dùng sau này
        try {
          const staffImages = JSON.parse(localStorage.getItem('staffImages') || '{}');
          staffImages[id] = imageData;
          localStorage.setItem('staffImages', JSON.stringify(staffImages));
          console.log('Đã lưu ảnh vào localStorage');
        } catch (e) {
          console.warn('Không thể lưu ảnh vào localStorage:', e);
        }
      }
      
      // Loại bỏ ảnh khỏi dữ liệu gửi đi để tránh lỗi
      const apiStaffData = { ...staffData };
      delete apiStaffData.image;
      
      // Gọi API cập nhật thông tin cơ bản
      console.log('Cập nhật thông tin nhân viên (không gồm ảnh)');
      const result = await fetchApi(`/accounts/${id}`, {
        method: 'PUT',
        body: JSON.stringify(apiStaffData)
      });
      
      console.log('Cập nhật thông tin thành công:', result);
      
      // Trả về kết quả kèm theo ảnh đã lưu (nếu có)
      if (imageData) {
        return {
          ...result,
          image: imageData
        };
      }
      
      return result;
    } catch (error) {
      console.warn(`Không thể cập nhật nhân viên ID ${id}:`, error);
      // Ném lại lỗi để giao diện xử lý
      throw error;
    }
  },
  
  // Xóa nhân viên
  deleteStaff: async (id) => {
    try {
      return await fetchApi(`/accounts/${id}`, {
        method: 'DELETE'
      });
    } catch (error) {
      console.warn(`Không thể xóa nhân viên ID ${id}, sử dụng response giả lập:`, error);
      // Giả lập response thành công
      return { 
        success: true,
        message: 'Xóa nhân viên thành công (Mock)'
      };
    }
  },
  
  // Cập nhật trạng thái nhân viên (đang làm việc/nghỉ việc)
  updateStaffStatus: async (id, isActive) => {
    try {
      return await fetchApi(`/accounts/${id}/status?active=${isActive}`, {
        method: 'PATCH'
      });
    } catch (error) {
      console.warn(`Không thể cập nhật trạng thái nhân viên ID ${id}, sử dụng response giả lập:`, error);
      // Giả lập response thành công
      return { 
        id: id,
        isActive: isActive,
        message: 'Cập nhật trạng thái nhân viên thành công (Mock)'
      };
    }
  },
  
  // Tải lên ảnh đại diện nhân viên
  uploadStaffAvatar: async (id, imageFile) => {
    const formData = new FormData();
    formData.append('avatar', imageFile);
    
    try {
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
    } catch (error) {
      console.warn(`Không thể upload ảnh cho nhân viên ID ${id}, sử dụng response giả lập:`, error);
      // Tạo blob URL cho preview
      let avatarUrl = '';
      if (imageFile) {
        avatarUrl = URL.createObjectURL(imageFile);
      }
      // Giả lập response thành công
      return { 
        id: id,
        avatar: avatarUrl || '/assets/images/default-avatar.png',
        message: 'Upload ảnh đại diện thành công (Mock)'
      };
    }
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

// Dữ liệu mẫu cho nhân viên
function getMockStaffData() {
  return [
    { 
      id: 1, 
      userName: 'admin', 
      fullName: 'Quản trị viên', 
      role: 'admin', 
      phone: '0987654321', 
      email: 'admin@t2kcoffee.com', 
      status: 'active',
      isActive: true,
      address: 'Hà Nội',
      image: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAGQAAABkCAYAAABw4pVUAAAABmJLR0QA/wD/AP+gvaeTAAADSUlEQVR4nO3dz0sUYRzH8ffMbmu5NCb04yjkLegmdAiyIqiL9BcUXTtEt+hmQUQU9BsUXTp0CaIPiEDx0r0OQhFREUixEB06mBubLrnjbM/TwfTH7szzzO6OM34/l2WZ7/Pw7Gd+zjz7DAghhBBCCCGEEEIIIYQQQgghhNhzlO4GMpnMCJD22YbVarc0m927ZTvL+8XcUzR2FGgfMFPtdkuz1W5pOpbKZrO/fRvxVECb8u2HYenELv+AUCqVSrfb7bZvO9JDJJAIkEAiQAKJAGtB0VCpDZRKpU4MDAw8GR0d7Wu1Wl/SNO1qmuYn34a6GchwLpe7MTQ0dKlQKBwG7hUKhaP5fP4VsBQEwcpuNhQEwVwikXidebtfzefzR9I07UM8AHVtSLt9PQzDa8D+jl0HgJ8rKytXkiTZ2K2GgiCYr9Vqb4BvsVisJ0mS/UAJ2Af0xvtdDaQHSHfxvARgvdvN/CuRJMn8xn9rQRBEEyCBRIAEEgGJbgeyC7ptw/OHvB8VmH0VwVqQXA+DuWdsLwCY++3Pu5DFubj0kAiQQCJAAokACcQCa0Gz712/cxWGuXdorjWvHuI6GTKUW42sH5JAIkACiQAJxAJrQbPvgR3fjvHNsOt7CFgPzF1r1npI14N2d7uBu8X6IQkkAiSQCJBALLAWNLueJMd6UOnmr/Nw2lw9pFQqzWB4AZOp+3a21W1BniBJkrk0TaeAP4Zh+HF4ePgMcAI4a3qPKBQKk/V6/TzwI5/P96RpehJ4CizX6/WpbDZ7ot1uXwTuA5+AW7lcbsL0PYZHvnw+/7BWqz0GbgIfgZlsNnvS9D2mjwhHRkbOrqys3AEmgYC/C+reAM+AD8DVMAznMpnMLJDe3N/V8Pz8/CtgDDgM9G3afgfECwmvAl+BaeAh8LxYLB5L03QJuL15cMMg3O2VhuGfBdBdzRWLxVLfmjVlOdMbhMEVjFg+1LrPRe1HdOsh2nXgw2O2vEN8e2YXcyGebWivQyw9Q7xvzrrHJpDAHLPUQ6LJUlAXl8F9b1DqHpvoXWuWzgzd3yHO2S3awbj0AJcxZn3Yl0AiQAKJAAkkAiSQCJBAIsDyc5Q/hxfY2X8/jy2NjY094f+Ur38BI0v0SNVk0IUAAAAASUVORK5CYII='
    },
    { 
      id: 2, 
      userName: 'nhanvien1', 
      fullName: 'Nguyễn Văn A', 
      role: 'staff', 
      phone: '0123456789', 
      email: 'nva@t2kcoffee.com', 
      status: 'active',
      isActive: true,
      address: 'Hà Nội',
      image: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAGQAAABkCAYAAABw4pVUAAAABmJLR0QA/wD/AP+gvaeTAAADSUlEQVR4nO3dz0sUYRzH8ffMbmu5NCb04yjkLegmdAiyIqiL9BcUXTtEt+hmQUQU9BsUXTp0CaIPiEDx0r0OQhFREUixEB06mBubLrnjbM/TwfTH7szzzO6OM34/l2WZ7/Pw7Gd+zjz7DAghhBBCCCGEEEIIIYQQQgghhNhzlO4GMpnMCJD22YbVarc0m927ZTvL+8XcUzR2FGgfMFPtdkuz1W5pOpbKZrO/fRvxVECb8u2HYenELv+AUCqVSrfb7bZvO9JDJJAIkEAiQAKJAGtB0VCpDZRKpU4MDAw8GR0d7Wu1Wl/SNO1qmuYn34a6GchwLpe7MTQ0dKlQKBwG7hUKhaP5fP4VsBQEwcpuNhQEwVwikXidebtfzefzR9I07UM8AHVtSLt9PQzDa8D+jl0HgJ8rKytXkiTZ2K2GgiCYr9Vqb4BvsVisJ0mS/UAJ2Af0xvtdDaQHSHfxvARgvdvN/CuRJMn8xn9rQRBEEyCBRIAEEgGJbgeyC7ptw/OHvB8VmH0VwVqQXA+DuWdsLwCY++3Pu5DFubj0kAiQQCJAAokACcQCa0Gz712/cxWGuXdorjWvHuI6GTKUW42sH5JAIkACiQAJxAJrQbPvgR3fjvHNsOt7CFgPzF1r1npI14N2d7uBu8X6IQkkAiSQCJBALLAWNLueJMd6UOnmr/Nw2lw9pFQqzWB4AZOp+3a21W1BniBJkrk0TaeAP4Zh+HF4ePgMcAI4a3qPKBQKk/V6/TzwI5/P96RpehJ4CizX6/WpbDZ7ot1uXwTuA5+AW7lcbsL0PYZHvnw+/7BWqz0GbgIfgZlsNnvS9D2mjwhHRkbOrqys3AEmgYC/C+reAM+AD8DVMAznMpnMLJDe3N/V8Pz8/CtgDDgM9G3afgfECwmvAl+BaeAh8LxYLB5L03QJuL15cMMg3O2VhuGfBdBdzRWLxVLfmjVlOdMbhMEVjFg+1LrPRe1HdOsh2nXgw2O2vEN8e2YXcyGebWivQyw9Q7xvzrrHJpDAHLPUQ6LJUlAXl8F9b1DqHpvoXWuWzgzd3yHO2S3awbj0AJcxZn3Yl0AiQAKJAAkkAiSQCJBAIsDyc5Q/hxfY2X8/jy2NjY094f+Ur38BI0v0SNVk0IUAAAAASUVORK5CYII='
    },
    { 
      id: 3, 
      userName: 'nhanvien2', 
      fullName: 'Trần Thị B', 
      role: 'staff', 
      phone: '0369852147', 
      email: 'ttb@t2kcoffee.com', 
      status: 'inactive',
      isActive: false,
      address: 'Hồ Chí Minh',
      image: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAGQAAABkCAYAAABw4pVUAAAABmJLR0QA/wD/AP+gvaeTAAADSUlEQVR4nO3dz0sUYRzH8ffMbmu5NCb04yjkLegmdAiyIqiL9BcUXTtEt+hmQUQU9BsUXTp0CaIPiEDx0r0OQhFREUixEB06mBubLrnjbM/TwfTH7szzzO6OM34/l2WZ7/Pw7Gd+zjz7DAghhBBCCCGEEEIIIYQQQgghhNhzlO4GMpnMCJD22YbVarc0m927ZTvL+8XcUzR2FGgfMFPtdkuz1W5pOpbKZrO/fRvxVECb8u2HYenELv+AUCqVSrfb7bZvO9JDJJAIkEAiQAKJAGtB0VCpDZRKpU4MDAw8GR0d7Wu1Wl/SNO1qmuYn34a6GchwLpe7MTQ0dKlQKBwG7hUKhaP5fP4VsBQEwcpuNhQEwVwikXidebtfzefzR9I07UM8AHVtSLt9PQzDa8D+jl0HgJ8rKytXkiTZ2K2GgiCYr9Vqb4BvsVisJ0mS/UAJ2Af0xvtdDaQHSHfxvARgvdvN/CuRJMn8xn9rQRBEEyCBRIAEEgGJbgeyC7ptw/OHvB8VmH0VwVqQXA+DuWdsLwCY++3Pu5DFubj0kAiQQCJAAokACcQCa0Gz712/cxWGuXdorjWvHuI6GTKUW42sH5JAIkACiQAJxAJrQbPvgR3fjvHNsOt7CFgPzF1r1npI14N2d7uBu8X6IQkkAiSQCJBALLAWNLueJMd6UOnmr/Nw2lw9pFQqzWB4AZOp+3a21W1BniBJkrk0TaeAP4Zh+HF4ePgMcAI4a3qPKBQKk/V6/TzwI5/P96RpehJ4CizX6/WpbDZ7ot1uXwTuA5+AW7lcbsL0PYZHvnw+/7BWqz0GbgIfgZlsNnvS9D2mjwhHRkbOrqys3AEmgYC/C+reAM+AD8DVMAznMpnMLJDe3N/V8Pz8/CtgDDgM9G3afgfECwmvAl+BaeAh8LxYLB5L03QJuL15cMMg3O2VhuGfBdBdzRWLxVLfmjVlOdMbhMEVjFg+1LrPRe1HdOsh2nXgw2O2vEN8e2YXcyGebWivQyw9Q7xvzrrHJpDAHLPUQ6LJUlAXl8F9b1DqHpvoXWuWzgzd3yHO2S3awbj0AJcxZn3Yl0AiQAKJAAkkAiSQCJBAIsDyc5Q/hxfY2X8/jy2NjY094f+Ur38BI0v0SNVk0IUAAAAASUVORK5CYII='
    }
  ];
}

// API cho quản lý bàn
const TableApi = {
  // Lấy tất cả bàn
  getAllTables: async () => {
    try {
      return await fetchApi('/tables');
    } catch (error) {
      console.warn('Không thể lấy danh sách bàn, sử dụng dữ liệu mẫu:', error);
      return getMockTableData();
    }
  },
  
  // Lấy thông tin bàn theo ID
  getTableById: async (id) => {
    try {
      return await fetchApi(`/tables/${id}`);
    } catch (error) {
      console.warn(`Không thể lấy thông tin bàn ID ${id}, sử dụng dữ liệu mẫu:`, error);
      const mockTables = getMockTableData();
      return mockTables.find(table => table.id == id) || {};
    }
  },
  
  // Tạo bàn mới
  createTable: async (tableData) => {
    try {
      return await fetchApi('/tables', {
        method: 'POST',
        body: JSON.stringify(tableData)
      });
    } catch (error) {
      console.warn('Không thể tạo bàn mới:', error);
      // Giả lập tạo thành công với ID mới
      return {
        id: new Date().getTime(),
        ...tableData,
        message: 'Tạo bàn mới thành công (Mock)'
      };
    }
  },
  
  // Cập nhật thông tin bàn
  updateTable: async (id, tableData) => {
    try {
      return await fetchApi(`/tables/${id}`, {
        method: 'PUT',
        body: JSON.stringify(tableData)
      });
    } catch (error) {
      console.warn(`Không thể cập nhật bàn ID ${id}:`, error);
      return {
        id: id,
        ...tableData,
        message: 'Cập nhật bàn thành công (Mock)'
      };
    }
  },
  
  // Cập nhật trạng thái bàn
  updateTableStatus: async (id, status) => {
    try {
      return await fetchApi(`/tables/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status })
      });
    } catch (error) {
      console.warn(`Không thể cập nhật trạng thái bàn ID ${id}:`, error);
      return {
        id: id,
        status: status,
        message: 'Cập nhật trạng thái bàn thành công (Mock)'
      };
    }
  },
  
  // Xóa bàn
  deleteTable: async (id) => {
    try {
      return await fetchApi(`/tables/${id}`, {
        method: 'DELETE'
      });
    } catch (error) {
      console.warn(`Không thể xóa bàn ID ${id}:`, error);
      return {
        success: true,
        message: 'Xóa bàn thành công (Mock)'
      };
    }
  },
  
  // Lấy danh sách bàn theo trạng thái
  getTablesByStatus: async (status) => {
    try {
      return await fetchApi(`/tables/status/${status}`);
    } catch (error) {
      console.warn(`Không thể lấy danh sách bàn theo trạng thái ${status}:`, error);
      const mockTables = getMockTableData();
      return mockTables.filter(table => table.status === status);
    }
  },
  
  // Hợp nhất các bàn
  mergeTables: async (sourceTableId, targetTableId) => {
    try {
      return await fetchApi('/tables/merge', {
        method: 'POST',
        body: JSON.stringify({
          sourceTableId,
          targetTableId
        })
      });
    } catch (error) {
      console.warn(`Không thể hợp nhất bàn ${sourceTableId} vào bàn ${targetTableId}:`, error);
      return {
        success: true,
        message: 'Hợp nhất bàn thành công (Mock)'
      };
    }
  }
};

// API cho quản lý đơn hàng
const OrderApi = {
  // Lấy tất cả đơn hàng
  getAllOrders: async (page = 1, limit = 10) => {
    try {
      return await fetchApi(`/orders?page=${page}&limit=${limit}`);
    } catch (error) {
      console.warn('Không thể lấy danh sách đơn hàng, sử dụng dữ liệu mẫu:', error);
      return {
        orders: getMockOrderData(),
        page,
        limit,
        totalOrders: getMockOrderData().length,
        totalPages: Math.ceil(getMockOrderData().length / limit)
      };
    }
  },
  
  // Lấy thông tin đơn hàng theo ID
  getOrderById: async (id) => {
    try {
      return await fetchApi(`/orders/${id}`);
    } catch (error) {
      console.warn(`Không thể lấy thông tin đơn hàng ID ${id}, sử dụng dữ liệu mẫu:`, error);
      const mockOrders = getMockOrderData();
      return mockOrders.find(order => order.id == id) || {};
    }
  },
  
  // Tạo đơn hàng mới
  createOrder: async (orderData) => {
    try {
      return await fetchApi('/orders', {
        method: 'POST',
        body: JSON.stringify(orderData)
      });
    } catch (error) {
      console.warn('Không thể tạo đơn hàng mới:', error);
      // Giả lập ID đơn hàng mới
      const newOrderId = new Date().getTime();
      return {
        id: newOrderId,
        ...orderData,
        status: 'pending',
        createdAt: new Date().toISOString(),
        message: 'Tạo đơn hàng mới thành công (Mock)'
      };
    }
  },
  
  // Cập nhật thông tin đơn hàng
  updateOrder: async (id, orderData) => {
    try {
      return await fetchApi(`/orders/${id}`, {
        method: 'PUT',
        body: JSON.stringify(orderData)
      });
    } catch (error) {
      console.warn(`Không thể cập nhật đơn hàng ID ${id}:`, error);
      return {
        id: id,
        ...orderData,
        message: 'Cập nhật đơn hàng thành công (Mock)'
      };
    }
  },
  
  // Cập nhật trạng thái đơn hàng
  updateOrderStatus: async (id, status) => {
    try {
      return await fetchApi(`/orders/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status })
      });
    } catch (error) {
      console.warn(`Không thể cập nhật trạng thái đơn hàng ID ${id}:`, error);
      return {
        id: id,
        status: status,
        message: 'Cập nhật trạng thái đơn hàng thành công (Mock)'
      };
    }
  },
  
  // Xóa đơn hàng
  deleteOrder: async (id) => {
    try {
      return await fetchApi(`/orders/${id}`, {
        method: 'DELETE'
      });
    } catch (error) {
      console.warn(`Không thể xóa đơn hàng ID ${id}:`, error);
      return {
        success: true,
        message: 'Xóa đơn hàng thành công (Mock)'
      };
    }
  },
  
  // Thêm sản phẩm vào đơn hàng
  addProductToOrder: async (orderId, productData) => {
    try {
      return await fetchApi(`/orders/${orderId}/items`, {
        method: 'POST',
        body: JSON.stringify(productData)
      });
    } catch (error) {
      console.warn(`Không thể thêm sản phẩm vào đơn hàng ID ${orderId}:`, error);
      return {
        orderId,
        item: {
          id: new Date().getTime(),
          ...productData
        },
        message: 'Thêm sản phẩm vào đơn hàng thành công (Mock)'
      };
    }
  },
  
  // Cập nhật sản phẩm trong đơn hàng
  updateOrderItem: async (orderId, itemId, itemData) => {
    try {
      return await fetchApi(`/orders/${orderId}/items/${itemId}`, {
        method: 'PUT',
        body: JSON.stringify(itemData)
      });
    } catch (error) {
      console.warn(`Không thể cập nhật sản phẩm ${itemId} trong đơn hàng ID ${orderId}:`, error);
      return {
        orderId,
        itemId,
        ...itemData,
        message: 'Cập nhật sản phẩm trong đơn hàng thành công (Mock)'
      };
    }
  },
  
  // Xóa sản phẩm khỏi đơn hàng
  removeOrderItem: async (orderId, itemId) => {
    try {
      return await fetchApi(`/orders/${orderId}/items/${itemId}`, {
        method: 'DELETE'
      });
    } catch (error) {
      console.warn(`Không thể xóa sản phẩm ${itemId} khỏi đơn hàng ID ${orderId}:`, error);
      return {
        success: true,
        message: 'Xóa sản phẩm khỏi đơn hàng thành công (Mock)'
      };
    }
  },
  
  // Lấy đơn hàng theo bàn
  getOrdersByTable: async (tableId) => {
    try {
      return await fetchApi(`/orders/table/${tableId}`);
    } catch (error) {
      console.warn(`Không thể lấy đơn hàng cho bàn ID ${tableId}:`, error);
      const mockOrders = getMockOrderData();
      return mockOrders.filter(order => order.tableId == tableId);
    }
  },
  
  // Thanh toán đơn hàng
  checkoutOrder: async (orderId, paymentData) => {
    try {
      return await fetchApi(`/orders/${orderId}/checkout`, {
        method: 'POST',
        body: JSON.stringify(paymentData)
      });
    } catch (error) {
      console.warn(`Không thể thanh toán đơn hàng ID ${orderId}:`, error);
      return {
        orderId,
        status: 'completed',
        paidAmount: paymentData.amount,
        paymentMethod: paymentData.method,
        completedAt: new Date().toISOString(),
        message: 'Thanh toán đơn hàng thành công (Mock)'
      };
    }
  },
  
  // Lấy hóa đơn
  getInvoice: async (orderId) => {
    try {
      return await fetchApi(`/orders/${orderId}/invoice`);
    } catch (error) {
      console.warn(`Không thể lấy hóa đơn cho đơn hàng ID ${orderId}:`, error);
      // Giả lập dữ liệu hóa đơn
      const mockOrder = getMockOrderData().find(order => order.id == orderId);
      if (!mockOrder) return {};
      
      return {
        invoiceId: `INV-${orderId}`,
        orderId: orderId,
        items: mockOrder.items || [],
        subtotal: mockOrder.subtotal || 0,
        discount: mockOrder.discount || 0,
        tax: mockOrder.tax || 0,
        total: mockOrder.total || 0,
        paymentMethod: mockOrder.paymentMethod || 'cash',
        createdAt: mockOrder.createdAt || new Date().toISOString()
      };
    }
  },
  
  // In hóa đơn
  printInvoice: async (orderId) => {
    try {
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
    } catch (error) {
      console.warn(`Không thể in hóa đơn cho đơn hàng ID ${orderId}:`, error);
      return {
        success: true,
        message: 'Đã gửi lệnh in hóa đơn tới máy in (Mock)'
      };
    }
  }
};

// Dữ liệu mẫu cho bàn
function getMockTableData() {
  return [
    {
      id: 1,
      name: 'Bàn 1',
      capacity: 4,
      area: 'Tầng 1',
      status: 'available', // available, occupied, reserved, cleaning
      note: ''
    },
    {
      id: 2,
      name: 'Bàn 2',
      capacity: 2,
      area: 'Tầng 1',
      status: 'occupied',
      note: ''
    },
    {
      id: 3,
      name: 'Bàn 3',
      capacity: 6,
      area: 'Tầng 1',
      status: 'reserved',
      note: 'Đặt trước lúc 18:00'
    },
    {
      id: 4,
      name: 'Bàn 4',
      capacity: 4,
      area: 'Tầng 1',
      status: 'available',
      note: ''
    },
    {
      id: 5,
      name: 'Bàn VIP 1',
      capacity: 8,
      area: 'Tầng 2',
      status: 'available',
      note: 'Bàn VIP'
    }
  ];
}

// Dữ liệu mẫu cho đơn hàng
function getMockOrderData() {
  return [
    {
      id: 1,
      tableId: 2,
      staffId: 2,
      customerName: 'Khách lẻ',
      status: 'in-progress', // pending, in-progress, completed, cancelled
      items: [
        {
          id: 1,
          productId: 1,
          name: 'Cà phê đen',
          price: 25000,
          quantity: 2,
          note: 'Ít đá'
        },
        {
          id: 2,
          productId: 5,
          name: 'Bánh ngọt',
          price: 35000,
          quantity: 1,
          note: ''
        }
      ],
      subtotal: 85000,
      discount: 0,
      tax: 0,
      total: 85000,
      createdAt: '2023-06-15T08:30:00Z',
      updatedAt: '2023-06-15T08:45:00Z'
    },
    {
      id: 2,
      tableId: 3,
      staffId: 2,
      customerName: 'Nguyễn Văn A',
      customerPhone: '0987654321',
      status: 'completed',
      items: [
        {
          id: 1,
          productId: 2,
          name: 'Cà phê sữa',
          price: 30000,
          quantity: 3,
          note: ''
        },
        {
          id: 2,
          productId: 6,
          name: 'Sinh tố dâu',
          price: 45000,
          quantity: 2,
          note: 'Ít đường'
        }
      ],
      subtotal: 180000,
      discount: 10000,
      tax: 0,
      total: 170000,
      paymentMethod: 'cash',
      createdAt: '2023-06-14T14:20:00Z',
      updatedAt: '2023-06-14T15:30:00Z',
      completedAt: '2023-06-14T15:30:00Z'
    },
    {
      id: 3,
      tableId: null, // Đơn hàng mang đi
      staffId: 3,
      customerName: 'Trần Thị B',
      customerPhone: '0123456789',
      status: 'pending',
      orderType: 'takeaway',
      items: [
        {
          id: 1,
          productId: 3,
          name: 'Trà chanh',
          price: 25000,
          quantity: 5,
          note: 'Nhiều đá'
        }
      ],
      subtotal: 125000,
      discount: 0,
      tax: 0,
      total: 125000,
      createdAt: '2023-06-15T09:15:00Z',
      updatedAt: '2023-06-15T09:15:00Z'
    }
  ];
}

// Xuất các API để sử dụng trong các file khác
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