const API_URL = 'http://localhost:8081/api';

let notifications = [];
let activeTables = [];
let recentOrders = [];

let todayOrdersElement;
let pendingOrdersElement;
let completedOrdersElement;
let todayRevenueElement;
let cashRevenueElement;
let transferRevenueElement;
let totalTablesElement;
let availableTablesElement;
let occupiedTablesElement;
let activeTablesListElement;
let recentOrdersListElement;
let notificationsListElement;
let notificationCountElement;

document.addEventListener('DOMContentLoaded', function() {
    initializeDOMElements();
    setupEventListeners();
    loadDashboardData();
    startAutoRefresh();
});

function initializeDOMElements() {
    todayOrdersElement = document.getElementById('todayOrders');
    if (!todayOrdersElement) console.debug('Không tìm thấy phần tử todayOrders');
    
    pendingOrdersElement = document.getElementById('pendingOrders');
    if (!pendingOrdersElement) console.debug('Không tìm thấy phần tử pendingOrders');
    
    completedOrdersElement = document.getElementById('completedOrders');
    if (!completedOrdersElement) console.debug('Không tìm thấy phần tử completedOrders');
    
    todayRevenueElement = document.getElementById('todayRevenue');
    if (!todayRevenueElement) console.debug('Không tìm thấy phần tử todayRevenue');
    
    cashRevenueElement = document.getElementById('cashRevenue');
    if (!cashRevenueElement) console.debug('Không tìm thấy phần tử cashRevenue');
    
    transferRevenueElement = document.getElementById('transferRevenue');
    if (!transferRevenueElement) console.debug('Không tìm thấy phần tử transferRevenue');
    
    totalTablesElement = document.getElementById('totalTables');
    if (!totalTablesElement) console.debug('Không tìm thấy phần tử totalTables');
    
    availableTablesElement = document.getElementById('availableTables');
    if (!availableTablesElement) console.debug('Không tìm thấy phần tử availableTables');
    
    occupiedTablesElement = document.getElementById('occupiedTables');
    if (!occupiedTablesElement) console.debug('Không tìm thấy phần tử occupiedTables');
    
    activeTablesListElement = document.getElementById('activeTablesList');
    if (!activeTablesListElement) console.debug('Không tìm thấy phần tử activeTablesList');
    
    recentOrdersListElement = document.getElementById('recentOrdersList');
    if (!recentOrdersListElement) console.debug('Không tìm thấy phần tử recentOrdersList');
    
    notificationsListElement = document.getElementById('notificationsList');
    if (!notificationsListElement) console.debug('Không tìm thấy phần tử notificationsList');
    
    notificationCountElement = document.getElementById('notificationCount');
    if (!notificationCountElement) console.debug('Không tìm thấy phần tử notificationCount');
    
    const notificationDropdown = document.getElementById('notificationDropdown');
    if (notificationDropdown) {
        notificationsListElement = notificationDropdown;
    }
}

function setupEventListeners() {
    const refreshBtn = document.getElementById('refreshBtn');
    if (refreshBtn) {
        refreshBtn.addEventListener('click', loadDashboardData);
    }
    
    // Thêm sự kiện khi click vào chuông thông báo để di chuyển đến khu vực thông báo
    const bellIcon = document.querySelector('.notifications i.fa-bell');
    if (bellIcon) {
        bellIcon.addEventListener('click', () => {
            // Tìm phần tử thông báo trong trang
            const notificationsPanel = document.querySelector('.notifications-panel');
            if (notificationsPanel) {
                // Cuộn đến vị trí của phần tử thông báo
                notificationsPanel.scrollIntoView({ behavior: 'smooth' });
                // Thêm hiệu ứng highlight cho phần thông báo
                notificationsPanel.classList.add('highlight');
                setTimeout(() => {
                    notificationsPanel.classList.remove('highlight');
                }, 1500);
            }
        });
    }
}

