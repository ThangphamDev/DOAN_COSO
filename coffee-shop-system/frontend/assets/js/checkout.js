// checkout.js

// API endpoint gốc
const API_BASE_URL = 'http://localhost:8081/api/orders';

document.addEventListener("DOMContentLoaded", function () {
    // Kiểm tra xem có đơn hàng hiện tại không
    const currentOrder = JSON.parse(localStorage.getItem("currentOrder"));
    
    if (currentOrder) {
        // Nếu có đơn hàng, hiển thị thông tin đơn hàng đã đặt
        displayCurrentOrder(currentOrder);
    } else {
        // Nếu không có đơn hàng, hiển thị giao diện đặt hàng bình thường
        loadTables();
        loadOrderSummary();
        setupPaymentMethodChange();
        setupPlaceOrder();
    }
});

// Load table numbers dynamically
function loadTables() {
    const tableSelect = document.getElementById("tableNumber");
    
    // Nếu đã có bàn được chọn trong localStorage, sử dụng nó
    const savedTable = localStorage.getItem("selectedTable");
    
    // Xóa các options hiện tại
    tableSelect.innerHTML = '<option value="">Chọn bàn</option>';
    
    // Gọi API để lấy danh sách bàn
    fetch(`${API_BASE_URL.replace('/orders', '')}/tables`)
        .then(response => {
            if (!response.ok) {
                throw new Error(`Lỗi khi lấy danh sách bàn: ${response.status}`);
            }
            return response.json();
        })
        .then(tables => {
            console.log("Dữ liệu bàn từ API:", tables);
            
            // Lọc ra các bàn có trạng thái "Trống" hoặc "Available"
            const availableTables = tables.filter(table => 
                table.status === "Available" || 
                table.status === "Trống" || 
                table.status === "available" || 
                table.status === "trống");
            
            if (availableTables.length > 0) {
                availableTables.forEach(table => {
                    const option = document.createElement("option");
                    const tableId = table.idTable || table.ID_Table;
                    option.value = tableId;
                    
                    // Hiển thị thông tin bàn nếu có
                    let displayText = `Bàn ${tableId}`;
                    if (table.location) {
                        displayText += ` (${table.location}`;
                        if (table.capacity) {
                            displayText += ` - ${table.capacity} người`;
                        }
                        displayText += `)`;
                    } else if (table.capacity) {
                        displayText += ` (${table.capacity} người)`;
                    }
                    
                    option.textContent = displayText;
                    tableSelect.appendChild(option);
                });
            } else {
                // Nếu không có bàn nào từ API, sử dụng dữ liệu mẫu
                useSampleTables();
            }
            
            // Thêm option mang đi
            const takeawayOption = document.createElement("option");
            takeawayOption.value = "takeaway";
            takeawayOption.textContent = "Mang đi";
            tableSelect.appendChild(takeawayOption);
            
            // Chọn bàn đã lưu trong localStorage nếu có
            if (savedTable) {
                // Kiểm tra xem bàn đã lưu có tồn tại trong danh sách không
                const exists = Array.from(tableSelect.options).some(option => option.value === savedTable);
                if (exists) {
                    tableSelect.value = savedTable;
                }
            }
        })
        .catch(error => {
            console.error("Lỗi khi lấy dữ liệu bàn từ API:", error);
            // Fallback: sử dụng dữ liệu mẫu khi có lỗi
            useSampleTables();
        });
}

// Hàm tạo dữ liệu mẫu cho bàn
function useSampleTables() {
    const tableSelect = document.getElementById("tableNumber");
    
    // Đảm bảo vẫn có option chọn bàn
    if (tableSelect.querySelector('option[value=""]') === null) {
        const defaultOption = document.createElement("option");
        defaultOption.value = "";
        defaultOption.textContent = "Chọn bàn";
        tableSelect.appendChild(defaultOption);
    }
    
    // Thêm dữ liệu mẫu
    for (let i = 1; i <= 10; i++) {
        const option = document.createElement("option");
        option.value = i;
        option.textContent = `Bàn ${i}`;
        tableSelect.appendChild(option);
    }
    
    // Đảm bảo có option mang đi
    if (tableSelect.querySelector('option[value="takeaway"]') === null) {
        const takeawayOption = document.createElement("option");
        takeawayOption.value = "takeaway";
        takeawayOption.textContent = "Mang đi";
        tableSelect.appendChild(takeawayOption);
    }
    
    // Chọn bàn đã lưu trong localStorage nếu có
    const savedTable = localStorage.getItem("selectedTable");
    if (savedTable) {
        tableSelect.value = savedTable;
    }
}

