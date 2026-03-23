const API = {
    BASE_URL: 'http://localhost:8081/api',
    ORDERS: '/orders',
    PRODUCTS: '/products',
    CATEGORIES: '/categories',
    USERS: '/users',
    TABLES: '/tables',
    ACTIVITIES: '/activities',
    PROMOTIONS: '/promotions',
    STAFFS: '/staffs',
    REPORTS: '/reports',
    AUTH: '/auth',
    VARIANTS: '/variants' 
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

async function checkApiConnection() {
    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);
        
        const response = await fetch(`${API.BASE_URL}${API.ORDERS}`, {
            method: 'GET',
            headers: getAuthHeaders(),
            signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        
        return {
            available: response.ok,
            status: response.status,
            statusText: response.statusText
        };
    } catch (error) {
        console.error("Lỗi kết nối API:", error);
        if (error.name === 'AbortError') {
            console.error("Timeout: Máy chủ không phản hồi sau 5 giây");
            return {
                available: false,
                status: 0,
                statusText: "Timeout: Máy chủ không phản hồi sau 5 giây"
            };
        } else if (error.message.includes('Failed to fetch')) {
            console.error("Network error: Không thể kết nối đến máy chủ");
            return {
                available: false,
                status: 0,
                statusText: "Network error: Không thể kết nối đến máy chủ. Máy chủ có thể chưa được khởi động."
            };
        }
        
        return {
            available: false,
            status: 0,
            statusText: error.message
        };
    }
}

// Chuyển đổi đơn hàng từ server sang client
function convertOrderFromServer(serverOrder) {
    const order = { ...serverOrder };
    
if (order.idOrder) {
        order.id = order.idOrder;
        }
    if (order.table) {
        if (typeof order.table === 'object') {
        if (order.table.tableNumber) {
                order.tableNumber = order.table.tableNumber;
        } else if (order.table.idTable) {
                order.tableNumber = order.table.idTable;
            }
            
        if (order.table.tableNumber === 'takeaway' || order.table.idTable === 'takeaway') {
                order.tableNumber = 'takeaway';
            }
    } else if (typeof order.table === 'string' || typeof order.table === 'number') {
            order.tableNumber = order.table;
        }
    }

    if (order.payment) {
        order.paymentMethod = order.payment.paymentMethod || "cash";
        order.paymentStatus = order.payment.paymentStatus || "pending";
        
    if (order.payment.paymentStatus === "completed") {
            localStorage.setItem("paymentCompleted", "true");
            localStorage.setItem("paymentMethod", order.payment.paymentMethod || "cash");
            }
        } else {
        order.paymentMethod = order.paymentMethod || "cash";
        order.paymentStatus = order.paymentStatus || "pending";
    }
    
        if (order.orderDetails && order.orderDetails.length > 0) {
        order.items = order.orderDetails.map(detail => {
            return {
                id: detail.product.idProduct,
                name: detail.product.productName || detail.product.name,
                price: detail.unitPrice ? parseFloat(detail.unitPrice) : parseFloat(detail.product.price),
                quantity: detail.quantity
            };
        });
    }
    
    if (order.totalAmount) {
        order.totalAmount = parseFloat(order.totalAmount);
        }
    
        if (order.orderTime && typeof order.orderTime === 'string') {
        order.orderTime = new Date(order.orderTime).toISOString();
        }
        if (!order.status) {
        order.status = "processing";
        }
    return order;
}


function convertOrderToServer(clientOrder) {
    
    const serverOrder = {
        totalAmount: clientOrder.finalTotal || clientOrder.totalAmount,
        note: clientOrder.notes || clientOrder.note,
        status: clientOrder.status || "processing"
    };
    
    if (clientOrder.id) {
        serverOrder.idOrder = clientOrder.id;
    } else if (clientOrder.idOrder) {
        serverOrder.idOrder = clientOrder.idOrder;
    }
    
    // Thêm thời gian nếu có
    if (clientOrder.orderTime) {
        serverOrder.orderTime = new Date(clientOrder.orderTime).toISOString();
    } else {
        serverOrder.orderTime = new Date().toISOString();
    }
    
    // Thêm thông tin thanh toán
    const isCompleted = clientOrder.paymentCompleted === true || 
                        localStorage.getItem("paymentCompleted") === "true";
    
    // Tạo đối tượng payment
    serverOrder.payment = {
        paymentMethod: clientOrder.paymentMethod || localStorage.getItem("paymentMethod") || "cash",
        paymentStatus: isCompleted ? "completed" : "pending",
        createAt: new Date().toISOString(),
        amount: clientOrder.finalTotal || clientOrder.totalAmount
    };
    
     // Thêm thông tin bàn
    if (clientOrder.tableNumber && clientOrder.tableNumber !== 'takeaway') {
        serverOrder.table = {
            idTable: parseInt(clientOrder.tableNumber)
        };
    } else if (clientOrder.tableNumber === 'takeaway') {
        // Xử lý đặc biệt cho mang đi
        serverOrder.table = null;
    }
    
    // Thêm thông tin khuyến mãi nếu có
    if (clientOrder.promoCode) {
        serverOrder.promotion = {
            code: clientOrder.promoCode
        };
        serverOrder.discountAmount = clientOrder.discountAmount || 0;
    }
    
    // Chuyển đổi sản phẩm từ cart thành productItems
    if (clientOrder.cart && clientOrder.cart.length > 0) {
        serverOrder.productItems = clientOrder.cart.map(item => {
            return {
                productId: item.id,
                quantity: item.quantity,
                unitPrice: item.price
            };
        });
    } else if (clientOrder.items && clientOrder.items.length > 0) {
        serverOrder.productItems = clientOrder.items.map(item => {
            return {
                productId: item.id,
                quantity: item.quantity,
                unitPrice: item.price
            };
        });
    } else {
        // Đảm bảo luôn có trường productItems
        serverOrder.productItems = [];
    }
    
    return serverOrder;
}

// Lấy tất cả đơn hàng
async function getAllOrders() {
    try {
        const response = await fetch(`${API.BASE_URL}${API.ORDERS}`);
        
        if (!response.ok) {
            throw new Error(`Lỗi khi lấy đơn hàng: ${response.status}`);
        }
        
        const orders = await response.json();
        return orders.map(order => convertOrderFromServer(order));
    } catch (error) {
        console.error("Lỗi khi lấy danh sách đơn hàng:", error);
        throw error;
    }
}

// Lấy thông tin một đơn hàng theo ID
async function getOrderById(orderId) {
    try {
        const response = await fetch(`${API.BASE_URL}${API.ORDERS}/${orderId}`);
        
        if (!response.ok) {
            throw new Error(`Lỗi khi lấy đơn hàng: ${response.status}`);
        }
        
        const order = await response.json();
        return convertOrderFromServer(order);
    } catch (error) {
        console.error(`Lỗi khi lấy đơn hàng ID: ${orderId}`, error);
        throw error;
    }
}

// Lấy các đơn hàng theo trạng thái
async function getOrdersByStatus(status) {
    try {
        const response = await fetch(`${API.BASE_URL}${API.ORDERS}/status/${status}`);
        
        if (!response.ok) {
            throw new Error(`Lỗi khi lấy đơn hàng theo trạng thái: ${response.status}`);
        }
        
        const orders = await response.json();
        return orders.map(order => convertOrderFromServer(order));
    } catch (error) {
        console.error(`Lỗi khi lấy đơn hàng theo trạng thái: ${status}`, error);
        throw error;
    }
}

// Lấy các đơn hàng gần đây
    async function getRecentOrders() {
    try {
        const response = await fetch(`${API.BASE_URL}${API.ORDERS}/recent`);
        
        if (!response.ok) {
            throw new Error(`Lỗi khi lấy đơn hàng gần đây: ${response.status}`);
        }
        
        const orders = await response.json();
        return orders.map(order => convertOrderFromServer(order));
    } catch (error) {
        console.error("Lỗi khi lấy đơn hàng gần đây:", error);
        throw error;
    }
}

// Tạo đơn hàng mới
    async function createOrder(order) {
    try {
        let orderData = order;
        
         if (!order.hasOwnProperty('productItems') && !order.hasOwnProperty('orderDetails')) {
            orderData = convertOrderToServer(order);
        }
        
        const appliedPromotion = JSON.parse(localStorage.getItem('appliedPromotion'));
        if (appliedPromotion && !orderData.promotion) {
            orderData.promotion = {
                code: appliedPromotion.code
            };
            orderData.discountAmount = appliedPromotion.discountAmount;
            
            // Cập nhật tổng tiền sau khuyến mãi
            if (appliedPromotion.finalTotal) {
                orderData.totalAmount = appliedPromotion.finalTotal;
            }
        }
        
            const response = await fetch(`${API.BASE_URL}${API.ORDERS}`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify(orderData)
        });
        
        if (!response.ok) {
            const errorData = await response.text();
            console.error(`API Error (${response.status}): ${errorData}`);
            throw new Error(`API Error: ${response.status} - ${errorData}`);
        }
        
            const data = await response.json();
        return data;
    } catch (error) {
        console.error("API.js - createOrder - Error:", error);
        throw error;
    }
}

