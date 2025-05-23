$(document).ready(function () {
    // ======================= KIỂM TRA ĐĂNG NHẬP =======================
    function checkLogin() {
        const token = localStorage.getItem('token');
        if (!token) {
            window.location.replace('../auth/login.html');
            return false;
        }
        return true;
    }

    // ======================= TẢI DỮ LIỆU CHÍNH =======================
    function loadData() {
        loadStats();
        loadTables();
        loadPayments();
        fetchOrders();
    }

    // ---------- 1. Tải thống kê đơn & doanh thu ----------
    function loadStats() {
        $.getJSON('/api/stats/today', function (data) {
            $('#todayOrders').text(data.todayOrders || 0);
            $('#revenueCash').text((data.revenueCash || 0) + 'đ');
            $('#revenueOnline').text((data.revenueOnline || 0) + 'đ');
        }).fail(function (xhr, status, error) {
            console.error('Lỗi khi tải thống kê:', error);
            alert('Không thể tải thống kê. Vui lòng thử lại sau! (Lỗi: ' + error + ')');
        });
    }

    // ---------- 2. Tải trạng thái bàn ----------
    function loadTables() {
        $.getJSON('/api/tables', function (data) {
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
        }).fail(function (xhr, status, error) {
            console.error('Lỗi khi tải trạng thái bàn:', error);
            alert('Không thể tải trạng thái bàn. Vui lòng thử lại sau! (Lỗi: ' + error + ')');
        });
    }

    // ---------- 3. Tải danh sách thanh toán ----------
    function loadPayments() {
        $.getJSON('/api/payments/today', function (data) {
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
        }).fail(function (xhr, status, error) {
            console.error('Lỗi khi tải danh sách thanh toán:', error);
            alert('Không thể tải danh sách thanh toán. Vui lòng thử lại sau! (Lỗi: ' + error + ')');
        });
    }

    // ---------- 4. Lấy đơn hàng ----------
    function fetchOrders() {
        $.get('/api/orders', function (data) {
            $('#todayOrders').text(data.todayOrders || 0);
            $('#revenueCash').text(data.revenueCash ? data.revenueCash + 'đ' : '0đ');
            $('#revenueOnline').text(data.revenueOnline ? data.revenueOnline + 'đ' : '0đ');

            if (data.orders && data.orders.length > 0) {
                const tbody = $('#ordersTable tbody');
                tbody.empty();
                data.orders.forEach(order => {
                    tbody.append(`
                        <tr>
                            <td>${order.idOrder}</td>
                            <td>${order.customerName || 'Khách vãng lai'}</td>
                            <td>${order.totalAmount}đ</td>
                            <td>${order.paymentMethod}</td>
                            <td class="${order.status === 'success' ? 'success' : 'failed'}">
                                ${order.status === 'success' ? 'Thành công' : 'Thất bại'}
                            </td>
                        </tr>
                    `);
                });
            }
        }).fail(function (xhr) {
            console.error('Lỗi khi lấy dữ liệu đơn hàng: ' + xhr.statusText);
        });
    }

    // ======================= CẬP NHẬT TRẠNG THÁI BÀN =======================
    window.updateTableStatus = function (tableId, newStatus) {
        if (!checkLogin()) return;
        $.post('/api/tables/' + tableId + '/update', { status: newStatus }, function () {
            loadTables();
        }).fail(function (xhr, status, error) {
            console.error('Lỗi khi cập nhật trạng thái bàn:', error);
            alert('Không thể cập nhật trạng thái bàn. Vui lòng thử lại! (Lỗi: ' + error + ')');
        });
    };

    // ======================= THỜI GIAN VÀ LÀM MỚI =======================
    function updateTime() {
        const now = new Date();
        const timeString = now.toLocaleTimeString('vi-VN', { hour12: false });
        $('#currentTime').text(`Thời gian: ${timeString} (${now.toLocaleDateString('vi-VN')})`);
    }

    // Cập nhật giờ mỗi giây
    if (checkLogin()) {
        updateTime();
        setInterval(updateTime, 1000);
    }

    // Làm mới thủ công bằng nút hoặc F5
    $('#refreshBtn').on('click', function () {
        if (checkLogin()) {
            loadData();
            alert('Dữ liệu đã được làm mới!');
        }
    });

    $(document).on('keydown', function (e) {
        if (e.key === 'F5') {
            e.preventDefault();
            if (checkLogin()) {
                loadData();
                alert('Dữ liệu đã được làm mới!');
            }
        }
    });

    // ======================= CHECK SANG NGÀY MỚI =======================
    let lastCheckedDate = new Date().toDateString();
    setInterval(function () {
        const now = new Date();
        const currentDate = now.toDateString();
        if (currentDate !== lastCheckedDate) {
            lastCheckedDate = currentDate;
            if (checkLogin()) {
                loadStats();
            }
        }
    }, 60000);

    // ======================= DROPDOWN MENU =======================
    $('.user-dropdown').click(function (e) {
        e.stopPropagation();
        $(this).find('.dropdown-menu').fadeToggle(200);
    });

    $(document).click(function (e) {
        if (!$(e.target).closest('.user-dropdown').length) {
            $('.dropdown-menu').fadeOut(200);
        }
    });

    // ======================= ĐĂNG XUẤT =======================
    $('#logoutBtn').click(function (e) {
        e.preventDefault();
        if (confirm('Bạn có chắc chắn muốn đăng xuất không?')) {
            localStorage.clear();
            document.cookie.split(";").forEach(function (c) {
                document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
            });
            window.location.replace('../auth/login.html');
            window.stop();
        }
    });

    // ======================= BẮT ĐẦU =======================
    if (checkLogin()) {
        loadData();
        setInterval(loadData, 30000); // Tự động làm mới mỗi 30 giây
    }

    // Ngăn redirect không mong muốn
    if (window.location.pathname.includes('dashboard.html')) {
        const redirectPath = localStorage.getItem('redirectAfterLogin');
        if (redirectPath && redirectPath.includes('table.html')) {
            localStorage.removeItem('redirectAfterLogin');
        }
    }
});
