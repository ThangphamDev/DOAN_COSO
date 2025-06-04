import { showLoadingMessage, showSuccessMessage, showErrorMessage, hideLoadingMessage, initializeModal, setupSearchFilter } from './entities-utils.js';

let isLoadingCategories = false;
window.cachedCategories = [];

export async function loadCategoryData() {
    showLoadingMessage('Đang tải dữ liệu danh mục...');
    
    try {
        const categories = await ApiClient.Category.getAllCategories();
        displayCategories(categories);
        
        window.cachedCategories = categories;
        
        showSuccessMessage('Đã tải dữ liệu danh mục thành công');
    } catch (error) {
        console.error('Lỗi khi tải dữ liệu danh mục:', error);
        showErrorMessage('Lỗi kết nối API: ' + error.message + '. Vui lòng kiểm tra server API có đang chạy không.');
    } finally {
        hideLoadingMessage();
    }
}

export function displayCategories(categories) {
    const tableBody = document.getElementById('categoryTableBody');
    if (!tableBody) return;
    
    tableBody.innerHTML = '';
    
    if (!categories || categories.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="4" class="text-center">Không có danh mục nào</td></tr>';
        return;
    }
    
    categories.forEach(category => {
        const row = document.createElement('tr');
        
        const categoryId = category.id || category.idCategory;
        const categoryName = category.name || category.categoryName;
        const description = category.description || '';
        
        row.innerHTML = `
            <td>${categoryId}</td>
            <td>${categoryName}</td>
            <td>${description}</td>
            <td class="actions">
                <button class="btn-icon edit-category" data-id="${categoryId}" title="Chỉnh sửa"><i class="fas fa-edit"></i></button>
                <button class="btn-icon delete-category" data-id="${categoryId}" title="Xóa"><i class="fas fa-trash-alt"></i></button>
            </td>
        `;
        
        tableBody.appendChild(row);
    });
    
    setupCategoryActions();
}

function setupCategoryActions() {
    const editButtons = document.querySelectorAll('.edit-category');
    editButtons.forEach(button => {
        button.addEventListener('click', function() {
            const categoryId = this.getAttribute('data-id');
            editCategory(categoryId);
        });
    });
    
    const deleteButtons = document.querySelectorAll('.delete-category');
    deleteButtons.forEach(button => {
        button.addEventListener('click', function() {
            const categoryId = this.getAttribute('data-id');
            deleteCategory(categoryId);
        });
    });
}

async function editCategory(categoryId) {
    try {
        showLoadingMessage('Đang tải thông tin danh mục...');
        
        const category = await ApiClient.Category.getCategoryById(categoryId);
        
        document.getElementById('categoryId').value = category.id || category.idCategory;
        document.getElementById('categoryName').value = category.name || category.categoryName;
        document.getElementById('categoryDescription').value = category.description || '';
        
        const title = document.querySelector('#categoryModal h2');
        if (title) {
            title.textContent = 'Chỉnh sửa danh mục';
        }
        
        document.getElementById('categoryModal').style.display = 'flex';
        setTimeout(() => {
            document.getElementById('categoryModal').classList.add('show');
        }, 10);
        
        hideLoadingMessage();
    } catch (error) {
        console.error('Lỗi khi lấy thông tin danh mục:', error);
        showErrorMessage('Không thể lấy thông tin danh mục');
    }
}

async function deleteCategory(categoryId) {
    if (!confirm('Bạn có chắc muốn xóa danh mục này? Các sản phẩm thuộc danh mục này cũng có thể bị ảnh hưởng.')) {
        return;
    }
    
    try {
        showLoadingMessage('Đang xóa danh mục...');
        
        await ApiClient.Category.deleteCategory(categoryId);
        
        if (window.cachedCategories) {
            window.cachedCategories = window.cachedCategories.filter(c => 
                (c.id != categoryId) && (c.idCategory != categoryId));
        }
        
        loadCategoryData();
        
        showSuccessMessage('Xóa danh mục thành công');
    } catch (error) {
        console.error('Lỗi khi xóa danh mục:', error);
        showErrorMessage('Không thể xóa danh mục. ' + error.message);
    }
}

