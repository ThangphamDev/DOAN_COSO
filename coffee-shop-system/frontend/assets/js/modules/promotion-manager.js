/**
 * PromotionManager - Module quản lý khuyến mãi
 * Xử lý tương tác với API và hiển thị dữ liệu khuyến mãi
 */

class PromotionManager {
    constructor() {
        this.apiUrl = 'http://localhost:8081/api/promotions';
        this.promotions = [];
        this.activePromotions = [];
        this.init();
    }

    // Hàm trợ giúp để lấy token từ localStorage
    getAuthToken() {
        return localStorage.getItem('token');
    }

    // Hàm trợ giúp để tạo headers với token xác thực
    getAuthHeaders() {
        const token = this.getAuthToken();
        const headers = {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        };
        
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }
        
        return headers;
    }

    /**
     * Khởi tạo các event listener và load dữ liệu ban đầu
     */
    init() {
        // Các tab khuyến mãi
        const tabButtons = document.querySelectorAll('.tab-btn');
        tabButtons.forEach(button => {
            button.addEventListener('click', () => this.switchTab(button));
        });

        // Nút thêm khuyến mãi
        const addPromotionBtn = document.getElementById('addPromotionBtn');
        if (addPromotionBtn) {
            addPromotionBtn.addEventListener('click', () => this.openPromotionModal());
        }

        // Form khuyến mãi
        const promotionForm = document.getElementById('promotionForm');
        if (promotionForm) {
            promotionForm.addEventListener('submit', (e) => this.handlePromotionSubmit(e));
        }

        // Xử lý loại khuyến mãi
        const promotionType = document.getElementById('promotionType');
        if (promotionType) {
            promotionType.addEventListener('change', () => this.handlePromotionTypeChange());
        }

        // Tìm kiếm khuyến mãi
        const searchPromotion = document.getElementById('searchPromotion');
        if (searchPromotion) {
            searchPromotion.addEventListener('input', (e) => this.handleSearch(e.target.value));
        }

        // Modal close button
        const closeBtn = document.querySelector('.modal .close-btn');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => this.closePromotionModal());
        }

        // Load dữ liệu khuyến mãi ban đầu
        this.loadPromotions();
    }

    /**
     * Chuyển đổi giữa các tab khuyến mãi
     */
    switchTab(selectedTab) {
        // Xóa active class từ tất cả tab buttons
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.remove('active');
        });

        // Thêm active class cho tab được chọn
        selectedTab.classList.add('active');

        // Ẩn tất cả tab panes
        document.querySelectorAll('.tab-pane').forEach(pane => {
            pane.classList.remove('active');
        });

        // Hiển thị tab pane tương ứng
        const tabId = selectedTab.getAttribute('data-tab');
        document.getElementById(tabId).classList.add('active');
    }

    /**
     * Mở modal thêm/sửa khuyến mãi
     */
    openPromotionModal(promotionId = null) {
        const modal = document.getElementById('promotionModal');
        const modalTitle = document.getElementById('modalPromotionTitle');
        const form = document.getElementById('promotionForm');

        if (promotionId) {
            // Chế độ sửa khuyến mãi
            modalTitle.textContent = 'Chỉnh sửa khuyến mãi';
            this.getPromotionById(promotionId).then(promotion => {
                if (promotion) {
                    this.fillPromotionForm(promotion);
                }
            });
        } else {
            // Chế độ thêm khuyến mãi mới
            modalTitle.textContent = 'Thêm khuyến mãi mới';
            form.reset();
            document.getElementById('promotionId').value = '';
        }

        modal.style.display = 'flex';
    }

    /**
     * Đóng modal khuyến mãi
     */
    closePromotionModal() {
        const modal = document.getElementById('promotionModal');
        modal.style.display = 'none';
    }

    /**
     * Điền thông tin khuyến mãi vào form
     */
    fillPromotionForm(promotion) {
        document.getElementById('promotionId').value = promotion.idPromotion;
        document.getElementById('promotionCode').value = promotion.code;
        document.getElementById('promotionName').value = promotion.namePromotion;
        
        // Set discount type
        const typeSelect = document.getElementById('promotionType');
        if (promotion.discountType === 'PERCENT') {
            typeSelect.value = 'percentage';
        } else if (promotion.discountType === 'FIXED') {
            typeSelect.value = 'fixed';
        }
        
        // Set value
        if (promotion.discountValue) {
            document.getElementById('promotionValue').value = promotion.discountValue;
        }
        
        // Set min order amount
        if (promotion.minimumOrderAmount) {
            document.getElementById('minimumOrder').value = promotion.minimumOrderAmount;
        }
        
        // Set dates
        if (promotion.startDate) {
            document.getElementById('startDate').value = this.formatDateForInput(promotion.startDate);
        }
        
        if (promotion.endDate) {
            document.getElementById('endDate').value = this.formatDateForInput(promotion.endDate);
        }
        
        // Update the form based on promotion type
        this.handlePromotionTypeChange();
    }

    /**
     * Chuyển đổi định dạng ngày thành chuỗi YYYY-MM-DD cho input
     */
    formatDateForInput(dateString) {
        const date = new Date(dateString);
        return date.toISOString().split('T')[0];
    }

    /**
     * Xử lý thay đổi loại khuyến mãi
     */
    handlePromotionTypeChange() {
        const type = document.getElementById('promotionType').value;
        const valueGroup = document.getElementById('valueGroup');
        const valueInput = document.getElementById('promotionValue');

        if (type === 'percentage') {
            valueGroup.style.display = 'block';
            valueInput.setAttribute('max', '100');
            valueInput.setAttribute('placeholder', 'Nhập % giảm giá (1-100)');
        } else if (type === 'fixed') {
            valueGroup.style.display = 'block';
            valueInput.removeAttribute('max');
            valueInput.setAttribute('placeholder', 'Nhập số tiền giảm');
        } else if (type === 'shipping') {
            valueGroup.style.display = 'none';
        } else if (type === 'bogo') {
            valueGroup.style.display = 'none';
        }
    }

    /**
     * Xử lý submit form khuyến mãi
     */
    handlePromotionSubmit(event) {
        event.preventDefault();
        const formData = this.getPromotionFormData();
        
        if (formData.idPromotion) {
            // Cập nhật khuyến mãi
            this.updatePromotion(formData);
        } else {
            // Thêm khuyến mãi mới
            this.createPromotion(formData);
        }
    }

    /**
     * Lấy dữ liệu từ form khuyến mãi
     */
    getPromotionFormData() {
        const promotionId = document.getElementById('promotionId').value;
        const code = document.getElementById('promotionCode').value;
        const namePromotion = document.getElementById('promotionName').value;
        const typeSelect = document.getElementById('promotionType').value;
        const value = document.getElementById('promotionValue').value;
        const minimumOrderAmount = document.getElementById('minimumOrder').value;
        const startDate = document.getElementById('startDate').value;
        const endDate = document.getElementById('endDate').value;
        
        // Chuyển đổi loại khuyến mãi
        let discountType = 'FIXED';
        if (typeSelect === 'percentage') {
            discountType = 'PERCENT';
        }
        
        return {
            idPromotion: promotionId || null,
            code: code,
            namePromotion: namePromotion,
            discountType: discountType,
            discountValue: value,
            minimumOrderAmount: minimumOrderAmount || null,
            startDate: startDate,
            endDate: endDate,
            isActive: true
        };
    }

    /**
     * Tải danh sách khuyến mãi từ API
     */
    async loadPromotions() {
        try {
            this.showLoader();
            
            // Lấy tất cả khuyến mãi cho tab chính (hiển thị cả enable/disable)
            const allPromotions = await this.fetchAllPromotions();
            this.renderPromotionTable(allPromotions, 'activePromotionTableBody');
            
            // Lấy khuyến mãi sắp diễn ra
            const currentDate = new Date();
            const upcomingPromotions = allPromotions.filter(promo => {
                const startDate = new Date(promo.startDate);
                return startDate > currentDate;
            });
            this.renderPromotionTable(upcomingPromotions, 'upcomingPromotionTableBody');
            
            // Lấy khuyến mãi đã kết thúc
            const expiredPromotions = allPromotions.filter(promo => {
                const endDate = new Date(promo.endDate);
                return endDate < currentDate;
            });
            this.renderPromotionTable(expiredPromotions, 'expiredPromotionTableBody');
            
            this.hideLoader();
        } catch (error) {
            console.error('Error loading promotions:', error);
            this.hideLoader();
            this.showNotification('Lỗi khi tải danh sách khuyến mãi', 'error');
        }
    }

    /**
     * Hiển thị thông báo
     */
    showNotification(message, type = 'success') {
        showPromoToast(message, type);
    }

    /**
     * Hiển thị loader
     */
    showLoader() {
        const loader = document.getElementById('loader');
        if (loader) {
            loader.style.display = 'flex';
        }
    }

    /**
     * Ẩn loader
     */
    hideLoader() {
        const loader = document.getElementById('loader');
        if (loader) {
            loader.style.display = 'none';
        }
    }

    /**
     * Render bảng khuyến mãi
     */
    renderPromotionTable(promotions, tableBodyId) {
        const tableBody = document.getElementById(tableBodyId);
        if (!tableBody) return;

        tableBody.innerHTML = '';

        if (promotions.length === 0) {
            const emptyRow = document.createElement('tr');
            emptyRow.innerHTML = `<td colspan="6" class="text-center">Không có khuyến mãi nào</td>`;
            tableBody.appendChild(emptyRow);
            return;
        }

        promotions.forEach(promotion => {
            const row = document.createElement('tr');
            // Nếu khuyến mãi bị vô hiệu hóa, thêm class promo-disabled
            if (!promotion.isActive) {
                row.classList.add('promo-disabled');
            }
            
            // Format dates
            const startDate = new Date(promotion.startDate).toLocaleDateString('vi-VN');
            const endDate = new Date(promotion.endDate).toLocaleDateString('vi-VN');
            
            // Format discount value
            let discountValue = '';
            if (promotion.discountType === 'PERCENT') {
                discountValue = `${promotion.discountValue}%`;
            } else {
                discountValue = `${promotion.discountValue} VNĐ`;
            }
            
            row.innerHTML = `
                <td>${promotion.code}</td>
                <td>${promotion.namePromotion}</td>
                <td>${promotion.discountType === 'PERCENT' ? 'Phần trăm' : 'Cố định'}</td>
                <td>${discountValue}</td>
                <td>${startDate} - ${endDate}</td>
                <td>
                    <button class="btn-icon edit-btn" data-id="${promotion.idPromotion}" title="Sửa">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn-icon delete-btn" data-id="${promotion.idPromotion}" title="Xóa">
                        <i class="fas fa-trash"></i>
                    </button>
                    <button class="btn-icon status-btn ${promotion.isActive ? 'active' : ''}" 
                            data-id="${promotion.idPromotion}" 
                            data-active="${promotion.isActive}" 
                            title="${promotion.isActive ? 'Đang kích hoạt' : 'Đã vô hiệu'}">
                        <i class="fas ${promotion.isActive ? 'fa-toggle-on' : 'fa-toggle-off'}"></i>
                    </button>
                </td>
            `;
            
            tableBody.appendChild(row);
            
            // Thêm event listeners cho các nút
            const editBtn = row.querySelector('.edit-btn');
            const deleteBtn = row.querySelector('.delete-btn');
            const statusBtn = row.querySelector('.status-btn');
            
            editBtn.addEventListener('click', () => this.openPromotionModal(promotion.idPromotion));
            deleteBtn.addEventListener('click', () => this.deletePromotion(promotion.idPromotion));
            statusBtn.addEventListener('click', () => this.togglePromotionStatus(
                promotion.idPromotion, 
                statusBtn.getAttribute('data-active') === 'true' ? false : true
            ));
        });

        // Thêm CSS cho class promo-disabled
        if (!document.getElementById('promo-disabled-style')) {
            const style = document.createElement('style');
            style.id = 'promo-disabled-style';
            style.textContent = `.promo-disabled { opacity: 0.5; filter: grayscale(0.5); }`;
            document.head.appendChild(style);
        }
    }

    /**
     * Tìm kiếm khuyến mãi
     */
    async handleSearch(searchText) {
        if (!searchText || searchText.trim() === '') {
            this.loadPromotions();
            return;
        }

        try {
            this.showLoader();
            const allPromotions = await this.fetchAllPromotions();
            
            // Lọc khuyến mãi theo từ khóa tìm kiếm
            const filtered = allPromotions.filter(promo => {
                const nameMatch = promo.namePromotion.toLowerCase().includes(searchText.toLowerCase());
                const codeMatch = promo.code.toLowerCase().includes(searchText.toLowerCase());
                return nameMatch || codeMatch;
            });
            
            // Render kết quả tìm kiếm vào cả 3 tab
            this.renderPromotionTable(filtered, 'activePromotionTableBody');
            this.renderPromotionTable([], 'upcomingPromotionTableBody');
            this.renderPromotionTable([], 'expiredPromotionTableBody');
            
            this.hideLoader();
        } catch (error) {
            console.error('Error searching promotions:', error);
            this.hideLoader();
            this.showNotification('Lỗi khi tìm kiếm khuyến mãi', 'error');
        }
    }

    /**
     * Gọi API lấy tất cả khuyến mãi
     */
    async fetchAllPromotions() {
        try {
            const response = await fetch(this.apiUrl, {
                method: 'GET',
                headers: this.getAuthHeaders()
            });
            if (!response.ok) {
                throw new Error('Failed to fetch promotions');
            }
            return await response.json();
        } catch (error) {
            console.error('Error:', error);
            throw error;
        }
    }

    /**
     * Gọi API lấy khuyến mãi đang hoạt động
     */
    async fetchActivePromotions() {
        try {
            const response = await fetch(`${this.apiUrl}/active`, {
                method: 'GET',
                headers: this.getAuthHeaders()
            });
            if (!response.ok) {
                throw new Error('Failed to fetch active promotions');
            }
            return await response.json();
        } catch (error) {
            console.error('Error:', error);
            throw error;
        }
    }

    /**
     * Gọi API lấy khuyến mãi theo ID
     */
    async getPromotionById(id) {
        try {
            const response = await fetch(`${this.apiUrl}/${id}`, {
                method: 'GET',
                headers: this.getAuthHeaders()
            });
            if (!response.ok) {
                throw new Error('Failed to fetch promotion');
            }
            return await response.json();
        } catch (error) {
            console.error('Error:', error);
            this.showNotification('Lỗi khi lấy thông tin khuyến mãi', 'error');
            return null;
        }
    }

    /**
     * Gọi API tạo khuyến mãi mới
     */
    async createPromotion(promotionData) {
        try {
            this.showLoader();
            const response = await fetch(this.apiUrl, {
                method: 'POST',
                headers: this.getAuthHeaders(),
                body: JSON.stringify(promotionData)
            });
            
            if (!response.ok) {
                throw new Error('Failed to create promotion');
            }
            
            const newPromotion = await response.json();
            this.hideLoader();
            this.showNotification('Đã thêm khuyến mãi thành công');
            this.closePromotionModal();
            this.loadPromotions();
            return newPromotion;
        } catch (error) {
            console.error('Error:', error);
            this.hideLoader();
            this.showNotification('Lỗi khi tạo khuyến mãi', 'error');
            return null;
        }
    }

    /**
     * Gọi API cập nhật khuyến mãi
     */
    async updatePromotion(promotionData) {
        try {
            this.showLoader();
            const response = await fetch(`${this.apiUrl}/${promotionData.idPromotion}`, {
                method: 'PUT',
                headers: this.getAuthHeaders(),
                body: JSON.stringify(promotionData)
            });
            
            if (!response.ok) {
                throw new Error('Failed to update promotion');
            }
            
            const updatedPromotion = await response.json();
            this.hideLoader();
            this.showNotification('Đã cập nhật khuyến mãi thành công');
            this.closePromotionModal();
            this.loadPromotions();
            return updatedPromotion;
        } catch (error) {
            console.error('Error:', error);
            this.hideLoader();
            this.showNotification('Lỗi khi cập nhật khuyến mãi', 'error');
            return null;
        }
    }

    /**
     * Gọi API xóa khuyến mãi
     */
    async deletePromotion(id) {
        if (!confirm('Bạn có chắc chắn muốn xóa khuyến mãi này?')) {
            return;
        }
        
        try {
            this.showLoader();
            const response = await fetch(`${this.apiUrl}/${id}`, {
                method: 'DELETE',
                headers: this.getAuthHeaders()
            });
            
            if (!response.ok) {
                throw new Error('Failed to delete promotion');
            }
            
            this.hideLoader();
            this.showNotification('Đã xóa khuyến mãi thành công');
            this.loadPromotions();
        } catch (error) {
            console.error('Error:', error);
            this.hideLoader();
            this.showNotification('Lỗi khi xóa khuyến mãi', 'error');
        }
    }

    /**
     * Gọi API thay đổi trạng thái khuyến mãi
     */
    async togglePromotionStatus(id, isActive) {
        try {
            this.showLoader();
            const response = await fetch(`${this.apiUrl}/${id}/status?isActive=${isActive}`, {
                method: 'PATCH',
                headers: this.getAuthHeaders()
            });
            
            if (!response.ok) {
                throw new Error('Failed to update promotion status');
            }
            
            this.hideLoader();
            this.showNotification(`Đã ${isActive ? 'kích hoạt' : 'vô hiệu hóa'} khuyến mãi`);
            this.loadPromotions();
        } catch (error) {
            console.error('Error:', error);
            this.hideLoader();
            this.showNotification('Lỗi khi thay đổi trạng thái khuyến mãi', 'error');
        }
    }
}

