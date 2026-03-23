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
        let toastContainer = document.getElementById('toast-container');
        if (!toastContainer) {
            toastContainer = document.createElement('div');
            toastContainer.id = 'toast-container';
            document.body.appendChild(toastContainer);
        }
        
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.innerHTML = `
            <div class="toast-content">
                <i class="toast-icon ${getIconClass(type)}"></i>
                <div class="toast-message">${message}</div>
            </div>
            <button class="toast-close">&times;</button>
        `;
        
        toastContainer.appendChild(toast);
        
        setTimeout(() => {
            toast.classList.add('show');
        }, 10);
        
        const closeBtn = toast.querySelector('.toast-close');
        closeBtn.addEventListener('click', () => {
            toast.classList.remove('show');
            toast.classList.add('hide');
            setTimeout(() => {
                if (toast.parentNode && toastContainer.contains(toast)) {
                    toast.parentNode.removeChild(toast);
                }
            }, 300);
        });

        setTimeout(() => {
            if (toast && document.body.contains(toastContainer)) {
                toast.classList.remove('show');
                toast.classList.add('hide');
                setTimeout(() => {
                    if (toast.parentNode && toastContainer.contains(toast)) {
                        toast.parentNode.removeChild(toast);
                    }
                }, 300);
            }
        }, 5000);
    },
    
    /**
     * Xóa một toast khỏi DOM
     * @param {HTMLElement} toast - Toast element cần xóa
     */
    removeToast: function(toast) {
        const index = this.toasts.indexOf(toast);
        if (index > -1) {
            this.toasts.splice(index, 1);
        }
        
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
        const modules = document.querySelectorAll('.module-container');
        modules.forEach(module => {
            const header = module.querySelector('.module-header');
            const body = module.querySelector('.module-body');
            
            if (header && body) {
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
    
    enhanceTables: function() {
        document.querySelectorAll('.data-table').forEach(table => {
            const container = table.closest('.data-table-container');
            if (container) {
                container.classList.add('table-responsive');
            }
            
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
    

    init: function() {
        
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
        
        console.log('T2K Coffee Admin UI initialized');
    }
};

/**
 * Hiển thị danh sách sản phẩm trong bảng.
 * @param {Array<object>} products Danh sách sản phẩm từ API.
 */
function renderProductTable(products) {
    const tableBody = document.getElementById('product-table-body');
    if (!tableBody) {
        console.error("Không tìm thấy phần tử tbody với ID 'product-table-body'");
        return;
    }

    tableBody.innerHTML = '';

    if (!products || products.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="6" class="text-center">Không có sản phẩm nào.</td></tr>';
        return;
    }

    products.forEach(product => {
        const categoryName = (product.category && product.category.name) ? product.category.name : 'N/A';
        const imageUrl = product.imageUrl || 'assets/images/default-product.png';
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

    addTableActionListeners();
}


function addTableActionListeners() {
    const editButtons = document.querySelectorAll('#product-table-body .btn-edit');
    const deleteButtons = document.querySelectorAll('#product-table-body .btn-delete');

    editButtons.forEach(button => {
        button.replaceWith(button.cloneNode(true));
    });
    document.querySelectorAll('#product-table-body .btn-edit').forEach(button => {
         button.addEventListener('click', (event) => {
            const productId = event.target.dataset.id;
            console.log(`Yêu cầu sửa sản phẩm ID: ${productId}`);
            alert(`Chức năng sửa sản phẩm ${productId} chưa được triển khai.`);
        });
    });


    deleteButtons.forEach(button => {
         button.replaceWith(button.cloneNode(true));
    });
     document.querySelectorAll('#product-table-body .btn-delete').forEach(button => {
        button.addEventListener('click', (event) => {
            const productId = event.target.dataset.id;
            console.log(`Yêu cầu xóa sản phẩm ID: ${productId}`);
            if (confirm(`Bạn có chắc chắn muốn xóa sản phẩm ID: ${productId}?`)) {
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

/**
 * Hiển thị thông báo lỗi chung.
 * @param {string} message Nội dung lỗi.
 */
function showErrorMessage(message) {
    console.error("UI Error:", message);
    if (window.AdminUI && window.AdminUI.showToast) {
         window.AdminUI.showToast(message, 'error');
    } else if (window.showToast) {
        showToast(message, 'error');
    } else {
        alert(`Lỗi: ${message}`);
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
    if (Number.isInteger(amount)) {
        return amount.toLocaleString('vi-VN', { style: 'currency', currency: 'VND', minimumFractionDigits: 0, maximumFractionDigits: 0 });
    } else {
        return amount.toLocaleString('vi-VN', { style: 'currency', currency: 'VND' });
    }
}


function setupEventListeners() {
    console.log("Setting up general event listeners...");
     const addProductButton = document.getElementById('add-product-button');
     if (addProductButton) {
         addProductButton.addEventListener('click', () => {
             alert('Chức năng thêm sản phẩm mới chưa được triển khai.');
         });
     }
}

const existingAdminUI = window.AdminUI || {};
window.AdminUI = {
    ...existingAdminUI,
    renderProductTable,
    showErrorMessage,
    setupEventListeners,
    formatCurrency,
    addTableActionListeners
};

AdminUI.init();
