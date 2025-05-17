// status.js - Quản lý hiển thị trạng thái đơn hàng

// API endpoint gốc - dựa vào cấu hình trong application.properties
const API_BASE_URL = 'http://localhost:8081/api/orders';

// Biến toàn cục để theo dõi trạng thái API
let apiAvailable = false;
// Biến toàn cục để lưu trữ ID đơn hàng hiện tại
let currentOrderId = null;

document.addEventListener("DOMContentLoaded", async function() {
    console.log("=====================");
    console.log("KHỞI TẠO TRANG THEO DÕI ĐƠN HÀNG");
    console.log("=====================");
    
    // Đọc orderId từ URL hoặc localStorage trước khi kiểm tra API
    const urlParams = new URLSearchParams(window.location.search);
    let rawOrderId = urlParams.get('orderId') || localStorage.getItem("lastOrderId");
    if (typeof rawOrderId === "string" && rawOrderId.startsWith("HD")) {
        currentOrderId = parseInt(rawOrderId.replace("HD", ""), 10);
    } else if (rawOrderId) {
        currentOrderId = parseInt(rawOrderId, 10);
    } else {
        currentOrderId = null;
    }
    const paymentCompleted = localStorage.getItem("paymentCompleted");
    const paymentMethod = localStorage.getItem("paymentMethod");
    
    console.log("Thông tin đơn hàng hiện tại:");
    console.log("- Order ID:", currentOrderId);
    console.log("- Payment completed:", paymentCompleted);
    console.log("- Payment method:", paymentMethod);
    
    // Kiểm tra API và load dữ liệu thật
    try {
        setTimeout(async () => {
            try {
        await checkApiStatus();
    } catch (error) {
        console.error("Lỗi nghiêm trọng khi kết nối với API:", error);
                showErrorMessage("Không thể kết nối đến máy chủ");
                showNoOrderMessage();
            }
        }, 500);
    } catch (error) {
        console.error("Lỗi nghiêm trọng khi kết nối với API:", error);
        showErrorMessage("Không thể kết nối đến máy chủ");
        showNoOrderMessage();
    }
    
    // Thiết lập interval để cập nhật trạng thái đơn hàng mỗi 30 giây
    setInterval(() => {
        if (currentOrderId && apiAvailable) {
            checkOrderStatus(currentOrderId);
        }
    }, 30000);
});
    
// Kiểm tra trạng thái API
    async function checkApiStatus() {
        try {
        if (!window.CafeAPI || !window.CafeAPI.checkApiConnection) {
            apiAvailable = false;
            showErrorMessage("API không khả dụng");
            showNoOrderMessage();
            return;
        }
            const apiStatus = await window.CafeAPI.checkApiConnection();
            apiAvailable = apiStatus.available;
            if (apiAvailable) {
                await fetchOrderHistory();
                if (currentOrderId) {
                    await fetchAndDisplayOrder(currentOrderId);
                } else {
                    await fetchProcessingOrders();
                }
            if (localStorage.getItem("paymentCompleted") === "true") {
                updatePaymentStatus(localStorage.getItem("paymentMethod"));
                }
            } else {
            showErrorMessage("Máy chủ không phản hồi (HTTP " + apiStatus.status + ")");
            showNoOrderMessage();
            }
        } catch (error) {
            apiAvailable = false;
        showErrorMessage("Không thể kết nối đến máy chủ: " + error.message);
                showNoOrderMessage();
            }
        }

// Lấy đơn hàng từ API dựa trên ID
async function fetchAndDisplayOrder(orderId) {
    if (!apiAvailable || !window.CafeAPI || !window.CafeAPI.getOrderById) {
        showErrorMessage("API không khả dụng");
        showNoOrderMessage();
        return;
    }
    try {
        const numericOrderId = typeof orderId === "string" && orderId.startsWith("HD") ? parseInt(orderId.replace("HD", ""), 10) : parseInt(orderId, 10);
        // Lấy đơn hàng hiện tại
        const order = await window.CafeAPI.getOrderById(numericOrderId);
        // Lấy danh sách payment
        const payments = await fetch("http://localhost:8081/api/payments").then(res => res.json());
        // Tìm payment cho đơn hàng này
        const payment = payments.find(p => p.order && p.order.idOrder === order.idOrder);
        if (payment) {
            order.payment = {
                paymentMethod: payment.paymentMethod,
                paymentStatus: payment.paymentStatus
            };
        }
        displayCurrentOrder(order);
        if (order.status === "processing") {
            startOrderTimer(order.estimatedTime || 15);
        }
    } catch (error) {
        console.error("Chi tiết lỗi khi lấy đơn hàng:", error);
        let errorMessage = "Không thể lấy thông tin đơn hàng";
        if (error.message.includes("Timeout")) {
            errorMessage = "Máy chủ không phản hồi kịp thời. Vui lòng thử lại sau.";
        } else if (error.message.includes("Failed to fetch")) {
            errorMessage = "Không thể kết nối đến máy chủ. Vui lòng kiểm tra kết nối của bạn.";
        } else if (error.message.includes("Không tìm thấy đơn hàng")) {
            errorMessage = "Không tìm thấy đơn hàng với mã này. Vui lòng kiểm tra lại mã đơn hàng.";
        } else if (error.status === 404) {
            errorMessage = "Đơn hàng không tồn tại.";
        }
        showErrorMessage(errorMessage);
        showNoOrderMessage();
    }
}