// Cập nhật đơn hàng
async function updateOrder(orderId, orderData) {
    try {
        const serverOrder = convertOrderToServer(orderData);
        
        const response = await fetch(`${API.BASE_URL}${API.ORDERS}/${orderId}`, {
            method: 'PUT',
            headers: getAuthHeaders(),
            body: JSON.stringify(serverOrder)
        });
        
        if (!response.ok) {
            throw new Error(`Lỗi khi cập nhật đơn hàng: ${response.status}`);
        }
        
        const updatedOrder = await response.json();
        return convertOrderFromServer(updatedOrder);
    } catch (error) {
        console.error(`Lỗi khi cập nhật đơn hàng ID: ${orderId}`, error);
        throw error;
    }
}

// Cập nhật trạng thái đơn hàng
async function updateOrderStatus(orderId, status) {
    try {
        const response = await fetch(`${API.BASE_URL}${API.ORDERS}/${orderId}/status`, {
            method: 'PUT',
            headers: getAuthHeaders(),
            body: JSON.stringify({ status })
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        return await response.json();
    } catch (error) {
        console.error("Lỗi khi cập nhật trạng thái đơn hàng:", error);
        throw error;
    }
}

// Cập nhật thông tin thanh toán
async function updatePaymentInfo(orderId, paymentMethod, isCompleted = true) {
        try {
        const numericOrderId = typeof orderId === 'string' && orderId.startsWith('HD') 
            ? orderId.substring(2) 
            : orderId;
            
        const paymentInfo = {
            paymentMethod: paymentMethod,
            paymentStatus: isCompleted ? "completed" : "pending",
            updateAt: new Date().toISOString()
        };
        
    const url = `${API.BASE_URL}${API.ORDERS}/${numericOrderId}/payment`;
        
        const response = await fetch(url, {
            method: 'PUT',
            headers: getAuthHeaders(),
            body: JSON.stringify(paymentInfo)
        });
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error(`API Error (${response.status}):`, errorText);
            throw new Error(`Lỗi khi cập nhật thông tin thanh toán: ${response.status} - ${errorText}`);
        }
        
    const updatedOrder = await response.json();
        
        if (isCompleted) {
            localStorage.setItem("paymentCompleted", "true");
            localStorage.setItem("paymentMethod", paymentMethod);
            }
        
        return updatedOrder;
    } catch (error) {
        console.error(`Lỗi khi cập nhật thông tin thanh toán đơn hàng ID: ${orderId}`, error);
        if (isCompleted) {
            localStorage.setItem("paymentCompleted", "true");
            localStorage.setItem("paymentMethod", paymentMethod);
            }
        throw error;
    }
}

// Lấy trạng thái đơn hàng
async function getOrderStatus(orderId) {
    try {
        const response = await fetch(`${API.BASE_URL}${API.ORDERS}/${orderId}/status`, {
            method: 'GET',
            headers: getAuthHeaders()
        });
        
        if (!response.ok) {
            throw new Error(`Lỗi khi lấy trạng thái đơn hàng: ${response.status}`);
        }
        
        const statusData = await response.json();
        return statusData.status;
    } catch (error) {
        console.error(`Lỗi khi lấy trạng thái đơn hàng ID: ${orderId}`, error);
        throw error;
    }
}

// Xóa đơn hàng
async function deleteOrder(orderId) {
    try {
        const response = await fetch(`${API.BASE_URL}${API.ORDERS}/${orderId}`, {
            method: 'DELETE',
            headers: getAuthHeaders()
        });
        
        if (!response.ok) {
            throw new Error(`Lỗi khi xóa đơn hàng: ${response.status}`);
        }
        
        return true;
    } catch (error) {
        console.error(`Lỗi khi xóa đơn hàng ID: ${orderId}`, error);
        throw error;
    }
}

// Lấy tất cả bàn
async function getAllTables() {
    try {
        const response = await fetch(`${API.BASE_URL}${API.TABLES}`, {
            method: 'GET',
            headers: getAuthHeaders()
        });
        
        if (!response.ok) {
            throw new Error(`Lỗi khi lấy danh sách bàn: ${response.status}`);
        }
        
        return await response.json();
    } catch (error) {
        console.error("Lỗi khi lấy danh sách bàn:", error);
        throw error;
    }
}

// Lấy bàn theo trạng thái
async function getTablesByStatus(status) {
    try {
        const response = await fetch(`${API.BASE_URL}${API.TABLES}/status/${status}`, {
            method: 'GET',
            headers: getAuthHeaders()
        });
        
        if (!response.ok) {
            throw new Error(`Lỗi khi lấy bàn theo trạng thái: ${response.status}`);
        }
        
        return await response.json();
    } catch (error) {
        console.error(`Lỗi khi lấy bàn theo trạng thái: ${status}`, error);
        throw error;
    }
}

// Lấy tất cả sản phẩm
async function getAllProducts() {
    try {
        const response = await fetch(`${API.BASE_URL}${API.PRODUCTS}`, {
            method: 'GET',
            headers: getAuthHeaders()
        });
        
        if (!response.ok) {
            throw new Error(`Lỗi khi lấy danh sách sản phẩm: ${response.status}`);
        }
        
        return await response.json();
    } catch (error) {
        console.error("Lỗi khi lấy danh sách sản phẩm:", error);
        throw error;
    }
}

// Lấy sản phẩm theo ID
async function getProductById(productId) {
    try {
        const response = await fetch(`${API.BASE_URL}${API.PRODUCTS}/${productId}`, {
            method: 'GET',
            headers: getAuthHeaders()
        });
        
        if (!response.ok) {
            throw new Error(`Lỗi khi lấy thông tin sản phẩm: ${response.status}`);
        }
        
        return await response.json();
    } catch (error) {
        console.error(`Lỗi khi lấy sản phẩm ID: ${productId}`, error);
        throw error;
    }
}

// Lấy sản phẩm nổi bật
async function getFeaturedProducts() {
    try {
        const response = await fetch(`${API.BASE_URL}${API.PRODUCTS}/featured`, {
            method: 'GET',
            headers: getAuthHeaders()
        });
        
        if (!response.ok) {
            throw new Error(`Lỗi khi lấy sản phẩm nổi bật: ${response.status}`);
        }
        
        return await response.json();
    } catch (error) {
        console.error("Lỗi khi lấy sản phẩm nổi bật:", error);
        throw error;
    }
}

// Tìm kiếm sản phẩm
async function searchProducts(query) {
    try {
        const response = await fetch(`${API.BASE_URL}${API.PRODUCTS}/search?q=${encodeURIComponent(query)}`, {
            method: 'GET',
            headers: getAuthHeaders()
        });
        
        if (!response.ok) {
            throw new Error(`Lỗi khi tìm kiếm sản phẩm: ${response.status}`);
        }
        
        return await response.json();
    } catch (error) {
        console.error(`Lỗi khi tìm kiếm sản phẩm với từ khóa: ${query}`, error);
        throw error;
    }
}

// Tạo sản phẩm mới
async function createProduct(productData) {
    try {
        const response = await fetch(`${API.BASE_URL}${API.PRODUCTS}`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify(productData)
        });
        
        if (!response.ok) {
            throw new Error(`Lỗi khi tạo sản phẩm: ${response.status}`);
        }
        
        return await response.json();
    } catch (error) {
        console.error("Lỗi khi tạo sản phẩm:", error);
        throw error;
    }
}