// Load order summary from cart
function loadOrderSummary() {
    const cart = JSON.parse(localStorage.getItem("cart")) || [];
    const summaryDiv = document.getElementById("orderSummary");
    summaryDiv.innerHTML = "";
    let total = 0;

    if (cart.length === 0) {
        summaryDiv.innerHTML = '<p class="empty-cart-message">Giỏ hàng của bạn đang trống</p>';
        return;
    }

    cart.forEach((item) => {
        const itemDiv = document.createElement("div");
        itemDiv.classList.add("summary-item");
        itemDiv.innerHTML = `
            <p><strong>${item.name}</strong> x ${item.quantity}</p>
            <p>${(item.price * item.quantity).toLocaleString('vi-VN')}đ</p>
        `;
        total += item.price * item.quantity;
        summaryDiv.appendChild(itemDiv);
    });

    const totalDiv = document.createElement("div");
    totalDiv.classList.add("summary-total");
    totalDiv.innerHTML = `<h4>Tổng cộng: ${total.toLocaleString('vi-VN')}đ</h4>`;
    summaryDiv.appendChild(totalDiv);
}

// Setup payment method change
function setupPaymentMethodChange() {
    const paymentOptions = document.querySelectorAll('input[name="payment"]');
    
    // Xử lý sự kiện khi thay đổi phương thức thanh toán
    paymentOptions.forEach(option => {
        option.addEventListener('change', function() {
            const paymentMethod = this.value;
            
            if (paymentMethod === "transfer") {
                // Kiểm tra xem đang hiển thị đơn hàng hiện tại hay đang đặt đơn hàng mới
                const currentOrder = localStorage.getItem("currentOrder");
                let order;
                
                if (currentOrder) {
                    // Nếu đang xem đơn hàng hiện tại, sử dụng dữ liệu từ đó
                    order = JSON.parse(currentOrder);
                    // Chuyển đổi items sang cart để showVietQR hoạt động đúng
                    if (order.items && !order.cart) {
                        order.cart = order.items;
                    }
                } else {
                    // Nếu đang đặt đơn hàng mới, lấy dữ liệu từ form
                    order = prepareOrderData();
                }
                
                // Kiểm tra giỏ hàng để đảm bảo có sản phẩm
                if ((order.cart && order.cart.length > 0) || (order.items && order.items.length > 0)) {
                    // Tự động hiển thị QR khi chọn chuyển khoản
                    showVietQR(order);
                    
                    // Ẩn nút đặt hàng khi hiển thị QR
                    const placeOrderBtn = document.getElementById('placeOrderBtn');
                    if (placeOrderBtn) placeOrderBtn.style.display = 'none';
                    
                    // Ẩn nút xác nhận thanh toán
                    const confirmPaymentBtn = document.getElementById('confirmPaymentBtn');
                    if (confirmPaymentBtn) confirmPaymentBtn.style.display = 'none';
                } else {
                    alert('Giỏ hàng của bạn đang trống. Vui lòng thêm sản phẩm vào giỏ hàng trước.');
                    // Trở lại radio tiền mặt
                    document.getElementById('cashPayment').checked = true;
                }
            } else {
                // Ẩn container QR code khi thay đổi phương thức thanh toán sang tiền mặt
                document.getElementById('qrCodeContainer').style.display = 'none';
                
                // Hiển thị lại nút đặt hàng hoặc nút xác nhận thanh toán
                const placeOrderBtn = document.getElementById('placeOrderBtn');
                const confirmPaymentBtn = document.getElementById('confirmPaymentBtn');
                
                if (placeOrderBtn) placeOrderBtn.style.display = 'block';
                if (confirmPaymentBtn) confirmPaymentBtn.style.display = 'block';
                
                // Xóa nút đã thanh toán nếu có
                const doneButton = document.getElementById('paymentDoneBtn');
                if (doneButton) {
                    doneButton.remove();
                }
            }
        });
    });
}

