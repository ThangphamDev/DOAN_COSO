
window.T2KAdmin = window.T2KAdmin || {};

document.addEventListener('DOMContentLoaded', async function() {
    await loadModule('../assets/js/admin-core.js');
    
    await loadModule('../assets/js/admin-ui.js');
    
    const currentPage = window.location.pathname.split('/').pop();
    
    if (currentPage.includes('user')) {
        await loadModule('../assets/js/modules/entities-main.js');
    }
    else if (currentPage.includes('product') || currentPage.includes('categor') || currentPage.includes('staff')) {
        await loadModule('../assets/js/modules/entities-main.js');
    }
    else if (currentPage.includes('order') || currentPage.includes('table') || 
             currentPage.includes('promotion') || currentPage.includes('activit')) {
        await loadModule('../assets/js/admin-operations.js');
    }
    else if (currentPage.includes('dashboard')) {
        await loadModule('../assets/js/admin-operations.js');
    }
    
    initializeAdmin();
});

/**
 * @param {string} url 
 * @returns {Promise} 
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


function initializeAdmin() {
    console.log('Khởi tạo ứng dụng admin...');
    
    if (!window.ApiClient) {
        console.error('API Client chưa được tải!');
        showToast('Không thể kết nối đến server', 'error');
        return;
    }
    
    checkAdminAuthentication();
    
    if (window.AdminCore && typeof window.AdminCore.loadSidebar === 'function') {
        window.AdminCore.loadSidebar();
    } else {
        console.error('Không thể tải sidebar: AdminCore không có sẵn hoặc không có hàm loadSidebar');
    }
    
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
            loadProducts(); 
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

 
function checkAdminAuthentication() {
    const token = localStorage.getItem('token');
    const role = localStorage.getItem('role');
    
    if (!token || !role || !role.toLowerCase().includes('admin')) {
        console.warn('Người dùng chưa đăng nhập hoặc không phải admin');
        showToast('Bạn đang xem dữ liệu admin nhưng chưa đăng nhập. Một số chức năng có thể bị hạn chế.', 'warning');
        
        const adminNameElement = document.getElementById('adminName');
        if (adminNameElement) {
            adminNameElement.textContent = 'Khách';
        }
        return;
    }
    
    const fullName = localStorage.getItem('fullName') || 'Admin';
    const adminNameElement = document.getElementById('adminName');
    if (adminNameElement) {
        adminNameElement.textContent = fullName;
    }
}

/**
 * @param {string} message -
 * @param {string} type 
 */
function showToast(message, type = 'info') {
    if (window.AdminUI && window.AdminUI.showToast) {
        window.AdminUI.showToast(message, type);
    } 
    else if (window.AdminCore && window.AdminCore.showNotification) {
        window.AdminCore.showNotification(message, type);
    } else {
        let toast = document.querySelector('.toast');
        
        if (!toast) {
            toast = document.createElement('div');
            toast.className = 'toast';
            document.body.appendChild(toast);
        }
        
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
}


async function loadProducts() {
    try {
        console.log("Đang tải danh sách sản phẩm...");
        const products = await CafeAPI.getAllProducts(); 
        console.log("Sản phẩm đã tải:", products);
        AdminUI.renderProductTable(products);
    } catch (error) {
        console.error("Lỗi khi tải danh sách sản phẩm:", error);
        AdminUI.showErrorMessage("Không thể tải danh sách sản phẩm. Vui lòng thử lại.");
    }
}

window.AdminModule = {
    loadProducts
};