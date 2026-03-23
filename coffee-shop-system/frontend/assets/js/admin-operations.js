document.addEventListener('DOMContentLoaded', function() {
    if (!window.ApiClient) {
        console.error('API Client chưa được tải!');
        if (window.AdminCore) {
            window.AdminCore.showNotification('Không thể kết nối đến server', 'error');
        }
        return;
    }

    const currentPage = window.location.pathname.split('/').pop();
    
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


function initializeOrderManagement() {
    console.log('Khởi tạo chức năng quản lý đơn hàng');
    
    loadOrderData();
    
    initializeModal('orderDetailModal', null);
    
    setupSearchFilter('searchOrder', filterOrders);
    
    setupStatusFilter();
    
    setupSorting();
}


async function loadOrderData() {
    showLoadingMessage('Đang tải dữ liệu đơn hàng...');
    
    try {
        const orders = await ApiClient.Order.getAllOrders();
        displayOrders(orders);
        
        showSuccessMessage('Đã tải dữ liệu đơn hàng thành công');
    } catch (error) {
        console.error('Lỗi khi tải dữ liệu đơn hàng:', error);
        showErrorMessage('Lỗi kết nối API: ' + error.message + '. Vui lòng kiểm tra server API có đang chạy không.');
    }
}


function displayOrders(orders) {
    const tableBody = document.getElementById('orderTableBody');
    if (!tableBody) return;
    
    tableBody.innerHTML = '';
    
    orders.forEach(order => {
        const row = document.createElement('tr');
        
        const orderDate = new Date(order.orderDate);
        const formattedDate = orderDate.toLocaleDateString('vi-VN');
        const formattedTime = orderDate.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
        
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
    
    setupOrderActions();
}


function initializeTableManagement() {
    console.log('Khởi tạo chức năng quản lý bàn');
    
    loadTableData();
    
    initializeModal('tableModal', 'addTableBtn');
    
    setupTableFormSubmission();
    
    setupSearchFilter('searchTable', filterTables);
    
    setupTableStatusFilter();
}


async function loadTableData() {
    showLoadingMessage('Đang tải dữ liệu bàn...');
    
    try {
        const tables = await ApiClient.Table.getAllTables();
        displayTables(tables);
        
        showSuccessMessage('Đã tải dữ liệu bàn thành công');
    } catch (error) {
        console.error('Lỗi khi tải dữ liệu bàn:', error);
        showErrorMessage('Lỗi kết nối API: ' + error.message + '. Vui lòng kiểm tra server API có đang chạy không.');
    }
}


function initializePromotionManagement() {
    console.log('Khởi tạo chức năng quản lý khuyến mãi');
    
    loadPromotionData();
    
    initializeModal('promotionModal', 'addPromotionBtn');
    
    setupPromotionFormSubmission();
    
    setupSearchFilter('searchPromotion', filterPromotions);
    
    setupPromotionStatusFilter();
}


async function loadPromotionData() {
    showLoadingMessage('Đang tải dữ liệu khuyến mãi...');
    
    try {
        const promotions = await ApiClient.Promotion.getAllPromotions();
        displayPromotions(promotions);
        
        showSuccessMessage('Đã tải dữ liệu khuyến mãi thành công');
    } catch (error) {
        console.error('Lỗi khi tải dữ liệu khuyến mãi:', error);
        showErrorMessage('Lỗi kết nối API: ' + error.message + '. Vui lòng kiểm tra server API có đang chạy không.');
    }
}


function initializeActivityLog() {
    console.log('Khởi tạo chức năng nhật ký hoạt động');
    
    loadActivityData();
    
    setupSearchFilter('searchActivity', filterActivities);
    
    setupActivityTypeFilter();
    
    setupDateFilter();
}


function initializeDashboard() {
    console.log('Khởi tạo trang tổng quan');
    
    loadDashboardData();
    
    initializeCharts();
    
    loadRecentActivities();
    
    setupDateFilter();
}


async function loadDashboardData() {
    showLoadingMessage('Đang tải dữ liệu tổng quan...');
    
    try {
        const dashboardData = await ApiClient.Report.getDashboardStats();
        displayDashboardData(dashboardData);
        
        showSuccessMessage('Đã tải dữ liệu tổng quan thành công');
    } catch (error) {
        console.error('Lỗi khi tải dữ liệu tổng quan:', error);
        showErrorMessage('Lỗi kết nối API: ' + error.message + '. Vui lòng kiểm tra server API có đang chạy không.');
    }
}


function displayDashboardData(data) {
    updateElement('todayRevenue', formatCurrency(data.todayRevenue));
    updateElement('todayOrders', data.todayOrders);
    updateElement('staffCount', data.staffCount);
    updateElement('productCount', data.productCount);
    updateElement('bestSeller', data.bestSeller);
    updateElement('busiestTime', data.busiestTime);
    updateElement('avgOrderValue', formatCurrency(data.avgOrderValue));
    updateElement('loyalCustomers', data.loyalCustomers);
    
    if (window.revenueChart) {
        updateRevenueChart(data.revenueByDay);
    }
    
    if (window.categoryChart) {
        updateCategoryChart(data.ordersByCategory);
    }
}


function initializeCharts() {
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


function initializeModal(modalId, openBtnId) {
    const modal = document.getElementById(modalId);
    if (!modal) return;
    
    const openBtn = document.getElementById(openBtnId);
    const closeBtn = modal.querySelector('.close-btn');
    
    if (openBtn) {
        openBtn.addEventListener('click', function() {
            const form = modal.querySelector('form');
            if (form) form.reset();
            
            const hiddenFields = modal.querySelectorAll('input[type="hidden"]');
            hiddenFields.forEach(field => field.value = '');
            
            modal.style.display = 'flex';
            setTimeout(() => {
                modal.classList.add('show');
            }, 10);
        });
    }
    
    if (closeBtn) {
        closeBtn.addEventListener('click', function() {
            closeModal(modalId);
        });
    }
    
    window.addEventListener('click', function(e) {
        if (e.target === modal) {
            closeModal(modalId);
        }
    });
}


function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (!modal) return;
    
    modal.classList.remove('show');
    setTimeout(() => {
        modal.style.display = 'none';
    }, 300);
}


function setupSearchFilter(inputId, filterFunction) {
    const searchInput = document.getElementById(inputId);
    if (!searchInput) return;
    
    searchInput.addEventListener('input', debounce(function() {
        filterFunction(this.value);
    }, 300));
}


function debounce(func, wait) {
    let timeout;
    return function() {
        const context = this;
        const args = arguments;
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(context, args), wait);
    };
}


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


function updateElement(id, value) {
    const element = document.getElementById(id);
    if (element) {
        element.textContent = value;
    }
}


function formatCurrency(value) {
    return value.toLocaleString('vi-VN') + ' VNĐ';
}

function showLoadingMessage(message) {
    if (window.AdminCore && window.AdminCore.showNotification) {
        window.AdminCore.showNotification(message, 'info');
    } else {
        console.log('Info:', message);
    }
}


function showSuccessMessage(message) {
    if (window.AdminCore && window.AdminCore.showNotification) {
        window.AdminCore.showNotification(message, 'success');
    } else {
        console.log('Success:', message);
    }
}


function showErrorMessage(message) {
    if (window.AdminCore && window.AdminCore.showNotification) {
        window.AdminCore.showNotification(message, 'error');
    } else {
        console.error('Error:', message);
    }
}



/**
 * @param {string|number} productId 
 */
async function deleteProduct(productId) {
    if (typeof CafeAPI === 'undefined' || typeof CafeAPI.deleteProduct !== 'function') {
        console.error("CafeAPI or CafeAPI.deleteProduct is not defined.");
        alert("Lỗi: Không thể kết nối đến API để xóa sản phẩm.");
        return;
    }
    if (typeof AdminUI === 'undefined' || typeof AdminUI.showErrorMessage !== 'function') {
        console.error("AdminUI or AdminUI.showErrorMessage is not defined.");
    }

    try {
        console.log(`Đang xóa sản phẩm ID: ${productId}...`);
        const success = await CafeAPI.deleteProduct(productId); 
        if (success) {
            console.log(`Sản phẩm ID: ${productId} đã được xóa thành công.`);
            if (window.AdminModule && typeof window.AdminModule.loadProducts === 'function') {
                 AdminModule.loadProducts();
            } else if (typeof loadProducts === 'function') { 
                 loadProducts();
            } else {
                 console.error("Hàm loadProducts không tồn tại để tải lại bảng.");
                 alert('Xóa sản phẩm thành công! Vui lòng tải lại trang để cập nhật.');
            }
            if (window.AdminUI && typeof window.AdminUI.showToast === 'function') {
                AdminUI.showToast('Xóa sản phẩm thành công!', 'success');
            } else {
            }
        } else {
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

const existingAdminOperations = window.AdminOperations || {};
window.AdminOperations = {
    ...existingAdminOperations, 
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