// Lấy và hiển thị các đơn hàng đang xử lý
async function fetchProcessingOrders() {
    if (!apiAvailable || !window.CafeAPI || !window.CafeAPI.getOrdersByStatus) {
        showErrorMessage("API không khả dụng");
        showNoOrderMessage();
        return;
    }
    
    try {
        // Thêm timeout để tránh đợi quá lâu
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 giây timeout
        
        const processingOrders = await Promise.race([
            window.CafeAPI.getOrdersByStatus("processing"),
            new Promise((_, reject) => setTimeout(() => reject(new Error("Timeout: Yêu cầu đã quá thời gian chờ")), 10000))
        ]);
        
        clearTimeout(timeoutId);
        
        if (processingOrders && processingOrders.length > 0) {
            const latestOrder = processingOrders.sort((a, b) => new Date(b.orderTime) - new Date(a.orderTime))[0];
            displayCurrentOrder(latestOrder);
            startOrderTimer(latestOrder.estimatedTime || 15);
        } else {
            showNoOrderMessage();
        }
    } catch (error) {
        console.error("Lỗi khi lấy đơn hàng đang xử lý:", error);
        
        // Hiển thị thông báo lỗi phù hợp với người dùng
        let errorMessage = "Không thể lấy đơn hàng đang xử lý";
        
        if (error.message.includes("Timeout")) {
            errorMessage = "Máy chủ không phản hồi kịp thời. Vui lòng thử lại sau.";
        } else if (error.message.includes("Failed to fetch")) {
            errorMessage = "Không thể kết nối đến máy chủ. Vui lòng kiểm tra kết nối của bạn.";
        }
        
        showErrorMessage(errorMessage);
        showNoOrderMessage();
    }
}

// Lấy lịch sử đơn hàng từ API
async function fetchOrderHistory() {
    if (!apiAvailable) {
        showErrorMessage("API không khả dụng");
        return;
    }
    try {
        console.log("Đang lấy lịch sử đơn hàng...");
        // Lấy cả orders và payments song song
        const [orders, payments] = await Promise.all([
            window.CafeAPI.getRecentOrders(),
            fetch("http://localhost:8081/api/payments").then(res => res.json())
        ]);
        // Gắn payment vào từng order
        const processedOrders = orders.map(order => {
            // Tìm payment có order.idOrder trùng với order.idOrder
            const payment = payments.find(p => p.order && p.order.idOrder === order.idOrder);
            if (payment) {
                order.payment = {
                    paymentMethod: payment.paymentMethod,
                    paymentStatus: payment.paymentStatus
                };
            }
            // Chuyển đổi order sang định dạng frontend
            return window.CafeAPI && window.CafeAPI.convertOrderFromServer
                ? window.CafeAPI.convertOrderFromServer(order)
                : convertOrderFromServer(order);
        });
        displayOrderHistory(processedOrders);
    } catch (error) {
        console.error("Lỗi khi lấy lịch sử đơn hàng:", error);
        let errorMessage = "Không thể lấy lịch sử đơn hàng";
        if (error.message && error.message.includes("Timeout")) {
            errorMessage = "Máy chủ không phản hồi kịp thời khi lấy lịch sử đơn hàng.";
        } else if (error.message && error.message.includes("Failed to fetch")) {
            errorMessage = "Không thể kết nối đến máy chủ khi lấy lịch sử đơn hàng.";
        }
        showErrorMessage(errorMessage);
        displayOrderHistory([]);
    }
}

// Kiểm tra trạng thái đơn hàng mới từ server
async function checkOrderStatus(orderId) {
    if (!apiAvailable) {
        return;
    }
    
    try {
        // Thêm timeout để tránh đợi quá lâu
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 giây timeout
        
        const status = await Promise.race([
            window.CafeAPI.getOrderStatus(orderId),
            new Promise((_, reject) => setTimeout(() => reject(new Error("Timeout")), 5000))
        ]);
        
        clearTimeout(timeoutId);
        
        updateOrderStatusDisplay(status);
    } catch (error) {
        console.error("Lỗi khi kiểm tra trạng thái đơn hàng:", error);
        // Không hiển thị thông báo lỗi cho người dùng vì đây là hàm tự động gọi định kỳ
    }
}

