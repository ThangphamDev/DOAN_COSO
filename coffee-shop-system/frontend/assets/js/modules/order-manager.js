/**
 * Order Manager Module - T2K Coffee Admin
 * Manages the order management functionality for the admin interface
 */

// Constants
const API_BASE_URL = 'http://localhost:8081/api';
const ORDERS_ENDPOINT = `${API_BASE_URL}/orders`;

// Status translations
const STATUS_TRANSLATIONS = {
    'processing': 'Đang xử lý',
    'completed': 'Hoàn thành',
    'cancelled': 'Đã hủy',
    'pending': 'Chờ xử lý'
};

// Status classes
const STATUS_CLASSES = {
    'processing': 'processing',
    'completed': 'completed',
    'cancelled': 'cancelled',
    'pending': 'pending'
};

// DOM elements
let ordersTable;
let orderTableBody;
let searchInput;
let statusFilter;
let dateFromInput;
let dateToInput;
let paginationContainer;
let pageInfo;
let orderModal;
let orderDetailsContainer;
let emptyStateContainer;
let orderStats;

// State variables
let orders = [];
let filteredOrders = [];
let currentPage = 1;
let itemsPerPage = 10;
let totalOrders = 0;
let totalPages = 0;

// Initialize the module
document.addEventListener('DOMContentLoaded', () => {
    initElements();
    addEventListeners();
    loadOrders();
});

// Initialize DOM elements
function initElements() {
    ordersTable = document.getElementById('ordersTable');
    orderTableBody = document.getElementById('orderTableBody');
    searchInput = document.getElementById('searchOrder');
    statusFilter = document.getElementById('statusFilter');
    dateFromInput = document.getElementById('dateFrom');
    dateToInput = document.getElementById('dateTo');
    paginationContainer = document.querySelector('.pagination');
    pageInfo = document.querySelector('.page-info');
    orderModal = document.getElementById('orderModal');
    orderDetailsContainer = document.getElementById('orderDetails');
    emptyStateContainer = document.querySelector('.empty-state');
    orderStats = document.querySelector('.order-stats');
    
    // Set current date as default for date inputs
    const today = new Date();
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(today.getDate() - 30);
    
    if (dateFromInput && dateToInput) {
        dateFromInput.valueAsDate = thirtyDaysAgo;
        dateToInput.valueAsDate = today;
    }
}

// Add event listeners
function addEventListeners() {
    // Search input
    if (searchInput) {
        searchInput.addEventListener('input', debounce(() => {
            currentPage = 1;
            filterOrders();
        }, 300));
    }
    
    // Status filter
    if (statusFilter) {
        statusFilter.addEventListener('change', () => {
            currentPage = 1;
            filterOrders();
        });
    }
    
    // Date filters
    if (dateFromInput && dateToInput) {
        dateFromInput.addEventListener('change', () => {
            currentPage = 1;
            filterOrders();
        });
        
        dateToInput.addEventListener('change', () => {
            currentPage = 1;
            filterOrders();
        });
    }
    
    // Close modal
    document.querySelectorAll('.close-btn, .cancel-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            closeOrderModal();
        });
    });
    
    // Items per page
    const itemsPerPageSelect = document.getElementById('itemsPerPage');
    if (itemsPerPageSelect) {
        itemsPerPageSelect.addEventListener('change', (e) => {
            itemsPerPage = parseInt(e.target.value);
            currentPage = 1;
            displayOrders();
        });
    }
    
    // Add order button
    const addOrderBtn = document.querySelector('.add-order-btn');
    if (addOrderBtn) {
        addOrderBtn.addEventListener('click', () => {
            // Logic to add a new order
            console.log('Add new order');
            // For now, we'll just show a notification
            showNotification('Tính năng đang được phát triển', 'info');
        });
    }
}

// Load orders from API
async function loadOrders() {
    try {
        showLoader(true);
        const response = await fetch(ORDERS_ENDPOINT);
        
        if (!response.ok) {
            throw new Error(`Lỗi HTTP: ${response.status}`);
        }
        
        const apiOrders = await response.json();
        
        // Nếu trước đó có dữ liệu mẫu thì xóa nó
        if (orders.length > 0 && orders.some(o => o.idOrder >= 200 && o.status === 'processing' && o.totalAmount === 40000)) {
            orders = [];
        }
        orders = apiOrders;
        
        // Sort orders by date, newest first
        orders.sort((a, b) => new Date(b.orderTime) - new Date(a.orderTime));
        
        // Update filtered orders
        filterOrders();
        
        // Update order statistics
        updateOrderStats();
        
        showLoader(false);
        // Xóa tất cả notification lỗi/cảnh báo trước đó (nếu có)
        const notificationContainer = document.getElementById('notificationContainer');
        if (notificationContainer) {
            notificationContainer.querySelectorAll('.notification.error, .notification.warning').forEach(n => n.remove());
        }
        showNotification('Đã tải đơn hàng thành công', 'success');
    } catch (error) {
        console.error('Lỗi khi tải đơn hàng:', error);
        showLoader(false);
        // Không showNotification lỗi nữa, chỉ dùng dữ liệu mẫu
        createSampleOrders();
    }
}

// Create sample orders for demonstration when API is not available
function createSampleOrders() {
    orders = [];
    filterOrders();
    updateOrderStats();
    showNotification('Không thể kết nối đến API. Hiện không có dữ liệu đơn hàng.', 'warning');
}

