if (typeof API_BASE_URL === 'undefined') {
    // Sử dụng URL từ api-client.js nếu có
    if (window.ApiClient && window.ApiClient.baseUrl) {
        console.log('Sử dụng API_BASE_URL từ ApiClient.baseUrl:', window.ApiClient.baseUrl);
        window.API_BASE_URL = window.ApiClient.baseUrl;
    } else {
        // Fallback URL
        console.warn('API_BASE_URL không được định nghĩa, sử dụng URL mặc định');
        window.API_BASE_URL = 'http://localhost:8081/api';
    }
}


window.cachedCategories = [];

document.addEventListener('DOMContentLoaded', function() {
    // Kiểm tra API client đã được tải chưa
    if (!window.ApiClient) {
        console.error('API Client chưa được tải!');
        if (window.AdminCore) {
            window.AdminCore.showNotification('Không thể kết nối đến server', 'error');
        }
        return;
    }

    
    const style = document.createElement('style');
    style.innerHTML = `
        .category-uncategorized {
            color: #e74c3c;
            font-style: italic;
            background-color: #f9eaea;
            padding: 3px 8px;
            border-radius: 4px;
            display: inline-block;
        }
    `;
    document.head.appendChild(style);

   
    const currentPage = window.location.pathname.split('/').pop();
    
    // Khởi tạo các chức năng tùy theo trang
    if (currentPage === 'user.html') {
        initializeUserManagement();
    } 
    else if (currentPage === 'products.html') {
        initializeProductManagement(); 
    }
    else if (currentPage === 'staff.html') {
        initializeStaffManagement();
    }
    else if (currentPage === 'categories.html') {
        initializeCategoryManagement();
    }
});


function initializeUserManagement() {
    console.log('Khởi tạo chức năng quản lý người dùng');
    
    // Tải dữ liệu người dùng
    loadUserData();
    
    // Khởi tạo modal thêm/sửa người dùng
    initializeModal('userModal', 'addUserBtn');
    
    // Xử lý form thêm/sửa người dùng
    setupUserFormSubmission();
    
    // Xử lý tìm kiếm người dùng
    setupSearchFilter('searchUser', filterUsers);
}


async function loadUserData() {
    showLoadingMessage('Đang tải dữ liệu người dùng...');
    
    try {
        // Gọi API để lấy danh sách người dùng
        const users = await ApiClient.User.getAllUsers();
        displayUsers(users);
        
        showSuccessMessage('Đã tải dữ liệu người dùng thành công');
    } catch (error) {
        console.error('Lỗi khi tải dữ liệu người dùng:', error);
        showErrorMessage('Lỗi kết nối API: ' + error.message + '. Vui lòng kiểm tra server API có đang chạy không.');
    }
}

// Hiển thị danh sách người dùng
function displayUsers(users) {
    const tableBody = document.getElementById('userTableBody');
    if (!tableBody) return;
    
    tableBody.innerHTML = '';
    
    users.forEach(user => {
        const row = document.createElement('tr');
        
        // Tạo các cột dữ liệu
        row.innerHTML = `
            <td>${user.id}</td>
            <td>${user.username}</td>
            <td>${user.fullName}</td>
            <td>${formatRole(user.role)}</td>
            <td class="actions">
                <button class="btn-icon edit-user" data-id="${user.id}" title="Chỉnh sửa"><i class="fas fa-edit"></i></button>
                <button class="btn-icon delete-user" data-id="${user.id}" title="Xóa"><i class="fas fa-trash-alt"></i></button>
            </td>
        `;
        
        tableBody.appendChild(row);
    });
    
 
    setupUserActions();
}


function setupUserFormSubmission() {
    const form = document.getElementById('userForm');
    if (!form) return;
    
    form.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        
        if (!validateUserForm()) {
            return;
        }
        
        
        const userData = {
            id: document.getElementById('userId').value,
            username: document.getElementById('username').value,
            fullName: document.getElementById('fullName').value,
            password: document.getElementById('password').value,
            role: document.getElementById('role').value,
            phone: document.getElementById('phone').value,
            address: document.getElementById('address').value
        };
        
        
        const isUpdate = userData.id !== '';
        
        try {
            showLoadingMessage(`Đang ${isUpdate ? 'cập nhật' : 'thêm'} người dùng...`);
            
            if (isUpdate) {
                
                await ApiClient.User.updateUser(userData.id, userData);
            } else {
                
                await ApiClient.User.createUser(userData);
            }
            
            
            closeModal('userModal');
            
            
            loadUserData();
            
            showSuccessMessage(`Đã ${isUpdate ? 'cập nhật' : 'thêm'} người dùng thành công`);
        } catch (error) {
            console.error(`Lỗi khi ${isUpdate ? 'cập nhật' : 'thêm'} người dùng:`, error);
            showErrorMessage(`Có lỗi xảy ra khi ${isUpdate ? 'cập nhật' : 'thêm'} người dùng`);
        }
    });
}


function initializeProductManagement() {
    console.log('Khởi tạo chức năng quản lý sản phẩm');
    
   
    const statusStyle = document.createElement('style');
    statusStyle.innerHTML = `
        .product-status-badge {
            padding: 5px 10px;
            border-radius: 4px;
            font-weight: bold;
            display: inline-block;
            min-width: 100px;
            text-align: center;
        }
        .status-active {
            background-color: #28a745 !important;
            color: white !important;
        }
        .status-inactive {
            background-color: #dc3545 !important;
            color: white !important;
        }
        .btn-toggle-status {
            margin-left: 8px;
            background: #f8f9fa;
            border: 1px solid #dee2e6;
            border-radius: 4px;
            padding: 4px 8px;
            cursor: pointer;
            transition: all 0.2s;
        }
        .btn-toggle-status:hover {
            background: #e9ecef;
        }
        .product-status-container {
            display: flex;
            align-items: center;
            justify-content: center;
        }
    `;
    document.head.appendChild(statusStyle);
    
    checkApiServerStatus();
    loadCategoriesForDropdown().then(() => {
        setupCategoryFilter();
        // Nếu có tham số category trên URL thì lọc luôn
        const urlParams = new URLSearchParams(window.location.search);
        const categoryParam = urlParams.get('category');
        if (categoryParam && categoryParam !== 'all') {
            const filter = document.getElementById('categoryFilter');
            if (filter) filter.value = categoryParam;
            // Gọi filter theo danh mục
            categoryFilter.dispatchEvent(new Event('change'));
        } else {
            // Mặc định: load tất cả sản phẩm từ các danh mục
            loadAllProductsByAllCategories();
        }
    });
    initializeModal('productModal', 'addProductBtn');
    setupProductFormSubmission();
    setupSearchFilter('searchProduct', filterProducts);
    addRefreshButton();
}