// Hiển thị lịch sử đơn hàng
function displayOrderHistory(orders) {
    const historyContainer = document.getElementById("orderHistory");
    const emptyState = document.getElementById("emptyHistory");
    
    // Nếu không có đơn hàng nào
    if (!orders || orders.length === 0) {
        if (emptyState) emptyState.style.display = "block";
        return;
    }
    
    // Ẩn thông báo trống
    if (emptyState) emptyState.style.display = "none";
    
    // Sắp xếp đơn hàng theo thời gian giảm dần (mới nhất lên đầu)
    const sortedOrders = orders.sort((a, b) => new Date(b.orderTime) - new Date(a.orderTime));
    
    // Hiển thị tối đa 10 đơn hàng gần nhất
    const recentOrders = sortedOrders.slice(0, 10);
    
    // Xóa nội dung cũ
    historyContainer.innerHTML = "";
    
    // Lưu trữ ID đơn hàng đang được xem (nếu có)
    const currentViewingOrderId = document.getElementById("orderId")?.textContent;
    
    // Thêm các đơn hàng mới
    recentOrders.forEach(order => {
        const historyItem = document.createElement("div");
        historyItem.className = `history-item ${order.status}`;
        historyItem.id = `history-${order.idOrder || order.id}`;
        
        // Đánh dấu nếu đây là đơn hàng đang xem
        if (currentViewingOrderId === (order.idOrder || order.id)) {
            historyItem.classList.add('active');
        }
        
        historyItem.addEventListener("click", () => {
            const orderId = order.idOrder || order.id;
            fetchAndDisplayOrder(orderId);
            
            // Hiệu ứng cuộn lên trên đầu
            document.getElementById("currentOrder").scrollIntoView({ behavior: "smooth" });
        });
        
        const orderDate = new Date(order.orderTime);
        const now = new Date();
        const isToday = orderDate.getDate() === now.getDate() && 
                        orderDate.getMonth() === now.getMonth() && 
                        orderDate.getFullYear() === now.getFullYear();
        
        // Format date để hiển thị ngày nếu không phải today
        const dateDisplay = isToday 
            ? formatTime(orderDate) 
            : formatDate(order.orderTime);
            
        // Xử lý thông tin bàn - Cải thiện để đồng bộ với logic hiển thị trong displayCurrentOrder
        let tableDisplay = "Mang đi"; // Mặc định là mang đi
        
        if (order.tableNumber === "takeaway" || 
            (order.table && order.table === "takeaway") ||
            (order.table && typeof order.table === 'object' && 
             (order.table.tableNumber === "takeaway" || order.table.idTable === "takeaway"))) {
            tableDisplay = "Mang đi";
        } else if (!order.tableNumber && (!order.table || order.table === "null" || order.table === null)) {
            tableDisplay = "Mang đi";
        } else if (order.table) {
            if (typeof order.table === 'object') {
                if (order.table.tableNumber && order.table.tableNumber !== "null" && order.table.tableNumber !== null) {
                    tableDisplay = `Bàn ${order.table.tableNumber}`;
                } else if (order.table.idTable && order.table.idTable !== "null" && order.table.idTable !== null) {
                    tableDisplay = `Bàn ${order.table.idTable}`;
                }
            } else if (typeof order.table === 'number' || 
                      (typeof order.table === 'string' && order.table !== "null" && order.table !== null)) {
                tableDisplay = `Bàn ${order.table}`;
            }
        } else if (order.tableNumber && order.tableNumber !== "null" && order.tableNumber !== null) {
            tableDisplay = `Bàn ${order.tableNumber}`;
        }
        
        // Kiểm tra một lần nữa để đảm bảo không hiển thị "null"
        if (tableDisplay.includes("null")) {
            tableDisplay = "Mang đi";
        }
        
        // Xác định phương thức thanh toán để hiển thị
        let paymentInfo = "";
        
        // Kiểm tra nhiều nguồn thông tin thanh toán
        if ((order.payment && order.payment.paymentStatus === "completed") || 
            order.paymentStatus === "completed") {
            
            // Ưu tiên theo thứ tự: order.payment.paymentMethod > order.paymentMethod
            let paymentMethod = "cash"; // Mặc định là tiền mặt
            
            if (order.payment && order.payment.paymentMethod) {
                paymentMethod = order.payment.paymentMethod;
            } else if (order.paymentMethod) {
                paymentMethod = order.paymentMethod;
            }
            
            paymentInfo = ` - ${getPaymentMethodText(paymentMethod)}`;
        }
        
        historyItem.innerHTML = `
            <div class="history-header">
                <span class="history-id">${order.idOrder || order.id}</span>
                <span class="history-date">${dateDisplay}</span>
            </div>
            <div class="history-details">
                <span class="history-table">${tableDisplay}</span>
                <span class="history-amount">${formatCurrency(order.totalAmount)}đ${paymentInfo}</span>
            </div>
            <span class="history-status status-badge status-${order.status}">${getStatusText(order.status)}</span>
            <button class="history-view-btn">Xem chi tiết</button>
        `;
        
        historyContainer.appendChild(historyItem);
    });
}

