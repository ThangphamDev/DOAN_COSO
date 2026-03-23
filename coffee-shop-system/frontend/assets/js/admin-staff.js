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

function getAuthHeadersForFormData() {
    const token = getAuthToken();
    const headers = {};
    
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }
    
    return headers;
}

const DEFAULT_AVATAR = '../assets/images/default-avatar.png';
const staffImageCache = {};

let staffList = [];        
let originalList = [];     
let currentPage = 1;       
let itemsPerPage = 10;     
let totalPages = 1;        
let isEditMode = false;
let currentStaffId = null;


document.addEventListener('DOMContentLoaded', function() {
    loadStaffData();
    
    attachEventListeners();
    
    initImagePreview();
});

function initImagePreview() {
    const imageInput = document.getElementById('staffImage');
    const previewElement = document.getElementById('staffImagePreview');
    
    if (imageInput && previewElement) {
        imageInput.addEventListener('change', function() {
            const file = this.files[0];
            if (file) {
                if (file.size > 2 * 1024 * 1024) {
                    showNotification('Kích thước ảnh quá lớn.', 'warning');
                    this.value = ''; 
                    return;
                }
                
                const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/jpg'];
                if (!validTypes.includes(file.type)) {
                    showNotification('Loại tệp không hợp lệ. Vui lòng chọn ảnh JPEG, PNG hoặc GIF.', 'warning');
                    this.value = '';
                    return;
                }
                
                const reader = new FileReader();
                reader.onload = function(e) {
                    previewElement.innerHTML = `<img src="${e.target.result}" alt="Preview">`;
                };
                reader.readAsDataURL(file);
            } else {
                previewElement.innerHTML = `<span id="previewPlaceholder">Chọn ảnh để xem trước</span>`;
            }
        });
    }
}

function attachEventListeners() {
    const addStaffBtn = document.getElementById('addStaffBtn');
    if (addStaffBtn) {
        addStaffBtn.addEventListener('click', openAddStaffModal);
    }
    
    const closeButtons = document.querySelectorAll('.close-btn, .btn-cancel[data-close-modal]');
    closeButtons.forEach(button => {
        button.addEventListener('click', closeModal);
    });
    
    const staffForm = document.getElementById('staffForm');
    if (staffForm) {
        staffForm.addEventListener('submit', handleStaffFormSubmit);
    }
    
    const confirmDeleteBtn = document.getElementById('confirmDeleteBtn');
    if (confirmDeleteBtn) {
        confirmDeleteBtn.addEventListener('click', confirmDeleteStaff);
    }
    
    const prevPageBtn = document.getElementById('prevPage');
    const nextPageBtn = document.getElementById('nextPage');
    if (prevPageBtn) prevPageBtn.addEventListener('click', goToPrevPage);
    if (nextPageBtn) nextPageBtn.addEventListener('click', goToNextPage);
    
    const itemsPerPageSelect = document.getElementById('itemsPerPage');
    if (itemsPerPageSelect) {
        itemsPerPageSelect.addEventListener('change', changeItemsPerPage);
    }
    
    const searchInput = document.getElementById('staffSearchInput');
    if (searchInput) {
        searchInput.addEventListener('input', debounce(handleSearch, 300));
    }
    
    const roleFilter = document.getElementById('staffRoleFilter');
    if (roleFilter) {
        roleFilter.addEventListener('change', filterStaffByRole);
    }
    
    const refreshBtn = document.getElementById('refreshStaffBtn');
    if (refreshBtn) {
        refreshBtn.addEventListener('click', refreshStaffData);
    }
}

function attachStaffButtonEvents() {
    const editButtons = document.querySelectorAll('.edit-product-btn');
    editButtons.forEach(button => {
        button.removeEventListener('click', editButtonHandler);
        button.addEventListener('click', editButtonHandler);
    });
    
    const deleteButtons = document.querySelectorAll('.delete-product-btn');
    deleteButtons.forEach(button => {
        button.removeEventListener('click', deleteButtonHandler);
        button.addEventListener('click', deleteButtonHandler);
    });
}

function editButtonHandler() {
    const staffId = this.getAttribute('data-id');
    if (staffId) {
        editStaff(staffId);
    } else {
        console.error('Missing staff ID for edit button');
    }
}