async function checkApiServerStatus() {
    try {
       
        const response = await fetch(`${API_BASE_URL}/products`, { 
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            },
            signal: AbortSignal.timeout(3000) 
        });
        
        if (response.ok) {
            console.log('API server đang hoạt động bình thường');
            showSuccessMessage('Kết nối đến máy chủ thành công');
        } else {
            console.warn('API server có vấn đề. Status:', response.status);
            showErrorMessage('Máy chủ có vấn đề, một số chức năng có thể không hoạt động đúng');
        }
    } catch (error) {
        console.error('Không thể kết nối đến API server:', error);
        showErrorMessage('Không thể kết nối đến máy chủ. Vui lòng kiểm tra kết nối mạng và đảm bảo server API đang chạy.');
        
        // Hiển thị thông báo lỗi chi tiết trên giao diện
        const tableBody = document.getElementById('productTableBody') || document.getElementById('products-table-body');
        if (tableBody) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="7" class="text-center error-message">
                        <div class="alert alert-danger">
                            <i class="fas fa-exclamation-triangle"></i>
                            <p>Không thể kết nối đến máy chủ API</p>
                            <p>Lỗi: ${error.message}</p>
                            <p>Vui lòng kiểm tra:</p>
                            <ul class="text-left">
                                <li>Server API đang chạy (${API_BASE_URL})</li>
                                <li>Kết nối mạng của bạn</li>
                                <li>Cấu hình CORS trên server</li>
                            </ul>
                            <button class="btn btn-primary mt-3" onclick="window.AdminEntities.loadProductData()">
                                <i class="fas fa-sync-alt"></i> Thử lại
                            </button>
                        </div>
                    </td>
                </tr>
            `;
        }
    }
}

let isLoadingProducts = false;
let isLoadingCategories = false;


// Tải dữ liệu sản phẩm
async function loadProductData() {
    // Tránh tải nhiều lần liên tục
    if (isLoadingProducts) return;
    isLoadingProducts = true;
    
    showLoadingMessage('Đang tải dữ liệu sản phẩm...');
    
    try {
        // Kiểm tra trước nếu chúng ta đã có ApiClient
        if (!window.ApiClient || !window.ApiClient.Product) {
            console.error('API Client không khả dụng');
            showErrorMessage('API Client không khả dụng. Vui lòng làm mới trang.');
            isLoadingProducts = false;
            return;
        }
        
        // Danh mục mẫu để sử dụng khi API không trả về danh mục
        const sampleCategories = [
            { id: 1, name: 'Cà phê' },
            { id: 2, name: 'Trà' },
            { id: 3, name: 'Bánh' },
            { id: 4, name: 'Đồ uống đá xay' },
            { id: 5, name: 'Đồ ăn nhẹ' }
        ];
        
        // Tải danh mục trước
        let categories = [];
        try {
            categories = await ApiClient.Category.getAllCategories();
            console.log('Đã tải danh mục từ API:', categories);
            
            // Kiểm tra nếu API không trả về danh mục, sử dụng danh mục mẫu
            if (!categories || categories.length === 0) {
                console.warn('API không trả về danh mục nào, sử dụng danh mục mẫu');
                categories = sampleCategories;
            }
            
            // Cập nhật danh mục vào biến toàn cục
            window.cachedCategories = categories;
            console.log('Đã cập nhật cachedCategories:', window.cachedCategories);
        } catch (categoryError) {
            console.error('Lỗi khi tải danh mục từ API:', categoryError);
            // Sử dụng danh mục mẫu khi có lỗi
            categories = sampleCategories;
            window.cachedCategories = sampleCategories;
        }
        
        // Ghi log số lượng danh mục đã tải
        console.log(`Đã tải ${categories.length} danh mục:`, categories.map(c => c.name || c.categoryName).join(', '));
        
        // Tạo map danh mục để tra cứu nhanh
        const categoryMap = {};
        if (categories && categories.length > 0) {
            categories.forEach(category => {
                const categoryId = category.id || category.idCategory;
                if (categoryId) {
                    categoryMap[categoryId] = category;
                }
            });
        }
        
        // Gọi API để lấy danh sách sản phẩm
        const products = await ApiClient.Product.getAllProducts();
        console.log('Dữ liệu sản phẩm thô từ API:', products);
        
        // Trường hợp API trả về null hoặc không phải array
        if (!products || !Array.isArray(products)) {
            console.error('API trả về dữ liệu sản phẩm không hợp lệ:', products);
            showErrorMessage('API trả về dữ liệu sản phẩm không hợp lệ. Vui lòng kiểm tra log console.');
            isLoadingProducts = false;
            return;
        }
        
        // Debug: In ra thông tin chi tiết về từng sản phẩm
        console.log('Chi tiết từng sản phẩm:');
        products.forEach((product, index) => {
            if (product === undefined) {
                console.error(`Sản phẩm #${index} là undefined!`);
            } else {
                console.log(`Sản phẩm #${index}:`, {
                    id: product.id || product.idProduct,
                    name: product.name || product.productName,
                    categoryInfo: {
                        categoryId: product.categoryId,
                        categoryName: product.categoryName,
                        hasCategory: !!product.category
                    }
                });
            }
        });
        
        // Lọc ra sản phẩm undefined
        const validProducts = products.filter(product => product !== undefined);
        
        if (validProducts.length < products.length) {
            console.warn(`Đã lọc ra ${products.length - validProducts.length} sản phẩm undefined`);
        }
        
        // Đính kèm thông tin danh mục vào sản phẩm
        if (validProducts && validProducts.length > 0) {
            validProducts.forEach(product => {
                // Trường hợp product là "undefined" - bỏ qua
                if (!product) return;
                
                // Kiểm tra xem sản phẩm đã có thông tin danh mục chưa
                if (product.category && (product.category.name || product.category.categoryName)) {
                    // Sản phẩm đã có danh mục đầy đủ, không cần gán thêm
                    console.log(`Sản phẩm "${product.name || product.productName}" đã có danh mục: ${product.category.name || product.category.categoryName}`);
                    return;
                }
                
                if (product.categoryName) {
                    // Sản phẩm đã có tên danh mục, chỉ cần gán object nếu có
                    console.log(`Sản phẩm "${product.name || product.productName}" đã có tên danh mục: ${product.categoryName}`);
                    
                    // Tìm danh mục phù hợp từ tên danh mục
                    const matchingCategory = categories.find(c => 
                        (c.name && c.name.toLowerCase() === product.categoryName.toLowerCase()) || 
                        (c.categoryName && c.categoryName.toLowerCase() === product.categoryName.toLowerCase())
                    );
                    
                    if (matchingCategory) {
                        product.category = matchingCategory;
                        product.categoryId = matchingCategory.id || matchingCategory.idCategory;
                    }
                    
                    return;
                }
                
                // Lấy ID danh mục từ các nguồn có thể
                let categoryId = product.categoryId || product.category_id || (product.category ? (product.category.id || product.category.idCategory) : null);
                
                if (categoryId && categoryMap[categoryId]) {
                    // Gán thông tin danh mục từ map
                    product.categoryName = categoryMap[categoryId].name || categoryMap[categoryId].categoryName;
                    product.category = categoryMap[categoryId];
                    console.log(`Sản phẩm "${product.name || product.productName}" được gán danh mục: ${product.categoryName}`);
                } else {
                    // KHÔNG gán danh mục ngẫu nhiên nữa - sử dụng "Chưa phân loại" thay vì đoán
                    product.categoryName = 'Chưa phân loại';
                    console.log(`Sản phẩm "${product.name || product.productName}" không có danh mục, đánh dấu là "Chưa phân loại"`);
                }
            });
        }
        
        try {
            displayProducts(validProducts);
        showSuccessMessage('Đã tải dữ liệu sản phẩm thành công');
        } catch (displayError) {
            console.error('Lỗi khi hiển thị sản phẩm:', displayError);
            showErrorMessage('Không thể hiển thị sản phẩm: ' + displayError.message);
        }
    } catch (error) {
        console.error('Lỗi khi tải dữ liệu sản phẩm:', error);
        showErrorMessage('Lỗi kết nối API: ' + error.message + '. Vui lòng kiểm tra server API có đang chạy không.');
    } finally {
        // Đặt timeout để tránh gọi liên tục
        setTimeout(() => {
            isLoadingProducts = false;
        }, 2000);
    }
}

// Tải danh sách danh mục cho dropdown
async function loadCategoriesForDropdown() {
    // Tránh tải nhiều lần liên tục
    if (isLoadingCategories) return;
    isLoadingCategories = true;
    
    try {
        // Nếu đã có danh mục trong cache, sử dụng chúng
        let categories = [];
        
        if (window.cachedCategories && window.cachedCategories.length > 0) {
            categories = window.cachedCategories;
            console.log('Sử dụng danh mục từ cache:', categories);
        } else {
            console.log('Không có danh mục trong cache, tải từ API...');
            
            // Gọi API để lấy danh sách danh mục
            try {
                categories = await ApiClient.Category.getAllCategories();
                console.log('Danh mục từ API:', categories);
                
                // Lưu vào cache
                if (categories && categories.length > 0) {
                    window.cachedCategories = categories;
                    console.log('Đã cập nhật cache với', categories.length, 'danh mục');
                } else {
                    console.warn('API trả về danh sách danh mục rỗng hoặc không hợp lệ');
                }
            } catch (apiError) {
                console.error('Lỗi khi tải danh mục từ API:', apiError);
                // Không làm gì, sẽ xử lý ở dưới
            }
        }
        
        const categoryDropdown = document.getElementById('category');
        const categoryFilter = document.getElementById('categoryFilter');
        
        // Ghi log danh sách các danh mục
        if (categories && categories.length > 0) {
            console.log('Danh sách danh mục để đổ vào dropdown:');
            categories.forEach((cat, index) => {
                console.log(`${index + 1}. ID: ${cat.id || cat.idCategory}, Tên: ${cat.name || cat.categoryName}`);
            });
        }
        
        // Kiểm tra nếu không có danh mục hoặc danh sách rỗng
        if (!categories || categories.length === 0) {
            console.warn('Không có danh mục khả dụng, sử dụng danh mục mẫu');
            useSampleCategories(categoryDropdown, categoryFilter);
            return;
        }
        
        // Cập nhật dropdown sản phẩm
        if (categoryDropdown) {
            categoryDropdown.innerHTML = '<option value="">-- Chọn danh mục --</option>';
            categories.forEach(category => {
                const option = document.createElement('option');
                const categoryId = category.id || category.idCategory;
                const categoryName = category.name || category.categoryName;
                
                option.value = categoryId;
                option.textContent = categoryName;
                categoryDropdown.appendChild(option);
            });
            
            console.log('Đã cập nhật dropdown sản phẩm với', categories.length, 'danh mục');
        }
        
        // Cập nhật dropdown lọc
        if (categoryFilter) {
            // Đảm bảo giữ lại tùy chọn "Tất cả danh mục"
            categoryFilter.innerHTML = '<option value="all">Tất cả danh mục</option>';
            categories.forEach(category => {
                const option = document.createElement('option');
                const categoryId = category.id || category.idCategory;
                const categoryName = category.name || category.categoryName;
                
                option.value = categoryId;
                option.textContent = categoryName;
                categoryFilter.appendChild(option);
            });
            
            console.log('Đã cập nhật dropdown lọc với', categories.length, 'danh mục');
        }
        
        // Hiển thị thông báo thành công
        showSuccessMessage(`Đã tải ${categories.length} danh mục`);
    } catch (error) {
        console.error('Lỗi khi tải danh mục cho dropdown:', error);
        showErrorMessage('Không thể tải danh mục. Vui lòng thử lại sau.');
        
        // Sử dụng danh mục mẫu khi có lỗi
        const categoryDropdown = document.getElementById('category');
        const categoryFilter = document.getElementById('categoryFilter');
        useSampleCategories(categoryDropdown, categoryFilter);
    } finally {
        // Đặt timeout để tránh gọi liên tục
        setTimeout(() => {
            isLoadingCategories = false;
        }, 2000);
    }
}