// Hiển thị thông tin đơn hàng hiện tại
function displayCurrentOrder(order) {
    if (!order) {
        showNoOrderMessage();
        return;
    }
    
    console.log("Status.js - Hiển thị đơn hàng:", JSON.stringify(order, null, 2));
    
    // Đảm bảo đơn hàng được chuyển đổi đúng cách
    if (window.CafeAPI && window.CafeAPI.convertOrderFromServer) {
        // Sử dụng hàm từ API.js để đảm bảo định dạng nhất quán
        order = window.CafeAPI.convertOrderFromServer(order);
    } else if (order.orderDetails) {
        // Fallback nếu API.js không khả dụng
        order = convertOrderFromServer(order);
    }
    
    // DEBUG thông tin bàn
    console.log("Status.js - Thông tin bàn từ backend:");
    console.log("order.table =", order.table);
    console.log("order.tableNumber =", order.tableNumber);
    console.log("----------------");
    
    // Kiểm tra phần tử trước khi thao tác
    const elOrderId = document.getElementById("orderId");
    if (elOrderId) elOrderId.textContent = order.idOrder || order.id;
    
    // Xử lý thông tin bàn - Logic mới
    let tableDisplay = "";
    
    // Kiểm tra trường hợp mang đi trước tiên
    if (order.tableNumber === "takeaway" || 
        (order.table && (order.table === "takeaway" || 
         (typeof order.table === 'object' && 
          (order.table.tableNumber === "takeaway" || order.table.idTable === "takeaway"))))) {
        tableDisplay = "Mang đi";
    }
    // Xử lý trường hợp bàn null
    else if (!order.tableNumber && (!order.table || order.table === "null" || order.table === null)) {
        tableDisplay = "Mang đi"; // Mặc định mang đi nếu null
    }
    // Xử lý các trường hợp còn lại
    else if (order.table) {
        if (typeof order.table === 'object') {
            if (order.table.tableNumber && order.table.tableNumber !== "null" && order.table.tableNumber !== null) {
                tableDisplay = `Bàn ${order.table.tableNumber}`;
            } else if (order.table.idTable && order.table.idTable !== "null" && order.table.idTable !== null) {
                tableDisplay = `Bàn ${order.table.idTable}`;
            } else {
                tableDisplay = "Mang đi";
            }
        } else if (typeof order.table === 'number' || (typeof order.table === 'string' && order.table !== "null" && order.table !== null)) {
            tableDisplay = `Bàn ${order.table}`;
        } else {
            tableDisplay = "Mang đi";
        }
    } else if (order.tableNumber && order.tableNumber !== "null" && order.tableNumber !== null) {
        tableDisplay = `Bàn ${order.tableNumber}`;
    } else {
        tableDisplay = "Mang đi";
    }
    
    // Gỡ bỏ "null" khỏi hiển thị bàn nếu có
    if (tableDisplay.includes("null")) {
        tableDisplay = "Mang đi";
    }
    
    const elOrderTable = document.getElementById("orderTable");
    if (elOrderTable) elOrderTable.textContent = tableDisplay;
    
    const elOrderTime = document.getElementById("orderTime");
    if (elOrderTime) elOrderTime.textContent = formatDateTime(order.orderTime);
    const elOrderStatus = document.getElementById("orderStatus");
    if (elOrderStatus) {
        elOrderStatus.textContent = getStatusText(order.status);
        elOrderStatus.className = `status-badge status-${order.status}`;
    }
    const elOrderTotal = document.getElementById("orderTotal");
    if (elOrderTotal) elOrderTotal.textContent = `${formatCurrency(order.totalAmount)}đ`;
    
    // Xử lý phương thức thanh toán - Logic cải tiến
    let paymentMethodText = "Tiền mặt"; // Mặc định là tiền mặt
    
    // DEBUG thông tin thanh toán
    console.log("Status.js - Thông tin thanh toán:");
    console.log("order.payment =", order.payment);
    console.log("order.paymentMethod =", order.paymentMethod);
    console.log("order.paymentStatus =", order.paymentStatus);
    console.log("localStorage.paymentMethod =", localStorage.getItem("paymentMethod"));
    console.log("----------------");
    
    // Kiểm tra nhiều nguồn dữ liệu cho phương thức thanh toán
    if (order.payment && order.payment.paymentMethod) {
        // Ưu tiên phương thức thanh toán từ API
        paymentMethodText = getPaymentMethodText(order.payment.paymentMethod);
        console.log("Sử dụng phương thức thanh toán từ order.payment:", order.payment.paymentMethod);
    } else if (order.paymentMethod) {
        paymentMethodText = getPaymentMethodText(order.paymentMethod);
        console.log("Sử dụng phương thức thanh toán từ order:", order.paymentMethod);
    } else if (localStorage.getItem("paymentMethod")) {
        paymentMethodText = getPaymentMethodText(localStorage.getItem("paymentMethod"));
        console.log("Sử dụng phương thức thanh toán từ localStorage:", localStorage.getItem("paymentMethod"));
    }
    
    // Nếu đã thanh toán, hiển thị thông báo
    let paymentStatus = "";
    const isPaymentCompleted = (order.payment && order.payment.paymentStatus === "completed") || 
                            (order.paymentStatus === "completed") ||
                            localStorage.getItem("paymentCompleted") === "true";
    
    if (isPaymentCompleted) {
        paymentStatus = " (Đã thanh toán)";
    }
    
    const elPaymentMethod = document.getElementById("paymentMethod");
    if (elPaymentMethod) {
        elPaymentMethod.textContent = paymentMethodText + paymentStatus;
        // Thêm màu xanh nếu đã thanh toán
        if (paymentStatus) {
            elPaymentMethod.style.color = "#27ae60";
    } else {
            elPaymentMethod.style.color = ""; // Reset về màu mặc định
        }
    }
    
    // Hiển thị timer nếu đơn hàng đang xử lý
    const timerSection = document.getElementById("timerSection");
    if (timerSection) timerSection.style.display = order.status === "processing" ? "flex" : "none";
    
    // Cập nhật danh sách các món
    const itemsList = document.getElementById("orderItemsList");
    if (itemsList) {
    itemsList.innerHTML = "";
    const items = order.items || [];
    items.forEach(item => {
        const li = document.createElement("li");
        const productName = item.name || (item.product ? item.product.name : "Sản phẩm");
        const quantity = item.quantity || 1;
        const price = item.price || item.unitPrice || (item.product ? item.product.price : 0);
        li.innerHTML = `
            <span class="item-name">
                <span class="item-quantity">${quantity}x</span>
                ${productName}
            </span>
            <span class="item-price">${formatCurrency(price * quantity)}đ</span>
        `;
        itemsList.appendChild(li);
    });
    }
    highlightCurrentOrder(order.idOrder || order.id);
}

