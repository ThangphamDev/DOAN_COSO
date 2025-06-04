

document.addEventListener('DOMContentLoaded', function() {
    if (!checkAdminAuthentication()) {
        console.log('Không thể xác thực người dùng - Dừng tải trang admin');
        return;
    }
    
    
    checkApiConnection();
    
    
    loadSidebar();
    
    
    markActiveMenu();

    setupNavigation();
});


function getAuthToken() {
    return localStorage.getItem('token');
}


function getAuthHeaders() {
    const token = getAuthToken();
    const headers = {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
    };
    
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }
    
    return headers;
}


function checkAdminAuthentication() {
    const token = localStorage.getItem('token');
    const role = localStorage.getItem('role');
    
    if (!token || !role || !role.toLowerCase().includes('admin')) {
        console.warn('Người dùng chưa đăng nhập hoặc không phải admin - chuyển hướng đến trang đăng nhập');
        
        const currentPath = window.location.pathname;
        if (currentPath.includes('/admin/')) {
            localStorage.setItem('redirectAfterLogin', currentPath);
        }
        
        window.location.href = '../auth/login.html';
        return false;
    }
    
    const fullName = localStorage.getItem('fullName') || 'Admin';
    document.getElementById('adminName').textContent = fullName;
    return true;
}


async function checkApiConnection() {
    try {
        const response = await fetch('http://localhost:8081/api/system/health', {
            method: 'GET',
            headers: getAuthHeaders()
        });
        
        if (response.ok) {
            const data = await response.json();
            console.log('API Health Check: OK');
            console.log('API Status:', data);
            return true;
        } else {
            console.warn('API Health Check: Failed - Status:', response.status);
            showNotification('Không thể kết nối đến máy chủ. Một số chức năng có thể không hoạt động.', 'warning');
            return false;
        }
    } catch (error) {
        console.error('API Health Check: Error -', error);
        showNotification('Không thể kết nối đến máy chủ. Một số chức năng có thể không hoạt động.', 'warning');
        return false;
    }
}


async function loadSidebar() {
    const sidebarContainer = document.querySelector('.sidebar-container');
    if (!sidebarContainer) return;
    
    try {
        const response = await fetch('../includes/sidebar.html');
        if (response.ok) {
            const html = await response.text();
            sidebarContainer.innerHTML = html;
            console.log('Sidebar đã được tải thành công');
            
            setupSidebar();
            
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


function setupSidebar() {
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', function(e) {
            e.preventDefault();
            logout();
        });
    }
    
    const dropdownToggles = document.querySelectorAll('.sidebar .dropdown-toggle');
    dropdownToggles.forEach(toggle => {
        toggle.addEventListener('click', function(e) {
            e.preventDefault();
            const parent = this.parentElement;
            parent.classList.toggle('open');
        });
    });

    const adminProfile = document.querySelector('.admin-profile');
    if (adminProfile) {
        adminProfile.addEventListener('click', function(e) {
            e.stopPropagation();
            this.classList.toggle('active');
        });

        const dropdownMenu = adminProfile.querySelector('.dropdown-menu');
        if (dropdownMenu) {
            dropdownMenu.addEventListener('click', function(e) {
                e.stopPropagation();
            });
        }

        document.addEventListener('click', function() {
            adminProfile.classList.remove('active');
        });
    }
}


function markActiveMenu() {
    const currentPage = window.location.pathname.split('/').pop();
    
    const menuLinks = document.querySelectorAll('.admin-nav a');
    
    const menuItems = document.querySelectorAll('.admin-nav li');
    menuItems.forEach(item => {
        item.classList.remove('active');
    });
    
    menuLinks.forEach(link => {
        const href = link.getAttribute('href');
        if (href && currentPage.includes(href) || 
            (currentPage === '' && href.includes('dashboard.html'))) {
            link.parentElement.classList.add('active');
        }
    });
    
    if (currentPage === '' || currentPage === 'dashboard.html') {
        const dashboardMenu = document.getElementById('menu-dashboard');
        if (dashboardMenu) {
            dashboardMenu.classList.add('active');
        }
    }
}


function setupNavigation() {
    document.addEventListener('click', function(e) {
        if (e.target.tagName === 'A' && e.target.closest('.admin-nav')) {
        }
    });
}


