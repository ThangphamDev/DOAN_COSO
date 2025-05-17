// entities-user.js
// Toàn bộ logic quản lý người dùng, chỉ dùng API thật, không có dữ liệu mẫu

import { showLoadingMessage, showSuccessMessage, showErrorMessage, hideLoadingMessage, initializeModal, setupSearchFilter, formatRole } from './entities-utils.js';

export async function loadUserData() {
    showLoadingMessage('Đang tải dữ liệu người dùng...');
    
    try {
        // Gọi API để lấy danh sách người dùng
        const users = await ApiClient.User.getAllUsers();
        displayUsers(users);
        
        showSuccessMessage('Đã tải dữ liệu người dùng thành công');
    } catch (error) {
        console.error('Lỗi khi tải dữ liệu người dùng:', error);
        showErrorMessage('Lỗi kết nối API: ' + error.message + '. Vui lòng kiểm tra server API có đang chạy không.');
    } finally {
        hideLoadingMessage();
    }
}

export function displayUsers(users) {
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

function setupUserActions() {
    // Xử lý nút chỉnh sửa
    const editButtons = document.querySelectorAll('.edit-user');
    editButtons.forEach(button => {
        button.addEventListener('click', function() {
            const userId = this.getAttribute('data-id');
            editUser(userId);
        });
    });
    
    // Xử lý nút xóa
    const deleteButtons = document.querySelectorAll('.delete-user');
    deleteButtons.forEach(button => {
        button.addEventListener('click', function() {
            const userId = this.getAttribute('data-id');
            if (confirm('Bạn có chắc muốn xóa người dùng này không?')) {
                deleteUser(userId);
            }
        });
    });
}

async function editUser(userId) {
    try {
        showLoadingMessage('Đang tải thông tin người dùng...');
        
        // Gọi API để lấy thông tin người dùng
        const user = await ApiClient.User.getUserById(userId);
        
        // Điền dữ liệu vào form
        document.getElementById('userId').value = user.id;
        document.getElementById('username').value = user.username;
        document.getElementById('fullName').value = user.fullName;
        document.getElementById('password').value = '';
        document.getElementById('role').value = user.role;
        
        // Điền thông tin khác nếu có
        if (document.getElementById('phone')) {
            document.getElementById('phone').value = user.phone || '';
        }
        
        if (document.getElementById('address')) {
            document.getElementById('address').value = user.address || '';
        }
        
        // Cập nhật tiêu đề
        const title = document.querySelector('#userModal h2');
        if (title) {
            title.textContent = 'Chỉnh sửa người dùng';
        }
        
        // Mở modal
        document.getElementById('userModal').style.display = 'flex';
        setTimeout(() => {
            document.getElementById('userModal').classList.add('show');
        }, 10);
        
        hideLoadingMessage();
    } catch (error) {
        console.error('Lỗi khi lấy thông tin người dùng:', error);
        showErrorMessage('Không thể lấy thông tin người dùng');
    }
}

async function deleteUser(userId) {
    try {
        showLoadingMessage('Đang xóa người dùng...');
        
        // Gọi API để xóa người dùng
        await ApiClient.User.deleteUser(userId);
        
        // Tải lại danh sách người dùng
        loadUserData();
        
        showSuccessMessage('Xóa người dùng thành công');
    } catch (error) {
        console.error('Lỗi khi xóa người dùng:', error);
        showErrorMessage('Không thể xóa người dùng');
    }
}

export function setupUserFormSubmission() {
    const form = document.getElementById('userForm');
    if (!form) return;
    
    form.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        // Kiểm tra dữ liệu
        if (!validateUserForm()) {
            return;
        }
        
        // Thu thập dữ liệu từ form
        const userData = {
            id: document.getElementById('userId').value,
            username: document.getElementById('username').value,
            fullName: document.getElementById('fullName').value,
            password: document.getElementById('password').value,
            role: document.getElementById('role').value,
            phone: document.getElementById('phone').value,
            address: document.getElementById('address').value
        };
        
        // Xác định thêm mới hay cập nhật
        const isUpdate = userData.id !== '';
        
        try {
            showLoadingMessage(`Đang ${isUpdate ? 'cập nhật' : 'thêm'} người dùng...`);
            
            if (isUpdate) {
                // Cập nhật người dùng hiện có
                await ApiClient.User.updateUser(userData.id, userData);
            } else {
                // Thêm người dùng mới
                await ApiClient.User.createUser(userData);
            }
            
            // Đóng modal
            document.getElementById('userModal').classList.remove('show');
            setTimeout(() => {
                document.getElementById('userModal').style.display = 'none';
            }, 300);
            
            // Tải lại danh sách người dùng
            loadUserData();
            
            showSuccessMessage(`Đã ${isUpdate ? 'cập nhật' : 'thêm'} người dùng thành công`);
        } catch (error) {
            console.error(`Lỗi khi ${isUpdate ? 'cập nhật' : 'thêm'} người dùng:`, error);
            showErrorMessage(`Có lỗi xảy ra khi ${isUpdate ? 'cập nhật' : 'thêm'} người dùng`);
        }
    });
}

function validateUserForm() {
    const username = document.getElementById('username').value.trim();
    const fullName = document.getElementById('fullName').value.trim();
    const password = document.getElementById('password').value;
    const userId = document.getElementById('userId').value;
    
    // Kiểm tra username
    if (!username) {
        showErrorMessage('Vui lòng nhập tên đăng nhập');
        return false;
    }
    
    // Kiểm tra fullName
    if (!fullName) {
        showErrorMessage('Vui lòng nhập họ tên');
        return false;
    }
    
    // Kiểm tra password - chỉ bắt buộc khi thêm mới
    if (!userId && !password) {
        showErrorMessage('Vui lòng nhập mật khẩu');
        return false;
    }
    
    return true;
}

export function filterUsers(searchTerm) {
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

export function initializeUserManagement() {
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
// ... các hàm khác liên quan đến người dùng ... 