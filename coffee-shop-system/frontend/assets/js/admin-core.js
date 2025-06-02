/**
 * admin-core.js
 * Tập hợp các chức năng cốt lõi dùng chung cho trang admin
 */

document.addEventListener('DOMContentLoaded', function() {
    // Kiểm tra xác thực người dùng - Ưu tiên cao nhất
    if (!checkAdminAuthentication()) {
        // Nếu không xác thực, dừng thực thi
        console.log('Không thể xác thực người dùng - Dừng tải trang admin');
        return;
    }
    
    // Chỉ chạy các bước tiếp theo nếu đã xác thực thành công
    
    // Kiểm tra kết nối API
    checkApiConnection();
    
    // Tải sidebar
    loadSidebar();
    
    // Đánh dấu menu active dựa trên URL hiện tại
    markActiveMenu();
    
    // Thiết lập sự kiện cho menu và điều hướng
    setupNavigation();
});

/**
 * Kiểm tra xác thực người dùng admin
 */
function checkAdminAuthentication() {
    const token = localStorage.getItem('token');
    const role = localStorage.getItem('role');
    
    console.log("Admin Core - Checking authentication");
    
    if (!token) {
        console.warn("No authentication token found. Redirecting to login...");
        redirectToLogin();
        return false;
    }
    
    // Kiểm tra role có phải là admin không
    if (!role || !role.toLowerCase().includes('admin')) {
        console.warn(`User role (${role}) is not authorized for admin panel. Redirecting...`);
        redirectToLogin();
        return false;
    }
    
    // Kiểm tra token có đúng định dạng JWT không
    if (!isValidJWT(token)) {
        console.warn("Invalid token format. Redirecting to login...");
        redirectToLogin();
        return false;
    }
    
    // Thêm Authorization header cho mọi request
    setupRequestInterceptor(token);
    
    // Hiển thị thông tin người dùng đã đăng nhập
    const fullName = localStorage.getItem('fullName') || 'Admin';
    document.getElementById('adminName').textContent = fullName;
    return true;
}

/**
 * Kiểm tra kết nối tới API
 */
async function checkApiConnection() {
    try {
        if (!window.ApiClient) {
            console.error('API Client chưa được tải!');
            showNotification('Không thể kết nối đến server', 'error');
            return false;
        }
        
        console.log('API Client đã được tải thành công');
        return true;
    } catch (error) {
        console.error('Lỗi khi kiểm tra kết nối API:', error);
        showNotification('Cảnh báo: Không thể kết nối đến máy chủ.', 'warning');
        return false;
    }
}

/**
 * Tải sidebar từ file chung
 */
async function loadSidebar() {
    const sidebarContainer = document.querySelector('.sidebar-container');
    if (!sidebarContainer) return;
    
    try {
        const response = await fetch('../includes/sidebar.html');
        if (response.ok) {
            const html = await response.text();
            sidebarContainer.innerHTML = html;
            console.log('Sidebar đã được tải thành công');
            
            // Thiết lập các sự kiện cho sidebar sau khi tải
            setupSidebar();
            
            // Đánh dấu menu active dựa trên URL hiện tại
            markActiveMenu();
        } else {
            console.error('Không thể tải sidebar:', response.status);
            sidebarContainer.innerHTML = '<div class="error-message">Không thể tải menu. Vui lòng làm mới trang.</div>';
        }
    } catch (error) {
        console.error('Lỗi khi tải sidebar:', error);
        sidebarContainer.innerHTML = '<div class="error-message">Lỗi khi tải menu. Vui lòng làm mới trang.</div>';
    }
}

/**
 * Thiết lập sự kiện cho sidebar
 */
function setupSidebar() {
    // Xử lý nút đăng xuất
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', function(e) {
            e.preventDefault();
            logout();
        });
    }
    
    // Xử lý dropdown trong sidebar (nếu có)
    const dropdownToggles = document.querySelectorAll('.sidebar .dropdown-toggle');
    dropdownToggles.forEach(toggle => {
        toggle.addEventListener('click', function(e) {
            e.preventDefault();
            const parent = this.parentElement;
            parent.classList.toggle('open');
        });
    });

    // Thêm xử lý click cho avatar để hiển thị dropdown
    const adminProfile = document.querySelector('.admin-profile');
    if (adminProfile) {
        adminProfile.addEventListener('click', function(e) {
            e.stopPropagation();
            this.classList.toggle('active');
        });

        // Đảm bảo menu dropdown không tự đóng khi click vào nó
        const dropdownMenu = adminProfile.querySelector('.dropdown-menu');
        if (dropdownMenu) {
            dropdownMenu.addEventListener('click', function(e) {
                e.stopPropagation();
            });
        }

        // Đóng menu khi click bên ngoài
        document.addEventListener('click', function() {
            adminProfile.classList.remove('active');
        });
    }
}

