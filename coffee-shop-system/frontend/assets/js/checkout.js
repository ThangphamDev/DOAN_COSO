const API_BASE_URL = 'http://localhost:8081/api/orders';

document.addEventListener("DOMContentLoaded", function () {
    localStorage.removeItem('currentOrder');
    const currentOrder = JSON.parse(localStorage.getItem("currentOrder"));
    
    if (currentOrder) {
        displayCurrentOrder(currentOrder);
    } else {
        loadTables();
        loadOrderSummary();
        setupPaymentMethodChange();
        setupPlaceOrder();
    }
    
    updateEstimatedRewardPoints();
});

function loadTables() {
    const tableSelect = document.getElementById("tableNumber");
    
    const savedTable = localStorage.getItem("selectedTable");    // Xóa các options hiện tại
    tableSelect.innerHTML = '<option value="">Tại chỗ (không chọn bàn cụ thể)</option>';
    
    fetch(`${API_BASE_URL.replace('/orders', '')}/tables`)
        .then(response => {
            if (!response.ok) {
                throw new Error(`Lỗi khi lấy danh sách bàn: ${response.status}`);
            }
            return response.json();
        })
        .then(tables => {
            console.log("Dữ liệu bàn từ API:", tables);
            
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
                tableSelect.innerHTML = '<option value="">Không có bàn nào khả dụng</option>';
                
                const alertDiv = document.createElement('div');
                alertDiv.className = 'alert alert-warning';
                alertDiv.textContent = 'Không thể tải danh sách bàn từ server. Vui lòng thử lại sau.';
                document.querySelector('.checkout-container').prepend(alertDiv);
            }
            
            const takeawayOption = document.createElement("option");
            takeawayOption.value = "takeaway";
            takeawayOption.textContent = "Mang đi";
            tableSelect.appendChild(takeawayOption);
            
            if (savedTable) {
                const exists = Array.from(tableSelect.options).some(option => option.value === savedTable);
                if (exists) {
                    tableSelect.value = savedTable;
                }
            }
        })
        .catch(error => {
            console.error("Lỗi khi lấy dữ liệu bàn từ API:", error);
            
            tableSelect.innerHTML = '<option value="">Không thể tải danh sách bàn</option>';
            const takeawayOption = document.createElement("option");
            takeawayOption.value = "takeaway";
            takeawayOption.textContent = "Mang đi";
            tableSelect.appendChild(takeawayOption);
            
            const alertDiv = document.createElement('div');
            alertDiv.className = 'alert alert-danger';
            alertDiv.textContent = 'Không thể kết nối đến server để tải danh sách bàn. Vui lòng thử lại sau hoặc chọn mang đi.';
            document.querySelector('.checkout-container').prepend(alertDiv);
        });
}

