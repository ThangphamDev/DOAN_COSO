import { showLoadingMessage, showSuccessMessage, showErrorMessage, hideLoadingMessage, initializeModal, setupSearchFilter, formatRole } from './entities-utils.js';

export async function loadStaffData() {
    showLoadingMessage('Đang tải dữ liệu nhân viên...');
    
    try {
        const staffList = await ApiClient.Staff.getAllStaff();
        displayStaff(staffList);
        
        showSuccessMessage('Đã tải dữ liệu nhân viên thành công');
    } catch (error) {
        console.error('Lỗi khi tải dữ liệu nhân viên:', error);
        showErrorMessage('Lỗi kết nối API: ' + error.message + '. Vui lòng kiểm tra server API có đang chạy không.');
    } finally {
        hideLoadingMessage();
    }
}

export function displayStaff(staffList) {
    const tableBody = document.getElementById('staffTableBody');
    if (!tableBody) return;
    
    tableBody.innerHTML = '';
    
    if (!staffList || staffList.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="6" class="text-center">Không có nhân viên nào</td></tr>';
        return;
    }
    
    staffList.forEach(staff => {
        const row = document.createElement('tr');
        
        row.innerHTML = `
            <td>${staff.id}</td>
            <td>${staff.fullName || ''}</td>
            <td>${staff.email || ''}</td>
            <td>${staff.phone || ''}</td>
            <td>${formatPosition(staff.position)}</td>
            <td class="actions">
                <button class="btn-icon edit-staff" data-id="${staff.id}" title="Chỉnh sửa"><i class="fas fa-edit"></i></button>
                <button class="btn-icon delete-staff" data-id="${staff.id}" title="Xóa"><i class="fas fa-trash-alt"></i></button>
            </td>
        `;
        
        tableBody.appendChild(row);
    });
    
    setupStaffActions();
}

function formatPosition(position) {
    if (position === 'manager') {
        return 'Quản lý';
    } else if (position === 'barista') {
        return 'Pha chế';
    } else if (position === 'cashier') {
        return 'Thu ngân';
    } else if (position === 'waiter') {
        return 'Phục vụ';
    }
    return position || 'Chưa phân công';
}

function setupStaffActions() {
    const editButtons = document.querySelectorAll('.edit-staff');
    editButtons.forEach(button => {
        button.addEventListener('click', function() {
            const staffId = this.getAttribute('data-id');
            editStaff(staffId);
        });
    });
    
    const deleteButtons = document.querySelectorAll('.delete-staff');
    deleteButtons.forEach(button => {
        button.addEventListener('click', function() {
            const staffId = this.getAttribute('data-id');
            if (confirm('Bạn có chắc muốn xóa nhân viên này không?')) {
                deleteStaff(staffId);
            }
        });
    });
}

async function editStaff(staffId) {
    try {
        showLoadingMessage('Đang tải thông tin nhân viên...');
        
        const staff = await ApiClient.Staff.getStaffById(staffId);
        
        document.getElementById('staffId').value = staff.id;
        document.getElementById('fullName').value = staff.fullName || '';
        document.getElementById('email').value = staff.email || '';
        document.getElementById('phone').value = staff.phone || '';
        document.getElementById('position').value = staff.position || '';
        
        if (document.getElementById('address')) {
            document.getElementById('address').value = staff.address || '';
        }
        
        if (document.getElementById('joinDate')) {
            document.getElementById('joinDate').value = staff.joinDate || '';
        }
        
        const title = document.querySelector('#staffModal h2');
        if (title) {
            title.textContent = 'Chỉnh sửa nhân viên';
        }
        
        document.getElementById('staffModal').style.display = 'flex';
        setTimeout(() => {
            document.getElementById('staffModal').classList.add('show');
        }, 10);
        
        hideLoadingMessage();
    } catch (error) {
        console.error('Lỗi khi lấy thông tin nhân viên:', error);
        showErrorMessage('Không thể lấy thông tin nhân viên');
    }
}

