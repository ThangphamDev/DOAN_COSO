$(document).ready(function () {
    function checkLogin() {
        const token = localStorage.getItem('token'); // Đồng bộ với login.js
        if (!token) {
            window.location.replace('../auth/login.html');
            return false;
        }
        return true;
    }

    // Hàm tải tất cả dữ liệu
    function loadData() {
        loadStats();
        loadTables();
        loadPayments();
    }

    // Hàm tải thống kê (đơn hàng, doanh thu)
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

    // Hàm tải trạng thái bàn
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

    // Hàm tải danh sách thanh toán
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

    // Hàm cập nhật trạng thái bàn
    window.updateTableStatus = function (tableId, newStatus) {
        if (!checkLogin()) return;
        $.post('/api/tables/' + tableId + '/update', { status: newStatus }, function () {
            loadTables();
        }).fail(function (xhr, status, error) {
            console.error('Lỗi khi cập nhật trạng thái bàn:', error);
            alert('Không thể cập nhật trạng thái bàn. Vui lòng thử lại! (Lỗi: ' + error + ')');
        });
    };

    // Ngăn redirect không mong muốn đến table.html
    if (window.location.pathname.includes('dashboard.html')) {
        const redirectPath = localStorage.getItem('redirectAfterLogin');
        if (redirectPath && redirectPath.includes('table.html')) {
            localStorage.removeItem('redirectAfterLogin');
        }
    }

    // Chỉ tải dữ liệu nếu đã đăng nhập
    if (checkLogin()) {
        loadData();
        setInterval(loadData, 30000);
    } else {
        return; // Ngăn mọi hành động nếu chưa đăng nhập
    }

    // Kiểm tra và reset doanh thu khi sang ngày mới
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

    // Thêm làm mới thủ công (ấn phím F5 hoặc nút)
    $(document).on('keydown', function (e) {
        if (e.key === 'F5') {
            e.preventDefault();
            if (checkLogin()) {
                loadData();
                alert('Dữ liệu đã được làm mới!');
            }
        }
    });

    $('#refreshBtn').on('click', function () {
        if (checkLogin()) {
            loadData();
            alert('Dữ liệu đã được làm mới!');
        }
    });

    // Thêm đồng hồ thời gian thực
    function updateTime() {
        const now = new Date();
        const timeString = now.toLocaleTimeString('vi-VN', { hour12: false });
        $('#currentTime').text(`Thời gian: ${timeString} (${now.toLocaleDateString('vi-VN')})`);
    }
    if (checkLogin()) {
        updateTime();
        setInterval(updateTime, 1000);
    }

    // Xử lý dropdown menu với hiệu ứng mượt mà
    $('.user-dropdown').click(function (e) {
        e.stopPropagation();
        $(this).find('.dropdown-menu').fadeToggle(200);
    });

    // Ẩn dropdown khi nhấp ra ngoài
    $(document).click(function (e) {
        if (!$(e.target).closest('.user-dropdown').length) {
            $('.dropdown-menu').fadeOut(200);
        }
    });

    // Xử lý sự kiện đăng xuất
    $('#logoutBtn').click(function (e) {
        e.preventDefault();
        if (confirm('Bạn có chắc chắn muốn đăng xuất không?')) {
            // Xóa toàn bộ localStorage
            localStorage.clear();

            // Xóa toàn bộ cookie
            document.cookie.split(";").forEach(function (c) {
                document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
            });

            // Chuyển hướng về trang đăng nhập và ngăn quay lại
            window.location.replace('../auth/login.html');

            // Ngăn mọi hành động tiếp theo
            window.stop();
        }
    });
    // Hàm lấy danh sách order từ server
    function fetchOrders() {
        $.get('/api/orders', function (data) {
            // Cập nhật số đơn hàng hôm nay
            $('#todayOrders').text(data.todayOrders || 0);

            // Cập nhật doanh thu tiền mặt
            $('#revenueCash').text(data.revenueCash ? data.revenueCash + 'đ' : '0đ');

            // Cập nhật doanh thu online
            $('#revenueOnline').text(data.revenueOnline ? data.revenueOnline + 'đ' : '0đ');

            // Nếu bạn muốn hiển thị danh sách đơn hàng chi tiết, có thể thêm vào một bảng
            // Ví dụ: Cập nhật bảng đơn hàng (nếu có)
            if (data.orders && data.orders.length > 0) {
                let ordersTableBody = $('#ordersTable tbody'); // Giả sử bạn thêm bảng đơn hàng
                ordersTableBody.empty(); // Xóa dữ liệu cũ
                data.orders.forEach(function (order) {
                    let row = `
                        <tr>
                            <td>${order.idOrder}</td>
                            <td>${order.customerName || 'Khách vãng lai'}</td>
                            <td>${order.totalAmount}đ</td>
                            <td>${order.paymentMethod}</td>
                            <td class="${order.status == 'success' ? 'success' : 'failed'}">
                                ${order.status == 'success' ? 'Thành công' : 'Thất bại'}
                            </td>
                        </tr>`;
                    ordersTableBody.append(row);
                });
            }
        }).fail(function (xhr) {
            console.error('Lỗi khi lấy dữ liệu đơn hàng: ' + xhr.statusText);
        });
    }

    // Gọi hàm fetchOrders khi trang được tải
    fetchOrders();

    // Gắn sự kiện click cho nút "Làm mới"
    $('#refreshBtn').click(function () {
        fetchOrders();
    });

    // Tự động làm mới mỗi 30 giây
    setInterval(fetchOrders, 30000); // 30000ms = 30 giây
});