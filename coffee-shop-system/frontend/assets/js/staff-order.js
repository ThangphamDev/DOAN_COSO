document.addEventListener('DOMContentLoaded', function() {
    // Tải header/footer
    fetch('../components/header.html').then(r => r.text()).then(h => document.getElementById('header-container').innerHTML = h);
    fetch('../components/footer.html').then(r => r.text()).then(h => document.getElementById('footer-container').innerHTML = h);
    
    // Gửi đơn hàng lên server
    sendOrderToServer();
    
    // Hiển thị thông tin đơn hàng
    renderOrderSuccess();
    
    // Thêm sự kiện cho nút in hóa đơn
    document.getElementById('btnPrint').addEventListener('click', function() {
        window.print();
    });
});

function formatPrice(price) {
    if (typeof price !== 'number' || isNaN(price)) price = 0;
    return price.toLocaleString('vi-VN') + ' đ';
}

function sendOrderToServer() {
    let order = JSON.parse(localStorage.getItem('currentOrder'));
    if (!order) {
        const lastOrderId = localStorage.getItem('lastOrderId');
        const orders = JSON.parse(localStorage.getItem('orders') || '[]');
        order = orders.find(o => o.idOrder == lastOrderId || o.id == lastOrderId);
    }
    
    if (order) {
        // Gửi đơn hàng lên server qua API
        fetch('/api/orders', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(order)
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Lỗi khi gửi đơn hàng lên server');
            }
            return response.json();
        })
        .then(data => {
            console.log('Đơn hàng đã được gửi lên server:', data);
            // Cập nhật lastOrderId nếu server trả về ID mới
            if (data.idOrder) {
                localStorage.setItem('lastOrderId', data.idOrder);
            }
            // Xóa currentOrder sau khi gửi thành công
            localStorage.removeItem('currentOrder');
        })
        .catch(error => {
            console.error('Lỗi:', error);
            alert('Không thể gửi đơn hàng lên server. Vui lòng thử lại.');
        });
    }
}

