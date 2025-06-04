import { showLoadingMessage, showSuccessMessage, showErrorMessage, hideLoadingMessage } from './entities-utils.js';
const API_BASE_URL = window.API_BASE_URL || 'http://localhost:8081/api';

let isLoadingProducts = false;
let isLoadingCategories = false;
let isProductFormInitialized = false;

export function initializeProductManagement() {
    loadProductData();
    
    setupCategoryFilter();
    
    setupProductFormSubmission();
    
    checkApiServerStatus();
}

export async function checkApiServerStatus() {
    try {
        const response = await fetch(`${API_BASE_URL}/products`, {
            method: 'GET',
            headers: {
                'Accept': 'application/json'
            },
            timeout: 5000
        });
        
        if (!response.ok) {
            showErrorMessage(`API server trả về lỗi: ${response.status} ${response.statusText}`);
            return false;
        }
        
        return true;
    } catch (error) {
        showErrorMessage(`Không thể kết nối đến API server: ${error.message}. Vui lòng kiểm tra server đã chạy chưa.`);
        return false;
    }
}

export async function loadProductData() {
    if (isLoadingProducts) return;
    isLoadingProducts = true;
    showLoadingMessage('Đang tải dữ liệu sản phẩm...');
    try {
        if (!window.ApiClient || !window.ApiClient.Product) {
            showErrorMessage('API Client không khả dụng. Vui lòng làm mới trang.');
            isLoadingProducts = false;
            return;
        }
        let categories = [];
        try {
            categories = await ApiClient.Category.getAllCategories();
            if (!categories || categories.length === 0) {
                categories = [];
            }
            window.cachedCategories = categories;
        } catch (categoryError) {
            categories = [];
            window.cachedCategories = [];
        }
        const categoryMap = {};
        if (categories && categories.length > 0) {
            categories.forEach(category => {
                const categoryId = category.id || category.idCategory;
                if (categoryId) {
                    categoryMap[categoryId] = category;
                }
            });
        }
        const products = await ApiClient.Product.getAllProducts();
        if (!products || !Array.isArray(products)) {
            showErrorMessage('API trả về dữ liệu sản phẩm không hợp lệ.');
            isLoadingProducts = false;
            return;
        }
        const validProducts = products.filter(product => product !== undefined);
        if (validProducts && validProducts.length > 0) {
            validProducts.forEach(product => {
                if (!product) return;
                if (!product.category && product.categoryId && categoryMap[product.categoryId]) {
                    product.category = categoryMap[product.categoryId];
                    product.categoryName = categoryMap[product.categoryId].name || categoryMap[product.categoryId].categoryName;
                }
                if (!product.categoryName) {
                    product.categoryName = 'Chưa phân loại';
                }
            });
        }
        try {
            displayProducts(validProducts);
            showSuccessMessage('Đã tải dữ liệu sản phẩm thành công');
        } catch (displayError) {
            showErrorMessage('Không thể hiển thị sản phẩm: ' + displayError.message);
        }
    } catch (error) {
        showErrorMessage('Lỗi kết nối API: ' + error.message);
    } finally {
        setTimeout(() => { isLoadingProducts = false; }, 2000);
    }
}

export function displayProducts(products) {
    try {
        const tableBody = document.getElementById('productTableBody');
        if (!tableBody) return;
        tableBody.innerHTML = '';
        if (!products || products.length === 0) {
            tableBody.innerHTML = '<tr><td colspan="6" class="text-center">Không có sản phẩm nào</td></tr>';
            return;
        }
        
        products.sort((a, b) => {
            const getCategoryName = (product) => {
                if (product.categoryName) return product.categoryName;
                if (product.category && product.category.categoryName) return product.category.categoryName;
                if (product.category && product.category.name) return product.category.name;
                return 'Chưa phân loại';
            };
            
            const categoryA = getCategoryName(a).toLowerCase();
            const categoryB = getCategoryName(b).toLowerCase();
            
            if (categoryA !== categoryB) {
                return categoryA.localeCompare(categoryB);
            } else {
                const nameA = (a.name || a.productName || '').toLowerCase();
                const nameB = (b.name || b.productName || '').toLowerCase();
                return nameA.localeCompare(nameB);
            }
        });
        
        if (window.useNewProductFormat === true) {
            displayProductsNewFormat(products, tableBody);
        } else {
            displayProductsOldFormat(products, tableBody);
        }
    } catch (error) {
        console.error('Lỗi hiển thị sản phẩm:', error);
    }
}