// Đánh dấu đơn hàng đang xem trong danh sách lịch sử
function highlightCurrentOrder(orderId) {
    // Bỏ active ở tất cả các đơn hàng
    document.querySelectorAll('.history-item').forEach(item => {
        item.classList.remove('active');
    });
    
    // Thêm active cho đơn hàng đang xem
    const historyItem = document.getElementById(`history-${orderId}`);
    if (historyItem) {
        historyItem.classList.add('active');
    }
}

// Hiển thị thông báo khi không có đơn hàng
function showNoOrderMessage() {
    const orderCard = document.getElementById("currentOrder");
    if (orderCard) {
    orderCard.innerHTML = `
        <h3>Đơn Hàng Hiện Tại</h3>
        <div class="empty-state">
            <i class="fas fa-coffee"></i>
            <h4>Không có đơn hàng đang xử lý</h4>
            <p>Bạn chưa đặt đơn hàng nào hoặc đơn hàng của bạn đã hoàn thành.</p>
            <button class="btn-order-now" onclick="window.location.href='menu.html'">Đặt hàng ngay</button>
        </div>
    `;
    }
    const timerSection = document.getElementById("timerSection");
    if (timerSection) timerSection.style.display = "none";
}

// Bắt đầu đếm ngược thời gian cho đơn hàng
function startOrderTimer(minutes) {
    const timerSection = document.getElementById("timerSection");
    if (!timerSection) return;
    
    timerSection.style.display = "flex"; // Hiển thị timer
    
    const timerText = document.getElementById("timerCount");
    const timerProgress = document.querySelector(".timer-progress");
    
    let timeLeft = minutes || 15; // Mặc định 15 phút nếu không có thông tin
    const totalTime = timeLeft;
    const circumference = 2 * Math.PI * 54; // 2πr, r = 54
    
    // Đặt giá trị stroke-dasharray ban đầu
    timerProgress.style.strokeDasharray = circumference;
    
    // Cập nhật ngay lập tức để hiển thị số phút
    timerText.textContent = timeLeft;
    
    // Bắt đầu đếm ngược
    const timer = setInterval(() => {
        timeLeft--;
        
        // Cập nhật hiển thị thời gian
        timerText.textContent = timeLeft;
        
        // Cập nhật stroke-dashoffset dựa trên thời gian còn lại
        const offset = circumference * (1 - timeLeft / totalTime);
        timerProgress.style.strokeDashoffset = offset;
        
        // Khi hết thời gian
        if (timeLeft <= 0) {
            clearInterval(timer);
            
            // Kiểm tra trạng thái đơn hàng từ server
            const orderId = document.getElementById("orderId").textContent;
            checkOrderStatus(orderId);
        }
    }, 60000); // Cập nhật mỗi phút (60000ms)
    
    // Lưu timer ID để có thể clear khi cần
    window.currentTimer = timer;
}