// Filter orders based on search, status, and date
function filterOrders() {
    let filtered = [...orders];
    
    // Apply search filter
    if (searchInput && searchInput.value.trim() !== '') {
        const searchTerm = searchInput.value.trim().toLowerCase();
        filtered = filtered.filter(order => {
            // Search by order ID
            if (order.idOrder && order.idOrder.toString().includes(searchTerm)) {
                return true;
            }
            
            // Search by table number
            if (order.table && 
                order.table.tableNumber && 
                order.table.tableNumber.toString().toLowerCase().includes(searchTerm)) {
                return true;
            }
            
            // Search by products
            if (order.orderDetails && order.orderDetails.length > 0) {
                return order.orderDetails.some(detail => 
                    detail.product && 
                    detail.product.productName && 
                    detail.product.productName.toLowerCase().includes(searchTerm)
                );
            }
            
            return false;
        });
    }
    
    // Apply status filter
    if (statusFilter && statusFilter.value !== 'all') {
        const statusValue = statusFilter.value;
        filtered = filtered.filter(order => order.status === statusValue);
    }
    
    // Apply date filters
    if (dateFromInput && dateFromInput.value) {
        const fromDate = new Date(dateFromInput.value);
        fromDate.setHours(0, 0, 0, 0);
        filtered = filtered.filter(order => new Date(order.orderTime) >= fromDate);
    }
    
    if (dateToInput && dateToInput.value) {
        const toDate = new Date(dateToInput.value);
        toDate.setHours(23, 59, 59, 999);
        filtered = filtered.filter(order => new Date(order.orderTime) <= toDate);
    }
    
    // Update state
    filteredOrders = filtered;
    totalOrders = filteredOrders.length;
    totalPages = Math.ceil(totalOrders / itemsPerPage);
    
    // Update display
    displayOrders();
}

// Display filtered orders
function displayOrders() {
    if (!orderTableBody) return;
    
    // Clear existing rows
    orderTableBody.innerHTML = '';
    
    // Show empty state if no orders
    if (filteredOrders.length === 0) {
        if (ordersTable) ordersTable.style.display = 'none';
        if (emptyStateContainer) {
            emptyStateContainer.style.display = 'block';
            emptyStateContainer.innerHTML = `
                <i class="fas fa-receipt"></i>
                <h3>Không có đơn hàng nào</h3>
                <p>Không tìm thấy đơn hàng phù hợp với bộ lọc.</p>
                <button class="add-order-btn">
                    <i class="fas fa-plus"></i> Tạo đơn hàng mới
                </button>
            `;
            
            // Attach event listener to the new button
            const newBtn = emptyStateContainer.querySelector('.add-order-btn');
            if (newBtn) {
                newBtn.addEventListener('click', () => {
                    showNotification('Tính năng đang được phát triển', 'info');
                });
            }
        }
        if (paginationContainer) paginationContainer.style.display = 'none';
        return;
    }
    
    // Hide empty state and show table
    if (emptyStateContainer) emptyStateContainer.style.display = 'none';
    if (ordersTable) ordersTable.style.display = 'table';
    if (paginationContainer) paginationContainer.style.display = 'flex';
    
    // Calculate indices for pagination
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = Math.min(startIndex + itemsPerPage, filteredOrders.length);
    const ordersToShow = filteredOrders.slice(startIndex, endIndex);
    
    // Create rows
    ordersToShow.forEach(order => {
        const row = document.createElement('tr');
        
        // Format date
        const orderDate = new Date(order.orderTime);
        const formattedDate = orderDate.toLocaleDateString('vi-VN') + ' ' + 
                               orderDate.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
        
        // Format price
        const formattedPrice = new Intl.NumberFormat('vi-VN', { 
            style: 'currency', 
            currency: 'VND',
            minimumFractionDigits: 0
        }).format(order.totalAmount);
        
        // Get status display
        const statusDisplay = STATUS_TRANSLATIONS[order.status] || order.status;
        const statusClass = STATUS_CLASSES[order.status] || '';
        
        // Table information
        let tableInfo = '';
        if (order.table) {
            tableInfo = `
                <div class="table-info">
                    <div class="table-badge">${order.table.tableNumber}</div>
                    <div>
                        <div class="table-number">Bàn ${order.table.tableNumber}</div>
                        <div class="table-location">${order.table.location}</div>
                    </div>
                </div>
            `;
        } else {
            tableInfo = `
                <div class="takeaway-badge">
                    <i class="fas fa-shopping-bag"></i> Mang đi
                </div>
            `;
        }
        
        // Products information
        let productsList = '';
        if (order.orderDetails && order.orderDetails.length > 0) {
            // Get the first 2 items
            const visibleItems = order.orderDetails.slice(0, 2);
            const remainingCount = order.orderDetails.length - 2;
            
            productsList = visibleItems.map(detail => 
                detail.product ? `${detail.product.productName} x${detail.quantity}` : ''
            ).join(', ');
            
            if (remainingCount > 0) {
                productsList += ` và ${remainingCount} món khác`;
            }
        } else {
            productsList = 'Không có sản phẩm';
        }
        
        row.innerHTML = `
            <td>${order.idOrder}</td>
            <td>${formattedDate}</td>
            <td>${tableInfo}</td>
            <td>${productsList}</td>
            <td><span class="status-badge ${statusClass}">${statusDisplay}</span></td>
            <td class="price">${formattedPrice}</td>
            <td class="order-actions">
                <button class="btn-icon btn-view" data-id="${order.idOrder}" title="Xem chi tiết">
                    <i class="fas fa-eye"></i>
                </button>
                <button class="btn-icon btn-edit" data-id="${order.idOrder}" title="Sửa đơn hàng">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn-icon btn-print" data-id="${order.idOrder}" title="In hóa đơn">
                    <i class="fas fa-print"></i>
                </button>
                <button class="btn-icon btn-delete" data-id="${order.idOrder}" title="Xóa đơn hàng">
                    <i class="fas fa-trash-alt"></i>
                </button>
            </td>
        `;
        
        orderTableBody.appendChild(row);
    });
    
    // Update pagination
    updatePagination();
    
    // Attach event listeners to buttons
    attachOrderButtonEvents();

    // Thêm sự kiện click vào badge trạng thái để cập nhật trạng thái đơn hàng
    orderTableBody.querySelectorAll('.status-badge').forEach(badge => {
        badge.style.cursor = 'pointer';
        badge.title = 'Nhấn để chuyển sang Hoàn thành';
        badge.addEventListener('click', async function() {
            // Lấy idOrder từ hàng tương ứng
            const row = this.closest('tr');
            if (!row) return;
            const idCell = row.querySelector('td');
            if (!idCell) return;
            const orderId = idCell.textContent.trim();
            // Kiểm tra trạng thái hiện tại
            if (this.classList.contains('processing')) {
                try {
                    showLoader(true, 'Đang cập nhật trạng thái...');
                    const res = await fetch(`${ORDERS_ENDPOINT}/${orderId}/status`, {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ status: 'completed' })
                    });
                    if (!res.ok) throw new Error('Cập nhật trạng thái thất bại');
                    await loadOrders();
                } catch (err) {
                    showNotification('Lỗi: ' + err.message, 'error');
                } finally {
                    showLoader(false);
                }
            }
        });
    });
}