function deleteButtonHandler() {
    const staffId = this.getAttribute('data-id');
    const staffName = this.getAttribute('data-name');
    if (staffId) {
        openDeleteConfirmModal(staffId, staffName);
    } else {
        console.error('Missing staff ID for delete button');
    }
}

function openAddStaffModal() {
    resetStaffForm();
    
    const modalTitle = document.getElementById('staffModalTitle');
    if (modalTitle) {
        modalTitle.innerHTML = '<i class="fas fa-user-plus"></i> Thêm nhân viên mới';
    }
    
    const passwordRequired = document.getElementById('passwordRequired');
    if (passwordRequired) {
        passwordRequired.style.display = 'inline';
    }
    
    const modal = document.getElementById('staffModal');
    if (modal) {
        modal.style.display = 'block';
    }
}

function resetStaffForm() {
    const form = document.getElementById('staffForm');
    if (form) {
        form.reset();
    }
    
    const staffIdInput = document.getElementById('staffId');
    if (staffIdInput) {
        staffIdInput.value = '';
    }
    
    const previewElement = document.getElementById('staffImagePreview');
    if (previewElement) {
        previewElement.innerHTML = `<span id="previewPlaceholder">Chọn ảnh để xem trước</span>`;
    }
}

function closeModal() {
    const modals = document.querySelectorAll('.modal');
    modals.forEach(modal => {
        modal.style.display = 'none';
    });
}

async function loadStaffData() {
    showLoader(true, 'Đang tải dữ liệu tài khoản...');
    
    try {
        if (!window.ApiClient || !window.ApiClient.Staff) {
            console.error('API Client chưa được khởi tạo!');
            showNotification('Lỗi kết nối API. Vui lòng tải lại trang.', 'error');
            showLoader(false);
            return;
        }
        
        console.log('Đang gọi API để lấy dữ liệu tài khoản...');
        
            // Gọi API để lấy dữ liệu
            const data = await window.ApiClient.Staff.getAllStaff();
            console.log('Dữ liệu nhận được từ API:', data);
            
            if (Array.isArray(data)) {
                staffList = [...data]; 
                originalList = [...data]; 
                
                console.log(`Đã tải ${staffList.length} tài khoản từ API`);
                
                staffList.forEach(staff => {
                    console.log(`Staff ${staff.idAccount || staff.id}: ${staff.fullName || staff.userName} - Role: ${staff.role || 'N/A'} - Image: ${staff.image ? 'Yes' : 'No'}`);
                });
            } else if (data && typeof data === 'object') {
                staffList = [data];
                originalList = [data];
                console.log(`Đã tải 1 tài khoản từ API: ${data.fullName || data.userName}`);
            } else {
            staffList = [];
            originalList = [];
            console.warn('Không có dữ liệu tài khoản hoặc định dạng không đúng');
        }
        
        updateStaffTable();
        updatePaginationControls();
        
        if (staffList.length > 0) {
            showNotification(`Đã tải ${staffList.length} tài khoản`, 'success');
        } else {
            showNotification('Không có dữ liệu tài khoản', 'info');
        }
        
    } catch (error) {
        console.error('Lỗi khi tải dữ liệu tài khoản:', error);
        showNotification('Không thể tải dữ liệu: ' + error.message, 'error');
        
        staffList = [];
        originalList = [];
        
        updateStaffTable();
        updatePaginationControls();
    } finally {
        showLoader(false);
    }
}