function renderOrderSuccess() {
    let order = JSON.parse(localStorage.getItem('currentOrder'));
    if (!order) {
        const lastOrderId = localStorage.getItem('lastOrderId');
        const orders = JSON.parse(localStorage.getItem('orders') || '[]');
        order = orders.find(o => o.idOrder == lastOrderId || o.id == lastOrderId);
    }
    
    if (!order) {
        document.getElementById('orderInfoTable').innerHTML = '<tr><td colspan="2">Không tìm thấy thông tin đơn hàng!</td></tr>';
        return;
    }
    
    const infoTable = document.getElementById('orderInfoTable');
    let priceRows = '';
    if (order.originalTotal && order.originalTotal > order.totalAmount) {
        priceRows = `
            <tr><td class="label">Giá gốc:</td><td class="value"><s style='color:#888'>${formatPrice(order.originalTotal)}</s></td></tr>
            <tr><td class="label">Giá sau khuyến mãi:</td><td class="value" style='color:#e67e22;font-weight:600;'>${formatPrice(order.totalAmount)}</td></tr>
        `;
    } else {
        priceRows = `<tr><td class="label">Tổng tiền:</td><td class="value">${formatPrice(order.totalAmount)}</td></tr>`;
    }
    
    infoTable.innerHTML = `
        <tr><td class="label">Mã đơn hàng:</td><td class="value">${order.idOrder || order.id || ''}</td></tr>
        <tr><td class="label">Bàn:</td><td class="value">${order.tableNumber ? (order.tableNumber === 'takeaway' ? 'Mang đi' : order.tableNumber) : '---'}</td></tr>
        <tr><td class="label">Thời gian đặt:</td><td class="value">${order.orderTime ? (new Date(order.orderTime)).toLocaleString('vi-VN') : ''}</td></tr>
        ${priceRows}
        <tr><td class="label">Phương thức thanh toán:</td><td class="value">${order.paymentMethod ? (order.paymentMethod === 'transfer' ? 'Chuyển khoản' : 'Tiền mặt') : 'Tiền mặt'}</td></tr>
        <tr><td class="label">Ghi chú:</td><td class="value">${order.note || order.notes || ''}</td></tr>
    `;
    
    const itemsList = document.getElementById('orderItemsList');
    let items = order.items || order.orderDetails || [];
    if (items.length === 0 && order.cart) items = order.cart;
    
    let html = `
        <div style="width:100%; margin-bottom:20px;">
            <div style="font-weight:600; color:#2c3e50; margin-bottom:8px;">Món đã gọi:</div>
            <table style="width:100%; border-spacing:0; border-collapse:collapse;">
                <tr style="border-bottom:1px solid #f0f0f0;">
                    <th style="padding:8px 5px; text-align:left; width:50%;">Tên món</th>
                    <th style="padding:8px 5px; text-align:center; width:20%;">Số lượng</th>
                    <th style="padding:8px 5px; text-align:right; width:30%;">Giá tiền</th>
                </tr>
    `;
    
    if (items.length === 0) {
        html += '<tr><td colspan="3" style="padding:8px 5px; text-align:center;">Không có sản phẩm nào trong đơn hàng.</td></tr>';
    } else {
        html += items.map(item => {
            const name = item.name || (item.product ? item.product.productName : 'Sản phẩm');
            const qty = item.quantity || 1;
            const price = item.price || item.unitPrice || (item.product ? item.product.price : 0);
            
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
                    if (showSize) variantParts.push(`Size: ${v.size}`);
                    if (hasIce) variantParts.push(`Đá: ${v.ice}`);
                    if (hasSugar) variantParts.push(`Đường: ${v.sugar}`);
                    if (hasToppings) {
                        variantParts.push(`Topping: ${v.toppings.map(t => t.name).join(', ')}`);
                    }
                    
                    if (variantParts.length > 0) {
                        variantHtml = `<div style="font-size:12px; color:#888; margin-top:3px;">${variantParts.join(' | ')}</div>`;
                    }
                }
            }
            
            return `
                <tr style="border-bottom:1px solid #f0f0f0;">
                    <td style="padding:8px 5px; text-align:left;">
                        <div>${name}</div>
                        ${variantHtml}
                    </td>
                    <td style="padding:8px 5px; text-align:center;">${qty}</td>
                    <td style="padding:8px 5px; text-align:right; font-weight:500; color:#e67e22;">${formatPrice(price * qty)}</td>
                </tr>
            `;
        }).join('');
    }
    
    html += `</table></div>`;
    itemsList.innerHTML = html;
    
    // Xóa giỏ hàng sau khi hiển thị thành công
    localStorage.removeItem('cart');
}document.addEventListener('DOMContentLoaded', function() {
    // Tải header/footer
    fetch('../components/header.html').then(r => r.text()).then(h => document.getElementById('header-container').innerHTML = h);
    fetch('../components/footer.html').then(r => r.text()).then(h => document.getElementById('footer-container').innerHTML = h);
    
    // Gửi đơn hàng lên server
    sendOrderToServer();
    
    // Hiển thị thông tin đơn hàng
    renderOrderSuccess();
    
    // Thêm sự kiện cho nút in hóa đơn
    document.getElementById('btnPrint').addEventListener('click', function() {
        window.print();
    });
});

function formatPrice(price) {
    if (typeof price !== 'number' || isNaN(price)) price = 0;
    return price.toLocaleString('vi-VN') + ' đ';
}