// Cập nhật thanh toán nếu có thanh toán hoàn tất
function updatePaymentStatus(method) {
    // Đảm bảo luôn có giá trị mặc định là tiền mặt
    const paymentMethod = method || "cash";
    
    // Lưu thông tin thanh toán vào localStorage
    localStorage.setItem("paymentCompleted", "true");
    localStorage.setItem("paymentMethod", paymentMethod);
    
    // Cập nhật giao diện nếu đang hiển thị
    const paymentMethodElement = document.getElementById("paymentMethod");
    if (paymentMethodElement) {
        paymentMethodElement.textContent = getPaymentMethodText(paymentMethod) + " (Đã thanh toán)";
        paymentMethodElement.style.color = "#27ae60";
    }
    
    // Tải lại lịch sử đơn hàng để cập nhật phương thức thanh toán
    if (apiAvailable) {
        fetchOrderHistory();
    }
}

// Hiển thị thông báo
function showNotification(message) {
    // Kiểm tra xem trình duyệt có hỗ trợ thông báo không
    if ("Notification" in window) {
        if (Notification.permission === "granted") {
            new Notification("T2K Coffee", {
                body: message,
                icon: "../assets/images/logo.png" // Thay đổi thành logo của bạn
            });
        } else if (Notification.permission !== "denied") {
            Notification.requestPermission().then(permission => {
                if (permission === "granted") {
                    new Notification("T2K Coffee", {
                        body: message,
                        icon: "../assets/images/logo.png"
                    });
                }
            });
        }
    }
    
    // Fallback cho trường hợp không hỗ trợ hoặc không được cấp quyền
    alert(message);
}

// Helper: Format số tiền
function formatCurrency(amount) {
    return new Intl.NumberFormat("vi-VN").format(amount);
}

// Helper: Format thời gian đầy đủ
function formatDateTime(dateString) {
    const date = new Date(dateString);
    return date.toLocaleString("vi-VN", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit"
    });
}

// Helper: Format ngày rút gọn
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString("vi-VN", {
        day: "2-digit",
        month: "2-digit"
    }) + " " + date.toLocaleTimeString("vi-VN", {
        hour: "2-digit",
        minute: "2-digit"
    });
}

// Helper: Format thời gian giờ:phút
function formatTime(date) {
    return date.toLocaleTimeString('vi-VN', {
        hour: '2-digit',
        minute: '2-digit'
    });
}

// Helper: Chuyển đổi status code sang text
function getStatusText(status) {
    switch (status) {
        case "processing":
            return "Đang xử lý";
        case "ready":
            return "Đã sẵn sàng";
        case "completed":
            return "Đã hoàn thành";
        case "cancelled":
            return "Đã hủy";
        default:
            return "Đang xử lý";
    }
}

// Helper: Chuyển đổi payment method code sang text
function getPaymentMethodText(method) {
    if (!method) return "Tiền mặt"; // Mặc định là tiền mặt
    
    const methodLower = String(method).toLowerCase(); // Chuyển về chữ thường để so sánh và đảm bảo là string
    
    console.log("Chuyển đổi phương thức thanh toán:", method, "->", methodLower);
    
    switch (methodLower) {
        case "cash":
        case "tien mat":
        case "tiền mặt":
        case "tienmat":
            return "Tiền mặt";
            
        case "transfer":
        case "bank":
        case "chuyển khoản":
        case "chuyen khoan":
        case "chuyenkhoan":
            return "Chuyển khoản";
            
        case "card":
        case "credit":
        case "creditcard":
        case "credit card":
        case "debit":
        case "debitcard":
        case "debit card":
        case "thẻ":
        case "the":
            return "Thẻ tín dụng";
            
        case "momo":
            return "Ví MoMo";
            
        case "zalopay":
        case "zalo":
            return "ZaloPay";
            
        case "vnpay":
        case "vn pay":
            return "VNPay";
            
        case "shopee":
        case "shopeepay":
        case "shopee pay":
            return "ShopeePay";
            
        default:
            // Nếu không khớp, trả về chuỗi đã format
            return method.charAt(0).toUpperCase() + method.slice(1).toLowerCase();
    }
}

// Thêm CSS cho nút "Đặt hàng ngay"
const style = document.createElement("style");
style.textContent = `
.btn-order-now {
    display: inline-block;
    padding: 12px 25px;
    background-color: #e67e22;
    color: white;
    border: none;
    border-radius: 8px;
    font-size: 1rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.3s ease;
    margin-top: 20px;
    box-shadow: 0 4px 8px rgba(230, 126, 34, 0.2);
}

.btn-order-now:hover {
    background-color: #d35400;
    transform: translateY(-2px);
    box-shadow: 0 6px 12px rgba(230, 126, 34, 0.3);
}

.total-amount {
    margin-top: 25px;
    padding-top: 15px;
    border-top: 2px solid #f0f0f0;
}

.total-amount p {
    display: flex;
    justify-content: space-between;
    margin: 10px 0;
    font-size: 1.1rem;
    font-weight: 500;
}

.total-amount p:first-child {
    font-size: 1.2rem;
    font-weight: 700;
    color: #e67e22;
}
`;
document.head.appendChild(style);