function updateStaffTable() {
    const tableBody = document.getElementById('staffTableBody');
    if (!tableBody) return;
    
    tableBody.innerHTML = '';
    
    const start = (currentPage - 1) * itemsPerPage;
    const end = Math.min(start + itemsPerPage, staffList.length);
    totalPages = Math.ceil(staffList.length / itemsPerPage);
    
    if (staffList.length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="8" class="text-center">Không có dữ liệu tài khoản</td>
            </tr>
        `;
        return;
    }
    
    for (let i = start; i < end; i++) {
        const staff = staffList[i];
        const staffId = staff.idAccount || staff.id;
        const isActive = staff.isActive !== false; 
        
        const avatarSrc = getSafeImageUrl(staff);
        
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${staffId}</td>
            <td>
                <div class="staff-info">
                    <div class="staff-avatar">
                        <img id="staff-avatar-${staffId}" 
                             src="${avatarSrc}" 
                             alt="${staff.fullName || 'Nhân viên'}" 
                             onerror="this.onerror=null;this.src='${DEFAULT_AVATAR}';">
                    </div>
                </div>
            </td>
            <td>${staff.fullName || ''}</td>
            <td>@${staff.userName || ''}</td>
            <td>
                <span class="role-badge ${getRoleBadgeClass(staff.role)}">
                    ${staff.role || 'User'}
                </span>
            </td>
            <td class="staff-contact">
                <p><i class="fas fa-phone-alt"></i> ${staff.phone || 'N/A'}</p>
                <p><i class="fas fa-map-marker-alt"></i> ${staff.address || 'N/A'}</p>
            </td>
            <td>
                <span class="status-badge ${isActive ? 'status-active' : 'status-inactive'}">
                    ${isActive ? 'Đang làm việc' : 'Nghỉ việc'}
                </span>
            </td>
            <td>
                <div class="actions">
                    <button class="btn-icon edit-product-btn btn-edit" data-id="${staffId}">
                        <i class="fas fa-user-edit"></i>
                    </button>
                    <button class="btn-icon delete-product-btn btn-delete" data-id="${staffId}" data-name="${staff.fullName || staff.userName || 'Nhân viên'}">
                        <i class="fas fa-user-times"></i>
                    </button>
                </div>
            </td>
        `;
        
        tableBody.appendChild(row);
    }
    
    const countElement = document.getElementById('currentShowing');
    if (countElement) {
        countElement.textContent = `${start + 1}-${end} / ${staffList.length}`;
    }
    
    attachStaffButtonEvents();
}

function getRoleBadgeClass(role) {
    if (!role) return 'role-customer';
    
    const roleLower = role.toLowerCase();
    if (roleLower === 'admin') return 'role-admin';
    if (roleLower === 'staff') return 'role-staff';
    return 'role-customer';
}

function updatePaginationControls() {
    const currentPageElem = document.getElementById('currentPage');
    const prevPageBtn = document.getElementById('prevPage');
    const nextPageBtn = document.getElementById('nextPage');
    
    if (currentPageElem) {
        currentPageElem.textContent = `Trang ${currentPage} / ${totalPages}`;
    }
    
    if (prevPageBtn) {
        prevPageBtn.disabled = currentPage <= 1;
    }
    
    if (nextPageBtn) {
        nextPageBtn.disabled = currentPage >= totalPages;
    }
}

function openDeleteStaffConfirmation(staffId, staffName) {
    const modal = document.getElementById('deleteConfirmModal');
    if (!modal) {
        if (confirm(`Bạn có chắc chắn muốn xóa nhân viên "${staffName}"?`)) {
            deleteStaff(staffId);
        }
        return;
    }
    
    const nameElement = document.getElementById('deleteStaffName');
    if (nameElement) {
        nameElement.textContent = staffName;
    }
    
    const confirmButton = document.getElementById('confirmDeleteBtn');
    if (confirmButton) {
        const newButton = confirmButton.cloneNode(true);
        confirmButton.parentNode.replaceChild(newButton, confirmButton);
        
        newButton.addEventListener('click', function() {
            deleteStaff(staffId);
            modal.style.display = 'none';
        });
    }
    
    modal.style.display = 'block';
}

async function deleteStaff(staffId) {
    showLoader(true, 'Đang xóa nhân viên...');
    
    try {
        await window.ApiClient.Staff.deleteStaff(staffId);
        
        staffList = staffList.filter(staff => 
            staff.id !== staffId && 
            staff.idAccount !== staffId
        );
        
        updateStaffTable();
        updatePaginationControls();
        
        showLoader(false);
        showNotification('Xóa nhân viên thành công', 'success');
    } catch (error) {
        console.error('Lỗi khi xóa nhân viên:', error);
        showNotification(`Không thể xóa nhân viên: ${error.message}`, 'error');
        showLoader(false);
    }
}

