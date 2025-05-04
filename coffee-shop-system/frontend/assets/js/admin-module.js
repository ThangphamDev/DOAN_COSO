/**
 * admin-module.js
 * File chính kết hợp tất cả các module JavaScript cho trang admin
 */

// Khai báo namespace cho ứng dụng admin
window.T2KAdmin = window.T2KAdmin || {};

// Import tất cả module khi DOM đã sẵn sàng
document.addEventListener('DOMContentLoaded', async function() {
    // Tải core module trước
    await loadModule('../assets/js/admin-core.js');
    
    // Tải UI module
    await loadModule('../assets/js/admin-ui.js');
    
    // Xác định loại trang hiện tại để tải module phù hợp
    const currentPage = window.location.pathname.split('/').pop();
    
    // Tùy theo trang hiện tại mà tải các module phù hợp
    if (currentPage.includes('user')) {
        await loadModule('../assets/js/admin-entities.js');
    }
    else if (currentPage.includes('product') || currentPage.includes('categor') || currentPage.includes('staff')) {
        await loadModule('../assets/js/admin-entities.js');
    }
    else if (currentPage.includes('order') || currentPage.includes('table') || 
             currentPage.includes('promotion') || currentPage.includes('activit')) {
        await loadModule('../assets/js/admin-operations.js');
    }
    else if (currentPage.includes('dashboard')) {
        await loadModule('../assets/js/admin-operations.js');
    }
    
    // Khởi tạo ứng dụng sau khi tải tất cả module
    initializeAdmin();
});

/**
 * Tải một module JavaScript bằng Promises
 * @param {string} url - Đường dẫn đến file module
 * @returns {Promise} - Promise sẽ được resolved khi module được tải thành công
 */
function loadModule(url) {
    return new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = url;
        script.onload = () => resolve();
        script.onerror = () => reject(new Error(`Không thể tải module: ${url}`));
        document.head.appendChild(script);
    });
}

/**
 * Khởi tạo ứng dụng admin
 */
function initializeAdmin() {
    console.log('Khởi tạo ứng dụng admin...');
    
    // Kiểm tra API client
    if (!window.ApiClient) {
        console.error('API Client chưa được tải!');
        showToast('Không thể kết nối đến server', 'error');
        return;
    }
    
    // Kiểm tra xác thực người dùng
    checkAdminAuthentication();
    
    // Tải sidebar cho trang admin
    if (window.AdminCore && typeof window.AdminCore.loadSidebar === 'function') {
        window.AdminCore.loadSidebar();
    } else {
        console.error('Không thể tải sidebar: AdminCore không có sẵn hoặc không có hàm loadSidebar');
    }
    
    // Xác định trang hiện tại và khởi tạo các chức năng tương ứng
    const currentPage = window.location.pathname.split('/').pop();
    
    if (currentPage === 'dashboard.html' && window.AdminOperations) {
        window.AdminOperations.initializeDashboard();
    }
    else if (currentPage === 'user.html' && window.AdminEntities) {
        window.AdminEntities.initializeUserManagement();
    }
    else if (currentPage === 'products.html' && window.AdminEntities) {
        window.AdminEntities.initializeProductManagement();
        if (typeof AdminUI !== 'undefined' && typeof AdminUI.renderProductTable === 'function') {
            loadProducts(); // Tải dữ liệu sản phẩm
        } else {
            console.error("AdminUI or renderProductTable is not available for products page.");
        }
    }
    else if (currentPage === 'categories.html' && window.AdminEntities) {
        window.AdminEntities.initializeCategoryManagement();
    }
    else if (currentPage === 'staff.html' && window.AdminEntities) {
        window.AdminEntities.initializeStaffManagement();
    }
    else if (currentPage === 'tables.html' && window.AdminOperations) {
        window.AdminOperations.initializeTableManagement();
    }
    else if (currentPage === 'orders.html' && window.AdminOperations) {
        window.AdminOperations.initializeOrderManagement();
    }
    else if (currentPage === 'promotions.html' && window.AdminOperations) {
        window.AdminOperations.initializePromotionManagement();
    }
    else if (currentPage === 'activities.html' && window.AdminOperations) {
        window.AdminOperations.initializeActivityLog();
    }
}

