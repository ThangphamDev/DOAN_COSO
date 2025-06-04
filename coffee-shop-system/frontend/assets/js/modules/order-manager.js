const API_BASE_URL = 'http://localhost:8081/api';
const ORDERS_ENDPOINT = `${API_BASE_URL}/orders`;

const STATUS_TRANSLATIONS = {
    'processing': 'Đang xử lý',
    'completed': 'Hoàn thành',
    'cancelled': 'Đã hủy',
    'pending': 'Chờ xử lý'
};

const STATUS_CLASSES = {
    'processing': 'processing',
    'completed': 'completed',
    'cancelled': 'cancelled',
    'pending': 'pending'
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

let orders = [];
let filteredOrders = [];
let currentPage = 1;
let itemsPerPage = 10;
let totalOrders = 0;
let totalPages = 0;

document.addEventListener('DOMContentLoaded', () => {
    initElements();
    addEventListeners();
    loadOrders();
});

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
    
    const today = new Date();
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(today.getDate() - 30);
    
    if (dateFromInput && dateToInput) {
        dateFromInput.valueAsDate = thirtyDaysAgo;
        dateToInput.valueAsDate = today;
    }
}

function addEventListeners() {
    if (searchInput) {
        searchInput.addEventListener('input', debounce(() => {
            currentPage = 1;
            filterOrders();
        }, 300));
    }
    
    if (statusFilter) {
        statusFilter.addEventListener('change', () => {
            currentPage = 1;
            filterOrders();
        });
    }
    
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
    
    document.querySelectorAll('.close-btn, .cancel-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            closeOrderModal();
        });
    });
    
    const itemsPerPageSelect = document.getElementById('itemsPerPage');
    if (itemsPerPageSelect) {
        itemsPerPageSelect.addEventListener('change', (e) => {
            itemsPerPage = parseInt(e.target.value);
            currentPage = 1;
            displayOrders();
        });
    }
    
    const addOrderBtn = document.querySelector('.add-order-btn');
    if (addOrderBtn) {
        addOrderBtn.addEventListener('click', () => {
            console.log('Add new order');
            showNotification('Tính năng đang được phát triển', 'info');
        });
    }
}

async function loadOrders() {
    try {
        showLoader(true);
        const response = await fetch(ORDERS_ENDPOINT, {
            method: 'GET',
            headers: getAuthHeaders()
        });
        
        if (!response.ok) {
            throw new Error(`Lỗi HTTP: ${response.status}`);
        }
        
        const apiOrders = await response.json();
        
        orders = apiOrders;
        
        orders.sort((a, b) => new Date(b.orderTime) - new Date(a.orderTime));
        
        filterOrders();
        
        updateOrderStats();
        
        showLoader(false);
        const notificationContainer = document.getElementById('notificationContainer');
        if (notificationContainer) {
            notificationContainer.querySelectorAll('.notification.error, .notification.warning').forEach(n => n.remove());
        }
        showNotification('Đã tải đơn hàng thành công', 'success');
    } catch (error) {
        console.error('Lỗi khi tải đơn hàng:', error);
        showLoader(false);
        showNotification('Không thể kết nối đến API. Vui lòng thử lại sau.', 'error');
        orders = [];
        filterOrders();
        updateOrderStats();
    }
}

