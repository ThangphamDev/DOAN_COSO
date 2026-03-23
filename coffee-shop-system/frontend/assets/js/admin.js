document.addEventListener('DOMContentLoaded', function() {
    
    checkAdminAuthentication();
    
    checkApiConnection();
    
    setupSidebar();
    
    loadDashboardData();


    setupModals();
    
    initializeCharts();
    
    setupForms();
});


function checkAdminAuthentication() {
    const token = localStorage.getItem('token');
    const role = localStorage.getItem('role');
    
    if (!token || !role || !role.toLowerCase().includes('admin')) {
        
        console.warn('Người dùng chưa đăng nhập hoặc không phải admin');
        showMessage('Bạn đang xem dữ liệu admin nhưng chưa đăng nhập. Một số chức năng có thể bị hạn chế.', 'warning');
        
        
        document.getElementById('adminName').textContent = 'Khách';
        return;
    }
    
   
    const fullName = localStorage.getItem('fullName') || 'Admin';
    document.getElementById('adminName').textContent = fullName;
}


async function checkApiConnection() {
    try {
        const API_BASE_URL = 'http://localhost:8081';
        const token = localStorage.getItem('token');
        
        console.log('Đang kiểm tra kết nối đến API...');
        
        const response = await fetch(`${API_BASE_URL}/api/system/health`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'Authorization': token ? `Bearer ${token}` : ''
            }
        });
        
        console.log('API Health Check - Status Code:', response.status);
        
        if (response.ok) {
            const data = await response.json();
            console.log('Trạng thái API:', data);
            
            if (data.status === 'UP' && data.database && data.database.status === 'UP') {
                console.log('Kết nối API và cơ sở dữ liệu hoạt động tốt.');
                showMessage('Kết nối đến máy chủ thành công!', 'success');
            } else {
                console.warn('API hoặc cơ sở dữ liệu có vấn đề.', data);
                showMessage('Cảnh báo: Một số dịch vụ hệ thống có thể không hoạt động đúng cách.', 'warning');
            }
        } else {
            console.warn('API trả về lỗi. Status code:', response.status);
            
            try {
                const errorText = await response.text();
                console.error('API Health Check - Error Response:', errorText);
            } catch (e) {
                console.error('Không thể đọc nội dung phản hồi lỗi');
            }
            
            showMessage('Cảnh báo: API trả về lỗi. Một số chức năng có thể không hoạt động. Vui lòng kiểm tra kết nối máy chủ.', 'warning');
        }
    } catch (error) {
        console.error('Lỗi khi kiểm tra kết nối API:', error);
        showMessage('Cảnh báo: Không thể kết nối đến máy chủ. Một số dữ liệu có thể không hiển thị đúng.', 'warning');
    }
    
    return true;
}

function setupSidebar() {
    const navItems = document.querySelectorAll('.admin-nav li a');
    
    navItems.forEach(item => {
        item.addEventListener('click', function(e) {
            const target = this.getAttribute('href').substring(1);
            
            if (target && !target.includes('://')) {
                e.preventDefault();
                
                document.querySelectorAll('.admin-nav li').forEach(li => {
                    li.classList.remove('active');
                });
                this.parentElement.classList.add('active');
                
                handleNavigation(target);
            }
        });
    });
    
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', function() {
            logout();
        });
    }
}


function handleNavigation(target) {
    if (target === 'dashboard') {
        window.location.href = 'dashboard.html';
    } else if (target === 'staff') {
        window.location.href = 'staff.html';
    } else if (target === 'products') {
        window.location.href = 'products.html';
    } else if (target === 'categories') {
        window.location.href = 'categories.html';
    } else if (target === 'tables') {
        window.location.href = 'tables.html';
    } else if (target === 'orders') {
        window.location.href = 'orders.html';
    } else if (target === 'reports') {
        window.location.href = 'reports.html';
    } else if (target === 'settings') {
        window.location.href = 'settings.html';
    }
}


function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    localStorage.removeItem('userId');
    localStorage.removeItem('fullName');
    
    window.location.href = '../auth/login.html';
}


