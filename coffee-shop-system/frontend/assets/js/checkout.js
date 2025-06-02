const API_BASE_URL = 'http://localhost:8081/api/orders';

document.addEventListener("DOMContentLoaded", function () {
    // Xóa currentOrder để luôn bắt đầu đơn mới
    localStorage.removeItem('currentOrder');
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
    
    // Tính điểm thưởng dự kiến
    updateEstimatedRewardPoints();
});

// Load table numbers dynamically
function loadTables() {
    const tableSelect = document.getElementById("tableNumber");
    
    // Nếu đã có bàn được chọn trong localStorage, sử dụng nó
    const savedTable = localStorage.getItem("selectedTable");    // Xóa các options hiện tại
    tableSelect.innerHTML = '<option value="">Tại chỗ (không chọn bàn cụ thể)</option>';
    
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
                // Hiển thị thông báo nếu không có bàn nào từ API
                tableSelect.innerHTML = '<option value="">Không có bàn nào khả dụng</option>';
                
                // Hiển thị thông báo lỗi
                const alertDiv = document.createElement('div');
                alertDiv.className = 'alert alert-warning';
                alertDiv.textContent = 'Không thể tải danh sách bàn từ server. Vui lòng thử lại sau.';
                document.querySelector('.checkout-container').prepend(alertDiv);
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
            
            // Hiển thị thông báo lỗi
            tableSelect.innerHTML = '<option value="">Không thể tải danh sách bàn</option>';
            const takeawayOption = document.createElement("option");
            takeawayOption.value = "takeaway";
            takeawayOption.textContent = "Mang đi";
            tableSelect.appendChild(takeawayOption);
            
            // Hiển thị thông báo lỗi
            const alertDiv = document.createElement('div');
            alertDiv.className = 'alert alert-danger';
            alertDiv.textContent = 'Không thể kết nối đến server để tải danh sách bàn. Vui lòng thử lại sau hoặc chọn mang đi.';
            document.querySelector('.checkout-container').prepend(alertDiv);
        });
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

    // Create table structure for order summary
    let tableHtml = `
        <table class="order-summary-table">
            <thead>
                <tr>
                    <th style="text-align: left; width: 50%;">Sản phẩm</th>
                    <th style="text-align: center; width: 20%;">Số lượng</th>
                    <th style="text-align: right; width: 30%;">Thành tiền</th>
                </tr>
            </thead>
            <tbody>
    `;

    cart.forEach((item) => {
        const itemSubtotal = item.price * item.quantity;
        total += itemSubtotal;

        // Only prepare variant HTML if variants exist
        let variantHtml = '';
        if (item.variants) {
            const v = item.variants;
            
            // Kiểm tra chặt chẽ hơn để chỉ hiển thị các variant có ý nghĩa
            const hasIce = v.ice && v.ice !== '' && v.ice !== '100' && v.ice !== 100;
            const hasSugar = v.sugar && v.sugar !== '' && v.sugar !== '100' && v.sugar !== 100;
            const hasToppings = v.toppings && Array.isArray(v.toppings) && v.toppings.length > 0;
            
            // Kiểm tra đá/đường để dùng trong điều kiện hiển thị size
            const hasIceOrSugar = hasIce || hasSugar;
            
            // Size chỉ hiển thị nếu có giá trị hợp lý và không phải là mặc định 'S' 
            // hoặc nếu là S nhưng đi kèm với các tùy chọn khác
            const showSize = v.size && v.size !== '' && v.size !== '100' && v.size !== 100 && 
                            (v.size.toLowerCase() !== 's' || (v.size.toLowerCase() === 's' && (hasIceOrSugar || hasToppings)));
            
            // Chỉ hiển thị variant khi có ít nhất một tùy chọn đáng kể
            const hasVariants = showSize || hasIce || hasSugar || hasToppings;
            
            if (hasVariants) {
                const variantParts = [];
                if (showSize) variantParts.push(`<span style='color:#7b4f28;'>Size:</span> <b>${v.size}</b>`);
                if (hasIce) variantParts.push(`<span style='color:#7b4f28;'>Đá:</span> <b>${v.ice}</b>`);
                if (hasSugar) variantParts.push(`<span style='color:#7b4f28;'>Đường:</span> <b>${v.sugar}</b>`);
                if (hasToppings) {
                    variantParts.push(`<span style='color:#7b4f28;'>Topping:</span> <b>${v.toppings.map(t=>t.name).join(', ')}</b>`);
                }
                
                if (variantParts.length > 0) {
                    variantHtml = `<div style="font-size:13px; color:#666; margin-top:5px;">${variantParts.join(' | ')}</div>`;
                }
            }
        }

        tableHtml += `
            <tr>
                <td style="text-align: left; padding: 10px 5px;">
                    <div><strong>${item.name}</strong></div>
                    ${variantHtml}
                </td>
                <td style="text-align: center; padding: 10px 5px;">${item.quantity}</td>
                <td style="text-align: right; padding: 10px 5px; font-weight: 500;">${itemSubtotal.toLocaleString('vi-VN')}đ</td>
            </tr>
        `;
    });

    tableHtml += `
            </tbody>
        </table>
    `;

    // Add the table to the summary div
    summaryDiv.innerHTML = tableHtml;

    // Add total amount
    const totalDiv = document.createElement("div");
    totalDiv.classList.add("summary-total");
    totalDiv.style.marginTop = "15px";
    totalDiv.style.textAlign = "right";
    totalDiv.style.borderTop = "1px solid #ddd";
    totalDiv.style.paddingTop = "10px";
    totalDiv.innerHTML = `<h4>Tổng cộng: ${total.toLocaleString('vi-VN')}đ</h4>`;
    summaryDiv.appendChild(totalDiv);

    // Add CSS for the table
    const style = document.createElement('style');
    style.textContent = `
        .order-summary-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 10px;
        }
        .order-summary-table th, .order-summary-table td {
            border-bottom: 1px solid #eee;
        }
        .order-summary-table th {
            padding: 10px 5px;
            background-color: #f5f5f5;
            font-weight: 600;
        }
    `;
    document.head.appendChild(style);
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

