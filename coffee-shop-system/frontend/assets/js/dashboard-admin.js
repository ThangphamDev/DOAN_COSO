/**
 * dashboard-admin.js - Script chuyên biệt cho trang tổng quan Admin
 */

// Biến global để theo dõi trạng thái tải
let chartsInitialized = false;

document.addEventListener('DOMContentLoaded', function() {
    console.log('Admin Dashboard loaded');
    
    // Kiểm tra token và hiển thị tên người dùng
    setupAdminDashboard();

    // Đảm bảo Chart.js đã tải trước khi khởi tạo biểu đồ
    initializeCharts();
});

// Hàm khởi tạo biểu đồ với kiểm tra thư viện
function initializeCharts() {
    // Kiểm tra xem Chart.js đã tải chưa
    if (typeof Chart === 'undefined') {
        console.log('Chart.js chưa sẵn sàng, đợi 500ms...');
        setTimeout(initializeCharts, 500);
        return;
    }
    
    if (chartsInitialized) {
        console.log('Biểu đồ đã được khởi tạo trước đó');
        return;
    }
    
    console.log('Chart.js đã sẵn sàng, bắt đầu tải dữ liệu biểu đồ');
    chartsInitialized = true;
    
    // Tải dữ liệu cho dashboard
    loadDashboardData();
}

function setupAdminDashboard() {
    // Hiển thị tên admin
    const adminNameElement = document.getElementById('adminName');
    if (adminNameElement) {
        const fullName = localStorage.getItem('fullName');
        if (fullName) {
            adminNameElement.textContent = fullName;
        }
    }

    // Thiết lập sự kiện cho các nút thao tác nhanh
    setupQuickActions();
}

function setupQuickActions() {
    // Thiết lập các nút thao tác nhanh
    const actionButtons = {
        'addStaffBtn': function() { window.location.href = 'staff-management.html?action=add'; },
        'addProductBtn': function() { window.location.href = 'product-management.html?action=add'; },
        'addCategoryBtn': function() { window.location.href = 'category-management.html?action=add'; },
        'addTableBtn': function() { window.location.href = 'table-management.html?action=add'; },
        'addPromotionBtn': function() { window.location.href = 'promotion-management.html?action=add'; },
        'viewOrdersBtn': function() { window.location.href = 'orders.html'; },
        'generateReportBtn': function() { window.location.href = 'reports.html'; },
        'settingsBtn': function() { window.location.href = 'settings.html'; }
    };

    // Gắn sự kiện cho các nút
    Object.keys(actionButtons).forEach(id => {
        const button = document.getElementById(id);
        if (button) {
            button.addEventListener('click', actionButtons[id]);
        }
    });
}

async function loadDashboardData() {
    try {
        showLoader(true);
        
        // Tải dữ liệu từ các API endpoint khác nhau
        await Promise.all([
            loadStatistics(),
            loadRecentActivity(),
            loadChartData(),
            loadSummaryData()
        ]);
        
        showLoader(false);
    } catch (error) {
        console.error('Lỗi khi tải dữ liệu tổng quan:', error);
        showLoader(false);
        showNotification('Không thể tải dữ liệu tổng quan. Vui lòng thử lại sau.', 'error');
    }
}

async function loadStatistics() {
    try {
        const API_URL = 'http://localhost:8081/api';
        const token = localStorage.getItem('token');
        
        // Tải thông tin đơn hàng
        const ordersResponse = await fetch(`${API_URL}/orders`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/json'
            }
        });
        
        // Tải thông tin sản phẩm
        const productsResponse = await fetch(`${API_URL}/products`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/json'
            }
        });
        
        // Tải thông tin nhân viên
        const staffResponse = await fetch(`${API_URL}/accounts`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/json'
            }
        });
        
        // Kiểm tra và xử lý phản hồi
        if (!ordersResponse.ok || !productsResponse.ok || !staffResponse.ok) {
            throw new Error('Không thể tải dữ liệu thống kê');
        }
        
        const orders = await ordersResponse.json();
        const products = await productsResponse.json();
        const staff = await staffResponse.json();
        
        // Tính toán thống kê
        const today = new Date();
        today.setHours(0, 0, 0, 0); // Đặt thời gian về đầu ngày
        
        const todayOrders = orders.filter(order => {
            const orderDate = new Date(order.orderTime || order.createAt);
            orderDate.setHours(0, 0, 0, 0); // Đặt thời gian về đầu ngày để so sánh
            return orderDate.getTime() === today.getTime();
        });
        
        const todayOrdersCount = todayOrders.length;
        
        // Chỉ tính doanh thu từ đơn hàng hôm nay
        const todayRevenue = todayOrders.reduce((sum, order) => {
            return sum + (order.totalAmount || 0);
        }, 0);
        
        // Cập nhật giao diện
        updateStatisticsUI({
            todayOrders: todayOrdersCount,
            todayRevenue: todayRevenue,
            productCount: products.length,
            staffCount: staff.length
        });
        
        return { orders, products, staff };
    } catch (error) {
        console.error('Lỗi khi tải thống kê:', error);
        // Đặt giá trị mặc định
        updateStatisticsUI({
            todayOrders: 0,
            todayRevenue: 0,
            productCount: 0,
            staffCount: 0
        });
        throw error;
    }
}