function startAutoRefresh() {
    setInterval(loadDashboardData, 30000);
}

async function loadDashboardData() {
    try {
        showLoader(true);
        await loadStatistics(); 
        await Promise.all([
            loadTables(),
            loadRecentOrders(),
            loadNotifications()
        ]);
        showLoader(false);
    } catch (error) {
        console.error('Lỗi tải dữ liệu dashboard:', error);
        showNotification('Không thể tải toàn bộ dữ liệu tổng quan.', 'error');
        showLoader(false);
    }
}

async function loadStatistics() {
    try {
        const { orders, payments } = await fetchOrdersAndPayments();
        const today = new Date();
        const todaysOrders = orders.filter(order => {
            const orderDate = new Date(order.orderTime || order.createAt);
            return orderDate.getFullYear() === today.getFullYear() &&
                   orderDate.getMonth() === today.getMonth() &&
                   orderDate.getDate() === today.getDate();
        });
        const calculatedStats = {
            totalOrders: todaysOrders.length,
            pendingOrders: todaysOrders.filter(o => o.status?.toLowerCase() === 'processing').length,
            completedOrders: todaysOrders.filter(o => o.status?.toLowerCase() === 'completed').length,
            totalRevenue: 0,
            cashRevenue: 0,
            transferRevenue: 0
        };
        const todaysPayments = payments.filter(payment => {
            if (!payment || !payment.createAt) return false;
            const paymentDate = new Date(payment.createAt);
            return paymentDate.getFullYear() === today.getFullYear() &&
                   paymentDate.getMonth() === today.getMonth() &&
                   paymentDate.getDate() === today.getDate();
        });
        todaysPayments.forEach(payment => {
            if (payment && payment.order && payment.order.status?.toLowerCase() === 'completed') {
                const amount = payment.order.totalAmount || 0;
                calculatedStats.totalRevenue += amount;
                if (payment.paymentMethod?.toLowerCase() === 'cash') {
                    calculatedStats.cashRevenue += amount;
                } else if (payment.paymentMethod?.toLowerCase() === 'transfer') {
                    calculatedStats.transferRevenue += amount;
                }
            }
        });
        updateStatistics(calculatedStats);
        return calculatedStats;
    } catch (error) {
        console.error(`Lỗi tính thống kê đơn hàng/doanh thu:`, error);
        updateStatistics({
            totalOrders: 0,
            pendingOrders: 0,
            completedOrders: 0,
            totalRevenue: 0,
            cashRevenue: 0,
            transferRevenue: 0
        });
        throw error;
    }
}

function updateStatistics(stats) {
    // Kiểm tra từng phần tử DOM trước khi cập nhật
    if (stats.hasOwnProperty('totalOrders') && todayOrdersElement) {
        todayOrdersElement.textContent = stats.totalOrders || 0;
    }
    
    if (stats.hasOwnProperty('pendingOrders') && pendingOrdersElement) {
        pendingOrdersElement.textContent = `${stats.pendingOrders || 0} chờ xử lý`;
    }
    
    if (stats.hasOwnProperty('completedOrders') && completedOrdersElement) {
        completedOrdersElement.textContent = `${stats.completedOrders || 0} hoàn thành`;
    }
    
    if (stats.hasOwnProperty('totalRevenue') && todayRevenueElement) {
        todayRevenueElement.textContent = formatCurrency(stats.totalRevenue || 0);
    }
    
    if (stats.hasOwnProperty('cashRevenue') && cashRevenueElement) {
        cashRevenueElement.textContent = `Tiền mặt: ${formatCurrency(stats.cashRevenue || 0)}`;
    }
    
    if (stats.hasOwnProperty('transferRevenue') && transferRevenueElement) {
        transferRevenueElement.textContent = `Chuyển khoản: ${formatCurrency(stats.transferRevenue || 0)}`;
    }
    
    if (stats.hasOwnProperty('totalTables') && totalTablesElement) {
        totalTablesElement.textContent = stats.totalTables || 0;
    }
    
    if (stats.hasOwnProperty('availableTables') && availableTablesElement) {
        availableTablesElement.textContent = `${stats.availableTables || 0} bàn trống`;
    }
    
    if (stats.hasOwnProperty('occupiedTables') && occupiedTablesElement) {
        occupiedTablesElement.textContent = `${stats.occupiedTables || 0} đang phục vụ`;
    }
}