// Cập nhật sản phẩm
async function updateProduct(productId, productData) {
    try {
        const response = await fetch(`${API.BASE_URL}${API.PRODUCTS}/${productId}`, {
            method: 'PUT',
            headers: getAuthHeaders(),
            body: JSON.stringify(productData)
        });
        
        if (!response.ok) {
            throw new Error(`Lỗi khi cập nhật sản phẩm: ${response.status}`);
        }
        
        return await response.json();
    } catch (error) {
        console.error(`Lỗi khi cập nhật sản phẩm ID: ${productId}`, error);
        throw error;
    }
}

// Xóa sản phẩm
async function deleteProduct(productId) {
    try {
        const response = await fetch(`${API.BASE_URL}${API.PRODUCTS}/${productId}`, {
            method: 'DELETE',
            headers: getAuthHeaders()
        });
        
        if (!response.ok) {
            throw new Error(`Lỗi khi xóa sản phẩm: ${response.status}`);
        }
        
        return true;
    } catch (error) {
        console.error(`Lỗi khi xóa sản phẩm ID: ${productId}`, error);
        throw error;
    }
}

// API cho danh mục
// Lấy tất cả danh mục
async function getAllCategories() {
    try {
        const response = await fetch(`${API.BASE_URL}${API.CATEGORIES}`, {
            method: 'GET',
            headers: getAuthHeaders()
        });
        
        if (!response.ok) {
            throw new Error(`Lỗi khi lấy danh sách danh mục: ${response.status}`);
        }
        
        return await response.json();
    } catch (error) {
        console.error("Lỗi khi lấy danh sách danh mục:", error);
        throw error;
    }
}

