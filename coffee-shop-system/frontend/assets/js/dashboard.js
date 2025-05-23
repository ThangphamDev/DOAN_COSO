/**
 * Dashboard Manager Module - T2K Coffee Staff
 * Module quản lý tổng quan cho nhân viên
 */

// Constants
const API_URL = 'http://localhost:8081/api';

// State
let notifications = [];
let activeTables = [];
let recentOrders = [];

// DOM Elements
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

// Initialize when page loads
document.addEventListener('DOMContentLoaded', function() {
    initializeDOMElements();
    setupEventListeners();
    loadDashboardData();
    startAutoRefresh();
});

// Initialize DOM element references
function initializeDOMElements() {
    // Statistics elements
    todayOrdersElement = document.getElementById('todayOrders');
    pendingOrdersElement = document.getElementById('pendingOrders');
    completedOrdersElement = document.getElementById('completedOrders');
    todayRevenueElement = document.getElementById('todayRevenue');
    cashRevenueElement = document.getElementById('cashRevenue');
    transferRevenueElement = document.getElementById('transferRevenue');
    totalTablesElement = document.getElementById('totalTables');
    availableTablesElement = document.getElementById('availableTables');
    occupiedTablesElement = document.getElementById('occupiedTables');

    // Lists elements
    activeTablesListElement = document.getElementById('activeTablesList');
    recentOrdersListElement = document.getElementById('recentOrdersList');
    notificationsListElement = document.getElementById('notificationsList');
    notificationCountElement = document.getElementById('notificationCount');
}

// Setup event listeners
function setupEventListeners() {
    const refreshBtn = document.getElementById('refreshBtn');
    if (refreshBtn) {
        refreshBtn.addEventListener('click', loadDashboardData);
    }
}

// Auto refresh every 30 seconds
function startAutoRefresh() {
    setInterval(loadDashboardData, 30000);
}

// Load all dashboard data
async function loadDashboardData() {
    try {
        await Promise.all([
            loadStatistics(),
            loadTables(),
            loadRecentOrders(),
            loadNotifications()
        ]);
        showNotification('Dữ liệu đã được cập nhật', 'success');
    } catch (error) {
        console.error('Error loading dashboard data:', error);
        showNotification('Không thể tải dữ liệu tổng quan', 'error');
    }
}

// Load statistics
async function loadStatistics() {
    try {
        const response = await fetch(`${API_URL}/statistics/today`);
        if (!response.ok) throw new Error('Failed to load statistics');
        
        const stats = await response.json();
        updateStatistics(stats);
    } catch (error) {
        console.error('Error loading statistics:', error);
        showNotification('Không thể tải thống kê', 'error');
    }
}

// Update statistics display
function updateStatistics(stats) {
    // Update orders statistics
    if (todayOrdersElement) {
        todayOrdersElement.textContent = stats.totalOrders || 0;
    }
    if (pendingOrdersElement) {
        pendingOrdersElement.textContent = `${stats.pendingOrders || 0} chờ xử lý`;
    }
    if (completedOrdersElement) {
        completedOrdersElement.textContent = `${stats.completedOrders || 0} hoàn thành`;
    }

    // Update revenue statistics
    if (todayRevenueElement) {
        todayRevenueElement.textContent = formatCurrency(stats.totalRevenue || 0);
    }
    if (cashRevenueElement) {
        cashRevenueElement.textContent = `Tiền mặt: ${formatCurrency(stats.cashRevenue || 0)}`;
    }
    if (transferRevenueElement) {
        transferRevenueElement.textContent = `Chuyển khoản: ${formatCurrency(stats.transferRevenue || 0)}`;
    }

    // Update tables statistics
    if (totalTablesElement) {
        totalTablesElement.textContent = stats.totalTables || 0;
    }
    if (availableTablesElement) {
        availableTablesElement.textContent = `${stats.availableTables || 0} bàn trống`;
    }
    if (occupiedTablesElement) {
        occupiedTablesElement.textContent = `${stats.occupiedTables || 0} đang phục vụ`;
    }
}

// Load tables
async function loadTables() {
    try {
        const response = await fetch(`${API_URL}/tables`);
        if (!response.ok) throw new Error('Failed to load tables');
        
        const tables = await response.json();
        activeTables = tables.filter(table => table.status === 'Occupied');
        renderActiveTables();
    } catch (error) {
        console.error('Error loading tables:', error);
        showNotification('Không thể tải danh sách bàn', 'error');
    }
}

// Render active tables
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

// Load recent orders
async function loadRecentOrders() {
    try {
        // Lấy 20 đơn hàng gần nhất
        const response = await fetch(`${API_URL}/orders/recent?limit=20`);
        if (!response.ok) throw new Error('Failed to load recent orders');
        
        recentOrders = await response.json();
        renderRecentOrders();
    } catch (error) {
        console.error('Error loading recent orders:', error);
        showNotification('Không thể tải đơn hàng gần đây', 'error');
    }
}

// Render recent orders
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

// Handle order click
function handleOrderClick(order) {
    if (order.status?.toLowerCase() === 'processing') {
        // Mở form chi tiết đơn hàng
        showOrderDetails(order.idOrder);
    } else {
        // Chuyển đến trang lịch sử đơn hàng
        window.location.href = 'order-history.html';
    }
}