// Hiển thị thông báo lỗi cho người dùng
function showErrorMessage(message) {
    // Tạo thông báo lỗi
    const errorDiv = document.createElement('div');
    errorDiv.className = 'api-error-message';
    errorDiv.innerHTML = `
        <i class="fas fa-exclamation-circle"></i>
        <span>${message}</span>
        <button class="close-btn"><i class="fas fa-times"></i></button>
    `;
    
    // Thêm vào DOM
    document.body.appendChild(errorDiv);
    
    // Hiệu ứng hiển thị
    setTimeout(() => {
        errorDiv.classList.add('show');
    }, 100);
    
    // Tự động ẩn sau 8 giây
    setTimeout(() => {
        errorDiv.classList.remove('show');
        setTimeout(() => errorDiv.remove(), 300);
    }, 8000);
    
    // Xử lý nút đóng
    const closeBtn = errorDiv.querySelector('.close-btn');
    closeBtn.addEventListener('click', () => {
        errorDiv.classList.remove('show');
        setTimeout(() => errorDiv.remove(), 300);
    });
    
    // Thêm CSS nếu chưa có
    if (!document.getElementById('error-message-styles')) {
        const style = document.createElement('style');
        style.id = 'error-message-styles';
        style.textContent = `
            .api-error-message {
                position: fixed;
                top: -100px;
                left: 50%;
                transform: translateX(-50%);
                background-color: #f44336;
                color: white;
                padding: 12px 24px;
                border-radius: 8px;
                box-shadow: 0 4px 12px rgba(0,0,0,0.15);
                z-index: 9999;
                display: flex;
                align-items: center;
                gap: 12px;
                transition: all 0.3s ease;
                opacity: 0;
            }
            .api-error-message.show {
                top: 80px;
                opacity: 1;
            }
            .api-error-message i {
                font-size: 20px;
            }
            .api-error-message .close-btn {
                background: none;
                border: none;
                color: white;
                cursor: pointer;
                margin-left: 10px;
                opacity: 0.7;
                transition: opacity 0.2s;
            }
            .api-error-message .close-btn:hover {
                opacity: 1;
            }
        `;
        document.head.appendChild(style);
    }
}

// Chuyển đổi từ object order backend sang định dạng frontend
function convertOrderFromServer(serverOrder) {
    console.log("Status.js - convertOrderFromServer - input:", JSON.stringify(serverOrder, null, 2));
    
    // Clone đối tượng để không ảnh hưởng đến dữ liệu gốc
    const order = { ...serverOrder };
    
    // Map ID
    if (order.idOrder) {
        order.id = order.idOrder;
    }
    
    // Map table - Cải thiện xử lý bàn
    if (order.table) {
        if (typeof order.table === 'object') {
            // Sử dụng tableNumber từ đối tượng table
            if (order.table.tableNumber) {
                order.tableNumber = order.table.tableNumber;
            } else if (order.table.idTable) {
                // Nếu không có tableNumber, sử dụng idTable
                order.tableNumber = order.table.idTable;
            }
            // Kiểm tra nếu là đơn takeaway
            if (order.table.tableNumber === 'takeaway' || order.table.idTable === 'takeaway') {
                order.tableNumber = 'takeaway';
            }
        } else if (typeof order.table === 'string' || typeof order.table === 'number') {
            // Nếu table là string hoặc number
            order.tableNumber = order.table;
        }
    }
    
    // Xử lý thông tin thanh toán
    if (order.payment) {
        console.log("Status.js - Thông tin payment từ API:", order.payment);
        order.paymentMethod = order.payment.paymentMethod || "cash"; // Mặc định là tiền mặt
        order.paymentStatus = order.payment.paymentStatus || "pending";
        // Log thông tin thanh toán để debug
        console.log("Status.js - Tìm thấy thông tin thanh toán từ order.payment:", {
            method: order.paymentMethod,
            status: order.paymentStatus
        });
    } else {
        // KHÔNG lấy paymentMethod từ localStorage nữa, chỉ lấy từ object đơn hàng
        order.paymentMethod = order.paymentMethod || "cash";
        order.paymentStatus = order.paymentStatus || "pending";
    }
    
    // Map items từ orderDetails
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
    
    // Chuyển đổi totalAmount từ BigDecimal sang số
    if (order.totalAmount) {
        order.totalAmount = parseFloat(order.totalAmount);
    }
    
    // Đảm bảo ngày giờ là đúng định dạng
    if (order.orderTime && typeof order.orderTime === 'string') {
        order.orderTime = new Date(order.orderTime).toISOString();
    }
    
    // Đảm bảo có trạng thái
    if (!order.status) {
        order.status = "processing";
    }
    
    console.log("Status.js - convertOrderFromServer - output:", JSON.stringify(order, null, 2));
    return order;
}