async function deleteStaff(staffId) {
    try {
        showLoadingMessage('Đang xóa nhân viên...');
        
        await ApiClient.Staff.deleteStaff(staffId);
        
        loadStaffData();
        
        showSuccessMessage('Xóa nhân viên thành công');
    } catch (error) {
        console.error('Lỗi khi xóa nhân viên:', error);
        showErrorMessage('Không thể xóa nhân viên');
    }
}

export function setupStaffFormSubmission() {
    const form = document.getElementById('staffForm');
    if (!form) return;
    
    form.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        if (!validateStaffForm()) {
            return;
        }
        
        const staffData = {
            id: document.getElementById('staffId').value,
            fullName: document.getElementById('fullName').value.trim(),
            email: document.getElementById('email').value.trim(),
            phone: document.getElementById('phone').value.trim(),
            position: document.getElementById('position').value
        };
        
        if (document.getElementById('address')) {
            staffData.address = document.getElementById('address').value.trim();
        }
        
        if (document.getElementById('joinDate')) {
            staffData.joinDate = document.getElementById('joinDate').value;
        }
        
        const isUpdate = staffData.id !== '';
        
        try {
            showLoadingMessage(`Đang ${isUpdate ? 'cập nhật' : 'thêm'} nhân viên...`);
            
            if (isUpdate) {
                await ApiClient.Staff.updateStaff(staffData.id, staffData);
            } else {
                await ApiClient.Staff.createStaff(staffData);
            }
            
            document.getElementById('staffModal').classList.remove('show');
            setTimeout(() => {
                document.getElementById('staffModal').style.display = 'none';
            }, 300);
            
            loadStaffData();
            
            showSuccessMessage(`Đã ${isUpdate ? 'cập nhật' : 'thêm'} nhân viên thành công`);
        } catch (error) {
            console.error(`Lỗi khi ${isUpdate ? 'cập nhật' : 'thêm'} nhân viên:`, error);
            showErrorMessage(`Có lỗi xảy ra khi ${isUpdate ? 'cập nhật' : 'thêm'} nhân viên`);
        }
    });
}

function validateStaffForm() {
    const fullName = document.getElementById('fullName').value.trim();
    const email = document.getElementById('email').value.trim();
    const phone = document.getElementById('phone').value.trim();
    
    if (!fullName) {
        showErrorMessage('Vui lòng nhập họ tên nhân viên');
        return false;
    }
    
    if (email && !validateEmail(email)) {
        showErrorMessage('Email không hợp lệ');
        return false;
    }
    
    if (!phone) {
        showErrorMessage('Vui lòng nhập số điện thoại');
        return false;
    }
    
    return true;
}

function validateEmail(email) {
    const re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return re.test(String(email).toLowerCase());
}

export function filterStaff(searchTerm) {
    searchTerm = searchTerm.toLowerCase();
    
    const rows = document.querySelectorAll('#staffTableBody tr');
    
    rows.forEach(row => {
        const fullName = row.querySelector('td:nth-child(2)').textContent.toLowerCase();
        const email = row.querySelector('td:nth-child(3)').textContent.toLowerCase();
        const phone = row.querySelector('td:nth-child(4)').textContent.toLowerCase();
        const position = row.querySelector('td:nth-child(5)').textContent.toLowerCase();
        
        if (
            fullName.includes(searchTerm) || 
            email.includes(searchTerm) || 
            phone.includes(searchTerm) || 
            position.includes(searchTerm)
        ) {
            row.style.display = '';
        } else {
            row.style.display = 'none';
        }
    });
}

export function initializeStaffManagement() {
    console.log('Khởi tạo chức năng quản lý nhân viên');
    
    loadStaffData();
    
    initializeModal('staffModal', 'addStaffBtn');
    
    setupStaffFormSubmission();
    
    setupSearchFilter('searchStaff', filterStaff);
}