// Sử dụng danh mục mẫu khi không thể tải từ API
function useSampleCategories(categoryDropdown, categoryFilter) {
    const sampleCategories = [
        { id: 1, name: 'Cà phê' },
        { id: 2, name: 'Trà' },
        { id: 3, name: 'Bánh' },
        { id: 4, name: 'Đồ uống đá xay' },
        { id: 5, name: 'Đồ ăn nhẹ' }
    ];
    
    if (categoryDropdown) {
        categoryDropdown.innerHTML = '<option value="">-- Chọn danh mục --</option>';
        sampleCategories.forEach(category => {
            const option = document.createElement('option');
            option.value = category.id;
            option.textContent = category.name;
            categoryDropdown.appendChild(option);
        });
    }
    
    if (categoryFilter) {
        categoryFilter.innerHTML = '<option value="all">Tất cả danh mục</option>';
        sampleCategories.forEach(category => {
            const option = document.createElement('option');
            option.value = category.id;
            option.textContent = category.name;
            categoryFilter.appendChild(option);
        });
    }
}

// Hiển thị danh sách sản phẩm
function displayProducts(products) {
    try {
        // Log tổng quan về dữ liệu sản phẩm
        console.log(`Hiển thị ${products ? products.length : 0} sản phẩm`);
        
        if (products && products.length > 0) {
            // Ghi ra log kiểm tra trạng thái của các sản phẩm
            products.forEach(product => {
                console.log(`Sản phẩm ID ${product.id || product.idProduct}: Tên=${product.name || product.productName}, Status=${product.status}, isAvailable=${product.isAvailable}`);
            });
        }
        
        // Lấy phần tử hiển thị
        const tableBody = document.getElementById('productTableBody');
    if (!tableBody) {
            console.error('Không tìm thấy bảng sản phẩm');
        return;
    }
    
        // Xóa toàn bộ dữ liệu cũ
    tableBody.innerHTML = '';
    
        // Kiểm tra kiểu dữ liệu
    if (!products || products.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="6" class="text-center">Không có sản phẩm nào</td></tr>';
        return;
    }
    
        // Kiểm tra xem nên sử dụng định dạng hiển thị nào (cũ hoặc mới)
        if (window.useNewProductFormat === true) {
        displayProductsNewFormat(products, tableBody);
    } else {
        displayProductsOldFormat(products, tableBody);
        }
    } catch (error) {
        console.error('Lỗi hiển thị sản phẩm:', error);
    }
}

// Hiển thị sản phẩm với định dạng mới
function displayProductsNewFormat(products, tableBody) {
    console.log('Dữ liệu truyền vào displayProductsNewFormat:', products);
    // Đảm bảo products là một mảng hợp lệ
    if (!products || !Array.isArray(products)) {
        console.error('Dữ liệu sản phẩm không hợp lệ:', products);
        tableBody.innerHTML = '<tr><td colspan="7" class="text-center">Không thể hiển thị sản phẩm do dữ liệu không hợp lệ</td></tr>';
        return;
    }
    
    // Lọc bỏ các sản phẩm undefined
    const validProducts = products.filter(product => product !== undefined);
    
    if (validProducts.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="7" class="text-center">Không có sản phẩm nào</td></tr>';
        return;
    }
    
    // Debug: In ra thông tin chi tiết về từng sản phẩm
    console.log('Chi tiết sản phẩm trước khi hiển thị:');
    validProducts.forEach((product, index) => {
        // Xác định đúng tên hiển thị cho sản phẩm dựa vào các trường có thể có
        const displayName = product.name || product.productName || 'Sản phẩm không tên';
        
        console.log(`Sản phẩm #${index}:`, {
            id: product.id || product.idProduct,
            name: displayName,
            productName: product.productName,
            name_field: product.name,
            status: product.status,
            isAvailable: product.isAvailable,
            categoryInfo: {
                categoryId: product.categoryId,
                categoryName: product.categoryName,
                hasCategory: !!product.category
            }
        });
    });
    
    // Xóa nội dung cũ trước khi thêm mới
    tableBody.innerHTML = '';
    
    // Tạo hàng cho mỗi sản phẩm
    validProducts.forEach((product, index) => {
        const row = document.createElement('tr');
        // Lấy đúng key từ dữ liệu API
        const productId = product.id || product.idProduct;
        const productName = product.name || product.productName || 'Sản phẩm không tên';
        
        // Kiểm tra trạng thái sản phẩm (đang bán hay ngừng bán)
        // Kiểm tra tất cả các trường có thể chứa thông tin trạng thái
        const isProductAvailable = 
            product.status === 'active' || 
            product.status === true || 
            product.status === 1 || 
            product.isAvailable === true || 
            product.isAvailable === 1;
            
        console.log(`Sản phẩm ${productName} (ID: ${productId}): status=${product.status}, isAvailable=${product.isAvailable}, Kết quả=${isProductAvailable ? 'Đang bán' : 'Ngừng bán'}`);
        
        // Ảnh sản phẩm
        let productImage = '/assets/images/default-product.png';
        if (product.image) {
            if (!product.image.startsWith('data:') && !product.image.startsWith('http')) {
                productImage = `${API_BASE_URL}/products/images/${product.image}`;
            } else {
                productImage = product.image;
            }
        }
        // Danh mục
        let categoryName = product.categoryName || 'Chưa phân loại';
        let isCategorized = !!product.categoryName;
        if (!isCategorized && product.category && (product.category.name || product.category.categoryName)) {
            categoryName = product.category.name || product.category.categoryName;
            isCategorized = true;
        }
        const categoryDisplay = isCategorized ? categoryName : `<span class="category-uncategorized">${categoryName}</span>`;
        // Tạo HTML cho hàng sản phẩm
        row.innerHTML = `
            <td>${index + 1}</td>
            <td>
                <img src="${productImage}" alt="${productName}" class="product-thumbnail" 
                     onerror="this.onerror=null; this.src='/assets/images/default-product.png'">
            </td>
            <td>${productName}</td>
            <td>${(product.price || 0).toLocaleString()} VNĐ</td>
            <td>${categoryDisplay}</td>
            <td>
                <div class="product-status-container">
                    <span class="product-status-badge ${isProductAvailable ? 'status-active' : 'status-inactive'}">
                        ${isProductAvailable ? 'Đang bán' : 'Ngừng bán'}
                    </span>
                    <button class="btn-toggle-status" data-id="${productId}" 
                            data-status="${isProductAvailable ? 'active' : 'inactive'}">
                        <i class="fas fa-exchange-alt"></i>
                    </button>
                </div>
            </td>
            <td>
                <button class="btn btn-sm btn-primary edit-product-btn" data-id="${productId}">
                    <i class="fas fa-edit"></i> Sửa
                </button>
                <button class="btn btn-sm btn-danger delete-product-btn" data-id="${productId}">
                    <i class="fas fa-trash"></i> Xóa
                </button>
            </td>
        `;
        tableBody.appendChild(row);
    });
    
    // Gắn sự kiện cho các nút
    attachProductButtonEvents();
    attachStatusToggleButtons();
}

