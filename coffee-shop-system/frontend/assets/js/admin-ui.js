/**
 * T2K Coffee - Admin UI Utilities
 * File này chứa các tiện ích UI cho trang quản trị
 */

/**
 * Toast Notification System
 */
const AdminUI = {
    toasts: [],
    maxToasts: 3,
    
    /**
     * Hiển thị một thông báo toast
     * @param {string} message - Nội dung thông báo
     * @param {string} type - Loại thông báo (success, error, warning, info)
     * @param {number} duration - Thời gian hiển thị (ms)
     */
    showToast: function(message, type = 'info', duration = 3000) {
        // Tạo toast element
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        
        // Tạo nội dung toast
        const toastContent = document.createElement('div');
        toastContent.className = 'toast-content';
        
        // Thêm icon tương ứng với loại toast
        const icon = document.createElement('i');
        icon.className = 'toast-icon fas ';
        switch(type) {
            case 'success':
                icon.classList.add('fa-check-circle');
                break;
            case 'error':
                icon.classList.add('fa-times-circle');
                break;
            case 'warning':
                icon.classList.add('fa-exclamation-triangle');
                break;
            default:
                icon.classList.add('fa-info-circle');
        }
        
        // Thêm nội dung thông báo
        const messageElement = document.createElement('div');
        messageElement.className = 'toast-message';
        messageElement.textContent = message;
        
        // Thêm nút đóng
        const closeButton = document.createElement('button');
        closeButton.className = 'toast-close';
        closeButton.innerHTML = '&times;';
        closeButton.addEventListener('click', () => this.removeToast(toast));
        
        // Ghép các phần tử lại với nhau
        toastContent.appendChild(icon);
        toastContent.appendChild(messageElement);
        toast.appendChild(toastContent);
        toast.appendChild(closeButton);
        
        // Thêm toast vào body
        document.body.appendChild(toast);
        
        // Nếu đã đạt số lượng toast tối đa, xóa toast cũ nhất
        this.toasts.push(toast);
        if (this.toasts.length > this.maxToasts) {
            this.removeToast(this.toasts[0]);
        }
        
        // Hiệu ứng hiển thị
        setTimeout(() => {
            toast.classList.add('show');
        }, 10);
        
        // Tự động xóa sau khoảng thời gian
        setTimeout(() => {
            this.removeToast(toast);
        }, duration);
    },
    
    /**
     * Xóa một toast khỏi DOM
     * @param {HTMLElement} toast - Toast element cần xóa
     */
    removeToast: function(toast) {
        // Xóa khỏi mảng
        const index = this.toasts.indexOf(toast);
        if (index > -1) {
            this.toasts.splice(index, 1);
        }
        
        // Hiệu ứng ẩn và xóa khỏi DOM
        toast.classList.remove('show');
        setTimeout(() => {
            if (toast.parentNode) {
                toast.parentNode.removeChild(toast);
            }
        }, 300);
    },
    
    /**
     * Shortcut cho thông báo thành công
     * @param {string} message - Nội dung thông báo
     * @param {number} duration - Thời gian hiển thị (ms)
     */
    success: function(message, duration = 3000) {
        this.showToast(message, 'success', duration);
    },
    
    /**
     * Shortcut cho thông báo lỗi
     * @param {string} message - Nội dung thông báo
     * @param {number} duration - Thời gian hiển thị (ms)
     */
    error: function(message, duration = 3000) {
        this.showToast(message, 'error', duration);
    },
    
    /**
     * Shortcut cho thông báo cảnh báo
     * @param {string} message - Nội dung thông báo
     * @param {number} duration - Thời gian hiển thị (ms)
     */
    warning: function(message, duration = 3000) {
        this.showToast(message, 'warning', duration);
    },
    
    /**
     * Shortcut cho thông báo thông tin
     * @param {string} message - Nội dung thông báo
     * @param {number} duration - Thời gian hiển thị (ms)
     */
    info: function(message, duration = 3000) {
        this.showToast(message, 'info', duration);
    },
    
    /**
     * Module System
     */
    initModules: function() {
        // Khởi tạo tất cả các module container
        const modules = document.querySelectorAll('.module-container');
        modules.forEach(module => {
            // Khởi tạo chức năng thu gọn nếu có
            const header = module.querySelector('.module-header');
            const body = module.querySelector('.module-body');
            
            if (header && body) {
                // Thêm nút thu gọn nếu chưa có
                if (!header.querySelector('.module-collapse')) {
                    const collapseBtn = document.createElement('button');
                    collapseBtn.className = 'module-collapse btn btn-sm btn-light';
                    collapseBtn.innerHTML = '<i class="fas fa-chevron-up"></i>';
                    collapseBtn.addEventListener('click', function() {
                        body.classList.toggle('collapsed');
                        if (body.classList.contains('collapsed')) {
                            collapseBtn.innerHTML = '<i class="fas fa-chevron-down"></i>';
                            body.style.display = 'none';
                        } else {
                            collapseBtn.innerHTML = '<i class="fas fa-chevron-up"></i>';
                            body.style.display = '';
                        }
                    });
                    
                    header.appendChild(collapseBtn);
                }
            }
        });
    },
    
    /**
     * Toggle Switch Elements
     */
    initToggleSwitches: function() {
        document.querySelectorAll('.toggle-switch input[type="checkbox"]').forEach(toggle => {
            toggle.addEventListener('change', function() {
                const event = new CustomEvent('toggle-change', {
                    detail: { checked: this.checked, id: this.id }
                });
                document.dispatchEvent(event);
            });
        });
    },
    
    /**
     * Data Tables Enhancement
     */
    enhanceTables: function() {
        document.querySelectorAll('.data-table').forEach(table => {
            // Thêm lớp table-responsive nếu bảng nằm trong container
            const container = table.closest('.data-table-container');
            if (container) {
                container.classList.add('table-responsive');
            }
            
            // Thêm sự kiện hover cho hàng
            table.querySelectorAll('tbody tr').forEach(row => {
                row.addEventListener('mouseenter', () => {
                    row.classList.add('hover');
                });
                row.addEventListener('mouseleave', () => {
                    row.classList.remove('hover');
                });
            });
        });
    },
    
    /**
     * Khởi tạo tất cả các chức năng UI
     */
    init: function() {
        // Đảm bảo DOM đã tải xong
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.initAll());
        } else {
            this.initAll();
        }
    },
    
    initAll: function() {
        this.initModules();
        this.initToggleSwitches();
        this.enhanceTables();
        
        // Thông báo khởi tạo thành công
        console.log('T2K Coffee Admin UI initialized');
    }
};

