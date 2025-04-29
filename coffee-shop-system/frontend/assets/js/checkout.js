// checkout.js

document.addEventListener("DOMContentLoaded", function () {
    loadTables();
    loadOrderSummary();
    setupPaymentMethodChange();
    setupPlaceOrder();
});

// Load table numbers dynamically
function loadTables() {
    const tableSelect = document.getElementById("tableNumber");
    
    // Nếu đã có bàn được chọn trong localStorage, sử dụng nó
    const savedTable = localStorage.getItem("selectedTable");
    
    // Xóa các options hiện tại
    tableSelect.innerHTML = '<option value="">Chọn bàn</option>';
    
    // Thêm các options mới
    for (let i = 1; i <= 10; i++) {
        const option = document.createElement("option");
        option.value = i;
        option.textContent = `Bàn ${i}`;
        tableSelect.appendChild(option);
    }
    
    // Thêm option mang đi
    const takeawayOption = document.createElement("option");
    takeawayOption.value = "takeaway";
    takeawayOption.textContent = "Mang đi";
    tableSelect.appendChild(takeawayOption);
    
    // Chọn bàn đã lưu trong localStorage nếu có
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
    paymentOptions.forEach(option => {
        option.addEventListener('change', function() {
            // Ẩn container QR code khi thay đổi phương thức thanh toán
            document.getElementById('qrCodeContainer').style.display = 'none';
        });
    });
}

// Setup Place Order button
function setupPlaceOrder() {
    const btn = document.getElementById("placeOrderBtn");
    btn.addEventListener("click", function () {
        const tableNumber = document.getElementById("tableNumber").value;
        const notes = document.getElementById("notes").value;
        const paymentMethod = document.querySelector("input[name='payment']:checked").value;

        if (!tableNumber) {
            alert("Vui lòng chọn bàn trước khi đặt hàng.");
            return;
        }

        const order = {
            tableNumber,
            notes,
            cart: JSON.parse(localStorage.getItem("cart")) || [],
            paymentMethod,
            totalAmount: calculateTotal(),
            orderTime: new Date().toISOString()
        };

        if (paymentMethod === "transfer") {
            showVietQR(order);
        } else if (paymentMethod === "cash") {
            alert("Cảm ơn quý khách! Đơn hàng của bạn đang được xử lý.");
            createOrder(order);
            // Redirect to status page after 2 seconds
            setTimeout(() => {
                window.location.href = "status.html";
            }, 2000);
        }
    });
}

function calculateTotal() {
    const cart = JSON.parse(localStorage.getItem("cart")) || [];
    return cart.reduce((acc, item) => acc + item.price * item.quantity, 0);
}

function generateOrderCode() {
    // Tạo mã hóa đơn bắt đầu bằng HD và theo sau là số ngẫu nhiên 6 chữ số
    const randomDigits = Math.floor(100000 + Math.random() * 900000);
    return `HD${randomDigits}`;
}

function showVietQR(order) {
    const amount = order.totalAmount;
    const orderCode = generateOrderCode();
    
    // Thông tin tài khoản
    const accountNumber = "1028272356";
    const bankCode = "VCB"; // Vietcombank
    const accountName = "PHAM XUAN THANG";
    
    // Nội dung chuyển khoản: Mã hóa đơn
    const transferContent = orderCode;
    
    // Tạo URL VietQR
    const vietQrUrl = `https://img.vietqr.io/image/${bankCode}-${accountNumber}-compact.png?amount=${amount}&addInfo=${transferContent}&accountName=${encodeURIComponent(accountName)}`;
    
    // Hiển thị QR code
    const qrContainer = document.getElementById('qrCodeContainer');
    qrContainer.style.display = 'block';
    qrContainer.innerHTML = `
        <div class="qr-section">
            <h3>Quét mã QR để thanh toán</h3>
            <div class="qr-info">
                <p><strong>Số tài khoản:</strong> ${accountNumber}</p>
                <p><strong>Ngân hàng:</strong> Vietcombank</p>
                <p><strong>Tên người nhận:</strong> ${accountName}</p>
                <p><strong>Số tiền:</strong> ${amount.toLocaleString('vi-VN')}đ</p>
                <p><strong>Nội dung:</strong> ${transferContent}</p>
            </div>
            <div class="qr-image">
                <img src="${vietQrUrl}" alt="VietQR Code">
            </div>
            <p class="qr-note">Sau khi thanh toán thành công, đơn hàng của bạn sẽ được xử lý</p>
            <button id="paymentDoneBtn" class="btn-payment-done">Đã thanh toán</button>
        </div>
    `;
    
    // Thêm event listener cho nút "Đã thanh toán"
    document.getElementById('paymentDoneBtn').addEventListener('click', function() {
        order.orderCode = orderCode;
        createOrder(order);
        alert("Cảm ơn bạn đã thanh toán! Đơn hàng của bạn đang được xử lý.");
        // Chuyển đến trang theo dõi đơn hàng
        window.location.href = "status.html";
    });
    
    // Cuộn trang đến phần QR code
    qrContainer.scrollIntoView({ behavior: 'smooth' });
}

function createOrder(order) {
    console.log("Order created:", order);
    
    // Lưu thông tin đơn hàng vào localStorage để hiển thị ở trang status
    const orders = JSON.parse(localStorage.getItem("orders")) || [];
    
    // Thêm đơn hàng mới vào danh sách
    orders.push({
        id: order.orderCode || `ORDER-${Date.now()}`,
        tableNumber: order.tableNumber,
        items: order.cart,
        totalAmount: order.totalAmount,
        status: "processing", // Các trạng thái có thể là: processing, ready, completed
        orderTime: new Date().toISOString(),
        paymentMethod: order.paymentMethod
    });
    
    // Lưu lại danh sách đơn hàng
    localStorage.setItem("orders", JSON.stringify(orders));
    
    // Xóa giỏ hàng sau khi đặt hàng thành công
    localStorage.removeItem("cart");
    
    // TODO: Gửi order đến backend bằng fetch()
} 
  