// Tính và hiển thị điểm thưởng dự kiến
function updateEstimatedRewardPoints() {
    const cart = JSON.parse(localStorage.getItem("cart")) || [];
    const appliedPromotion = JSON.parse(localStorage.getItem('appliedPromotion') || 'null');
    
    // Tính tổng tiền sau khuyến mãi
    let totalAmount = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    if (appliedPromotion && appliedPromotion.finalTotal) {
        totalAmount = appliedPromotion.finalTotal;
    }
    
    // Tính điểm thưởng (1 điểm cho mỗi 10,000 VND)
    const points = Math.floor(totalAmount / 10000);
    
    // Cập nhật hiển thị
    const estimatedPointsElement = document.getElementById('estimatedPoints');
    if (estimatedPointsElement) {
        estimatedPointsElement.textContent = points;
    }
    
    // Hiển thị hoặc ẩn thông báo tích điểm dựa trên đăng nhập
    const rewardPointsContainer = document.querySelector('.reward-points-container');
    if (rewardPointsContainer) {
        // Kiểm tra xem AuthManager đã được khởi tạo chưa
        if (window.AuthManager && typeof window.AuthManager.isLoggedIn === 'function') {
            if (window.AuthManager.isLoggedIn()) {
                rewardPointsContainer.style.display = 'flex';
                console.log("Đã đăng nhập, hiển thị thông báo tích điểm");
            } else {
                rewardPointsContainer.style.display = 'none';
                console.log("Chưa đăng nhập, ẩn thông báo tích điểm");
            }
        } else {
            // Nếu AuthManager chưa sẵn sàng, thử lại sau 1 giây
            console.log("AuthManager chưa sẵn sàng, thử lại sau");
            setTimeout(updateEstimatedRewardPoints, 1000);
        }
    }
    
    return points;
}