async function loadTables() {
    try {
        const tables = await fetchTables();
        activeTables = tables.filter(table => 
            table.status?.toLowerCase() === 'occupied' || 
            table.status?.toLowerCase() === 'đang phục vụ'
        );
        renderActiveTables();
        const totalTablesCount = tables.length;
        const availableTablesCount = tables.filter(table => 
            table.status?.toLowerCase() === 'available' || 
            table.status?.toLowerCase() === 'trống'
        ).length;
        const occupiedTablesCount = activeTables.length;
        if (totalTablesElement) {
            totalTablesElement.textContent = totalTablesCount;
        }
        if (availableTablesElement) {
            availableTablesElement.textContent = `${availableTablesCount} bàn trống`;
        }
        if (occupiedTablesElement) {
            occupiedTablesElement.textContent = `${occupiedTablesCount} đang phục vụ`;
        }
    } catch (error) {
        showNotification(`Lỗi tải/xử lý dữ liệu bàn: ${error.message}`, 'error');
        if (activeTablesListElement) activeTablesListElement.innerHTML = '<div class="no-data">Lỗi tải dữ liệu bàn</div>';
        if (totalTablesElement) totalTablesElement.textContent = 0;
        if (availableTablesElement) availableTablesElement.textContent = `0 bàn trống`;
        if (occupiedTablesElement) occupiedTablesElement.textContent = `0 đang phục vụ`;
    }
}

function renderActiveTables() {
    if (!activeTablesListElement) return;
        activeTablesListElement.innerHTML = '';
        if (activeTables.length === 0) {
            activeTablesListElement.innerHTML = '<div class="no-data">Không có bàn đang phục vụ</div>';
            return;
        }
        activeTables.forEach(table => {
            const tableElement = document.createElement('div');
            tableElement.className = 'table-item';
            tableElement.innerHTML = `
                <div class="table-number">Bàn ${table.tableNumber}</div>
                <div class="table-status">${table.location}</div>
            `;
            activeTablesListElement.appendChild(tableElement);
        });
}

async function loadRecentOrders() {
    try {
        const orders = await fetchRecentOrders();
        recentOrders = orders;
        renderRecentOrders();
    } catch (error) {
        console.error('Lỗi tải đơn hàng gần đây:', error);
        showNotification('Không thể tải đơn hàng gần đây', 'error');
        if (recentOrdersListElement) {
            recentOrdersListElement.innerHTML = '<div class="no-data">Không thể tải đơn hàng gần đây</div>';
        }
    }
}

function renderRecentOrders() {
    if (!recentOrdersListElement) return;
        recentOrdersListElement.innerHTML = '';
        if (recentOrders.length === 0) {
        recentOrdersListElement.innerHTML = '<div class="no-data">Không có đơn hàng nào</div>';
            return;
        }
        recentOrders.forEach(order => {
            const orderElement = document.createElement('div');
        orderElement.className = `order-item ${order.status?.toLowerCase()}`;
        orderElement.onclick = () => handleOrderClick(order);
        const paymentMethod = order.payment?.paymentMethod 
            ? `<span class="payment-method ${order.payment.paymentMethod.toLowerCase()}">${getPaymentMethodText(order.payment.paymentMethod)}</span>`
            : '';
            orderElement.innerHTML = `
                <div class="order-info">
                <div class="order-header">
                    <div class="order-id">#${order.idOrder}</div>
                    <div class="order-status ${order.status?.toLowerCase()}">${getStatusText(order.status)}</div>
                </div>
                    <div class="order-details">
                    ${order.table ? `Bàn ${order.table.tableNumber} - ${order.table.location}` : 'Mang về'}
                    ${paymentMethod}
                    </div>
                </div>
                <div class="order-amount">${formatCurrency(order.totalAmount)}</div>
            `;
            recentOrdersListElement.appendChild(orderElement);
        });
}