/**
 * Đánh dấu menu active dựa trên URL hiện tại
 */
function markActiveMenu() {
    // Lấy tên file từ URL
    const currentPage = window.location.pathname.split('/').pop();
    
    // Tìm tất cả các liên kết trong sidebar
    const menuLinks = document.querySelectorAll('.admin-nav a');
    
    // Loại bỏ class active khỏi tất cả các menu items
    const menuItems = document.querySelectorAll('.admin-nav li');
    menuItems.forEach(item => {
        item.classList.remove('active');
    });
    
    // Thêm class active cho menu item tương ứng với trang hiện tại
    menuLinks.forEach(link => {
        const href = link.getAttribute('href');
        if (href && currentPage.includes(href) || 
            (currentPage === '' && href.includes('dashboard.html'))) {
            link.parentElement.classList.add('active');
        }
    });
    
    // Nếu đang ở trang dashboard
    if (currentPage === '' || currentPage === 'dashboard.html') {
        const dashboardMenu = document.getElementById('menu-dashboard');
        if (dashboardMenu) {
            dashboardMenu.classList.add('active');
        }
    }
}

/**
 * Thiết lập điều hướng
 */
function setupNavigation() {
    // Theo dõi các sự kiện click trên các liên kết trong sidebar
    document.addEventListener('click', function(e) {
        // Kiểm tra xem phần tử được click có phải là liên kết trong sidebar không
        if (e.target.tagName === 'A' && e.target.closest('.admin-nav')) {
            // Xử lý nếu cần
        }
    });
}

/**
 * Đăng xuất người dùng
 */
function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    localStorage.removeItem('userId');
    localStorage.removeItem('fullName');
    
    // Chuyển hướng về trang đăng nhập
    window.location.href = '../auth/login.html';
}

/**
 * Hiển thị loader
 */
function showLoader(show) {
    const loader = document.getElementById('loader');
    if (loader) {
        loader.style.display = show ? 'flex' : 'none';
    }
}

/**
 * Hiển thị thông báo (được sử dụng ở nhiều trang)
 */
