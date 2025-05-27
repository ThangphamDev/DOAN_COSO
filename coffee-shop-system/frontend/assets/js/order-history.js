/**
 * Payment Manager Module - T2K Coffee Staff
 * Module quản lý thanh toán cho nhân viên, tích hợp với API và hỗ trợ đầy đủ chức năng
 */

// Constants
const API_URL = 'http://localhost:8081/api';
const STATUS_CLASSES = {
    'success': 'status-success',
    'failed': 'status-failed'
};
const STATUS_TRANSLATIONS = {
    'success': 'Thành công',
    'failed': 'Thất bại'
};
const METHOD_TRANSLATIONS = {
    'cash': 'Tiền mặt',
    'online': 'Online',
    'transfer': 'Chuyển khoản'
};

// State variables
let allPayments = [];
let filteredPayments = [];
let currentPage = 1;
let pageSize = 10;

// DOM Elements
let paymentList;
let searchInput;
let statusFilterSelect;
let methodFilterSelect;
let pageSizeSelect;
let paymentModal;
let paginationInfo;
let prevPageBtn;
let nextPageBtn;
let currentPageSpan;
let deleteModal;

// Initialize when page loads
document.addEventListener('DOMContentLoaded', function() {
    initializeDOMElements();
    setupEventListeners();
    loadPayments();
});

// Initialize DOM element references
function initializeDOMElements() {
    paymentList = document.querySelector('#paymentsTable tbody');
    searchInput = document.getElementById('searchInput');
    statusFilterSelect = document.getElementById('statusFilter');
    methodFilterSelect = document.getElementById('methodFilter');
    pageSizeSelect = document.getElementById('pageSize');
    paymentModal = document.getElementById('paymentModal');
    paginationInfo = {
        startIndex: document.getElementById('startIndex'),
        endIndex: document.getElementById('endIndex'),
        totalItems: document.getElementById('totalItems')
    };
    prevPageBtn = document.getElementById('prevPage');
    nextPageBtn = document.getElementById('nextPage');
    currentPageSpan = document.getElementById('currentPage');
    deleteModal = document.getElementById('deletePaymentModal') || createDeleteModal();
}

// Tạo modal xóa nếu chưa có
function createDeleteModal() {
    const modal = document.createElement('div');
    modal.id = 'deletePaymentModal';
    modal.className = 'modal';
    modal.innerHTML = `
        <div class="modal-content">
            <span class="close">×</span>
            <h2>Xác nhận xóa</h2>
            <p>Bạn có chắc chắn muốn xóa thanh toán <span id="deletePaymentId"></span> không?</p>
            <button id="confirmDeleteBtn">Xóa</button>
            <button class="close">Hủy</button>
        </div>
    `;
    document.body.appendChild(modal);
    return modal;
}

// Setup event listeners
function setupEventListeners() {
    if (searchInput) {
        searchInput.addEventListener('input', filterPayments);
    }
    if (statusFilterSelect) {
        statusFilterSelect.addEventListener('change', filterPayments);
    }
    if (methodFilterSelect) {
        methodFilterSelect.addEventListener('change', filterPayments);
    }
    if (pageSizeSelect) {
        pageSizeSelect.addEventListener('change', changePageSize);
    }

    // Close modal when clicking the close button or outside
    const closeButtons = document.querySelectorAll('.close');
    closeButtons.forEach(btn => {
        btn.onclick = function() {
            const modal = this.closest('.modal');
            if (modal) modal.style.display = 'none';
        }
    });

    window.onclick = function(event) {
        if (event.target.classList.contains('modal')) {
            event.target.style.display = 'none';
        }
    }
}

// Format currency
function formatCurrency(amount) {
    return new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND'
    }).format(amount);
}

// Format date
function formatDate(dateString) {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('vi-VN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
    }).format(date);
}

// Get status text in Vietnamese
function getStatusText(status) {
    const statusMap = {
        'processing': 'Đang xử lý',
        'completed': 'Hoàn thành',
        'cancelled': 'Đã hủy'
    };
    return statusMap[status?.toLowerCase()] || status;
}

// Get payment method text in Vietnamese
function getPaymentMethodText(method) {
    const methodMap = {
        'cash': 'Tiền mặt',
        'transfer': 'Chuyển khoản'
    };
    return methodMap[method?.toLowerCase()] || method;
}