// Hoàn tất thanh toán chuyển khoản
async function completeTransferPayment(order) {
    alert("Cảm ơn bạn đã thanh toán! Đơn hàng của bạn đang được xử lý.");
    try {
        localStorage.setItem("paymentCompleted", "true");
        localStorage.setItem("paymentMethod", "transfer");
        order.paymentMethod = "transfer";
        // Lấy lại số bàn nếu chưa có
        if (!order.tableNumber) {
            order.tableNumber = document.getElementById("tableNumber")?.value || localStorage.getItem("selectedTable") || "";
        }
        // Lấy lại khuyến mãi nếu có
        const appliedPromotion = JSON.parse(localStorage.getItem('appliedPromotion') || 'null');
        const totalAmount = (appliedPromotion && appliedPromotion.finalTotal)
            ? appliedPromotion.finalTotal
            : order.finalTotal || order.totalAmount;
        // Kiểm tra kết nối API
        const apiStatus = await window.CafeAPI.checkApiConnection();
        let orderId;
        if (apiStatus.available) {
            try {
                const serverOrder = {
                    totalAmount: totalAmount,
                    note: order.notes,
                    status: "processing",
                    orderTime: order.orderTime || new Date().toISOString(),
                    payment: {
                        paymentMethod: "transfer",
                        paymentStatus: "pending",
                        createAt: new Date().toISOString(),
                        amount: totalAmount
                    }
                };
                // Thêm thông tin bàn
                if (order.tableNumber && order.tableNumber !== 'takeaway') {
                    serverOrder.table = {
                        idTable: parseInt(order.tableNumber)
                    };
                } else if (order.tableNumber === 'takeaway') {
                    serverOrder.table = {
                        idTable: "takeaway",
                        tableNumber: "takeaway"
                    };
                }
                // Thêm sản phẩm
                if (order.cart && order.cart.length > 0) {
                    serverOrder.productItems = order.cart.map(item => ({
                        productId: item.id,
                        quantity: item.quantity,
                        unitPrice: item.price
                    }));
                } else if (order.items && order.items.length > 0) {
                    serverOrder.productItems = order.items.map(item => ({
                        productId: item.id,
                        quantity: item.quantity,
                        unitPrice: item.price
                    }));
                } else {
                    serverOrder.productItems = [];
                }
                // Thêm khuyến mãi nếu có
                if (appliedPromotion) {
                    serverOrder.promotion = { code: appliedPromotion.code };
                    serverOrder.discountAmount = appliedPromotion.discountAmount;
                }
                console.log("DEBUG - Gửi dữ liệu đơn hàng chuyển khoản:", JSON.stringify(serverOrder, null, 2));
                const createdOrder = await window.CafeAPI.createOrder(serverOrder);
                orderId = createdOrder.idOrder || createdOrder.id;
                console.log("DEBUG - Đơn hàng chuyển khoản được tạo với ID:", orderId);
            } catch (error) {
                console.error("Lỗi khi gọi API tạo đơn hàng chuyển khoản:", error);
                orderId = order.orderId || generateOrderCode();
                fallbackToLocalStorage(order);
            }
        } else {
            console.warn("API không khả dụng, lưu đơn hàng vào localStorage");
            orderId = order.orderId || generateOrderCode();
            fallbackToLocalStorage(order);
        }
        localStorage.setItem("lastOrderId", orderId);
        localStorage.removeItem("currentOrder");
        localStorage.removeItem("cart");
        localStorage.removeItem("appliedPromotion");
        localStorage.removeItem("selectedTable");
        setTimeout(() => {
            window.location.href = "status.html";
        }, 2000);
    } catch (error) {
        console.error("Lỗi khi xử lý thanh toán:", error);
        alert("Đã xảy ra lỗi khi xử lý thanh toán. Vui lòng thử lại sau.");
    }
}