// Update pagination display
function updatePagination() {
    if (!paginationContainer || !pageInfo) return;
    
    paginationContainer.innerHTML = '';
    
    // Previous button
    const prevBtn = document.createElement('button');
    prevBtn.classList.add('page-btn');
    prevBtn.innerHTML = '<i class="fas fa-chevron-left"></i>';
    prevBtn.disabled = currentPage === 1;
    prevBtn.addEventListener('click', () => {
        if (currentPage > 1) {
            currentPage--;
            displayOrders();
        }
    });
    paginationContainer.appendChild(prevBtn);
    
    // Page buttons
    const maxPages = 5; // Maximum number of page buttons to show
    let startPage = Math.max(1, currentPage - Math.floor(maxPages / 2));
    let endPage = Math.min(totalPages, startPage + maxPages - 1);
    
    if (endPage - startPage + 1 < maxPages) {
        startPage = Math.max(1, endPage - maxPages + 1);
    }
    
    for (let i = startPage; i <= endPage; i++) {
        const pageBtn = document.createElement('button');
        pageBtn.classList.add('page-btn');
        if (i === currentPage) {
            pageBtn.classList.add('active');
            pageBtn.style.backgroundColor = '#5D4037';
            pageBtn.style.color = 'white';
            pageBtn.style.border = 'none';
        }
        pageBtn.textContent = i;
        pageBtn.addEventListener('click', () => {
            currentPage = i;
            displayOrders();
        });
        paginationContainer.appendChild(pageBtn);
    }
    
    // Next button
    const nextBtn = document.createElement('button');
    nextBtn.classList.add('page-btn');
    nextBtn.innerHTML = '<i class="fas fa-chevron-right"></i>';
    nextBtn.disabled = currentPage === totalPages;
    nextBtn.addEventListener('click', () => {
        if (currentPage < totalPages) {
            currentPage++;
            displayOrders();
        }
    });
    paginationContainer.appendChild(nextBtn);
    
    // Update page info
    const startIndex = (currentPage - 1) * itemsPerPage + 1;
    const endIndex = Math.min(startIndex + itemsPerPage - 1, totalOrders);
    pageInfo.textContent = `Hiển thị ${startIndex}-${endIndex} trên ${totalOrders} đơn hàng`;
}