/**
 * Kiểm tra xác thực người dùng admin
 */
function checkAdminAuthentication() {
    const token = localStorage.getItem('token');
    const role = localStorage.getItem('role');
    
    if (!token || !role || !role.toLowerCase().includes('admin')) {
        // Hiển thị cảnh báo nhưng không chuyển hướng người dùng
        console.warn('Người dùng chưa đăng nhập hoặc không phải admin');
        showToast('Bạn đang xem dữ liệu admin nhưng chưa đăng nhập. Một số chức năng có thể bị hạn chế.', 'warning');
        
        // Đặt tên mặc định cho admin
        const adminNameElement = document.getElementById('adminName');
        if (adminNameElement) {
            adminNameElement.textContent = 'Khách';
        }
        return;
    }
    
    // Hiển thị thông tin người dùng đã đăng nhập
    const fullName = localStorage.getItem('fullName') || 'Admin';
    const adminNameElement = document.getElementById('adminName');
    if (adminNameElement) {
        adminNameElement.textContent = fullName;
    }
}

/**
 * Hiển thị thông báo toast
 * @param {string} message - Nội dung thông báo
 * @param {string} type - Loại thông báo (success, error, warning, info)
 */
function showToast(message, type = 'info') {
    // Sử dụng AdminUI nếu có sẵn
    if (window.AdminUI && window.AdminUI.showToast) {
        window.AdminUI.showToast(message, type);
    } 
    // Fallback sang AdminCore nếu AdminUI chưa được tải
    else if (window.AdminCore && window.AdminCore.showNotification) {
        window.AdminCore.showNotification(message, type);
    } else {
        // Fallback nếu cả AdminUI và AdminCore chưa được tải
        let toast = document.querySelector('.toast');
        
        // Tạo mới nếu chưa có
        if (!toast) {
            toast = document.createElement('div');
            toast.className = 'toast';
            document.body.appendChild(toast);
        }
        
        // Thiết lập loại và nội dung thông báo
        toast.className = `toast ${type}`;
        
        let icon = 'fa-info-circle';
        if (type === 'success') icon = 'fa-check-circle';
        else if (type === 'error') icon = 'fa-times-circle';
        else if (type === 'warning') icon = 'fa-exclamation-triangle';
        
        toast.innerHTML = `
            <div class="toast-content">
                <i class="toast-icon fas ${icon}"></i>
                <div class="toast-message">${message}</div>
            </div>
            <button class="toast-close">&times;</button>
        `;
        
        // Hiển thị thông báo
        toast.classList.add('show');
        
        // Thêm sự kiện đóng thông báo
        const closeBtn = toast.querySelector('.toast-close');
        if (closeBtn) {
            closeBtn.addEventListener('click', function() {
                toast.classList.remove('show');
            });
        }
        
        // Tự động ẩn sau 5 giây
        setTimeout(() => {
            toast.classList.remove('show');
        }, 5000);
    }
}

// ==================== Product Management ====================
async function loadProducts() {
    try {
        console.log("Đang tải danh sách sản phẩm...");
        const products = await CafeAPI.getAllProducts(); // Gọi API để lấy sản phẩm
        console.log("Sản phẩm đã tải:", products);
        AdminUI.renderProductTable(products); // Gọi hàm UI để hiển thị
    } catch (error) {
        console.error("Lỗi khi tải danh sách sản phẩm:", error);
        // Hiển thị thông báo lỗi cho người dùng nếu cần
        AdminUI.showErrorMessage("Không thể tải danh sách sản phẩm. Vui lòng thử lại.");
    }
}

// Export hàm nếu cần thiết cho các module khác gọi
window.AdminModule = {
    loadProducts
};