// ==================== Product UI Functions ====================

/**
 * Hiển thị danh sách sản phẩm trong bảng.
 * @param {Array<object>} products Danh sách sản phẩm từ API.
 */
function renderProductTable(products) {
    const tableBody = document.getElementById('product-table-body'); // Cần đảm bảo ID này tồn tại trong products.html
    if (!tableBody) {
        console.error("Không tìm thấy phần tử tbody với ID 'product-table-body'");
        return;
    }

    tableBody.innerHTML = ''; // Xóa nội dung cũ

    if (!products || products.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="6" class="text-center">Không có sản phẩm nào.</td></tr>';
        return;
    }

    products.forEach(product => {
        // Kiểm tra xem product.category có tồn tại và có thuộc tính name không
        const categoryName = (product.category && product.category.name) ? product.category.name : 'N/A';
        const imageUrl = product.imageUrl || 'assets/images/default-product.png'; // Sử dụng ảnh mặc định nếu không có
        const price = (typeof product.price === 'number') ? formatCurrency(product.price) : 'N/A';

        const row = `
            <tr>
                <td>${product.id || 'N/A'}</td>
                <td><img src="../assets/images/${product.image || 'default-product.png'}" alt="${product.name || ''}" width="50"></td>
                <td>${product.name || 'N/A'}</td>
                <td>${categoryName}</td>
                <td>${price}</td>
                <td>
                    <button class="btn btn-sm btn-info btn-edit" data-id="${product.id}">Sửa</button>
                    <button class="btn btn-sm btn-danger btn-delete" data-id="${product.id}">Xóa</button>
                </td>
            </tr>
        `;
        tableBody.insertAdjacentHTML('beforeend', row);
    });

    // Thêm event listener cho các nút sửa/xóa
    addTableActionListeners();
}

/**
 * Thêm event listener cho các nút hành động trong bảng (Sửa, Xóa).
 */