async function loadDashboardData() {
    showLoader(true);
    
    try {

        const token = localStorage.getItem('token');
        
        console.log('Bắt đầu tải dữ liệu dashboard...');
        
        
        const results = await Promise.allSettled([
            loadSummaryData(token),
            loadRecentActivity(token),
            loadCategories(token),
            loadChartData(token)
        ]);
        
        
        const failures = results.filter(r => r.status === 'rejected');
        if (failures.length > 0) {
            console.warn(`${failures.length} phần dữ liệu không tải được.`);
            
            if (failures.length === results.length) {
                showMessage('Không thể tải dữ liệu dashboard. Vui lòng kiểm tra kết nối và thử lại.', 'error');
            } else {
                showMessage('Một số dữ liệu không thể tải được. Vui lòng làm mới trang nếu cần.', 'warning');
            }
        }
    } catch (error) {
        console.error('Lỗi khi nạp dữ liệu dashboard:', error);
        showMessage('Có lỗi xảy ra khi tải dữ liệu. Vui lòng thử lại sau.', 'error');
    } finally {
        showLoader(false);
    }
}

async function loadSummaryData(token) {
    try {
        const API_BASE_URL = 'http://localhost:8081';
        
        const response = await fetch(`${API_BASE_URL}/api/dashboard/summary`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        });
        
        
        if (response.ok) {
            const data = await response.json();
            console.log('API Dashboard Summary - Data:', data);
            
            document.getElementById('todayRevenue').textContent = data.todayRevenue.toLocaleString('vi-VN');
            document.getElementById('todayOrders').textContent = data.todayOrders;
            document.getElementById('staffCount').textContent = data.staffCount;
            document.getElementById('productCount').textContent = data.productCount;
            document.getElementById('bestSeller').textContent = data.bestSeller || 'Chưa có dữ liệu';
            document.getElementById('busiestTime').textContent = data.busiestTime || 'Chưa có dữ liệu';
            document.getElementById('avgOrderValue').textContent = data.avgOrderValue.toLocaleString('vi-VN') + ' VND';
            
            const loyalCustomersElement = document.getElementById('loyalCustomers');
            if (loyalCustomersElement) {
                loyalCustomersElement.textContent = data.loyalCustomers || '0';
            }
            
            
            updateTrend('revenueTrend', data.revenueTrend);
            updateTrend('ordersTrend', data.ordersTrend);
            updateTrend('staffTrend', data.staffTrend);
            updateTrend('productTrend', data.productTrend);
        } else {
            console.warn('Không thể tải dữ liệu từ API');
            console.warn('Status code:', response.status);
            
            try {
                const errorText = await response.text();
                console.error('API Dashboard Summary - Error:', errorText);
            } catch (e) {
                console.error('Cannot read error response');
            }
            
            document.getElementById('todayRevenue').textContent = '0';
            document.getElementById('todayOrders').textContent = '0';
            document.getElementById('staffCount').textContent = '0';
            document.getElementById('productCount').textContent = '0';
            document.getElementById('bestSeller').textContent = 'Chưa có dữ liệu';
            document.getElementById('busiestTime').textContent = 'Chưa có dữ liệu';
            document.getElementById('avgOrderValue').textContent = '0 VND';
            
            const loyalCustomersElement = document.getElementById('loyalCustomers');
            if (loyalCustomersElement) {
                loyalCustomersElement.textContent = '0';
            }
            
            clearTrends();
            
            showMessage('Không thể kết nối đến máy chủ. Vui lòng thử lại sau.', 'error');
        }
    } catch (error) {
        console.error('Lỗi khi nạp dữ liệu tổng quan:', error);
        
        document.getElementById('todayRevenue').textContent = '0';
        document.getElementById('todayOrders').textContent = '0';
        document.getElementById('staffCount').textContent = '0';
        document.getElementById('productCount').textContent = '0';
        document.getElementById('bestSeller').textContent = 'Chưa có dữ liệu';
        document.getElementById('busiestTime').textContent = 'Chưa có dữ liệu';
        document.getElementById('avgOrderValue').textContent = '0 VND';
        
        const loyalCustomersElement = document.getElementById('loyalCustomers');
        if (loyalCustomersElement) {
            loyalCustomersElement.textContent = '0';
        }
        
        clearTrends();
        
        showMessage('Lỗi kết nối tới máy chủ. Vui lòng thử lại sau.', 'error');
        throw error;
    }
}