// Lấy danh mục theo ID
async function getCategoryById(categoryId) {
    try {
        const response = await fetch(`${API.BASE_URL}${API.CATEGORIES}/${categoryId}`, {
            method: 'GET',
            headers: getAuthHeaders()
        });
        
        if (!response.ok) {
            throw new Error(`Lỗi khi lấy thông tin danh mục: ${response.status}`);
        }
        
        return await response.json();
    } catch (error) {
        console.error(`Lỗi khi lấy danh mục ID: ${categoryId}`, error);
        throw error;
    }
}

// Tạo danh mục mới
async function createCategory(categoryData) {
    try {
        const response = await fetch(`${API.BASE_URL}${API.CATEGORIES}`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify(categoryData)
        });
        
        if (!response.ok) {
            throw new Error(`Lỗi khi tạo danh mục: ${response.status}`);
        }
        
        return await response.json();
    } catch (error) {
        console.error("Lỗi khi tạo danh mục:", error);
        throw error;
    }
}

// Cập nhật danh mục
async function updateCategory(categoryId, categoryData) {
    try {
        const response = await fetch(`${API.BASE_URL}${API.CATEGORIES}/${categoryId}`, {
            method: 'PUT',
            headers: getAuthHeaders(),
            body: JSON.stringify(categoryData)
        });
        
        if (!response.ok) {
            throw new Error(`Lỗi khi cập nhật danh mục: ${response.status}`);
        }
        
        return await response.json();
    } catch (error) {
        console.error(`Lỗi khi cập nhật danh mục ID: ${categoryId}`, error);
        throw error;
    }
}

