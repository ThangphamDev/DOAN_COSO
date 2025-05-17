$(document).ready(function() {
    // Load tất cả dữ liệu
    function loadData() {
        loadStats();
        loadTables();
        loadPayments();
    }

    // Load thống kê (đơn hàng, doanh thu)
    function loadStats() {
        $.getJSON('/api/stats/today', function(data) {
            $('#todayOrders').text(data.todayOrders || 0);
            $('#revenueCash').text((data.revenueCash || 0) + 'đ');
            $('#revenueOnline').text((data.revenueOnline || 0) + 'đ');
        });
    }

    // Load trạng thái bàn
    function loadTables() {
        $.getJSON('/api/tables', function(data) {
            const tbody = $('#tablesStatus tbody');
            tbody.empty();
            data.forEach(table => {
                tbody.append(`
                    <tr>
                        <td>Bàn ${table.id}</td>
                        <td>${table.status === 'occupied' ? 'Đang dùng' : 'Trống'}</td>
                        <td>
                            <button class="action-btn ${table.status === 'occupied' ? 'free-btn' : 'occupy-btn'}" 
                                    onclick="updateTableStatus(${table.id}, '${table.status === 'occupied' ? 'free' : 'occupied'}')">
                                ${table.status === 'occupied' ? 'Giải phóng' : 'Đặt bàn'}
                            </button>
                        </td>
                    </tr>
                `);
            });
        });
    }

    // Load danh sách thanh toán
    function loadPayments() {
        $.getJSON('/api/payments/today', function(data) {
            const tbody = $('#paymentsTable tbody');
            tbody.empty();
            data.forEach(payment => {
                tbody.append(`
                    <tr>
                        <td>${payment.id}</td>
                        <td>${payment.customerName}</td>
                        <td>${payment.amount}đ</td>
                        <td>${payment.method}</td>
                        <td class="${payment.status === 'success' ? 'success' : 'failed'}">
                            ${payment.status === 'success' ? 'Thành công' : 'Thất bại'}
                        </td>
                    </tr>
                `);
            });
        });
    }

    // Cập nhật trạng thái bàn
    window.updateTableStatus = function(tableId, newStatus) {
        $.post('/api/tables/' + tableId + '/update', { status: newStatus }, function() {
            loadTables();
        }).fail(function() {
            alert('Lỗi khi cập nhật trạng thái bàn!');
        });
    };

    // Tải dữ liệu ban đầu và làm mới mỗi 30 giây
    loadData();
    setInterval(loadData, 30000);

    // Kiểm tra thời gian để reset doanh thu (giả lập qua ngày mới)
    setInterval(function() {
        const now = new Date();
        if (now.getHours() === 0 && now.getMinutes() === 0) {
            loadStats(); // Reset doanh thu khi sang ngày mới
        }
    }, 60000); // Kiểm tra mỗi phút
});