function displayProductsNewFormat(products, tableBody) {
    if (!products || !Array.isArray(products)) {
        tableBody.innerHTML = '<tr><td colspan="7" class="text-center">Không thể hiển thị sản phẩm do dữ liệu không hợp lệ</td></tr>';
        return;
    }
    const validProducts = products.filter(product => product !== undefined);
    if (validProducts.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="7" class="text-center">Không có sản phẩm nào</td></tr>';
        return;
    }
    validProducts.forEach((product, index) => {
        const row = document.createElement('tr');
        const productId = product.id || product.idProduct;
        const productName = product.name || product.productName || 'Sản phẩm không tên';
        const isProductAvailable = product.status === 'active' || product.status === true || product.status === 1 || product.isAvailable === true || product.isAvailable === 1;
        let productImage = '/assets/images/default-product.png';
        if (product.image) {
            if (!product.image.startsWith('data:') && !product.image.startsWith('http')) {
                productImage = `${API_BASE_URL}/products/images/${product.image}`;
            } else {
                productImage = product.image;
            }
        }
        let categoryName = product.categoryName || 'Chưa phân loại';
        let isCategorized = !!product.categoryName;
        if (!isCategorized && product.category && (product.category.name || product.category.categoryName)) {
            categoryName = product.category.name || product.category.categoryName;
            isCategorized = true;
        }
        const categoryDisplay = isCategorized ? categoryName : `<span class="category-uncategorized">${categoryName}</span>`;
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
    attachProductButtonEvents();
    attachStatusToggleButtons();
}

function displayProductsOldFormat(products, tableBody) {
    if (!products || !Array.isArray(products)) {
        tableBody.innerHTML = '<tr><td colspan="6" class="text-center">Không thể hiển thị sản phẩm do dữ liệu không hợp lệ</td></tr>';
        return;
    }
    const validProducts = products.filter(product => product !== undefined);
    if (validProducts.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="6" class="text-center">Không có sản phẩm nào</td></tr>';
        return;
    }
    validProducts.forEach(product => {
        const row = document.createElement('tr');
        let imagePath = '/assets/images/default-product.png';
        if (product.image) {
            if (product.image.startsWith('data:') || product.image.startsWith('http')) {
                imagePath = product.image;
            } else {
                imagePath = `${API_BASE_URL}/products/images/${product.image}`;
            }
        }
        const productName = product.name || product.productName || 'Sản phẩm không tên';
        const productPrice = (product.price || 0).toLocaleString('vi-VN');
        const productId = product.id || product.idProduct || '';
        let categoryName = 'Chưa phân loại';
        let isCategorized = false;
        if (product.category) {
            const catName = product.category.name || product.category.categoryName;
            if (catName) {
                categoryName = catName;
                isCategorized = true;
            }
        }
        if (!isCategorized && product.categoryName) {
            categoryName = product.categoryName;
            isCategorized = true;
        }
        if (!isCategorized && product.categoryId && window.cachedCategories) {
            const categoryFound = window.cachedCategories.find(c => (c.id && c.id == product.categoryId) || (c.idCategory && c.idCategory == product.categoryId));
            if (categoryFound) {
                categoryName = categoryFound.name || categoryFound.categoryName;
                isCategorized = true;
            }
        }
        const categoryDisplay = isCategorized ? categoryName : `<span class="category-uncategorized">${categoryName}</span>`;
        const isActiveProduct = product.status === 'active' || product.status === true || product.status === 1 || product.isAvailable === true || product.isAvailable === 1;
        const status = isActiveProduct ? 'Đang bán' : 'Ngừng bán';
        const statusClass = isActiveProduct ? 'active' : 'inactive';
        row.innerHTML = `
            <td><img src="${imagePath}" alt="${productName}" onerror="this.src='/assets/images/default-product.png'" class="product-thumbnail"></td>
            <td>${productName}</td>
            <td>${categoryDisplay}</td>
            <td>${productPrice} VNĐ</td>
            <td><span class="status-badge ${statusClass}">${status}</span></td>
            <td class="actions">
                <button class="btn-icon edit-product btn-sua Sua" data-id="${productId}" title="Chỉnh sửa"><i class="fas fa-edit"></i> Sửa</button>
                <button class="btn-icon delete-product btn-xoa Xoa" data-id="${productId}" title="Xóa"><i class="fas fa-trash-alt"></i> Xóa</button>
            </td>
        `;
        tableBody.appendChild(row);
    });
    setupProductActions();
}

function attachProductButtonEvents() {
    const editButtons = document.querySelectorAll('.edit-product-btn, .edit-product, .btn-sua, [class*="sua"]');
    
    editButtons.forEach(button => {
        button.removeEventListener('click', editButtonClickHandler);
        button.addEventListener('click', editButtonClickHandler);
    });
    
    const deleteButtons = document.querySelectorAll('.delete-product-btn, .delete-product, .btn-xoa, [class*="xoa"]');
    deleteButtons.forEach(button => {
        button.removeEventListener('click', deleteButtonClickHandler);
        button.addEventListener('click', deleteButtonClickHandler);
    });
}

function editButtonClickHandler(event) {
    const productId = this.getAttribute('data-id');
    if (!productId) {
        return;
    }
    editProduct(productId);
}

function deleteButtonClickHandler(event) {
    const productId = this.getAttribute('data-id');
    if (confirm('Bạn có chắc muốn xóa sản phẩm này không?')) {
        deleteProduct(productId);
    }
}

function attachStatusToggleButtons() {
    const toggleButtons = document.querySelectorAll('.btn-toggle-status');
    toggleButtons.forEach(button => {
        button.addEventListener('click', async function(e) {
            e.preventDefault();
            e.stopPropagation();
            showLoadingMessage('Đang cập nhật trạng thái sản phẩm...');
            try {
                const productId = this.getAttribute('data-id');
                const currentStatus = this.getAttribute('data-status');
                const newIsAvailable = currentStatus !== 'active';
                this.disabled = true;
                const result = await updateProductStatus(productId, newIsAvailable);
                const actualStatus = result.isAvailable;
                const statusText = actualStatus ? 'active' : 'inactive';
                const statusDisplay = actualStatus ? 'Đang bán' : 'Ngừng bán';
                const statusBadge = this.closest('.product-status-container').querySelector('.product-status-badge');
                if (statusBadge) {
                    statusBadge.className = `product-status-badge ${statusText === 'active' ? 'status-active' : 'status-inactive'}`;
                    statusBadge.textContent = statusDisplay;
                }
                this.setAttribute('data-status', statusText);
                showSuccessMessage('Đã cập nhật trạng thái sản phẩm!');
            } catch (error) {
                showErrorMessage('Lỗi khi cập nhật trạng thái sản phẩm: ' + error.message);
            } finally {
                this.disabled = false;
                hideLoadingMessage();
            }
        });
    });
}

export async function updateProductStatus(productId, isAvailable) {
    try {
        const result = await ApiClient.Product.updateProductStatus(productId, isAvailable);
        if (typeof ApiClient.clearCache === 'function') {
            ApiClient.clearCache();
        }
        let actualStatus = null;
        if (result) {
            if (result.isAvailable !== undefined) {
                actualStatus = result.isAvailable === true || result.isAvailable === 1 || result.isAvailable === 'true';
            } else if (result.status !== undefined) {
                actualStatus = result.status === true || result.status === 1 || result.status === 'active' || result.status === 'true';
            } else if (result.product) {
                if (result.product.isAvailable !== undefined) {
                    actualStatus = result.product.isAvailable === true || result.product.isAvailable === 1 || result.product.isAvailable === 'true';
                } else if (result.product.status !== undefined) {
                    actualStatus = result.product.status === true || result.product.status === 1 || result.product.status === 'active' || result.product.status === 'true';
                }
            }
        }
        if (actualStatus === null) {
            actualStatus = isAvailable;
        }
        return {
            isAvailable: actualStatus,
            message: `Đã cập nhật trạng thái thành ${actualStatus ? 'Đang bán' : 'Ngừng bán'}`
        };
    } catch (error) {
        throw error;
    }
}

function setupProductActions() {
    attachProductButtonEvents();
}

async function ensureCategoriesLoaded() {
    if (!window.cachedCategories || window.cachedCategories.length === 0) {
        if (isLoadingCategories) {
            await new Promise(resolve => setTimeout(resolve, 1000));
            return ensureCategoriesLoaded();
        }
        try {
            await loadCategoriesForDropdown();
        } catch (error) {
            window.cachedCategories = [];
        }
    }
    return window.cachedCategories;
}

export async function editProduct(productId) {
    try {
        showLoadingMessage('Đang tải thông tin sản phẩm...');
        await ensureCategoriesLoaded();
        const product = await ApiClient.Product.getProductById(productId);
        
        if (!product.category && !product.categoryName && product.categoryId) {
            const categoryFound = window.cachedCategories.find(c => c.id == product.categoryId || c.idCategory == product.categoryId);
            if (categoryFound) {
                product.category = categoryFound;
                product.categoryName = categoryFound.name || categoryFound.categoryName;
            }
        }
        
        const editProductModal = document.getElementById('edit-product-modal');
        const productModal = document.getElementById('productModal');
        
        if (editProductModal) {
            updateNewModalWithProductData(product, editProductModal);
            if (typeof bootstrap !== 'undefined' && typeof bootstrap.Modal !== 'undefined') {
                const modalInstance = new bootstrap.Modal(editProductModal);
                modalInstance.show();
            } else {
                editProductModal.style.display = 'flex';
            }
        } else if (productModal) {
            updateOldModalWithProductData(product, productModal);
            if (typeof openModal === 'function') {
                openModal('productModal');
            } else {
                productModal.style.display = 'flex';
                document.body.style.overflow = 'hidden';
            }
        } else {
            showErrorMessage('Không tìm thấy modal chỉnh sửa sản phẩm trên trang');
            return;
        }
        
        hideLoadingMessage();
    } catch (error) {
        hideLoadingMessage();
        showErrorMessage('Không thể lấy thông tin sản phẩm: ' + error.message);
    }
}

function updateOldModalWithProductData(product, modal) {
    const title = modal.querySelector('h2');
    if (title) {
        title.innerHTML = '<i class="fas fa-coffee"></i> Chỉnh sửa sản phẩm';
    }
    const idInput = document.getElementById('productId');
    const nameInput = document.getElementById('productName');
    const priceInput = document.getElementById('productPrice');
    const descInput = document.getElementById('productDescription');
    const categorySelect = document.getElementById('category');
    const statusSelect = document.getElementById('productStatus');
    if (idInput) idInput.value = product.id || product.idProduct;
    if (nameInput) {
        const displayName = product.name || product.productName;
        nameInput.value = displayName || '';
    }
    if (priceInput) priceInput.value = product.price;
    if (descInput) descInput.value = product.description || '';
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
                const option = Array.from(categorySelect.options).find(opt => opt.textContent.trim().toLowerCase() === product.categoryName.trim().toLowerCase());
                if (option) {
                    categorySelect.value = option.value;
                    found = true;
                }
            }
            if (!found) {
                categorySelect.value = '';
            }
        });
    }
    if (statusSelect) {
        const isActiveProduct = product.status === 'active' || product.status === true || product.status === 1 || product.isAvailable === true || product.isAvailable === 1;
        statusSelect.value = isActiveProduct ? 'active' : 'inactive';
    }
    const imagePreview = document.getElementById('productImagePreview');
    if (imagePreview) {
        if (product.image) {
            let imagePath = '/assets/images/default-product.png';
            if (product.image.startsWith('data:') || product.image.startsWith('http')) {
                imagePath = product.image;
            } else {
                imagePath = `${API_BASE_URL}/products/images/${product.image}`;
            }
            imagePreview.innerHTML = `<img src="${imagePath}" alt="${product.name || product.productName}" onerror="this.src='/assets/images/default-product.png'">`;
        } else {
            imagePreview.innerHTML = `<img src="/assets/images/default-product.png" alt="Default Image">`;
        }
    }
    if (document.getElementById('ingredients')) {
        document.getElementById('ingredients').value = product.ingredients || '';
    }
    if (document.getElementById('preparationTime')) {
        document.getElementById('preparationTime').value = product.preparationTime || '';
    }
    if (document.getElementById('calories')) {
        document.getElementById('calories').value = product.calories || '';
    }
}