// Chỉnh sửa nhân viên
async function editStaff(staffId) {
    showLoader(true, 'Đang tải thông tin nhân viên...');
    
    try {
        const staff = await window.ApiClient.Staff.getStaffById(staffId);
        console.log('Thông tin nhân viên:', staff);
        
        const modalTitle = document.getElementById('staffModalTitle');
        if (modalTitle) {
            modalTitle.innerHTML = '<i class="fas fa-user-edit"></i> Chỉnh sửa nhân viên';
        }
        
        document.getElementById('staffId').value = staff.idAccount || staff.id;
        document.getElementById('userName').value = staff.userName || '';
        document.getElementById('fullName').value = staff.fullName || '';
        document.getElementById('phone').value = staff.phone || '';
        document.getElementById('address').value = staff.address || '';
        document.getElementById('email').value = staff.email || '';
        
        const statusElement = document.getElementById('staffStatus');
        if (statusElement) {
            statusElement.value = (staff.isActive || staff.status === 'active') ? 'active' : 'inactive';
        }
        
        const roleElement = document.getElementById('role');
        if (roleElement) {
            const staffRole = (staff.role || '').toLowerCase();
            if (['admin', 'staff', 'customer'].includes(staffRole)) {
                roleElement.value = staffRole;
            } else {
                roleElement.value = 'staff';
                console.warn(`Vai trò không hợp lệ: ${staff.role}, đặt mặc định là 'staff'`);
            }
        }
        
        const passwordRequired = document.getElementById('passwordRequired');
        if (passwordRequired) {
            passwordRequired.style.display = 'none';
        }
        
        document.getElementById('password').value = '';
        
        const imagePreview = document.getElementById('staffImagePreview');
        if (imagePreview) {
            let imageSrc = DEFAULT_AVATAR;
            
            if (staff.image) {
                if (staff.image.startsWith('data:')) {
                    imageSrc = staff.image;
                } else if (staff.image.startsWith('/uploads/')) {
                    imageSrc = await loadStaffImage(staff.image, staffId);
                }
            }
            
            imagePreview.innerHTML = `
                <img src="${imageSrc}" 
                     alt="${staff.fullName || 'Staff Image'}" 
                     onerror="this.onerror=null;this.src='${DEFAULT_AVATAR}';">
            `;
        }
        
        // Mở modal
        const modal = document.getElementById('staffModal');
        if (modal) {
            modal.style.display = 'block';
        }
    } catch (error) {
        console.error(`Lỗi khi lấy thông tin nhân viên ID: ${staffId}`, error);
        showNotification('Không thể tải thông tin nhân viên. Vui lòng thử lại sau.', 'error');
    } finally {
        showLoader(false);
    }
}

function openDeleteConfirmModal(staffId, staffName) {
    const deleteModal = document.getElementById('deleteStaffModal');
    if (!deleteModal) {
        console.error('Không tìm thấy modal xác nhận xóa');
        return;
    }
    
    const staffNameElement = document.getElementById('deleteStaffName');
    if (staffNameElement) {
        staffNameElement.textContent = staffName;
    }
    
    const confirmButton = document.getElementById('confirmDeleteBtn');
    if (confirmButton) {
        confirmButton.setAttribute('data-id', staffId);
    }
    
    deleteModal.style.display = 'block';
}

async function confirmDeleteStaff() {
    const confirmButton = document.getElementById('confirmDeleteBtn');
    const staffId = confirmButton.getAttribute('data-id');
    
    if (!staffId) {
        console.error('Không tìm thấy ID nhân viên cần xóa');
        return;
    }
    
    showLoader(true, 'Đang xóa nhân viên...');
    
    try {
        await window.ApiClient.Staff.deleteStaff(staffId);
        
        const deleteModal = document.getElementById('deleteStaffModal');
        if (deleteModal) {
            deleteModal.style.display = 'none';
        }
        
        if (window.ApiClient && window.ApiClient.clearCache) {
            window.ApiClient.clearCache();
        }
        
        await loadStaffData();
        
        showNotification('Đã xóa nhân viên thành công', 'success');
    } catch (error) {
        console.error(`Lỗi khi xóa nhân viên ID: ${staffId}`, error);
        showNotification('Không thể xóa nhân viên. Vui lòng thử lại sau.', 'error');
    } finally {
        showLoader(false);
    }
}

