/**
 * admin-core.js
 * Tập hợp các chức năng cốt lõi dùng chung cho trang admin
 */

document.addEventListener('DOMContentLoaded', function() {
    // Kiểm tra xác thực người dùng
    checkAdminAuthentication();
    
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
    
    if (!token || !role || !role.toLowerCase().includes('admin')) {
        // Hiển thị cảnh báo nhưng không chuyển hướng người dùng
        console.warn('Người dùng chưa đăng nhập hoặc không phải admin');
        showNotification('Bạn đang xem dữ liệu admin nhưng chưa đăng nhập. Một số chức năng có thể bị hạn chế.', 'warning');
        
        // Đặt tên mặc định cho admin
        document.getElementById('adminName').textContent = 'Khách';
        return;
    }
    
    // Hiển thị thông tin người dùng đã đăng nhập
    const fullName = localStorage.getItem('fullName') || 'Admin';
    document.getElementById('adminName').textContent = fullName;
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
    loadSidebar
}; 