// Edit order
function openEditOrderModal(orderId) {
    const order = orders.find(o => o.idOrder == orderId);
    if (!order) {
        console.error('Không tìm thấy đơn hàng với ID:', orderId);
        showNotification('Không tìm thấy thông tin đơn hàng', 'error');
        return;
    }
    
    console.log('Mở modal chỉnh sửa cho đơn hàng:', order);
    
    // Get the edit modal elements
    const editOrderModal = document.getElementById('editOrderModal');
    if (!editOrderModal) {
        console.error('Không tìm thấy modal chỉnh sửa đơn hàng trong DOM');
        showNotification('Lỗi hiển thị form chỉnh sửa', 'error');
        return;
    }
    
    try {
        // Set form values
        const editOrderIdInput = document.getElementById('editOrderId');
        const editOrderStatusSelect = document.getElementById('editOrderStatus');
        const editOrderNoteInput = document.getElementById('editOrderNotes');
        
        if (!editOrderIdInput || !editOrderStatusSelect || !editOrderNoteInput) {
            console.error('Không tìm thấy các trường form chỉnh sửa đơn hàng');
            showNotification('Lỗi form chỉnh sửa', 'error');
            return;
        }
        
        editOrderIdInput.value = order.idOrder;
        editOrderStatusSelect.value = order.status;
        editOrderNoteInput.value = order.note || '';
        
        // Clone order items to work with
        const orderItemsBeingEdited = JSON.parse(JSON.stringify(order.orderDetails || []));
        
        // Populate items table
        const editOrderItemsTable = document.getElementById('editOrderItemsTable');
        if (editOrderItemsTable) {
            const tableBody = editOrderItemsTable.querySelector('tbody');
            if (tableBody) {
                renderEditOrderItems(tableBody, orderItemsBeingEdited);
            } else {
                console.error('Không tìm thấy tbody trong bảng items');
            }
        } else {
            console.error('Không tìm thấy bảng items trong modal');
        }
        
        // Try different methods to open the modal
        if (typeof bootstrap !== 'undefined' && bootstrap.Modal) {
            // Method 1: Using Bootstrap 5 modal
            try {
                const modalInstance = new bootstrap.Modal(editOrderModal);
                modalInstance.show();
                console.log('Đã mở modal bằng Bootstrap 5');
            } catch (error) {
                console.error('Lỗi khi mở modal bằng Bootstrap 5:', error);
                
                // Method 2: jQuery Bootstrap modal (fallback)
                if (typeof $ !== 'undefined' && typeof $.fn.modal !== 'undefined') {
                    try {
                        $(editOrderModal).modal('show');
                        console.log('Đã mở modal bằng jQuery Bootstrap');
                    } catch (error) {
                        console.error('Lỗi khi mở modal bằng jQuery:', error);
                        
                        // Method 3: Basic display (final fallback)
                        editOrderModal.style.display = 'block';
                        console.log('Đã mở modal bằng CSS display');
                    }
                } else {
                    // Method 3: Basic display fallback if jQuery is not available
                    editOrderModal.style.display = 'block';
                    editOrderModal.classList.add('show');
                    document.body.classList.add('modal-open');
                    
                    // Create a backdrop
                    let backdrop = document.querySelector('.modal-backdrop');
                    if (!backdrop) {
                        backdrop = document.createElement('div');
                        backdrop.className = 'modal-backdrop fade show';
                        document.body.appendChild(backdrop);
                    }
                    
                    console.log('Đã mở modal bằng CSS display với backdrop');
                }
            }
        } else {
            // Method 3: Basic display if Bootstrap is not available
            editOrderModal.style.display = 'block';
            editOrderModal.classList.add('show');
            document.body.classList.add('modal-open');
            console.log('Đã mở modal bằng CSS display (no Bootstrap)');
        }
        
        // Add event listeners for save button
        const saveOrderBtn = document.getElementById('saveOrderBtn');
        if (saveOrderBtn) {
            // Remove existing event listeners first
            const newSaveBtn = saveOrderBtn.cloneNode(true);
            saveOrderBtn.parentNode.replaceChild(newSaveBtn, saveOrderBtn);
            
            newSaveBtn.addEventListener('click', () => {
                saveOrderChanges(order.idOrder, orderItemsBeingEdited);
            });
            console.log('Đã gắn sự kiện cho nút lưu');
        } else {
            console.error('Không tìm thấy nút lưu trong modal');
        }
        
        // Add event listeners for add item button
        const addItemBtn = document.getElementById('addItemBtn');
        if (addItemBtn) {
            // Remove existing event listeners first
            const newAddItemBtn = addItemBtn.cloneNode(true);
            addItemBtn.parentNode.replaceChild(newAddItemBtn, addItemBtn);
            
            newAddItemBtn.addEventListener('click', () => {
                openAddProductModal(orderItemsBeingEdited, tableBody);
            });
            console.log('Đã gắn sự kiện cho nút thêm sản phẩm');
        } else {
            console.error('Không tìm thấy nút thêm sản phẩm trong modal');
        }
        
        // Add close button event listeners
        const closeButtons = editOrderModal.querySelectorAll('.close-btn, .btn-cancel');
        closeButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                closeEditOrderModal();
            });
        });
        
        console.log('Đã hoàn thành việc mở modal chỉnh sửa');
    } catch (error) {
        console.error('Lỗi khi mở modal chỉnh sửa:', error);
        showNotification('Đã xảy ra lỗi khi mở form chỉnh sửa', 'error');
    }
}

// Close edit order modal
function closeEditOrderModal() {
    const editOrderModal = document.getElementById('editOrderModal');
    if (!editOrderModal) return;
    
    try {
        if (typeof bootstrap !== 'undefined' && bootstrap.Modal) {
            // Method 1: Bootstrap 5
            const modalInstance = bootstrap.Modal.getInstance(editOrderModal);
            if (modalInstance) {
                modalInstance.hide();
                return;
            }
        }
        
        if (typeof $ !== 'undefined' && typeof $.fn.modal !== 'undefined') {
            // Method 2: jQuery
            $(editOrderModal).modal('hide');
            return;
        }
        
        // Method 3: Basic fallback
        editOrderModal.style.display = 'none';
        editOrderModal.classList.remove('show');
        document.body.classList.remove('modal-open');
        
        // Remove backdrop
        const backdrop = document.querySelector('.modal-backdrop');
        if (backdrop) {
            backdrop.remove();
        }
    } catch (error) {
        console.error('Lỗi khi đóng modal:', error);
        // Final fallback
        editOrderModal.style.display = 'none';
    }
}