export async function deleteProduct(productId) {
    try {
        await ApiClient.Product.deleteProduct(productId);
        if (typeof invalidateCache === 'function') {
            invalidateCache('/products');
        }
        loadProductData();
        showSuccessMessage('Xóa sản phẩm thành công!');
    } catch (error) {
        showErrorMessage(`Lỗi khi xóa sản phẩm: ${error.message}`);
    }
}

export function setupProductFormSubmission() {
    const form = document.getElementById('productForm');
    if (!form) return;
    
    if (isProductFormInitialized) {
        return;
    }
    
    const newForm = form.cloneNode(true);
    form.parentNode.replaceChild(newForm, form);
    
    newForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        try {
            showLoadingMessage('Đang lưu sản phẩm...');
            const productId = document.getElementById('productId').value.trim();
            const name = document.getElementById('productName').value.trim();
            const price = document.getElementById('productPrice').value;
            const description = document.getElementById('productDescription').value.trim();
            const categoryId = document.getElementById('category').value;
            const statusEl = document.getElementById('productStatus');
            const isActive = statusEl ? statusEl.value === 'active' : true;
            
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
            
            const productData = {
                name: name,
                productName: name,
                price: parseFloat(price),
                description: description,
                categoryId: parseInt(categoryId),
                status: isActive,
                isAvailable: isActive
            };
            
            const isPopularEl = document.getElementById('isPopular');
            const isNewEl = document.getElementById('isNew');
            if (isPopularEl) productData.isPopular = isPopularEl.checked;
            if (isNewEl) productData.isNew = isNewEl.checked;
            
            const ingredientsEl = document.getElementById('ingredients');
            const prepTimeEl = document.getElementById('preparationTime');
            const caloriesEl = document.getElementById('calories');
            if (ingredientsEl && ingredientsEl.value.trim()) productData.ingredients = ingredientsEl.value.trim();
            if (prepTimeEl && prepTimeEl.value.trim()) productData.preparationTime = prepTimeEl.value.trim();
            if (caloriesEl && caloriesEl.value.trim()) productData.calories = caloriesEl.value.trim();
            
            const imageInput = document.getElementById('productImage');
            let hasNewImage = false;
            let imageFile = null;
            if (imageInput && imageInput.files && imageInput.files[0]) {
                hasNewImage = true;
                imageFile = imageInput.files[0];
            }
            
            let result;
            let successMessage;
            
            if (productId) {
                result = await ApiClient.Product.updateProduct(productId, productData);
                successMessage = 'Cập nhật sản phẩm thành công!';
            } else {
                result = await ApiClient.Product.createProduct(productData);
                successMessage = 'Thêm sản phẩm mới thành công!';
            }
            
            if (hasNewImage && imageFile && result) {
                const savedProductId = productId || (result.id || result.idProduct || (result.product && (result.product.id || result.product.idProduct)));
                if (savedProductId) {
                    await ApiClient.Product.uploadProductImage(savedProductId, imageFile);
                } else {
                    showErrorMessage('Đã lưu sản phẩm nhưng không thể tải lên ảnh.');
                }
            }
            
            if (typeof ApiClient.clearCache === 'function') {
                ApiClient.clearCache();
            }
            
            closeModal('productModal');
            resetProductForm();
            
            setTimeout(() => {
                loadProductData();
                showSuccessMessage(successMessage);
            }, 500);
        } catch (error) {
            showErrorMessage('Không thể lưu sản phẩm: ' + error.message);
        } finally {
            hideLoadingMessage();
        }
    });
    
    isProductFormInitialized = true;
}

