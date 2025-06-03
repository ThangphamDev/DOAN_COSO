/**
 * Order Management Module - T2K Coffee Staff
 * Module quản lý gọi món cho nhân viên
 */

// Constants
const API_BASE_URL = 'http://localhost:8081/api';
const ENDPOINTS = {
    TABLES: `${API_BASE_URL}/tables`,
    CATEGORIES: `${API_BASE_URL}/categories`,
    PRODUCTS: `${API_BASE_URL}/products`,
    ORDERS: `${API_BASE_URL}/orders`
};

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

// State
let menuItems = [];
let categories = [];
let tables = [];
let currentOrder = {
    items: [],
    tableId: null,
    total: 0,
    note: '',
    notes: ''
};

// Constants
const STORAGE_KEY = 'T2K_CURRENT_ORDER';

// DOM Elements
let menuGrid;
let menuSearch;
let categoryFilter;
let tableSelect;
let orderItems;
let subtotalElement;
let totalElement;
let clearOrderBtn;
let submitOrderBtn;

// Initialize when page loads
document.addEventListener('DOMContentLoaded', function() {
    // Kiểm tra xác thực trước khi tải trang
    if (checkAuthentication()) {
        initializeDOMElements();
        setupEventListeners();
        loadInitialData();
        loadSavedOrder();
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
    
    // Debug thông tin token
    console.log("Token hiện tại:", token);
    console.log("Role hiện tại:", role);
    
    return true;
}

// Initialize DOM element references
function initializeDOMElements() {
    menuGrid = document.getElementById('menuGrid');
    menuSearch = document.getElementById('menu-search');
    categoryFilter = document.querySelector('.category-filter');
    tableSelect = document.getElementById('tableSelect');
    orderItems = document.getElementById('orderItems');
    subtotalElement = document.getElementById('subtotal');
    totalElement = document.getElementById('total');
    clearOrderBtn = document.getElementById('clearOrder');
    submitOrderBtn = document.getElementById('submitOrder');
}

// Setup event listeners
function setupEventListeners() {
    menuSearch.addEventListener('input', filterMenuItems);
    clearOrderBtn.addEventListener('click', clearOrder);
    submitOrderBtn.addEventListener('click', submitOrder);
}

// Load all initial data
async function loadInitialData() {
    try {
        await Promise.all([
            loadCategories(),
            loadTables()
        ]);
    } catch (error) {
        console.error('Error loading initial data:', error);
        showNotification('Không thể tải dữ liệu. Vui lòng thử lại sau.', 'error');
    }
}

// Load categories from API
async function loadCategories() {
    try {
        const response = await fetch(ENDPOINTS.CATEGORIES, {
            method: 'GET',
            headers: getAuthHeaders()
        });
        
        if (!response.ok) throw new Error('Failed to load categories');
        
        categories = await response.json();
        renderCategories();
        
        // Gom tất cả sản phẩm lại, gán idCategory cho từng sản phẩm
        let allProducts = [];
        categories.forEach(category => {
            if (category.products && Array.isArray(category.products)) {
                category.products.forEach(product => {
                    // Chỉ thêm sản phẩm đang bán
                    if (product.isAvailable === true || 
                        product.status === 'active' || 
                        product.status === true || 
                        product.status === 1) {
                        product.idCategory = category.idCategory;
                        allProducts.push(product);
                    }
                });
            }
        });
        
        if (allProducts.length === 0) {
            showNotification('Không có sản phẩm nào đang bán', 'info');
        }
        
        menuItems = allProducts;
        renderMenuItems();
    } catch (error) {
        console.error('Error loading categories:', error);
        showNotification('Không thể tải danh mục sản phẩm', 'error');
    }
}

// Load tables from API
async function loadTables() {
    try {
        const response = await fetch(ENDPOINTS.TABLES, {
            method: 'GET',
            headers: getAuthHeaders()
        });
        
        if (!response.ok) throw new Error('Failed to load tables');
        
        tables = await response.json();
        renderTableOptions();
    } catch (error) {
        console.error('Error loading tables:', error);
        showNotification('Không thể tải danh sách bàn', 'error');
    }
}

// Render categories
function renderCategories() {
    if (!categoryFilter) return;

    // Clear existing categories
    categoryFilter.innerHTML = '';

    // Add "All" button
    const allButton = document.createElement('button');
    allButton.className = 'category-btn active';
    allButton.setAttribute('data-category', 'all');
    allButton.textContent = 'Tất cả';
    allButton.onclick = () => filterByCategory('all');
    categoryFilter.appendChild(allButton);

    // Add category buttons
    categories.forEach(category => {
        if (category && category.categoryName) {
            const button = document.createElement('button');
            button.className = 'category-btn';
            button.setAttribute('data-category', category.idCategory);
            button.textContent = category.categoryName;
            button.onclick = () => filterByCategory(category.idCategory);
            categoryFilter.appendChild(button);
        }
    });
}

// Filter by category
function filterByCategory(categoryId) {
    // Update active button
    document.querySelectorAll('.category-btn').forEach(btn => {
        btn.classList.remove('active');
        if (btn.getAttribute('data-category') === categoryId.toString()) {
            btn.classList.add('active');
        }
    });

    // Filter products
    let filteredItems;
    if (categoryId === 'all') {
        filteredItems = menuItems;
    } else {
        filteredItems = menuItems.filter(item => item.idCategory === categoryId);
    }

    renderMenuItems(filteredItems);
}

// Render table options
function renderTableOptions() {
    if (!tableSelect) return;
    
    // Clear existing options
    tableSelect.innerHTML = '<option value="">Chọn bàn (tùy chọn)</option>';

    // Add available tables only
    const availableTables = tables.filter(table => table.status !== 'Occupied');
    
    if (availableTables.length === 0) {
        const option = document.createElement('option');
        option.disabled = true;
        option.textContent = 'Không có bàn trống';
        tableSelect.appendChild(option);
        return;
    }

    // Sort tables by number
    availableTables.sort((a, b) => a.tableNumber - b.tableNumber);

    // Add table options
    availableTables.forEach(table => {
        const option = document.createElement('option');
        option.value = table.idTable;
        option.textContent = `Bàn ${table.tableNumber} - ${table.location}`;
        tableSelect.appendChild(option);
    });
}

// Render menu items
function renderMenuItems(filteredItems = null) {
    if (!menuGrid) return;
    
    const itemsToRender = filteredItems || menuItems;
    menuGrid.innerHTML = '';
    
    if (itemsToRender.length === 0) {
        menuGrid.innerHTML = '<div class="no-data"><i class="fas fa-exclamation-circle"></i><br>Không có sản phẩm nào đang bán trong danh mục này</div>';
        return;
    }

    // Lọc chỉ lấy sản phẩm đang bán
    const availableItems = itemsToRender.filter(item => 
        item.isAvailable === true || 
        item.status === 'active' || 
        item.status === true || 
        item.status === 1
    );

    if (availableItems.length === 0) {
        menuGrid.innerHTML = '<div class="no-data"><i class="fas fa-exclamation-circle"></i><br>Không có sản phẩm nào đang bán trong danh mục này</div>';
        return;
    }

    availableItems.forEach((item, index) => {
        const menuItem = document.createElement('div');
        menuItem.className = 'menu-item';
        menuItem.style.animation = `fadeIn 0.5s ease forwards ${0.1 * index}s`;
        menuItem.style.opacity = '0';
        menuItem.style.cursor = 'pointer';

        // Xử lý hình ảnh sản phẩm
        let imageUrl = '../assets/images/no-image.png';
        let imageClass = 'no-image';
        
        // Kiểm tra và xử lý đường dẫn ảnh
        if (item.image) {
            if (typeof item.image === 'string') {
                if (item.image.startsWith('data:image')) {
                    imageUrl = item.image;
                    imageClass = '';
                } else if (item.image.startsWith('http')) {
                    imageUrl = item.image;
                    imageClass = '';
                } else {
                    imageUrl = `${API_BASE_URL}/products/images/${item.image}`;
                    imageClass = '';
                }
            } else if (item.image.data) {
                const byteArray = new Uint8Array(item.image.data);
                let binary = '';
                byteArray.forEach(byte => binary += String.fromCharCode(byte));
                const base64 = btoa(binary);
                imageUrl = `data:image/jpeg;base64,${base64}`;
                imageClass = '';
            }
        }

        menuItem.innerHTML = `
            <div class="item-image ${imageClass}">
                ${imageClass === 'no-image' ? 
                    '<i class="fas fa-coffee"></i>' : 
                    `<img src="${imageUrl}" alt="${item.productName}" onerror="this.onerror=null; this.parentElement.className='item-image no-image'; this.remove();">`
                }
            </div>
            <div class="item-info">
                <h3 class="item-name">${item.productName}</h3>
                <div class="item-price">${formatCurrency(item.price)}</div>
            </div>
            <button class="add-item-btn" onclick="event.stopPropagation(); addToOrder(${JSON.stringify(item).replace(/"/g, '&quot;')})">
                <i class="fas fa-plus"></i>
            </button>
        `;

        // Thêm sự kiện click để chuyển đến trang chi tiết sản phẩm
        menuItem.addEventListener('click', () => {
            window.location.href = `product-detail.html?id=${item.idProduct}`;
        });

        menuGrid.appendChild(menuItem);
    });
}

// Filter menu items
function filterMenuItems() {
    const searchText = menuSearch.value.toLowerCase();
    const activeCategory = document.querySelector('.category-btn.active').getAttribute('data-category');
    
    // Lọc sản phẩm theo trạng thái đang bán trước
    let availableItems = menuItems.filter(item => 
        item.isAvailable === true || 
        item.status === 'active' || 
        item.status === true || 
        item.status === 1
    );
    
    // Sau đó lọc theo tìm kiếm và danh mục
    let filteredItems = availableItems.filter(item => {
        const matchesSearch = item.productName.toLowerCase().includes(searchText);
        const matchesCategory = activeCategory === 'all' || item.idCategory.toString() === activeCategory;
        return matchesSearch && matchesCategory;
    });
    
    renderMenuItems(filteredItems);
}

// Load saved order from localStorage
function loadSavedOrder() {
    const savedOrder = localStorage.getItem(STORAGE_KEY);
    if (savedOrder) {
        currentOrder = JSON.parse(savedOrder);
        updateOrderDisplay();
    }
}

// Save current order to localStorage
function saveOrderToStorage() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(currentOrder));
}