async function handleStaffFormSubmit(event) {
    event.preventDefault();
    hideFormError();
    showLoader(true, 'Đang lưu thông tin nhân viên...');
    try {
        const staffId = document.getElementById('staffId').value;
        const isNewStaff = !staffId;
        const userName = document.getElementById('userName').value.trim();
        const fullName = document.getElementById('fullName').value.trim();
        const passWord = document.getElementById('password').value;
        const phone = document.getElementById('phone').value.trim();
        const address = document.getElementById('address').value.trim();
        const email = document.getElementById('email').value.trim();
        const role = document.getElementById('role').value;
        const status = document.getElementById('staffStatus').value;
        const errors = [];
        if (!userName) errors.push('Tên đăng nhập không được để trống');
        if (!fullName) errors.push('Họ và tên không được để trống');
        if (isNewStaff && !passWord) errors.push('Mật khẩu không được để trống cho tài khoản mới');
        if (passWord && passWord.length < 6) errors.push('Mật khẩu phải có ít nhất 6 ký tự');
        if (email && !validateEmail(email)) errors.push('Email không đúng định dạng');
        if (errors.length > 0) {
            showFormError(errors[0]);
            showLoader(false);
            return;
        }
        const staffData = {
            userName,
            fullName,
            phone,
            address,
            email,
            isActive: status === 'active',
            role: role.charAt(0).toUpperCase() + role.slice(1)
        };
        if (staffId) staffData.idAccount = parseInt(staffId);
        if (passWord) staffData.passWord = passWord;
        const imageInput = document.getElementById('staffImage');
        let avatarUrl = null;
        if (imageInput && imageInput.files && imageInput.files[0]) {
            // Nếu là cập nhật nhân viên
            if (staffId) {
                const formData = new FormData();
                formData.append('avatar', imageInput.files[0]);
                const uploadRes = await fetch(`http://localhost:8081/api/accounts/${staffId}/avatar`, {
                    method: 'POST',
                    headers: getAuthHeadersForFormData(),
                    body: formData
                });
                const uploadData = await uploadRes.json();
                if (uploadData.success) {
                    avatarUrl = uploadData.avatar;
                    staffData.image = avatarUrl;
                }
            }
        }
        let result;
        try {
            if (staffId) {
                result = await window.ApiClient.Staff.updateStaff(staffId, staffData);
                showNotification('Cập nhật tài khoản thành công', 'success');
            } else {
                result = await window.ApiClient.Staff.createStaff(staffData);
                // Nếu có ảnh, upload sau khi tạo mới để lấy id
                if (imageInput && imageInput.files && imageInput.files[0] && result && result.idAccount) {
                    const formData = new FormData();
                    formData.append('avatar', imageInput.files[0]);
                    const uploadRes = await fetch(`http://localhost:8081/api/accounts/${result.idAccount}/avatar`, {
                        method: 'POST',
                        headers: getAuthHeadersForFormData(),
                        body: formData
                    });
                    const uploadData = await uploadRes.json();
                    if (uploadData.success) {
                        avatarUrl = uploadData.avatar;
                        // Gọi lại cập nhật để lưu đường dẫn ảnh
                        await window.ApiClient.Staff.updateStaff(result.idAccount, { image: avatarUrl });
                    }
                }
                showNotification('Tạo tài khoản mới thành công', 'success');
            }
        } catch (apiError) {
            showFormError(apiError.message || 'Lỗi khi gửi dữ liệu đến server');
            showLoader(false);
            return;
        }
        closeModal();
        if (window.ApiClient && window.ApiClient.clearCache) {
            window.ApiClient.clearCache();
        }
        await loadStaffData();
    } catch (error) {
        showFormError(error.message || 'Không thể lưu thông tin. Vui lòng thử lại sau.');
    } finally {
        showLoader(false);
    }
}

function showFormError(message) {
    const container = document.getElementById('formErrorContainer');
    const messageEl = document.getElementById('formErrorMessage');
    
    if (container && messageEl) {
        messageEl.textContent = message;
        container.style.display = 'block';
    } else {
        showNotification(message, 'error');
    }
}

function hideFormError() {
    const container = document.getElementById('formErrorContainer');
    if (container) {
        container.style.display = 'none';
    }
}

function validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}

function convertImageToBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = error => reject(error);
        reader.readAsDataURL(file);
    });
}

function filterStaffList(searchTerm) {
    if (!searchTerm) {
        staffList = [...originalList];
        staffList = [...originalList];
        currentPage = 1;
        updateStaffTable();
        updatePaginationControls();
        return;
    }
    
    searchTerm = searchTerm.toLowerCase();
    console.log(`Lọc danh sách với từ khóa: "${searchTerm}"`);
    
    staffList = originalList.filter(staff => {
        const fullName = (staff.fullName || '').toLowerCase();
        const username = (staff.userName || '').toLowerCase();
        const email = (staff.email || '').toLowerCase();
        const phone = (staff.phone || '').toLowerCase();
        
        return fullName.includes(searchTerm) || 
               username.includes(searchTerm) || 
               email.includes(searchTerm) || 
               phone.includes(searchTerm);
    });
    
    console.log(`Kết quả lọc: ${staffList.length}/${originalList.length} nhân viên`);
    
    currentPage = 1;
    updateStaffTable();
    updatePaginationControls();
}