// Chuẩn bị dữ liệu đơn hàng
function prepareOrderData() {
    // Lấy thông tin khuyến mãi đã áp dụng (nếu có)
    const appliedPromotion = JSON.parse(localStorage.getItem('appliedPromotion') || 'null');
    const cart = JSON.parse(localStorage.getItem("cart")) || [];
    
    // Tính tổng tiền gốc (chưa giảm giá)
    const originalTotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    
    // Tính tổng tiền sau giảm giá khuyến mãi
    let totalAmount = appliedPromotion && appliedPromotion.finalTotal ? appliedPromotion.finalTotal : originalTotal;
    
    // Lấy thông tin điểm thưởng đã đổi (nếu có)
    const redeemedPoints = JSON.parse(localStorage.getItem('redeemedPoints') || 'null');
    
    // Tính tổng tiền sau khi áp dụng cả khuyến mãi và điểm thưởng
    let finalTotal = totalAmount;
    if (redeemedPoints && redeemedPoints.discount > 0) {
        finalTotal = Math.max(0, totalAmount - redeemedPoints.discount);
    }
    
    return {
        tableNumber: document.getElementById("tableNumber").value || "tại chỗ",
        notes: document.getElementById("notes").value,
        cart: cart,
        orderTime: new Date().toISOString(),
        originalTotal: originalTotal,
        totalAmount: totalAmount,
        paymentMethod: document.querySelector('input[name="payment"]:checked').value,
        promoCode: appliedPromotion ? appliedPromotion.code : null,
        discountAmount: appliedPromotion ? appliedPromotion.discountAmount : 0,
        redeemedPoints: redeemedPoints ? redeemedPoints.points : 0,
        redeemedDiscount: redeemedPoints ? redeemedPoints.discount : 0,
        finalTotal: finalTotal
    };
}

// Hàm để trừ điểm thưởng đã sử dụng
async function subtractRewardPoints(userId, points) {
    try {
        if (!userId || points <= 0) {
            console.error('Không thể trừ điểm thưởng: Thiếu userId hoặc số điểm không hợp lệ');
            return false;
        }
        
        // Lấy số điểm hiện tại của người dùng
        const response = await fetch(`${API_BASE_URL.replace('/orders', '')}/accounts/${userId}/reward-points`);
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }
        
        const data = await response.json();
        const currentPoints = data.rewardPoints || 0;
        
        // Tính số điểm còn lại
        const remainingPoints = Math.max(0, currentPoints - points);
        
        // Cập nhật số điểm mới
        const updateResponse = await fetch(`${API_BASE_URL.replace('/orders', '')}/accounts/${userId}/reward-points`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                points: remainingPoints
            })
        });
        
        if (!updateResponse.ok) {
            throw new Error(`HTTP error! Status: ${updateResponse.status}`);
        }
        
        console.log(`Đã trừ ${points} điểm thưởng. Còn lại: ${remainingPoints} điểm`);
        return true;
    } catch (error) {
        console.error('Lỗi khi trừ điểm thưởng:', error);
        return false;
    }
}