// Chuyển đổi từ object order frontend sang định dạng backend
function convertOrderToServer(clientOrder) {
    // Dữ liệu cơ bản
    const serverOrder = {
        totalAmount: clientOrder.totalAmount,
        note: clientOrder.notes,
        status: clientOrder.status || "processing"
    };
    
    // Thêm ID nếu có (cho cập nhật)
    if (clientOrder.id) {
        serverOrder.idOrder = clientOrder.id;
    }
    
    // Thêm thời gian nếu có
    if (clientOrder.orderTime) {
        serverOrder.orderTime = new Date(clientOrder.orderTime).toISOString();
    } else {
        serverOrder.orderTime = new Date().toISOString();
    }
    
    // Thêm thông tin bàn
    if (clientOrder.tableNumber && clientOrder.tableNumber !== 'takeaway') {
        serverOrder.table = {
            idTable: parseInt(clientOrder.tableNumber)
        };
    }
    
    // Chuyển đổi items thành productItems (cho API)
    if (clientOrder.items && clientOrder.items.length > 0) {
        serverOrder.productItems = clientOrder.items.map(item => {
            return {
                productId: item.id,
                quantity: item.quantity,
                unitPrice: item.price
            };
        });
    }
    
    return serverOrder;
}

// Tạo đơn hàng mới trên server
async function createOrderOnServer(order) {
    if (!apiAvailable) {
        // Nếu API không khả dụng, fallback về local
        console.log("API không khả dụng, lưu đơn hàng vào local storage");
        return createLocalOrder(order);
    }
    
    try {
        console.log("Gửi đơn hàng đến server:", order);
        
        // Sử dụng helper function từ api.js
        const createdOrder = await window.CafeAPI.createOrder(order);
        console.log("Đơn hàng đã được tạo:", createdOrder);
        
        // Cập nhật localStorage để giữ theo dõi đơn hàng hiện tại
        localStorage.setItem("lastOrderId", createdOrder.idOrder || createdOrder.id);
        
        return createdOrder;
    } catch (error) {
        console.error("Lỗi khi tạo đơn hàng trên server:", error);
        // Fallback về local nếu API fails
        showErrorMessage("Không thể tạo đơn hàng trên máy chủ. Đang sử dụng lưu trữ cục bộ.");
        return createLocalOrder(order);
    }
}

// Tạo đơn hàng local (fallback khi không có API)
function createLocalOrder(order) {
    console.log("Tạo đơn hàng local:", order);
    
    // Tạo mã đơn hàng nếu chưa có
    if (!order.id) {
        order.id = "HD" + (Math.floor(100000 + Math.random() * 900000)).toString();
    }
    
    // Đặt thời gian đặt hàng nếu chưa có
    if (!order.orderTime) {
        order.orderTime = new Date().toISOString();
    }
    
    // Đặt trạng thái ban đầu
    order.status = "processing";
    
    // Lưu thông tin đơn hàng vào localStorage
    const orders = JSON.parse(localStorage.getItem("orders")) || [];
    orders.push(order);
    localStorage.setItem("orders", JSON.stringify(orders));
    
    // Lưu ID đơn hàng hiện tại
    localStorage.setItem("lastOrderId", order.id);
    
    return order;
}

// Hàm cập nhật trạng thái đơn hàng và phương thức thanh toán
async function updateOrderStatusAndPayment(orderId, newStatus, newPaymentMethod) {
    try {
        // 1. Cập nhật trạng thái đơn hàng
        await fetch(`${API_BASE_URL}/${orderId}/status`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: newStatus })
        });
        // 2. Nếu có phương thức thanh toán mới, cập nhật paymentMethod
        if (newPaymentMethod) {
            await fetch(`${API_BASE_URL}/${orderId}/payment`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ paymentMethod: newPaymentMethod })
            });
        }
        // Reload lại đơn hàng hoặc giao diện nếu cần
        if (typeof fetchAndDisplayOrder === 'function') {
            await fetchAndDisplayOrder(orderId);
        }
        showNotification('Cập nhật trạng thái và phương thức thanh toán thành công!', 'success');
    } catch (error) {
        showNotification('Lỗi khi cập nhật trạng thái hoặc phương thức thanh toán: ' + error.message, 'error');
    }
}

// Hàm cập nhật hiển thị trạng thái đơn hàng
function updateOrderStatusDisplay(newStatus) {
        // Cập nhật UI nếu trạng thái thay đổi
        const currentStatusEl = document.getElementById("orderStatus");
        const currentStatus = currentStatusEl.textContent;
        
    if (getStatusText(newStatus) !== currentStatus) {
            // Cập nhật badge trạng thái
        currentStatusEl.textContent = getStatusText(newStatus);
        currentStatusEl.className = `status-badge status-${newStatus}`;
            
            // Thông báo cho người dùng
        showNotification(`Đơn hàng của bạn đã ${getStatusText(newStatus).toLowerCase()}!`);
            
            // Cập nhật lại lịch sử đơn hàng
            fetchOrderHistory();
            
            // Xử lý timer nếu cần
        if (newStatus !== "processing" && window.currentTimer) {
                clearInterval(window.currentTimer);
            }
        }
} 