function filterStaffByRole() {
    const roleValue = document.getElementById('staffRoleFilter').value;
    
    if (roleValue === '') {
        staffList = [...originalList];
    } else {
        staffList = originalList.filter(staff => {
            const staffRole = (staff.role || '').toLowerCase();
            console.log(`Kiểm tra vai trò: ${staffRole} so với ${roleValue.toLowerCase()}`);
            return staffRole === roleValue.toLowerCase();
        });
    }
    
    console.log(`Đã lọc: ${staffList.length}/${originalList.length} nhân viên với vai trò '${roleValue}'`);
    
    currentPage = 1;
    updateStaffTable();
    updatePaginationControls();
}

function showLoader(show, message = 'Đang tải...') {
    const loader = document.getElementById('loader');
    if (loader) {
        if (!loader.querySelector('.loader-message')) {
            const messageDiv = document.createElement('div');
            messageDiv.className = 'loader-message';
            loader.appendChild(messageDiv);
        }
        
        const messageElement = loader.querySelector('.loader-message');
        if (messageElement) {
            messageElement.textContent = message;
        }
        
        loader.style.display = show ? 'flex' : 'none';
    }
}

function showNotification(message, type = 'info') {
    if (window.AdminCore && window.AdminCore.showNotification) {
        window.AdminCore.showNotification(message, type);
        return;
    }
    
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `
        <div class="notification-content">
            <i class="fas ${getIconForType(type)}"></i>
            <span>${message}</span>
        </div>
        <button class="notification-close">&times;</button>
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.classList.add('show');
    }, 10);
    
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => {
            notification.remove();
        }, 300);
    }, 5000);
    
    notification.querySelector('.notification-close').addEventListener('click', () => {
        notification.classList.remove('show');
        setTimeout(() => {
            notification.remove();
        }, 300);
    });
}

function getIconForType(type) {
    switch (type) {
        case 'success': return 'fa-check-circle';
        case 'error': return 'fa-exclamation-circle';
        case 'warning': return 'fa-exclamation-triangle';
        default: return 'fa-info-circle';
    }
}

async function refreshStaffData() {
    showLoader(true, 'Đang làm mới dữ liệu...');
    
    if (window.ApiClient && window.ApiClient.clearCache) {
        window.ApiClient.clearCache();
    }
    
    try {
        await loadStaffData();
        showNotification('Đã làm mới dữ liệu thành công', 'success');
    } catch (error) {
        console.error('Lỗi khi làm mới dữ liệu:', error);
        showNotification('Không thể làm mới dữ liệu. Vui lòng thử lại sau.', 'error');
    }
    
    showLoader(false);
}

// Chuyển tới trang trước
function goToPrevPage() {
    if (currentPage > 1) {
        currentPage--;
        updateStaffTable();
        updatePaginationControls();
    }
}

// Chuyển tới trang sau
function goToNextPage() {
    if (currentPage < totalPages) {
        currentPage++;
        updateStaffTable();
        updatePaginationControls();
    }
}

// Thay đổi số lượng hiển thị trên mỗi trang
function changeItemsPerPage() {
    const select = document.getElementById('itemsPerPage');
    if (select) {
        itemsPerPage = parseInt(select.value);
        currentPage = 1;
        updateStaffTable();
        updatePaginationControls();
    }
}

// Xử lý tìm kiếm nhân viên
function handleSearch(event) {
    const query = event.target.value.trim().toLowerCase();
    console.log(`Tìm kiếm với từ khóa: "${query}"`);
    
    if (query === '') {
        // Nếu không có từ khóa tìm kiếm, hiển thị tất cả
        staffList = [...originalList];
    } else {
        // Lọc danh sách theo từ khóa
        staffList = originalList.filter(staff => {
            const fullName = (staff.fullName || '').toLowerCase();
            const userName = (staff.userName || '').toLowerCase();
            const phone = (staff.phone || '').toLowerCase();
            const address = (staff.address || '').toLowerCase();
            const email = (staff.email || '').toLowerCase();
            
            return fullName.includes(query) || 
                   userName.includes(query) || 
                   phone.includes(query) || 
                   address.includes(query) ||
                   email.includes(query);
        });
    }
    
    console.log(`Kết quả tìm kiếm: ${staffList.length}/${originalList.length} nhân viên`);
    
    // Cập nhật lại bảng và phân trang
    currentPage = 1;
    updateStaffTable();
    updatePaginationControls();
}

// Hàm debounce cho tìm kiếm (tránh gọi nhiều lần)
function debounce(func, delay) {
    let timeoutId;
    return function(...args) {
        if (timeoutId) {
            clearTimeout(timeoutId);
        }
        timeoutId = setTimeout(() => {
            func.apply(this, args);
        }, delay);
    };
}

// Cập nhật hiển thị của các nút phân trang
function updatePaginationControls() {
    const prevPageBtn = document.getElementById('prevPage');
    const nextPageBtn = document.getElementById('nextPage');
    const currentPageSpan = document.getElementById('currentPage');
    
    if (prevPageBtn) {
        prevPageBtn.disabled = currentPage <= 1;
    }
    
    if (nextPageBtn) {
        nextPageBtn.disabled = currentPage >= totalPages;
    }
    
    if (currentPageSpan) {
        currentPageSpan.textContent = `Trang ${currentPage} / ${totalPages || 1}`;
    }
}

// Hàm để tải ảnh nhân viên thông qua API với token xác thực
async function loadStaffImage(imagePath, staffId) {
    // Nếu đã có trong cache, trả về ngay
    if (staffImageCache[imagePath]) {
        return staffImageCache[imagePath];
    }
    
    try {
        // Thực hiện fetch với token xác thực
        const response = await fetch(`http://localhost:8081${imagePath}`, {
            headers: getAuthHeadersForFormData()
        });
        
        if (!response.ok) {
            console.error(`Không thể tải ảnh: ${response.status} ${response.statusText}`);
            return DEFAULT_AVATAR;
        }
        
        // Chuyển response thành blob
        const blob = await response.blob();
        
        // Tạo URL blob
        const blobUrl = URL.createObjectURL(blob);
        
        // Lưu vào cache
        staffImageCache[imagePath] = blobUrl;
        
        return blobUrl;
    } catch (error) {
        console.error(`Lỗi khi tải ảnh: ${error.message}`);
        return DEFAULT_AVATAR;
    }
}

