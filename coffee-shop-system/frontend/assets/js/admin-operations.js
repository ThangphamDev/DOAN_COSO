/**
 * admin-operations.js
 * Quản lý các hoạt động như orders, tables, promotions, activities, etc.
 */

document.addEventListener('DOMContentLoaded', function() {
    // Kiểm tra API client đã được tải chưa
    if (!window.ApiClient) {
        console.error('API Client chưa được tải!');
        if (window.AdminCore) {
            window.AdminCore.showNotification('Không thể kết nối đến server', 'error');
        }
        return;
    }

    // Xác định trang hiện tại để tải các chức năng phù hợp
    const currentPage = window.location.pathname.split('/').pop();
    
    // Khởi tạo các chức năng tùy theo trang
    if (currentPage === 'orders.html') {
        initializeOrderManagement();
    } 
    else if (currentPage === 'tables.html') {
        initializeTableManagement(); 
    }
    else if (currentPage === 'promotions.html') {
        initializePromotionManagement();
    }
    else if (currentPage === 'activities.html') {
        initializeActivityLog();
    }
    else if (currentPage === 'dashboard.html') {
        initializeDashboard();
    }
});

/**
 * ==========================
 * QUẢN LÝ ĐƠN HÀNG
 * ==========================
 */
function initializeOrderManagement() {
    console.log('Khởi tạo chức năng quản lý đơn hàng');
    
    // Tải dữ liệu đơn hàng
    loadOrderData();
    
    // Khởi tạo modal xem chi tiết đơn hàng
    initializeModal('orderDetailModal', null);
    
    // Xử lý tìm kiếm đơn hàng
    setupSearchFilter('searchOrder', filterOrders);
    
    // Thiết lập bộ lọc theo trạng thái
    setupStatusFilter();
    
    // Thiết lập sắp xếp
    setupSorting();
}

// Tải dữ liệu đơn hàng
async function loadOrderData() {
    showLoadingMessage('Đang tải dữ liệu đơn hàng...');
    
    try {
        // Gọi API để lấy danh sách đơn hàng
        const orders = await ApiClient.Order.getAllOrders();
        displayOrders(orders);
        
        showSuccessMessage('Đã tải dữ liệu đơn hàng thành công');
    } catch (error) {
        console.error('Lỗi khi tải dữ liệu đơn hàng:', error);
        showErrorMessage('Lỗi kết nối API: ' + error.message + '. Vui lòng kiểm tra server API có đang chạy không.');
    }
}

// Hiển thị danh sách đơn hàng
function displayOrders(orders) {
    const tableBody = document.getElementById('orderTableBody');
    if (!tableBody) return;
    
    tableBody.innerHTML = '';
    
    orders.forEach(order => {
        const row = document.createElement('tr');
        
        // Định dạng ngày giờ
        const orderDate = new Date(order.orderDate);
        const formattedDate = orderDate.toLocaleDateString('vi-VN');
        const formattedTime = orderDate.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
        
        // Tạo các cột dữ liệu
        row.innerHTML = `
            <td>${order.orderNumber}</td>
            <td>${order.customerName}</td>
            <td>${formattedDate} ${formattedTime}</td>
            <td>${order.total.toLocaleString('vi-VN')} VNĐ</td>
            <td><span class="status-badge ${order.status}">${formatOrderStatus(order.status)}</span></td>
            <td class="actions">
                <button class="btn-icon view-order" data-id="${order.id}" title="Xem chi tiết"><i class="fas fa-eye"></i></button>
                <button class="btn-icon print-order" data-id="${order.id}" title="In hóa đơn"><i class="fas fa-print"></i></button>
                ${order.status !== 'completed' && order.status !== 'cancelled' ? 
                    `<button class="btn-icon update-status" data-id="${order.id}" title="Cập nhật trạng thái"><i class="fas fa-edit"></i></button>` : ''}
            </td>
        `;
        
        tableBody.appendChild(row);
    });
    
    // Thêm xử lý sự kiện cho các nút
    setupOrderActions();
}

/**
 * ==========================
 * QUẢN LÝ BÀN
 * ==========================
 */
function initializeTableManagement() {
    console.log('Khởi tạo chức năng quản lý bàn');
    
    // Tải dữ liệu bàn
    loadTableData();
    
    // Khởi tạo modal thêm/sửa bàn
    initializeModal('tableModal', 'addTableBtn');
    
    // Xử lý form thêm/sửa bàn
    setupTableFormSubmission();
    
    // Xử lý tìm kiếm bàn
    setupSearchFilter('searchTable', filterTables);
    
    // Thiết lập bộ lọc theo trạng thái
    setupTableStatusFilter();
}