// Gắn sự kiện cho các nút toggle trạng thái sản phẩm
function attachStatusToggleButtons() {
    const toggleButtons = document.querySelectorAll('.btn-toggle-status');
    
    // Gắn sự kiện cho các nút chuyển đổi trạng thái
    toggleButtons.forEach(button => {
        button.addEventListener('click', async function(e) {
            e.preventDefault();
            e.stopPropagation();
            
            showLoadingMessage('Đang cập nhật trạng thái sản phẩm...');
            
            try {
                // Lấy ID sản phẩm và trạng thái hiện tại
                const productId = this.getAttribute('data-id');
                const currentStatus = this.getAttribute('data-status');
                
                // Chuyển đổi từ active/inactive sang true/false cho API
                // Nếu đang active thì chuyển thành false, ngược lại chuyển thành true
                const newIsAvailable = currentStatus !== 'active';
                
                console.log(`Thay đổi trạng thái sản phẩm ID: ${productId}`);
                console.log(`Trạng thái hiện tại: ${currentStatus} -> Trạng thái mới (UI): ${newIsAvailable ? 'active' : 'inactive'}`);
                console.log(`Giá trị isAvailable gửi lên API: ${newIsAvailable}`);
                
                // Vô hiệu hóa nút trong lúc đang xử lý
                this.disabled = true;
                
                // Gọi API để cập nhật trạng thái
                const result = await updateProductStatus(productId, newIsAvailable);
                
                // Lấy trạng thái thực tế từ kết quả API
                const actualStatus = result.isAvailable;
                const statusText = actualStatus ? 'active' : 'inactive';
                const statusDisplay = actualStatus ? 'Đang bán' : 'Ngừng bán';
                
                console.log(`Kết quả từ API: isAvailable=${actualStatus}, statusText=${statusText}, statusDisplay=${statusDisplay}`);
                
                // Cập nhật UI
                const statusBadge = this.closest('.product-status-container').querySelector('.product-status-badge');
                if (statusBadge) {
                    statusBadge.className = `product-status-badge ${statusText === 'active' ? 'status-active' : 'status-inactive'}`;
                    statusBadge.textContent = statusDisplay;
                }
                
                // Cập nhật trạng thái và nội dung của nút
                this.setAttribute('data-status', statusText);
                
                // Bỏ vô hiệu hóa nút
                this.disabled = false;
                
                // Hiển thị thông báo thành công
                showSuccessMessage(`Đã cập nhật trạng thái sản phẩm thành ${statusDisplay}`);
                
                // Tải lại dữ liệu sau 1 giây để đảm bảo cập nhật đúng
                setTimeout(() => {
                    if (typeof ApiClient.clearCache === 'function') {
                        ApiClient.clearCache();
                    }
                    loadProductData();
                }, 1000);
                
            } catch (error) {
                console.error(`Lỗi khi cập nhật trạng thái sản phẩm:`, error);
                showErrorMessage(`Có lỗi xảy ra khi cập nhật trạng thái: ${error.message}`);
                
                // Bỏ vô hiệu hóa nút nếu có lỗi
                this.disabled = false;
            } finally {
                hideLoadingMessage();
            }
        });
    });
}

// Hàm cập nhật trạng thái sản phẩm
async function updateProductStatus(productId, isAvailable) {
    try {
        console.log(`Đang cập nhật trạng thái sản phẩm ID: ${productId} thành ${isAvailable ? 'Đang bán' : 'Ngừng bán'}`);
        console.log(`API endpoint được gọi: /products/${productId}/availability?isAvailable=${isAvailable}`);
        
        // Sử dụng API chuyên dụng để cập nhật trạng thái
        const result = await ApiClient.Product.updateProductStatus(productId, isAvailable);
        console.log(`Kết quả cập nhật trạng thái từ API:`, result);
        
        // Xóa cache API để đảm bảo dữ liệu mới khi tải lại
        if (typeof ApiClient.clearCache === 'function') {
            ApiClient.clearCache();
            console.log('Đã xóa cache API sau khi cập nhật trạng thái');
        }
        
        // Xác định trạng thái từ kết quả API - không sử dụng hardcode
        let actualStatus = null;
        
        // Kiểm tra kết quả API để lấy ra trạng thái thực tế
        if (result) {
            // Ưu tiên kiểm tra trường isAvailable trong response
            if (result.isAvailable !== undefined) {
                actualStatus = result.isAvailable === true || result.isAvailable === 1 || result.isAvailable === 'true';
                console.log(`Lấy trạng thái từ API response (isAvailable): ${result.isAvailable} => ${actualStatus}`);
            } 
            // Nếu không có isAvailable, thử kiểm tra trường status
            else if (result.status !== undefined) {
                actualStatus = result.status === true || 
                              result.status === 1 || 
                              result.status === 'active' || 
                              result.status === 'true';
                console.log(`Lấy trạng thái từ API response (status): ${result.status} => ${actualStatus}`);
            }
            // Nếu là product object, kiểm tra trong object
            else if (result.product) {
                if (result.product.isAvailable !== undefined) {
                    actualStatus = result.product.isAvailable === true || 
                                  result.product.isAvailable === 1 || 
                                  result.product.isAvailable === 'true';
                    console.log(`Lấy trạng thái từ API response (product.isAvailable): ${result.product.isAvailable} => ${actualStatus}`);
                } else if (result.product.status !== undefined) {
                    actualStatus = result.product.status === true || 
                                  result.product.status === 1 || 
                                  result.product.status === 'active' || 
                                  result.product.status === 'true';
                    console.log(`Lấy trạng thái từ API response (product.status): ${result.product.status} => ${actualStatus}`);
                }
            }
        }
        
        // Nếu không thể xác định từ API, sử dụng giá trị yêu cầu (isAvailable parameter)
        if (actualStatus === null) {
            actualStatus = isAvailable;
            console.log(`Không thể xác định trạng thái từ API response, sử dụng giá trị yêu cầu: ${actualStatus}`);
        }
        
        // Nếu trạng thái thực tế khác với trạng thái yêu cầu, ghi log cảnh báo
        if (actualStatus !== isAvailable) {
            console.warn(`Chú ý: Trạng thái API trả về (${actualStatus}) khác với trạng thái yêu cầu (${isAvailable})`);
        }
        
        return {
            isAvailable: actualStatus,
            message: `Đã cập nhật trạng thái thành ${actualStatus ? 'Đang bán' : 'Ngừng bán'}`
        };
    } catch (error) {
        console.error(`Lỗi khi cập nhật trạng thái sản phẩm ID: ${productId}`, error);
        throw error;
    }
}

// Hiển thị sản phẩm với định dạng cũ
function displayProductsOldFormat(products, tableBody) {
    // Đảm bảo products là một mảng hợp lệ
    if (!products || !Array.isArray(products)) {
        console.error('Dữ liệu sản phẩm không hợp lệ:', products);
        tableBody.innerHTML = '<tr><td colspan="6" class="text-center">Không thể hiển thị sản phẩm do dữ liệu không hợp lệ</td></tr>';
        return;
    }
    
    // Lọc bỏ các sản phẩm undefined
    const validProducts = products.filter(product => product !== undefined);
    
    if (validProducts.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="6" class="text-center">Không có sản phẩm nào</td></tr>';
        return;
    }
    
    // Tạo hàng cho mỗi sản phẩm
    validProducts.forEach(product => {
        const row = document.createElement('tr');
        
        // Xử lý đường dẫn hình ảnh - sử dụng base64 làm mặc định
        let imagePath = '/assets/images/default-product.png';
        
        if (product.image) {
            // Kiểm tra xem đường dẫn có phải URL đầy đủ không
            if (product.image.startsWith('data:') || product.image.startsWith('http')) {
                imagePath = product.image;
            } else {
                // Nếu là tên file, tạo đường dẫn đến API images
                imagePath = `${API_BASE_URL}/products/images/${product.image}`;
            }
            console.log(`Ảnh sản phẩm ${product.name || product.productName}: ${imagePath}`);
        }
        
        // Chuẩn bị tên sản phẩm và giá - ưu tiên trường 'name' trước 'productName'
        const productName = product.name || product.productName || 'Sản phẩm không tên';
        const productPrice = (product.price || 0).toLocaleString('vi-VN');
        const productId = product.id || product.idProduct || '';

        // Chuẩn bị tên danh mục
        let categoryName = 'Chưa phân loại';
        let isCategorized = false;
        
        // 1. Kiểm tra từ trường category (object)
        if (product.category) {
            const catName = product.category.name || product.category.categoryName;
            if (catName) {
                categoryName = catName;
                isCategorized = true;
            }
        }
        
        // 2. Kiểm tra từ trường categoryName (string)
        if (!isCategorized && product.categoryName) {
            categoryName = product.categoryName;
            isCategorized = true;
        }
        
        // 3. Kiểm tra từ trường categoryId và window.cachedCategories
        if (!isCategorized && product.categoryId && window.cachedCategories) {
            const categoryFound = window.cachedCategories.find(c => 
                (c.id && c.id == product.categoryId) || 
                (c.idCategory && c.idCategory == product.categoryId));
            
            if (categoryFound) {
                categoryName = categoryFound.name || categoryFound.categoryName;
                isCategorized = true;
            }
        }
        
        // Format danh mục với CSS đặc biệt nếu chưa phân loại
        const categoryDisplay = isCategorized ? 
            categoryName : 
            `<span class="category-uncategorized">${categoryName}</span>`;
        
        // Trạng thái hiển thị - kiểm tra tất cả các trường khả thi
        console.log('Kiểm tra trạng thái sản phẩm:', product.id, 'Status:', product.status, 'isAvailable:', product.isAvailable);
        
        // Kiểm tra tất cả các trường có thể có trạng thái
        const isActiveProduct = 
            product.status === 'active' || 
            product.status === true || 
            product.status === 1 || 
            product.isAvailable === true || 
            product.isAvailable === 1;
        
        const status = isActiveProduct ? 'Đang bán' : 'Ngừng bán';
        const statusClass = isActiveProduct ? 'active' : 'inactive';
        
        console.log('Kết quả kiểm tra trạng thái:', product.id, status, statusClass);
        
        // Tạo các cột dữ liệu
        row.innerHTML = `
            <td><img src="${imagePath}" alt="${productName}" onerror="this.src='/assets/images/default-product.png'" class="product-thumbnail"></td>
            <td>${productName}</td>
            <td>${categoryDisplay}</td>
            <td>${productPrice} VNĐ</td>
            <td><span class="status-badge ${statusClass}">${status}</span></td>
            <td class="actions">
                <button class="btn-icon edit-product" data-id="${productId}" title="Chỉnh sửa"><i class="fas fa-edit"></i> Sửa</button>
                <button class="btn-icon delete-product" data-id="${productId}" title="Xóa"><i class="fas fa-trash-alt"></i> Xóa</button>
            </td>
        `;
        
        tableBody.appendChild(row);
    });
    
    // Thêm xử lý sự kiện cho các nút
    setupProductActions();
}

