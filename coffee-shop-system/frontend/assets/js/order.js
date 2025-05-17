$(document).ready(function() {
    // Load tất cả đơn hàng
    function loadOrders() {
        $.getJSON('/api/orders/all', function(data) {
            displayOrders(data);
        });
    }

    // Hiển thị danh sách đơn hàng
    function displayOrders(orders) {
        const tbody = $('#ordersTable tbody');
        tbody.empty();
        orders.forEach(order => {
            tbody.append(`
                <tr>
                    <td>${order.id}</td>
                    <td>${order.customerName}</td>
                    <td>${order.phone}</td>
                    <td>${order.tableId}</td>
                    <td>${order.totalAmount}đ</td>
                    <td>${order.status}</td>
                    <td>
                        <button class="action-btn" onclick="viewDetails('${order.id}')">Xem chi tiết</button>
                        ${order.status === 'pending' ? '<button class="action-btn cancel-btn" onclick="cancelOrder(\'' + order.id + '\')">Hủy</button>' : ''}
                        ${order.status === 'completed' ? '<button class="action-btn confirm-btn" onclick="exportBill(\'' + order.id + '\')">Xuất hóa đơn</button>' : ''}
                    </td>
                </tr>
            `);
        });
    }

    // Tìm kiếm đơn hàng
    window.searchOrders = function() {
        const query = $('#searchInput').val().toLowerCase();
        $.getJSON('/api/orders/all', function(data) {
            const filtered = data.filter(order =>
                order.id.toLowerCase().includes(query) || order.customerName.toLowerCase().includes(query)
            );
            displayOrders(filtered);
        });
    };

    // Lọc theo trạng thái
    window.filterOrders = function() {
        const status = $('#statusFilter').val();
        $.getJSON('/api/orders/all', function(data) {
            let filtered = data;
            if (status !== 'all') {
                filtered = data.filter(order => order.status.toLowerCase() === status);
            }
            displayOrders(filtered);
        });
    };

    // Xem chi tiết đơn hàng (Modal)
    window.viewDetails = function(orderId) {
        $.getJSON('/api/orders/' + orderId, function(order) {
            const modalBody = $('#modalBody');
            $('#modalTitle').text('Chi tiết đơn hàng #' + order.id);
            modalBody.html(`
                <p><strong>Khách hàng:</strong> ${order.customerName}</p>
                <p><strong>Số điện thoại:</strong> ${order.phone}</p>
                <p><strong>Bàn:</strong> ${order.tableId}</p>
                <p><strong>Thành tiền:</strong> ${order.totalAmount}đ</p>
                <p><strong>Trạng thái:</strong> ${order.status}</p>
                <p><strong>Thời gian:</strong> ${order.createdAt}</p>
            `);
            $('#exportBillBtn').css('display', order.status === 'completed' ? 'block' : 'none');
            $('#orderModal').css('display', 'block');
        });
    };

    // Hủy đơn hàng
    window.cancelOrder = function(orderId) {
        if (confirm('Bạn có chắc muốn hủy đơn hàng này?')) {
            $.post('/api/orders/' + orderId + '/cancel', function() {
                loadOrders();
            }).fail(function() {
                alert('Lỗi khi hủy đơn hàng!');
            });
        }
    };

    // Xuất hóa đơn (giả định tạo PDF hoặc in)
    window.exportBill = function(orderId) {
        $.get('/api/orders/' + orderId + '/export', function(response) {
            alert('Hóa đơn đã được xuất! (Tích hợp in/PDF tại đây)');
            // Có thể thêm logic để tải file PDF hoặc in trực tiếp
        }).fail(function() {
            alert('Lỗi khi xuất hóa đơn!');
        });
        $('#orderModal').css('display', 'none');
    };

    // Quản lý modal
    $('.close').click(function() {
        $('#orderModal').css('display', 'none');
    });
    $(window).click(function(event) {
        if (event.target.id === 'orderModal') {
            $('#orderModal').css('display', 'none');
        }
    });

    // Tải dữ liệu ban đầu và làm mới mỗi 30 giây
    loadOrders();
    setInterval(loadOrders, 30000);
});