function updateTrend(elementId, trendValue) {
    const trendElement = document.getElementById(elementId);
    
    if (!trendElement || trendValue === undefined || trendValue === null) {
        if (trendElement) {
            trendElement.innerHTML = '';
        }
        return;
    }
    
    
    let value = 0;
    let direction = 'no-change';
    
    if (typeof trendValue === 'number') {
        value = trendValue;
        direction = value > 0 ? 'up' : (value < 0 ? 'down' : 'no-change');
    } else if (typeof trendValue === 'object') {
        value = trendValue.value || 0;
        direction = trendValue.direction || (value > 0 ? 'up' : (value < 0 ? 'down' : 'no-change'));
    }
    
    
    const absValue = Math.abs(parseFloat(value)).toFixed(1);
    
    let iconClass = '';
    switch (direction) {
        case 'up':
            iconClass = 'fa-arrow-up';
            trendElement.className = 'trend up';
            break;
        case 'down':
            iconClass = 'fa-arrow-down';
            trendElement.className = 'trend down';
            break;
        default:
            iconClass = 'fa-equals';
            trendElement.className = 'trend no-change';
            break;
    }
    
    trendElement.innerHTML = `<i class="fas ${iconClass}"></i> ${absValue}%`;
}


function clearTrends() {
    const trendElements = ['revenueTrend', 'ordersTrend', 'staffTrend', 'productTrend'];
    
    trendElements.forEach(id => {
        const element = document.getElementById(id);
        if (element) {
            element.innerHTML = '';
        }
    });
}


async function loadRecentActivity(token) {
    try {
        const API_BASE_URL = 'http://localhost:8081';
        
        const response = await fetch(`${API_BASE_URL}/api/activities/recent`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        });
         
        const activityList = document.getElementById('recentActivity');
        activityList.innerHTML = '';
        
        if (response.ok) {
            const data = await response.json();
            console.log('API Activities Recent - Data:', data);
            
            if (data && data.length > 0) {
                data.forEach(item => {
                    const timestamp = new Date(item.time);
                    const formattedTime = timestamp.toLocaleString('vi-VN', {
                        hour: '2-digit',
                        minute: '2-digit',
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric'
                    });
                    
                    const row = document.createElement('tr');
                    row.innerHTML = `
                        <td>${formattedTime}</td>
                        <td>${item.activity}</td>
                        <td>${item.user || 'Hệ thống'}</td>
                        <td>${item.details || '-'}</td>
                    `;
                    activityList.appendChild(row);
                });
            } else {
                const emptyRow = document.createElement('tr');
                emptyRow.innerHTML = `
                    <td colspan="4" class="text-center">Không có hoạt động nào gần đây</td>
                `;
                activityList.appendChild(emptyRow);
            }
        } else {
            console.warn('Không thể tải dữ liệu hoạt động từ API');
            console.warn('Status code:', response.status);
            
            try {
                const errorText = await response.text();
                console.error('API Activities Recent - Error:', errorText);
            } catch (e) {
                console.error('Cannot read error response');
            }
            
            const emptyRow = document.createElement('tr');
            emptyRow.innerHTML = `
                <td colspan="4" class="text-center">Không thể tải dữ liệu hoạt động. Vui lòng thử lại sau.</td>
            `;
            activityList.appendChild(emptyRow);
            
            showMessage('Không thể kết nối đến máy chủ để lấy dữ liệu hoạt động', 'error');
        }
    } catch (error) {
        console.error('Lỗi khi nạp dữ liệu hoạt động gần đây:', error);
        
        const activityList = document.getElementById('recentActivity');
        activityList.innerHTML = '';
        
        const emptyRow = document.createElement('tr');
        emptyRow.innerHTML = `
            <td colspan="4" class="text-center">Lỗi khi tải dữ liệu hoạt động. Vui lòng thử lại sau.</td>
        `;
        activityList.appendChild(emptyRow);
        
        showMessage('Lỗi khi tải dữ liệu hoạt động', 'error');
        throw error;
    }
}