function loadOrderSummary() {
    const cart = JSON.parse(localStorage.getItem("cart")) || [];
    const summaryDiv = document.getElementById("orderSummary");
    summaryDiv.innerHTML = "";
    let total = 0;

    if (cart.length === 0) {
        summaryDiv.innerHTML = '<p class="empty-cart-message">Giỏ hàng của bạn đang trống</p>';
        return;
    }

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

        let variantHtml = '';
        if (item.variants) {
            const v = item.variants;
            
            const hasIce = v.ice && v.ice !== '' && v.ice !== '100' && v.ice !== 100;
            const hasSugar = v.sugar && v.sugar !== '' && v.sugar !== '100' && v.sugar !== 100;
            const hasToppings = v.toppings && Array.isArray(v.toppings) && v.toppings.length > 0;
            
            const hasIceOrSugar = hasIce || hasSugar;
            
            const showSize = v.size && v.size !== '' && v.size !== '100' && v.size !== 100 && 
                            (v.size.toLowerCase() !== 's' || (v.size.toLowerCase() === 's' && (hasIceOrSugar || hasToppings)));
            
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

    summaryDiv.innerHTML = tableHtml;

    const totalDiv = document.createElement("div");
    totalDiv.classList.add("summary-total");
    totalDiv.style.marginTop = "15px";
    totalDiv.style.textAlign = "right";
    totalDiv.style.borderTop = "1px solid #ddd";
    totalDiv.style.paddingTop = "10px";
    totalDiv.innerHTML = `<h4>Tổng cộng: ${total.toLocaleString('vi-VN')}đ</h4>`;
    summaryDiv.appendChild(totalDiv);

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

function setupPaymentMethodChange() {
    const paymentOptions = document.querySelectorAll('input[name="payment"]');
    
    paymentOptions.forEach(option => {
        option.addEventListener('change', function() {
            const paymentMethod = this.value;
            
            if (paymentMethod === "transfer") {
                const currentOrder = localStorage.getItem("currentOrder");
                let order;
                
                if (currentOrder) {
                    order = JSON.parse(currentOrder);
                    if (order.items && !order.cart) {
                        order.cart = order.items;
                    }
                } else {
                    order = prepareOrderData();
                }
                
                if ((order.cart && order.cart.length > 0) || (order.items && order.items.length > 0)) {
                    showVietQR(order);
                    
                    const placeOrderBtn = document.getElementById('placeOrderBtn');
                    if (placeOrderBtn) placeOrderBtn.style.display = 'none';
                    
                    const confirmPaymentBtn = document.getElementById('confirmPaymentBtn');
                    if (confirmPaymentBtn) confirmPaymentBtn.style.display = 'none';
                } else {
                    alert('Giỏ hàng của bạn đang trống. Vui lòng thêm sản phẩm vào giỏ hàng trước.');
                    document.getElementById('cashPayment').checked = true;
                }
            } else {
                document.getElementById('qrCodeContainer').style.display = 'none';
                
                const placeOrderBtn = document.getElementById('placeOrderBtn');
                const confirmPaymentBtn = document.getElementById('confirmPaymentBtn');
                
                if (placeOrderBtn) placeOrderBtn.style.display = 'block';
                if (confirmPaymentBtn) confirmPaymentBtn.style.display = 'block';
                
                const doneButton = document.getElementById('paymentDoneBtn');
                if (doneButton) {
                    doneButton.remove();
                }
            }
        });
    });
}

function updateEstimatedRewardPoints() {
    const cart = JSON.parse(localStorage.getItem("cart")) || [];
    const appliedPromotion = JSON.parse(localStorage.getItem('appliedPromotion') || 'null');
    
    // Tính tổng tiền sau khuyến mãi
    let totalAmount = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    if (appliedPromotion && appliedPromotion.finalTotal) {
        totalAmount = appliedPromotion.finalTotal;
    }
    
    const points = Math.floor(totalAmount / 10000);
    
    const estimatedPointsElement = document.getElementById('estimatedPoints');
    if (estimatedPointsElement) {
        estimatedPointsElement.textContent = points;
    }
    
    const rewardPointsContainer = document.querySelector('.reward-points-container');
    if (rewardPointsContainer) {
        if (window.AuthManager && typeof window.AuthManager.isLoggedIn === 'function') {
            if (window.AuthManager.isLoggedIn()) {
                rewardPointsContainer.style.display = 'flex';
            } else {
                rewardPointsContainer.style.display = 'none';
            }
        } else {
            setTimeout(updateEstimatedRewardPoints, 1000);
        }
    }
    
    return points;
}

function prepareOrderData() {
    const appliedPromotion = JSON.parse(localStorage.getItem('appliedPromotion') || 'null');
    const cart = JSON.parse(localStorage.getItem("cart")) || [];
    
    const originalTotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    
    let totalAmount = appliedPromotion && appliedPromotion.finalTotal ? appliedPromotion.finalTotal : originalTotal;
    
    const redeemedPoints = JSON.parse(localStorage.getItem('redeemedPoints') || 'null');
    
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

async function subtractRewardPoints(userId, points) {
    try {
        if (!userId || points <= 0) {
            console.error('Không thể trừ điểm thưởng: Thiếu userId hoặc số điểm không hợp lệ');
            return false;
        }
        
        console.log(`Đang trừ ${points} điểm thưởng cho user ID: ${userId}`);
        
        const response = await fetch(`${API_BASE_URL.replace('/orders', '')}/accounts/${userId}/reward-points`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            }
        });
        
        if (!response.ok) {
            console.error(`Lỗi khi lấy điểm thưởng: ${response.status}`);
            throw new Error(`HTTP error! Status: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('Dữ liệu điểm thưởng hiện tại:', data);
        const currentPoints = data.rewardPoints || 0;
        
        const remainingPoints = Math.max(0, currentPoints - points);
        
        console.log(`Điểm thưởng hiện tại: ${currentPoints}, Điểm sẽ trừ: ${points}, Còn lại: ${remainingPoints}`);
        
        const updateResponse = await fetch(`${API_BASE_URL.replace('/orders', '')}/accounts/${userId}/reward-points`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify({
                points: remainingPoints
            })
        });
        
        if (!updateResponse.ok) {
            console.error(`Lỗi khi cập nhật điểm thưởng: ${updateResponse.status}`);
            throw new Error(`HTTP error! Status: ${updateResponse.status}`);
        }
        
        const updateData = await updateResponse.json();
        console.log('Kết quả cập nhật điểm thưởng:', updateData);
        console.log(`Đã trừ ${points} điểm thưởng. Còn lại: ${remainingPoints} điểm`);
        return true;
    } catch (error) {
        console.error('Lỗi khi trừ điểm thưởng:', error);
        alert(`Không thể cập nhật điểm thưởng. Lỗi: ${error.message}`);
        return false;
    }
}


async function completeTransferPayment(order) {
    alert("Cảm ơn bạn đã thanh toán! Đơn hàng của bạn đang được xử lý.");
    try {
        localStorage.setItem("paymentCompleted", "true");
        localStorage.setItem("paymentMethod", "transfer");
        order.paymentMethod = "transfer";
        
        if (!order.tableNumber) {
            order.tableNumber = document.getElementById("tableNumber")?.value || localStorage.getItem("selectedTable") || "";
        }
        
        const appliedPromotion = JSON.parse(localStorage.getItem('appliedPromotion') || 'null');
        
        const redeemedPoints = JSON.parse(localStorage.getItem('redeemedPoints') || 'null');
        
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
            const serverOrder = {
                totalAmount: finalAmount,
                note: order.notes,
                status: "processing",
                orderTime: order.orderTime || new Date().toISOString(),
                payment: {
                    paymentMethod: "transfer",
                    paymentStatus: "completed",
                    createAt: new Date().toISOString(),
                    amount: finalAmount
                }
            };
            
            let userId = null;
            
            if (window.AuthManager && window.AuthManager.isLoggedIn && window.AuthManager.isLoggedIn()) {
                userId = window.AuthManager.getCurrentUser().userId;
                if (userId) {
                    serverOrder.accountId = userId;
                    console.log("DEBUG - Đơn hàng chuyển khoản được liên kết với tài khoản ID:", userId);
                    
                    if (redeemedPoints && redeemedPoints.points > 0) {
                        serverOrder.redeemedPoints = redeemedPoints.points;
                        serverOrder.redeemedDiscount = redeemedPoints.discount;
                    }
                }
            }
            
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
            
            if (appliedPromotion) {
                serverOrder.promotion = { code: appliedPromotion.code };
                serverOrder.discountAmount = appliedPromotion.discountAmount;
            }
                        
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

            if (userId && redeemedPoints && redeemedPoints.points > 0) {
                await subtractRewardPoints(userId, redeemedPoints.points);
            }
        } catch (error) {
            console.error("Lỗi khi gọi API tạo đơn hàng chuyển khoản:", error);
            alert("Không thể kết nối đến máy chủ. Vui lòng thử lại sau.");
            return;
        }
        
        order.idOrder = orderId;
        localStorage.setItem("currentOrder", JSON.stringify(order));
        localStorage.setItem("lastOrderId", orderId);
    
        localStorage.removeItem("cart");
        localStorage.removeItem("appliedPromotion");
        localStorage.removeItem("redeemedPoints");
        localStorage.removeItem("selectedTable");
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
        const cart = JSON.parse(localStorage.getItem("cart")) || [];

        if (cart.length === 0) {
            alert("Giỏ hàng của bạn đang trống. Vui lòng thêm sản phẩm trước khi đặt hàng.");
            return;
        }
        
        const tableNumber = document.getElementById("tableNumber").value;
        
        if (tableNumber) {
            localStorage.setItem("selectedTable", tableNumber);
        }

        const paymentMethod = document.querySelector('input[name="payment"]:checked').value;
        
        if (paymentMethod === "transfer") {
            const order = prepareOrderData();
            
            showVietQR(order);
        } else {
            try {
                const order = prepareOrderData();
                
                alert("Đơn hàng của bạn đang được xử lý!");
                
                localStorage.setItem("paymentMethod", "cash");
                localStorage.setItem("paymentCompleted", "false");
                
                const redeemedPoints = JSON.parse(localStorage.getItem('redeemedPoints') || 'null');
                
                let orderId;
                try {
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
                    
                    let userId = null;
                    
                    if (window.AuthManager && window.AuthManager.isLoggedIn && window.AuthManager.isLoggedIn()) {
                        userId = window.AuthManager.getCurrentUser().userId;
                        if (userId) {
                            serverOrder.accountId = userId;
                            console.log("DEBUG - Đơn hàng được liên kết với tài khoản ID:", userId);
                            
                            if (redeemedPoints && redeemedPoints.points > 0) {
                                serverOrder.redeemedPoints = redeemedPoints.points;
                                serverOrder.redeemedDiscount = redeemedPoints.discount;
                            }
                        }
                    }
                    
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
                        serverOrder.table = {
                            idTable: "tại chỗ",
                            tableNumber: "tại chỗ"
                        };
                    }
                    
                    serverOrder.productItems = order.cart.map(item => {
                        return {
                            productId: item.id,
                            quantity: item.quantity,
                            unitPrice: item.price
                        };
                    });
                    
                    if (order.promoCode) {
                        serverOrder.promotion = {
                            code: order.promoCode
                        };
                        serverOrder.discountAmount = order.discountAmount;
                    }
                    
                    console.log("DEBUG - Gửi dữ liệu đơn hàng đến server:", JSON.stringify(serverOrder, null, 2));
                    
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
                
                localStorage.removeItem("cart");
                localStorage.removeItem("appliedPromotion");
                localStorage.removeItem("redeemedPoints");
                localStorage.removeItem("selectedTable");
                order.idOrder = orderId;
                localStorage.setItem("currentOrder", JSON.stringify(order));
                
                window.location.href = "order-success.html";
            } catch (error) {
                console.error("Lỗi khi xử lý đặt hàng:", error);
                alert("Đã xảy ra lỗi khi xử lý đơn hàng. Vui lòng thử lại sau.");
            }
        }
    });
}


function calculateTotal() {
    const cart = JSON.parse(localStorage.getItem("cart")) || [];
    const appliedPromotion = JSON.parse(localStorage.getItem('appliedPromotion') || 'null');
    
    let total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    
    if (appliedPromotion && appliedPromotion.finalTotal) {
        total = appliedPromotion.finalTotal;
    }
    
    updateEstimatedRewardPoints();
    
    return total;
}

function generateOrderCode() {
    const randomDigits = Math.floor(100000 + Math.random() * 900000);
    return `HD${randomDigits}`;
}

function showVietQR(order) {
    const appliedPromotion = JSON.parse(localStorage.getItem('appliedPromotion') || 'null');
    const redeemedPoints = JSON.parse(localStorage.getItem('redeemedPoints') || 'null');
    
    let amount;
    
    if (order.finalTotal) {
        amount = order.finalTotal;
    } 
    else if (appliedPromotion && appliedPromotion.finalTotal && redeemedPoints && redeemedPoints.discount) {
        amount = Math.max(0, appliedPromotion.finalTotal - redeemedPoints.discount);
    } 
    else if (appliedPromotion && appliedPromotion.finalTotal) {
        amount = appliedPromotion.finalTotal;
    } 
    else if (redeemedPoints && redeemedPoints.discount && order.totalAmount) {
        amount = Math.max(0, order.totalAmount - redeemedPoints.discount);
    } 
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

    const orderCode = order.orderId || generateOrderCode();

    order.paymentMethod = "transfer";

    const tableNumber = order.tableNumber || document.getElementById("tableNumber")?.value || localStorage.getItem("selectedTable") || "";
    order.tableNumber = tableNumber;

    const accountNumber = "1028272356";
    const bankCode = "VCB";
    const accountName = "PHAM XUAN THANG";

    const transferContent = orderCode;

    const vietQrUrl = `https://img.vietqr.io/image/${bankCode}-${accountNumber}-compact.png?amount=${amount}&addInfo=${transferContent}&accountName=${encodeURIComponent(accountName)}`;

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

    document.getElementById('paymentDoneBtn').addEventListener('click', function() {
        if (localStorage.getItem("currentOrder")) {
            alert("Cảm ơn quý khách! Đơn hàng của bạn sẽ được xử lý và phục vụ ngay.");
            localStorage.removeItem("currentOrder");
            localStorage.setItem("paymentCompleted", "true");
            localStorage.setItem("paymentMethod", "transfer");
            setTimeout(() => {
                window.location.href = "order-success.html";
            }, 1000);
        } else {
            completeTransferPayment(order);
        }
    });

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

function displayCurrentOrder(order) {
    document.querySelector('.checkout-page h1').textContent = 'Xác Nhận Thanh Toán';
    
    const orderInfoDiv = document.querySelector('.order-info');
    orderInfoDiv.innerHTML = `
        <h3>Thông Tin Đơn Hàng #${order.orderId || ''}</h3>
        <div class="order-details">
            <p><strong>Bàn:</strong> ${order.tableNumber === 'takeaway' ? 'Mang đi' : `Bàn ${order.tableNumber}`}</p>
            <p><strong>Thời gian đặt:</strong> ${new Date(order.orderTime).toLocaleString('vi-VN')}</p>
        </div>
    `;
    
    const summaryDiv = document.getElementById("orderSummary");
    summaryDiv.innerHTML = "";
    
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
        
        let variantHtml = '';
        if (item.variants) {
            const v = item.variants;
            
            const hasIce = v.ice && v.ice !== '' && v.ice !== '100' && v.ice !== 100;
            const hasSugar = v.sugar && v.sugar !== '' && v.sugar !== '100' && v.sugar !== 100;
            const hasToppings = v.toppings && Array.isArray(v.toppings) && v.toppings.length > 0;
            
            const hasIceOrSugar = hasIce || hasSugar;
            
            
            const showSize = v.size && v.size !== '' && v.size !== '100' && v.size !== 100 && 
                            (v.size.toLowerCase() !== 's' || (v.size.toLowerCase() === 's' && (hasIceOrSugar || hasToppings)));
            
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
    
    summaryDiv.innerHTML = tableHtml;
    
    const totalDiv = document.createElement("div");
    totalDiv.classList.add("summary-total");
    totalDiv.style.marginTop = "15px";
    totalDiv.style.textAlign = "right";
    totalDiv.style.borderTop = "1px solid #ddd";
    totalDiv.style.paddingTop = "10px";
    totalDiv.innerHTML = `<h4>Tổng cộng: ${parseFloat(order.totalAmount).toLocaleString('vi-VN')}đ</h4>`;
    summaryDiv.appendChild(totalDiv);
    
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
    
    setupPaymentMethodChange();
    
    document.getElementById('placeOrderBtn').addEventListener('click', function() {
        const paymentMethod = document.querySelector("input[name='payment']:checked").value;
        
        if (paymentMethod === "cash") {
            alert("Cảm ơn quý khách! Đơn hàng của bạn sẽ được xử lý và phục vụ ngay.");
            
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
        if (totalElement) {
          totalElement.textContent = `Tổng cộng: ${data.finalTotal.toLocaleString('vi-VN')}đ`;
        }
        
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
  