// Load notifications
async function loadNotifications() {
    try {
        // Lấy đơn hàng gần đây để tạo thông báo
        const response = await fetch(`${API_URL}/orders/recent`);
        if (!response.ok) throw new Error('Failed to load recent orders');
        
        const recentOrders = await response.json();
        
        // Chuyển đổi đơn hàng thành thông báo
        notifications = recentOrders.map(order => {
            let message = '';
            let isRead = order.status === 'completed';
            
            // Tạo message dựa trên trạng thái đơn hàng
            switch (order.status?.toLowerCase()) {
                case 'processing':
                    message = `Đơn hàng mới #${order.idOrder} ${order.table ? `tại bàn ${order.table.tableNumber}` : 'mang về'}`;
                    break;
                case 'completed':
                    message = `Đơn hàng #${order.idOrder} đã hoàn thành - ${formatCurrency(order.totalAmount)}`;
                    break;
                case 'cancelled':
                    message = `Đơn hàng #${order.idOrder} đã bị hủy`;
                    break;
                default:
                    message = `Cập nhật đơn hàng #${order.idOrder}`;
            }

            // Thêm thông tin chi tiết đơn hàng nếu có
            const orderDetails = order.orderDetails || [];
            if (orderDetails.length > 0) {
                const itemCount = orderDetails.reduce((sum, detail) => sum + detail.quantity, 0);
                message += ` (${itemCount} món)`;
            }

            return {
                id: order.idOrder,
                message: message,
                time: new Date(order.orderTime || order.createAt),
                isRead: isRead,
                type: order.status?.toLowerCase(),
                amount: order.totalAmount
            };
        });

        // Sắp xếp thông báo theo thời gian mới nhất
        notifications.sort((a, b) => b.time - a.time);

        renderNotifications();
    } catch (error) {
        console.error('Error loading notifications:', error);
        showNotification('Không thể tải thông báo', 'error');
    }
}

// Render notifications
function renderNotifications() {
    if (!notificationsListElement || !notificationCountElement) return;
    
    // Update notification count
    const unreadCount = notifications.filter(n => !n.isRead).length;
    notificationCountElement.textContent = unreadCount;
    notificationCountElement.style.display = unreadCount > 0 ? 'block' : 'none';
    
    // Render notifications
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

// Mark notification as read
async function markNotificationAsRead(notificationId) {
    try {
        const notification = notifications.find(n => n.id === notificationId);
        if (notification) {
            notification.isRead = true;
            renderNotifications();
            
            // Cập nhật trạng thái đã đọc lên server (nếu cần)
            await fetch(`${API_URL}/orders/${notificationId}/read`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                }
            });
        }
    } catch (error) {
        console.error('Error marking notification as read:', error);
    }
}

// Clear all notifications
function clearAllNotifications() {
    notifications = [];
    renderNotifications();
    showNotification('Đã xóa tất cả thông báo', 'success');
}

// Helper function to format currency
function formatCurrency(amount) {
    return new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND'
    }).format(amount);
}

// Helper function to format time
function formatTime(date) {
    const now = new Date();
    const diff = now - new Date(date);
    
    if (diff < 60000) { // Less than 1 minute
        return 'Vừa xong';
    } else if (diff < 3600000) { // Less than 1 hour
        return `${Math.floor(diff / 60000)} phút trước`;
    } else if (diff < 86400000) { // Less than 1 day
        return `${Math.floor(diff / 3600000)} giờ trước`;
    } else {
        return new Date(date).toLocaleDateString('vi-VN');
    }
}

// Get payment method text in Vietnamese
function getPaymentMethodText(method) {
    const methodMap = {
        'cash': 'Tiền mặt',
        'transfer': 'Chuyển khoản'
    };
    return methodMap[method?.toLowerCase()] || method;
}

// Show notification
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

// Add animation styles
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

// Show order details modal
async function showOrderDetails(orderId) {
    try {
        const response = await fetch(`${API_URL}/orders/${orderId}`);
        if (!response.ok) throw new Error('Failed to load order details');
        
        const order = await response.json();
        
        // Create modal if not exists
        let modal = document.getElementById('orderDetailsModal');
        if (!modal) {
            modal = document.createElement('div');
            modal.id = 'orderDetailsModal';
            modal.className = 'modal';
            document.body.appendChild(modal);
        }
        
        // Update modal content
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
                        <span class="payment-method ${order.payment?.paymentMethod?.toLowerCase()}">${getPaymentMethodText(order.payment?.paymentMethod)}</span>
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
        
        // Show modal
        modal.style.display = 'flex';
        
        // Add close events
        const closeBtn = modal.querySelector('.close-btn');
        closeBtn.onclick = closeOrderDetails;
        
        window.onclick = function(event) {
            if (event.target === modal) {
                closeOrderDetails();
            }
        };
        
        // Mark notification as read if exists
        const notification = notifications.find(n => n.id === orderId);
        if (notification && !notification.isRead) {
            markNotificationAsRead(orderId);
        }
    } catch (error) {
        console.error('Error loading order details:', error);
        showNotification('Không thể tải chi tiết đơn hàng', 'error');
    }
}

// Close order details modal
function closeOrderDetails() {
    const modal = document.getElementById('orderDetailsModal');
    if (modal) {
        modal.style.display = 'none';
    }
}

// Format date time
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

// Get status text in Vietnamese
function getStatusText(status) {
    const statusMap = {
        'processing': 'Đang xử lý',
        'completed': 'Đã hoàn thành',
        'cancelled': 'Đã bị hủy'
    };
    return statusMap[status?.toLowerCase()] || status;
}