// Chuẩn bị dữ liệu đơn hàng
function prepareOrderData() {
    // Lấy thông tin khuyến mãi đã áp dụng (nếu có)
    const appliedPromotion = JSON.parse(localStorage.getItem('appliedPromotion') || 'null');
    
    return {
        tableNumber: document.getElementById("tableNumber").value || "chưa chọn",
        notes: document.getElementById("notes").value,
        cart: JSON.parse(localStorage.getItem("cart")) || [],
        orderTime: new Date().toISOString(),
        totalAmount: calculateTotal(),
        paymentMethod: document.querySelector('input[name="payment"]:checked').value,
        promoCode: appliedPromotion ? appliedPromotion.code : null,
        discountAmount: appliedPromotion ? appliedPromotion.discountAmount : 0,
        finalTotal: appliedPromotion ? appliedPromotion.finalTotal : calculateTotal()
    };
}

// Setup Place Order button
function setupPlaceOrder() {
    const placeOrderBtn = document.getElementById("placeOrderBtn");
    
    placeOrderBtn.addEventListener("click", async function() {
        // Lấy thông tin bàn
        const tableNumber = document.getElementById("tableNumber").value;
        
        // Kiểm tra đã chọn bàn chưa
        if (!tableNumber) {
            alert("Vui lòng chọn bàn hoặc chọn mang đi");
            return;
        }
        
        // Lưu bàn đã chọn vào localStorage để tiện sử dụng sau này
        localStorage.setItem("selectedTable", tableNumber);
        
        // Lấy giỏ hàng
        const cart = JSON.parse(localStorage.getItem("cart")) || [];
        
        // Kiểm tra giỏ hàng có sản phẩm không
        if (cart.length === 0) {
            alert("Giỏ hàng của bạn đang trống. Vui lòng thêm sản phẩm trước khi đặt hàng.");
            return;
        }
        
        // Lấy phương thức thanh toán
        const paymentMethod = document.querySelector('input[name="payment"]:checked').value;
        
        // Nếu thanh toán bằng chuyển khoản, hiển thị QR và sau đó mới xử lý đơn hàng
        if (paymentMethod === "transfer") {
            // Chuẩn bị dữ liệu đơn hàng
            const order = prepareOrderData();
            
            // Hiển thị mã QR thanh toán
            showVietQR(order);
        } else {
            // Xử lý đặt hàng khi thanh toán tiền mặt
            try {
                // Lấy thông tin đơn hàng
                const order = prepareOrderData();
                
                // Hiển thị thông báo
                alert("Đơn hàng của bạn đang được xử lý!");
                
                // Kiểm tra kết nối API
                const apiStatus = await window.CafeAPI.checkApiConnection();
                
                // Lưu thông tin thanh toán
                localStorage.setItem("paymentMethod", "cash");
                localStorage.setItem("paymentCompleted", "false");
                
                let orderId;
                if (apiStatus.available) {
                    try {
                        // Chuẩn bị dữ liệu đơn hàng cho server
                        const serverOrder = {
                            totalAmount: order.finalTotal || order.totalAmount,
                            note: order.notes,
                            status: "processing",
                            orderTime: order.orderTime,
                            payment: {
                                paymentMethod: "cash",
                                paymentStatus: "pending",
                                createAt: new Date().toISOString(),
                                amount: order.finalTotal || order.totalAmount
                            }
                        };
                        
                        // Thêm thông tin bàn
                        if (order.tableNumber && order.tableNumber !== 'takeaway') {
                            serverOrder.table = {
                                idTable: parseInt(order.tableNumber)
                            };
                        } else if (order.tableNumber === 'takeaway') {
                            serverOrder.table = {
                                idTable: "takeaway",
                                tableNumber: "takeaway"
                            };
                        }
                        
                        // Thêm thông tin sản phẩm
                        serverOrder.productItems = order.cart.map(item => {
                            return {
                                productId: item.id,
                                quantity: item.quantity,
                                unitPrice: item.price
                            };
                        });
                        
                        // Thêm thông tin khuyến mãi nếu có
                        if (order.promoCode) {
                            serverOrder.promotion = {
                                code: order.promoCode
                            };
                            serverOrder.discountAmount = order.discountAmount;
                        }
                        
                        console.log("DEBUG - Gửi dữ liệu đơn hàng đến server:", JSON.stringify(serverOrder, null, 2));
                        
                        // Gọi API tạo đơn hàng
                        const createdOrder = await window.CafeAPI.createOrder(serverOrder);
                        console.log("DEBUG - API đã trả về đơn hàng:", JSON.stringify(createdOrder, null, 2));
                        
                        // Lấy ID đơn hàng từ response
                        orderId = createdOrder.idOrder || createdOrder.id;
                        console.log("DEBUG - Đơn hàng được tạo thành công với ID:", orderId);
                    } catch (error) {
                        console.error("Lỗi khi gọi API tạo đơn hàng:", error);
                        // Fallback sang lưu local
                        orderId = generateOrderCode();
                        fallbackToLocalStorage(order);
                    }
                } else {
                    console.warn("API không khả dụng, lưu đơn hàng vào localStorage");
                    orderId = generateOrderCode();
                    fallbackToLocalStorage(order);
                }
                
                console.log("Đơn hàng đã được tạo với ID:", orderId);
                localStorage.setItem("lastOrderId", orderId);
                
                // Xóa giỏ hàng
                localStorage.removeItem("cart");
                
                // Xóa thông tin khuyến mãi
                localStorage.removeItem("appliedPromotion");
                
                // Xóa bàn đã chọn
                localStorage.removeItem("selectedTable");
                
                // Chuyển hướng đến trang xem tình trạng đơn hàng
                window.location.href = "status.html";
            } catch (error) {
                console.error("Lỗi khi xử lý đặt hàng:", error);
                alert("Đã xảy ra lỗi khi xử lý đơn hàng. Vui lòng thử lại sau.");
            }
        }
    });
}