function handleOrderClick(order) {
    if (order.status?.toLowerCase() === 'processing') {
        showOrderDetails(order.idOrder);
    } else {
        window.location.href = 'order-history.html';
    }
}

async function loadNotifications() {
    try {
        const notificationData = await fetchNotifications();
        notifications = notificationData;
        renderNotifications();
    } catch (error) {
        console.error('Lỗi tải thông báo:', error);
        showNotification('Không thể tải thông báo', 'error');
        if (notificationsListElement) {
            notificationsListElement.innerHTML = '<div class="no-data">Không thể tải thông báo</div>';
        }
    }
}

// Lấy thông báo mới
async function fetchNotifications() {
    try {
        const response = await fetch(`${API_URL}/orders/recent?limit=10`, {
            method: 'GET',
            headers: getAuthHeaders()
        });
        
        if (response.ok) {
            const orders = await response.json();
            
            // Chỉ lấy các đơn hàng đang xử lý (processing)
            return orders
                .filter(order => order.status === 'processing')
                .map(order => {
                    const orderDate = new Date(order.orderTime || order.createAt);
                    return {
                        id: order.idOrder,
                        message: `Đơn hàng mới #${order.idOrder} ${order.table ? `- Bàn ${order.table.tableNumber}` : '- Mang về'}`,
                        amount: order.totalAmount,
                        time: orderDate,
                        type: order.status,
                        isRead: false
                    };
                });
        } else {
            console.error(`Lỗi khi lấy thông báo: ${response.status} - ${response.statusText}`);
            if (response.status === 401) {
                showNotification('Không có quyền truy cập API đơn hàng. Vui lòng đăng nhập lại.', 'error');
            }
            return [];
        }
    } catch (error) {
        console.error('Lỗi khi lấy thông báo:', error);
        return [];
    }
}

// Cập nhật thông báo
function renderNotifications() {
    if (!notificationsListElement || !notificationCountElement) return;
    
    // Cập nhật đếm thông báo trên icon chuông
    const unreadCount = notifications.length;
    notificationCountElement.textContent = unreadCount;
    notificationCountElement.style.display = unreadCount > 0 ? 'block' : 'none';
    
    // Xử lý hiển thị trong phần thông báo
    if (!notificationsListElement) return;
    
    // Giữ lại các thông báo hệ thống đã hiển thị
    const systemNotifications = Array.from(
        notificationsListElement.querySelectorAll('.notification-item.system')
    );
    
    // Xóa nội dung cũ
    notificationsListElement.innerHTML = '';
    
    // Thêm lại các thông báo hệ thống
    systemNotifications.forEach(notification => {
        notificationsListElement.appendChild(notification);
    });
    
    // Kiểm tra và hiển thị "Không có thông báo nào" nếu không có thông báo
    if (notifications.length === 0 && systemNotifications.length === 0) {
        notificationsListElement.innerHTML = '<div class="no-data">Không có thông báo nào</div>';
        return;
    }
    
    // Thêm thông báo đơn hàng
    notifications.forEach(notification => {
        if (!notification) return;
        
        const notificationElement = document.createElement('div');
        notificationElement.className = `notification-item ${notification.type || ''}${notification.isRead ? '' : ' unread'}`;
        notificationElement.dataset.id = notification.id; // Thêm data-id để dễ dàng tìm kiếm sau này
        notificationElement.innerHTML = `
            <div class="notification-content">
                <div class="notification-message">${notification.message || 'Thông báo mới'}</div>
                ${notification.amount ? `
                    <div class="notification-amount">${formatCurrency(notification.amount)}</div>
                ` : ''}
                <div class="notification-time">${formatTime(notification.time || new Date())}</div>
            </div>
            <div class="notification-actions">
                <button class="mark-read-btn" onclick="showOrderDetails(${notification.id})">
                    <i class="fas fa-eye"></i> Xem
                </button>
            </div>
        `;
        notificationsListElement.appendChild(notificationElement);
    });
}