function filterOrders() {
    let filtered = [...orders];
    
    if (searchInput && searchInput.value.trim() !== '') {
        const searchTerm = searchInput.value.trim().toLowerCase();
        filtered = filtered.filter(order => {
            if (order.idOrder && order.idOrder.toString().includes(searchTerm)) {
                return true;
            }
            
            if (order.table && 
                order.table.tableNumber && 
                order.table.tableNumber.toString().toLowerCase().includes(searchTerm)) {
                return true;
            }
            
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
    
    if (statusFilter && statusFilter.value !== 'all') {
        const statusValue = statusFilter.value;
        filtered = filtered.filter(order => order.status === statusValue);
    }
    
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
    
    filteredOrders = filtered;
    totalOrders = filteredOrders.length;
    totalPages = Math.ceil(totalOrders / itemsPerPage);
    
    displayOrders();
}

function displayOrders() {
    if (!orderTableBody) return;
    
    orderTableBody.innerHTML = '';
    
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
    
    if (emptyStateContainer) emptyStateContainer.style.display = 'none';
    if (ordersTable) ordersTable.style.display = 'table';
    if (paginationContainer) paginationContainer.style.display = 'flex';
    
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = Math.min(startIndex + itemsPerPage, filteredOrders.length);
    const ordersToShow = filteredOrders.slice(startIndex, endIndex);
    
    ordersToShow.forEach(order => {
        const row = document.createElement('tr');
        
        const orderDate = new Date(order.orderTime);
        const formattedDate = orderDate.toLocaleDateString('vi-VN') + ' ' + 
                               orderDate.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
        
        const formattedPrice = new Intl.NumberFormat('vi-VN', { 
            style: 'currency', 
            currency: 'VND',
            minimumFractionDigits: 0
        }).format(order.totalAmount);
        
        const statusDisplay = STATUS_TRANSLATIONS[order.status] || order.status;
        const statusClass = STATUS_CLASSES[order.status] || '';
        
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
        
        let productsList = '';
        if (order.orderDetails && order.orderDetails.length > 0) {
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
    
    updatePagination();
    
    attachOrderButtonEvents();

    orderTableBody.querySelectorAll('.status-badge').forEach(badge => {
        badge.style.cursor = 'pointer';
        badge.title = 'Nhấn để chuyển sang Hoàn thành';
        badge.addEventListener('click', async function() {
            const row = this.closest('tr');
            if (!row) return;
            const idCell = row.querySelector('td');
            if (!idCell) return;
            const orderId = idCell.textContent.trim();
            if (this.classList.contains('processing')) {
                try {
                    showLoader(true, 'Đang cập nhật trạng thái...');
                    const res = await fetch(`${ORDERS_ENDPOINT}/${orderId}/status`, {
                        method: 'PUT',
                        headers: getAuthHeaders(),
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

function updatePagination() {
    if (!paginationContainer || !pageInfo) return;
    
    paginationContainer.innerHTML = '';
    
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
    
    const maxPages = 5;
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
    
    const startIndex = (currentPage - 1) * itemsPerPage + 1;
    const endIndex = Math.min(startIndex + itemsPerPage - 1, totalOrders);
    pageInfo.textContent = `Hiển thị ${startIndex}-${endIndex} trên ${totalOrders} đơn hàng`;
}

function openEditOrderModal(orderId) {
    const order = orders.find(o => o.idOrder == orderId);
    if (!order) {
        console.error('Không tìm thấy đơn hàng với ID:', orderId);
        showNotification('Không tìm thấy thông tin đơn hàng', 'error');
        return;
    }
    
    console.log('Mở modal chỉnh sửa cho đơn hàng:', order);
    
    const editOrderModal = document.getElementById('editOrderModal');
    if (!editOrderModal) {
        console.error('Không tìm thấy modal chỉnh sửa đơn hàng trong DOM');
        showNotification('Lỗi hiển thị form chỉnh sửa', 'error');
        return;
    }
    
    try {
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
        
        const orderItemsBeingEdited = JSON.parse(JSON.stringify(order.orderDetails || []));
        
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
        
        if (typeof bootstrap !== 'undefined' && bootstrap.Modal) {
            try {
                const modalInstance = new bootstrap.Modal(editOrderModal);
                modalInstance.show();
                console.log('Đã mở modal bằng Bootstrap 5');
            } catch (error) {
                console.error('Lỗi khi mở modal bằng Bootstrap 5:', error);
                
                if (typeof $ !== 'undefined' && typeof $.fn.modal !== 'undefined') {
                    try {
                        $(editOrderModal).modal('show');
                        console.log('Đã mở modal bằng jQuery Bootstrap');
                    } catch (error) {
                        console.error('Lỗi khi mở modal bằng jQuery:', error);
                        
                        editOrderModal.style.display = 'block';
                        console.log('Đã mở modal bằng CSS display');
                    }
                } else {
                    editOrderModal.style.display = 'block';
                    editOrderModal.classList.add('show');
                    document.body.classList.add('modal-open');
                    
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
            editOrderModal.style.display = 'block';
            editOrderModal.classList.add('show');
            document.body.classList.add('modal-open');
            console.log('Đã mở modal bằng CSS display (no Bootstrap)');
        }
        
        const saveOrderBtn = document.getElementById('saveOrderBtn');
        if (saveOrderBtn) {
            const newSaveBtn = saveOrderBtn.cloneNode(true);
            saveOrderBtn.parentNode.replaceChild(newSaveBtn, saveOrderBtn);
            
            newSaveBtn.addEventListener('click', () => {
                saveOrderChanges(order.idOrder, orderItemsBeingEdited);
            });
            console.log('Đã gắn sự kiện cho nút lưu');
        } else {
            console.error('Không tìm thấy nút lưu trong modal');
        }
        
        const addItemBtn = document.getElementById('addItemBtn');
        if (addItemBtn) {
            const newAddItemBtn = addItemBtn.cloneNode(true);
            addItemBtn.parentNode.replaceChild(newAddItemBtn, addItemBtn);
            
            newAddItemBtn.addEventListener('click', () => {
                openAddProductModal(orderItemsBeingEdited, tableBody);
            });
            console.log('Đã gắn sự kiện cho nút thêm sản phẩm');
        } else {
            console.error('Không tìm thấy nút thêm sản phẩm trong modal');
        }
        
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

function closeEditOrderModal() {
    const editOrderModal = document.getElementById('editOrderModal');
    if (!editOrderModal) return;
    
    try {
        if (typeof bootstrap !== 'undefined' && bootstrap.Modal) {
            const modalInstance = bootstrap.Modal.getInstance(editOrderModal);
            if (modalInstance) {
                modalInstance.hide();
                return;
            }
        }
        
        if (typeof $ !== 'undefined' && typeof $.fn.modal !== 'undefined') {
            $(editOrderModal).modal('hide');
            return;
        }
        
        editOrderModal.style.display = 'none';
        editOrderModal.classList.remove('show');
        document.body.classList.remove('modal-open');
        
        const backdrop = document.querySelector('.modal-backdrop');
        if (backdrop) {
            backdrop.remove();
        }
    } catch (error) {
        console.error('Lỗi khi đóng modal:', error);
        editOrderModal.style.display = 'none';
    }
}

function renderEditOrderItems(tableBody, items) {
    tableBody.innerHTML = '';
    
    if (!items || items.length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="5" class="text-center">Không có sản phẩm nào trong đơn hàng</td>
            </tr>
        `;
        document.getElementById('editOrderTotal').textContent = '0 ₫';
        return;
    }
    
    let total = 0;
    
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
    
    document.getElementById('editOrderTotal').textContent = new Intl.NumberFormat('vi-VN', { 
        style: 'currency', 
        currency: 'VND',
        minimumFractionDigits: 0
    }).format(total);
    
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
    
    document.querySelectorAll('.remove-item-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const index = parseInt(e.currentTarget.getAttribute('data-item-index'));
            items.splice(index, 1);
            renderEditOrderItems(tableBody, items);
        });
    });
}

async function openAddProductModal(orderItems, orderItemsTable) {
    const addProductModal = document.getElementById('addProductModal');
    if (!addProductModal) return;
    
    const productSelect = document.getElementById('productSelect');
    const productQuantity = document.getElementById('productQuantity');
    
    productSelect.innerHTML = '<option value="">-- Chọn sản phẩm --</option>';
    productQuantity.value = 1;
    
    try {
        showLoader(true);
        const response = await fetch(`${API_BASE_URL}/products`, {
            method: 'GET',
            headers: getAuthHeaders()
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }
        
        const products = await response.json();
        
        if (products && products.length > 0) {
            products.forEach(product => {
                const option = document.createElement('option');
                const productId = product.id || product.idProduct;
                const productName = product.name || product.productName;
                const productPrice = product.price || 0;
                
                option.value = productId;
                option.textContent = `${productName} - ${new Intl.NumberFormat('vi-VN', { 
                    style: 'currency', 
                    currency: 'VND',
                    minimumFractionDigits: 0
                }).format(productPrice)}`;
                productSelect.appendChild(option);
            });
        } else {
            const option = document.createElement('option');
            option.disabled = true;
            option.textContent = 'Không có sản phẩm nào';
            productSelect.appendChild(option);
        }
        showLoader(false);
    } catch (error) {
        console.error('Lỗi khi tải danh sách sản phẩm:', error);
        showLoader(false);
        const option = document.createElement('option');
        option.disabled = true;
        option.textContent = 'Không thể tải danh sách sản phẩm';
        productSelect.appendChild(option);
        showNotification('Không thể tải danh sách sản phẩm', 'error');
    }
    
    const modal = new bootstrap.Modal(addProductModal);
    modal.show();
    
    const confirmAddProductBtn = document.getElementById('confirmAddProductBtn');
    if (confirmAddProductBtn) {
        const newConfirmBtn = confirmAddProductBtn.cloneNode(true);
        confirmAddProductBtn.parentNode.replaceChild(newConfirmBtn, confirmAddProductBtn);
        
        newConfirmBtn.addEventListener('click', async () => {
            const productId = productSelect.value;
            const quantity = parseInt(productQuantity.value);
            
            if (!productId || isNaN(quantity) || quantity < 1) {
                showNotification('Vui lòng chọn sản phẩm và số lượng hợp lệ', 'error');
                return;
            }
            
            try {
                showLoader(true);
                const response = await fetch(`${API_BASE_URL}/products/${productId}`, {
                    method: 'GET',
                    headers: getAuthHeaders()
                });
                
                if (!response.ok) {
                    throw new Error(`HTTP error! Status: ${response.status}`);
                }
                
                const product = await response.json();
                
                if (!product) {
                    showNotification('Sản phẩm không tồn tại', 'error');
                    showLoader(false);
                    return;
                }
                
                const existingItemIndex = orderItems.findIndex(item => 
                    item.product && (item.product.id == productId || item.product.idProduct == productId)
                );
                
                if (existingItemIndex >= 0) {
                    orderItems[existingItemIndex].quantity += quantity;
                } else {
                    orderItems.push({
                        product: product,
                        quantity: quantity,
                        unitPrice: product.price
                    });
                }
                
                showLoader(false);
                
                modal.hide();
                
                renderEditOrderItems(orderItemsTable, orderItems);
                
                showNotification('Đã thêm sản phẩm vào đơn hàng', 'success');
            } catch (error) {
                console.error('Lỗi khi lấy thông tin sản phẩm:', error);
                showLoader(false);
                showNotification(`Không thể lấy thông tin sản phẩm: ${error.message}`, 'error');
            }
        });
    }
}

async function saveOrderChanges(orderId, orderItems) {
    showLoader(true);
    
    try {
        const status = document.getElementById('editOrderStatus').value;
        const note = document.getElementById('editOrderNotes').value;
        
        const totalAmount = orderItems.reduce((sum, item) => {
            const unitPrice = item.unitPrice || item.product.price || 0;
            const quantity = item.quantity || 0;
            return sum + (unitPrice * quantity);
        }, 0);
        
        const payload = {
            status: status,
            note: note,
            orderDetails: orderItems,
            totalAmount: totalAmount
        };
        
        const response = await fetch(`${ORDERS_ENDPOINT}/${orderId}`, {
            method: 'PUT',
            headers: getAuthHeaders(),
            body: JSON.stringify(payload)
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const updatedOrder = await response.json();
        
        const index = orders.findIndex(o => o.idOrder == orderId);
        if (index !== -1) {
            orders[index] = updatedOrder;
        }
        
        filterOrders();
        updateOrderStats();
        
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
            editOrderModal.style.display = 'none';
            editOrderModal.classList.remove('show');
            document.body.classList.remove('modal-open');
            const backdrop = document.querySelector('.modal-backdrop');
            if (backdrop) backdrop.remove();
        }
        
        showNotification('Đơn hàng đã được cập nhật thành công', 'success');
    } catch (error) {
        console.error('Lỗi khi cập nhật đơn hàng:', error);
        showNotification('Không thể cập nhật đơn hàng: ' + error.message, 'error');
        
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
            editOrderModal.style.display = 'none';
            editOrderModal.classList.remove('show');
            document.body.classList.remove('modal-open');
            const backdrop = document.querySelector('.modal-backdrop');
            if (backdrop) backdrop.remove();
        }
    } finally {
        showLoader(false);
    }
}

async function deleteOrder(orderId) {
    showLoader(true);
    
    try {
        const response = await fetch(`${ORDERS_ENDPOINT}/${orderId}`, {
            method: 'DELETE',
            headers: getAuthHeaders()
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const index = orders.findIndex(o => o.idOrder == orderId);
        if (index !== -1) {
            orders.splice(index, 1);
        }
        
        filterOrders();
        updateOrderStats();
        
        showNotification('Đơn hàng đã được xóa thành công', 'success');
    } catch (error) {
        console.error('Lỗi khi xóa đơn hàng:', error);
        showNotification('Không thể xóa đơn hàng: ' + error.message, 'error');
    } finally {
        showLoader(false);
    }
}

function attachOrderButtonEvents() {
    document.querySelectorAll('.btn-view').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const orderId = e.currentTarget.getAttribute('data-id');
            viewOrderDetails(orderId);
        });
    });
    
    document.querySelectorAll('.btn-edit').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const orderId = e.currentTarget.getAttribute('data-id');
            openEditOrderModal(orderId);
        });
    });
    
    document.querySelectorAll('.btn-print').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const orderId = e.currentTarget.getAttribute('data-id');
            printOrderInvoice(orderId);
        });
    });
    
    document.querySelectorAll('.btn-delete').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const orderId = e.currentTarget.getAttribute('data-id');
            confirmDeleteOrder(orderId);
        });
    });
}

function viewOrderDetails(orderId) {
    const order = orders.find(o => o.idOrder == orderId);
    if (!order || !orderModal || !orderDetailsContainer) return;
    
    const orderDate = new Date(order.orderTime);
    const formattedDate = orderDate.toLocaleDateString('vi-VN') + ' ' + 
                           orderDate.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
    
    const formatter = new Intl.NumberFormat('vi-VN', { 
        style: 'currency', 
        currency: 'VND',
        minimumFractionDigits: 0
    });
    
    const statusDisplay = STATUS_TRANSLATIONS[order.status] || order.status;
    const statusClass = STATUS_CLASSES[order.status] || '';
    
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
    
    content += `
        <div class="order-info-item">
            <span class="order-info-label">Ghi chú</span>
            <span class="order-info-value">${order.note || 'Không có ghi chú'}</span>
        </div>
    `;
    
    content += `</div>`;
    
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
                            <img src="${API_BASE_URL}/products/images/${detail.product.image || 'default.jpg'}" alt="${detail.product.productName}">
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
    
    orderDetailsContainer.innerHTML = content;
    orderModal.style.display = 'flex';


    const printBtnFooter = orderModal.querySelector('.modal-footer .btn-primary, .modal-footer .btn-print');
    if (printBtnFooter) {
        printBtnFooter.onclick = function() {
            printOrderInvoice(orderId);
        };
    }

    orderModal.addEventListener('click', (e) => {
        if (e.target === orderModal) {
            closeOrderModal();
        }
    });
}

function closeOrderModal() {
    if (orderModal) {
        orderModal.style.display = 'none';
    }
}

function confirmDeleteOrder(orderId) {
    if (confirm(`Bạn có chắc chắn muốn xóa đơn hàng #${orderId}?`)) {
        deleteOrder(orderId);
    }
}

function updateOrderStats() {
    if (!orderStats) return;
    
    const processingCount = orders.filter(order => order.status === 'processing').length;
    const completedCount = orders.filter(order => order.status === 'completed').length;
    const cancelledCount = orders.filter(order => order.status === 'cancelled').length;
    
    const totalRevenue = orders
        .filter(order => order.status === 'completed')
        .reduce((sum, order) => sum + (order.totalAmount || 0), 0);
    
    const formattedRevenue = new Intl.NumberFormat('vi-VN', { 
        style: 'currency', 
        currency: 'VND',
        minimumFractionDigits: 0
    }).format(totalRevenue);
    
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

function debounce(func, delay) {
    let timeout;
    return function() {
        const context = this;
        const args = arguments;
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(context, args), delay);
    };
}

function showLoader(show) {
    const loader = document.getElementById('loader');
    if (loader) {
        loader.style.display = show ? 'flex' : 'none';
    }
}

function showNotification(message, type = 'info', duration = 5000) {
    let notificationContainer = document.getElementById('notificationContainer');
    
    if (!notificationContainer) {
        notificationContainer = document.createElement('div');
        notificationContainer.id = 'notificationContainer';
        notificationContainer.className = 'notification-container';
        document.body.appendChild(notificationContainer);
    }
    
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `
        <div class="notification-content">
            <span class="notification-message">${message}</span>
        </div>
        <button class="notification-close">&times;</button>
    `;
    
    notificationContainer.appendChild(notification);
    
    setTimeout(() => {
        notification.classList.add('show');
    }, 10);
    
    const closeButton = notification.querySelector('.notification-close');
    closeButton.addEventListener('click', () => {
        notification.classList.remove('show');
        notification.classList.add('hide');
        setTimeout(() => {
            if (notification.parentElement && notificationContainer.contains(notification)) {
                notificationContainer.removeChild(notification);
            }
        }, 300);
    });
    
    if (duration > 0) {
        setTimeout(() => {
            if (notification && document.body.contains(notificationContainer)) {
                notification.classList.remove('show');
                notification.classList.add('hide');
                setTimeout(() => {
                    if (notification.parentElement && notificationContainer.contains(notification)) {
                        notificationContainer.removeChild(notification);
                    }
                }, 300);
            }
        }, duration);
    }
}

function printOrderInvoice(orderId) {
    const order = orders.find(o => o.idOrder == orderId);
    if (!order) {
        showNotification('Không tìm thấy thông tin đơn hàng để in!', 'error');
        return;
    }
    let printContent = `
        <div style="max-width:500px;margin:0 auto;font-family:sans-serif;">
            <h2 style="text-align:center;color:#e67e22;">T2K Coffee</h2>
            <h3 style="text-align:center;">HÓA ĐƠN THANH TOÁN</h3>
            <hr>
            <p><b>Mã đơn hàng:</b> ${order.idOrder}</p>
            <p><b>Bàn:</b> ${order.table && order.table.tableNumber ? order.table.tableNumber : '---'}</p>
            <p><b>Thời gian:</b> ${order.orderTime ? (new Date(order.orderTime)).toLocaleString('vi-VN') : ''}</p>
            <table style="width:100%;border-collapse:collapse;margin:15px 0;">
                <tr>
                    <th style="text-align:left;">Tên món</th>
                    <th style="text-align:center;">SL</th>
                    <th style="text-align:right;">Giá</th>
                </tr>
                ${
                    (order.orderDetails || []).map(item => `
                        <tr>
                            <td>${item.product ? item.product.productName : 'Sản phẩm'}</td>
                            <td style="text-align:center;">${item.quantity}</td>
                            <td style="text-align:right;">${(item.unitPrice * item.quantity).toLocaleString('vi-VN')} đ</td>
                        </tr>
                    `).join('')
                }
            </table>
            <p style="text-align:right;"><b>Tổng cộng:</b> ${order.totalAmount.toLocaleString('vi-VN')} đ</p>
            <p style="text-align:center;">Cảm ơn quý khách!</p>
        </div>
    `;
    const printWindow = window.open('', '', 'width=600,height=800');
    printWindow.document.write('<html><head><title>In hóa đơn</title></head><body>' + printContent + '</body></html>');
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
        printWindow.print();
        printWindow.close();
    }, 500);
} 