// Hàm để lấy URL ảnh an toàn
function getSafeImageUrl(staff) {
    const staffId = staff.idAccount || staff.id;
    
    if (!staff.image) {
        return DEFAULT_AVATAR;
    }
    
    if (staff.image.startsWith('data:')) {
        return staff.image;
    }
    
    if (staff.image.startsWith('blob:')) {
        return staff.image;
    }
    
    if (staff.image.startsWith('http') && !staff.image.includes('/uploads/')) {
        return staff.image;
    }
    
    if (staff.image.startsWith('/uploads/')) {

        const imagePath = staff.image;
        loadStaffImage(imagePath, staffId).then(blobUrl => {
            const imgElement = document.querySelector(`#staff-avatar-${staffId}`);
            if (imgElement) {
                imgElement.src = blobUrl;
            }
        });
    }
    
    return DEFAULT_AVATAR;
}

function showApiError(message) {
    if (message.includes('401')) {
        console.log('');
        return;
    }
    
    if (window.AdminCore && window.AdminCore.showNotification) {
        window.AdminCore.showNotification(message, 'warning');
    }
    

    const tableBody = document.getElementById('staffTableBody');
    if (tableBody) {
        const existingWarning = document.querySelector('.api-warning');
        if (existingWarning) {
            existingWarning.remove();
        }
        
        const apiWarning = document.createElement('div');
        apiWarning.className = 'api-warning';
        apiWarning.innerHTML = `
            <div class="alert-warning">
                <i class="fas fa-exclamation-triangle"></i>
                <strong>Cảnh báo:</strong> ${message}
                <p>Hệ thống sẽ sử dụng dữ liệu mẫu để hiển thị.</p>
            </div>
        `;
        
        const staffTable = tableBody.closest('.data-table');
        if (staffTable && staffTable.parentNode) {
            staffTable.parentNode.insertBefore(apiWarning, staffTable);
        }
    }
} 