// Tải dữ liệu bàn
async function loadTableData() {
    showLoadingMessage('Đang tải dữ liệu bàn...');
    
    try {
        // Gọi API để lấy danh sách bàn
        const tables = await ApiClient.Table.getAllTables();
        displayTables(tables);
        
        showSuccessMessage('Đã tải dữ liệu bàn thành công');
    } catch (error) {
        console.error('Lỗi khi tải dữ liệu bàn:', error);
        showErrorMessage('Lỗi kết nối API: ' + error.message + '. Vui lòng kiểm tra server API có đang chạy không.');
    }
}

/**
 * ==========================
 * QUẢN LÝ KHUYẾN MÃI
 * ==========================
 */
function initializePromotionManagement() {
    console.log('Khởi tạo chức năng quản lý khuyến mãi');
    
    // Tải dữ liệu khuyến mãi
    loadPromotionData();
    
    // Khởi tạo modal thêm/sửa khuyến mãi
    initializeModal('promotionModal', 'addPromotionBtn');
    
    // Xử lý form thêm/sửa khuyến mãi
    setupPromotionFormSubmission();
    
    // Xử lý tìm kiếm khuyến mãi
    setupSearchFilter('searchPromotion', filterPromotions);
    
    // Thiết lập bộ lọc theo trạng thái
    setupPromotionStatusFilter();
}

// Tải dữ liệu khuyến mãi
async function loadPromotionData() {
    showLoadingMessage('Đang tải dữ liệu khuyến mãi...');
    
    try {
        // Gọi API để lấy danh sách khuyến mãi
        const promotions = await ApiClient.Promotion.getAllPromotions();
        displayPromotions(promotions);
        
        showSuccessMessage('Đã tải dữ liệu khuyến mãi thành công');
    } catch (error) {
        console.error('Lỗi khi tải dữ liệu khuyến mãi:', error);
        showErrorMessage('Lỗi kết nối API: ' + error.message + '. Vui lòng kiểm tra server API có đang chạy không.');
    }
}

/**
 * ==========================
 * NHẬT KÝ HOẠT ĐỘNG
 * ==========================
 */
function initializeActivityLog() {
    console.log('Khởi tạo chức năng nhật ký hoạt động');
    
    // Tải dữ liệu hoạt động
    loadActivityData();
    
    // Xử lý tìm kiếm hoạt động
    setupSearchFilter('searchActivity', filterActivities);
    
    // Thiết lập bộ lọc theo loại hoạt động
    setupActivityTypeFilter();
    
    // Thiết lập lọc theo thời gian
    setupDateFilter();
}

/**
 * ==========================
 * TRANG TỔNG QUAN (DASHBOARD)
 * ==========================
 */
function initializeDashboard() {
    console.log('Khởi tạo trang tổng quan');
    
    // Tải dữ liệu tổng quan
    loadDashboardData();
    
    // Khởi tạo các biểu đồ
    initializeCharts();
    
    // Tải hoạt động gần đây
    loadRecentActivities();
    
    // Thiết lập bộ lọc thời gian
    setupDateFilter();
}

// Tải dữ liệu tổng quan
async function loadDashboardData() {
    showLoadingMessage('Đang tải dữ liệu tổng quan...');
    
    try {
        // Gọi API để lấy dữ liệu tổng quan
        const dashboardData = await ApiClient.Report.getDashboardStats();
        displayDashboardData(dashboardData);
        
        showSuccessMessage('Đã tải dữ liệu tổng quan thành công');
    } catch (error) {
        console.error('Lỗi khi tải dữ liệu tổng quan:', error);
        showErrorMessage('Lỗi kết nối API: ' + error.message + '. Vui lòng kiểm tra server API có đang chạy không.');
    }
}

