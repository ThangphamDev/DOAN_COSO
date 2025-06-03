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
    // Kiểm tra xác thực trước khi tải trang
    if (checkAuthentication()) {
    initializeDOMElements();
    setupEventListeners();
    loadPayments();
    }
});

// Kiểm tra xác thực
function checkAuthentication() {
    const token = localStorage.getItem('token');
    const role = localStorage.getItem('role');
    
    if (!token || !role || !(role.toLowerCase().includes('staff') || role.toLowerCase().includes('admin'))) {
        // Chuyển hướng về trang đăng nhập nếu không phải nhân viên hoặc admin
        window.location.href = '../auth/login.html';
        return false;
    }
    
    return true;
}

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

// Helper functions for formatting and text display

// Format date
function formatDate(dateString) {
    if (!dateString) return 'N/A';
    
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'Invalid Date';
    
    return date.toLocaleString('vi-VN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
    });
}

// Format currency
function formatCurrency(amount) {
    if (amount === undefined || amount === null) return '0 ₫';
    
    return new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(amount);
}

// Get status text
function getStatusText(status) {
    const statusMap = {
        'processing': 'Đang xử lý',
        'completed': 'Hoàn thành',
        'cancelled': 'Đã hủy'
    };
    
    return statusMap[status] || 'Không xác định';
}

// Get payment method text
function getPaymentMethodText(method) {
    if (!method) return 'Không xác định';
    
    const methodMap = {
        'cash': 'Tiền mặt',
        'card': 'Thẻ',
        'momo': 'MoMo',
        'banking': 'Chuyển khoản',
        'transfer': 'Chuyển khoản',
        'online': 'Thanh toán online',
        'qr': 'Quét mã QR',
        'vnpay': 'VNPay',
        'zalopay': 'ZaloPay',
        'credit': 'Thẻ tín dụng',
        'debit': 'Thẻ ghi nợ'
    };
    
    // Chuẩn hóa method thành chữ thường để dễ so sánh
    const normalizedMethod = method.toLowerCase();
    
    // Tìm phương thức thanh toán phù hợp
    return methodMap[normalizedMethod] || method;
}