export async function loadCategoriesForSelect(selectElementId, selectedCategoryId) {
    const selectElement = document.getElementById(selectElementId);
    if (!selectElement) return;
    try {
        const categories = await ApiClient.Category.getAllCategories();
        selectElement.innerHTML = '<option value="">-- Chọn danh mục --</option>';
        categories.forEach(category => {
            const option = document.createElement('option');
            const categoryId = category.id || category.idCategory;
            const categoryName = category.categoryName || category.name;
            option.value = categoryId;
            option.textContent = categoryName;
            if (selectedCategoryId && categoryId.toString() === selectedCategoryId.toString()) {
                option.selected = true;
            }
            selectElement.appendChild(option);
        });
    } catch (error) {
        showErrorMessage('Không thể tải danh mục. Vui lòng thử lại sau.');
    }
}

export async function loadCategoriesForDropdown() {
    if (isLoadingCategories) return;
    isLoadingCategories = true;
    
    try {
        const categories = await ApiClient.Category.getAllCategories();
        
        window.cachedCategories = categories;
        
        const categoryDropdown = document.getElementById('category');
        const categoryFilter = document.getElementById('categoryFilter');
        
        if (categoryDropdown) {
            categoryDropdown.innerHTML = '<option value="">-- Chọn danh mục --</option>';
            categories.forEach(category => {
                const option = document.createElement('option');
                option.value = category.id || category.idCategory;
                option.textContent = category.name || category.categoryName;
                categoryDropdown.appendChild(option);
            });
        }
        
        if (categoryFilter) {
            categoryFilter.innerHTML = '<option value="all">Tất cả danh mục</option>';
            categories.forEach(category => {
                const option = document.createElement('option');
                option.value = category.id || category.idCategory;
                option.textContent = category.name || category.categoryName;
                categoryFilter.appendChild(option);
            });
        }
        
        return categories;
    } catch (error) {
        console.error('Lỗi khi tải danh mục cho dropdown:', error);
        showErrorMessage('Không thể tải danh mục. Vui lòng thử lại sau.');
        return [];
    } finally {
        setTimeout(() => {
            isLoadingCategories = false;
        }, 2000);
    }
}