async function loadCategories(token) {
    try {
        const API_BASE_URL = 'http://localhost:8081';
        
        const response = await fetch(`${API_BASE_URL}/api/categories`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        });
        
        
        const productCategorySelect = document.getElementById('productCategory');
        if (productCategorySelect) {
            productCategorySelect.innerHTML = '';
            
            if (response.ok) {
                const data = await response.json();
                console.log('API Categories - Data:', data);
                
                if (data && data.length > 0) {
                    data.forEach(category => {
                        const option = document.createElement('option');
                        option.value = category.id || category.idCategory;
                        option.textContent = category.name;
                        productCategorySelect.appendChild(option);
                    });
                } else {
                    const defaultOption = document.createElement('option');
                    defaultOption.value = "";
                    defaultOption.textContent = "-- Không có danh mục --";
                    defaultOption.disabled = true;
                    defaultOption.selected = true;
                    productCategorySelect.appendChild(defaultOption);
                    
                    const addCategoryBtn = document.getElementById('addCategoryBtn');
                    if (addCategoryBtn) {
                        addCategoryBtn.classList.add('highlight');
                    }
                    
                    showMessage('Chưa có danh mục nào, vui lòng tạo danh mục trước', 'warning');
                }
            } else {
                console.warn('Không thể tải danh mục từ API');
                console.warn('Status code:', response.status);
                
                try {
                    const errorText = await response.text();
                    console.error('API Categories - Error:', errorText);
                } catch (e) {
                    console.error('Cannot read error response');
                }
                
                const defaultOption = document.createElement('option');
                defaultOption.value = "";
                defaultOption.textContent = "-- Không có danh mục --";
                defaultOption.disabled = true;
                defaultOption.selected = true;
                productCategorySelect.appendChild(defaultOption);
                
                showMessage('Không thể tải danh mục từ máy chủ', 'error');
            }
        }
    } catch (error) {
        console.error('Lỗi khi nạp danh sách danh mục:', error);
        
        const productCategorySelect = document.getElementById('productCategory');
        if (productCategorySelect) {
            productCategorySelect.innerHTML = '';
            
            const defaultOption = document.createElement('option');
            defaultOption.value = "";
            defaultOption.textContent = "-- Không có danh mục --";
            defaultOption.disabled = true;
            defaultOption.selected = true;
            productCategorySelect.appendChild(defaultOption);
        }
        
        showMessage('Lỗi khi tải danh mục', 'error');
        throw error;
    }
}


