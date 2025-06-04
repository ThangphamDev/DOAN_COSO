import * as UserModule from './entities-user.js';
import * as CategoryModule from './entities-category.js';
import * as ProductModule from './entities-product.js';
import * as StaffModule from './entities-staff.js';
import * as Utils from './entities-utils.js';

export const User = UserModule;
export const Category = CategoryModule;
export const Product = ProductModule;
export const Staff = StaffModule;
export const Utilities = Utils;

export function initializeEntitySystem() {
    console.log('Khởi tạo hệ thống quản lý entities...');
    
    const currentPage = window.location.pathname.split('/').pop();
    
    if (currentPage === 'user.html') {
        console.log('Trang quản lý người dùng được phát hiện');
        UserModule.initializeUserManagement();
    } 
    else if (currentPage === 'products.html') {
        console.log('Trang quản lý sản phẩm được phát hiện');
        ProductModule.initializeProductManagement(); 
    }
    else if (currentPage === 'staff.html') {
        console.log('Trang quản lý nhân viên được phát hiện');
        StaffModule.initializeStaffManagement();
    }
    else if (currentPage === 'categories.html') {
        console.log('Trang quản lý danh mục được phát hiện');
        CategoryModule.initializeCategoryManagement();
    }
    else {
        console.log('Không phát hiện trang quản lý entities cụ thể');
    }
}

window.AdminEntities = {
    initializeUserManagement: UserModule.initializeUserManagement,
    initializeProductManagement: ProductModule.initializeProductManagement,
    initializeStaffManagement: StaffModule.initializeStaffManagement,
    initializeCategoryManagement: CategoryModule.initializeCategoryManagement,
    filterProducts: ProductModule.filterProducts || function(filter){
        console.log('Filtering products with:', filter);
        return ProductModule.Product.filter(product => 
            (!filter.category || product.categoryId == filter.category) &&
            (!filter.status || product.status == filter.status) &&
            (!filter.search || product.name.toLowerCase().includes(filter.search.toLowerCase()))
        );
    }
};

document.addEventListener('DOMContentLoaded', function() {
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
    document.head.appendChild(style);
    
    if (!window.ApiClient) {
        console.error('API Client chưa được tải!');
        if (window.AdminCore) {
            window.AdminCore.showNotification('Không thể kết nối đến server', 'error');
        }
        return;
    }
    
    initializeEntitySystem();
}); 