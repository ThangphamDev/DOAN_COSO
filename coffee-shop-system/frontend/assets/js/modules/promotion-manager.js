class PromotionManager {
    constructor() {
        this.apiUrl = 'http://localhost:8081/api/promotions';
        this.promotions = [];
        this.activePromotions = [];
        this.init();
    }

    getAuthToken() {
        return localStorage.getItem('token');
    }

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

    init() {
        const tabButtons = document.querySelectorAll('.tab-btn');
        tabButtons.forEach(button => {
            button.addEventListener('click', () => this.switchTab(button));
        });

        const addPromotionBtn = document.getElementById('addPromotionBtn');
        if (addPromotionBtn) {
            addPromotionBtn.addEventListener('click', () => this.openPromotionModal());
        }

        const promotionForm = document.getElementById('promotionForm');
        if (promotionForm) {
            promotionForm.addEventListener('submit', (e) => this.handlePromotionSubmit(e));
        }

        const promotionType = document.getElementById('promotionType');
        if (promotionType) {
            promotionType.addEventListener('change', () => this.handlePromotionTypeChange());
        }

        const searchPromotion = document.getElementById('searchPromotion');
        if (searchPromotion) {
            searchPromotion.addEventListener('input', (e) => this.handleSearch(e.target.value));
        }

        const closeBtn = document.querySelector('.modal .close-btn');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => this.closePromotionModal());
        }

        this.loadPromotions();
    }

    switchTab(selectedTab) {
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.remove('active');
        });

        selectedTab.classList.add('active');

        document.querySelectorAll('.tab-pane').forEach(pane => {
            pane.classList.remove('active');
        });

        const tabId = selectedTab.getAttribute('data-tab');
        document.getElementById(tabId).classList.add('active');
    }

    openPromotionModal(promotionId = null) {
        const modal = document.getElementById('promotionModal');
        const modalTitle = document.getElementById('modalPromotionTitle');
        const form = document.getElementById('promotionForm');

        if (promotionId) {
            modalTitle.textContent = 'Chỉnh sửa khuyến mãi';
            this.getPromotionById(promotionId).then(promotion => {
                if (promotion) {
                    this.fillPromotionForm(promotion);
                }
            });
        } else {
            modalTitle.textContent = 'Thêm khuyến mãi mới';
            form.reset();
            document.getElementById('promotionId').value = '';
        }

        modal.style.display = 'flex';
    }

    closePromotionModal() {
        const modal = document.getElementById('promotionModal');
        modal.style.display = 'none';
    }

    fillPromotionForm(promotion) {
        document.getElementById('promotionId').value = promotion.idPromotion;
        document.getElementById('promotionCode').value = promotion.code;
        document.getElementById('promotionName').value = promotion.namePromotion;
        
        const typeSelect = document.getElementById('promotionType');
        if (promotion.discountType === 'PERCENT') {
            typeSelect.value = 'percentage';
        } else if (promotion.discountType === 'FIXED') {
            typeSelect.value = 'fixed';
        }
        
        if (promotion.discountValue) {
            document.getElementById('promotionValue').value = promotion.discountValue;
        }
        
        if (promotion.minimumOrderAmount) {
            document.getElementById('minimumOrder').value = promotion.minimumOrderAmount;
        }
        
        if (promotion.startDate) {
            document.getElementById('startDate').value = this.formatDateForInput(promotion.startDate);
        }
        
        if (promotion.endDate) {
            document.getElementById('endDate').value = this.formatDateForInput(promotion.endDate);
        }
        
        this.handlePromotionTypeChange();
    }

   
    formatDateForInput(dateString) {
        const date = new Date(dateString);
        return date.toISOString().split('T')[0];
    }

    
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

    
    handlePromotionSubmit(event) {
        event.preventDefault();
        const formData = this.getPromotionFormData();
        
        if (formData.idPromotion) {
            this.updatePromotion(formData);
        } else {
            this.createPromotion(formData);
        }
    }

    
    getPromotionFormData() {
        const promotionId = document.getElementById('promotionId').value;
        const code = document.getElementById('promotionCode').value;
        const namePromotion = document.getElementById('promotionName').value;
        const typeSelect = document.getElementById('promotionType').value;
        const value = document.getElementById('promotionValue').value;
        const minimumOrderAmount = document.getElementById('minimumOrder').value;
        const startDate = document.getElementById('startDate').value;
        const endDate = document.getElementById('endDate').value;
        
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

    async loadPromotions() {
        try {
            this.showLoader();
            
            const allPromotions = await this.fetchAllPromotions();
            this.renderPromotionTable(allPromotions, 'activePromotionTableBody');
            
            const currentDate = new Date();
            const upcomingPromotions = allPromotions.filter(promo => {
                const startDate = new Date(promo.startDate);
                return startDate > currentDate;
            });
            this.renderPromotionTable(upcomingPromotions, 'upcomingPromotionTableBody');
            
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

    showNotification(message, type = 'success') {
        showPromoToast(message, type);
    }

    showLoader() {
        const loader = document.getElementById('loader');
        if (loader) {
            loader.style.display = 'flex';
        }
    }
    
    hideLoader() {
        const loader = document.getElementById('loader');
        if (loader) {
            loader.style.display = 'none';
        }
    }

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
            if (!promotion.isActive) {
                row.classList.add('promo-disabled');
            }
            
            const startDate = new Date(promotion.startDate).toLocaleDateString('vi-VN');
            const endDate = new Date(promotion.endDate).toLocaleDateString('vi-VN');
            
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

        if (!document.getElementById('promo-disabled-style')) {
            const style = document.createElement('style');
            style.id = 'promo-disabled-style';
            style.textContent = `.promo-disabled { opacity: 0.5; filter: grayscale(0.5); }`;
            document.head.appendChild(style);
        }
    }


    async handleSearch(searchText) {
        if (!searchText || searchText.trim() === '') {
            this.loadPromotions();
            return;
        }

        try {
            this.showLoader();
            const allPromotions = await this.fetchAllPromotions();
            
            const filtered = allPromotions.filter(promo => {
                const nameMatch = promo.namePromotion.toLowerCase().includes(searchText.toLowerCase());
                const codeMatch = promo.code.toLowerCase().includes(searchText.toLowerCase());
                return nameMatch || codeMatch;
            });
            
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

document.addEventListener('DOMContentLoaded', () => {
    if (document.querySelector('.promotion-management')) {
        window.promotionManager = new PromotionManager();
    }
});


function showPromoToast(message, type = 'success') {
    const oldToast = document.querySelector('.promo-toast');
    if (oldToast) oldToast.remove();

    const toast = document.createElement('div');
    toast.className = `promo-toast show ${type}`;
    toast.innerHTML = `
        <span>${message}</span>
        <button class="toast-close" title="Đóng">&times;</button>
    `;
    document.body.appendChild(toast);

    toast.querySelector('.toast-close').onclick = () => toast.remove();

    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}


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