async function loadChartData(token) {
    try {
        const API_BASE_URL = 'http://localhost:8081';
        
        const periodSelect = document.getElementById('revenueChartPeriod');
        const period = periodSelect ? periodSelect.value : 'week';
        
        const response = await fetch(`${API_BASE_URL}/api/dashboard/chart?period=${period}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        });
        
        
        if (response.ok) {
            const data = await response.json();
            console.log('API Chart Data - Data:', data);
            
            if (data && data.revenue) {
                updateRevenueChart(data.revenue);
                
                loadTopProducts(token);
            } else {
                console.warn('Dữ liệu biểu đồ không hợp lệ:', data);
                showMessage('Dữ liệu biểu đồ không hợp lệ', 'warning');
            }
        } else {
            console.warn('Không thể tải dữ liệu biểu đồ từ API');
            console.warn('Status code:', response.status);
            
            try {
                const errorText = await response.text();
                console.error('API Chart Data - Error:', errorText);
            } catch (e) {
                console.error('Cannot read error response');
            }
            
            showMessage('Không thể tải dữ liệu biểu đồ từ máy chủ', 'error');
        }
    } catch (error) {
        console.error('Lỗi khi nạp dữ liệu biểu đồ:', error);
        showMessage('Lỗi khi tải dữ liệu biểu đồ', 'error');
        throw error;
    }
}

async function loadTopProducts(token) {
    try {
        const API_BASE_URL = 'http://localhost:8081';
        
        const response = await fetch(`${API_BASE_URL}/api/dashboard/top-products`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        });
        
        
        if (response.ok) {
            const data = await response.json();
            console.log('API Top Products - Data:', data);
            
            updateProductChart(data);
        } else {
            console.warn('Không thể tải dữ liệu top sản phẩm từ API');
            console.warn('Status code:', response.status);
            
            try {
                const errorText = await response.text();
                console.error('API Top Products - Error:', errorText);
            } catch (e) {
                console.error('Cannot read error response');
            }
            
            showMessage('Không thể tải dữ liệu top sản phẩm từ máy chủ', 'error');
        }
    } catch (error) {
        console.error('Lỗi khi nạp dữ liệu top sản phẩm:', error);
        showMessage('Lỗi khi tải dữ liệu top sản phẩm', 'error');
        throw error;
    }
}

let revenueChart = null;
let productChart = null;


function initializeCharts() {
    if (typeof Chart !== 'undefined') {
        const revenueCtx = document.getElementById('revenueChart');
        if (revenueCtx) {
            revenueChart = new Chart(revenueCtx, {
                type: 'line',
                data: {
                    labels: [],
                    datasets: [{
                        label: 'Doanh thu (triệu đồng)',
                        data: [],
                        borderColor: '#6F4E37',
                        backgroundColor: 'rgba(111, 78, 55, 0.1)',
                        tension: 0.4,
                        fill: true
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            display: true,
                            position: 'top'
                        }
                    },
                    scales: {
                        y: {
                            beginAtZero: true
                        }
                    }
                }
            });
        }
        
        const productCtx = document.getElementById('productChart');
        if (productCtx) {
            productChart = new Chart(productCtx, {
                type: 'doughnut',
                data: {
                    labels: [],
                    datasets: [{
                        data: [],
                        backgroundColor: [
                            '#6F4E37', 
                            '#C4A484', 
                            '#F5DEB3', 
                            '#DEB887',
                            '#D2B48C'
                        ]
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            position: 'right'
                        }
                    }
                }
            });
        }
        
        
        const revenueChartPeriod = document.getElementById('revenueChartPeriod');
        if (revenueChartPeriod) {
            revenueChartPeriod.addEventListener('change', async function() {
                const token = localStorage.getItem('token');
                await loadChartData(token);
            });
        }
        
        
        const refreshProductChart = document.getElementById('refreshProductChart');
        if (refreshProductChart) {
            refreshProductChart.addEventListener('click', async function() {
                const token = localStorage.getItem('token');
                await loadChartData(token);
            });
        }
    } else {
        console.warn('Chart.js không được tìm thấy, biểu đồ sẽ không được hiển thị.');
    }
}


function updateRevenueChart(data) {
    if (revenueChart) {
        
        if (!data || !data.labels || !data.data) {
            console.warn('Dữ liệu biểu đồ doanh thu không hợp lệ:', data);
            
            revenueChart.data.labels = [];
            revenueChart.data.datasets[0].data = [];
            revenueChart.update();
            return;
        }
        
        console.log('Cập nhật biểu đồ doanh thu với:', data);
        
        revenueChart.data.labels = data.labels;
        revenueChart.data.datasets[0].data = data.data;
        revenueChart.update();
    } else {
        console.warn('Biểu đồ doanh thu chưa được khởi tạo');
    }
}

function updateProductChart(data) {
    if (productChart && data) {
        productChart.data.labels = data.labels;
        productChart.data.datasets[0].data = data.data;
        productChart.update();
    }
}

function setupModals() {
    const modalBtns = {
        'addStaffBtn': 'staffModal',
        'addProductBtn': 'productModal',
        'addCategoryBtn': 'categoryModal',
        'addTableBtn': 'tableModal',
        'addPromotionBtn': 'promotionModal'
    };
    
    Object.keys(modalBtns).forEach(btn => {
        const button = document.getElementById(btn);
        const modal = document.getElementById(modalBtns[btn]);
        
        if (button && modal) {
            button.addEventListener('click', () => {
                modal.style.display = 'flex';
            });
            
            const closeBtn = modal.querySelector('.close-btn');
            if (closeBtn) {
                closeBtn.addEventListener('click', () => {
                    modal.style.display = 'none';
                });
            }
            
            window.addEventListener('click', (e) => {
                if (e.target === modal) {
                    modal.style.display = 'none';
                }
            });
        }
    });
}

function setupForms() {
    const addStaffForm = document.getElementById('addStaffForm');
    if (addStaffForm) {
        addStaffForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            await handleAddStaff();
        });
    }
    
    const addProductForm = document.getElementById('addProductForm');
    if (addProductForm) {
        addProductForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            await handleAddProduct();
        });
    }
}

async function handleAddStaff() {
    try {
        const username = document.getElementById('staffUsername').value.trim();
        const fullName = document.getElementById('staffFullName').value.trim();
        const password = document.getElementById('staffPassword').value.trim();
        const phone = document.getElementById('staffPhone').value.trim();
        const role = document.getElementById('staffRole').value;
        const address = document.getElementById('staffAddress') ? document.getElementById('staffAddress').value.trim() : '';
        const imageFile = document.getElementById('staffImage').files[0];
        
        if (!username) {
            showMessage('Vui lòng nhập tên đăng nhập', 'error');
            return;
        }
        
        if (!fullName) {
            showMessage('Vui lòng nhập họ tên', 'error');
            return;
        }
        
        if (!password || password.length < 6) {
            showMessage('Mật khẩu phải có ít nhất 6 ký tự', 'error');
            return;
        }
        
        showLoader(true);
        
        const formData = new FormData();
        formData.append('userName', username);
        formData.append('fullName', fullName);
        formData.append('passWord', password);
        
        if (phone) formData.append('phone', phone);
        if (address) formData.append('address', address);
        
        formData.append('role', role);
        
        if (imageFile) {
            formData.append('image', imageFile);
        }
        
        const API_BASE_URL = 'http://localhost:8081';
        const token = localStorage.getItem('token');
        
        console.log('Đang thêm nhân viên với dữ liệu:', {
            userName: username,
            fullName: fullName,
            phone: phone,
            address: address,
            role: role,
            hasImage: !!imageFile
        });
        
        console.log('Gửi request đến:', `${API_BASE_URL}/api/accounts/with-image`);
        
        const response = await fetch(`${API_BASE_URL}/api/accounts/with-image`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`
            },
            body: formData
        });
        
        console.log('Nhận phản hồi - Status:', response.status);
        
        if (response.ok) {
            const responseData = await response.json();
            console.log('Thêm nhân viên thành công:', responseData);
            
            showMessage(`Thêm nhân viên ${fullName} thành công!`, 'success');
            
            document.getElementById('staffModal').style.display = 'none';
            document.getElementById('addStaffForm').reset();
            
            const imagePreview = document.getElementById('staffImagePreview');
            if (imagePreview) {
                imagePreview.style.backgroundImage = '';
                imagePreview.textContent = 'Chọn ảnh để xem trước';
            }
            
            await loadDashboardData();
            
            return responseData;
        } else {
            let errorData;
            try {
                const errorText = await response.text();
                console.error('API Error Response:', errorText);
                try {
                    errorData = JSON.parse(errorText);
                } catch (e) {
                    errorData = { message: errorText || `Lỗi: Mã trạng thái ${response.status}` };
                }
            } catch (e) {
                errorData = { message: `Lỗi: Mã trạng thái ${response.status}` };
            }
            
            if (response.status === 409) {
                throw new Error('Tên đăng nhập đã tồn tại, vui lòng chọn tên khác');
            } else if (response.status === 400) {
                throw new Error(errorData.message || 'Dữ liệu đầu vào không hợp lệ');
            } else {
                throw new Error(errorData.message || 'Không thể thêm nhân viên');
            }
        }
    } catch (error) {
        console.error('Lỗi khi thêm nhân viên:', error);
        showMessage(error.message || 'Có lỗi xảy ra khi thêm nhân viên', 'error');
    } finally {
        showLoader(false);
    }
}