// Clear order
function clearOrder() {
    if (!confirm('Bạn có chắc muốn xóa toàn bộ đơn hàng?')) return;
    
    currentOrder = {
        items: [],
        tableId: null,
        total: 0,
        note: '',
        notes: ''
    };
    
    if (tableSelect) tableSelect.value = '';
    localStorage.removeItem(STORAGE_KEY);
    updateOrderDisplay();
    updateOrderTotal();
    showNotification('Đã xóa toàn bộ đơn hàng', 'info');
}

// Submit order
async function submitOrder() {
    if (currentOrder.items.length === 0) {
        showNotification('Vui lòng thêm sản phẩm vào đơn hàng', 'warning');
        return;
    }

    try {
        // Lưu thông tin bàn vào currentOrder nếu có chọn bàn
        if (tableSelect.value) {
            const selectedTable = tables.find(t => t.idTable == tableSelect.value);
            if (selectedTable) {
                currentOrder.tableId = tableSelect.value;
                currentOrder.tableInfo = {
                    tableNumber: selectedTable.tableNumber,
                    location: selectedTable.location
                };
            }
        } else {
            currentOrder.tableId = null;
            currentOrder.tableInfo = null;
        }

        // Lưu ghi chú vào currentOrder
        currentOrder.notes = document.getElementById('orderNote').value || '';
        
        // Lưu đơn hàng hiện tại vào localStorage
        saveOrderToStorage();
        
        // Mở modal thanh toán
        const paymentWindow = window.open('payment-modal.html', 'PaymentWindow', 'width=800,height=700');
        
        // Kiểm tra nếu cửa sổ bị chặn popup
        if (!paymentWindow || paymentWindow.closed || typeof paymentWindow.closed === 'undefined') {
            showNotification('Vui lòng cho phép popup để mở cửa sổ thanh toán', 'error');
        } else {
            showNotification('Đang mở cửa sổ thanh toán...', 'info');
        }
        
    } catch (error) {
        console.error('Error opening payment modal:', error);
        showNotification('Không thể mở cửa sổ thanh toán: ' + error.message, 'error');
    }
}