// Gắn sự kiện cho các nút sản phẩm
function attachProductButtonEvents() {
    // Xử lý nút chỉnh sửa
    const editButtons = document.querySelectorAll('.edit-product-btn, .edit-product');
    editButtons.forEach(button => {
        button.addEventListener('click', function() {
            const productId = this.getAttribute('data-id');
            editProduct(productId);
        });
    });
    
    // Xử lý nút xóa
    const deleteButtons = document.querySelectorAll('.delete-product-btn, .delete-product');
    deleteButtons.forEach(button => {
        button.addEventListener('click', function() {
            const productId = this.getAttribute('data-id');
            if (confirm('Bạn có chắc muốn xóa sản phẩm này không?')) {
                deleteProduct(productId);
            }
        });
    });
}

// Xử lý các nút sản phẩm (cho giao diện cũ)
function setupProductActions() {
    // Sử dụng lại hàm attachProductButtonEvents để đảm bảo nhất quán
    attachProductButtonEvents();
}

// Đảm bảo danh mục đã được tải
async function ensureCategoriesLoaded() {
    // Nếu chưa có danh mục trong cache hoặc rỗng, tải chúng
    if (!window.cachedCategories || window.cachedCategories.length === 0) {
        console.log('Chưa có danh mục trong cache, đang tải...');
        
        try {
            // Tránh tải nếu đang tải
            if (isLoadingCategories) {
                console.log('Đang tải danh mục, chờ...');
                // Chờ 1 giây rồi kiểm tra lại
                await new Promise(resolve => setTimeout(resolve, 1000));
                return ensureCategoriesLoaded();
            }
            
            // Tải danh mục
            await loadCategoriesForDropdown();
            
            console.log('Đã tải danh mục thành công:', window.cachedCategories);
        } catch (error) {
            console.error('Lỗi khi tải danh mục:', error);
            // Sử dụng danh mục mẫu nếu lỗi
            window.cachedCategories = [
                { id: 1, name: 'Cà phê' },
                { id: 2, name: 'Trà' },
                { id: 3, name: 'Bánh' },
                { id: 4, name: 'Đồ uống đá xay' },
                { id: 5, name: 'Đồ ăn nhẹ' }
            ];
            console.log('Sử dụng danh mục mẫu:', window.cachedCategories);
        }
    } else {
        console.log('Đã có danh mục trong cache:', window.cachedCategories.length, 'danh mục');
    }
    
    return window.cachedCategories;
}

// Mở modal chỉnh sửa sản phẩm
async function editProduct(productId) {
    try {
        showLoadingMessage('Đang tải thông tin sản phẩm...');
        
        // Đảm bảo danh mục đã được tải
        await ensureCategoriesLoaded();
        
        // Lấy thông tin sản phẩm
        const product = await ApiClient.Product.getProductById(productId);
        console.log('Đã tải sản phẩm:', product);
        
        // Đảm bảo sản phẩm có danh mục
        if (!product.category && !product.categoryName && product.categoryId) {
            // Tìm danh mục từ cache
            const categoryFound = window.cachedCategories.find(c => 
                c.id == product.categoryId || c.idCategory == product.categoryId);
            
            if (categoryFound) {
                product.category = categoryFound;
                product.categoryName = categoryFound.name || categoryFound.categoryName;
                console.log('Đã gán danh mục cho sản phẩm từ cache:', product.categoryName);
            }
        }
        
        // Xác định modal nào đang được sử dụng
        const editProductModal = document.getElementById('edit-product-modal');
        const productModal = document.getElementById('productModal');
        
        if (editProductModal) {
            // Định dạng modal mới
            updateNewModalWithProductData(product, editProductModal);
        } else if (productModal) {
            // Định dạng modal cũ
            updateOldModalWithProductData(product, productModal);
        } else {
            showErrorMessage('Không tìm thấy modal chỉnh sửa sản phẩm trên trang');
            return;
        }
        
        hideLoadingMessage();
    } catch (error) {
        console.error('Lỗi khi lấy thông tin sản phẩm:', error);
        showErrorMessage('Không thể lấy thông tin sản phẩm: ' + error.message);
    }
}

// Cập nhật modal cũ với dữ liệu sản phẩm
function updateOldModalWithProductData(product, modal) {
    // Log dữ liệu sản phẩm để kiểm tra
    console.log('Dữ liệu sản phẩm nhận được để cập nhật modal:', product);
    
    // Cập nhật tiêu đề
    const title = modal.querySelector('h2');
    if (title) {
        title.innerHTML = '<i class="fas fa-coffee"></i> Chỉnh sửa sản phẩm';
    }
    
    // Điền dữ liệu vào form
    const idInput = document.getElementById('productId');
    const nameInput = document.getElementById('productName');
    const priceInput = document.getElementById('productPrice');
    const descInput = document.getElementById('productDescription');
    const categorySelect = document.getElementById('category');
    const statusSelect = document.getElementById('productStatus');

    if (idInput) idInput.value = product.id || product.idProduct;
    
    // Ưu tiên lấy tên từ trường name trước, sau đó mới đến productName
    if (nameInput) {
        const displayName = product.name || product.productName;
        nameInput.value = displayName || '';
        console.log('Đặt tên sản phẩm cho form:', displayName);
    }
    
    if (priceInput) priceInput.value = product.price;
    if (descInput) descInput.value = product.description || '';

    // Luôn load lại danh mục và chỉ set value sau khi load xong
    if (categorySelect) {
        loadCategoriesForDropdown().then(() => {
            let found = false;
            if (product.categoryId) {
                categorySelect.value = product.categoryId;
                found = !!categorySelect.querySelector(`option[value="${product.categoryId}"]`);
            } else if (product.category && (product.category.id || product.category.idCategory)) {
                const categoryId = product.category.id || product.category.idCategory;
                categorySelect.value = categoryId;
                found = !!categorySelect.querySelector(`option[value="${categoryId}"]`);
            } else if (product.categoryName) {
                // Tìm theo tên danh mục nếu có
                const option = Array.from(categorySelect.options).find(opt => opt.textContent.trim().toLowerCase() === product.categoryName.trim().toLowerCase());
                if (option) {
                    categorySelect.value = option.value;
                    found = true;
                }
            }
            if (!found) {
                console.warn('Không tìm thấy danh mục phù hợp cho sản phẩm này. Vui lòng chọn lại danh mục!');
                categorySelect.value = '';
            }
        });
    }

    // Thiết lập trạng thái
    if (statusSelect) {
        console.log('Trạng thái sản phẩm gốc:', product.status, typeof product.status);
        console.log('isAvailable:', product.isAvailable, typeof product.isAvailable);
        
        // Kiểm tra các trường hợp khác nhau của trạng thái
        const isActiveProduct = 
            product.status === 'active' || 
            product.status === true || 
            product.status === 1 || 
            product.isAvailable === true || 
            product.isAvailable === 1;
        
        // Đặt giá trị cho select dựa trên điều kiện tổng hợp
        statusSelect.value = isActiveProduct ? 'active' : 'inactive';
        console.log('Đã đặt trạng thái:', statusSelect.value);
    }
    
    // Hiển thị ảnh xem trước nếu có
    const imagePreview = document.getElementById('productImagePreview');
    if (imagePreview) {
        if (product.image) {
            let imagePath = '/assets/images/default-product.png';
            // Kiểm tra nếu là đường dẫn tương đối hay URL đầy đủ hoặc dữ liệu base64
            if (product.image.startsWith('data:') || product.image.startsWith('http')) {
                imagePath = product.image;
            } else {
                imagePath = `${API_BASE_URL}/products/images/${product.image}`;
            }
            
            // Set ảnh xem trước
            imagePreview.innerHTML = `<img src="${imagePath}" alt="${product.name || product.productName}" onerror="this.src='/assets/images/default-product.png'">`;
            console.log('Đã đặt ảnh xem trước cho sản phẩm:', imagePath);
        } else {
            imagePreview.innerHTML = `<img src="/assets/images/default-product.png" alt="Default Image">`;
            console.log('Không có ảnh, sử dụng ảnh mặc định');
        }
    } else {
        console.error('Không tìm thấy phần tử imagePreview');
    }
    
    // Thiết lập các trường khác nếu có
    if (document.getElementById('ingredients')) {
        document.getElementById('ingredients').value = product.ingredients || '';
    }
    
    if (document.getElementById('preparationTime')) {
        document.getElementById('preparationTime').value = product.preparationTime || '';
    }
    
    if (document.getElementById('calories')) {
        document.getElementById('calories').value = product.calories || '';
    }
    
    if (document.getElementById('isPopular')) {
        document.getElementById('isPopular').checked = product.isPopular || false;
    }
    
    if (document.getElementById('isNew')) {
        document.getElementById('isNew').checked = product.isNew || false;
    }
    
    // Mở modal
    openModal('productModal');
}