// Render edit order items
function renderEditOrderItems(tableBody, items) {
    tableBody.innerHTML = '';
    
    // Check if there are items
    if (!items || items.length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="5" class="text-center">Không có sản phẩm nào trong đơn hàng</td>
            </tr>
        `;
        document.getElementById('editOrderTotal').textContent = '0 ₫';
        return;
    }
    
    // Calculate total
    let total = 0;
    
    // Add each item
    items.forEach((item, index) => {
        if (!item.product) return;
        
        const unitPrice = item.unitPrice || item.product.price || 0;
        const quantity = item.quantity || 0;
        const subtotal = unitPrice * quantity;
        total += subtotal;
        
        const formatter = new Intl.NumberFormat('vi-VN', { 
            style: 'currency', 
            currency: 'VND',
            minimumFractionDigits: 0
        });
        
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${item.product.productName}</td>
            <td>${formatter.format(unitPrice)}</td>
            <td>
                <input type="number" min="1" class="quantity-input" 
                    value="${quantity}" data-item-index="${index}">
            </td>
            <td>${formatter.format(subtotal)}</td>
            <td>
                <button type="button" class="remove-item-btn" data-item-index="${index}">
                    <i class="fas fa-times"></i>
                </button>
            </td>
        `;
        
        tableBody.appendChild(row);
    });
    
    // Update total
    document.getElementById('editOrderTotal').textContent = new Intl.NumberFormat('vi-VN', { 
        style: 'currency', 
        currency: 'VND',
        minimumFractionDigits: 0
    }).format(total);
    
    // Add event listeners for quantity inputs
    document.querySelectorAll('.quantity-input').forEach(input => {
        input.addEventListener('change', (e) => {
            const index = parseInt(e.target.getAttribute('data-item-index'));
            const newQuantity = parseInt(e.target.value);
            
            if (isNaN(newQuantity) || newQuantity < 1) {
                e.target.value = items[index].quantity;
                showNotification('Số lượng không hợp lệ', 'error');
                return;
            }
            
            items[index].quantity = newQuantity;
            renderEditOrderItems(tableBody, items);
        });
    });
    
    // Add event listeners for remove buttons
    document.querySelectorAll('.remove-item-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const index = parseInt(e.currentTarget.getAttribute('data-item-index'));
            items.splice(index, 1);
            renderEditOrderItems(tableBody, items);
        });
    });
}

// Open add product modal
function openAddProductModal(orderItems, orderItemsTable) {
    // Get the modal element
    const addProductModal = document.getElementById('addProductModal');
    if (!addProductModal) return;
    
    // Get the form elements
    const productSelect = document.getElementById('productSelect');
    const productQuantity = document.getElementById('productQuantity');
    
    // Reset the form
    productSelect.innerHTML = '<option value="">-- Chọn sản phẩm --</option>';
    productQuantity.value = 1;
    
    // Populate product options (using sample data for demonstration)
    const sampleProducts = [
        { id: 1, productName: 'Espresso', price: 30000, description: 'Cà phê đậm đặc' },
        { id: 2, productName: 'Latte', price: 40000, description: 'Espresso với sữa' },
        { id: 3, productName: 'Cappuccino', price: 45000, description: 'Espresso với sữa và bọt sữa' },
        { id: 4, productName: 'Americano', price: 35000, description: 'Espresso với nước' },
        { id: 5, productName: 'Trà đào', price: 35000, description: 'Trà đào thanh mát' },
        { id: 6, productName: 'Trà sữa', price: 40000, description: 'Trà sữa trân châu' }
    ];
    
    sampleProducts.forEach(product => {
        const option = document.createElement('option');
        option.value = product.id;
        option.textContent = `${product.productName} - ${new Intl.NumberFormat('vi-VN', { 
            style: 'currency', 
            currency: 'VND',
            minimumFractionDigits: 0
        }).format(product.price)}`;
        productSelect.appendChild(option);
    });
    
    // Show the modal
    const modal = new bootstrap.Modal(addProductModal);
    modal.show();
    
    // Add event listener for add product button
    const confirmAddProductBtn = document.getElementById('confirmAddProductBtn');
    if (confirmAddProductBtn) {
        // Remove existing event listeners first
        const newConfirmBtn = confirmAddProductBtn.cloneNode(true);
        confirmAddProductBtn.parentNode.replaceChild(newConfirmBtn, confirmAddProductBtn);
        
        newConfirmBtn.addEventListener('click', () => {
            // Get selected product
            const productId = productSelect.value;
            const quantity = parseInt(productQuantity.value);
            
            if (!productId || isNaN(quantity) || quantity < 1) {
                showNotification('Vui lòng chọn sản phẩm và số lượng hợp lệ', 'error');
                return;
            }
            
            // Find product details
            const product = sampleProducts.find(p => p.id == productId);
            if (!product) {
                showNotification('Sản phẩm không tồn tại', 'error');
                return;
            }
            
            // Check if product already exists in order
            const existingItemIndex = orderItems.findIndex(item => 
                item.product && item.product.id == productId
            );
            
            if (existingItemIndex >= 0) {
                // Update existing item
                orderItems[existingItemIndex].quantity += quantity;
            } else {
                // Add new item
                orderItems.push({
                    product: product,
                    quantity: quantity,
                    unitPrice: product.price
                });
            }
            
            // Hide modal
            modal.hide();
            
            // Update order items display
            renderEditOrderItems(orderItemsTable, orderItems);
            
            showNotification('Đã thêm sản phẩm vào đơn hàng', 'success');
        });
    }
}