function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    localStorage.removeItem('userId');
    localStorage.removeItem('fullName');
    
    window.location.href = '../auth/login.html';
}


function showLoader(show) {
    const loader = document.getElementById('loader');
    if (loader) {
        loader.style.display = show ? 'flex' : 'none';
    }
}


function showNotification(message, type = 'info') {
    let toast = document.querySelector('.toast');
    
    if (!toast) {
        toast = document.createElement('div');
        toast.className = 'toast';
        document.body.appendChild(toast);
    }
    
    toast.className = `toast ${type}`;
    toast.innerHTML = `
        <div class="toast-content">
            <i class="toast-icon fas ${getIconForType(type)}"></i>
            <div class="toast-message">${message}</div>
        </div>
        <button class="toast-close">&times;</button>
    `;
    
    toast.classList.add('show');
    
    const closeBtn = toast.querySelector('.toast-close');
    if (closeBtn) {
        closeBtn.addEventListener('click', function() {
            toast.classList.remove('show');
        });
    }

    setTimeout(() => {
        toast.classList.remove('show');
    }, 5000);
}


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


window.AdminCore = {
    showLoader,
    showNotification,
    checkApiConnection,
    logout,
    markActiveMenu,
    loadSidebar,
    
    protectAdminPage: function() {
        const token = localStorage.getItem('token');
        const role = localStorage.getItem('role');
        
        if (!token || !role || !role.toLowerCase().includes('admin')) {
            const currentPath = window.location.pathname;
            if (currentPath.includes('/admin/')) {
                localStorage.setItem('redirectAfterLogin', currentPath);
            }
            
            window.location.href = '../auth/login.html';
            return false;
        }
        return true;
    },
    
    initializeOnce: function(functionName, initFunction) {
        if (!window.initializationStatus) {
            window.initializationStatus = {};
        }
        
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


function initBootstrap() {
    if (typeof bootstrap !== 'undefined') {
        console.log('Bootstrap đã được tải, đang khởi tạo components...');
        
        const tooltips = document.querySelectorAll('[data-bs-toggle="tooltip"]');
        if (tooltips.length > 0) {
            tooltips.forEach(tooltip => {
                new bootstrap.Tooltip(tooltip);
            });
        }
        
        const popovers = document.querySelectorAll('[data-bs-toggle="popover"]');
        if (popovers.length > 0) {
            popovers.forEach(popover => {
                new bootstrap.Popover(popover);
            });
        }
        
        const modals = document.querySelectorAll('.modal');
        console.log(`Tìm thấy ${modals.length} modals để khởi tạo`);
        modals.forEach(modal => {
            try {
                const modalInstance = new bootstrap.Modal(modal);
                console.log(`Đã khởi tạo modal #${modal.id}`);
                
                modal.dataset.bsInstance = "initialized";
                
                modal.addEventListener('hidden.bs.modal', function () {
                    console.log(`Modal #${modal.id} đã đóng`);
                });
            } catch (error) {
                console.error(`Lỗi khi khởi tạo modal #${modal.id}:`, error);
            }
        });
        
        const modalTriggers = document.querySelectorAll('[data-bs-toggle="modal"]');
        modalTriggers.forEach(trigger => {
            trigger.addEventListener('click', function() {
                const targetSelector = this.getAttribute('data-bs-target');
                if (!targetSelector) return;
                
                const modal = document.querySelector(targetSelector);
                if (!modal) return;
                
                try {
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
        
        initSimpleModals();
    }
}


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
            
            if (!document.querySelector('.modal-backdrop')) {
                const backdrop = document.createElement('div');
                backdrop.className = 'modal-backdrop fade show';
                document.body.appendChild(backdrop);
            }
        }
    } catch (error) {
        console.error(`Lỗi khi mở modal #${modalId}:`, error);
        modal.style.display = 'block';
    }
};


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
            
            const backdrop = document.querySelector('.modal-backdrop');
            if (backdrop) backdrop.remove();
        }
    } catch (error) {
        console.error(`Lỗi khi đóng modal #${modalId}:`, error);
        modal.style.display = 'none';
    }
}; 