export function filterProducts(searchTerm) {
    if (!searchTerm) {
        const rows = document.querySelectorAll('#productTableBody tr, #products-table-body tr');
        rows.forEach(row => { row.style.display = ''; });
        return;
    }
    searchTerm = searchTerm.toLowerCase();
    const rows = document.querySelectorAll('#productTableBody tr, #products-table-body tr');
    rows.forEach(row => {
        const nameCell = row.querySelector('td:nth-child(2)') || row.querySelector('td:nth-child(3)');
        const categoryCell = row.querySelector('td:nth-child(3)') || row.querySelector('td:nth-child(4)');
        if (!nameCell && !categoryCell) { row.style.display = ''; return; }
        const name = nameCell ? nameCell.textContent.toLowerCase() : '';
        const category = categoryCell ? categoryCell.textContent.toLowerCase() : '';
        if (name.includes(searchTerm) || category.includes(searchTerm)) {
            row.style.display = '';
        } else {
            row.style.display = 'none';
        }
    });
}

export async function loadProductsByCategory(categoryId) {
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

function updateCategoryTitle(categoryName) {
    const categoryTitle = document.getElementById('category-title');
    if (categoryTitle) {
        categoryTitle.textContent = categoryName;
    }
    
    const breadcrumbCategory = document.querySelector('.breadcrumb .current-category');
    if (breadcrumbCategory) {
        breadcrumbCategory.textContent = categoryName;
    }
    
    document.title = `${categoryName} - T2K Coffee Admin`;
}

export function setupCategoryFilter() {
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

export function createCategoryFilter() {
    const searchBar = document.querySelector('.search-bar') || document.querySelector('.action-bar');
    if (!searchBar) return;
    const filterContainer = document.createElement('div');
    filterContainer.className = 'category-filter-container';
    filterContainer.style.marginLeft = '15px';
    filterContainer.style.display = 'inline-block';
    const filterLabel = document.createElement('label');
    filterLabel.setAttribute('for', 'categoryFilter');
    filterLabel.textContent = 'Lọc theo danh mục:';
    filterLabel.style.marginRight = '5px';
    const filterSelect = document.createElement('select');
    filterSelect.id = 'categoryFilter';
    filterSelect.className = 'form-select';
    filterSelect.style.display = 'inline-block';
    filterSelect.style.width = 'auto';
    filterSelect.style.marginRight = '10px';
    filterSelect.innerHTML = '<option value="all">Tất cả danh mục</option>';
    filterContainer.appendChild(filterLabel);
    filterContainer.appendChild(filterSelect);
    searchBar.appendChild(filterContainer);
    setupCategoryFilter();
    loadCategoriesForDropdown();
}

export async function loadAllProductsByAllCategories() {
    showLoadingMessage('Đang tải tất cả sản phẩm từ các danh mục...');
    try {
        await ensureCategoriesLoaded();
        const categories = await ApiClient.Category.getAllCategories();
        window.cachedCategories = categories;
        let allProducts = [];
        for (const category of categories) {
            const categoryId = category.id || category.idCategory;
            const categoryName = category.name || category.categoryName;
            if (Array.isArray(category.products)) {
                category.products.forEach(product => {
                    product.categoryId = categoryId;
                    product.categoryName = categoryName;
                    product.category = category;
                });
                allProducts = allProducts.concat(category.products);
            }
        }
        window._allProductsByCategory = allProducts;
        displayProducts(allProducts);
        showSuccessMessage(`Đã tải ${allProducts.length} sản phẩm từ tất cả danh mục`);
    } catch (error) {
        showErrorMessage('Không thể tải sản phẩm từ các danh mục: ' + error.message);
    }
}

export function addRefreshButton() {
    const actionBar = document.querySelector('.action-bar');
    if (!actionBar) return;
    const refreshButton = document.createElement('button');
    refreshButton.className = 'btn-secondary';
    refreshButton.innerHTML = '<i class="fas fa-sync-alt"></i> Làm mới';
    refreshButton.style.marginLeft = '10px';
    refreshButton.addEventListener('click', function() {
        if (typeof clearApiCache === 'function') {
            clearApiCache();
        }
        loadProductData();
        loadCategoriesForDropdown();
        showSuccessMessage('Đã làm mới dữ liệu!');
    });
    actionBar.appendChild(refreshButton);
}

export function updateNewModalWithProductData(product, modal) {
    document.getElementById('edit-product-id').value = product.id;
    document.getElementById('edit-product-name').value = product.name;
    document.getElementById('edit-product-price').value = product.price;
    document.getElementById('edit-product-description').value = product.description || '';
    document.getElementById('edit-product-status').value = product.status;
    const productImagePreview = document.getElementById('edit-product-image-preview');
    if (product.image) {
        let imagePath = '/assets/images/default-product.png';
        if (product.image.startsWith('data:') || product.image.startsWith('http')) {
            imagePath = product.image;
        } else {
            imagePath = `${API_BASE_URL}/products/images/${product.image}`;
        }
        productImagePreview.src = imagePath;
        productImagePreview.setAttribute('data-original-image', product.image);
    } else {
        productImagePreview.src = '/assets/images/default-product.png';
        productImagePreview.setAttribute('data-original-image', '');
    }
    productImagePreview.onerror = function() {
        this.onerror = null;
        this.src = '/assets/images/default-product.png';
    };
    document.getElementById('edit-product-image').value = '';
    if (typeof loadCategoriesForSelect === 'function') {
        loadCategoriesForSelect('edit-product-category', product.categoryId);
    } else {
        const categorySelect = document.getElementById('edit-product-category');
        if (categorySelect && product.categoryId) {
            categorySelect.value = product.categoryId;
        }
    }
    if (typeof bootstrap !== 'undefined' && typeof bootstrap.Modal !== 'undefined') {
        const modalInstance = new bootstrap.Modal(modal);
        modalInstance.show();
    } else {
        openModal(modal.id);
    }
}