// Calculate total from cart items
function calculateTotal() {
    const cart = JSON.parse(localStorage.getItem("cart")) || [];
    const appliedPromotion = JSON.parse(localStorage.getItem('appliedPromotion') || 'null');
    
    let total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    
    // Áp dụng giảm giá nếu có
    if (appliedPromotion && appliedPromotion.finalTotal) {
        total = appliedPromotion.finalTotal;
    }
    
    return total;
}

function generateOrderCode() {
    // Tạo mã hóa đơn bắt đầu bằng HD và theo sau là số ngẫu nhiên 6 chữ số
    const randomDigits = Math.floor(100000 + Math.random() * 900000);
    return `HD${randomDigits}`;
}

// Hiển thị mã QR chuyển khoản
function showVietQR(order) {
    // Lấy số tiền sau khuyến mãi nếu có
    const appliedPromotion = JSON.parse(localStorage.getItem('appliedPromotion') || 'null');
    const amount = (appliedPromotion && appliedPromotion.finalTotal)
        ? appliedPromotion.finalTotal
        : order.finalTotal || order.totalAmount || 
          (order.items ? order.items.reduce((sum, item) => sum + (item.price * item.quantity), 0) : 0) ||
          (order.cart ? order.cart.reduce((sum, item) => sum + (item.price * item.quantity), 0) : 0);

    // Đảm bảo có mã đơn hàng
    const orderCode = order.orderId || generateOrderCode();

    // Đảm bảo phương thức thanh toán luôn là chuyển khoản
    order.paymentMethod = "transfer";

    // Đảm bảo truyền đúng số bàn
    const tableNumber = order.tableNumber || document.getElementById("tableNumber")?.value || localStorage.getItem("selectedTable") || "";
    order.tableNumber = tableNumber;

    console.log("Hiển thị QR chuyển khoản cho đơn hàng:", {
        orderId: orderCode,
        amount: amount,
        paymentMethod: order.paymentMethod,
        tableNumber: tableNumber
    });

    // Thông tin tài khoản
    const accountNumber = "1028272356";
    const bankCode = "VCB"; // Vietcombank
    const accountName = "PHAM XUAN THANG";

    // Nội dung chuyển khoản: Mã hóa đơn
    const transferContent = orderCode;

    // Tạo URL VietQR
    const vietQrUrl = `https://img.vietqr.io/image/${bankCode}-${accountNumber}-compact.png?amount=${amount}&addInfo=${transferContent}&accountName=${encodeURIComponent(accountName)}`;

    // Hiển thị QR code với giao diện đẹp hơn
    const qrContainer = document.getElementById('qrCodeContainer');
    qrContainer.style.display = 'block';
    qrContainer.innerHTML = `
        <div class="qr-section">
            <h3>Quét mã QR để thanh toán</h3>
            <div class="qr-wrapper">
                <div class="qr-info">
                    <div class="account-info">
                        <div class="account-details">
                            <p><i class="fas fa-university"></i> <strong>Ngân hàng:</strong> Vietcombank</p>
                            <p><i class="fas fa-user"></i> <strong>Chủ tài khoản:</strong> ${accountName}</p>
                            <p><i class="fas fa-credit-card"></i> <strong>Số tài khoản:</strong> ${accountNumber}</p>
                            <p><i class="fas fa-money-bill-wave"></i> <strong>Số tiền:</strong> ${amount.toLocaleString('vi-VN')}đ</p>
                            <p><i class="fas fa-file-alt"></i> <strong>Nội dung:</strong> ${transferContent}</p>
                        </div>
                    </div>
                </div>
                <div class="qr-image">
                    <img src="${vietQrUrl}" alt="VietQR Code">
                    <p class="scan-instruction">Sử dụng Mobile Banking hoặc ứng dụng ngân hàng để quét mã</p>
                </div>
            </div>
            <p class="qr-note">Sau khi thanh toán thành công, vui lòng nhấn nút "Đã thanh toán xong" bên dưới</p>
            <button id="paymentDoneBtn" class="btn-payment-done">Đã thanh toán xong</button>
        </div>
    `;

    // Thêm event listener cho nút "Đã thanh toán"
    document.getElementById('paymentDoneBtn').addEventListener('click', function() {
        // Kiểm tra xem đang xử lý đơn hàng hiện tại hay đơn hàng mới
        if (localStorage.getItem("currentOrder")) {
            // Xử lý đơn hàng hiện tại
            alert("Cảm ơn quý khách! Đơn hàng của bạn sẽ được xử lý và phục vụ ngay.");
            localStorage.removeItem("currentOrder");
            localStorage.setItem("paymentCompleted", "true");
            localStorage.setItem("paymentMethod", "transfer");
            setTimeout(() => {
                window.location.href = "status.html";
            }, 1000);
        } else {
            // Xử lý đơn hàng mới như bình thường
            completeTransferPayment(order);
        }
    });

    // Cuộn trang đến phần đầu của container QR, nhưng không quá sâu
    setTimeout(() => {
        const qrSection = document.querySelector('.qr-section');
        const headerOffset = 100;
        if (qrSection) {
            const qrPosition = qrSection.getBoundingClientRect().top;
            const offsetPosition = qrPosition + window.pageYOffset - headerOffset;
            window.scrollTo({
                top: offsetPosition,
                behavior: 'smooth'
            });
        }
    }, 100);
}