async function markNotificationAsRead(notificationId) {
    try {
        await fetch(`${API_URL}/orders/${notificationId}/read`, {
            method: 'PUT',
            headers: getAuthHeaders(),
            body: JSON.stringify({ isRead: true })
        });
        
        // Cập nhật UI
        const notification = document.querySelector(`.notification-item[data-id="${notificationId}"]`);
        if (notification) {
            notification.classList.add('read');
        }
    } catch (error) {
        console.error('Error marking notification as read:', error);
    }
}

function clearAllNotifications() {
    if (notificationsListElement) {
        // Xóa tất cả thông báo khỏi DOM
        notificationsListElement.innerHTML = '<div class="no-data">Không có thông báo nào</div>';
        
        // Cập nhật đếm thông báo
        if (notificationCountElement) {
            notificationCountElement.textContent = '0';
            notificationCountElement.style.display = 'none';
        }
    }
    
    // Xóa danh sách thông báo từ API
    notifications = [];
}

function formatCurrency(amount) {
    return new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND'
    }).format(amount);
}

function formatTime(date) {
    const now = new Date();
    const diff = now - new Date(date);
    if (diff < 60000) {
        return 'Vừa xong';
    } else if (diff < 3600000) {
        return `${Math.floor(diff / 60000)} phút trước`;
    } else if (diff < 86400000) {
        return `${Math.floor(diff / 3600000)} giờ trước`;
    } else {
        return new Date(date).toLocaleDateString('vi-VN');
    }
}

function getPaymentMethodText(method) {
    const methodMap = {
        'cash': 'Tiền mặt',
        'transfer': 'Chuyển khoản'
    };
    return methodMap[method?.toLowerCase()] || method;
}

// Hiển thị thông báo
function showNotification(message, type = 'info') {
    // Kiểm tra xem phần tử notificationsListElement đã được khởi tạo chưa
    if (!notificationsListElement) {
        // Tìm lại phần tử nếu chưa được khởi tạo
        notificationsListElement = document.getElementById('notificationsList');
        if (!notificationsListElement) {
            // Nếu không tìm thấy, ghi log lỗi và không làm gì cả
            console.error('Không tìm thấy phần tử hiển thị thông báo!');
            return;
        }
    }
    
    // Tạo phần tử thông báo mới trong khu vực thông báo
    const notification = document.createElement('div');
    notification.className = `notification-item system ${type}`;
    notification.innerHTML = `
        <div class="notification-content">
            <div class="notification-message">${message}</div>
            <div class="notification-time">${formatTime(new Date())}</div>
        </div>
        <div class="notification-actions">
            <button class="mark-read-btn" onclick="this.closest('.notification-item').remove()">
                <i class="fas fa-times"></i> Đóng
            </button>
        </div>
    `;
    
    // Thêm vào danh sách thông báo
    notificationsListElement.insertBefore(notification, notificationsListElement.firstChild);
    
    // Nếu đây là thông báo đầu tiên, thêm nút "Xóa tất cả"
    if (!document.querySelector('.clear-all-notifications')) {
        const clearAllBtn = document.createElement('div');
        clearAllBtn.className = 'clear-all-notifications';
        clearAllBtn.innerHTML = `
            <button class="clear-all-btn" onclick="clearAllNotifications()">
                <i class="fas fa-trash"></i> Xóa tất cả
            </button>
        `;
        notificationsListElement.parentElement.insertBefore(clearAllBtn, notificationsListElement);
    }
    
    // Cập nhật đếm thông báo
    const notificationCount = document.getElementById('notificationCount');
    if (notificationCount) {
        const count = notificationsListElement.querySelectorAll('.notification-item').length;
        notificationCount.textContent = count;
        notificationCount.style.display = count > 0 ? 'block' : 'none';
    }
}