export function setupCategoryFormSubmission() {
    const form = document.getElementById('categoryForm');
    if (!form) return;
    
    form.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        if (!validateCategoryForm()) {
            return;
        }
        
        const categoryData = {
            id: document.getElementById('categoryId').value,
            name: document.getElementById('categoryName').value.trim(),
            categoryName: document.getElementById('categoryName').value.trim(), // Đảm bảo tương thích API
            description: document.getElementById('categoryDescription').value.trim()
        };
        
        const isUpdate = categoryData.id !== '';
        
        try {
            showLoadingMessage(`Đang ${isUpdate ? 'cập nhật' : 'thêm'} danh mục...`);
            
            if (isUpdate) {
                await ApiClient.Category.updateCategory(categoryData.id, categoryData);
            } else {
                await ApiClient.Category.createCategory(categoryData);
            }
            
            document.getElementById('categoryModal').classList.remove('show');
            setTimeout(() => {
                document.getElementById('categoryModal').style.display = 'none';
            }, 300);
            
            if (typeof ApiClient.clearCache === 'function') {
                ApiClient.clearCache();
            }
            
            loadCategoryData();
            
            showSuccessMessage(`Đã ${isUpdate ? 'cập nhật' : 'thêm'} danh mục thành công`);
        } catch (error) {
            console.error(`Lỗi khi ${isUpdate ? 'cập nhật' : 'thêm'} danh mục:`, error);
            showErrorMessage(`Có lỗi xảy ra khi ${isUpdate ? 'cập nhật' : 'thêm'} danh mục: ` + error.message);
        }
    });
}

function validateCategoryForm() {
    const categoryName = document.getElementById('categoryName').value.trim();
    
    if (!categoryName) {
        showErrorMessage('Vui lòng nhập tên danh mục');
        return false;
    }
    
    return true;
}

export function filterCategories(searchTerm) {
    searchTerm = searchTerm.toLowerCase();
    
    const rows = document.querySelectorAll('#categoryTableBody tr');
    
    rows.forEach(row => {
        const name = row.querySelector('td:nth-child(2)').textContent.toLowerCase();
        const description = row.querySelector('td:nth-child(3)').textContent.toLowerCase();
        
        if (name.includes(searchTerm) || description.includes(searchTerm)) {
            row.style.display = '';
        } else {
            row.style.display = 'none';
        }
    });
}

export async function loadCategoriesForDropdown() {
    if (isLoadingCategories) return;
    isLoadingCategories = true;
    
    try {
        let categories = [];
        
        if (window.cachedCategories && window.cachedCategories.length > 0) {
            categories = window.cachedCategories;
            console.log('Sử dụng danh mục từ cache:', categories);
        } else {
            console.log('Không có danh mục trong cache, tải từ API...');
            
            try {
                categories = await ApiClient.Category.getAllCategories();
                
                if (categories && categories.length > 0) {
                    window.cachedCategories = categories;
                }
            } catch (apiError) {
                console.error('Lỗi khi tải danh mục từ API:', apiError);
            }
        }
        
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
        
        showSuccessMessage(`Đã tải ${categories.length} danh mục`);
    } catch (error) {
        console.error('Lỗi khi tải danh mục cho dropdown:', error);
        showErrorMessage('Không thể tải danh mục. Vui lòng thử lại sau.');
    } finally {
        setTimeout(() => {
            isLoadingCategories = false;
        }, 2000);
    }
}

export function initializeCategoryManagement() {
    console.log('Khởi tạo chức năng quản lý danh mục');
    
    loadCategoryData();
    
    initializeModal('categoryModal', 'addCategoryBtn');
    
    setupCategoryFormSubmission();
    
    setupSearchFilter('searchCategory', filterCategories);
}