function updateStatisticsUI(stats) {
    // Cập nhật số đơn hàng hôm nay
    const todayOrdersElement = document.getElementById('todayOrders');
    if (todayOrdersElement) {
        todayOrdersElement.textContent = stats.todayOrders;
    }
    
    // Cập nhật doanh thu hôm nay
    const todayRevenueElement = document.getElementById('todayRevenue');
    if (todayRevenueElement) {
        todayRevenueElement.textContent = formatCurrency(stats.todayRevenue);
    }
    
    // Cập nhật số lượng nhân viên
    const staffCountElement = document.getElementById('staffCount');
    if (staffCountElement) {
        staffCountElement.textContent = stats.staffCount;
    }
    
    // Cập nhật số lượng sản phẩm
    const productCountElement = document.getElementById('productCount');
    if (productCountElement) {
        productCountElement.textContent = stats.productCount;
    }
}

async function loadRecentActivity() {
    try {
        const API_URL = 'http://localhost:8081/api';
        const token = localStorage.getItem('token');
        
        // Nếu có API endpoint cho hoạt động, sử dụng nó
        // Nếu không, sử dụng đơn hàng gần đây làm hoạt động
        const activityResponse = await fetch(`${API_URL}/orders/recent?limit=5`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/json'
            }
        });
        
        if (!activityResponse.ok) {
            throw new Error('Không thể tải hoạt động gần đây');
        }
        
        const activities = await activityResponse.json();
        
        // Hiển thị hoạt động gần đây
        const recentActivityElement = document.getElementById('recentActivity');
        if (recentActivityElement) {
            if (activities.length === 0) {
                recentActivityElement.innerHTML = '<tr><td colspan="4">Không có hoạt động nào gần đây</td></tr>';
            } else {
                recentActivityElement.innerHTML = activities.map(activity => {
                    const date = new Date(activity.orderTime || activity.createAt);
                    const formattedDate = formatDateTime(date);
                    
                    let activityType = 'Đơn hàng mới';
                    if (activity.status) {
                        switch (activity.status.toLowerCase()) {
                            case 'completed':
                                activityType = 'Hoàn thành đơn hàng';
                                break;
                            case 'cancelled':
                                activityType = 'Hủy đơn hàng';
                                break;
                        }
                    }
                    
                    return `
                        <tr>
                            <td>${formattedDate}</td>
                            <td>${activityType}</td>
                            <td>${activity.createdBy || 'Hệ thống'}</td>
                            <td>Đơn hàng #${activity.idOrder}</td>
                        </tr>
                    `;
                }).join('');
            }
        }
    } catch (error) {
        console.error('Lỗi khi tải hoạt động gần đây:', error);
        const recentActivityElement = document.getElementById('recentActivity');
        if (recentActivityElement) {
            recentActivityElement.innerHTML = '<tr><td colspan="4">Không thể tải hoạt động gần đây</td></tr>';
        }
    }
}