function sendOrderToServer() {
    let order = JSON.parse(localStorage.getItem('currentOrder'));
    if (!order) {
        const lastOrderId = localStorage.getItem('lastOrderId');
        const orders = JSON.parse(localStorage.getItem('orders') || '[]');
        order = orders.find(o => o.idOrder == lastOrderId || o.id == lastOrderId);
    }
    
    if (order) {
        // Gửi đơn hàng lên server qua API
        fetch('/api/orders', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(order)
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Lỗi khi gửi đơn hàng lên server');
            }
            return response.json();
        })
        .then(data => {
            console.log('Đơn hàng đã được gửi lên server:', data);
            // Cập nhật lastOrderId nếu server trả về ID mới
            if (data.idOrder) {
                localStorage.setItem('lastOrderId', data.idOrder);
            }
            // Xóa currentOrder sau khi gửi thành công
            localStorage.removeItem('currentOrder');
        })
        .catch(error => {
            console.error('Lỗi:', error);
            alert('Không thể gửi đơn hàng lên server. Vui lòng thử lại.');
        });
    }
}

function renderOrderSuccess() {
    let order = JSON.parse(localStorage.getItem('currentOrder'));
    if (!order) {
        const lastOrderId = localStorage.getItem('lastOrderId');
        const orders = JSON.parse(localStorage.getItem('orders') || '[]');
        order = orders.find(o => o.idOrder == lastOrderId || o.id == lastOrderId);
    }
    
    if (!order) {
        document.getElementById('orderInfoTable').innerHTML = '<tr><td colspan="2">Không tìm thấy thông tin đơn hàng!</td></tr>';
        return;
    }
    
    const infoTable = document.getElementById('orderInfoTable');
    let priceRows = '';
    if (order.originalTotal && order.originalTotal > order.totalAmount) {
        priceRows = `
            <tr><td class="label">Giá gốc:</td><td class="value"><s style='color:#888'>${formatPrice(order.originalTotal)}</s></td></tr>
            <tr><td class="label">Giá sau khuyến mãi:</td><td class="value" style='color:#e67e22;font-weight:600;'>${formatPrice(order.totalAmount)}</td></tr>
        `;
    } else {
        priceRows = `<tr><td class="label">Tổng tiền:</td><td class="value">${formatPrice(order.totalAmount)}</td></tr>`;
    }
    
    infoTable.innerHTML = `
        <tr><td class="label">Mã đơn hàng:</td><td class="value">${order.idOrder || order.id || ''}</td></tr>
        <tr><td class="label">Bàn:</td><td class="value">${order.tableNumber ? (order.tableNumber === 'takeaway' ? 'Mang đi' : order.tableNumber) : '---'}</td></tr>
        <tr><td class="label">Thời gian đặt:</td><td class="value">${order.orderTime ? (new Date(order.orderTime)).toLocaleString('vi-VN') : ''}</td></tr>
        ${priceRows}
        <tr><td class="label">Phương thức thanh toán:</td><td class="value">${order.paymentMethod ? (order.paymentMethod === 'transfer' ? 'Chuyển khoản' : 'Tiền mặt') : 'Tiền mặt'}</td></tr>
        <tr><td class="label">Ghi chú:</td><td class="value">${order.note || order.notes || ''}</td></tr>
    `;
    
    const itemsList = document.getElementById('orderItemsList');
    let items = order.items || order.orderDetails || [];
    if (items.length === 0 && order.cart) items = order.cart;
    
    let html = `
        <div style="width:100%; margin-bottom:20px;">
            <div style="font-weight:600; color:#2c3e50; margin-bottom:8px;">Món đã gọi:</div>
            <table style="width:100%; border-spacing:0; border-collapse:collapse;">
                <tr style="border-bottom:1px solid #f0f0f0;">
                    <th style="padding:8px 5px; text-align:left; width:50%;">Tên món</th>
                    <th style="padding:8px 5px; text-align:center; width:20%;">Số lượng</th>
                    <th style="padding:8px 5px; text-align:right; width:30%;">Giá tiền</th>
                </tr>
    `;
    
    if (items.length === 0) {
        html += '<tr><td colspan="3" style="padding:8px 5px; text-align:center;">Không có sản phẩm nào trong đơn hàng.</td></tr>';
    } else {
        html += items.map(item => {
            const name = item.name || (item.product ? item.product.productName : 'Sản phẩm');
            const qty = item.quantity || 1;
            const price = item.price || item.unitPrice || (item.product ? item.product.price : 0);
            
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
                    if (showSize) variantParts.push(`Size: ${v.size}`);
                    if (hasIce) variantParts.push(`Đá: ${v.ice}`);
                    if (hasSugar) variantParts.push(`Đường: ${v.sugar}`);
                    if (hasToppings) {
                        variantParts.push(`Topping: ${v.toppings.map(t => t.name).join(', ')}`);
                    }
                    
                    if (variantParts.length > 0) {
                        variantHtml = `<div style="font-size:12px; color:#888; margin-top:3px;">${variantParts.join(' | ')}</div>`;
                    }
                }
            }
            
            return `
                <tr style="border-bottom:1px solid #f0f0f0;">
                    <td style="padding:8px 5px; text-align:left;">
                        <div>${name}</div>
                        ${variantHtml}
                    </td>
                    <td style="padding:8px 5px; text-align:center;">${qty}</td>
                    <td style="padding:8px 5px; text-align:right; font-weight:500; color:#e67e22;">${formatPrice(price * qty)}</td>
                </tr>
            `;
        }).join('');
    }
    
    html += `</table></div>`;
    itemsList.innerHTML = html;
    
    // Xóa giỏ hàng sau khi hiển thị thành công
    localStorage.removeItem('cart');
}document.addEventListener('DOMContentLoaded', function() {
    // Tải header/footer
    fetch('../components/header.html').then(r => r.text()).then(h => document.getElementById('header-container').innerHTML = h);
    fetch('../components/footer.html').then(r => r.text()).then(h => document.getElementById('footer-container').innerHTML = h);
    
    // Gửi đơn hàng lên server
    sendOrderToServer();
    
    // Hiển thị thông tin đơn hàng
    renderOrderSuccess();
    
    // Thêm sự kiện cho nút in hóa đơn
    document.getElementById('btnPrint').addEventListener('click', function() {
        window.print();
    });
});