// Xử lý xóa sản phẩm
async function deleteProduct(productId) {
    try {
        console.log(`Đang xóa sản phẩm ID: ${productId}...`);
        
        // Gọi API xóa sản phẩm
        await ApiClient.Product.deleteProduct(productId);
        
        // Xóa cache API để đảm bảo dữ liệu mới nhất
        if (typeof invalidateCache === 'function') {
            invalidateCache('/products');
        }
        
        // Tải lại danh sách sản phẩm
        loadProductData();
        
        showSuccessMessage('Xóa sản phẩm thành công!');
    } catch (error) {
        console.error(`Lỗi khi xóa sản phẩm ID: ${productId}`, error);
        showErrorMessage(`Lỗi khi xóa sản phẩm: ${error.message}`);
    }
}

// Thiết lập xử lý form gửi sản phẩm
function setupProductFormSubmission() {
    const form = document.getElementById('productForm');
    if (!form) {
        console.error('Không tìm thấy form sản phẩm');
        return;
    }
    
    form.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        try {
            showLoadingMessage('Đang lưu sản phẩm...');
            
            // Thu thập dữ liệu từ form
            const productId = document.getElementById('productId').value.trim();
            const name = document.getElementById('productName').value.trim();
            const price = document.getElementById('productPrice').value;
            const description = document.getElementById('productDescription').value.trim();
            const categoryId = document.getElementById('category').value;
            const statusEl = document.getElementById('productStatus');
            
            // Chuyển đổi trạng thái từ active/inactive sang true/false
            const isActive = statusEl ? statusEl.value === 'active' : true;
            console.log('Trạng thái được gửi đi:', statusEl ? statusEl.value : 'undefined', 'Chuyển đổi thành:', isActive);
            
            // Kiểm tra dữ liệu trước khi gửi
            if (!name) {
                showErrorMessage('Vui lòng nhập tên sản phẩm');
                return;
            }
            
            if (!price || isNaN(price) || parseFloat(price) < 0) {
                showErrorMessage('Vui lòng nhập giá sản phẩm hợp lệ');
                return;
            }
            
            if (!categoryId) {
                showErrorMessage('Vui lòng chọn danh mục cho sản phẩm');
                return;
            }
            
            // Khởi tạo đối tượng sản phẩm cơ bản - sử dụng cả name và productName để đảm bảo tương thích
            const productData = {
                name: name,
                productName: name,  // Thêm trường này để tương thích với API
                price: parseFloat(price),
                description: description,
                categoryId: parseInt(categoryId),
                status: isActive,
                isAvailable: isActive  // Thêm trường này để đảm bảo trạng thái được cập nhật đúng
            };
            
            // In ra log để debug
            console.log('Dữ liệu sản phẩm gửi đi:', productData);
            
            // Thu thập thông tin từ các trường tùy chọn
            const isPopularEl = document.getElementById('isPopular');
            const isNewEl = document.getElementById('isNew');
            
            if (isPopularEl) {
                productData.isPopular = isPopularEl.checked;
            }
            
            if (isNewEl) {
                productData.isNew = isNewEl.checked;
            }
            
            // Thêm các trường khác nếu có
            const ingredientsEl = document.getElementById('ingredients');
            const prepTimeEl = document.getElementById('preparationTime');
            const caloriesEl = document.getElementById('calories');
            
            if (ingredientsEl && ingredientsEl.value.trim()) {
                productData.ingredients = ingredientsEl.value.trim();
            }
            
            if (prepTimeEl && prepTimeEl.value.trim()) {
                productData.preparationTime = prepTimeEl.value.trim();
            }
            
            if (caloriesEl && caloriesEl.value.trim()) {
                productData.calories = caloriesEl.value.trim();
            }
            
            // Kiểm tra có ảnh mới không
            const imageInput = document.getElementById('productImage');
            let hasNewImage = false;
            let imageFile = null;
            
            if (imageInput && imageInput.files && imageInput.files[0]) {
                hasNewImage = true;
                imageFile = imageInput.files[0];
            }
            
            let result;
            let successMessage;
            
            // Thực hiện thêm hoặc cập nhật dựa vào ID
            if (productId) {
                // Cập nhật sản phẩm hiện có
                console.log(`Cập nhật sản phẩm ID: ${productId}`, productData);
                
                result = await ApiClient.Product.updateProduct(productId, productData);
                console.log('Kết quả API cập nhật:', result);
                
                successMessage = 'Cập nhật sản phẩm thành công!';
            } else {
                // Tạo sản phẩm mới
                console.log('Tạo sản phẩm mới:', productData);
                
                result = await ApiClient.Product.createProduct(productData);
                console.log('Kết quả API tạo mới:', result);
                
                successMessage = 'Thêm sản phẩm mới thành công!';
            }
            
            // Xử lý upload ảnh nếu có
            if (hasNewImage && imageFile && result) {
                // Lấy ID từ kết quả API
                const savedProductId = productId || (result.id || result.idProduct || (result.product && (result.product.id || result.product.idProduct)));
                
                if (savedProductId) {
                    console.log(`Đang tải lên ảnh cho sản phẩm ID: ${savedProductId}`);
                    await ApiClient.Product.uploadProductImage(savedProductId, imageFile);
                } else {
                    console.error('Không thể lấy ID sản phẩm từ kết quả API. Không thể tải lên ảnh.');
                    showErrorMessage('Đã lưu sản phẩm nhưng không thể tải lên ảnh.');
                }
            }
            
            // Xóa cache API để đảm bảo dữ liệu mới khi tải lại
            if (typeof ApiClient.clearCache === 'function') {
                ApiClient.clearCache();
            }
            
            // Tải lại danh sách sản phẩm
            closeModal('productModal');
            resetProductForm();
            
            // Đợi một chút trước khi tải lại dữ liệu
            setTimeout(() => {
                loadProductData();
                showSuccessMessage(successMessage);
            }, 500);
            
        } catch (error) {
            console.error('Lỗi khi lưu sản phẩm:', error);
            showErrorMessage('Không thể lưu sản phẩm: ' + error.message);
        } finally {
            hideLoadingMessage();
        }
    });
}

// Thêm nút làm mới vào trang sản phẩm
function addRefreshButton() {
    const actionBar = document.querySelector('.action-bar');
    if (!actionBar) return;
    
    // Tạo nút làm mới
    const refreshButton = document.createElement('button');
    refreshButton.className = 'btn-secondary';
    refreshButton.innerHTML = '<i class="fas fa-sync-alt"></i> Làm mới';
    refreshButton.style.marginLeft = '10px';
    
    // Thêm sự kiện click
    refreshButton.addEventListener('click', function() {
        // Xóa toàn bộ cache API
        if (typeof clearApiCache === 'function') {
            clearApiCache();
        }
        
        // Tải lại dữ liệu
        loadProductData();
        loadCategoriesForDropdown();
        
        showSuccessMessage('Đã làm mới dữ liệu!');
    });
    
    // Thêm vào action bar
    actionBar.appendChild(refreshButton);
}