async function handleAddProduct() {
    try {
        const name = document.getElementById('productName').value.trim();
        const categoryId = document.getElementById('productCategory').value;
        const price = document.getElementById('productPrice').value;
        const description = document.getElementById('productDescription').value.trim();
        const status = document.getElementById('productStatus').value;
        const imageFile = document.getElementById('productImage').files[0];
        
        if (!name) {
            showMessage('Vui lòng nhập tên sản phẩm', 'error');
            return;
        }
        
        if (!categoryId) {
            showMessage('Vui lòng chọn danh mục sản phẩm', 'error');
            return;
        }
        
        if (!price || isNaN(price) || Number(price) <= 0) {
            showMessage('Vui lòng nhập giá hợp lệ', 'error');
            return;
        }
        
        showLoader(true);
        
        const formData = new FormData();
        formData.append('productName', name);
        formData.append('categoryId', categoryId);
        formData.append('price', price);
        formData.append('description', description);
        formData.append('isAvailable', status === '1');
        
        if (imageFile) {
            formData.append('image', imageFile);
        }
        
        const API_BASE_URL = 'http://localhost:8081';
        const token = localStorage.getItem('token');
        
        const response = await fetch(`${API_BASE_URL}/api/products/with-image`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`
            },
            body: formData
        });
        
        console.log('Nhận phản hồi - Status:', response.status);
        
        if (response.ok) {
            const responseData = await response.json();
            console.log('Thêm sản phẩm thành công:', responseData);
            
            showMessage(`Thêm sản phẩm ${name} thành công!`, 'success');
            
            document.getElementById('productModal').style.display = 'none';
            document.getElementById('addProductForm').reset();
            
            const imagePreview = document.getElementById('productImagePreview');
            if (imagePreview) {
                imagePreview.style.backgroundImage = '';
                imagePreview.textContent = 'Chọn ảnh để xem trước';
            }
            
            await loadDashboardData();
            
            return responseData;
        } else {
            let errorData;
            try {
                const errorText = await response.text();
                console.error('API Error Response:', errorText);
                try {
                    errorData = JSON.parse(errorText);
                } catch (e) {
                    errorData = { message: errorText || `Lỗi: Mã trạng thái ${response.status}` };
                }
            } catch (e) {
                errorData = { message: `Lỗi: Mã trạng thái ${response.status}` };
            }
            
            throw new Error(errorData.message || 'Không thể thêm sản phẩm');
        }
    } catch (error) {
        console.error('Lỗi khi thêm sản phẩm:', error);
        showMessage(error.message || 'Có lỗi xảy ra khi thêm sản phẩm', 'error');
    } finally {
        showLoader(false);
    }
}


function showLoader(show) {
    const loader = document.getElementById('loader');
    if (loader) {
        loader.style.display = show ? 'flex' : 'none';
    }
}


function showMessage(message, type = 'info') {
    let messageContainer = document.getElementById('messageContainer');
    if (!messageContainer) {
        messageContainer = document.createElement('div');
        messageContainer.id = 'messageContainer';
        messageContainer.className = 'message-container';
        document.body.appendChild(messageContainer);
    }
    
    const messageBox = document.createElement('div');
    messageBox.className = `message ${type}`;
    messageBox.innerHTML = `
        <span class="message-icon">${getIconForType(type)}</span>
        <span class="message-text">${message}</span>
        <button class="message-close">&times;</button>
    `;
    
    messageContainer.appendChild(messageBox);
    
    setTimeout(() => {
        messageBox.classList.add('show');
    }, 10);
    
    const closeButton = messageBox.querySelector('.message-close');
    if (closeButton) {
        closeButton.addEventListener('click', () => {
            messageBox.classList.remove('show');
            messageBox.classList.add('hide');
            setTimeout(() => {
                if (messageBox.parentElement && messageContainer.contains(messageBox)) {
                    messageContainer.removeChild(messageBox);
                }
            }, 300);
        });
    }
    
    setTimeout(() => {
        if (messageBox && document.body.contains(messageContainer)) {
            messageBox.classList.remove('show');
            messageBox.classList.add('hide');
            setTimeout(() => {
                if (messageBox.parentElement && messageContainer.contains(messageBox)) {
                    messageContainer.removeChild(messageBox);
                }
            }, 300);
        }
    }, 5000);
}


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