async function completeTransferPayment(order) {
    alert("Cảm ơn bạn đã thanh toán! Đơn hàng của bạn đang được xử lý.");
    try {
        // Đánh dấu đã thanh toán
        localStorage.setItem("paymentCompleted", "true");
        localStorage.setItem("paymentMethod", "transfer");
        order.paymentMethod = "transfer";
        
        // Lấy lại số bàn nếu chưa có
        if (!order.tableNumber) {
            order.tableNumber = document.getElementById("tableNumber")?.value || localStorage.getItem("selectedTable") || "";
        }
        
        // Lấy lại khuyến mãi nếu có
        const appliedPromotion = JSON.parse(localStorage.getItem('appliedPromotion') || 'null');
        
        // Lấy thông tin điểm thưởng đã đổi (nếu có)
        const redeemedPoints = JSON.parse(localStorage.getItem('redeemedPoints') || 'null');
        
        // Sử dụng finalTotal từ order nếu có, nếu không thì sử dụng totalAmount từ appliedPromotion hoặc order
        const finalAmount = order.finalTotal || 
                          (redeemedPoints && redeemedPoints.discount > 0 
                            ? (appliedPromotion && appliedPromotion.finalTotal 
                               ? Math.max(0, appliedPromotion.finalTotal - redeemedPoints.discount)
                               : Math.max(0, order.totalAmount - redeemedPoints.discount))
                            : (appliedPromotion && appliedPromotion.finalTotal 
                               ? appliedPromotion.finalTotal 
                               : order.totalAmount));
        
        let orderId;
        try {
            // Chuẩn bị dữ liệu đơn hàng cho server
            const serverOrder = {
                totalAmount: finalAmount,
                note: order.notes,
                status: "processing",
                orderTime: order.orderTime || new Date().toISOString(),
                payment: {
                    paymentMethod: "transfer",
                    paymentStatus: "completed", // Đã thanh toán
                    createAt: new Date().toISOString(),
                    amount: finalAmount
                }
            };
            
            // Biến để lưu ID tài khoản nếu người dùng đã đăng nhập
            let userId = null;
            
            // Thêm ID tài khoản nếu người dùng đã đăng nhập
            if (window.AuthManager && window.AuthManager.isLoggedIn && window.AuthManager.isLoggedIn()) {
                userId = window.AuthManager.getCurrentUser().userId;
                if (userId) {
                    serverOrder.accountId = userId;
                    console.log("DEBUG - Đơn hàng chuyển khoản được liên kết với tài khoản ID:", userId);
                    
                    // Thêm thông tin điểm thưởng đã đổi (nếu có)
                    if (redeemedPoints && redeemedPoints.points > 0) {
                        serverOrder.redeemedPoints = redeemedPoints.points;
                        serverOrder.redeemedDiscount = redeemedPoints.discount;
                    }
                }
            }
            
            // Thêm thông tin bàn
            if (order.tableNumber && order.tableNumber !== 'takeaway' && order.tableNumber !== 'tại chỗ') {
                serverOrder.table = {
                    idTable: parseInt(order.tableNumber)
                };
            } else if (order.tableNumber === 'takeaway') {
                serverOrder.table = {
                    idTable: "takeaway",
                    tableNumber: "takeaway"
                };
            } else {
                // Trường hợp "tại chỗ" hoặc không chọn bàn cụ thể
                serverOrder.table = {
                    idTable: "tại chỗ",
                    tableNumber: "tại chỗ"
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
            
            // Gọi API tạo đơn hàng
            const response = await fetch(API_BASE_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify(serverOrder)
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
            
            const createdOrder = await response.json();
            orderId = createdOrder.idOrder || createdOrder.id;
            console.log("DEBUG - Đơn hàng chuyển khoản được tạo với ID:", orderId);
            
            // Trừ điểm thưởng nếu đã sử dụng
            if (userId && redeemedPoints && redeemedPoints.points > 0) {
                await subtractRewardPoints(userId, redeemedPoints.points);
            }
        } catch (error) {
            console.error("Lỗi khi gọi API tạo đơn hàng chuyển khoản:", error);
            alert("Không thể kết nối đến máy chủ. Vui lòng thử lại sau.");
            return;
        }
        
        // Lưu thông tin đơn hàng
        order.idOrder = orderId;
        localStorage.setItem("currentOrder", JSON.stringify(order));
        localStorage.setItem("lastOrderId", orderId);
        
        // Xóa giỏ hàng
        localStorage.removeItem("cart");
        
        // Xóa thông tin khuyến mãi
        localStorage.removeItem("appliedPromotion");
        
        // Xóa thông tin điểm thưởng đã đổi
        localStorage.removeItem("redeemedPoints");
        
        // Xóa bàn đã chọn
        localStorage.removeItem("selectedTable");
        
        // Chuyển đến trang thành công
        window.location.href = "order-success.html";
    } catch (error) {
        console.error("Lỗi khi xử lý thanh toán:", error);
        alert("Đã xảy ra lỗi khi xử lý thanh toán. Vui lòng thử lại sau.");
    }
}


function setupPlaceOrder() {
    const placeOrderBtn = document.getElementById("placeOrderBtn");
    if (!placeOrderBtn) return;

    placeOrderBtn.addEventListener("click", async function() {
        // Lấy giỏ hàng
        const cart = JSON.parse(localStorage.getItem("cart")) || [];
        
        // Kiểm tra giỏ hàng có sản phẩm không
        if (cart.length === 0) {
            alert("Giỏ hàng của bạn đang trống. Vui lòng thêm sản phẩm trước khi đặt hàng.");
            return;
        }
        
        // Lấy thông tin bàn - không bắt buộc
        const tableNumber = document.getElementById("tableNumber").value;
        
        // Lưu bàn đã chọn vào localStorage để tiện sử dụng sau này (nếu có)
        if (tableNumber) {
            localStorage.setItem("selectedTable", tableNumber);
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
                
                // Lưu thông tin thanh toán
                localStorage.setItem("paymentMethod", "cash");
                localStorage.setItem("paymentCompleted", "false");
                
                // Lấy thông tin điểm thưởng đã đổi (nếu có)
                const redeemedPoints = JSON.parse(localStorage.getItem('redeemedPoints') || 'null');
                
                let orderId;
                try {
                    // Chuẩn bị dữ liệu đơn hàng cho server
                    const serverOrder = {
                        totalAmount: order.finalTotal,
                        note: order.notes,
                        status: "processing",
                        orderTime: order.orderTime,
                        payment: {
                            paymentMethod: "cash",
                            paymentStatus: "pending",
                            createAt: new Date().toISOString(),
                            amount: order.finalTotal
                        }
                    };
                    
                    // Biến để lưu ID tài khoản nếu người dùng đã đăng nhập
                    let userId = null;
                    
                    // Thêm ID tài khoản nếu người dùng đã đăng nhập
                    if (window.AuthManager && window.AuthManager.isLoggedIn && window.AuthManager.isLoggedIn()) {
                        userId = window.AuthManager.getCurrentUser().userId;
                        if (userId) {
                            serverOrder.accountId = userId;
                            console.log("DEBUG - Đơn hàng được liên kết với tài khoản ID:", userId);
                            
                            // Thêm thông tin điểm thưởng đã đổi (nếu có)
                            if (redeemedPoints && redeemedPoints.points > 0) {
                                serverOrder.redeemedPoints = redeemedPoints.points;
                                serverOrder.redeemedDiscount = redeemedPoints.discount;
                            }
                        }
                    }
                    
                    // Thêm thông tin bàn
                    if (order.tableNumber && order.tableNumber !== 'takeaway' && order.tableNumber !== 'tại chỗ') {
                        serverOrder.table = {
                            idTable: parseInt(order.tableNumber)
                        };
                    } else if (order.tableNumber === 'takeaway') {
                        serverOrder.table = {
                            idTable: "takeaway",
                            tableNumber: "takeaway"
                        };
                    } else {
                        // Trường hợp "tại chỗ" hoặc không chọn bàn cụ thể
                        serverOrder.table = {
                            idTable: "tại chỗ",
                            tableNumber: "tại chỗ"
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
                    const response = await fetch(API_BASE_URL, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Accept': 'application/json'
                        },
                        body: JSON.stringify(serverOrder)
                    });
                    
                    if (!response.ok) {
                        throw new Error(`HTTP error! Status: ${response.status}`);
                    }
                    
                    const createdOrder = await response.json();
                    orderId = createdOrder.idOrder || createdOrder.id;
                    console.log("DEBUG - Đơn hàng được tạo thành công với ID:", orderId);
                    
                    // Trừ điểm thưởng nếu đã sử dụng
                    if (userId && redeemedPoints && redeemedPoints.points > 0) {
                        await subtractRewardPoints(userId, redeemedPoints.points);
                    }
                } catch (error) {
                    console.error("Lỗi khi gọi API tạo đơn hàng:", error);
                    alert("Không thể kết nối đến máy chủ. Vui lòng thử lại sau.");
                    return;
                }
                
                console.log("Đơn hàng đã được tạo với ID:", orderId);
                localStorage.setItem("lastOrderId", orderId);
                
                // Xóa giỏ hàng
                localStorage.removeItem("cart");
                
                // Xóa thông tin khuyến mãi
                localStorage.removeItem("appliedPromotion");
                
                // Xóa thông tin điểm thưởng đã đổi
                localStorage.removeItem("redeemedPoints");
                
                // Xóa bàn đã chọn
                localStorage.removeItem("selectedTable");
                
                // Lưu thông tin đơn hàng vào localStorage
                order.idOrder = orderId;
                localStorage.setItem("currentOrder", JSON.stringify(order));
                
                // Chuyển hướng đến trang xem tình trạng đơn hàng
                window.location.href = "order-success.html";
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
    
    // Cập nhật điểm thưởng dự kiến
    updateEstimatedRewardPoints();
    
    return total;
}

function generateOrderCode() {
    // Tạo mã hóa đơn bắt đầu bằng HD và theo sau là số ngẫu nhiên 6 chữ số
    const randomDigits = Math.floor(100000 + Math.random() * 900000);
    return `HD${randomDigits}`;
}

// Hiển thị mã QR chuyển khoản
function showVietQR(order) {
    // Lấy thông tin khuyến mãi và điểm thưởng đã đổi
    const appliedPromotion = JSON.parse(localStorage.getItem('appliedPromotion') || 'null');
    const redeemedPoints = JSON.parse(localStorage.getItem('redeemedPoints') || 'null');
    
    // Tính toán số tiền cuối cùng, đảm bảo áp dụng cả khuyến mãi và điểm thưởng
    let amount;
    
    // Nếu order đã có finalTotal (đã tính cả khuyến mãi và điểm thưởng)
    if (order.finalTotal) {
        amount = order.finalTotal;
    } 
    // Nếu có cả khuyến mãi và điểm thưởng
    else if (appliedPromotion && appliedPromotion.finalTotal && redeemedPoints && redeemedPoints.discount) {
        amount = Math.max(0, appliedPromotion.finalTotal - redeemedPoints.discount);
    } 
    // Nếu chỉ có khuyến mãi
    else if (appliedPromotion && appliedPromotion.finalTotal) {
        amount = appliedPromotion.finalTotal;
    } 
    // Nếu chỉ có điểm thưởng
    else if (redeemedPoints && redeemedPoints.discount && order.totalAmount) {
        amount = Math.max(0, order.totalAmount - redeemedPoints.discount);
    } 
    // Nếu không có cả hai, lấy tổng tiền gốc
    else {
        amount = order.totalAmount || 
                (order.items ? order.items.reduce((sum, item) => sum + (item.price * item.quantity), 0) : 0) ||
                (order.cart ? order.cart.reduce((sum, item) => sum + (item.price * item.quantity), 0) : 0);
    }

    console.log("DEBUG - Số tiền thanh toán QR:", {
        originalAmount: order.totalAmount,
        promotionDiscount: appliedPromotion ? appliedPromotion.discountAmount : 0,
        pointsDiscount: redeemedPoints ? redeemedPoints.discount : 0,
        finalAmount: amount
    });

    // Đảm bảo có mã đơn hàng
    const orderCode = order.orderId || generateOrderCode();

    // Đảm bảo phương thức thanh toán luôn là chuyển khoản
    order.paymentMethod = "transfer";

    // Đảm bảo truyền đúng số bàn
    const tableNumber = order.tableNumber || document.getElementById("tableNumber")?.value || localStorage.getItem("selectedTable") || "";
    order.tableNumber = tableNumber;

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
                window.location.href = "order-success.html";
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
    
    // Create table structure for order summary
    let tableHtml = `
        <table class="order-summary-table">
            <thead>
                <tr>
                    <th style="text-align: left; width: 50%;">Sản phẩm</th>
                    <th style="text-align: center; width: 20%;">Số lượng</th>
                    <th style="text-align: right; width: 30%;">Thành tiền</th>
                </tr>
            </thead>
            <tbody>
    `;

    order.items.forEach((item) => {
        const itemSubtotal = item.price * item.quantity;
        
        // Only prepare variant HTML if variants exist
        let variantHtml = '';
        if (item.variants) {
            const v = item.variants;
            
            // Kiểm tra chặt chẽ hơn để chỉ hiển thị các variant có ý nghĩa
            const hasIce = v.ice && v.ice !== '' && v.ice !== '100' && v.ice !== 100;
            const hasSugar = v.sugar && v.sugar !== '' && v.sugar !== '100' && v.sugar !== 100;
            const hasToppings = v.toppings && Array.isArray(v.toppings) && v.toppings.length > 0;
            
            // Kiểm tra đá/đường để dùng trong điều kiện hiển thị size
            const hasIceOrSugar = hasIce || hasSugar;
            
            // Size chỉ hiển thị nếu có giá trị hợp lý và không phải là mặc định 'S' 
            // hoặc nếu là S nhưng đi kèm với các tùy chọn khác
            const showSize = v.size && v.size !== '' && v.size !== '100' && v.size !== 100 && 
                            (v.size.toLowerCase() !== 's' || (v.size.toLowerCase() === 's' && (hasIceOrSugar || hasToppings)));
            
            // Chỉ hiển thị variant khi có ít nhất một tùy chọn đáng kể
            const hasVariants = showSize || hasIce || hasSugar || hasToppings;
            
            if (hasVariants) {
                const variantParts = [];
                if (showSize) variantParts.push(`<span style='color:#7b4f28;'>Size:</span> <b>${v.size}</b>`);
                if (hasIce) variantParts.push(`<span style='color:#7b4f28;'>Đá:</span> <b>${v.ice}</b>`);
                if (hasSugar) variantParts.push(`<span style='color:#7b4f28;'>Đường:</span> <b>${v.sugar}</b>`);
                if (hasToppings) {
                    variantParts.push(`<span style='color:#7b4f28;'>Topping:</span> <b>${v.toppings.map(t=>t.name).join(', ')}</b>`);
                }
                
                if (variantParts.length > 0) {
                    variantHtml = `<div style="font-size:13px; color:#666; margin-top:5px;">${variantParts.join(' | ')}</div>`;
                }
            }
        }
        
        tableHtml += `
            <tr>
                <td style="text-align: left; padding: 10px 5px;">
                    <div><strong>${item.name}</strong></div>
                    ${variantHtml}
                </td>
                <td style="text-align: center; padding: 10px 5px;">${item.quantity}</td>
                <td style="text-align: right; padding: 10px 5px; font-weight: 500;">${itemSubtotal.toLocaleString('vi-VN')}đ</td>
            </tr>
        `;
    });
    
    tableHtml += `
            </tbody>
        </table>
    `;
    
    // Add the table to the summary div
    summaryDiv.innerHTML = tableHtml;
    
    // Add total amount
    const totalDiv = document.createElement("div");
    totalDiv.classList.add("summary-total");
    totalDiv.style.marginTop = "15px";
    totalDiv.style.textAlign = "right";
    totalDiv.style.borderTop = "1px solid #ddd";
    totalDiv.style.paddingTop = "10px";
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
            
            // Lưu thông tin đơn hàng hiện tại vào localStorage
            localStorage.setItem("currentOrder", JSON.stringify(order));
            localStorage.setItem("paymentCompleted", "true");
            localStorage.setItem("paymentMethod", "cash");
            
            setTimeout(() => {
                window.location.href = "order-success.html";
            }, 1000);
        }
        
    });
}

function calculateDiscount(code, totalAmount) {
  fetch(`http://localhost:8081/api/promotions/calculate-discount?code=${code}&orderTotal=${totalAmount}`)
    .then(response => response.json())
    .then(data => {
      if (data.valid) {
        localStorage.setItem('appliedPromotion', JSON.stringify({
          code: code,
          discountAmount: data.discountAmount,
          finalTotal: data.finalTotal
        }));
        showPromoMessage(`Đã áp dụng mã "${code}" thành công!`, 'success');
        showDiscountInfo(data.discountAmount);
        // Cập nhật tổng tiền hiển thị
        if (totalElement) {
          totalElement.textContent = `Tổng cộng: ${data.finalTotal.toLocaleString('vi-VN')}đ`;
        }
        
        // Cập nhật điểm thưởng dự kiến sau khi áp dụng khuyến mãi
        updateEstimatedRewardPoints();
      } else {
        showPromoMessage('Mã khuyến mãi không áp dụng được cho đơn hàng này', 'error');
        hideDiscountInfo();
        localStorage.removeItem('appliedPromotion');
      }
    })
    .catch(error => {
      console.error('Error:', error);
      showPromoMessage('Có lỗi xảy ra khi tính giảm giá', 'error');
    });
} 
  