function formatPrice(price) {
    if (typeof price !== 'number' || isNaN(price)) price = 0;
    return price.toLocaleString('vi-VN') + ' đ';
}

function sendOrderToServer() {
    let order = JSON.parse(localStorage.getItem('currentOrder'));
    if (!order) {
        const lastOrderId = localStorage.getItem('lastOrderId');
        const orders = JSON.parse(localStorage.getItem('orders') || '[]');
        order = orders.find(o => o.idOrder == lastOrderId || o.id == lastOrderId);
    }
    
    if (order) {
        // Gửi đơn hàng lên server qua API
        fetch('/api/orders', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(order)
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Lỗi khi gửi đơn hàng lên server');
            }
            return response.json();
        })
        .then(data => {
            console.log('Đơn hàng đã được gửi lên server:', data);
            // Cập nhật lastOrderId nếu server trả về ID mới
            if (data.idOrder) {
                localStorage.setItem('lastOrderId', data.idOrder);
            }
            // Xóa currentOrder sau khi gửi thành công
            localStorage.removeItem('currentOrder');
        })
        .catch(error => {
            console.error('Lỗi:', error);
            alert('Không thể gửi đơn hàng lên server. Vui lòng thử lại.');
        });
    }
}

function renderOrderSuccess() {
    let order = JSON.parse(localStorage.getItem('currentOrder'));
    if (!order) {
        const lastOrderId = localStorage.getItem('lastOrderId');
        const orders = JSON.parse(localStorage.getItem('orders') || '[]');
        order = orders.find(o => o.idOrder == lastOrderId || o.id == lastOrderId);
    }
    
    if (!order) {
        document.getElementById('orderInfoTable').innerHTML = '<tr><td colspan="2">Không tìm thấy thông tin đơn hàng!</td></tr>';
        return;
    }
    
    const infoTable = document.getElementById('orderInfoTable');
    let priceRows = '';
    if (order.originalTotal && order.originalTotal > order.totalAmount) {
        priceRows = `
            <tr><td class="label">Giá gốc:</td><td class="value"><s style='color:#888'>${formatPrice(order.originalTotal)}</s></td></tr>
            <tr><td class="label">Giá sau khuyến mãi:</td><td class="value" style='color:#e67e22;font-weight:600;'>${formatPrice(order.totalAmount)}</td></tr>
        `;
    } else {
        priceRows = `<tr><td class="label">Tổng tiền:</td><td class="value">${formatPrice(order.totalAmount)}</td></tr>`;
    }
    
    infoTable.innerHTML = `
        <tr><td class="label">Mã đơn hàng:</td><td class="value">${order.idOrder || order.id || ''}</td></tr>
        <tr><td class="label">Bàn:</td><td class="value">${order.tableNumber ? (order.tableNumber === 'takeaway' ? 'Mang đi' : order.tableNumber) : '---'}</td></tr>
        <tr><td class="label">Thời gian đặt:</td><td class="value">${order.orderTime ? (new Date(order.orderTime)).toLocaleString('vi-VN') : ''}</td></tr>
        ${priceRows}
        <tr><td class="label">Phương thức thanh toán:</td><td class="value">${order.paymentMethod ? (order.paymentMethod === 'transfer' ? 'Chuyển khoản' : 'Tiền mặt') : 'Tiền mặt'}</td></tr>
        <tr><td class="label">Ghi chú:</td><td class="value">${order.note || order.notes || ''}</td></tr>
    `;
    
    const itemsList = document.getElementById('orderItemsList');
    let items = order.items || order.orderDetails || [];
    if (items.length === 0 && order.cart) items = order.cart;
    
    let html = `
        <div style="width:100%; margin-bottom:20px;">
            <div style="font-weight:600; color:#2c3e50; margin-bottom:8px;">Món đã gọi:</div>
            <table style="width:100%; border-spacing:0; border-collapse:collapse;">
                <tr style="border-bottom:1px solid #f0f0f0;">
                    <th style="padding:8px 5px; text-align:left; width:50%;">Tên món</th>
                    <th style="padding:8px 5px; text-align:center; width:20%;">Số lượng</th>
                    <th style="padding:8px 5px; text-align:right; width:30%;">Giá tiền</th>
                </tr>
    `;
    
    if (items.length === 0) {
        html += '<tr><td colspan="3" style="padding:8px 5px; text-align:center;">Không có sản phẩm nào trong đơn hàng.</td></tr>';
    } else {
        html += items.map(item => {
            const name = item.name || (item.product ? item.product.productName : 'Sản phẩm');
            const qty = item.quantity || 1;
            const price = item.price || item.unitPrice || (item.product ? item.product.price : 0);
            
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
                    if (showSize) variantParts.push(`Size: ${v.size}`);
                    if (hasIce) variantParts.push(`Đá: ${v.ice}`);
                    if (hasSugar) variantParts.push(`Đường: ${v.sugar}`);
                    if (hasToppings) {
                        variantParts.push(`Topping: ${v.toppings.map(t => t.name).join(', ')}`);
                    }
                    
                    if (variantParts.length > 0) {
                        variantHtml = `<div style="font-size:12px; color:#888; margin-top:3px;">${variantParts.join(' | ')}</div>`;
                    }
                }
            }
            
            return `
                <tr style="border-bottom:1px solid #f0f0f0;">
                    <td style="padding:8px 5px; text-align:left;">
                        <div>${name}</div>
                        ${variantHtml}
                    </td>
                    <td style="padding:8px 5px; text-align:center;">${qty}</td>
                    <td style="padding:8px 5px; text-align:right; font-weight:500; color:#e67e22;">${formatPrice(price * qty)}</td>
                </tr>
            `;
        }).join('');
    }
    
    html += `</table></div>`;
    itemsList.innerHTML = html;
    
    // Xóa giỏ hàng sau khi hiển thị thành công
    localStorage.removeItem('cart');
}