// Load payments from API
async function loadPayments() {
    try {
        const response = await fetch(`${API_URL}/payments`);
        if (!response.ok) {
            throw new Error('Failed to load payments');
        }
        
        // Store all payments and sort by ID descending
        allPayments = await response.json();
        allPayments.sort((a, b) => b.idPayment - a.idPayment);
        
        // Initialize filtered payments
        filteredPayments = [...allPayments];
        
        // Reset pagination
        currentPage = 1;
        
        // Update display
        updateDisplay();
    } catch (error) {
        console.error('Error loading payments:', error);
        showNotification('Không thể tải dữ liệu thanh toán', 'error');
        
        if (paymentList) {
            paymentList.innerHTML = `
                <tr>
                    <td colspan="7" class="no-data">Lỗi khi tải dữ liệu thanh toán</td>
                </tr>
            `;
        }
    }
}

// Update display with current filters and pagination
function updateDisplay() {
    if (!paymentList) return;
    
    // Calculate pagination
    const totalItems = filteredPayments.length;
    const totalPages = Math.ceil(totalItems / pageSize);
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = Math.min(startIndex + pageSize, totalItems);
    
    // Update pagination info
    if (paginationInfo.startIndex) paginationInfo.startIndex.textContent = totalItems ? startIndex + 1 : 0;
    if (paginationInfo.endIndex) paginationInfo.endIndex.textContent = endIndex;
    if (paginationInfo.totalItems) paginationInfo.totalItems.textContent = totalItems;
    if (currentPageSpan) currentPageSpan.textContent = `Trang ${currentPage}`;
    
    // Update pagination buttons
    if (prevPageBtn) prevPageBtn.disabled = currentPage === 1;
    if (nextPageBtn) nextPageBtn.disabled = currentPage >= totalPages;
    
    // Clear current display
    paymentList.innerHTML = '';
    
    // Show no data message if no payments
    if (totalItems === 0) {
        paymentList.innerHTML = `
            <tr>
                <td colspan="7" class="no-data">Không có dữ liệu thanh toán</td>
            </tr>
        `;
        return;
    }
    
    // Display current page of payments
    const paymentsToShow = filteredPayments.slice(startIndex, endIndex);
    paymentsToShow.forEach(payment => {
        const order = payment.order;
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>#${order.idOrder}</td>
            <td>${order.table ? `Bàn ${order.table.tableNumber}` : 'Mang về'}</td>
            <td>${formatCurrency(order.totalAmount)}</td>
            <td>
                <span class="payment-method ${payment.paymentMethod?.toLowerCase()}">
                    ${getPaymentMethodText(payment.paymentMethod)}
                </span>
            </td>
            <td>
                <span class="status ${order.status?.toLowerCase()}" ${order.status?.toLowerCase() === 'processing' ? 'onclick="updateOrderStatus(' + order.idOrder + ')" style="cursor: pointer;"' : ''}>
                    ${getStatusText(order.status)}
                </span>
            </td>
            <td>${formatDate(payment.createAt)}</td>
            <td>
                <button class="action-btn view-btn" onclick="viewOrderDetails(${order.idOrder})">
                    <i class="fas fa-eye"></i>
                </button>
            </td>
        `;
        paymentList.appendChild(row);
    });
}

// Filter payments
function filterPayments() {
    const statusFilter = statusFilterSelect.value.toLowerCase();
    const methodFilter = methodFilterSelect.value.toLowerCase();
    const searchText = searchInput.value.toLowerCase();

    filteredPayments = allPayments.filter(payment => {
        const order = payment.order;
        const matchesStatus = statusFilter === 'all' || order.status?.toLowerCase() === statusFilter;
        const matchesMethod = methodFilter === 'all' || payment.paymentMethod?.toLowerCase() === methodFilter;
        const matchesSearch = 
            order.idOrder.toString().includes(searchText) ||
            (order.table ? `bàn ${order.table.tableNumber}`.includes(searchText) : 'mang về'.includes(searchText));

        return matchesStatus && matchesMethod && matchesSearch;
    });

    currentPage = 1;
    updateDisplay();
}

// Change page size
function changePageSize() {
    pageSize = parseInt(pageSizeSelect.value);
    currentPage = 1;
    updateDisplay();
}

// Navigate to previous page
function previousPage() {
    if (currentPage > 1) {
        currentPage--;
        updateDisplay();
    }
}

// Navigate to next page
function nextPage() {
    const totalPages = Math.ceil(filteredPayments.length / pageSize);
    if (currentPage < totalPages) {
        currentPage++;
        updateDisplay();
    }
}

// View order details
async function viewOrderDetails(orderId) {
    try {
        // Fetch order details
        const response = await fetch(`${API_URL}/orders/${orderId}`);
        if (!response.ok) {
            throw new Error('Failed to load order details');
        }

        const order = await response.json();
        console.log('Order details:', order); // For debugging

        // Load payment information
        let paymentInfo = null;
        try {
            const paymentResponse = await fetch(`${API_URL}/payments/order/${orderId}`);
            if (paymentResponse.ok) {
                const payments = await paymentResponse.json();
                if (payments && payments.length > 0) {
                    paymentInfo = payments[0]; // Lấy payment đầu tiên
                }
            }
        } catch (error) {
            console.warn('Could not load payment info:', error);
        }

        const modal = document.getElementById('paymentModal');
        const modalTitle = document.getElementById('modalTitle');
        const modalBody = document.getElementById('modalBody');

        if (!modal || !modalTitle || !modalBody) {
            throw new Error('Modal elements not found');
        }

        modalTitle.textContent = `Chi tiết đơn hàng #${order.idOrder}`;
        
        // Check if order.productItems exists and is an array
        const items = order.orderDetails || order.productItems || [];
        let itemsHtml = items.map(item => `
            <div class="order-item">
                <span class="item-name">${item.product?.productName || 'Sản phẩm không xác định'}</span>
                <span class="item-quantity">x${item.quantity}</span>
                <span class="item-price">${formatCurrency(item.unitPrice * item.quantity)}</span>
            </div>
        `).join('');

        // If no items found, show a message
        if (!items.length) {
            itemsHtml = '<div class="no-data">Không có thông tin sản phẩm</div>';
        }

        // Determine payment method display
        let paymentMethodDisplay = 'Chưa thanh toán';
        if (paymentInfo) {
            paymentMethodDisplay = getPaymentMethodText(paymentInfo.paymentMethod);
            if (paymentInfo.paymentStatus) {
                const statusText = paymentInfo.paymentStatus === 'completed' ? 'Đã thanh toán' : 'Chưa thanh toán';
                paymentMethodDisplay += ` (${statusText})`;
            }
        } else if (order.payment?.paymentMethod) {
            // Fallback to order payment info if available
            paymentMethodDisplay = getPaymentMethodText(order.payment.paymentMethod);
        }

        modalBody.innerHTML = `
            <div class="order-details">
                <div class="detail-row">
                    <span>Thời gian:</span>
                    <span>${formatDate(order.orderTime || order.createAt)}</span>
                </div>
                <div class="detail-row">
                    <span>Bàn:</span>
                    <span>${order.table ? `Bàn ${order.table.tableNumber} - ${order.table.location}` : 'Mang về'}</span>
                </div>
                <div class="detail-row">
                    <span>Trạng thái:</span>
                    <span class="status ${order.status?.toLowerCase()}">${getStatusText(order.status)}</span>
                </div>
                <div class="detail-row">
                    <span>Phương thức:</span>
                    <span class="payment-method ${paymentInfo?.paymentMethod?.toLowerCase() || order.payment?.paymentMethod?.toLowerCase() || 'cash'}">
                        ${paymentMethodDisplay}
                    </span>
                </div>
                <div class="detail-row">
                    <span>Ghi chú:</span>
                    <span class="order-notes">${order.note || 'Không có ghi chú'}</span>
                </div>
                <div class="items-list">
                    <h3>Danh sách món</h3>
                    ${itemsHtml}
                </div>
                ${order.discountAmount ? `
                    <div class="detail-row">
                        <span>Giảm giá:</span>
                        <span class="discount-amount">-${formatCurrency(order.discountAmount)}</span>
                    </div>
                ` : ''}
                <div class="detail-row total">
                    <span>Tổng cộng:</span>
                    <span>${formatCurrency(order.totalAmount)}</span>
                </div>
            </div>
        `;

        modal.style.display = 'block';
    } catch (error) {
        console.error('Error loading order details:', error);
        showNotification('Không thể tải chi tiết đơn hàng: ' + error.message, 'error');
    }
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

// Add new function to update order status
async function updateOrderStatus(orderId) {
    try {
        if (!confirm('Bạn có chắc muốn cập nhật trạng thái đơn hàng thành "Hoàn thành"?')) {
            return;
        }

        const response = await fetch(`${API_URL}/orders/${orderId}/status`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                status: 'completed'
            })
        });

        if (!response.ok) {
            throw new Error('Không thể cập nhật trạng thái đơn hàng');
        }

        // Reload payments after successful update
        await loadPayments();
        showNotification('Đã cập nhật trạng thái đơn hàng thành công', 'success');
    } catch (error) {
        console.error('Error updating order status:', error);
        showNotification('Không thể cập nhật trạng thái đơn hàng: ' + error.message, 'error');
    }
}