/**
 * ==========================
 * QUẢN LÝ DANH MỤC
 * ==========================
 */
function initializeCategoryManagement() {
    console.log('Khởi tạo chức năng quản lý danh mục');
    
    // Tải dữ liệu danh mục
    loadCategoryData();
    
    // Khởi tạo modal thêm/sửa danh mục
    initializeModal('categoryModal', 'addCategoryBtn');
    
    // Xử lý form thêm/sửa danh mục
    setupCategoryFormSubmission();
    
    // Xử lý tìm kiếm danh mục
    setupSearchFilter('searchCategory', filterCategories);
}

// Tải dữ liệu danh mục
async function loadCategoryData() {
    showLoadingMessage('Đang tải dữ liệu danh mục...');
    
    try {
        // Gọi API để lấy danh sách danh mục
        const categories = await ApiClient.Category.getAllCategories();
        displayCategories(categories);
        
        showSuccessMessage('Đã tải dữ liệu danh mục thành công');
    } catch (error) {
        console.error('Lỗi khi tải dữ liệu danh mục:', error);
        showErrorMessage('Lỗi kết nối API: ' + error.message + '. Vui lòng kiểm tra server API có đang chạy không.');
    }
}

/**
 * ==========================
 * QUẢN LÝ NHÂN VIÊN
 * ==========================
 */
function initializeStaffManagement() {
    console.log('Khởi tạo chức năng quản lý nhân viên');
    
    // Tải dữ liệu nhân viên
    loadStaffData();
    
    // Khởi tạo modal thêm/sửa nhân viên
    initializeModal('staffModal', 'addStaffBtn');
    
    // Xử lý form thêm/sửa nhân viên
    setupStaffFormSubmission();
    
    // Xử lý tìm kiếm nhân viên
    setupSearchFilter('searchStaff', filterStaff);
}

// Tải dữ liệu nhân viên
async function loadStaffData() {
    showLoadingMessage('Đang tải dữ liệu nhân viên...');
    
    try {
        // Gọi API để lấy danh sách nhân viên
        const staffList = await ApiClient.Staff.getAllStaff();
        displayStaff(staffList);
        
        showSuccessMessage('Đã tải dữ liệu nhân viên thành công');
    } catch (error) {
        console.error('Lỗi khi tải dữ liệu nhân viên:', error);
        showErrorMessage('Lỗi kết nối API: ' + error.message + '. Vui lòng kiểm tra server API có đang chạy không.');
    }
}

/**
 * ==========================
 * CÁC HÀM TIỆN ÍCH DÙNG CHUNG
 * ==========================
 */

// Khởi tạo modal
function initializeModal(modalId, openBtnId) {
    const modal = document.getElementById(modalId);
    const openBtn = document.getElementById(openBtnId);
    
    if (!modal || !openBtn) return;
    
    const closeBtn = modal.querySelector('.close-btn');
    
    // Mở modal khi nhấn nút thêm
    openBtn.addEventListener('click', function() {
        // Reset form
        const form = modal.querySelector('form');
        if (form) form.reset();
        
        // Reset các trường ẩn
        const hiddenFields = modal.querySelectorAll('input[type="hidden"]');
        hiddenFields.forEach(field => field.value = '');
        
        // Cập nhật tiêu đề
        const title = modal.querySelector('h2');
        if (title) {
            title.textContent = title.textContent.replace('Chỉnh sửa', 'Thêm mới');
        }
        
        // Hiển thị modal
        modal.style.display = 'flex';
        setTimeout(() => {
            modal.classList.add('show');
        }, 10);
    });
    
    // Đóng modal khi nhấn nút đóng
    if (closeBtn) {
        closeBtn.addEventListener('click', function() {
            closeModal(modalId);
        });
    }
    
    // Đóng modal khi nhấn bên ngoài
    window.addEventListener('click', function(e) {
        if (e.target === modal) {
            closeModal(modalId);
        }
    });
}

// Đóng modal
function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (!modal) return;
    
    modal.classList.remove('show');
    setTimeout(() => {
        modal.style.display = 'none';
    }, 300);
}

// Thiết lập tìm kiếm
function setupSearchFilter(inputId, filterFunction) {
    const searchInput = document.getElementById(inputId);
    if (!searchInput) return;
    
    searchInput.addEventListener('input', debounce(function() {
        filterFunction(this.value);
    }, 300));
}

// Lọc người dùng
function filterUsers(searchTerm) {
    searchTerm = searchTerm.toLowerCase();
    
    const rows = document.querySelectorAll('#userTableBody tr');
    
    rows.forEach(row => {
        const username = row.querySelector('td:nth-child(2)').textContent.toLowerCase();
        const fullName = row.querySelector('td:nth-child(3)').textContent.toLowerCase();
        const role = row.querySelector('td:nth-child(4)').textContent.toLowerCase();
        
        if (username.includes(searchTerm) || fullName.includes(searchTerm) || role.includes(searchTerm)) {
            row.style.display = '';
        } else {
            row.style.display = 'none';
        }
    });
}

// Định dạng vai trò
function formatRole(role) {
    if (role === 'admin') {
        return 'Quản trị viên';
    } else if (role === 'staff') {
        return 'Nhân viên';
    }
    return role;
}

// Hàm debounce để tránh gọi quá nhiều lần khi tìm kiếm
function debounce(func, wait) {
    let timeout;
    return function() {
        const context = this;
        const args = arguments;
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(context, args), wait);
    };
}

// Hiển thị thông báo loading
function showLoadingMessage(message) {
    if (window.AdminCore && window.AdminCore.showNotification) {
        window.AdminCore.showNotification(message, 'info');
    } else {
        console.log('Info:', message);
    }
}

// Hiển thị thông báo thành công
function showSuccessMessage(message) {
    if (window.AdminCore && window.AdminCore.showNotification) {
        window.AdminCore.showNotification(message, 'success');
    } else {
        console.log('Success:', message);
    }
}

// Hiển thị thông báo lỗi
function showErrorMessage(message) {
    if (window.AdminCore && window.AdminCore.showNotification) {
        window.AdminCore.showNotification(message, 'error');
    } else {
        console.error('Error:', message);
    }
}

// Ẩn thông báo loading (fix lỗi ReferenceError)
function hideLoadingMessage() {
    if (window.AdminCore && window.AdminCore.hideNotification) {
        window.AdminCore.hideNotification();
    }
    // Nếu không có AdminCore, không cần làm gì thêm
}

// Tải danh sách danh mục cho Select trong form chỉnh sửa
async function loadCategoriesForSelect(selectElementId, selectedCategoryId) {
    const selectElement = document.getElementById(selectElementId);
    if (!selectElement) {
        console.error(`Không tìm thấy phần tử select với ID ${selectElementId}`);
        return;
    }
    
    try {
        // Gọi API lấy danh sách danh mục
        const categories = await ApiClient.Category.getAllCategories();
        
        // Xóa các tùy chọn hiện tại
        selectElement.innerHTML = '<option value="">-- Chọn danh mục --</option>';
        
        // Thêm tùy chọn cho mỗi danh mục
        categories.forEach(category => {
            const option = document.createElement('option');
            const categoryId = category.id || category.idCategory;
            const categoryName = category.categoryName || category.name;
            
            option.value = categoryId;
            option.textContent = categoryName;
            
            // Đặt selected nếu trùng với categoryId đã chọn
            if (selectedCategoryId && categoryId.toString() === selectedCategoryId.toString()) {
                option.selected = true;
            }
            
            selectElement.appendChild(option);
        });
    } catch (error) {
        console.error('Lỗi khi tải danh mục cho select:', error);
        showErrorMessage('Không thể tải danh mục. Vui lòng thử lại sau.');
    }
}

// Lọc sản phẩm theo từ khóa tìm kiếm
function filterProducts(searchTerm) {
    if (!searchTerm) {
        // Nếu trường tìm kiếm trống, hiển thị tất cả sản phẩm
        const rows = document.querySelectorAll('#productTableBody tr, #products-table-body tr');
        rows.forEach(row => {
            row.style.display = '';
        });
        return;
    }
    
    searchTerm = searchTerm.toLowerCase();
    
    // Lấy tất cả các hàng trong bảng sản phẩm
    const rows = document.querySelectorAll('#productTableBody tr, #products-table-body tr');
    
    // Kiểm tra từng hàng
    rows.forEach(row => {
        // Lấy các ô dữ liệu trong hàng (cột tên và danh mục)
        const nameCell = row.querySelector('td:nth-child(2)') || row.querySelector('td:nth-child(3)');
        const categoryCell = row.querySelector('td:nth-child(3)') || row.querySelector('td:nth-child(4)');
        
        if (!nameCell && !categoryCell) {
            // Nếu không tìm thấy cột, hiển thị hàng
            row.style.display = '';
            return;
        }
        
        // Lấy nội dung để tìm kiếm
        const name = nameCell ? nameCell.textContent.toLowerCase() : '';
        const category = categoryCell ? categoryCell.textContent.toLowerCase() : '';
        
        // Kiểm tra nếu tên hoặc danh mục chứa từ khóa tìm kiếm
        if (name.includes(searchTerm) || category.includes(searchTerm)) {
            row.style.display = '';
        } else {
            row.style.display = 'none';
        }
    });
}