async function loadChartData() {
    try {
        // Kiểm tra xem Chart.js đã được tải chưa
        if (typeof Chart === 'undefined') {
            console.error('Chart.js chưa được tải. Đảm bảo thư viện đã được tải trước khi tạo biểu đồ.');
            showNotification('Không thể tạo biểu đồ: Chart.js chưa được tải', 'error');
            return;
        }
        
        console.log('Bắt đầu tải dữ liệu biểu đồ...');
        
        const API_URL = 'http://localhost:8081/api';
        const token = localStorage.getItem('token');
        
        // Tải dữ liệu đơn hàng cho biểu đồ doanh thu
        const ordersResponse = await fetch(`${API_URL}/orders`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/json'
            }
        });
        
        // Tải dữ liệu sản phẩm cho biểu đồ sản phẩm bán chạy
        const productsResponse = await fetch(`${API_URL}/products`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/json'
            }
        });
        
        if (!ordersResponse.ok || !productsResponse.ok) {
            console.error('Lỗi khi tải dữ liệu: Orders status:', ordersResponse.status, 'Products status:', productsResponse.status);
            throw new Error('Không thể tải dữ liệu biểu đồ');
        }
        
        const orders = await ordersResponse.json();
        const products = await productsResponse.json();
        
        console.log('Đã tải dữ liệu:', orders.length, 'đơn hàng,', products.length, 'sản phẩm');
        
        // Kiểm tra xem dữ liệu đơn hàng có cấu trúc đúng không
        if (orders.length > 0) {
            const sampleOrder = orders[0];
            console.log('Mẫu đơn hàng:', {
                id: sampleOrder.idOrder,
                orderTime: sampleOrder.orderTime || sampleOrder.createAt,
                totalAmount: sampleOrder.totalAmount,
                hasOrderDetails: Array.isArray(sampleOrder.orderDetails),
                orderDetailsLength: sampleOrder.orderDetails ? sampleOrder.orderDetails.length : 0
            });
        }
        
        // Tạo biểu đồ doanh thu
        createRevenueChart(orders);
        
        // Tạo biểu đồ sản phẩm bán chạy
        createProductChart(orders, products);
    } catch (error) {
        console.error('Lỗi khi tải dữ liệu biểu đồ:', error);
        showNotification('Không thể tải dữ liệu biểu đồ: ' + error.message, 'error');
    }
}

function createRevenueChart(orders) {
    const revenueChartElement = document.getElementById('revenueChart');
    if (!revenueChartElement) {
        console.error('Không tìm thấy element với id "revenueChart"');
        return;
    }
    
    console.log('Bắt đầu tạo biểu đồ doanh thu với', orders.length, 'đơn hàng');
    
    // Lấy khoảng thời gian hiện tại
    const currentDate = new Date();
    const currentWeekStart = new Date(currentDate);
    currentWeekStart.setDate(currentDate.getDate() - currentDate.getDay());
    currentWeekStart.setHours(0, 0, 0, 0); // Đặt thời gian về đầu ngày
    
    console.log('Tuần hiện tại bắt đầu từ:', currentWeekStart.toLocaleDateString());
    
    // Tính toán doanh thu theo ngày trong tuần
    const weekLabels = Array.from({ length: 7 }, (_, i) => {
        const date = new Date(currentWeekStart);
        date.setDate(currentWeekStart.getDate() + i);
        return date.toLocaleDateString('vi-VN', { weekday: 'short', day: '2-digit', month: '2-digit' });
    });
    
    const weekData = Array(7).fill(0);
    
    // Đếm số lượng đơn hàng được xử lý cho mỗi ngày
    const orderCountByDay = Array(7).fill(0);
    
    orders.forEach(order => {
        if (!order.orderTime && !order.createAt) {
            console.warn('Đơn hàng không có thời gian:', order.idOrder);
            return;
        }
        
        const orderDate = new Date(order.orderTime || order.createAt);
        
        // So sánh ngày trong tuần hiện tại
        for (let i = 0; i < 7; i++) {
            const weekDay = new Date(currentWeekStart);
            weekDay.setDate(currentWeekStart.getDate() + i);
            weekDay.setHours(0, 0, 0, 0);
            
            const orderDay = new Date(orderDate);
            orderDay.setHours(0, 0, 0, 0);
            
            if (weekDay.getTime() === orderDay.getTime()) {
                weekData[i] += (order.totalAmount || 0);
                orderCountByDay[i]++;
                break;
            }
        }
    });
    
    console.log('Dữ liệu doanh thu theo ngày:', weekData);
    console.log('Số lượng đơn hàng theo ngày:', orderCountByDay);
    
    // Tạo biểu đồ doanh thu
    if (window.revenueChartInstance) {
        window.revenueChartInstance.destroy();
        console.log('Đã hủy biểu đồ doanh thu cũ');
    }
    
    try {
    window.revenueChartInstance = new Chart(revenueChartElement, {
        type: 'line',
        data: {
            labels: weekLabels,
            datasets: [{
                label: 'Doanh thu',
                data: weekData,
                backgroundColor: 'rgba(54, 162, 235, 0.2)',
                borderColor: 'rgba(54, 162, 235, 1)',
                borderWidth: 2,
                tension: 0.3
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    position: 'top',
                },
                title: {
                    display: true,
                    text: 'Doanh thu theo ngày trong tuần'
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: function(value) {
                            return value.toLocaleString('vi-VN') + ' đ';
                        }
                    }
                }
            }
        }
    });
        console.log('Biểu đồ doanh thu đã được tạo thành công');
    } catch (error) {
        console.error('Lỗi khi tạo biểu đồ doanh thu:', error);
    }
    
    // Thiết lập sự kiện thay đổi thời gian
    const periodSelector = document.getElementById('revenueChartPeriod');
    if (periodSelector) {
        periodSelector.addEventListener('change', function() {
            const selectedPeriod = this.value;
            console.log('Thay đổi giai đoạn hiển thị doanh thu:', selectedPeriod);
            updateRevenueChart(selectedPeriod, orders);
        });
    } else {
        console.warn('Không tìm thấy element với id "revenueChartPeriod"');
    }
}