function showNotification(message, type = 'info') {
    // Kiểm tra xem thông báo đã tồn tại chưa
    let toast = document.querySelector('.toast');
    
    // Tạo mới nếu chưa có
    if (!toast) {
        toast = document.createElement('div');
        toast.className = 'toast';
        document.body.appendChild(toast);
    }
    
    // Thiết lập loại và nội dung thông báo
    toast.className = `toast ${type}`;
    toast.innerHTML = `
        <div class="toast-content">
            <i class="toast-icon fas ${getIconForType(type)}"></i>
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

/**
 * Lấy biểu tượng phù hợp cho loại thông báo
 */
function getIconForType(type) {
    switch (type) {
        case 'success':
            return 'fa-check-circle';
        case 'error':
            return 'fa-times-circle';
        case 'warning':
            return 'fa-exclamation-triangle';
        case 'info':
        default:
            return 'fa-info-circle';
    }
}

/**
 * Trả về các hàm dùng chung để các module khác có thể sử dụng
 */
window.AdminCore = {
    showLoader,
    showNotification,
    checkApiConnection,
    logout,
    markActiveMenu,
    loadSidebar,
    
    // Bảo vệ trang admin không cho người dùng chưa xác thực truy cập
    protectAdminPage: function() {
        const token = localStorage.getItem('token');
        const role = localStorage.getItem('role');
        
        if (!token || !role || !role.toLowerCase().includes('admin')) {
            // Lưu URL hiện tại để đăng nhập xong quay lại
            const currentPath = window.location.pathname;
            if (currentPath.includes('/admin/')) {
                localStorage.setItem('redirectAfterLogin', currentPath);
            }
            
            // Chuyển hướng về trang đăng nhập
            window.location.href = '../auth/login.html';
            return false;
        }
        return true;
    },
    
    // Đảm bảo các hàm khởi tạo chỉ được gọi một lần
    initializeOnce: function(functionName, initFunction) {
        // Tạo object để lưu trạng thái nếu chưa có
        if (!window.initializationStatus) {
            window.initializationStatus = {};
        }
        
        // Nếu hàm chưa được khởi tạo
        if (!window.initializationStatus[functionName]) {
            console.log(`Khởi tạo lần đầu: ${functionName}`);
            initFunction();
            window.initializationStatus[functionName] = true;
            return true;
        } else {
            console.log(`Bỏ qua, đã khởi tạo trước đó: ${functionName}`);
            return false;
        }
    }
};

// Khởi tạo Bootstrap components
function initBootstrap() {
    // Kiểm tra xem Bootstrap đã được tải chưa
    if (typeof bootstrap !== 'undefined') {
        console.log('Bootstrap đã được tải, đang khởi tạo components...');
        
        // Khởi tạo các tooltips
        const tooltips = document.querySelectorAll('[data-bs-toggle="tooltip"]');
        if (tooltips.length > 0) {
            tooltips.forEach(tooltip => {
                new bootstrap.Tooltip(tooltip);
            });
        }
        
        // Khởi tạo popover
        const popovers = document.querySelectorAll('[data-bs-toggle="popover"]');
        if (popovers.length > 0) {
            popovers.forEach(popover => {
                new bootstrap.Popover(popover);
            });
        }
        
        // Khởi tạo các modal
        const modals = document.querySelectorAll('.modal');
        console.log(`Tìm thấy ${modals.length} modals để khởi tạo`);
        modals.forEach(modal => {
            try {
                // Tạo một instance bootstrap modal
                const modalInstance = new bootstrap.Modal(modal);
                console.log(`Đã khởi tạo modal #${modal.id}`);
                
                // Lưu instance vào dataset để sử dụng sau này
                modal.dataset.bsInstance = "initialized";
                
                // Bắt sự kiện ẩn.bs.modal để xử lý sau khi modal đóng
                modal.addEventListener('hidden.bs.modal', function () {
                    console.log(`Modal #${modal.id} đã đóng`);
                    // Có thể thêm logic làm sạch form tại đây
                });
            } catch (error) {
                console.error(`Lỗi khi khởi tạo modal #${modal.id}:`, error);
            }
        });
        
        // Xử lý các nút mở modal
        const modalTriggers = document.querySelectorAll('[data-bs-toggle="modal"]');
        modalTriggers.forEach(trigger => {
            trigger.addEventListener('click', function() {
                const targetSelector = this.getAttribute('data-bs-target');
                if (!targetSelector) return;
                
                const modal = document.querySelector(targetSelector);
                if (!modal) return;
                
                try {
                    // Lấy instance hoặc tạo mới
                    let modalInstance = bootstrap.Modal.getInstance(modal);
                    if (!modalInstance) {
                        modalInstance = new bootstrap.Modal(modal);
                    }
                    modalInstance.show();
                } catch (error) {
                    console.error('Lỗi khi mở modal:', error);
                    modal.style.display = 'block';
                }
            });
        });
        
        console.log('Bootstrap components đã được khởi tạo thành công');
    } else {
        console.warn('Bootstrap không được tìm thấy, sẽ sử dụng modal đơn giản.');
        
        // Khởi tạo phiên bản đơn giản của modal nếu không có Bootstrap
        initSimpleModals();
    }
}

// Hàm global để mở modal an toàn
window.AdminCore.openModal = function(modalId) {
    console.log(`Đang mở modal #${modalId}`);
    const modal = document.getElementById(modalId);
    if (!modal) {
        console.error(`Không tìm thấy modal với ID: ${modalId}`);
        return;
    }
    
    try {
        if (typeof bootstrap !== 'undefined') {
            let modalInstance = bootstrap.Modal.getInstance(modal);
            if (!modalInstance) {
                modalInstance = new bootstrap.Modal(modal);
            }
            modalInstance.show();
            console.log(`Đã mở modal #${modalId} bằng Bootstrap`);
        } else if (typeof $ !== 'undefined' && typeof $.fn.modal !== 'undefined') {
            $(modal).modal('show');
            console.log(`Đã mở modal #${modalId} bằng jQuery`);
        } else {
            modal.style.display = 'block';
            modal.classList.add('show');
            document.body.classList.add('modal-open');
            console.log(`Đã mở modal #${modalId} bằng CSS`);
            
            // Tạo backdrop
            if (!document.querySelector('.modal-backdrop')) {
                const backdrop = document.createElement('div');
                backdrop.className = 'modal-backdrop fade show';
                document.body.appendChild(backdrop);
            }
        }
    } catch (error) {
        console.error(`Lỗi khi mở modal #${modalId}:`, error);
        // Fallback
        modal.style.display = 'block';
    }
};