// Hiển thị dữ liệu tổng quan
function displayDashboardData(data) {
    // Cập nhật các số liệu thống kê
    updateElement('todayRevenue', formatCurrency(data.todayRevenue));
    updateElement('todayOrders', data.todayOrders);
    updateElement('staffCount', data.staffCount);
    updateElement('productCount', data.productCount);
    updateElement('bestSeller', data.bestSeller);
    updateElement('busiestTime', data.busiestTime);
    updateElement('avgOrderValue', formatCurrency(data.avgOrderValue));
    updateElement('loyalCustomers', data.loyalCustomers);
    
    // Cập nhật biểu đồ
    if (window.revenueChart) {
        updateRevenueChart(data.revenueByDay);
    }
    
    if (window.categoryChart) {
        updateCategoryChart(data.ordersByCategory);
    }
}

// Khởi tạo biểu đồ
function initializeCharts() {
    // Biểu đồ doanh thu
    const revenueCtx = document.getElementById('revenueChart');
    if (revenueCtx) {
        window.revenueChart = new Chart(revenueCtx, {
            type: 'line',
            data: {
                labels: [],
                datasets: [{
                    label: 'Doanh thu',
                    data: [],
                    borderColor: '#4e73df',
                    backgroundColor: 'rgba(78, 115, 223, 0.1)',
                    borderWidth: 2,
                    pointRadius: 3,
                    tension: 0.3,
                    fill: true
                }]
            },
            options: {
                responsive: true,
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            callback: function(value) {
                                return value.toLocaleString('vi-VN') + ' đ';
                            }
                        }
                    }
                },
                plugins: {
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                return context.raw.toLocaleString('vi-VN') + ' đ';
                            }
                        }
                    }
                }
            }
        });
    }
    
    // Biểu đồ danh mục
    const categoryCtx = document.getElementById('categoryChart');
    if (categoryCtx) {
        window.categoryChart = new Chart(categoryCtx, {
            type: 'doughnut',
            data: {
                labels: [],
                datasets: [{
                    data: [],
                    backgroundColor: [
                        '#4e73df', '#1cc88a', '#36b9cc', '#f6c23e', '#e74a3b', '#858796'
                    ],
                    hoverBackgroundColor: [
                        '#2e59d9', '#17a673', '#2c9faf', '#f4b619', '#e02d1b', '#717384'
                    ],
                    hoverBorderColor: 'rgba(234, 236, 244, 1)',
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'right'
                    }
                },
                cutout: '70%'
            }
        });
    }
}

/**
 * ==========================
 * CÁC HÀM TIỆN ÍCH DÙNG CHUNG
 * ==========================
 */

// Khởi tạo modal
function initializeModal(modalId, openBtnId) {
    const modal = document.getElementById(modalId);
    if (!modal) return;
    
    const openBtn = document.getElementById(openBtnId);
    const closeBtn = modal.querySelector('.close-btn');
    
    // Xử lý mở modal nếu có nút mở
    if (openBtn) {
        openBtn.addEventListener('click', function() {
            // Reset form
            const form = modal.querySelector('form');
            if (form) form.reset();
            
            // Reset các trường ẩn
            const hiddenFields = modal.querySelectorAll('input[type="hidden"]');
            hiddenFields.forEach(field => field.value = '');
            
            // Hiển thị modal
            modal.style.display = 'flex';
            setTimeout(() => {
                modal.classList.add('show');
            }, 10);
        });
    }
    
    // Đóng modal khi nhấn nút đóng
    if (closeBtn) {
        closeBtn.addEventListener('click', function() {
            closeModal(modalId);
        });
    }
    
    // Đóng modal khi nhấn bên ngoài
    window.addEventListener('click', function(e) {
        if (e.target === modal) {
            closeModal(modalId);
        }
    });
}

// Đóng modal
function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (!modal) return;
    
    modal.classList.remove('show');
    setTimeout(() => {
        modal.style.display = 'none';
    }, 300);
}

// Thiết lập tìm kiếm
function setupSearchFilter(inputId, filterFunction) {
    const searchInput = document.getElementById(inputId);
    if (!searchInput) return;
    
    searchInput.addEventListener('input', debounce(function() {
        filterFunction(this.value);
    }, 300));
}

// Hàm debounce để tránh gọi quá nhiều lần khi tìm kiếm
function debounce(func, wait) {
    let timeout;
    return function() {
        const context = this;
        const args = arguments;
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(context, args), wait);
    };
}

// Định dạng trạng thái đơn hàng
function formatOrderStatus(status) {
    switch (status) {
        case 'pending':
            return 'Chờ xử lý';
        case 'processing':
            return 'Đang xử lý';
        case 'completed':
            return 'Hoàn thành';
        case 'cancelled':
            return 'Đã hủy';
        default:
            return status;
    }
}