// Xóa các hàm không cần thiết vì không còn sử dụng popup thông báo
function closeNotification(notification) {
    // Chỉ xóa phần tử thông báo khỏi DOM
    if (notification && notification.parentElement) {
        notification.parentElement.removeChild(notification);
    }
}

// Thêm CSS cho thông báo hệ thống
function addNotificationStyles() {
    if (document.getElementById('notification-styles')) return;
    
    const style = document.createElement('style');
    style.id = 'notification-styles';
    style.textContent = `
        .notification-item.system {
            border-left: 4px solid #3498db;
            background-color: rgba(52, 152, 219, 0.05);
        }
        
        .notification-item.system.error {
            border-left: 4px solid #e74c3c;
            background-color: rgba(231, 76, 60, 0.05);
        }
        
        .notification-item.system.warning {
            border-left: 4px solid #f39c12;
            background-color: rgba(243, 156, 18, 0.05);
        }
        
        .notification-item.system.success {
            border-left: 4px solid #2ecc71;
            background-color: rgba(46, 204, 113, 0.05);
        }
        
        .clear-all-notifications {
            display: flex;
            justify-content: flex-end;
            padding: 8px 16px;
            background-color: #f5f5f5;
            border-bottom: 1px solid #ddd;
        }
        
        .clear-all-btn {
            background: none;
            border: none;
            color: #666;
            cursor: pointer;
            font-size: 14px;
            display: flex;
            align-items: center;
            padding: 4px 8px;
            border-radius: 4px;
            transition: all 0.2s;
        }
        
        .clear-all-btn:hover {
            background-color: #e0e0e0;
            color: #333;
        }
        
        .clear-all-btn i {
            margin-right: 5px;
            font-size: 12px;
        }
        
        .no-data {
            text-align: center;
            padding: 20px;
            color: #95a5a6;
            font-style: italic;
        }
    `;
    
    document.head.appendChild(style);
}

// Khởi tạo styles cho thông báo
document.addEventListener('DOMContentLoaded', () => {
    addNotificationStyles();
});

async function showOrderDetails(orderId) {
    try {
        showLoader(true);
        
        // Lấy thông tin đơn hàng
        const response = await fetch(`${API_URL}/orders/${orderId}`, {
            method: 'GET',
            headers: getAuthHeaders()
        });
        
        if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
        
        const order = await response.json();
        
        // Lấy thông tin thanh toán
        const paymentResponse = await fetch(`${API_URL}/payments/order/${orderId}`, {
            method: 'GET',
            headers: getAuthHeaders()
        });
        
        let payment = null;
        if (paymentResponse.ok) {
            payment = await paymentResponse.json();
        }
        
        displayOrderDetails(order, payment);
    } catch (error) {
        console.error('Error loading order details:', error);
        showNotification('Không thể tải chi tiết đơn hàng', 'error');
    } finally {
        showLoader(false);
    }
}

function closeOrderDetails() {
    const modal = document.getElementById('orderDetailsModal');
    if (modal) {
        modal.style.display = 'none';
    }
}

function formatDateTime(dateString) {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('vi-VN', {
        hour: '2-digit',
        minute: '2-digit',
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
    }).format(date);
}

function getStatusText(status) {
    const statusMap = {
        'processing': 'Đang xử lý',
        'completed': 'Đã hoàn thành',
        'cancelled': 'Đã bị hủy'
    };
    return statusMap[status?.toLowerCase()] || status;
}

function logout() {
    if (confirm('Bạn có chắc chắn muốn đăng xuất?')) {
        localStorage.clear();
        window.location.href = '../index.html';
    }
}