// Hàm cập nhật biểu đồ doanh thu theo thời gian đã chọn
function updateRevenueChart(period, orders) {
    const revenueChartElement = document.getElementById('revenueChart');
    if (!revenueChartElement) return;
    
    const currentDate = new Date();
    let labels = [];
    let data = [];
    let title = '';
    
    if (period === 'week') {
        // Doanh thu theo tuần (đã xử lý trong hàm createRevenueChart)
        const currentWeekStart = new Date(currentDate);
        currentWeekStart.setDate(currentDate.getDate() - currentDate.getDay());
        currentWeekStart.setHours(0, 0, 0, 0);
        
        labels = Array.from({ length: 7 }, (_, i) => {
            const date = new Date(currentWeekStart);
            date.setDate(currentWeekStart.getDate() + i);
            return date.toLocaleDateString('vi-VN', { weekday: 'short', day: '2-digit', month: '2-digit' });
        });
        
        data = Array(7).fill(0);
        
        orders.forEach(order => {
            const orderDate = new Date(order.orderTime || order.createAt);
            
            for (let i = 0; i < 7; i++) {
                const weekDay = new Date(currentWeekStart);
                weekDay.setDate(currentWeekStart.getDate() + i);
                weekDay.setHours(0, 0, 0, 0);
                
                const orderDay = new Date(orderDate);
                orderDay.setHours(0, 0, 0, 0);
                
                if (weekDay.getTime() === orderDay.getTime()) {
                    data[i] += (order.totalAmount || 0);
                    break;
                }
            }
        });
        
        title = 'Doanh thu theo ngày trong tuần';
    } else if (period === 'month') {
        // Doanh thu theo tháng
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        
        labels = Array.from({ length: daysInMonth }, (_, i) => (i + 1).toString());
        data = Array(daysInMonth).fill(0);
        
        orders.forEach(order => {
            const orderDate = new Date(order.orderTime || order.createAt);
            
            if (orderDate.getMonth() === month && orderDate.getFullYear() === year) {
                const day = orderDate.getDate() - 1; // Mảng bắt đầu từ 0
                data[day] += (order.totalAmount || 0);
            }
        });
        
        title = `Doanh thu tháng ${month + 1}/${year}`;
    } else if (period === 'year') {
        // Doanh thu theo năm
        const year = currentDate.getFullYear();
        
        labels = ['T1', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'T8', 'T9', 'T10', 'T11', 'T12'];
        data = Array(12).fill(0);
        
        orders.forEach(order => {
            const orderDate = new Date(order.orderTime || order.createAt);
            
            if (orderDate.getFullYear() === year) {
                const month = orderDate.getMonth();
                data[month] += (order.totalAmount || 0);
            }
        });
        
        title = `Doanh thu năm ${year}`;
    }
    
    // Cập nhật dữ liệu biểu đồ
    if (window.revenueChartInstance) {
        window.revenueChartInstance.data.labels = labels;
        window.revenueChartInstance.data.datasets[0].data = data;
        window.revenueChartInstance.options.plugins.title.text = title;
        window.revenueChartInstance.update();
    }
}