// Load payments from API
async function loadPayments() {
    try {
        // Check for authentication token
        const token = getAuthToken();
        if (!token) {
            window.location.href = '../auth/login.html';
            return [];
        }

        showLoader(true);
        
        // Fetch both orders and payments in parallel
        const [ordersResponse, paymentsResponse] = await Promise.all([
            fetch(`${API_URL}/orders`, {
                method: 'GET',
                headers: getAuthHeaders()
            }),
            fetch(`${API_URL}/payments`, {
                method: 'GET',
                headers: getAuthHeaders()
            })
        ]);
        
        if (!ordersResponse.ok) {
            throw new Error(`HTTP error when fetching orders! status: ${ordersResponse.status}`);
        }
        
        const orders = await ordersResponse.json();
        console.log('Orders from API:', orders);
        
        // Create a map of payments by order ID for quick lookup
        let paymentsByOrderId = {};
        
        if (paymentsResponse.ok) {
            const payments = await paymentsResponse.json();
            console.log('Payments from API:', payments);
            
            // Create a map of payments by order ID
            payments.forEach(payment => {
                if (payment.order && payment.order.idOrder) {
                    paymentsByOrderId[payment.order.idOrder] = payment;
                } else if (payment.idOrder) {
                    paymentsByOrderId[payment.idOrder] = payment;
                }
            });
        } else {
            console.warn('Could not fetch payments, using default payment data');
        }
        
        // Combine order and payment data
        allPayments = orders.map(order => {
            // Try to find payment for this order
            const payment = paymentsByOrderId[order.idOrder];
            
            if (payment) {
                // Return combined data with payment details
                return {
                    order: order,
                    idPayment: payment.idPayment || null,
                    paymentMethod: payment.paymentMethod || 'cash',
                    paymentStatus: payment.paymentStatus || (order.status === 'completed' ? 'completed' : 'pending'),
                    createAt: payment.createAt || order.orderTime,
                    transactionId: payment.transactionId || null
                };
            } else {
                // If no payment found, create a default one
                return {
                    order: order,
                    paymentMethod: order.payment?.paymentMethod || 'cash',
                    paymentStatus: order.payment?.paymentStatus || (order.status === 'completed' ? 'completed' : 'pending'),
                    createAt: order.payment?.createAt || order.orderTime
                };
            }
        });
        
        filteredPayments = [...allPayments];
        
        // Sắp xếp theo thời gian tạo mới nhất
        filteredPayments.sort((a, b) => {
            return new Date(b.order.orderTime) - new Date(a.order.orderTime);
        });
        
        console.log('Filtered payments:', filteredPayments);
        updateDisplay();
        return allPayments;
    } catch (error) {
        console.error('Error loading payments:', error);
        showNotification('Không thể tải lịch sử thanh toán. Vui lòng thử lại sau.', 'error');
        return [];
    } finally {
        showLoader(false);
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
        if (!order) {
            console.error('Payment missing order data:', payment);
            return;
        }
        
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>#${order.idOrder}</td>
            <td>${order.table ? `Bàn ${order.table.tableNumber}` : 'Mang về'}</td>
            <td>${formatCurrency(order.totalAmount)}</td>
            <td>
                <span class="payment-method ${payment.paymentMethod?.toLowerCase() || ''}">
                    ${getPaymentMethodText(payment.paymentMethod)}
                </span>
            </td>
            <td>
                <span class="status ${order.status?.toLowerCase()}" ${order.status?.toLowerCase() === 'processing' ? 'onclick="updateOrderStatus(' + order.idOrder + ', \'completed\')" style="cursor: pointer;"' : ''}>
                    ${getStatusText(order.status)}
                </span>
            </td>
            <td>${formatDate(payment.createAt || order.orderTime)}</td>
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
        if (!payment.order) return false;
        
        const order = payment.order;
        
        // Lọc theo trạng thái đơn hàng
        const matchesStatus = statusFilter === 'all' || order.status?.toLowerCase() === statusFilter;
        
        // Lọc theo phương thức thanh toán
        const matchesMethod = methodFilter === 'all' || 
            (payment.paymentMethod && payment.paymentMethod.toLowerCase() === methodFilter);
        
        // Lọc theo từ khóa tìm kiếm
        const matchesSearch = 
            order.idOrder.toString().includes(searchText) ||
            (order.table ? `bàn ${order.table.tableNumber}`.includes(searchText) : 'mang về'.includes(searchText)) ||
            (payment.paymentMethod && getPaymentMethodText(payment.paymentMethod).toLowerCase().includes(searchText)) ||
            (payment.transactionId && payment.transactionId.toLowerCase().includes(searchText));

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
function viewOrderDetails(orderId) {
    showLoader(true);
    
    const authHeaders = getAuthHeaders();
    if (!authHeaders) {
        window.location.href = '../auth/login.html';
        return;
    }
    
    // Fetch both order and payment data in parallel
    Promise.all([
        fetch(`${API_URL}/orders/${orderId}`, {
            method: 'GET',
            headers: authHeaders
        }).then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error when fetching order! Status: ${response.status}`);
            }
            return response.json();
        }),
        fetch(`${API_URL}/payments/by-order/${orderId}`, {
            method: 'GET',
            headers: authHeaders
        }).then(response => {
            // If payment not found, we'll handle it later
            return response.ok ? response.json() : null;
        })
    ])
    .then(([order, paymentData]) => {
        showLoader(false);
        
        // If payment data doesn't exist from API, try to find it in our cached data
        let payment;
        if (paymentData) {
            payment = paymentData;
        } else {
            const cachedPayment = filteredPayments.find(p => p.order && p.order.idOrder === orderId);
            if (cachedPayment) {
                payment = {
                    idPayment: cachedPayment.idPayment,
                    paymentMethod: cachedPayment.paymentMethod,
                    paymentStatus: cachedPayment.paymentStatus,
                    createAt: cachedPayment.createAt,
                    transactionId: cachedPayment.transactionId
                };
            } else {
                payment = {
                    paymentMethod: 'cash',
                    paymentStatus: order.status === 'completed' ? 'completed' : 'pending',
                    createAt: order.orderTime
                };
            }
        }
        
        displayOrderDetails(order, payment);
    })
    .catch(error => {
        showLoader(false);
        console.error('Error fetching order details:', error);
        showNotification('Không thể tải chi tiết đơn hàng. Vui lòng thử lại sau.', 'error');
    });
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

// Show loader
function showLoader(show) {
    // Tạo loader nếu chưa tồn tại
    let loader = document.getElementById('loader');
    
    if (!loader) {
        loader = document.createElement('div');
        loader.id = 'loader';
        loader.className = 'loader-overlay';
        
        const spinnerDiv = document.createElement('div');
        spinnerDiv.className = 'loader';
        loader.appendChild(spinnerDiv);
        
        const messageDiv = document.createElement('div');
        messageDiv.className = 'loader-message';
        messageDiv.textContent = 'Đang tải...';
        loader.appendChild(messageDiv);
        
        document.body.appendChild(loader);
        
        // Thêm CSS cho loader
        const loaderStyle = document.createElement('style');
        loaderStyle.textContent = `
            .loader-overlay {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background-color: rgba(0, 0, 0, 0.5);
                display: flex;
                flex-direction: column;
                justify-content: center;
                align-items: center;
                z-index: 9999;
            }
            
            .loader {
                border: 5px solid #f3f3f3;
                border-top: 5px solid #3498db;
                border-radius: 50%;
                width: 50px;
                height: 50px;
                animation: spin 2s linear infinite;
            }
            
            .loader-message {
                color: white;
                margin-top: 10px;
                font-size: 18px;
            }
            
            @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
            }
        `;
        document.head.appendChild(loaderStyle);
    }
    
    // Hiển thị hoặc ẩn loader
    loader.style.display = show ? 'flex' : 'none';
}

// Update order status
function updateOrderStatus(orderId, newStatus) {
    if (!confirm(`Bạn có chắc chắn muốn cập nhật trạng thái đơn hàng #${orderId} thành ${getStatusText(newStatus)}?`)) {
        return;
    }
    
    showLoader(true);
    
    const authHeaders = getAuthHeaders();
    if (!authHeaders) {
        window.location.href = '../auth/login.html';
        return;
    }
    
    // First update the order status
    fetch(`${API_URL}/orders/${orderId}/status`, {
        method: 'PUT',
        headers: {
            ...authHeaders,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status: newStatus })
    })
    .then(response => {
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }
        return response.json();
    })
    .then(updatedOrder => {
        // If order is completed, also update payment status
        if (newStatus === 'completed') {
            // Find payment for this order
            const payment = filteredPayments.find(p => p.order && p.order.idOrder === orderId);
            
            if (payment && payment.idPayment) {
                // Update payment status to completed
                return fetch(`${API_URL}/payments/${payment.idPayment}/status`, {
                    method: 'PUT',
                    headers: {
                        ...authHeaders,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ paymentStatus: 'completed' })
                })
                .then(response => {
                    if (!response.ok) {
                        console.warn(`Could not update payment status: ${response.status}`);
                    }
                    return updatedOrder; // Return the updated order to continue the chain
                });
            } else if (payment) {
                // If we have a payment record but no ID, try updating via order's payment endpoint
                return fetch(`${API_URL}/orders/${orderId}/payment-status`, {
                    method: 'PUT',
                    headers: {
                        ...authHeaders,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ paymentStatus: 'completed' })
                })
                .then(response => {
                    if (!response.ok) {
                        console.warn(`Could not update payment status: ${response.status}`);
                    }
                    return updatedOrder;
                });
            }
        }
        return updatedOrder;
    })
    .then(updatedOrder => {
        showLoader(false);
        
        // Update in both arrays
        for (let i = 0; i < filteredPayments.length; i++) {
            if (filteredPayments[i].order && filteredPayments[i].order.idOrder === orderId) {
                filteredPayments[i].order.status = newStatus;
                if (newStatus === 'completed') {
                    filteredPayments[i].paymentStatus = 'completed';
                }
                break;
            }
        }
        
        for (let i = 0; i < allPayments.length; i++) {
            if (allPayments[i].order && allPayments[i].order.idOrder === orderId) {
                allPayments[i].order.status = newStatus;
                if (newStatus === 'completed') {
                    allPayments[i].paymentStatus = 'completed';
                }
                break;
            }
        }
        
        updateDisplay();
        
        // Close modal if open
        const modal = document.getElementById('paymentModal');
        if (modal) {
            modal.style.display = 'none';
        }
        
        // Show success notification
        showNotification(`Trạng thái đơn hàng #${orderId} đã được cập nhật thành ${getStatusText(newStatus)}`, 'success');
        
        // If we're viewing the order details, refresh them
        if (modal && modal.style.display === 'block') {
            viewOrderDetails(orderId);
        }
    })
    .catch(error => {
        showLoader(false);
        console.error('Error updating order status:', error);
        showNotification('Không thể cập nhật trạng thái đơn hàng. Vui lòng thử lại sau.', 'error');
    });
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