// Lấy headers xác thực
function getAuthHeaders() {
    const headers = {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
    };
    
    const token = localStorage.getItem('token');
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }
    
    return headers;
}

// Lấy dữ liệu đơn hàng và thanh toán
async function fetchOrdersAndPayments() {
    try {
        showLoader(true);
        
        // Lấy dữ liệu đơn hàng
        let orders = [];
        try {
            const ordersResponse = await fetch(`${API_URL}/orders/recent?limit=100`, {
                method: 'GET',
                headers: getAuthHeaders()
            });
            
            if (ordersResponse.ok) {
                orders = await ordersResponse.json();
            } else {
                console.error(`Lỗi khi lấy dữ liệu đơn hàng: ${ordersResponse.status} - ${ordersResponse.statusText}`);
                if (ordersResponse.status === 401) {
                    showNotification('Không có quyền truy cập API đơn hàng. Vui lòng đăng nhập lại.', 'error');
                }
            }
        } catch (error) {
            console.error('Lỗi khi lấy dữ liệu đơn hàng:', error);
        }
        
        // Lấy dữ liệu thanh toán
        let payments = [];
        try {
            const paymentsResponse = await fetch(`${API_URL}/payments`, {
                method: 'GET',
                headers: getAuthHeaders()
            });
            
            if (paymentsResponse.ok) {
                payments = await paymentsResponse.json();
            } else {
                console.error(`Lỗi khi lấy dữ liệu thanh toán: ${paymentsResponse.status} - ${paymentsResponse.statusText}`);
                if (paymentsResponse.status === 401) {
                    showNotification('Không có quyền truy cập API thanh toán. Vui lòng đăng nhập lại.', 'error');
                }
            }
        } catch (error) {
            console.error('Lỗi khi lấy dữ liệu thanh toán:', error);
        }
        
        return { orders, payments };
    } catch (error) {
        console.error('Lỗi khi lấy dữ liệu:', error);
        return { orders: [], payments: [] };
    } finally {
        showLoader(false);
    }
}

// Lấy dữ liệu bàn
async function fetchTables() {
    try {
        const response = await fetch(`${API_URL}/tables`, {
            method: 'GET',
            headers: getAuthHeaders()
        });
        
        if (response.ok) {
            return await response.json();
        } else {
            console.error(`Lỗi khi lấy thông tin bàn: ${response.status} - ${response.statusText}`);
            if (response.status === 401) {
                showNotification('Không có quyền truy cập API bàn. Vui lòng đăng nhập lại.', 'error');
            }
            return [];
        }
    } catch (error) {
        console.error('Lỗi khi lấy thông tin bàn:', error);
        showNotification('Không thể tải thông tin bàn', 'error');
        return [];
    }
}

// Lấy đơn hàng gần đây
async function fetchRecentOrders() {
    try {
        const response = await fetch(`${API_URL}/orders/recent?limit=5`, {
            method: 'GET',
            headers: getAuthHeaders()
        });
        
        if (response.ok) {
            return await response.json();
        } else {
            console.error(`Lỗi khi lấy đơn hàng gần đây: ${response.status} - ${response.statusText}`);
            if (response.status === 401) {
                showNotification('Không có quyền truy cập API đơn hàng. Vui lòng đăng nhập lại.', 'error');
            }
            return [];
        }
    } catch (error) {
        console.error('Lỗi khi lấy đơn hàng gần đây:', error);
        return [];
    }
}