// Save order changes
async function saveOrderChanges(orderId, orderItems) {
    showLoader(true);
    
    try {
        // Get form values
        const status = document.getElementById('editOrderStatus').value;
        const note = document.getElementById('editOrderNotes').value;
        
        // Calculate total amount
        const totalAmount = orderItems.reduce((sum, item) => {
            const unitPrice = item.unitPrice || item.product.price || 0;
            const quantity = item.quantity || 0;
            return sum + (unitPrice * quantity);
        }, 0);
        
        // Create payload
        const payload = {
            status: status,
            note: note,
            orderDetails: orderItems,
            totalAmount: totalAmount
        };
        
        // Send update request to API
        const response = await fetch(`${ORDERS_ENDPOINT}/${orderId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        // Update local data with the response
        const updatedOrder = await response.json();
        
        // Find and update the order in our local array
        const index = orders.findIndex(o => o.idOrder == orderId);
        if (index !== -1) {
            orders[index] = updatedOrder;
        }
        
        // Update display
        filterOrders();
        updateOrderStats();
        
        // Hide modal
        const editOrderModal = document.getElementById('editOrderModal');
        let closed = false;
        if (typeof bootstrap !== 'undefined' && bootstrap.Modal) {
            const modal = bootstrap.Modal.getInstance(editOrderModal);
            if (modal) {
                modal.hide();
                closed = true;
            }
        }
        if (!closed) {
            // Fallback: ẩn modal bằng CSS
            editOrderModal.style.display = 'none';
            editOrderModal.classList.remove('show');
            document.body.classList.remove('modal-open');
            // Xóa backdrop nếu có
            const backdrop = document.querySelector('.modal-backdrop');
            if (backdrop) backdrop.remove();
        }
        
        showNotification('Đơn hàng đã được cập nhật thành công', 'success');
    } catch (error) {
        console.error('Lỗi khi cập nhật đơn hàng:', error);
        
        // For demonstration, update the local data even if API fails
        const index = orders.findIndex(o => o.idOrder == orderId);
        if (index !== -1) {
            // Get form values
            const status = document.getElementById('editOrderStatus').value;
            const note = document.getElementById('editOrderNotes').value;
            
            // Calculate total amount
            const totalAmount = orderItems.reduce((sum, item) => {
                const unitPrice = item.unitPrice || item.product.price || 0;
                const quantity = item.quantity || 0;
                return sum + (unitPrice * quantity);
            }, 0);
            
            // Update the order in our local array
            orders[index].status = status;
            orders[index].note = note;
            orders[index].orderDetails = orderItems;
            orders[index].totalAmount = totalAmount;
            
            // Update display
            filterOrders();
            updateOrderStats();
            
            // Hide modal
            const editOrderModal = document.getElementById('editOrderModal');
            let closed = false;
            if (typeof bootstrap !== 'undefined' && bootstrap.Modal) {
                const modal = bootstrap.Modal.getInstance(editOrderModal);
                if (modal) {
                    modal.hide();
                    closed = true;
                }
            }
            if (!closed) {
                // Fallback: ẩn modal bằng CSS
                editOrderModal.style.display = 'none';
                editOrderModal.classList.remove('show');
                document.body.classList.remove('modal-open');
                // Xóa backdrop nếu có
                const backdrop = document.querySelector('.modal-backdrop');
                if (backdrop) backdrop.remove();
            }
            
            showNotification('Đơn hàng đã được cập nhật (chế độ demo)', 'warning');
        } else {
            showNotification('Không thể cập nhật đơn hàng: ' + error.message, 'error');
        }
    } finally {
        showLoader(false);
    }
}

// Delete order
async function deleteOrder(orderId) {
    showLoader(true);
    
    try {
        // Send delete request to API
        const response = await fetch(`${ORDERS_ENDPOINT}/${orderId}`, {
            method: 'DELETE'
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        // Remove order from local array
        const index = orders.findIndex(o => o.idOrder == orderId);
        if (index !== -1) {
            orders.splice(index, 1);
        }
        
        // Update display
        filterOrders();
        updateOrderStats();
        
        showNotification('Đơn hàng đã được xóa thành công', 'success');
    } catch (error) {
        console.error('Lỗi khi xóa đơn hàng:', error);
        
        // For demonstration, remove the order from local array even if API fails
        const index = orders.findIndex(o => o.idOrder == orderId);
        if (index !== -1) {
            orders.splice(index, 1);
            
            // Update display
            filterOrders();
            updateOrderStats();
            
            showNotification('Đơn hàng đã được xóa (chế độ demo)', 'warning');
        } else {
            showNotification('Không thể xóa đơn hàng: ' + error.message, 'error');
        }
    } finally {
        showLoader(false);
    }
}

// Attach event listeners to order buttons
function attachOrderButtonEvents() {
    // View order details
    document.querySelectorAll('.btn-view').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const orderId = e.currentTarget.getAttribute('data-id');
            viewOrderDetails(orderId);
        });
    });
    
    // Edit order
    document.querySelectorAll('.btn-edit').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const orderId = e.currentTarget.getAttribute('data-id');
            openEditOrderModal(orderId);
        });
    });
    
    // Print order
    document.querySelectorAll('.btn-print').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const orderId = e.currentTarget.getAttribute('data-id');
            showNotification('Tính năng đang được phát triển', 'info');
        });
    });
    
    // Delete order
    document.querySelectorAll('.btn-delete').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const orderId = e.currentTarget.getAttribute('data-id');
            confirmDeleteOrder(orderId);
        });
    });
}

// View order details
function viewOrderDetails(orderId) {
    const order = orders.find(o => o.idOrder == orderId);
    if (!order || !orderModal || !orderDetailsContainer) return;
    
    // Format date
    const orderDate = new Date(order.orderTime);
    const formattedDate = orderDate.toLocaleDateString('vi-VN') + ' ' + 
                           orderDate.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
    
    // Format price
    const formatter = new Intl.NumberFormat('vi-VN', { 
        style: 'currency', 
        currency: 'VND',
        minimumFractionDigits: 0
    });
    
    // Get status display
    const statusDisplay = STATUS_TRANSLATIONS[order.status] || order.status;
    const statusClass = STATUS_CLASSES[order.status] || '';
    
    // Prepare the content
    let content = `
        <div class="order-details-header">
            <h3>Chi tiết đơn hàng #${order.idOrder}</h3>
            <span class="status-badge ${statusClass}">${statusDisplay}</span>
        </div>
        
        <div class="order-info-grid">
            <div class="order-info-item">
                <span class="order-info-label">Thời gian đặt</span>
                <span class="order-info-value">${formattedDate}</span>
            </div>
            <div class="order-info-item">
                <span class="order-info-label">Tổng tiền</span>
                <span class="order-info-value">${formatter.format(order.totalAmount)}</span>
            </div>
    `;
    
    // Add table information if available
    if (order.table) {
        content += `
            <div class="order-info-item">
                <span class="order-info-label">Bàn</span>
                <span class="order-info-value">Bàn ${order.table.tableNumber} (${order.table.location})</span>
            </div>
            <div class="order-info-item">
                <span class="order-info-label">Trạng thái bàn</span>
                <span class="order-info-value">${order.table.status}</span>
            </div>
        `;
    } else {
        content += `
            <div class="order-info-item">
                <span class="order-info-label">Loại đơn</span>
                <span class="order-info-value">Mang đi</span>
            </div>
        `;
    }
    
    // Add note if available
    content += `
        <div class="order-info-item">
            <span class="order-info-label">Ghi chú</span>
            <span class="order-info-value">${order.note || 'Không có ghi chú'}</span>
        </div>
    `;
    
    content += `</div>`; // Close order-info-grid
    
    // Add order items
    content += `
        <div class="order-items">
            <table class="order-items-table">
                <thead>
                    <tr>
                        <th>Sản phẩm</th>
                        <th>Đơn giá</th>
                        <th>Số lượng</th>
                        <th>Thành tiền</th>
                    </tr>
                </thead>
                <tbody>
    `;
    
    if (order.orderDetails && order.orderDetails.length > 0) {
        order.orderDetails.forEach(detail => {
            if (!detail.product) return;
            
            const unitPrice = detail.unitPrice || detail.product.price || 0;
            const quantity = detail.quantity || 0;
            const subtotal = unitPrice * quantity;
            
            content += `
                <tr>
                    <td class="product-cell">
                        <div class="product-image">
                            <img src="../assets/images/products/${detail.product.image || 'default.jpg'}" alt="${detail.product.productName}">
                        </div>
                        <div>
                            <div class="product-name">${detail.product.productName}</div>
                            <div class="product-price">${detail.product.description || ''}</div>
                        </div>
                    </td>
                    <td>${formatter.format(unitPrice)}</td>
                    <td class="quantity-cell">${quantity}</td>
                    <td class="subtotal-cell">${formatter.format(subtotal)}</td>
                </tr>
            `;
        });
    } else {
        content += `
            <tr>
                <td colspan="4" class="text-center">Không có sản phẩm nào</td>
            </tr>
        `;
    }
    
    content += `
                </tbody>
            </table>
        </div>
        
        <div class="order-summary">
            <div class="summary-row">
                <span class="summary-label">Tổng phụ:</span>
                <span class="summary-value">${formatter.format(order.totalAmount)}</span>
            </div>
            <div class="summary-row">
                <span class="summary-label">Thuế:</span>
                <span class="summary-value">${formatter.format(0)}</span>
            </div>
            <div class="summary-row total">
                <span class="summary-label">Tổng cộng:</span>
                <span class="summary-value total">${formatter.format(order.totalAmount)}</span>
            </div>
        </div>
    `;
    
    // Set the content and show the modal
    orderDetailsContainer.innerHTML = content;
    orderModal.style.display = 'flex';
    
    // Add event listener to close when clicking outside
    orderModal.addEventListener('click', (e) => {
        if (e.target === orderModal) {
            closeOrderModal();
        }
    });
}

// Close order modal
function closeOrderModal() {
    if (orderModal) {
        orderModal.style.display = 'none';
    }
}

// Confirm delete order
function confirmDeleteOrder(orderId) {
    if (confirm(`Bạn có chắc chắn muốn xóa đơn hàng #${orderId}?`)) {
        deleteOrder(orderId);
    }
}

// Update order statistics
function updateOrderStats() {
    if (!orderStats) return;
    
    // Count orders by status
    const processingCount = orders.filter(order => order.status === 'processing').length;
    const completedCount = orders.filter(order => order.status === 'completed').length;
    const cancelledCount = orders.filter(order => order.status === 'cancelled').length;
    
    // Calculate total revenue from completed orders
    const totalRevenue = orders
        .filter(order => order.status === 'completed')
        .reduce((sum, order) => sum + (order.totalAmount || 0), 0);
    
    // Format the revenue
    const formattedRevenue = new Intl.NumberFormat('vi-VN', { 
        style: 'currency', 
        currency: 'VND',
        minimumFractionDigits: 0
    }).format(totalRevenue);
    
    // Update the stats display
    orderStats.innerHTML = `
        <div class="stat-card">
            <div class="stat-icon processing">
                <i class="fas fa-hourglass-half"></i>
            </div>
            <div class="stat-details">
                <div class="stat-title">Đang xử lý</div>
                <div class="stat-value">${processingCount}</div>
            </div>
        </div>
        
        <div class="stat-card">
            <div class="stat-icon completed">
                <i class="fas fa-check-circle"></i>
            </div>
            <div class="stat-details">
                <div class="stat-title">Hoàn thành</div>
                <div class="stat-value">${completedCount}</div>
            </div>
        </div>
        
        <div class="stat-card">
            <div class="stat-icon cancelled">
                <i class="fas fa-times-circle"></i>
            </div>
            <div class="stat-details">
                <div class="stat-title">Đã hủy</div>
                <div class="stat-value">${cancelledCount}</div>
            </div>
        </div>
        
        <div class="stat-card">
            <div class="stat-icon total">
                <i class="fas fa-money-bill-wave"></i>
            </div>
            <div class="stat-details">
                <div class="stat-title">Tổng doanh thu</div>
                <div class="stat-value">${formattedRevenue}</div>
            </div>
        </div>
    `;
}

// Helper function: Debounce
function debounce(func, delay) {
    let timeout;
    return function() {
        const context = this;
        const args = arguments;
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(context, args), delay);
    };
}