// Add item to order
function addToOrder(item) {
    if (!item || !item.idProduct) {
        console.error('Invalid product data:', item);
        showNotification('Không thể thêm sản phẩm không hợp lệ', 'error');
        return;
    }

    const existingItem = currentOrder.items.find(i => i.id === item.idProduct);
    
    if (existingItem) {
        existingItem.quantity++;
    } else {
        currentOrder.items.push({
            id: item.idProduct,
            name: item.productName,
            price: item.price,
            quantity: 1
        });
    }
    
    saveOrderToStorage();
    updateOrderDisplay();
    showNotification(`Đã thêm ${item.productName} vào đơn hàng`, 'success');
}

// Update order display
function updateOrderDisplay() {
    if (!orderItems) return;
    
    if (currentOrder.items.length === 0) {
        orderItems.innerHTML = `
            <div class="empty-order">
                <i class="fa fa-receipt"></i>
                <p>Chưa có món nào được chọn</p>
            </div>
        `;
        updateOrderTotal();
        return;
    }
    
    orderItems.innerHTML = '';
    const template = document.getElementById('orderItemTemplate');
    
    currentOrder.items.forEach(item => {
        const clone = template.content.cloneNode(true);
        
        clone.querySelector('.item-name').textContent = item.name;
        clone.querySelector('.item-price').textContent = formatCurrency(item.price);
        clone.querySelector('.quantity').textContent = item.quantity;
        
        const minusBtn = clone.querySelector('.minus');
        const plusBtn = clone.querySelector('.plus');
        const removeBtn = clone.querySelector('.remove-item-btn');
        
        minusBtn.onclick = () => updateItemQuantity(item.id, -1);
        plusBtn.onclick = () => updateItemQuantity(item.id, 1);
        removeBtn.onclick = () => removeFromOrder(item.id);
        
        orderItems.appendChild(clone);
    });
    
    updateOrderTotal();
}