function displayOrderDetails(order, payment) {
    let modal = document.getElementById('orderDetailsModal');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'orderDetailsModal';
        modal.className = 'modal';
        document.body.appendChild(modal);
    }
    
    let paymentMethodDisplay = 'Chưa thanh toán';
    if (payment) {
        paymentMethodDisplay = getPaymentMethodText(payment.paymentMethod);
        if (payment.paymentStatus) {
            const statusText = payment.paymentStatus === 'completed' ? 'Đã thanh toán' : 'Chưa thanh toán';
            paymentMethodDisplay += ` (${statusText})`;
        }
    } else if (order.payment?.paymentMethod) {
        paymentMethodDisplay = getPaymentMethodText(order.payment.paymentMethod);
    }
    
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h2>Chi tiết đơn hàng #${order.idOrder}</h2>
                <button class="close-btn" onclick="closeOrderDetails()">&times;</button>
            </div>
            <div class="modal-body">
                <div class="order-info-row">
                    <span class="label">Thời gian:</span>
                    <span>${formatDateTime(order.orderTime || order.createAt)}</span>
                </div>
                <div class="order-info-row">
                    <span class="label">Bàn:</span>
                    <span>${order.table ? `Bàn ${order.table.tableNumber} - ${order.table.location}` : 'Mang về'}</span>
                </div>
                <div class="order-info-row">
                    <span class="label">Trạng thái:</span>
                    <span class="status ${order.status?.toLowerCase()}">${getStatusText(order.status)}</span>
                </div>
                
                <div class="order-info-row">
                    <span class="label">Thanh toán:</span>
                    <span class="payment-method ${payment?.paymentMethod?.toLowerCase() || order.payment?.paymentMethod?.toLowerCase()}">${paymentMethodDisplay}</span>
                </div>
                <div class="order-info-row">
                    <span class="label">Ghi chú:</span>
                    <span class="order-notes">${order.note || 'Không có ghi chú'}</span>
                </div>
                <div class="order-items">
                    <h3>Danh sách món</h3>
                    ${order.orderDetails?.map(item => `
                        <div class="order-item-row">
                            <div class="item-info">
                                <span class="item-name">${item.product?.productName}</span>
                                <span class="item-quantity">x${item.quantity}</span>
                            </div>
                            <span class="item-price">${formatCurrency(item.unitPrice * item.quantity)}</span>
                        </div>
                    `).join('') || '<div class="no-data">Không có món nào</div>'}
                </div>
                ${order.discountAmount ? `
                    <div class="order-info-row discount">
                        <span class="label">Giảm giá:</span>
                        <span class="discount-amount">-${formatCurrency(order.discountAmount)}</span>
                    </div>
                ` : ''}
                <div class="order-info-row total">
                    <span class="label">Tổng cộng:</span>
                    <span class="total-amount">${formatCurrency(order.totalAmount)}</span>
                </div>
            </div>
        </div>
    `;
    modal.style.display = 'flex';
    const closeBtn = modal.querySelector('.close-btn');
    closeBtn.onclick = closeOrderDetails;
    window.onclick = function(event) {
        if (event.target === modal) {
            closeOrderDetails();
        }
    };
    const notification = notifications.find(n => n.id === order.idOrder);
    if (notification && !notification.isRead) {
        markNotificationAsRead(order.idOrder);
    }
}

function showLoader(show) {
    let loader = document.getElementById('loader');
    if (!loader) {
        loader = document.createElement('div');
        loader.id = 'loader';
        loader.style.position = 'fixed';
        loader.style.top = '0';
        loader.style.left = '0';
        loader.style.width = '100%';
        loader.style.height = '100%';
        loader.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
        loader.style.display = 'flex';
        loader.style.justifyContent = 'center';
        loader.style.alignItems = 'center';
        loader.style.zIndex = '9999';
        
        const spinner = document.createElement('div');
        spinner.className = 'spinner';
        spinner.style.border = '5px solid #f3f3f3';
        spinner.style.borderTop = '5px solid #3498db';
        spinner.style.borderRadius = '50%';
        spinner.style.width = '50px';
        spinner.style.height = '50px';
        spinner.style.animation = 'spin 1s linear infinite';
        
        loader.appendChild(spinner);
        document.body.appendChild(loader);
        
        // Add animation style
        const style = document.createElement('style');
        style.textContent = `
            @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
            }
        `;
        document.head.appendChild(style);
    }
    
    loader.style.display = show ? 'flex' : 'none';
}