// Helper function: Show/hide loader
function showLoader(show) {
    const loader = document.getElementById('loader');
    if (loader) {
        loader.style.display = show ? 'flex' : 'none';
    }
}

// Helper function: Show notification
function showNotification(message, type = 'info') {
    // Check if notification container exists
    let notificationContainer = document.getElementById('notificationContainer');
    
    // Create container if it doesn't exist
    if (!notificationContainer) {
        notificationContainer = document.createElement('div');
        notificationContainer.id = 'notificationContainer';
        notificationContainer.style.position = 'fixed';
        notificationContainer.style.top = '20px';
        notificationContainer.style.right = '20px';
        notificationContainer.style.zIndex = '9999';
        document.body.appendChild(notificationContainer);
    }
    
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.style.backgroundColor = '#fff';
    notification.style.borderRadius = '5px';
    notification.style.boxShadow = '0 3px 10px rgba(0,0,0,0.2)';
    notification.style.padding = '15px 20px';
    notification.style.marginBottom = '10px';
    notification.style.display = 'flex';
    notification.style.alignItems = 'center';
    notification.style.position = 'relative';
    notification.style.transform = 'translateX(120%)';
    notification.style.transition = 'transform 0.3s ease';
    
    // Notification icon
    let iconClass;
    let iconColor;
    
    switch (type) {
        case 'success':
            iconClass = 'fas fa-check-circle';
            iconColor = '#4CAF50';
            notification.style.borderLeft = '4px solid #4CAF50';
            break;
        case 'error':
            iconClass = 'fas fa-times-circle';
            iconColor = '#F44336';
            notification.style.borderLeft = '4px solid #F44336';
            break;
        case 'warning':
            iconClass = 'fas fa-exclamation-triangle';
            iconColor = '#FF9800';
            notification.style.borderLeft = '4px solid #FF9800';
            break;
        default:
            iconClass = 'fas fa-info-circle';
            iconColor = '#2196F3';
            notification.style.borderLeft = '4px solid #2196F3';
    }
    
    // Create notification content
    notification.innerHTML = `
        <i class="${iconClass}" style="color: ${iconColor}; font-size: 20px; margin-right: 10px;"></i>
        <div style="flex: 1;">
            <div style="font-weight: bold; color: #333; margin-bottom: 3px;">${type.charAt(0).toUpperCase() + type.slice(1)}</div>
            <div style="color: #666;">${message}</div>
        </div>
        <button style="background: none; border: none; cursor: pointer; font-size: 16px; color: #999;">
            <i class="fas fa-times"></i>
        </button>
    `;
    
    // Add to container
    notificationContainer.appendChild(notification);
    
    // Animate in
    setTimeout(() => {
        notification.style.transform = 'translateX(0)';
    }, 10);
    
    // Add close button functionality
    const closeButton = notification.querySelector('button');
    closeButton.addEventListener('click', () => {
        notification.style.transform = 'translateX(120%)';
        setTimeout(() => {
            notificationContainer.removeChild(notification);
        }, 300);
    });
    
    // Auto-remove after 5 seconds
    setTimeout(() => {
        if (notification.parentNode === notificationContainer) {
            notification.style.transform = 'translateX(120%)';
            setTimeout(() => {
                if (notification.parentNode === notificationContainer) {
                    notificationContainer.removeChild(notification);
                }
            }, 300);
        }
    }, 5000);
} 