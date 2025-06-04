$(document).ready(function() {
    function getAuthToken() {
        return localStorage.getItem('token');
    }

    function getAuthHeaders() {
        const token = getAuthToken();
        const headers = {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        };
        
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }
        
        return headers;
    }

    const API_BASE_URL = 'http://localhost:8081/api';

    function loadData() {
        loadStats();
        loadTables();
        loadPayments();
    }

    function loadStats() {
        fetch(`${API_BASE_URL}/stats/today`, {
            method: 'GET',
            headers: getAuthHeaders()
        })
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            $('#todayOrders').text(data.todayOrders || 0);
            $('#revenueCash').text((data.revenueCash || 0) + 'đ');
            $('#revenueOnline').text((data.revenueOnline || 0) + 'đ');
        })
        .catch(error => {
            console.error('Error loading stats:', error);
            showNotification('Không thể tải dữ liệu thống kê', 'error');
        });
    }

    // Load trạng thái bàn
    function loadTables() {
        fetch(`${API_BASE_URL}/cafe-tables`, {
            method: 'GET',
            headers: getAuthHeaders()
        })
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            const tbody = $('#tablesStatus tbody');
            tbody.empty();
            data.forEach(table => {
                tbody.append(`
                    <tr>
                        <td>Bàn ${table.idTable || table.id}</td>
                        <td>${table.status === 'occupied' ? 'Đang dùng' : 'Trống'}</td>
                        <td>
                            <button class="action-btn ${table.status === 'occupied' ? 'free-btn' : 'occupy-btn'}" 
                                    onclick="updateTableStatus(${table.idTable || table.id}, '${table.status === 'occupied' ? 'free' : 'occupied'}')">
                                ${table.status === 'occupied' ? 'Giải phóng' : 'Đặt bàn'}
                            </button>
                        </td>
                    </tr>
                `);
            });
        })
        .catch(error => {
            console.error('Error loading tables:', error);
            showNotification('Không thể tải dữ liệu bàn', 'error');
        });
    }

    // Load danh sách thanh toán
    function loadPayments() {
        fetch(`${API_BASE_URL}/payments/today`, {
            method: 'GET',
            headers: getAuthHeaders()
        })
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
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
        })
        .catch(error => {
            console.error('Error loading payments:', error);
            showNotification('Không thể tải dữ liệu thanh toán', 'error');
        });
    }

    // Cập nhật trạng thái bàn
    window.updateTableStatus = function(tableId, newStatus) {
        fetch(`${API_BASE_URL}/cafe-tables/${tableId}/update`, {
            method: 'PUT',
            headers: getAuthHeaders(),
            body: JSON.stringify({ status: newStatus })
        })
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
            loadTables();
            showNotification('Cập nhật trạng thái bàn thành công', 'success');
        })
        .catch(error => {
            console.error('Error updating table status:', error);
            showNotification('Lỗi khi cập nhật trạng thái bàn!', 'error');
        });
    };

    // Hiển thị thông báo
    function showNotification(message, type = 'info') {
        let notificationContainer = document.getElementById('notificationContainer');
        if (!notificationContainer) {
            notificationContainer = document.createElement('div');
            notificationContainer.id = 'notificationContainer';
            notificationContainer.className = 'notification-container';
            document.body.appendChild(notificationContainer);
        }
        
        // Tạo thông báo mới
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.innerHTML = `
            <div class="notification-content">
                <span class="notification-message">${message}</span>
            </div>
            <button class="notification-close">&times;</button>
        `;
        
        notificationContainer.appendChild(notification);
        
        setTimeout(() => {
            notification.classList.add('show');
        }, 10);
        
        // Xử lý nút đóng
        const closeButton = notification.querySelector('.notification-close');
        closeButton.addEventListener('click', () => {
            notification.classList.remove('show');
            notification.classList.add('hide');
            setTimeout(() => {
                if (notification.parentElement) {
                    notificationContainer.removeChild(notification);
                }
            }, 300);
        });
        
        setTimeout(() => {
            if (notification.parentElement) {
                notification.classList.remove('show');
                notification.classList.add('hide');
                setTimeout(() => {
                    if (notification.parentElement) {
                        notificationContainer.removeChild(notification);
                    }
                }, 300);
            }
        }, 5000);
    }

    function checkAuthentication() {
        const token = localStorage.getItem('token');
        const role = localStorage.getItem('role');
        
        if (!token || !role || !role.toLowerCase().includes('staff')) {
            window.location.href = '../auth/login.html';
            return false;
        }
        
        return true;
    }

    if (checkAuthentication()) {
        loadData();
        setInterval(loadData, 30000);

        setInterval(function() {
            const now = new Date();
            if (now.getHours() === 0 && now.getMinutes() === 0) {
                loadStats(); 
            }
        }, 60000); 
    }
});