// Fallback lưu đơn hàng vào localStorage khi API không hoạt động
function fallbackToLocalStorage(order) {
    console.warn("Sử dụng lưu trữ cục bộ cho đơn hàng");
    
    // Chuyển đổi lại định dạng để lưu vào localStorage
    const localOrder = {
        id: order.orderId,
        tableNumber: order.tableNumber,
        items: order.cart || order.items, // Hỗ trợ cả hai trường hợp
        totalAmount: order.totalAmount,
        status: "processing", // Các trạng thái có thể là: processing, ready, completed
        orderTime: order.orderTime || new Date().toISOString(),
        paymentMethod: order.paymentMethod,
        notes: order.notes
    };
    
    // Lưu vào danh sách đơn hàng
    const orders = JSON.parse(localStorage.getItem("orders")) || [];
    orders.push(localOrder);
    localStorage.setItem("orders", JSON.stringify(orders));
}

// Hiển thị thông tin đơn hàng hiện tại
function displayCurrentOrder(order) {
    // Cập nhật UI để hiển thị đơn hàng đã đặt
    document.querySelector('.checkout-page h1').textContent = 'Xác Nhận Thanh Toán';
    
    // Ẩn form thông tin đơn hàng và hiển thị chỉ thông tin đã đặt
    const orderInfoDiv = document.querySelector('.order-info');
    orderInfoDiv.innerHTML = `
        <h3>Thông Tin Đơn Hàng #${order.orderId || ''}</h3>
        <div class="order-details">
            <p><strong>Bàn:</strong> ${order.tableNumber === 'takeaway' ? 'Mang đi' : `Bàn ${order.tableNumber}`}</p>
            <p><strong>Thời gian đặt:</strong> ${new Date(order.orderTime).toLocaleString('vi-VN')}</p>
        </div>
    `;
    
    // Hiển thị tóm tắt đơn hàng
    const summaryDiv = document.getElementById("orderSummary");
    summaryDiv.innerHTML = "";
    
    order.items.forEach((item) => {
        const itemDiv = document.createElement("div");
        itemDiv.classList.add("summary-item");
        itemDiv.innerHTML = `
            <p><strong>${item.name}</strong> x ${item.quantity}</p>
            <p>${(item.price * item.quantity).toLocaleString('vi-VN')}đ</p>
        `;
        summaryDiv.appendChild(itemDiv);
    });
    
    const totalDiv = document.createElement("div");
    totalDiv.classList.add("summary-total");
    totalDiv.innerHTML = `<h4>Tổng cộng: ${parseFloat(order.totalAmount).toLocaleString('vi-VN')}đ</h4>`;
    summaryDiv.appendChild(totalDiv);
    
    // Thay thế nút Đặt Hàng bằng hệ thống thanh toán đơn giản hơn
    const paymentMethodsDiv = document.querySelector('.payment-methods');
    paymentMethodsDiv.innerHTML = `
        <h3>Phương Thức Thanh Toán</h3>
        <div class="payment-options">
            <label>
                <input type="radio" name="payment" value="cash" checked id="cashPayment">
                <span>Tiền Mặt</span>
            </label>
            <label>
                <input type="radio" name="payment" value="transfer" id="transferPayment">
                <span>Chuyển Khoản</span>
            </label>
        </div>
        <button class="btn-place-order" id="placeOrderBtn">Xác Nhận Đặt Hàng</button>
        <div id="qrCodeContainer" style="display: none;"></div>
    `;
    
    // Thiết lập sự kiện cho radio thanh toán - tự động hiện QR khi chọn chuyển khoản
    setupPaymentMethodChange();
    
    // Thiết lập sự kiện cho nút xác nhận đặt hàng
    document.getElementById('placeOrderBtn').addEventListener('click', function() {
        const paymentMethod = document.querySelector("input[name='payment']:checked").value;
        
        if (paymentMethod === "cash") {
            // Xử lý thanh toán tiền mặt
            alert("Cảm ơn quý khách! Đơn hàng của bạn sẽ được xử lý và phục vụ ngay.");
            
            // Lưu thông tin thanh toán và chuyển đến trang status
            localStorage.removeItem("currentOrder");
            localStorage.setItem("paymentCompleted", "true");
            localStorage.setItem("paymentMethod", "cash");
            
            setTimeout(() => {
                window.location.href = "status.html";
            }, 1000);
        }
        // Với chuyển khoản, người dùng sẽ nhấn "Đã thanh toán xong" trong phần QR
    });
} 
  