// Display order details in modal
function displayOrderDetails(order, payment) {
    const modal = document.getElementById('paymentModal');
    const modalTitle = document.getElementById('modalTitle');
    const modalBody = document.getElementById('modalBody');
    
    if (!modal || !modalTitle || !modalBody) return;
    
    modalTitle.innerHTML = `Chi tiết đơn hàng #${order.idOrder}`;
    
    let content = `
        <div class="order-details">
            <div class="order-info">
                <div class="info-row">
                    <span class="info-label">Thời gian đặt:</span>
                    <span class="info-value">${formatDate(order.orderTime)}</span>
                </div>
                <div class="info-row">
                    <span class="info-label">Bàn:</span>
                    <span class="info-value">${order.table ? `Bàn ${order.table.tableNumber}` : 'Mang về'}</span>
                </div>
                <div class="info-row">
                    <span class="info-label">Trạng thái đơn hàng:</span>
                    <span class="info-value status ${order.status?.toLowerCase()}">${getStatusText(order.status)}</span>
                </div>
                <div class="info-row">
                    <span class="info-label">Phương thức thanh toán:</span>
                    <span class="info-value payment-method ${payment?.paymentMethod?.toLowerCase() || ''}">${getPaymentMethodText(payment?.paymentMethod)}</span>
                </div>
                <div class="info-row">
                    <span class="info-label">Thời gian thanh toán:</span>
                    <span class="info-value">${payment?.createAt ? formatDate(payment.createAt) : 'Chưa thanh toán'}</span>
                </div>
                ${payment?.transactionId ? `
                <div class="info-row">
                    <span class="info-label">Mã giao dịch:</span>
                    <span class="info-value">${payment.transactionId}</span>
                </div>` : ''}
                ${payment?.paymentStatus ? `
                <div class="info-row">
                    <span class="info-label">Trạng thái thanh toán:</span>
                    <span class="info-value status ${payment.paymentStatus.toLowerCase()}">${payment.paymentStatus === 'completed' ? 'Đã thanh toán' : 'Chờ thanh toán'}</span>
                </div>` : ''}
            </div>
            
            <h3>Chi tiết món</h3>
            <table class="items-table">
                <thead>
                    <tr>
                        <th>Món</th>
                        <th>Đơn giá</th>
                        <th>Số lượng</th>
                        <th>Thành tiền</th>
                    </tr>
                </thead>
                <tbody>
    `;
    
    // Add order items
    if (order.orderDetails && order.orderDetails.length > 0) {
        order.orderDetails.forEach(item => {
            content += `
                <tr>
                    <td>${item.product?.productName || 'Không xác định'}</td>
                    <td>${formatCurrency(item.unitPrice)}</td>
                    <td>${item.quantity}</td>
                    <td>${formatCurrency(item.unitPrice * item.quantity)}</td>
                </tr>
            `;
        });
    } else {
        content += `
            <tr>
                <td colspan="4" class="no-data">Không có món nào</td>
            </tr>
        `;
    }
    
    // Add totals
    content += `
                </tbody>
                <tfoot>
                    <tr>
                        <td colspan="3" class="total-label">Tổng cộng:</td>
                        <td class="total-value">${formatCurrency(order.totalAmount)}</td>
                    </tr>
                </tfoot>
            </table>
    `;
    
    // Add notes if any
    if (order.note) {
        content += `
            <div class="order-notes">
                <h3>Ghi chú</h3>
                <p>${order.note}</p>
            </div>
        `;
    }
    
    // Add actions
    content += `
        <div class="modal-actions">
            <button class="action-btn" onclick="printOrderDetails(${order.idOrder})">
                <i class="fas fa-print"></i> In hóa đơn
            </button>
    `;
    
    // Add update status button if order is processing
    if (order.status === 'processing') {
        content += `
            <button class="action-btn complete-btn" onclick="updateOrderStatus(${order.idOrder}, 'completed')">
                <i class="fas fa-check"></i> Hoàn thành
            </button>
        `;
    }
    
    content += `
        </div>
    </div>
    `;
    
    modalBody.innerHTML = content;
    modal.style.display = 'block';
    
    // Close modal when clicking on X
    const closeBtn = modal.querySelector('.close');
    if (closeBtn) {
        closeBtn.onclick = function() {
            modal.style.display = 'none';
        }
    }
    
    // Close modal when clicking outside
    window.onclick = function(event) {
        if (event.target === modal) {
            modal.style.display = 'none';
        }
    }
}