function createProductChart(orders, products) {
    const productChartElement = document.getElementById('productChart');
    if (!productChartElement) {
        console.error('Không tìm thấy element với id "productChart"');
        return;
    }
    
    console.log('Tạo biểu đồ sản phẩm bán chạy với', orders.length, 'đơn hàng và', products.length, 'sản phẩm');
    
    // Tạo danh sách sản phẩm đã bán
    const productSales = {};
    
    orders.forEach(order => {
        // Log để debug cấu trúc đơn hàng
        console.log('Đơn hàng ID:', order.idOrder, 'Chi tiết:', order.orderDetails);
        
        if (order.orderDetails && Array.isArray(order.orderDetails)) {
            order.orderDetails.forEach(detail => {
                // Log để debug cấu trúc chi tiết đơn hàng
                console.log('Chi tiết đơn hàng:', detail);
                
                const productId = detail.product?.idProduct;
                if (productId) {
                    if (!productSales[productId]) {
                        productSales[productId] = {
                            id: productId,
                            name: detail.product.productName || 'Sản phẩm không tên',
                            quantity: 0,
                            revenue: 0
                        };
                    }
                    productSales[productId].quantity += (detail.quantity || 0);
                    productSales[productId].revenue += ((detail.unitPrice || 0) * (detail.quantity || 0));
                }
            });
        } else {
            console.warn('Đơn hàng không có orderDetails hoặc không phải mảng:', order.idOrder);
        }
    });
    
    console.log('Dữ liệu sản phẩm đã bán:', productSales);
    
    // Sắp xếp theo số lượng bán
    const topProducts = Object.values(productSales)
        .sort((a, b) => b.quantity - a.quantity)
        .slice(0, 5);
    
    console.log('Top 5 sản phẩm bán chạy:', topProducts);
    
    // Kiểm tra nếu không có dữ liệu sản phẩm
    if (topProducts.length === 0) {
        console.warn('Không có dữ liệu sản phẩm bán chạy để hiển thị');
        
        // Hiển thị thông báo không có dữ liệu trên biểu đồ
        if (window.productChartInstance) {
            window.productChartInstance.destroy();
        }
        
        const ctx = productChartElement.getContext('2d');
        ctx.font = '16px Arial';
        ctx.fillStyle = '#666';
        ctx.textAlign = 'center';
        ctx.fillText('Không có dữ liệu sản phẩm bán chạy', productChartElement.width / 2, productChartElement.height / 2);
        
        return;
    }
    
    // Tạo biểu đồ sản phẩm bán chạy
    if (window.productChartInstance) {
        window.productChartInstance.destroy();
    }
    
    try {
        window.productChartInstance = new Chart(productChartElement, {
            type: 'pie',
            data: {
                labels: topProducts.map(p => p.name),
                datasets: [{
                    data: topProducts.map(p => p.quantity),
                    backgroundColor: [
                        'rgba(255, 99, 132, 0.7)',
                        'rgba(54, 162, 235, 0.7)',
                        'rgba(255, 206, 86, 0.7)',
                        'rgba(75, 192, 192, 0.7)',
                        'rgba(153, 102, 255, 0.7)'
                    ],
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        position: 'right',
                    },
                    title: {
                        display: true,
                        text: 'Sản phẩm bán chạy'
                    }
                }
            }
        });
        console.log('Biểu đồ sản phẩm bán chạy đã được tạo thành công');
    } catch (error) {
        console.error('Lỗi khi tạo biểu đồ sản phẩm bán chạy:', error);
    }
    
    // Thiết lập sự kiện làm mới biểu đồ
    const refreshButton = document.getElementById('refreshProductChart');
    if (refreshButton) {
        refreshButton.addEventListener('click', function() {
            console.log('Đang làm mới dữ liệu biểu đồ...');
            loadChartData();
        });
    }
}