// Khởi tạo manager khi trang được load
document.addEventListener('DOMContentLoaded', () => {
    // Chỉ khởi tạo nếu đang ở trang quản lý khuyến mãi
    if (document.querySelector('.promotion-management')) {
        window.promotionManager = new PromotionManager();
    }
});

// Thêm hàm showPromoToast vào cuối file
function showPromoToast(message, type = 'success') {
    // Xóa toast cũ nếu có
    const oldToast = document.querySelector('.promo-toast');
    if (oldToast) oldToast.remove();

    // Tạo toast mới
    const toast = document.createElement('div');
    toast.className = `promo-toast show ${type}`;
    toast.innerHTML = `
        <span>${message}</span>
        <button class="toast-close" title="Đóng">&times;</button>
    `;
    document.body.appendChild(toast);

    // Đóng khi click nút
    toast.querySelector('.toast-close').onclick = () => toast.remove();

    // Tự động ẩn sau 3s
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// Thêm CSS toast nếu chưa có
if (!document.getElementById('promo-toast-style')) {
    const style = document.createElement('style');
    style.id = 'promo-toast-style';
    style.textContent = `
    .promo-toast {
        position: fixed;
        top: 30px;
        right: 30px;
        min-width: 280px;
        max-width: 350px;
        background: #fff;
        color: #333;
        border-radius: 8px;
        box-shadow: 0 4px 16px rgba(0,0,0,0.15);
        padding: 18px 24px 18px 20px;
        z-index: 9999;
        display: flex;
        align-items: center;
        gap: 12px;
        font-size: 16px;
        border-left: 5px solid #e67e22;
        opacity: 0;
        pointer-events: none;
        transition: opacity 0.3s, transform 0.3s;
        transform: translateY(-20px);
    }
    .promo-toast.show {
        opacity: 1;
        pointer-events: auto;
        transform: translateY(0);
    }
    .promo-toast.success { border-left-color: #27ae60; }
    .promo-toast.error   { border-left-color: #e74c3c; }
    .promo-toast.info    { border-left-color: #3498db; }
    .promo-toast .toast-close {
        background: none;
        border: none;
        font-size: 20px;
        color: #aaa;
        margin-left: auto;
        cursor: pointer;
        transition: color 0.2s;
    }
    .promo-toast .toast-close:hover { color: #e67e22; }
    `;
    document.head.appendChild(style);
} 