// Hàm global để đóng modal an toàn
window.AdminCore.closeModal = function(modalId) {
    console.log(`Đang đóng modal #${modalId}`);
    const modal = document.getElementById(modalId);
    if (!modal) {
        console.error(`Không tìm thấy modal với ID: ${modalId}`);
        return;
    }
    
    try {
        if (typeof bootstrap !== 'undefined') {
            const modalInstance = bootstrap.Modal.getInstance(modal);
            if (modalInstance) {
                modalInstance.hide();
                console.log(`Đã đóng modal #${modalId} bằng Bootstrap`);
            } else {
                modal.style.display = 'none';
                console.log(`Đã đóng modal #${modalId} bằng CSS (không có instance Bootstrap)`);
            }
        } else if (typeof $ !== 'undefined' && typeof $.fn.modal !== 'undefined') {
            $(modal).modal('hide');
            console.log(`Đã đóng modal #${modalId} bằng jQuery`);
        } else {
            modal.style.display = 'none';
            modal.classList.remove('show');
            document.body.classList.remove('modal-open');
            console.log(`Đã đóng modal #${modalId} bằng CSS`);
            
            // Xóa backdrop
            const backdrop = document.querySelector('.modal-backdrop');
            if (backdrop) backdrop.remove();
        }
    } catch (error) {
        console.error(`Lỗi khi đóng modal #${modalId}:`, error);
        // Fallback
        modal.style.display = 'none';
    }
};

/**
 * Check if a string is a valid JWT token format
 */
function isValidJWT(token) {
    // JWT có 3 phần, phân cách bởi dấu chấm
    const parts = token.split('.');
    return parts.length === 3;
}

/**
 * Redirect to login page
 */
function redirectToLogin() {
    // Lưu lại trang hiện tại để sau khi đăng nhập có thể quay lại
    const currentPage = window.location.pathname;
    localStorage.setItem('redirectAfterLogin', currentPage);
    
    // Chuyển hướng đến trang đăng nhập
    window.location.href = '../login.html';
}

/**
 * Set up request interceptor to add token to all API requests
 */
function setupRequestInterceptor(token) {
    // Save original fetch
    const originalFetch = window.fetch;
    
    // Override fetch to add Authorization header
    window.fetch = function(url, options = {}) {
        // Set default options if not provided
        options = options || {};
        options.headers = options.headers || {};
        
        // Add token to API requests
        if (typeof url === 'string' && (url.includes('/api/') || url.includes('localhost:8081'))) {
            console.log(`Intercepting request to: ${url}`);
            options.headers['Authorization'] = `Bearer ${token}`;
            console.log('Token added to request headers');
        }
        
        // Call original fetch with modified options
        return originalFetch(url, options);
    };
    
    // Log the token (masked for security) for debugging
    if (token) {
        const maskedToken = token.substring(0, 15) + '...' + token.substring(token.length - 5);
        console.log(`Admin Core - Using token: ${maskedToken}`);
    }
    
    console.log("Admin Core - Request interceptor set up successfully");
    
    // Make a test request to verify the token works
    testApiConnection();
}

/**
 * Test API connection with token
 */
function testApiConnection() {
    console.log("Testing API connection with token...");
    
    fetch('http://localhost:8081/api/categories', {
        method: 'GET',
        headers: {
            'Accept': 'application/json'
            // Token will be added by the interceptor
        }
    })
    .then(response => {
        console.log(`API test response status: ${response.status}`);
        if (!response.ok) {
            throw new Error(`API responded with status: ${response.status}`);
        }
        return response.json();
    })
    .then(data => {
        console.log("API connection test successful:", data);
    })
    .catch(error => {
        console.error("API connection test failed:", error);
    });
}

/**
 * Update admin name in the UI
 */
function updateAdminName() {
    const adminNameEl = document.getElementById('adminName');
    if (adminNameEl) {
        const fullName = localStorage.getItem('fullName');
        if (fullName) {
            adminNameEl.textContent = fullName;
        }
    }
} 