// Cập nhật phần tử HTML
function updateElement(id, value) {
    const element = document.getElementById(id);
    if (element) {
        element.textContent = value;
    }
}

// Định dạng tiền tệ
function formatCurrency(value) {
    return value.toLocaleString('vi-VN') + ' VNĐ';
}

// Hiển thị thông báo loading
function showLoadingMessage(message) {
    if (window.AdminCore && window.AdminCore.showNotification) {
        window.AdminCore.showNotification(message, 'info');
    } else {
        console.log('Info:', message);
    }
}

// Hiển thị thông báo thành công
function showSuccessMessage(message) {
    if (window.AdminCore && window.AdminCore.showNotification) {
        window.AdminCore.showNotification(message, 'success');
    } else {
        console.log('Success:', message);
    }
}

// Hiển thị thông báo lỗi
function showErrorMessage(message) {
    if (window.AdminCore && window.AdminCore.showNotification) {
        window.AdminCore.showNotification(message, 'error');
    } else {
        console.error('Error:', message);
    }
}

// ==================== Product Operations ====================

/**
 * Xử lý yêu cầu xóa sản phẩm.
 * @param {string|number} productId ID của sản phẩm cần xóa.
 */
async function deleteProduct(productId) {
    // Kiểm tra xem CafeAPI và AdminUI có tồn tại không
    if (typeof CafeAPI === 'undefined' || typeof CafeAPI.deleteProduct !== 'function') {
        console.error("CafeAPI or CafeAPI.deleteProduct is not defined.");
        alert("Lỗi: Không thể kết nối đến API để xóa sản phẩm.");
        return;
    }
    if (typeof AdminUI === 'undefined' || typeof AdminUI.showErrorMessage !== 'function') {
        console.error("AdminUI or AdminUI.showErrorMessage is not defined.");
        // Không cần alert ở đây vì lỗi sẽ được hiển thị bởi hàm gọi
    }

    try {
        console.log(`Đang xóa sản phẩm ID: ${productId}...`);
        const success = await CafeAPI.deleteProduct(productId); // Gọi API xóa

        if (success) {
            console.log(`Sản phẩm ID: ${productId} đã được xóa thành công.`);
            // Tải lại danh sách sản phẩm để cập nhật bảng
            // Kiểm tra xem AdminModule và loadProducts có tồn tại không
            if (window.AdminModule && typeof window.AdminModule.loadProducts === 'function') {
                 AdminModule.loadProducts();
            } else if (typeof loadProducts === 'function') { // Fallback kiểm tra hàm global
                 loadProducts();
            } else {
                 console.error("Hàm loadProducts không tồn tại để tải lại bảng.");
                 alert('Xóa sản phẩm thành công! Vui lòng tải lại trang để cập nhật.');
            }
            // Hiển thị thông báo thành công nếu có
            if (window.AdminUI && typeof window.AdminUI.showToast === 'function') {
                AdminUI.showToast('Xóa sản phẩm thành công!', 'success');
            } else {
                // alert('Xóa sản phẩm thành công!'); // Bỏ alert nếu đã có toast
            }
        } else {
            // Trường hợp API trả về false nhưng không throw error
             if (window.AdminUI && typeof AdminUI.showErrorMessage === 'function') {
                AdminUI.showErrorMessage(`Không thể xóa sản phẩm ID: ${productId}. Phản hồi từ API không thành công.`);
             } else {
                alert(`Không thể xóa sản phẩm ID: ${productId}.`);
             }
        }
    } catch (error) {
        console.error(`Lỗi khi xóa sản phẩm ID: ${productId}`, error);
         if (window.AdminUI && typeof AdminUI.showErrorMessage === 'function') {
            AdminUI.showErrorMessage(`Lỗi khi xóa sản phẩm: ${error.message}`);
         } else {
            alert(`Lỗi khi xóa sản phẩm: ${error.message}`);
         }
    }
}

// Export các chức năng nếu cần
const existingAdminOperations = window.AdminOperations || {};
window.AdminOperations = {
    ...existingAdminOperations, // Giữ lại các hàm cũ
    initializeOrderManagement,
    initializeTableManagement,
    initializePromotionManagement,
    initializeActivityLog,
    initializeDashboard,
    loadDashboardData,
    loadOrderData,
    loadTableData,
    loadPromotionData,
    loadActivityData
};