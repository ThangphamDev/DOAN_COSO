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
    pendingOrdersElement = document.getElementById('pendingOrders');
    completedOrdersElement = document.getElementById('completedOrders');
    todayRevenueElement = document.getElementById('todayRevenue');
    cashRevenueElement = document.getElementById('cashRevenue');
    transferRevenueElement = document.getElementById('transferRevenue');
    totalTablesElement = document.getElementById('totalTables');
    availableTablesElement = document.getElementById('availableTables');
    occupiedTablesElement = document.getElementById('occupiedTables');
    activeTablesListElement = document.getElementById('activeTablesList');
    recentOrdersListElement = document.getElementById('recentOrdersList');
    notificationsListElement = document.getElementById('notificationsList');
    notificationCountElement = document.getElementById('notificationCount');
}

function setupEventListeners() {
    const refreshBtn = document.getElementById('refreshBtn');
    if (refreshBtn) {
        refreshBtn.addEventListener('click', loadDashboardData);
    }
}

function startAutoRefresh() {
    setInterval(loadDashboardData, 30000);
}

async function loadDashboardData() {
    try {
        await loadStatistics(); 
        await Promise.all([
            loadTables(),
            loadRecentOrders(),
            loadNotifications()
        ]);
    } catch (error) {
        showNotification('Không thể tải toàn bộ dữ liệu tổng quan.', 'error');
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
            const paymentDate = new Date(payment.createAt);
            return paymentDate.getFullYear() === today.getFullYear() &&
                   paymentDate.getMonth() === today.getMonth() &&
                   paymentDate.getDate() === today.getDate();
        });
        todaysPayments.forEach(payment => {
            if (payment.order && payment.order.status?.toLowerCase() === 'completed') {
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
    } catch (error) {
        showNotification(`Lỗi tính thống kê đơn hàng/doanh thu: ${error.message}`, 'error');
        updateStatistics({
            totalOrders: 0,
            pendingOrders: 0,
            completedOrders: 0,
            totalRevenue: 0,
            cashRevenue: 0,
            transferRevenue: 0
        });
    }
}

function updateStatistics(stats) {
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
        showNotification('Không thể tải đơn hàng gần đây', 'error');
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
        const notifications = await fetchNotifications();
        this.notifications = notifications;
        renderNotifications();
    } catch (error) {
        showNotification('Không thể tải thông báo', 'error');
    }
}

function renderNotifications() {
    if (!notificationsListElement || !notificationCountElement) return;
    const unreadCount = notifications.filter(n => !n.isRead).length;
    notificationCountElement.textContent = unreadCount;
    notificationCountElement.style.display = unreadCount > 0 ? 'block' : 'none';
        notificationsListElement.innerHTML = '';
        if (notifications.length === 0) {
        notificationsListElement.innerHTML = '<div class="no-data">Không có thông báo nào</div>';
            return;
        }
        notifications.forEach(notification => {
            const notificationElement = document.createElement('div');
        notificationElement.className = `notification-item ${notification.type}${notification.isRead ? '' : ' unread'}`;
            notificationElement.innerHTML = `
                <div class="notification-content">
                <div class="notification-message">${notification.message}</div>
                ${notification.amount ? `
                    <div class="notification-amount">${formatCurrency(notification.amount)}</div>
                ` : ''}
                <div class="notification-time">${formatTime(notification.time)}</div>
                    </div>
            <div class="notification-actions">
                <button class="mark-read-btn" onclick="markNotificationAsRead(${notification.id})" 
                    ${notification.isRead ? 'style="display: none;"' : ''}>
                    <i class="fas fa-check"></i>
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
    notifications = [];
    renderNotifications();
    showNotification('Đã xóa tất cả thông báo', 'success');
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

function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    notification.style.position = 'fixed';
    notification.style.top = '20px';
    notification.style.right = '20px';
    notification.style.padding = '15px 25px';
    notification.style.borderRadius = '5px';
    notification.style.backgroundColor = type === 'error' ? '#f44336' : '#1abc9c';
    notification.style.color = 'white';
    notification.style.zIndex = '1000';
    notification.style.boxShadow = '0 2px 5px rgba(0,0,0,0.2)';
    notification.style.animation = 'slideIn 0.5s ease';
    document.body.appendChild(notification);
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.5s ease';
        setTimeout(() => notification.remove(), 500);
    }, 3000);
}

const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    @keyframes slideOut {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(100%); opacity: 0; }
    }
    .no-data {
        text-align: center;
        padding: 20px;
        color: #666;
    }
`;
document.head.appendChild(style);

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

// Hàm trợ giúp để lấy token từ localStorage
function getAuthToken() {
    return localStorage.getItem('token');
}

// Hàm trợ giúp để tạo headers với token xác thực
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

// Lấy dữ liệu đơn hàng và thanh toán
async function fetchOrdersAndPayments() {
    try {
        showLoader(true);
        
        // Lấy dữ liệu đơn hàng
        const ordersResponse = await fetch(`${API_URL}/orders/recent?limit=100`, {
            method: 'GET',
            headers: getAuthHeaders()
        });
        
        if (!ordersResponse.ok) throw new Error(`HTTP error! Status: ${ordersResponse.status}`);
        
        // Lấy dữ liệu thanh toán
        const paymentsResponse = await fetch(`${API_URL}/payments`, {
            method: 'GET',
            headers: getAuthHeaders()
        });
        
        if (!paymentsResponse.ok) throw new Error(`HTTP error! Status: ${paymentsResponse.status}`);
        
        const orders = await ordersResponse.json();
        const payments = await paymentsResponse.json();
        
        return { orders, payments };
    } catch (error) {
        console.error('Error fetching data:', error);
        showNotification('Không thể tải dữ liệu từ máy chủ', 'error');
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
        
        if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
        
        return await response.json();
    } catch (error) {
        console.error('Error fetching tables:', error);
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
        
        if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
        
        return await response.json();
    } catch (error) {
        console.error('Error fetching recent orders:', error);
        return [];
    }
}

// Lấy thông báo mới
async function fetchNotifications() {
    try {
        const response = await fetch(`${API_URL}/orders/recent`, {
            method: 'GET',
            headers: getAuthHeaders()
        });
        
        if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
        
        const orders = await response.json();
        
        // Lọc các đơn hàng chưa đọc và mới tạo trong 24h qua
        const oneDayAgo = new Date();
        oneDayAgo.setHours(oneDayAgo.getHours() - 24);
        
        return orders.filter(order => {
            const orderDate = new Date(order.orderTime);
            return !order.isRead && orderDate > oneDayAgo;
        });
    } catch (error) {
        console.error('Error fetching notifications:', error);
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
    const loader = document.getElementById('loader');
    if (show) {
        loader.style.display = 'block';
    } else {
        loader.style.display = 'none';
    }
}