// Xóa danh mục
async function deleteCategory(categoryId) {
    try {
        const response = await fetch(`${API.BASE_URL}${API.CATEGORIES}/${categoryId}`, {
            method: 'DELETE',
            headers: getAuthHeaders()
        });
        
        if (!response.ok) {
            throw new Error(`Lỗi khi xóa danh mục: ${response.status}`);
        }
        
        return true;
    } catch (error) {
        console.error(`Lỗi khi xóa danh mục ID: ${categoryId}`, error);
        throw error;
    }
}

// API xác thực và người dùng
// Đăng nhập
async function login(username, password) {
    try {
        const response = await fetch(`${API.BASE_URL}${API.AUTH}/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ username, password })
        });
        
        if (!response.ok) {
            throw new Error(`Đăng nhập thất bại: ${response.status}`);
        }
        
        const data = await response.json();
        
        // Lưu token vào localStorage nếu có
        if (data.token) {
            localStorage.setItem('token', data.token);
        }
        
        return data;
    } catch (error) {
        console.error("Lỗi khi đăng nhập:", error);
        throw error;
    }
}

// Lấy thông tin người dùng hiện tại
async function getCurrentUser() {
    try {
        const token = localStorage.getItem('token');
        if (!token) {
            throw new Error('Không tìm thấy token xác thực');
        }
        
        const response = await fetch(`${API.BASE_URL}${API.AUTH}/me`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (!response.ok) {
            throw new Error(`Lỗi khi lấy thông tin người dùng: ${response.status}`);
        }
        
        return await response.json();
    } catch (error) {
        console.error("Lỗi khi lấy thông tin người dùng:", error);
        throw error;
    }
}

// Đăng xuất
async function logout() {
    try {
        const token = localStorage.getItem('token');
        if (token) {
            // Gọi API đăng xuất nếu backend có endpoint này
            const response = await fetch(`${API.BASE_URL}${API.AUTH}/logout`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            
            if (!response.ok) {
                console.warn(`Cảnh báo khi đăng xuất: ${response.status}`);
            }
        }
        
        localStorage.removeItem('token');
        
        return true;
    } catch (error) {
        console.error("Lỗi khi đăng xuất:", error);
        
        localStorage.removeItem('token');
        return true;
    }
}


window.CafeAPI = {
    checkApiConnection,
    getAllOrders,
    getOrderById,
    getOrdersByStatus,
    getRecentOrders,
    createOrder,
    updateOrder,
    updateOrderStatus,
    updatePaymentInfo,
    getOrderStatus,
    deleteOrder,
    getAllTables,
    getTablesByStatus,
    convertOrderFromServer,
    convertOrderToServer,
   
    getAllProducts,
    getProductById,
    getFeaturedProducts,
    searchProducts,
    createProduct,
    updateProduct,
    deleteProduct,
    
    getAllCategories,
    getCategoryById,
    createCategory,
    updateCategory,
    deleteCategory,
    
    login,
    getCurrentUser,
    logout
};