async function loadSummaryData() {
    try {
        const API_URL = 'http://localhost:8081/api';
        const token = localStorage.getItem('token');
        
        // Tải dữ liệu đơn hàng
        const ordersResponse = await fetch(`${API_URL}/orders`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/json'
            }
        });
        
        if (!ordersResponse.ok) {
            throw new Error('Không thể tải dữ liệu tổng quan');
        }
        
        const orders = await ordersResponse.json();
        
        // Tính toán sản phẩm bán chạy nhất
        const productSales = {};
        orders.forEach(order => {
            if (order.orderDetails) {
                order.orderDetails.forEach(detail => {
                    const productId = detail.product?.idProduct;
                    if (productId) {
                        if (!productSales[productId]) {
                            productSales[productId] = {
                                id: productId,
                                name: detail.product.productName,
                                quantity: 0
                            };
                        }
                        productSales[productId].quantity += (detail.quantity || 0);
                    }
                });
            }
        });
        
        const bestSeller = Object.values(productSales).sort((a, b) => b.quantity - a.quantity)[0];
        
        // Tính thời gian cao điểm
        const hourCounts = Array(24).fill(0);
        orders.forEach(order => {
            const orderDate = new Date(order.orderTime || order.createAt);
            hourCounts[orderDate.getHours()]++;
        });
        
        const busiestHour = hourCounts.indexOf(Math.max(...hourCounts));
        
        // Tính giá trị đơn hàng trung bình
        const totalOrderValue = orders.reduce((sum, order) => sum + (order.totalAmount || 0), 0);
        const avgOrderValue = orders.length > 0 ? totalOrderValue / orders.length : 0;
        
        // Tính số lượng khách hàng thân thiết (đặt hàng >= 3 lần)
        const customerOrders = {};
        orders.forEach(order => {
            if (order.customer?.id) {
                if (!customerOrders[order.customer.id]) {
                    customerOrders[order.customer.id] = 0;
                }
                customerOrders[order.customer.id]++;
            }
        });
        
        const loyalCustomers = Object.values(customerOrders).filter(count => count >= 3).length;
        
        // Cập nhật giao diện
        updateSummaryUI({
            bestSeller: bestSeller ? `${bestSeller.name} (${bestSeller.quantity} đã bán)` : 'Không có dữ liệu',
            busiestTime: `${busiestHour}:00 - ${busiestHour + 1}:00`,
            avgOrderValue: avgOrderValue,
            loyalCustomers: loyalCustomers
        });
    } catch (error) {
        console.error('Lỗi khi tải dữ liệu tổng quan:', error);
        updateSummaryUI({
            bestSeller: 'Không có dữ liệu',
            busiestTime: 'Không có dữ liệu',
            avgOrderValue: 0,
            loyalCustomers: 0
        });
    }
}

function updateSummaryUI(summary) {
    // Cập nhật sản phẩm bán chạy nhất
    const bestSellerElement = document.getElementById('bestSeller');
    if (bestSellerElement) {
        bestSellerElement.textContent = summary.bestSeller;
    }
    
    // Cập nhật giờ cao điểm
    const busiestTimeElement = document.getElementById('busiestTime');
    if (busiestTimeElement) {
        busiestTimeElement.textContent = summary.busiestTime;
    }
    
    // Cập nhật giá trị đơn hàng trung bình
    const avgOrderValueElement = document.getElementById('avgOrderValue');
    if (avgOrderValueElement) {
        avgOrderValueElement.textContent = formatCurrency(summary.avgOrderValue);
    }
    
    // Cập nhật số lượng khách hàng thân thiết
    const loyalCustomersElement = document.getElementById('loyalCustomers');
    if (loyalCustomersElement) {
        loyalCustomersElement.textContent = summary.loyalCustomers;
    }
}

// Helper function to format currency
function formatCurrency(amount) {
    return new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND'
    }).format(amount);
}

// Helper function to format datetime
function formatDateTime(date) {
    return new Intl.DateTimeFormat('vi-VN', {
        hour: '2-digit',
        minute: '2-digit',
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
    }).format(date);
}

// Show loader
function showLoader(show) {
    const loader = document.getElementById('loader');
    if (loader) {
        loader.style.display = show ? 'flex' : 'none';
    }
}

// Show notification
function showNotification(message, type = 'info') {
    // Kiểm tra xem có hàm showNotification từ admin-core.js không
    if (typeof window.AdminCore !== 'undefined' && typeof window.AdminCore.showNotification === 'function') {
        window.AdminCore.showNotification(message, type);
    } else {
        // Fallback: Tạo thông báo đơn giản
        alert(message);
    }
} 