// Print order details
function printOrderDetails(orderId) {
    const payment = filteredPayments.find(p => p.order && p.order.idOrder === orderId);
    if (!payment || !payment.order) {
        console.error('Order not found for printing:', orderId);
        showNotification('Không tìm thấy thông tin đơn hàng để in', 'error');
        return;
    }
    
    const order = payment.order;
    const printWindow = window.open('', '', 'width=800,height=600');
    
    let printContent = `
        <html>
        <head>
            <title>Hóa đơn #${order.idOrder}</title>
            <style>
                body { font-family: Arial, sans-serif; margin: 20px; }
                .header { text-align: center; margin-bottom: 20px; }
                .info { margin-bottom: 20px; }
                .info-row { margin-bottom: 5px; }
                .info-label { font-weight: bold; }
                table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
                th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
                th { background-color: #f2f2f2; }
                .total-row { font-weight: bold; }
                .footer { text-align: center; margin-top: 30px; font-style: italic; }
                .payment-info { margin-top: 20px; border-top: 1px dashed #ccc; padding-top: 10px; }
            </style>
        </head>
        <body>
            <div class="header">
                <h1>T2K Coffee</h1>
                <h2>Hóa đơn thanh toán</h2>
            </div>
            
            <div class="info">
                <div class="info-row"><span class="info-label">Mã đơn hàng:</span> #${order.idOrder}</div>
                <div class="info-row"><span class="info-label">Thời gian đặt:</span> ${formatDate(order.orderTime)}</div>
                <div class="info-row"><span class="info-label">Bàn:</span> ${order.table ? `Bàn ${order.table.tableNumber}` : 'Mang về'}</div>
                <div class="info-row"><span class="info-label">Trạng thái đơn hàng:</span> ${getStatusText(order.status)}</div>
            </div>
            
            <table>
                <thead>
                    <tr>
                        <th>Món</th>
                        <th>Đơn giá</th>
                        <th>Số lượng</th>
                        <th>Thành tiền</th>
                    </tr>
                </thead>
                <tbody>
    `;
    
    // Add order items
    if (order.orderDetails && order.orderDetails.length > 0) {
        order.orderDetails.forEach(item => {
            printContent += `
                <tr>
                    <td>${item.product?.productName || 'Không xác định'}</td>
                    <td>${formatCurrency(item.unitPrice)}</td>
                    <td>${item.quantity}</td>
                    <td>${formatCurrency(item.unitPrice * item.quantity)}</td>
                </tr>
            `;
        });
    } else {
        printContent += `
            <tr>
                <td colspan="4" style="text-align: center;">Không có món nào</td>
            </tr>
        `;
    }
    
    // Add totals
    printContent += `
                </tbody>
                <tfoot>
                    <tr class="total-row">
                        <td colspan="3">Tổng cộng:</td>
                        <td>${formatCurrency(order.totalAmount)}</td>
                    </tr>
                </tfoot>
            </table>
            
            <div class="payment-info">
                <h3>Thông tin thanh toán</h3>
                <div class="info-row"><span class="info-label">Phương thức thanh toán:</span> ${getPaymentMethodText(payment.paymentMethod)}</div>
                <div class="info-row"><span class="info-label">Thời gian thanh toán:</span> ${payment.createAt ? formatDate(payment.createAt) : 'Chưa thanh toán'}</div>
                ${payment.transactionId ? `<div class="info-row"><span class="info-label">Mã giao dịch:</span> ${payment.transactionId}</div>` : ''}
                <div class="info-row"><span class="info-label">Trạng thái thanh toán:</span> ${payment.paymentStatus === 'completed' ? 'Đã thanh toán' : 'Chờ thanh toán'}</div>
            </div>
    `;
    
    // Add notes if any
    if (order.note) {
        printContent += `
            <div class="notes">
                <h3>Ghi chú</h3>
                <p>${order.note}</p>
            </div>
        `;
    }
    
    printContent += `
            <div class="footer">
                <p>Cảm ơn quý khách đã sử dụng dịch vụ của T2K Coffee!</p>
                <p>Hóa đơn in ngày: ${formatDate(new Date())}</p>
            </div>
        </body>
        </html>
    `;
    
    printWindow.document.open();
    printWindow.document.write(printContent);
    printWindow.document.close();
    
    setTimeout(() => {
        printWindow.print();
        // printWindow.close();
    }, 500);
}