function addTableActionListeners() {
    const editButtons = document.querySelectorAll('#product-table-body .btn-edit');
    const deleteButtons = document.querySelectorAll('#product-table-body .btn-delete');

    editButtons.forEach(button => {
        // Xóa listener cũ nếu có để tránh gắn nhiều lần
        button.replaceWith(button.cloneNode(true));
    });
    document.querySelectorAll('#product-table-body .btn-edit').forEach(button => {
         button.addEventListener('click', (event) => {
            const productId = event.target.dataset.id;
            console.log(`Yêu cầu sửa sản phẩm ID: ${productId}`);
            // Gọi hàm xử lý sửa sản phẩm (ví dụ: AdminOperations.editProduct(productId))
            // Cần triển khai hàm này trong admin-operations.js
            alert(`Chức năng sửa sản phẩm ${productId} chưa được triển khai.`);
            // Ví dụ: AdminOperations.showEditProductModal(productId);
        });
    });


    deleteButtons.forEach(button => {
        // Xóa listener cũ nếu có
         button.replaceWith(button.cloneNode(true));
    });
     document.querySelectorAll('#product-table-body .btn-delete').forEach(button => {
        button.addEventListener('click', (event) => {
            const productId = event.target.dataset.id;
            console.log(`Yêu cầu xóa sản phẩm ID: ${productId}`);
            if (confirm(`Bạn có chắc chắn muốn xóa sản phẩm ID: ${productId}?`)) {
                // Kiểm tra xem AdminOperations và deleteProduct có tồn tại không
                if (window.AdminOperations && typeof window.AdminOperations.deleteProduct === 'function') {
                    AdminOperations.deleteProduct(productId);
                } else {
                    console.error("AdminOperations.deleteProduct is not defined.");
                    alert("Lỗi: Không thể thực hiện thao tác xóa.");
                }
            }
        });
    });
}


// ==================== General UI Functions ====================

/**
 * Hiển thị thông báo lỗi chung.
 * @param {string} message Nội dung lỗi.
 */
function showErrorMessage(message) {
    // Có thể hiển thị lỗi trong một div cụ thể hoặc dùng alert
    console.error("UI Error:", message);
    // Sử dụng showToast nếu có
    if (window.AdminUI && window.AdminUI.showToast) {
         window.AdminUI.showToast(message, 'error');
    } else if (window.showToast) { // Hoặc nếu showToast là global
        showToast(message, 'error');
    } else {
        alert(`Lỗi: ${message}`); // Fallback dùng alert
    }
}

/**
 * Định dạng số thành tiền tệ (ví dụ: VND).
 * @param {number} amount Số tiền.
 * @returns {string} Chuỗi tiền tệ đã định dạng.
 */
function formatCurrency(amount) {
    if (typeof amount !== 'number') {
        return 'N/A';
    }
    // Kiểm tra xem có phải là số nguyên không
    if (Number.isInteger(amount)) {
        return amount.toLocaleString('vi-VN', { style: 'currency', currency: 'VND', minimumFractionDigits: 0, maximumFractionDigits: 0 });
    } else {
        return amount.toLocaleString('vi-VN', { style: 'currency', currency: 'VND' });
    }
}


/**
 * Thiết lập các event listener chung cho trang admin.
 */
function setupEventListeners() {
    console.log("Setting up general event listeners...");
    // Thêm các listener khác nếu cần, ví dụ: nút thêm mới chung, tìm kiếm...
     const addProductButton = document.getElementById('add-product-button'); // Đảm bảo ID này tồn tại trong products.html
     if (addProductButton) {
         addProductButton.addEventListener('click', () => {
             // Hiển thị modal hoặc form thêm sản phẩm
             alert('Chức năng thêm sản phẩm mới chưa được triển khai.');
             // Ví dụ: AdminOperations.showAddProductModal();
         });
     }

     // Thêm listener cho các nút Sửa/Xóa chung nếu cần (ngoài bảng)
}


// Export các hàm cần thiết (nếu sử dụng module pattern hoặc class)
// Cập nhật export để bao gồm các hàm mới
const existingAdminUI = window.AdminUI || {};
window.AdminUI = {
    ...existingAdminUI, // Giữ lại các hàm cũ nếu có
    renderProductTable,
    showErrorMessage,
    setupEventListeners,
    formatCurrency,
    addTableActionListeners // Export hàm này nếu cần gọi từ bên ngoài
    // Thêm các hàm UI khác vào đây
};

// Tự động khởi tạo khi tải xong trang
AdminUI.init();