// Update item quantity
function updateItemQuantity(itemId, change) {
    const item = currentOrder.items.find(i => i.id === itemId);
    if (!item) return;
    
    item.quantity += change;
    
    if (item.quantity <= 0) {
        removeFromOrder(itemId);
    } else {
        saveOrderToStorage();
        updateOrderDisplay();
    }
}

// Remove item from order
function removeFromOrder(itemId) {
    const item = currentOrder.items.find(i => i.id === itemId);
    if (item) {
        currentOrder.items = currentOrder.items.filter(i => i.id !== itemId);
        saveOrderToStorage();
        updateOrderDisplay();
        updateOrderTotal();
        showNotification(`Đã xóa ${item.name} khỏi đơn hàng`, 'info');
    }
}

// Update order total
function updateOrderTotal() {
    if (!currentOrder.items || currentOrder.items.length === 0) {
        currentOrder.total = 0;
        if (subtotalElement) subtotalElement.textContent = formatCurrency(0);
        if (totalElement) totalElement.textContent = formatCurrency(0);
    } else {
        const subtotal = currentOrder.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        currentOrder.total = subtotal;
        if (subtotalElement) subtotalElement.textContent = formatCurrency(subtotal);
        if (totalElement) totalElement.textContent = formatCurrency(subtotal);
    }
    
    // Cập nhật localStorage sau khi tính toán lại tổng tiền
    saveOrderToStorage();
}

// Helper function to format currency
function formatCurrency(amount) {
    return new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND'
    }).format(amount);
}

// Helper function to show notifications
function showNotification(message, type = 'info') {
    // Thay thế alert bằng thông báo đẹp hơn
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    
    // Thêm style cho notification
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
    
    // Tự động xóa sau 3 giây
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
`;
document.head.appendChild(style);