// Thêm hàm mới để tải sản phẩm theo danh mục
async function loadProductsByCategory(categoryId) {
    if (categoryId === 'all') {
        loadProductData();
        return;
    }
    showLoadingMessage('Đang tải sản phẩm theo danh mục...');
    try {
        await ensureCategoriesLoaded();
        const category = window.cachedCategories.find(c => c.id == categoryId || c.idCategory == categoryId);
        const categoryName = category ? (category.name || category.categoryName) : 'Danh mục không xác định';
        const products = await ApiClient.Category.getProductsByCategory(categoryId);
        // Gán lại thông tin danh mục cho từng sản phẩm (nếu thiếu)
        products.forEach(product => {
            product.categoryId = categoryId;
            product.categoryName = categoryName;
            product.category = category;
        });
        displayProducts(products);
        showSuccessMessage(`Đã tải ${products.length} sản phẩm từ danh mục "${categoryName}"`);
        updateCategoryTitle(categoryName);
    } catch (error) {
        showErrorMessage('Không thể tải sản phẩm từ danh mục: ' + error.message);
    }
}

// Hàm mới để thiết lập bộ lọc danh mục
function setupCategoryFilter() {
    const categoryFilter = document.getElementById('categoryFilter');
    if (!categoryFilter) return;

    categoryFilter.addEventListener('change', async function() {
        const selectedCategoryId = this.value;
        const url = new URL(window.location.href);
        if (selectedCategoryId === 'all') {
            url.searchParams.delete('category');
            await loadAllProductsByAllCategories();
        } else {
            url.searchParams.set('category', selectedCategoryId);
            // Lấy sản phẩm của danh mục được chọn
            try {
                await ensureCategoriesLoaded();
                const category = window.cachedCategories.find(c => c.id == selectedCategoryId || c.idCategory == selectedCategoryId);
                const categoryName = category ? (category.name || category.categoryName) : 'Danh mục không xác định';
                const products = await ApiClient.Category.getProductsByCategory(selectedCategoryId);
                products.forEach(product => {
                    product.categoryId = selectedCategoryId;
                    product.categoryName = categoryName;
                    product.category = category;
                });
                displayProducts(products);
                showSuccessMessage(`Đã tải ${products.length} sản phẩm từ danh mục "${categoryName}"`);
            } catch (error) {
                showErrorMessage('Không thể tải sản phẩm từ danh mục: ' + error.message);
            }
        }
        window.history.pushState({}, '', url.toString());
    });
}

// Hàm để tạo bộ lọc danh mục nếu chưa có
function createCategoryFilter() {
    // Kiểm tra xem có phần tử search-bar không
    const searchBar = document.querySelector('.search-bar') || document.querySelector('.action-bar');
    if (!searchBar) {
        console.warn('Không tìm thấy phần tử search-bar hoặc action-bar để thêm bộ lọc danh mục');
        return;
    }
    
    // Tạo container cho bộ lọc
    const filterContainer = document.createElement('div');
    filterContainer.className = 'category-filter-container';
    filterContainer.style.marginLeft = '15px';
    filterContainer.style.display = 'inline-block';
    
    // Tạo label
    const filterLabel = document.createElement('label');
    filterLabel.setAttribute('for', 'categoryFilter');
    filterLabel.textContent = 'Lọc theo danh mục:';
    filterLabel.style.marginRight = '5px';
    
    // Tạo select
    const filterSelect = document.createElement('select');
    filterSelect.id = 'categoryFilter';
    filterSelect.className = 'form-select';
    filterSelect.style.display = 'inline-block';
    filterSelect.style.width = 'auto';
    filterSelect.style.marginRight = '10px';
    
    // Thêm option mặc định
    filterSelect.innerHTML = '<option value="all">Tất cả danh mục</option>';
    
    // Thêm các phần tử vào container
    filterContainer.appendChild(filterLabel);
    filterContainer.appendChild(filterSelect);
    
    // Thêm container vào search-bar
    searchBar.appendChild(filterContainer);
    
    // Thiết lập sự kiện cho bộ lọc
    setupCategoryFilter();
    
    // Tải danh mục cho bộ lọc
    loadCategoriesForDropdown();
}

async function loadAllProductsByAllCategories() {
    showLoadingMessage('Đang tải tất cả sản phẩm từ các danh mục...');
    try {
        await ensureCategoriesLoaded();
        // Gọi API lấy tất cả danh mục (bao gồm mảng products trong từng category)
        const categories = await ApiClient.Category.getAllCategories();
        window.cachedCategories = categories;
        let allProducts = [];
        for (const category of categories) {
            const categoryId = category.id || category.idCategory;
            const categoryName = category.name || category.categoryName;
            // Nếu category có trường products là mảng
            if (Array.isArray(category.products)) {
                category.products.forEach(product => {
                    product.categoryId = categoryId;
                    product.categoryName = categoryName;
                    product.category = category;
                });
                allProducts = allProducts.concat(category.products);
            }
        }
        window._allProductsByCategory = allProducts; // cache lại để filter nhanh
        displayProducts(allProducts);
        showSuccessMessage(`Đã tải ${allProducts.length} sản phẩm từ tất cả danh mục`);
    } catch (error) {
        showErrorMessage('Không thể tải sản phẩm từ các danh mục: ' + error.message);
    }
}

// Export các chức năng nếu cần
window.AdminEntities = {
    initializeUserManagement,
    initializeProductManagement,
    initializeCategoryManagement,
    initializeStaffManagement,
    loadUserData,
    loadProductData,
    loadCategoryData,
    loadStaffData,
    loadCategoriesForDropdown,
    displayProducts,
    setupProductActions,
    editProduct,
    deleteProduct,
    setupProductFormSubmission,
    checkApiServerStatus,
    filterProducts,
    useSampleCategories,
    ensureCategoriesLoaded,
    loadProductsByCategory,
    setupCategoryFilter
}; 

// Cập nhật modal mới với dữ liệu sản phẩm
function updateNewModalWithProductData(product, modal) {
    // Cập nhật UI với thông tin sản phẩm
    document.getElementById('edit-product-id').value = product.id;
    document.getElementById('edit-product-name').value = product.name;
    document.getElementById('edit-product-price').value = product.price;
    document.getElementById('edit-product-description').value = product.description || '';
    document.getElementById('edit-product-status').value = product.status;
    
    // Xử lý ảnh sản phẩm
    const productImagePreview = document.getElementById('edit-product-image-preview');
    if (product.image) {
        let imagePath = '/assets/images/default-product.png';
        // Kiểm tra nếu là đường dẫn tương đối hay URL đầy đủ hoặc dữ liệu base64
        if (product.image.startsWith('data:') || product.image.startsWith('http')) {
            imagePath = product.image;
        } else {
            imagePath = `${API_BASE_URL}/products/images/${product.image}`;
        }
        
        productImagePreview.src = imagePath;
        productImagePreview.setAttribute('data-original-image', product.image);
        console.log('Đã đặt ảnh xem trước cho sản phẩm:', imagePath);
    } else {
        productImagePreview.src = '/assets/images/default-product.png';
        productImagePreview.setAttribute('data-original-image', '');
        console.log('Không có ảnh, sử dụng ảnh mặc định');
    }
    
    // Đặt onerror để sử dụng ảnh mặc định nếu tải ảnh thất bại
    productImagePreview.onerror = function() {
        this.onerror = null;
        this.src = '/assets/images/default-product.png';
    };
    
    // Reset file input
    document.getElementById('edit-product-image').value = '';
    
    // Tải danh sách danh mục và đặt giá trị đã chọn
    if (typeof loadCategoriesForSelect === 'function') {
        loadCategoriesForSelect('edit-product-category', product.categoryId);
    } else {
        // Fallback nếu không có hàm loadCategoriesForSelect
        const categorySelect = document.getElementById('edit-product-category');
        if (categorySelect && product.categoryId) {
            categorySelect.value = product.categoryId;
        }
    }
    
    // Hiển thị modal
    if (typeof bootstrap !== 'undefined' && typeof bootstrap.Modal !== 'undefined') {
        const modalInstance = new bootstrap.Modal(modal);
        modalInstance.show();
    } else {
        // Fallback nếu không có bootstrap
        openModal(modal.id);
    }
}